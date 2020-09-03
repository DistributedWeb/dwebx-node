var fs = require('fs')
var path = require('path')
var mirror = require('mirror-folder')
var ram = require('random-access-memory')
var DWebX = require('..')

var key = process.argv[2]
if (!key) {
  console.error('Run with: node examples/download.js <key>')
  process.exit(1)
}

var dest = path.join(__dirname, 'tmp')
fs.mkdirSync(dest)

DWebX(ram, { key: key, sparse: true }, function (err, dwebx) {
  if (err) throw err

  var network = dwebx.joinNetwork()
  network.once('connection', function () {
    console.log('Connected')
  })
  dwebx.archive.metadata.update(download)

  function download () {
    var progress = mirror({ fs: dwebx.archive, name: '/' }, dest, function (err) {
      if (err) throw err
      console.log('Done')
    })
    progress.on('put', function (src) {
      console.log('Downloading', src.name)
    })
  }

  console.log(`Downloading: ${dwebx.key.toString('hex')}\n`)
})
