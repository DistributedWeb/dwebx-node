var fs = require('fs')
var path = require('path')
var test = require('tape')
var rimraf = require('rimraf')
var countFiles = require('count-files')
var tmpDir = require('temporary-directory')

var DWebX = require('..')
var fixtures = path.join(__dirname, 'fixtures')

test('importing: import two directories at same time', function (t) {
  rimraf.sync(path.join(fixtures, '.dwebx')) // for previous failed tests
  DWebX(fixtures, { temp: true }, function (err, dwebx) {
    t.error(err, 'error')
    var pending = 2
    dwebx.importFiles(function (err) {
      t.error(err, 'error')
      t.pass('ok')
      if (!--pending) done()
    })
    dwebx.importFiles(path.join(__dirname, '..', 'examples'), function (err) {
      t.error(err, 'error')
      if (!--pending) done()
    })

    function done () {
      countFiles({ fs: dwebx.archive, name: '/' }, function (err, count) {
        t.error(err, 'error')
        t.same(count.files, 6, 'five files total')
        t.end()
      })
    }
  })
})

test('importing: custom ignore extends default (string)', function (t) {
  rimraf.sync(path.join(fixtures, '.dwebx')) // for previous failed tests
  DWebX(fixtures, { temp: true }, function (err, dwebx) {
    t.error(err)
    dwebx.importFiles({ ignore: '**/*.js' }, function () {
      var shouldIgnore = dwebx.options.importer.ignore
      t.ok(shouldIgnore('.dwebx'), '.dwebx folder ignored')
      t.ok(shouldIgnore('foo/bar.js'), 'custom ignore works')
      t.notOk(shouldIgnore('foo/bar.txt'), 'txt file gets to come along =)')
      dwebx.close(function () {
        t.end()
      })
    })
  })
})

test('importing: custom ignore extends default (array)', function (t) {
  DWebX(fixtures, { temp: true }, function (err, dwebx) {
    t.error(err)
    dwebx.importFiles({ ignore: ['super_secret_stuff/*', '**/*.txt'] }, function () {
      var shouldIgnore = dwebx.options.importer.ignore

      t.ok(shouldIgnore('.dwebx'), '.dwebx still feeling left out =(')
      t.ok(shouldIgnore('password.txt'), 'file ignored')
      t.ok(shouldIgnore('super_secret_stuff/file.js'), 'secret stuff stays secret')
      t.notOk(shouldIgnore('foo/bar.js'), 'js file joins the party =)')
      dwebx.close(function () {
        t.end()
      })
    })
  })
})

test('importing: ignore hidden option turned off', function (t) {
  DWebX(fixtures, { temp: true }, function (err, dwebx) {
    t.error(err)
    dwebx.importFiles({ ignoreHidden: false }, function () {
      var shouldIgnore = dwebx.options.importer.ignore

      t.ok(shouldIgnore('.dwebx'), '.dwebx still feeling left out =(')
      t.notOk(shouldIgnore('.other-hidden'), 'hidden file NOT ignored')
      t.notOk(shouldIgnore('dir/.git'), 'hidden folders with dir NOT ignored')
      dwebx.close(function () {
        rimraf.sync(path.join(fixtures, '.dwebx'))
        t.end()
      })
    })
  })
})

test('importing: ignore dirs option turned off', function (t) {
  DWebX(fixtures, { temp: true }, function (err, dwebx) {
    t.error(err)
    dwebx.importFiles({ ignoreDirs: false }, function () {
      var stream = dwebx.archive.history()
      var hasFolder = false
      var hasRoot = false
      stream.on('data', function (data) {
        if (data.name === '/folder') hasFolder = true
        if (data.name === '/') hasRoot = true
      })
      stream.on('end', function () {
        t.ok(hasFolder, 'folder in metadata')
        t.ok(hasRoot, 'root in metadata')
        dwebx.close(function () {
          rimraf.sync(path.join(fixtures, '.dwebx'))
          t.end()
        })
      })
    })
  })
})

