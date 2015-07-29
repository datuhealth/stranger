stranger
========

[![Build Status](https://travis-ci.org/datuhealth/stranger.svg?branch=master)](https://travis-ci.org/datuhealth/stranger)

stranger is a visual testing framework to catch and report changes to the rendered layout of your pages. It runs with node.js and selenium.

Inspired by [@jessicard](https://twitter.com/jessicard)'s RailsConf [talk](http://confreaks.tv/videos/railsconf2015-implementing-a-visual-css-testing-framework) on implementing a CSS testing framework, this is a somewhat similar solution but for node. You can run stranger to compare the current state of your site against a previously generated set of images. It uses configuration files, so you can run tests on different screen sizes, different browsers, different urls, etc.

For better or for worse (we think better), stranger tries to stay as unopinionated as possible. It has a nice set of defaults which can easily be overwritten. As it's able to be used through the command line or programmatically, it should be easy to use when running tests. It should also be pretty extensible.

## In this readme

[installation](#installation)  
[example](#example)  
[cli](#cli)  
[configuration](#configuration)  
[api](#api)  
[gotchas](#gotchas)  
[contributing](#contributing)  
[license](LICENSE.md)  
[todo](#todo)

# installation

```shell
npm install -g stranger
```

# example

Begin by creating a configuration file. It should be valid JSON and contain the allowed [options](#configuration)

```javascript
{
  "baseDir": "./test/desktop/master",
  "compareDir": "./test/desktop/branch",
  "diffDir": "./test/desktop/diff",
  "browser": "firefox",
  "tests": [
    {
      "url": "http://localhost/home",
      "name": "Home"
    },
    {
      "url": "http://localhost/about",
    },
    {
      "url": "./static/500.html",
      "local": true,
      "name": "500-page"
    }
  ]
}
```

Then, from the command line
```shell
# To generate the initial images
stranger --generate --config ./basic.json

# To compare a set of images
stranger --config ./basic.json
```

Or programmatically
```javascript
var stranger = require('stranger')
var config = {...}

stranger(config, true, function (results) {
  // The results var is an object with a lot of cool deets. Check it out!
})
```

# cli

```
Usage: stranger {OPTIONS}

Options:

  --config, -c  The configuration file to use.
                For an example config, type `stranger --help config`

--generate, -g  Whether to generate the base files or not.

    --help, -h  Show this message
```

# configuration

```
Configuration options:

              baseDir: string  The path for the base images to be placed

           compareDir: string  The path for the comparison images to be placed

              diffDir: string  The path for any diff images to be placed

            [browser]: string  The browser to test with. Can be firefox,
                               chrome, ie, safari or opera. Defaults to firefox

     [browserOptions]: object  The options to configure the browser window

 browserOptions.width: number  The width of the browser. Defaults to 1024

browserOptions.height: number  The height of the browser. Defaults to 1024

      [chromeOptions]: object  The chrome options for selenium.
                               See: https://goo.gl/ZoCztN

     [firefoxOptions]: object  The firefox options for selenium.
                               See: https://goo.gl/74oFrD

          [ieOptions]: object  The ie options for selenium
                               See: https://goo.gl/3zmhPW

       [operaOptions]: object  The opera options for selenium
                               See: https://goo.gl/QKQHx5

      [safariOptions]: object  The safari options for selenium
                               See: https://goo.gl/DRK1oz

                tests: array   The test objects that stranger will
                               test against

             test.url: string  The url to point the browser to

          [test.name]: string  The filename to use for the screenshot. Optional

```

# api

### **Stranger(config, generate, callback)**
**config**  
A json file that tells stranger how to run and where to place images

**generate**  
A boolean denoting whether or not to generate the base images

**callback**  
A function to run once stranger has finished. It passes a results object with a lot of useful details

# gotchas

* You must have imagemagick installed. You can grab it from [brew](https://brew.sh) if you're on os x.
* The use of browsers aside from firefox require the webdriver. Check [brew](https://brew.sh) for the chrome driver, [selenium drivers](https://selenium-release.storage.googleapis.com/index.html) for the safari driver, and [opera releases](https://github.com/operasoftware/operachromiumdriver/releases) for the opera driver.
* As of Safari v8, Chrome v43, Opera v27, Firefox is the only browser that allows full page screenshots. Keep that in mind.
* If using safari, make sure your URL specifies the protocol (file://, https://, etc), otherwise, safari will timeout.
* If multiple browser support is needed, use different configs.
* Comparing images created from different monitors can cause diffs.
* As of right now, it can only capture static pages. No hover states or anything like that!

# contributing

This project follows a couple of different standards.

* For git, we're using the [github flow](https://guides.github.com/introduction/flow/index.html) model.
* For writing javascript we're using the [js-standard](https://github.com/feross/standard) styleguide from [feross](https://github.com/feross).

When making contributions, add passing tests along with your PR.

# license

[Apache 2.0](LICENSE.md)

# todo

* Add multiple support for browsers within the same execution (can be done with multiple configs)
* Add multiple sizes support for browsers to test against
* Add support to define a prep function to run before it takes the screenshot (click a button, fill in a form, etc)
