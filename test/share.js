var fs = require('fs')
var path = require('path')
var test = require('tape')
var rimraf = require('rimraf')
var ram = require('random-access-memory')
var countFiles = require('count-files')
var helpers = require('./helpers')

var DWebX = require('..')

// os x adds this if you view the fixtures in finder and breaks the file count assertions
try { fs.unlinkSync(path.join(__dirname, 'fixtures', '.DS_Store')) } catch (e) { /* ignore error */ }

var fixtures = path.join(__dirname, 'fixtures')
var fixtureStats = {
  files: 3,
  bytes: 1452,
  dirs: 1
}
var liveKey

test('share: prep', function (t) {
  cleanFixtures(function () {
    t.end()
  })
})

test('share: create dwebx with default ops', function (t) {
  DWebX(fixtures, function (err, dwebx) {
    t.error(err, 'cb err okay')
    t.ok(dwebx.path === fixtures, 'correct directory')
    t.ok(dwebx.archive, 'has archive')
    t.ok(dwebx.key, 'has key')
    t.ok(dwebx.live, 'is live')
    t.ok(dwebx.writable, 'is writable')
    t.ok(!dwebx.resumed, 'is not resumed')

    fs.stat(path.join(fixtures, '.dwebx'), function (err, stat) {
      t.error(err)
      t.pass('creates .dwebx dir')
    })

    liveKey = dwebx.key
    var putFiles = 0
    var stats = dwebx.trackStats()
    var network = dwebx.joinNetwork()

    network.once('listening', function () {
      t.pass('network listening')
    })

    var progress = dwebx.importFiles(function (err) {
      t.error(err, 'file import err okay')
      var archive = dwebx.archive
      var st = stats.get()
      if (archive.version === st.version) return check()
      stats.once('update', check)

      function check () {
        var st = stats.get()
        t.same(st.files, 3, 'stats files')
        t.same(st.length, 2, 'stats length')
        t.same(st.version, archive.version, 'stats version')
        t.same(st.byteLength, 1452, 'stats bytes')

        t.same(putFiles, 3, 'importer puts')
        t.same(archive.version, 3, 'archive version')
        t.same(archive.metadata.length, 4, 'entries in metadata')

        helpers.verifyFixtures(t, archive, function (err) {
          t.ifError(err)
          dwebx.close(function (err) {
            t.ifError(err)
            t.pass('close okay')
            t.end()
          })
        })
      }
    })

    progress.on('put', function () {
      putFiles++
    })
  })
})

test('share: resume with .dwebx folder', function (t) {
  DWebX(fixtures, function (err, dwebx) {
    t.error(err, 'cb without error')
    t.ok(dwebx.writable, 'dwebx still writable')
    t.ok(dwebx.resumed, 'resume flag set')
    t.same(liveKey, dwebx.key, 'key matches previous key')
    var stats = dwebx.trackStats()

    countFiles({ fs: dwebx.archive, name: '/' }, function (err, count) {
      t.ifError(err, 'count err')
      var archive = dwebx.archive

      t.same(archive.version, 3, 'archive version still')

      var st = stats.get()
      t.same(st.byteLength, fixtureStats.bytes, 'bytes total still the same')
      t.same(count.bytes, fixtureStats.bytes, 'bytes still ok')
      t.same(count.files, fixtureStats.files, 'bytes still ok')
      dwebx.close(function () {
        cleanFixtures(function () {
          t.end()
        })
      })
    })
  })
})

test('share: resume with empty .dwebx folder', function (t) {
  var emptyPath = path.join(__dirname, 'empty')
  DWebX(emptyPath, function (err, dwebx) {
    t.error(err, 'cb without error')
    t.false(dwebx.resumed, 'resume flag false')

    dwebx.close(function () {
      DWebX(emptyPath, function (err, dwebx) {
        t.error(err, 'cb without error')
        t.ok(dwebx.resumed, 'resume flag set')

        dwebx.close(function () {
          rimraf(emptyPath, function () {
            t.end()
          })
        })
      })
    })
  })
})

