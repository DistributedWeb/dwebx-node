var fs = require('fs')
var path = require('path')
var test = require('tape')
var rimraf = require('rimraf')
var tmpDir = require('temporary-directory')
var helpers = require('./helpers')

var DWebX = require('..')

// os x adds this if you view the fixtures in finder and breaks the file count assertions
try { fs.unlinkSync(path.join(__dirname, 'fixtures', '.DS_Store')) } catch (e) { /* ignore error */ }

var fixtures = path.join(__dirname, 'fixtures')

test('download: Download with default opts', function (t) {
  shareFixtures(function (err, shareKey, closeShare) {
    t.error(err, 'error')

    tmpDir(function (err, downDir, cleanup) {
      t.error(err, 'error')

      DWebX(downDir, { key: shareKey }, function (err, dwebx) {
        t.error(err, 'error')
        t.ok(dwebx, 'callsback with dwebx object')
        t.ok(dwebx.key, 'has key')
        t.ok(dwebx.archive, 'has archive')
        t.notOk(dwebx.writable, 'archive not writable')

        var stats = dwebx.trackStats()
        var network = dwebx.joinNetwork(function () {
          t.pass('joinNetwork calls back okay')
        })
        network.once('connection', function () {
          t.pass('connects via network')
        })
        var archive = dwebx.archive
        archive.once('content', function () {
          t.pass('gets content')
          archive.content.on('sync', done)
        })

        function done () {
          var st = stats.get()
          t.ok(st.version === archive.version, 'stats version correct')
          t.ok(st.downloaded === st.length, 'all blocks downloaded')
          helpers.verifyFixtures(t, archive, function (err) {
            t.error(err, 'error')
            t.ok(dwebx.network, 'network is open')
            dwebx.close(function (err) {
              t.error(err, 'error')
              t.equal(dwebx.network, undefined, 'network is closed')
              cleanup(function (err) {
                t.error(err, 'error')
                closeShare(function (err) {
                  t.error(err, 'error')
                  t.end()
                })
              })
            })
          })
        }
      })
    })
  })
})

// TODO:
// rest of download tests
// tests will be a lot better with some download-finished type check
// e.g. https://github.com/distributedweb/ddatabase/pull/86

// if (!process.env.TRAVIS) {
//   test('download and live update (new file)', function (t) {
//     var dwebx = downloadDat // use previous test download
//     var archive = dwebx.archive
//     var newFile = path.join(fixtures, 'new.txt')

//     archive.metadata.on('update', function () {
//       t.pass('metadata update fires')
//     })

//     archive.on('download-finished', function () {
//       t.skip('TODO: download finished fires again')
//     })

//     dwebx.stats.once('update:filesTotal', function () {
//       t.same(dwebx.stats.get().filesTotal, fixtureStats.filesTotal + 1, 'filesTotal has one more')
//     })

//     dwebx.stats.on('update:blocksProgress', function () {
//       var st = dwebx.stats.get()
//       // TODO: blocksProgress === blocksTotal (bug in stats?)
//       if (st.blocksTotal && st.blocksProgress >= st.blocksTotal) return done()
//     })

//     addShareFile()

//     function addShareFile () {
//       fs.writeFileSync(newFile, 'helloooooo')
//     }

//     function done () {
//       // shareDat file watching is closing without callback and causing trouble
//       dwebx.close(function () {
//         fs.unlink(newFile, function () {
//           t.end()
//         })
//       })
//     }
//   })
// }

// test('Download with sparse', function (t) {
//   testFolder(function () {
//     DWebX(downloadDir, {key: shareKey, sparse: true}, function (err, dwebx) {
//       t.error(err, 'no download init error')
//       t.ok(dwebx, 'callsback with dwebx object')
//       t.ok(dwebx.options.sparse, 'sparse option set')
//       t.ok(dwebx.archive.options.sparse, 'sparse option set')
//       t.ok(dwebx.archive._sparse, 'sparse option set')

//       var archive = dwebx.archive
//       downloadDat = dwebx

//       archive.open(function () {
//         archive.get('table.csv', function (err, entry) {
//           t.ifError(err)
//           archive.download(entry, function (err) {
//             t.ifError(err)
//             done()
//           })
//         })
//       })

