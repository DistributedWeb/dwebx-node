# dwebx-node

> **dwebx-node** is a high-level module for building DWebX applications on the file system.

[![npm][0]][1] [![Travis][2]][3] [![Test coverage][4]][5] [![Greenkeeper badge](https://badges.greenkeeper.io/datproject/dwebx-node.svg)](https://greenkeeper.io/)

[DWebX](http://dwebx.org) is a decentralized tool for distributing data and
files, built for scientific and research data.
You can start using DWebX today in these client applications:

* [DWebX Command Line](https://github.com/distributedweb/dwebx): Use DWebX in the command line
* [DWebX Desktop](https://github.com/distributedweb/dwebx-desktop): A desktop application for DWebX
* [DBrowserX Browser](https://dbrowser.com): An experimental P2P browser with DWebX built in

#### DWebX Project Documentation & Resources

* [DWebX Project Docs](http://docs.dwebx.org/)
* [DWebX Protocol](https://www.dwebx.net/)
* [Gitter Chat](https://gitter.im/datproject/discussions) or [#dwebx on IRC](http://webchat.freenode.net/?channels=dwebx)

### Features

* High-level glue for common DWebX and [ddrive](https://github.com/distributedweb/ddrive) modules.
* Sane defaults and consistent management of storage & secret keys across applications, using [dwebx-storage](https://github.com/distributedweb/dwebx-storage).
* Easily connect to the DWebX network, using [discovery-swarm](https://github.com/distributedweb/discovery-swarm)
* Import files from the file system, using [mirror-folder](https://github.com/distributedweb/mirror-folder/)
* Serve dvaults over http with [ddrive-http](https://github.com/joehand/ddrive-http)
* Access APIs to lower level modules with a single `require`!

#### Browser Support

Many of our dependencies work in the browser, but `dwebx-node` is tailored for file system applications. See [dwebx-js](https://github.com/distributedweb/dwebx-js) if you want to build browser-friendly DWebX applications.

## Example

To send files via DWebX:

1. Tell dwebx-node where the files are.
2. Import the files.
3. Share the files on the DWebX network! (And share the link)

```js
var DWebX = require('dwebx-node')

// 1. My files are in /joe/cat-pic-analysis
DWebX('/joe/cat-pic-analysis', function (err, dwebx) {
  if (err) throw err

  // 2. Import the files
  dwebx.importFiles()

  // 3. Share the files on the network!
  dwebx.joinNetwork()
  // (And share the link)
  console.log('My DWebX link is: dwebx://', dwebx.key.toString('hex'))
})
```

These files are now available to share over the dwebx network via the key printed in the console.

To download the files, you can make another dwebx-node instance in a different folder. This time we also have three steps:

1. Tell dwebx where I want to download the files.
2. Tell dwebx what the link is.
3. Join the network and download!

```js
var DWebX = require('dwebx-node')

// 1. Tell DWebX where to download the files
DWebX('/download/cat-analysis', {
  // 2. Tell DWebX what link I want
  key: '<dwebx-key>' // (a 64 character hash from above)
}, function (err, dwebx) {
  if (err) throw err

  // 3. Join the network & download (files are automatically downloaded)
  dwebx.joinNetwork()
})
```

That's it! By default, all files are automatically downloaded when you connect to the other users.

Dig into more use cases below and please let us know if you have questions! You can [open a new issue](https://github.com/distributedweb/dwebx-node/issues) or talk to nice humans in [our chat room](https://gitter.im/datproject/discussions).

### Example Applications

* [DWebX CLI](https://github.com/distributedweb/dwebx): We use dwebx-node in the dwebx CLI.
* [DWebX Desktop](https://github.com/distributedweb/dwebx-desktop): The DWebX Desktop application manages multiple dwebx-node instances via [dwebx-worker](https://github.com/juliangruber/dwebx-worker).
* See the [examples folder](examples) for a minimal share + download usage.
* And more! Let us know if you have a neat dwebx-node application to add here.

## Usage

All dwebx-node applications have a similar structure around three main elements:

1. **Storage** - where the files and metadata are stored.
2. **Network** - connecting to other users to upload or download data.
3. **Adding Files** - adding files from the file system to the ddrive archive.

We'll go through what these are for and a few of the common usages of each element.

### Storage

Every dwebx archive has **storage**, this is the required first argument for dwebx-node. By default, we use [dwebx-storage](http://github.com/distributedweb/dwebx-storage) which stores the secret key in `~/.dwebx/` and the rest of the data in `dir/.dwebx`. Other common options are:

* **Persistent storage**: Stored files in `/my-dir` and metadata in `my-dir/.dwebx` by passing `/my-dir` as the first argument.
* **Temporary Storage**: Use the `temp: true` option to keep metadata stored in memory.

```js
// Permanent Storage
DWebX('/my-dir', function (err, dwebx) {
  // Do DWebX Stuff
})

// Temporary Storage
DWebX('/my-dir', {temp: true}, function (err, dwebx) {
  // Do DWebX Stuff
})
```

Both of these will import files from `/my-dir` when doing `dwebx.importFiles()` but only the first will make a `.dwebx` folder and keep the metadata on disk.

The storage argument can also be passed through to ddrive for more advanced storage use cases.

### Network

DWebX is all about the network! You'll almost always want to join the network right after you create your DWebX:

```js
DWebX('/my-dir', function (err, dwebx) {
  dwebx.joinNetwork()
  dwebx.network.on('connection', function () {
    console.log('I connected to someone!')
  })
})
```

#### Downloading Files

Remember, if you are downloading - metadata and file downloads will happen automatically once you join the network!

DWebX runs on a peer to peer network, sometimes there may not be anyone online for a particular key. You can make your application more user friendly by using the callback in `joinNetwork`:

```js
// Downloading <key> with joinNetwork callback
DWebX('/my-dir', {key: '<key>'}, function (err, dwebx) {
  dwebx.joinNetwork(function (err) {
    if (err) throw err

    // After the first round of network checks, the callback is called
    // If no one is online, you can exit and let the user know.
    if (!dwebx.network.connected || !dwebx.network.connecting) {
      console.error('No users currently online for that key.')
      process.exit(1)
    }
  })
})
```

##### Download on Demand

If you want to control what files and metadata are downloaded, you can use the sparse option:

```js
// Downloading <key> with sparse option
DWebX('/my-dir', {key: '<key>', sparse: true}, function (err, dwebx) {
  dwebx.joinNetwork()

  // Manually download files via the ddrive API:
  dwebx.archive.readFile('/cat-locations.txt', function (err, content) {
    console.log(content) // prints cat-locations.txt file!
  })
})
```

DWebX will only download metadata and content for the parts you request with `sparse` mode!

### Importing Files

There are many ways to get files imported into an archive! DWebX node provides a few basic methods. If you need more advanced imports, you can use the `archive.createWriteStream()` methods directly.

By default, just call `dwebx.importFiles()` to import from the directory you initialized with. You can watch that folder for changes by setting the watch option:

```js
DWebX('/my-data', function (err, dwebx) {
  if (err) throw err

  var progress = dwebx.importFiles({watch: true}) // with watch: true, there is no callback
  progress.on('put', function (src, dest) {
    console.log('Importing ', src.name, ' into archive')
  })
})
```

You can also import from another directory:

```js
DWebX('/my-data', function (err, dwebx) {
  if (err) throw err

  dwebx.importFiles('/another-dir', function (err) {
    console.log('done importing another-dir')
  })
})
```

That covers some of the common use cases, let us know if there are more to add! Keep reading for the full API docs.

## API

### `DWebX(dir|storage, [opts], callback(err, dwebx))`

Initialize a DWebX Archive in `dir`. If there is an existing DWebX Archive, the archive will be resumed.

#### Storage

* `dir` (Default) - Use [dwebx-storage](https://github.com/distributedweb/dwebx-storage) inside `dir`. This stores files as files, sleep files inside `.dwebx`, and the secret key in the user's home directory.
* `dir` with `opts.latest: false` - Store as SLEEP files, including storing the content as a `content.data` file. This is useful for storing all history in a single flat file.
* `dir` with `opts.temp: true` - Store everything in memory (including files).
* `storage` function - pass a custom storage function along to ddrive, see dwebx-storage for an example.

Most options are passed directly to the module you're using (e.g. `dwebx.importFiles(opts)`. However, there are also some initial `opts` can include:

```js
opts = {
  key: '<dwebx-key>', // existing key to create archive with or resume
  temp: false, // Use random-access-memory as the storage.

  // DDrive options
  sparse: false // download only files you request
}
```

The callback, `cb(err, dwebx)`, includes a `dwebx` object that has the following properties:

* `dwebx.key`: key of the dwebx (this will be set later for non-live archives)
* `dwebx.archive`: DDrive archive instance.
* `dwebx.path`: Path of the DWebX Archive
* `dwebx.live`: `archive.live`
* `dwebx.writable`: Is the `archive` writable?
* `dwebx.resumed`: `true` if the archive was resumed from an existing database
* `dwebx.options`: All options passed to DWebX and the other submodules

### Module Interfaces

**`dwebx-node` provides an easy interface to common DWebX modules for the created DWebX Archive on the `dwebx` object provided in the callback:**

#### `var network = dwebx.joinNetwork([opts], [cb])`

Join the network to start transferring data for `dwebx.key`, using [discovery-swarm](https://github.com/distributedweb/discovery-swarm). You can also use `dwebx.join([opts], [cb])`.

If you specify `cb`, it will be called *when the first round* of discovery has completed. This is helpful to check immediately if peers are available and if not fail gracefully, more similar to http requests.

Returns a `network` object with properties:

* `network.connected` - number of peers connected
* `network.on('listening')` - emitted with network is listening
* `network.on('connection', connection, info)` - Emitted when you connect to another peer. Info is an object that contains info about the connection

##### Network Options

`opts` are passed to discovery-swarm, which can include:

```js
opts = {
  upload: true, // announce and upload data to other peers
  download: true, // download data from other peers
  port: 1776, // port for discovery swarm
  utp: true, // use utp in discovery swarm
  tcp: true // use tcp in discovery swarm
}

//Defaults from dwebx-config can also be overwritten:

opts = {
  dns: {
    server: // DNS server
    domain: // DNS domain
  }
  dht: {
    bootstrap: // distributed hash table bootstrapping nodes
  }
}
```

Returns a [discovery-swarm](https://github.com/distributedweb/discovery-swarm) instance.

#### `dwebx.leaveNetwork()` or `dwebx.leave()`

Leaves the network for the archive.

#### `var importer = dwebx.importFiles([src], [opts], [cb])`

**Archive must be writable to import.**

Import files to your DWebX Archive from the directory using [mirror-folder](https://github.com/distributedweb/mirror-folder/).

* `src` - By default, files will be imported from the folder where the archive was initiated. Import files from another directory by specifying `src`.
* `opts` - options passed to mirror-folder (see below).
* `cb` - called when import is finished.

Returns a `importer` object with properties:

* `importer.on('error', err)`
* `importer.on('put', src, dest)` - file put started. `src.live` is true if file was added by file watch event.
* `importer.on('put-data', chunk)` - chunk of file added
* `importer.on('put-end', src, dest)` - end of file write stream
* `importer.on('del', dest)` - file deleted from dest
* `importer.on('end')` - Emits when mirror is done (not emitted in watch mode)
* If `opts.count` is true:
  * `importer.on('count', {files, bytes})` - Emitted after initial scan of src directory. See import progress section for details.
  * `importer.count` will be `{files, bytes}` to import after initial scan.
  * `importer.putDone` will track `{files, bytes}` for imported files.

##### Importer Options

Options include:

```js
var opts = {
  count: true, // do an initial dry run import for rendering progress
  ignoreHidden: true, // ignore hidden files  (if false, .dwebx will still be ignored)
  ignoreDirs: true, // do not import directories (ddrive does not need them and it pollutes metadata)
  useDatIgnore: true, // ignore entries in the `.dwebxignore` file from import dir target.
  ignore: // (see below for default info) anymatch expression to ignore files
  watch: false, // watch files for changes & import on change (archive must be live)
}
```

##### Ignoring Files

You can use a `.dwebxignore` file in the imported directory, `src`, to ignore any the user specifies. This is done by default.

`dwebx-node` uses [dwebx-ignore](https://github.com/joehand/dwebx-ignore) to provide a default ignore option, ignoring the `.dwebx` folder and all hidden files or directories. Use `opts.ignoreHidden = false` to import hidden files or folders, except the `.dwebx` directory.

*It's important that the `.dwebx` folder is not imported because it contains a private key that allows the owner to write to the archive.*

#### `var stats = dwebx.trackStats()`

##### `stats.on('update')`

Emitted when archive stats are updated. Get new stats with `stats.get()`.

##### `var st = dwebx.stats.get()`

`dwebx.trackStats()` adds a `stats` object to `dwebx`.  Get general archive stats for the latest version:

```js
{
  files: 12,
  byteLength: 1234,
  length: 4, // number of blocks for latest files
  version: 6, // archive.version for these stats
  downloaded: 4 // number of downloaded blocks for latest
}
```

##### `stats.network`

Get upload and download speeds: `stats.network.uploadSpeed` or `stats.network.downloadSpeed`. Transfer speeds are tracked using [ddrive-network-speed](https://github.com/joehand/ddrive-network-speed/).

##### `var peers = stats.peers`

* `peers.total` - total number of connected peers
* `peers.complete` - connected peers with all the content data

#### `var server = dwebx.serveHttp(opts)`

Serve files over http via [ddrive-http](https://github.com/joehand/ddrive-http). Returns a node http server instance.

```js
opts = {
  port: 8080, // http port
  live: true, // live update directory index listing
  footer: 'Served via DWebX.', // Set a footer for the index listing
  exposeHeaders: false // expose dwebx key in headers
}
```

#### `dwebx.pause()`

Pause all upload & downloads. Currently, this is the same as `dwebx.leaveNetwork()`, which leaves the network and destroys the swarm. Discovery will happen again on `resume()`.

#### `dwebx.resume()`

Resume network activity. Current, this is the same as `dwebx.joinNetwork()`.

#### `dwebx.close(cb)`

Stops replication and closes all the things opened for dwebx-node, including:

* `dwebx.archive.close(cb)`
* `dwebx.network.close(cb)`
* `dwebx.importer.destroy()` (file watcher)

## License

MIT

[0]: https://img.shields.io/npm/v/dwebx-node.svg?style=flat-square
[1]: https://npmjs.org/package/dwebx-node
[2]: https://img.shields.io/travis/datproject/dwebx-node/master.svg?style=flat-square
[3]: https://travis-ci.org/datproject/dwebx-node
[4]: https://img.shields.io/codecov/c/github/datproject/dwebx-node/master.svg?style=flat-square
[5]: https://codecov.io/github/datproject/dwebx-node
