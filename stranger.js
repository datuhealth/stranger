var fs = require('fs')
var path = require('path')
var mkdirp = require('mkdirp')
var del = require('del')
var gm = require('gm')
var webdriver = require('selenium-webdriver')

module.exports = Stranger

/**
 * Stranger - The entry point for the tool. Compare a set of images to previously generated set.
 * @example
 * stranger(mobileConfig, false)
 * @param {object} options - A javascript object configuring the output
 * @param {boolean} [generate] - Whether or not to generate the base set of images. Defaults to false
 * @param {function} [callback] - A function to run after stranger has run
 * @returns {void}
 */
function Stranger (options, generate, callback) {
  var self = this

  if (!options) {
    throw new Error('You need to pass a configuration object')
  }

  if (!(self instanceof Stranger)) {
    return new Stranger(options, generate, callback)
  }

  if (generate) {
    self.generateImages = true
  }

  self.config = options
  self.callback = callback

  self.setupSystem()

  self.config.tests.forEach(function (test, idx) {
    var filename = self.createFilename(test)

    if (!test.url) {
      return
    }

    self.createScreenshot(test.url, self.generateImages ? self.config.baseDir : self.config.compareDir, filename, test.local)
  })

  self.driver.quit().then(function (err) {
    if (err) {
      throw new Error(err)
    }

    // Report the number of images generated if the generate flag was used
    if (self.generateImages) {
      self.callback({
        imagesProcessed: 0,
        imagesGenerated: self.config.tests.length,
        imagesDir: self.config.baseDir
      })
    }

    // Otherwise, compare the images
    if (!self.generateImages) {
      del(self.config.diffDir + '**/*', function (err) {
        if (err) {
          throw new Error(err)
        }

        self.compareImages()
      })
    }
  })
}

/**
 * setupSystem - Run a bunchf of things, probably syncronously, to setup folders, defaults, etc.
 * @example
 * this.setupSystem()
 * @private
 * @returns {void}
 */
Stranger.prototype.setupSystem = function () {
  var self = this

  self.checkConfig()

  if (typeof self.generateImages === 'undefined') {
    self.generateImages = false
  }

  self.diffCount = 0
  self.noMatchCount = 0
  self.imagesProcessed = 0

  self.driver = new webdriver.Builder()
    .forBrowser(self.config.browser || 'firefox')
    .setChromeOptions(self.config.chromeOptions)
    .setFirefoxOptions(self.config.firefoxOptions)
    .setIeOptions(self.config.ieOptions)
    .setOperaOptions(self.config.operaOptions)
    .setSafariOptions(self.config.safariOptions)
    .build()

  // Create the folder for master images
  mkdirp.sync(self.config.baseDir)

  // Create the folder for the comparison images
  mkdirp.sync(self.config.compareDir)

  // Create the folder for the diff images
  mkdirp.sync(self.config.diffDir)

  // Check if master images have been generated and error if none have been created
  // TODO - Think about just running generate quickly then continuing instead of erroring
  if (!self.checkForFiles(self.config.baseDir) && !self.generateImages) {
    throw new Error('\n× You don\'t have any reference images created yet.\nRerun stranger with the --generate flag')
  }

  // Remove any previously generated images
  del.sync((self.generateImages ? self.config.baseDir : self.config.compareDir) + '**/*')

  self.driver.manage().window().setSize(self.config.browserOptions.width, self.config.browserOptions.height)
}

/**
 * checkConfig - Check a couple of properties in the config to set us up the urls.
 * @example
 * this.checkConfig()
 * @private
 * @returns {void}
 */
