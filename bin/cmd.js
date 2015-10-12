#!/usr/bin/env node
var fs = require('fs')
var subarg = require('subarg')
var chalk = require('chalk')
var args = subarg(process.argv.slice(2))
var stranger = require('../stranger')

function printFilenames (results) {
  results.similarImages.forEach(function (filename) {
    console.log(chalk.green('√ ' + filename))
  })

  results.diffedImages.forEach(function (filename) {
    console.error(chalk.red('× ' + filename))
  })

  results.mismatchedImages.forEach(function (filename) {
    console.warn(chalk.yellow('! ' + filename))
  })

  console.log('')
}

// Print help documentation with the -h or --help flags
if (args.help || args.h) {
  if (args.h === 'config' || args.help === 'config') {
    fs.createReadStream(__dirname + '/configOptions.txt')
      .pipe(process.stdout)
      .on('close', function () {
        process.exit(0)
      })
  } else {
    fs.createReadStream(__dirname + '/usage.txt')
      .pipe(process.stdout)
      .on('close', function () {
        process.exit(0)
      })
  }
} else {
  if (!(args.c || args.config)) {
    console.error('You need to pass a configuration object')
    process.exit(1)
  }

  fs.readFile(args.config || args.c, function (err, data) {
    if (err) {
      console.error(err)
      process.exit(1)
    }

    try {
      var config = JSON.parse(data)

      stranger(config, (args.generate || args.g), function (results) {
        console.log('')

        if (!results.imagesProcessed && results.imagesGenerated) {
          return console.log(chalk.green(results.imagesGenerated + ' ' + (results.imagesGenerated === 1 ? 'screenshot' : 'screenshots') + ' created and placed in ' + results.imagesDir))
        }

        printFilenames(results)

        if (!results.noMatchCount && !results.diffCount) {
          return console.log(chalk.green('No diffs found!'))
        }

        if (results.noMatchCount) {
          console.warn(chalk.yellow('There ' + (results.noMatchCount === 1 ? 'was' : 'were') + ' ' + results.noMatchCount + ' ' + (results.noMatchCount === 1 ? 'image' : 'images') + ' that didn\'t have a reference image.\n') + 'It\'s recommended that you re-run stranger with the ' + chalk.yellow('--generate') + ' flag.')
        }

        if (results.diffCount) {
          console.error(chalk.yellow(results.diffCount + ' ' + (results.diffCount === 1 ? 'diff' : 'diffs') + ' found! Check out the ' + results.diffDir + ' directory for the ' + (results.diffCount === 1 ? 'diff' : 'diffs') + '.'))

          process.exit(1)
        }
      })
    } catch (err) {
      console.error(err)
      process.exit(1)
    }
  })
}
