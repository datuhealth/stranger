'use strict'

var fs = require('fs')
var spawn = require('child_process').spawn
var test = require('tape')
var del = require('del')
var helpText = fs.readFileSync('./bin/usage.txt', { encoding: 'utf8' })
var configText = fs.readFileSync('./bin/configOptions.txt', { encoding: 'utf8' })

test('The default help text is generated', function (t) {
  var shorthand = spawn('./bin/cmd.js', [
    '-h'
  ], {
    cwd: process.cwd()
  })
  var longhand = spawn('./bin/cmd.js', [
    '--help'
  ], {
    cwd: process.cwd()
  })

  shorthand.stdout.on('data', function (stdout) {
    t.ok(stdout, 'The text was printed to stdout with the -h flag')
    t.equal(stdout.toString(), helpText, 'The help text is from the usage.txt file')
  })

  shorthand.stderr.on('data', function (stderr) {
    t.notOk(stderr.toString(), 'Nothing got printed to stderr')
  })

  shorthand.on('close', function (code) {
    t.equal(code, 0, 'The process exited with a 0 status')
  })

  longhand.stdout.on('data', function (stdout) {
    t.ok(stdout, 'The text was printed to stdout with the -h flag')
    t.equal(stdout.toString(), helpText, 'The help text is from the usage.txt file')
  })

  longhand.on('close', function () {
    t.end()
  })
})

test('The config help text is generated', function (t) {
  var stranger = spawn('./bin/cmd.js', [
    '-h',
    'config'
  ], {
    cwd: process.cwd()
  })

  stranger.stdout.on('data', function (stdout) {
    t.ok(stdout, 'The config text was printed to stdout')
    t.equal(stdout.toString(), configText, 'The config text is from the configOptions.txt file')
  })

  stranger.stderr.on('data', function (stderr) {
    t.notOk(stderr, 'Nothing got printed to stderr')
  })

  stranger.on('close', function (code) {
    t.equal(code, 0, 'The process exited with a 0 status')
    t.end()
  })
})

test('The tool fails if no config path is provided', function (t) {
  var noConfigText = 'You need to pass a configuration object\n'
  var stranger = spawn('./bin/cmd.js', {
    cwd: process.cwd()
  })

  stranger.stdout.on('data', function (stdout) {
    t.notOk(stdout, 'The error text wasn\'t printed to stdout')
  })

  stranger.stderr.on('data', function (stderr) {
    t.equal(stderr.toString(), noConfigText, 'The error message is nice')
  })

  stranger.on('close', function (code) {
    t.equal(code, 1, 'It exited with a 1 status')
    t.end()
  })
})

test('The tool fails if no base images have been generated', function (t) {
  del('./test/img/**/*.png', function (err) {
    var stranger = spawn('./bin/cmd.js', [
      '--config',
      './test/lib/basic.json'
    ], {
      cwd: process.cwd()
    })

    if (err) {
      t.fail(err)
    }

    stranger.stdout.on('data', function (stdout) {
      t.notOk(stdout, 'The error text wasn\'t printed to stdout')
    })

    stranger.stderr.on('data', function (stderr) {
      t.ok(stderr.toString(), 'The error message was printed')
    })

    stranger.on('close', function (code) {
      t.equal(code, 1, 'It exited with a 1 status')
      t.end()
    })
  })
})

test('The tool generates a diff', function (t) {
  del('./test/img/deskop/**/*', function (err) {
    var stranger = spawn('./bin/cmd.js', [
      '--config',
      './test/lib/basic.json',
      '--generate'
    ], {
      cwd: process.cwd()
    })

    if (err) {
      t.fail(err)
    }

    stranger.on('close', function (code) {
      t.equal(code, 0, 'It exited with a 0 status')

      var stranger2 = spawn('./bin/cmd.js', [
        '--config',
        './test/lib/diffable.json'
      ], {
        cwd: process.cwd()
      })

      if (err) {
        t.fail(err)
      }

      stranger2.stdout.on('data', function (stdout) {
        t.ok(stdout.toString(), 'The good image\'s filename was printed')
      })

      stranger2.stderr.on('data', function (stderr) {
        t.ok(stderr.toString(), 'There were errors reported')
      })

      stranger2.on('close', function (code) {
        t.equal(code, 1, 'It exited with a 1 status')
        t.end()
      })
    })
  })
})

test('The tool doesn\'t generate a diff', function (t) {
  del('./test/img/deskop/**/*', function (err) {
    var stranger = spawn('./bin/cmd.js', [
      '--config',
      './test/lib/basic.json',
      '--generate'
    ], {
      cwd: process.cwd()
    })

    if (err) {
      t.fail(err)
    }

    stranger.on('close', function (code) {
      t.equal(code, 0, 'It exited with a 0 status')

      var stranger2 = spawn('./bin/cmd.js', [
        '--config',
        './test/lib/basic.json'
      ], {
        cwd: process.cwd()
      })

      if (err) {
        t.fail(err)
      }

      stranger2.stdout.on('data', function (stdout) {
        t.ok(stdout.toString(), 'The diff message message was generated')
      })

      stranger2.stderr.on('data', function (stderr) {
        t.notOk(stderr, 'There were no errors')
      })

      stranger2.on('close', function (code) {
        t.equal(code, 0, 'It exited with a 0 status')
        t.end()
      })
    })
  })
})

test('The tool warns the user if there\'s a mismatch', function (t) {
  del('./test/img/deskop/**/*', function (err) {
    var stranger = spawn('./bin/cmd.js', [
      '--config',
      './test/lib/basic.json',
      '--generate'
    ], {
      cwd: process.cwd()
    })

    if (err) {
      t.fail(err)
    }

    stranger.on('close', function (code) {
      t.equal(code, 0, 'It exited with a 0 status')

      var stranger2 = spawn('./bin/cmd.js', [
        '--config',
        './test/lib/mismatch.json'
      ], {
        cwd: process.cwd()
      })

      if (err) {
        t.fail(err)
      }

      stranger2.stdout.on('data', function (stdout) {
        t.ok(stdout.toString(), 'The images without a diff were printed')
      })

      stranger2.stderr.on('data', function (stderr) {
        t.ok(stderr.toString(), 'There were some errors')
      })

      stranger2.on('close', function (code) {
        t.equal(code, 0, 'It exited with a 0 status')
        t.end()
      })
    })
  })
})

test('The tool makes the filename match the URL or the name', function (t) {
  del('./test/img/deskop/**/*', function (err) {
    spawn('./bin/cmd.js', [
      '--config',
      './test/lib/basic.json',
      '--generate'
    ], {
      cwd: process.cwd()
    })

    if (err) {
      t.fail(err)
    }

    fs.readdir('./test/img/desktop/master', function (err, paths) {
      if (err) {
        t.fail(err)
      }

      t.equal(paths.length, 2, 'Two images were generated')
      t.equal(paths[0], 'Home.png', 'The first image is called Home.png')
      t.equal(paths[1], 'dynamic.html.png', 'The second image is called dynamic.html.png')
      t.end()
    })
  })
})
