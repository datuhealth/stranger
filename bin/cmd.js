#!/usr/bin/env node
var fs = require('fs')
var subarg = require('subarg')
var args = subarg(process.argv.slice(2))
var stranger = require('../stranger')

// Print help documentation with the -h or --help flags
if (args.help || args.h) {
  if (args.h === 'config' || args.help === 'config') {
    return fs.createReadStream(__dirname + '/configOptions.txt')
      .pipe(process.stdout)
      .on('close', function () {
        process.exit(0)
      })
  } else {
    return fs.createReadStream(__dirname + '/usage.txt')
      .pipe(process.stdout)
      .on('close', function () {
        process.exit(0)
      })
  }
}

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

    stranger(config, (args.generate || args.g))
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
})
