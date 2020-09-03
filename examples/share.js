var path = require('path')
var DWebX = require('..')

var src = path.join(__dirname, '..')

DWebX(src, { temp: true }, function (err, dwebx) {
  if (err) throw err

  var network = dwebx.joinNetwork()
  network.once('connection', function () {
    console.log('Connected')
  })
  var progress = dwebx.importFiles(src, {
    ignore: ['**/dwebx-node/node_modules/**']
  }, function (err) {
    if (err) throw err
    console.log('Done importing')
    console.log('Archive size:', dwebx.archive.content.byteLength)
  })
  progress.on('put', function (src, dest) {
    console.log('Added', dest.name)
  })

  console.log(`Sharing: ${dwebx.key.toString('hex')}\n`)
})