Stranger.prototype.checkConfig = function () {
  var self = this

  if (!self.config.browserOptions) {
    self.config.browserOptions = {
      width: 1024,
      height: 768
    }
  }

  if (!self.config.browserOptions.width) {
    self.config.browserOptions.width = 1024
  }

  if (!self.config.browserOptions.height) {
    self.config.browserOptions.height = 768
  }

  if (self.config.baseDir.charAt(self.config.baseDir.length - 1) !== '/') {
    self.config.baseDir = self.config.baseDir + '/'
  }

  if (self.config.compareDir.charAt(self.config.compareDir.length - 1) !== '/') {
    self.config.compareDir = self.config.compareDir + '/'
  }

  if (self.config.diffDir.charAt(self.config.diffDir.length - 1) !== '/') {
    self.config.diffDir = self.config.diffDir + '/'
  }
}

/**
 * createScreenshot - Given some basic info, open the url and take a screenshot.
 * @example
 * this.createScreenshot('localhost/home', './test/export', 'home.png')
 * @private
 * @param {string} url - The url that the browser should be pointed to
 * @param {string} path - The directory path that the image should be saved to
 * @param {string} filename - The filename for the screenshot
 * @returns {void}
 */
Stranger.prototype.createScreenshot = function (url, imgPath, filename, local) {
  var self = this
  var screenshot

  if (local) {
    url = 'file://' + path.join(__dirname, url)
  }

  self.driver.get(url)
  screenshot = self.driver.takeScreenshot()

  screenshot.then(function (png) {
    // Convert it to a buffer right quick
    var buf = new Buffer(png, 'base64')

    fs.writeFileSync(imgPath + filename, buf)
  }, function (err) {
    throw new Error(err)
  })
}

/**
 * chechForFiles - Quickly check if a directory is empty or not
 * @example
 * this.checkForFiles('./test/export')
 * @private
 * @param {string} path - The directory path to check
 * @returns {boolean} - True if there are files, false if the directory is empty
 */
Stranger.prototype.checkForFiles = function (path) {
  var files = fs.readdirSync(path)

  if (files && files.length) {
    return true
  } else {
    return false
  }
}

/**
 * createFilename - Given a test object, cerate a filename based on the name given or the url
 * @example
 * this.createFilename({ url: 'localhost/home', name: 'home' })
 * @private
 * @param {object} test - The test object. Needs to contain the url. The name is optional.
 * @returns {string} - The best guess for a filename. Doesn't guaruntee uniqueness.
 */
Stranger.prototype.createFilename = function (test) {
  var filename = test.name || test.url.split('/')[ test.url.split('/').length - 1] || 'index'

  return filename + '.png'
}

/**
 * compareImages - Begin the process of comparing a set of images to another.
 * @example
 * this.compareImages()
 * @private
 * @returns {void}
 */
Stranger.prototype.compareImages = function () {
  var self = this
  var mismatchedImages = []
  var diffedImages = []
  var similarImages = []

  self.config.tests.forEach(function (test, idx) {
    var filename = self.createFilename(test)

    fs.readFile(self.config.baseDir + filename, function (err, buf) {
      if (err) {
        self.imagesProcessed++
        mismatchedImages.push(filename)
        return self.noMatchCount++
      }

      gm.compare(self.config.compareDir + filename, self.config.baseDir + filename, {
        file: self.config.diffDir + filename,
        highlightColor: 'red',
        tolerance: 0.0,
        highlightStyle: 'assign'
      }, function (err, imagesAreSame) {
        if (err) {
          throw new Error(err)
        }

        if (!imagesAreSame) {
          self.diffCount++
          diffedImages.push(filename)
        } else {
          fs.unlink(self.config.diffDir + filename)
          similarImages.push(filename)
        }

        self.imagesProcessed++

        if (self.imagesProcessed === self.config.tests.length) {
          self.callback({
            imagesGenerated: 0,
            imagesProcessed: self.imagesProcessed,
            imagesDir: self.config.compareDir,
            noMatchCount: self.noMatchCount,
            similarImages: similarImages,
            diffedImages: diffedImages,
            mismatchedImages: mismatchedImages,
            diffCount: self.diffCount,
            diffDir: self.config.diffDir
          })
        }
      })
    })
  })
}
