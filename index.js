var assert = require('assert')
var fs = require('fs')
var path = require('path')
var ddrive = require('ddrive')
var resolveDatLink = require('dwebx-link-resolve')
var debug = require('debug')('dwebx-node')
var datStore = require('./lib/storage')
var DWebX = require('./dwebx')

module.exports = createDat

/**
 * Create a DWebX instance, archive storage, and ready the archive.
 * @param {string|object} dirOrStorage - Directory or ddrive storage object.
 * @param {object} [opts] - DWebX-node options and any ddrive init options.
 * @param {String|Buffer} [opts.key] - DDrive key
 * @param {Boolean} [opts.createIfMissing = true] - Create storage if it does not exit.
 * @param {Boolean} [opts.errorIfExists = false] - Error if storage exists.
 * @param {Boolean} [opts.temp = false] - Use random-access-memory for temporary storage
 * @param {function(err, dwebx)} cb - callback that returns `DWebX` instance
 * @see defaultStorage for storage information
 */
function createDat (dirOrStorage, opts, cb) {
  if (!cb) {
    cb = opts
    opts = {}
  }
  assert.ok(dirOrStorage, 'dwebx-node: directory or storage required')
  assert.strictEqual(typeof opts, 'object', 'dwebx-node: opts should be type object')
  assert.strictEqual(typeof cb, 'function', 'dwebx-node: callback required')

  var archive
  var key = opts.key
  var dir = (typeof dirOrStorage === 'string') ? dirOrStorage : null
  var storage = datStore(dirOrStorage, opts)
  var createIfMissing = !(opts.createIfMissing === false)
  var errorIfExists = opts.errorIfExists || false
  var hasDat = false
  opts = Object.assign({
    // TODO: make sure opts.dir is a directory, not file
    dir: dir,
    latest: true
  }, opts)

  if (!opts.dir) return create() // TODO: check other storage
  checkIfExists()

  /**
   * Check if archive storage folder exists.
   * @private
   */
  function checkIfExists () {
    // Create after we check for pre-sleep .dwebx stuff
    var createAfterValid = (createIfMissing && !errorIfExists)

    var missingError = new Error('DWebX storage does not exist.')
    missingError.name = 'MissingError'
    var existsError = new Error('DWebX storage already exists.')
    existsError.name = 'ExistsError'
    var oldError = new Error('DWebX folder contains incompatible metadata. Please remove your metadata (rm -rf .dwebx).')
    oldError.name = 'IncompatibleError'

    fs.readdir(path.join(opts.dir, '.dwebx'), function (err, files) {
      // TODO: omg please make this less confusing.
      var noDat = !!(err || !files.length)
      hasDat = !noDat
      var validSleep = (files && files.length && files.indexOf('metadata.key') > -1)
      var badDat = !(noDat || validSleep)

      if ((noDat || validSleep) && createAfterValid) return create()
      else if (badDat) return cb(oldError)

      if (err && !createIfMissing) return cb(missingError)
      else if (!err && errorIfExists) return cb(existsError)

      return create()
    })
  }

  /**
   * Create the archive and call `archive.ready()` before callback.
   * Set `archive.resumed` if archive has a content feed.
   * @private
   */
  function create () {
    if (dir && !opts.temp && !key && (opts.indexing !== false)) {
      // Only set opts.indexing if storage is dwebx-storage
      // TODO: this should be an import option instead, https://github.com/distributedweb/ddrive/issues/160
      opts.indexing = true
    }
    if (!key) return createArchive()

    resolveDatLink(key, function (err, resolvedKey) {
      if (err) return cb(err)
      key = resolvedKey
      createArchive()
    })

    function createArchive () {
      archive = ddrive(storage, key, opts)
      archive.on('error', cb)
      archive.ready(function () {
        debug('archive ready. version:', archive.version)
        if (hasDat || (archive.metadata.has(0) && archive.version)) {
          archive.resumed = true
        } else {
          archive.resumed = false
        }
        archive.removeListener('error', cb)

        cb(null, DWebX(archive, opts))
      })
    }
  }
}
