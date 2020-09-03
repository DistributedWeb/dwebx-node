var path = require('path')
var test = require('tape')
var rimraf = require('rimraf')
var encoding = require('dwebx-encoding')

var DWebX = require('..')
var fixtures = path.join(__dirname, 'fixtures')

test('opts: string or buffer .key', function (t) {
  rimraf.sync(path.join(process.cwd(), '.dwebx')) // for failed tests
  var buf = Buffer.alloc(32)
  DWebX(process.cwd(), { key: buf }, function (err, dwebx) {
    t.error(err, 'no callback error')
    t.deepEqual(dwebx.archive.key, buf, 'keys match')

    dwebx.close(function (err) {
      t.error(err, 'no close error')

      DWebX(process.cwd(), { key: encoding.encode(buf) }, function (err, dwebx) {
        t.error(err, 'no callback error')
        t.deepEqual(dwebx.archive.key, buf, 'keys match still')
        dwebx.close(function () {
          rimraf.sync(path.join(process.cwd(), '.dwebx'))
          t.end()
        })
      })
    })
  })
})

test('opts: createIfMissing false', function (t) {
  rimraf.sync(path.join(fixtures, '.dwebx'))
  DWebX(fixtures, { createIfMissing: false }, function (err, dwebx) {
    t.ok(err, 'throws error')
    t.end()
  })
})

test('opts: createIfMissing false with empty .dwebx', function (t) {
  t.skip('TODO')
  t.end()
  // rimraf.sync(path.join(fixtures, '.dwebx'))
  // fs.mkdirSync(path.join(fixtures, '.dwebx'))
  // DWebX(fixtures, {createIfMissing: false}, function (err, dwebx) {
  //   t.ok(err, 'errors')
  //   rimraf.sync(path.join(fixtures, '.dwebx'))
  //   t.end()
  // })
})

test('opts: errorIfExists true', function (t) {
  rimraf.sync(path.join(fixtures, '.dwebx'))
  // create dwebx to resume from
  DWebX(fixtures, function (err, dwebx) {
    t.ifErr(err)
    dwebx.close(function () {
      DWebX(fixtures, { errorIfExists: true }, function (err, dwebx) {
        t.ok(err, 'throws error')
        t.end()
      })
    })
  })
})

test('opts: errorIfExists true without existing dwebx', function (t) {
  rimraf.sync(path.join(fixtures, '.dwebx'))
  // create dwebx to resume from
  DWebX(fixtures, { errorIfExists: true }, function (err, dwebx) {
    t.ifErr(err)
    t.end()
  })
})