//       var network = dwebx.joinNetwork()
//       network.once('connection', function () {
//         t.pass('connects via network')
//       })

//       function done () {
//         fs.readdir(downloadDir, function (_, files) {
//           var hasCsvFile = files.indexOf('table.csv') > -1
//           var hasDatFolder = files.indexOf('.dwebx') > -1
//           t.ok(hasDatFolder, '.dwebx folder created')
//           t.ok(hasCsvFile, 'csv file downloaded')
//           t.same(files.length, 2, 'two items in download dir')
//           downloadDat.close(function () {
//             t.end()
//           })
//         })
//       }
//     })
//   })
// })

// test('Download pause', function (t) {
//   testFolder(function () {
//     DWebX(downloadDir, {key: shareKey}, function (err, dwebx) {
//       t.error(err, 'no download init error')

//       var paused = false
//       dwebx.joinNetwork({ dht: false }).once('connection', function () {
//         dwebx.pause()
//         paused = true

//         dwebx.archive.on('download', failDownload)

//         setTimeout(function () {
//           dwebx.archive.removeListener('download', failDownload)
//           dwebx.resume()
//           paused = false
//         }, 500)

//         function failDownload () {
//           if (paused) t.fail('download when paused')
//         }
//       })

//       dwebx.archive.open(function () {
//         dwebx.archive.content.on('download-finished', done)
//       })

//       function done () {
//         t.pass('finished download after resume')
//         if (dwebx._closed) return
//         dwebx.close(function (err) {
//           t.error(err, 'no error')
//           t.end()
//         })
//       }
//     })
//   })
// })

// test('download from snapshot', function (t) {
//   var shareKey
//   var snapshotDat
//   DWebX(fixtures, {live: false}, function (err, dwebx) {
//     t.error(err, 'live: false share, no error')
//     snapshotDat = dwebx
//     dwebx.importFiles(function (err) {
//       t.error(err, 'import no error')
//       dwebx.archive.finalize(function (err) {
//         t.error(err, 'no error')
//         shareKey = dwebx.archive.key
//         dwebx.joinNetwork()
//         download()
//       })
//     })
//   })

//   function download () {
//     testFolder(function () {
//       DWebX(downloadDir, { key: shareKey }, function (err, dwebx) {
//         t.error(err, 'no download init error')
//         t.ok(dwebx, 'callsback with dwebx object')
//         t.ok(dwebx.key, 'has key')
//         t.ok(dwebx.archive, 'has archive')
//         t.ok(dwebx.db, 'has db')
//         t.ok(dwebx.owner === false, 'archive not owned')

//         var archive = dwebx.archive

//         dwebx.joinNetwork()

//         archive.open(function () {
//           t.ok(archive.live === false, 'archive.live is false')
//           archive.content.once('download-finished', function () {
//             done()
//           })
//         })

//         function done () {
//           fs.readdir(downloadDir, function (_, files) {
//             var hasCsvFile = files.indexOf('table.csv') > -1
//             var hasDatFolder = files.indexOf('.dwebx') > -1
//             t.ok(hasDatFolder, '.dwebx folder created')
//             t.ok(hasCsvFile, 'csv file downloaded')

//             dwebx.close(function () {
//               t.pass('close callback ok')
//               snapshotDat.close(function () {
//                 rimraf.sync(path.join(fixtures, '.dwebx'))
//                 t.end()
//               })
//             })
//           })
//         }
//       })
//     })
//   }
// })

// test.onFinish(function () {
//   rimraf.sync(downloadDir)
// })

function shareFixtures (opts, cb) {
  if (typeof opts === 'function') cb = opts
  if (!opts) opts = {}

  rimraf.sync(path.join(fixtures, '.dwebx')) // for previous failed tests
  DWebX(fixtures, { temp: true }, function (err, dwebx) {
    if (err) return cb(err)
    dwebx.joinNetwork({ dht: false })
    dwebx.importFiles(function (err) {
      if (err) return cb(err)
      cb(null, dwebx.key, close)
    })

    function close (cb) {
      dwebx.close(function (err) {
        cb(err)
        // rimraf if we need it?
      })
    }
  })
}