test('importing: import with options but no callback', function (t) {
  DWebX(fixtures, { temp: true }, function (err, dwebx) {
    t.error(err)
    var importer = dwebx.importFiles({ dryRun: true })
    importer.on('error', function (err) {
      t.error(err, 'no error')
    })
    dwebx.close(function (err) {
      t.error(err, 'no err')
      rimraf.sync(path.join(fixtures, '.dwebx'))
      t.end()
    })
  })
})

test('importing: import with .dwebxignore', function (t) {
  fs.writeFileSync(path.join(fixtures, '.dwebxignore'), 'ignoreme.txt')
  fs.writeFileSync(path.join(fixtures, 'ignoreme.txt'), 'hello world')
  DWebX(fixtures, { temp: true }, function (err, dwebx) {
    t.error(err)
    var importer = dwebx.importFiles(function (err) {
      t.error(err)

      var shouldIgnore = dwebx.options.importer.ignore
      t.ok(shouldIgnore('.dwebx'), '.dwebx ignored')
      dwebx.close(function () {
        fs.unlinkSync(path.join(fixtures, '.dwebxignore'))
        fs.unlinkSync(path.join(fixtures, 'ignoreme.txt'))
        rimraf.sync(path.join(fixtures, '.dwebx'))
        t.end()
      })
    })
    importer.on('put', function (file) {
      if (file.name.indexOf('ignoreme.txt') > -1) t.fail('ignored file imported')
    })
  })
})

test('importing: import with opts.useDatIgnore false', function (t) {
  fs.writeFileSync(path.join(fixtures, '.dwebxignore'), 'ignoreme.txt')
  fs.writeFileSync(path.join(fixtures, 'ignoreme.txt'), 'hello world')
  DWebX(fixtures, { temp: true }, function (err, dwebx) {
    t.error(err)
    var fileImported = false
    var importer = dwebx.importFiles({ useDatIgnore: false }, function (err) {
      t.error(err)

      var shouldIgnore = dwebx.options.importer.ignore
      t.ok(shouldIgnore('.dwebx'), '.dwebx ignored')
      dwebx.close(function () {
        if (!fileImported) t.fail('file in .dwebxignore not imported')
        fs.unlinkSync(path.join(fixtures, '.dwebxignore'))
        fs.unlinkSync(path.join(fixtures, 'ignoreme.txt'))
        rimraf.sync(path.join(fixtures, '.dwebx'))
        t.end()
      })
    })
    importer.on('put', function (file) {
      if (file.name.indexOf('ignoreme.txt') > -1) {
        fileImported = true
        t.pass('ignored file imported')
      }
    })
  })
})

test('importing: import from hidden folder src', function (t) {
  tmpDir(function (_, dir, cleanup) {
    dir = path.join(dir, '.hidden')
    fs.mkdirSync(dir)
    fs.writeFileSync(path.join(dir, 'hello.txt'), 'hello world')
    DWebX(dir, { temp: true }, function (err, dwebx) {
      t.error(err, 'no error')
      dwebx.importFiles(function (err) {
        t.error(err)
        t.same(dwebx.archive.version, 1, 'archive has 1 file')
        dwebx.archive.stat('/hello.txt', function (err, stat) {
          t.error(err, 'no error')
          t.ok(stat, 'file added')
          dwebx.close(function () {
            cleanup(function () {
              t.end()
            })
          })
        })
      })
    })
  })
})

test('importing: make sure importing .. fails', function (t) {
  tmpDir(function (_, dir, cleanup) {
    var illegalDir = path.join(dir, '..', 'tmp')
    fs.mkdirSync(illegalDir)
    fs.writeFileSync(path.join(illegalDir, 'hello.txt'), 'hello world')
    DWebX(dir, { temp: true }, function (err, dwebx) {
      t.error(err, 'no error')
      dwebx.importFiles(function (err) {
        t.error(err)
        dwebx.archive.readdir('/', function (err, list) {
          t.error(err, 'no error')
          t.ok(list.length === 0, 'no files added')
          rimraf.sync(illegalDir)
          dwebx.close(function () {
            cleanup(function () {
              t.end()
            })
          })
        })
      })
    })
  })
})
