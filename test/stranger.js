'use strict'

var test = require('tape')
var del = require('del')
var stranger = require('../stranger')
var basicConfig = require('./lib/basic.json')
var diffableConfig = require('./lib/diffable.json')
var mismatchConfig = require('./lib/mismatch.json')

test('The tool fails if no config is provided', function (t) {
  t.throws(function () {
    stranger(null, false)
  }, 'It throws without a config')
  t.end()
})

test('The tool fails if no base images have been generated', function (t) {
  del('./test/img/**/*.png').then(function () {
    t.throws(function () {
      stranger(basicConfig, false)
    }, 'It throws when no base images exist')
    t.end()
  })
})

test('The tool generates the base images', function (t) {
  del('./test/img/**/*.png').then(function () {
    stranger(basicConfig, true, function (results) {
      t.ok(results, 'It send the results through')
      t.equal(typeof results, 'object', 'Results is an object')
      t.equal(results.imagesGenerated, 2, 'Two base images were generated')
      t.equal(results.imagesProcessed, 0, 'No images were processed')
      t.equal(results.imagesDir, './test/img/desktop/master/', 'It provides the image directory')
      t.end()
    })
  })
})

test('The tool compares similar images', function (t) {
  del('./test/img/**/*.png').then(function () {
    stranger(basicConfig, true, function () {
      stranger(basicConfig, false, function (results) {
        t.ok(results, 'It send the results through')
        t.equal(typeof results, 'object', 'Results is an object')
        t.equal(results.imagesGenerated, 0, 'No images were generated')
        t.equal(results.imagesProcessed, 2, 'Two images were processed')
        t.equal(results.imagesDir, './test/img/desktop/branch/', 'It provides the image directory')
        t.equal(results.diffDir, './test/img/desktop/diff/', 'It provides the diff directory')
        t.equal(results.noMatchCount, 0, 'All images accounted for')
        t.equal(results.similarImages.length, 2, 'It has both similar image filenames')
        t.equal(results.diffedImages.length, 0, 'It has no diffed image filenames')
        t.equal(results.mismatchedImages.length, 0, 'No mismatched images provided')
        t.equal(results.diffCount, 0, 'No diffs found')
        t.end()
      })
    })
  })
})

test('The tool finds a diff', function (t) {
  del('./test/img/**/*.png').then(function () {
    stranger(basicConfig, true, function () {
      stranger(diffableConfig, false, function (results) {
        t.ok(results, 'It send the results through')
        t.equal(typeof results, 'object', 'Results is an object')
        t.equal(results.imagesGenerated, 0, 'No images were generated')
        t.equal(results.imagesProcessed, 2, 'Two images were processed')
        t.equal(results.imagesDir, './test/img/desktop/branch/', 'It provides the image directory')
        t.equal(results.diffDir, './test/img/desktop/diff/', 'It provides the diff directory')
        t.equal(results.noMatchCount, 0, 'All images accounted for')
        t.equal(results.similarImages.length, 1, 'It has similar image\'s filename')
        t.equal(results.diffedImages.length, 1, 'It has the diffed image\'s filename')
        t.equal(results.mismatchedImages.length, 0, 'No mismatched images provided')
        t.equal(results.diffCount, 1, 'One diff found')
        t.end()
      })
    })
  })
})

test('The tool finds a diff', function (t) {
  del('./test/img/**/*.png').then(function () {
    stranger(basicConfig, true, function () {
      stranger(mismatchConfig, false, function (results) {
        t.ok(results, 'It send the results through')
        t.equal(typeof results, 'object', 'Results is an object')
        t.equal(results.imagesGenerated, 0, 'No images were generated')
        t.equal(results.imagesProcessed, 3, 'Two images were processed')
        t.equal(results.imagesDir, './test/img/desktop/branch/', 'It provides the image directory')
        t.equal(results.diffDir, './test/img/desktop/diff/', 'It provides the diff directory')
        t.equal(results.noMatchCount, 1, 'One comparison image without a base image')
        t.equal(results.similarImages.length, 2, 'It has both similar image filenames')
        t.equal(results.diffedImages.length, 0, 'It has no diffed image filenames')
        t.equal(results.mismatchedImages.length, 1, 'One mismatched image provided')
        t.equal(results.mismatchedImages[0], 'Left.png', 'It has the filename of the mismatched image')
        t.equal(results.diffCount, 0, 'No diffs found')
        t.end()
      })
    })
  })
})
