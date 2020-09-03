# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]
*Note: unreleased changes are added here.*
<!-- Change types:
  ### Added, ### Changed, ### Fixed, ### Removed, ### Deprecated
-->

## 3.5.5 - 2017-06-19
### Fixed
* The stats tracking should work with much less issues now (https://github.com/distributedweb/dwebx-node/pull/175, https://github.com/distributedweb/dwebx-node/pull/176)

## 3.5.0 - 2017-06-19
### Added
* Serve archives over http (https://github.com/distributedweb/dwebx-node/pull/160)

## 3.4.0 - 2017-06-19
### Added
* Resolve dwebx links over http (https://github.com/distributedweb/dwebx-node/pull/159)

## 3.3.2 - 2017-05-29
### Fixed
* Bump ddrive to fix delete bug in append-tree (https://github.com/distributedweb/append-tree/commit/7e1f3cc9998be4ca7dabe0560b1a1ec1502ac186)

## 3.3.1 - 2017-05-16
### Fixed
* Replication Stream should be true for writable archives

### Added
* Use regular sleep storage if `opts.latest` is false

## 3.3.0 - 2017-05-10
### Added
* Importing - Ignore directories option, true by default

## 3.0.0 - 2017-04-28
### Fixed
* Upgrade ddrive with breaking change.

## 2.0.0 - 2017-04-13
Big new release! DDrive version 8 upgrades to our SLEEP file format. The ddrive release improves import, transfer speed, and metadata access. It includes a new API much like the node fs API. Lots of cool things!

We've tried to keep the dwebx-node API changes to a minimum. But we've moved away from using leveldb to storing the metadata, using a flat file format instead. This means the 2.0 release will be incompatible with exiting dwebx archives.

If you have any old archives, we definitely recommend you upgrade. Any upgrade time will be made up for with more speed!

The major API differences are listed below, we probably forgot some minor changes as several of the underlying modules have changes options or APIs.

### Changed
* Using `mirror-folder` for importing files - this comes with a new event emitter for importing and different options.
* Storage is a lot different! You can specify a directory or a storage function, e.g. `DWebX(ram, cb)` now instead of the database.

### Removed
* `opts.db` option - no more database! You can specify a variety of storage formats as the first argument instead.
* `dwebx.owner` - this is now `dwebx.writable`.
* `stats` events - we are still in the process of upgrading ddrive-stats. DDatabase will also support more stats internally now and we will be transitioning to those soon.
* Import options - `mirror-folder` has fewer options on import.

## 1.4.1 - 2017-03-17
### Fixed
* Pass network `opts` through to discovery-swarm.

## 1.4.0 - 2017-03-08
### Added
* `.dwebxignore` support for ignoring files
* Callback on `joinNetwork` after first round of discovery
* Initial `pause` and `resume` API aliased to `join` and `leave`
* `stats.peers` API with new peer counts

### Fixed
* Better leave network, also closes swarm.
* Clone options passed to initArchive
* Set `opts.file` for archive owner without length
* `createIfMissing` passed to level options
* `dwebx.close()` twice sync errors
* Fix import without options
* (ddrive fix) sparse content archives

### Changed
* Remove automatic finalize for snapshot imports

## 1.3.8 - 2017-02-20
### Fixed
* Close archive after bad key on init.

## 1.3.7 - 2017-02-15
## Changed
* Rollback temporary changes from 1.3.6
* Set length on file option
* Remove ddrive version pin

## 1.3.6 - 2017-02-13
## Changed
* Temporary changes for critical replication bugs
* Pin ddrive to `7.13.2`
* Remove length option in `raf`
* Do not allow owner to download
* Do not set file option for owner

## 1.3.5 - 2017-02-04
## Fixed
* Key regression on resume

## 1.3.4 - 2017-02-03
## Fixed
* Call back with error if `opts.key` mismatches keys in database
* Fix options casting and improve errors
* Improve key handling for archive databases + debug info

## 1.3.3 - 2017-02-01
## Fixed
* Call back with error object on init archive

## 1.3.2 - 2017-02-01
## Fixed
* Do not mutate input args
* Call unreplicate on close to make sure data replication stops
* Throw error if close is called more than once

## 1.3.1 - 2017-01-25
## Fixed
* Real error message for `createIfMissing`

## 1.3.0 - 2017-01-25
## Added
* `createIfMissing` and `errorIfExists` options

## Deprecated
* `resume` option

## 1.2.4 - 2017-01-24
## Fixed
* fix regression in resuming archives without content by opening them first.

## 1.2.3 - 2017-01-24
## Fixed
* Learning things about `npm` versions!

## 1.2.2 - 2017-01-23
### Fixed
* Dowloaded file could have old bytes that weren't removed with updates. Issue #79.

## 1.2.1 - 2017-01-23
### Fixed
* Bug where opening archive on bad key returned without callback. Added timeout on open archive to make sure other key is tried before exiting.

## 1.2.0 - 2017-01-23
### Changed
* Read existing keys directly from ddrive instead of using the db. Allows for better resuming in any application.
* Count files much faster on import
* Add `opts.indexing` and default to true for when `source` = `dest`.

### Added
* Support for `drive` as first argument and [multidrive](https://github.com/yoshuawuyts/multidrive/) support
* `dwebx.leaveNetwork` - leave the network for this archive key.
* Added `dir` option to importer.
* Made it easier to require DWebX as a module, without creating archive.

### Fixed
* Close archive after other things are closed
* Use discoveryKey for stats database (security)

### Deprecated
* Expose discovery swarm instance on `dwebx.network` instead of `dwebx.network.swarm`.

## 1.1.1 - 2017-01-06
### Fixed
* Resolve the path and untildify before creating archive

## 1.1.0 - 2017-01-03
### Added
* Use `opts.indexing` for importing.

## 1.0.0 - 2016-12-21
* dwebx-node released with a new API. [Read about changes](https://github.com/distributedweb/dwebx-node#moving-from-dwebx-js) from the old API.

## 0.1.1 - 2016-11-29
### Fixed
* Populate `dwebx.key` after archive opened ([#43](https://github.com/distributedweb/dwebx-node/pull/43))

### Changed
* Use dwebdiscovery instead of ddrive-archive-swarm ([#45](https://github.com/distributedweb/dwebx-node/pull/45))

## 0.1.0 - 2016-11-17
Released `dwebx-js` 4.0 as `dwebx-node` 0.1.

## Moved to dwebx-node.
*dwebx-node 0.1.0 === dwebx-js 4.0.0*

## 4.0.0 - 2016-11-16
*This will be the last major version of dwebx-js. This library will be moving to dwebx-fs, with a similar API.*

### Removed
* webrtc support (`opts.webrtc`, `opts.signalhub`)
* `opts.upload` changed to `opts.discovery.upload` (deprecated in 3.4.0)

### Fixed
* Error message for trying to download a dwebx to folder with existing dwebx.


## 3.8.2 - 2016-11-15
### Fixed
* Check type of keys on db resume

## 3.8.1 - 2016-11-15
### Fixed
* Progress incorrectly showing 100% with 0 bytes

## 3.8.0 - 2016-11-07
### Added
* Expose `dwebx.owner`, `dwebx.key`, `dwebx.peers`
* Support buffer keys
* Forward `db.open` errors

### Fixed
* Guard `archive.close` on `dwebx.close`

## 3.7.1 - 2016-10-29
### Fixed
* Create entryDone function once for downloads

## 3.7.0 - 2016-10-29
### Fixed
* Download file count for duplicate files

### Removed
* `stats.bytesProgress` on downloads

### Changed
* Upgrade to ddrive 7.5.0
* Use archive.blocks for stats on download with new ddrive functions.

## 3.6.0 - 2016-09-27
### Added
* `signalhub` option.

## 3.5.0 - 2016-09-22
### Added
* `opts.ignoreHidden` ignores hidden directories by default.

## 3.4.0 - 2016-09-14
### Changed
* Accept object for discovery: `{upload: true, download: true}`.

### Deprecated
* `upload` option (moved to `discovery.upload`). Will be removed in 4.0.0.

## 3.3.1 - 2016-09-06
### Fixed
* Emit `files-counted` event on DWebX instance
* Include `stats` object on `file-counted` event

## 3.3.0 - 2016-09-06
### Added
* Add `webrtc` option

## 3.2.0 - 2016-09-01
### Added
* Upload option. `upload=false` will not upload data (allows download only option)

## 3.1.0 - 2016-09-01
### Added
* User `opts.ignore` extends default opts.

### Fixed
* Default ignore does not ignore files with .dwebx in them.

## 3.0.2 - 2016-08-26
### Fixed
* Default ignore config to ignore only `.dwebx` folder and files inside.

## 3.0.1 - 2016-08-18
### Fixed
* Fix ddrive-import-files bug on sharing directories

## 3.0.0 - 2016-08-18
### Added
* `dwebx.open()` function to initialize the `.dwebx` folder

### Removed
* `dwebx.on('ready')` event for initialization


## 2.x.x and earlier

* Port `lib/dwebx.js` file from the [DWebX CLI](https://github.com/distributedweb/dwebx) library.

### Changed
* Use ddrive-import-files to import files on share
