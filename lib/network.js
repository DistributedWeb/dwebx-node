var assert = require('assert')
var swarmDefaults = require('dwebx-config')
var disc = require('discovery-swarm')

module.exports = function (archive, opts, cb) {
  assert.ok(archive, 'dwebx-node: lib/network archive required')
  assert.ok(opts, 'dwebx-node: lib/network opts required')

  var DEFAULT_PORT = 1776
  var swarmOpts = Object.assign({
    hash: false,
    stream: opts.stream
  }, opts)
  var swarm = disc(swarmDefaults(swarmOpts))
  swarm.once('error', function () {
    swarm.listen(0)
  })
  swarm.listen(opts.port || DEFAULT_PORT)
  swarm.join(archive.discoveryKey, { announce: !(opts.upload === false) }, cb)
  swarm.options = swarm._options
  return swarm
}
