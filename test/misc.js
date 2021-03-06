var fs = require('fs')
var path = require('path')
var test = require('tape')
var rimraf = require('rimraf')
var tmpDir = require('temporary-directory')

var DWebX = require('..')
var fixtures = path.join(__dirname, 'fixtures')

test('misc: clean old test', function (t) {
  rimraf(path.join(fixtures, '.dwebx'), function () {
    t.end()
  })
})

test('misc: empty dwebx folder ok', function (t) {
  fs.mkdir(path.join(fixtures, '.dwebx'), function () {
    DWebX(fixtures, function (err, dwebx) {
      t.error(err, 'no error')
      rimraf.sync(path.join(fixtures, '.dwebx'))
      t.end()
    })
  })
})

test('misc: existing invalid dwebx folder', function (t) {
  fs.mkdir(path.join(fixtures, '.dwebx'), function () {
    fs.writeFile(path.join(fixtures, '.dwebx', '0101.db'), '', function () {
      DWebX(fixtures, function (err, dwebx) {
        t.ok(err, 'errors')
        rimraf.sync(path.join(fixtures, '.dwebx'))
        t.end()
      })
    })
  })
})

test('misc: non existing invalid dwebx path', function (t) {
  t.throws(function () {
    DWebX('/non/existing/folder/', function () {})
  })
  t.end()
})

test('misc: open error', function (t) {
  t.skip('TODO: lock file')
  t.end()

  // DWebX(process.cwd(), function (err, datA) {
  //   t.error(err)
  //   DWebX(process.cwd(), function (err, datB) {
  //     t.ok(err, 'second open errors')
  //     datA.close(function () {
  //       rimraf(path.join(process.cwd(), '.dwebx'), function () {
  //         t.end()
  //       })
  //     })
  //   })
  // })
})

test('misc: expose .key', function (t) {
  var key = Buffer.alloc(32)
  DWebX(process.cwd(), { key: key, temp: true }, function (err, dwebx) {
    t.error(err, 'error')
    t.deepEqual(dwebx.key, key)

    DWebX(fixtures, { temp: true }, function (err, dwebx) {
      t.error(err, 'error')
      t.notDeepEqual(dwebx.key, key)
      dwebx.close(function (err) {
        t.error(err, 'error')
        t.end()
      })
    })
  })
})

test('misc: expose .writable', function (t) {
  tmpDir(function (err, downDir, cleanup) {
    t.error(err, 'error')
    DWebX(fixtures, function (err, shareDat) {
      t.error(err, 'error')
      t.ok(shareDat.writable, 'is writable')
      shareDat.joinNetwork()

      DWebX(downDir, { key: shareDat.key }, function (err, downDat) {
        t.error(err, 'error')
        t.notOk(downDat.writable, 'not writable')

        shareDat.close(function (err) {
          t.error(err, 'error')
          downDat.close(function (err) {
            t.error(err, 'error')
            cleanup(function (err) {
              rimraf.sync(path.join(fixtures, '.dwebx'))
              t.error(err, 'error')
              t.end()
            })
          })
        })
      })
    })
  })
})

test('misc: expose swarm.connected', function (t) {
  tmpDir(function (err, downDir, cleanup) {
    t.error(err, 'error')
    var downDat
    DWebX(fixtures, { temp: true }, function (err, shareDat) {
      t.error(err, 'error')

      t.doesNotThrow(shareDat.leave, 'leave before join should be noop')

      var network = shareDat.joinNetwork()
      t.equal(network.connected, 0, '0 peers')

      network.once('connection', function () {
        t.ok(network.connected >= 1, '>=1 peer')
        shareDat.leave()
        t.skip(downDat.network.connected, 0, '0 peers') // TODO: Fix connection count
        downDat.close(function (err) {
          t.error(err, 'error')
          shareDat.close(function (err) {
            t.error(err, 'error')
            cleanup(function (err) {
              t.error(err, 'error')
              t.end()
            })
          })
        })
      })

      DWebX(downDir, { key: shareDat.key, temp: true }, function (err, dwebx) {
        t.error(err, 'error')
        dwebx.joinNetwork()
        downDat = dwebx
      })
    })
  })
})

test('misc: close twice errors', function (t) {
  DWebX(fixtures, { temp: true }, function (err, dwebx) {
    t.error(err, 'error')
    dwebx.close(function (err) {
      t.error(err, 'error')
      dwebx.close(function (err) {
        t.ok(err, 'has close error second time')
        t.end()
      })
    })
  })
})

test('misc: close twice sync errors', function (t) {
  DWebX(fixtures, { temp: true }, function (err, dwebx) {
    t.error(err, 'error')
    dwebx.close(function (err) {
      t.error(err, 'error')
      t.end()
    })
    dwebx.close(function (err) {
      t.ok(err, 'has close error second time')
    })
  })
})

test('misc: create key and open with different key', function (t) {
  t.skip('TODO')
  t.end()
  // TODO: ddrive needs to forward ddatabase metadta errors
  // https://github.com/distributedweb/ddrive/blob/master/index.js#L37

  // rimraf.sync(path.join(fixtures, '.dwebx'))
  // DWebX(fixtures, function (err, dwebx) {
  //   t.error(err, 'error')
  //   dwebx.close(function (err) {
  //     t.error(err, 'error')
  //     DWebX(fixtures, {key: '6161616161616161616161616161616161616161616161616161616161616161'}, function (err, dwebx) {
  //       t.same(err.message, 'Another ddatabase is stored here', 'has error')
  //       rimraf.sync(path.join(fixtures, '.dwebx'))
  //       t.end()
  //     })
  //   })
  // })
})

test('misc: make dwebx with random key and open again', function (t) {
  tmpDir(function (err, downDir, cleanup) {
    t.error(err, 'error')
    var key = '6161616161616161616161616161616161616161616161616161616161616161'
    DWebX(downDir, { key: key }, function (err, dwebx) {
      t.error(err, 'error')
      t.ok(dwebx, 'has dwebx')
      dwebx.close(function (err) {
        t.error(err, 'error')
        DWebX(downDir, { key: key }, function (err, dwebx) {
          t.error(err, 'error')
          t.ok(dwebx, 'has dwebx')
          t.end()
        })
      })
    })
  })
})

test('misc: close order', function (t) {
  tmpDir(function (err, downDir, cleanup) {
    t.error(err, 'opened tmp dir')
    DWebX(downDir, { watch: true }, function (err, dwebx) {
      t.error(err, 'dwebx properly opened')
      dwebx.importFiles(function (err) {
        t.error(err, 'started importing files')
        t.ok(dwebx.importer, 'importer exists')
        dwebx.joinNetwork({ dht: false }, function (err) {
          t.error(err, 'joined network')
          var order = []
          dwebx.network.on('error', function (err) {
            t.error(err)
          })
          dwebx.network.on('close', function () {
            order.push('network')
          })
          dwebx.importer.on('destroy', function () {
            order.push('importer')
          })
          dwebx.archive.metadata.on('close', function () {
            order.push('metadata')
          })
          dwebx.archive.content.on('close', function () {
            order.push('content')
            t.deepEquals(order, ['network', 'importer', 'metadata', 'content'], 'Close order as expected')
            t.end()
          })
          dwebx.close()
        })
      })
    })
  })
})