// TODO: live = false, not implemented yet in ddrive v8
// test('share snapshot', function (t) {
//   DWebX(fixtures, { live: false }, function (err, dwebx) {
//     t.error(err, 'share cb without error')

//     t.ok(!dwebx.live, 'live false')
//     dwebx.importFiles(function (err) {
//       t.error(err, 'no error')
//       dwebx.archive.finalize(function (err) {
//         t.error(err, 'no error')

//         // TODO: saving mtime breaks this
//         // t.skip(fixturesKey, dwebx.key, 'TODO: key matches snapshot key')

//         dwebx.close(cleanFixtures(function () {
//           rimraf.sync(path.join(fixtures, '.dwebx'))
//           t.end()
//         }))
//       })
//     })
//   })
// })

if (!process.env.TRAVIS) {
  test('share: live - editing file', function (t) {
    DWebX(fixtures, function (err, dwebx) {
      t.ifError(err, 'error')

      var importer = dwebx.importFiles({ watch: true }, function (err) {
        t.ifError(err, 'error')
        if (!err) t.fail('live import should not cb')
      })
      importer.on('put-end', function (src) {
        if (src.name.indexOf('empty.txt') > -1) {
          if (src.live) return done()
          fs.writeFileSync(path.join(fixtures, 'folder', 'empty.txt'), 'not empty')
        }
      })

      function done () {
        dwebx.archive.stat('/folder/empty.txt', function (err, stat) {
          t.ifError(err, 'error')
          t.same(stat.size, 9, 'empty file has new content')
          dwebx.close(function () {
            // make file empty again
            fs.writeFileSync(path.join(fixtures, 'folder', 'empty.txt'), '')
            t.end()
          })
        })
      }
    })
  })

  test('share: live resume & create new file', function (t) {
    var newFile = path.join(fixtures, 'new.txt')
    DWebX(fixtures, function (err, dwebx) {
      t.error(err, 'error')
      t.ok(dwebx.resumed, 'was resumed')

      var importer = dwebx.importFiles({ watch: true }, function (err) {
        t.error(err, 'error')
        if (!err) t.fail('watch import should not cb')
      })

      importer.on('put-end', function (src) {
        if (src.name.indexOf('new.txt') === -1) return
        t.ok(src.live, 'file put is live')
        process.nextTick(done)
      })
      setTimeout(writeFile, 500)

      function writeFile () {
        fs.writeFile(newFile, 'hello world', function (err) {
          t.ifError(err, 'error')
        })
      }

      function done () {
        dwebx.archive.stat('/new.txt', function (err, stat) {
          t.ifError(err, 'error')
          t.ok(stat, 'new file in archive')
          fs.unlink(newFile, function () {
            dwebx.close(function () {
              t.end()
            })
          })
        })
      }
    })
  })
}

test('share: cleanup', function (t) {
  cleanFixtures(function () {
    t.end()
  })
})

test('share: dir storage and opts.temp', function (t) {
  DWebX(fixtures, { temp: true }, function (err, dwebx) {
    t.error(err, 'error')
    t.false(dwebx.resumed, 'resume flag false')

    dwebx.importFiles(function (err) {
      t.error(err, 'error')
      helpers.verifyFixtures(t, dwebx.archive, done)
    })

    function done (err) {
      t.error(err, 'error')
      dwebx.close(function () {
        t.end()
      })
    }
  })
})

test('share: ram storage & import other dir', function (t) {
  DWebX(ram, function (err, dwebx) {
    t.error(err, 'error')
    t.false(dwebx.resumed, 'resume flag false')

    dwebx.importFiles(fixtures, function (err) {
      t.error(err, 'error')
      helpers.verifyFixtures(t, dwebx.archive, done)
    })

    function done (err) {
      t.error(err, 'error')
      dwebx.close(function () {
        t.end()
      })
    }
  })
})

function cleanFixtures (cb) {
  cb = cb || function () {}
  rimraf(path.join(fixtures, '.dwebx'), cb)
}
