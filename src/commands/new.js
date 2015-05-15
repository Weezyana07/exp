var fs = require('fs');
var instapromise = require('instapromise');
var path = require('path');

var spawnAsync = require('@exponent/spawn-async');

var CommandError = require('./CommandError');
var log = require('../log');

module.exports = {
  name: 'new',
  description: "Sets up a new project",
  help: "",
  runAsync: async function (env) {
    var argv = env.argv;
    var args = argv._;


    // Here is what this will do

    // 0. If there is a command line argument, make a new directory in the current directory and chdir to it
    var dirName = args[1];
    if (dirName) {
      await fs.promise.mkdir(dirName)
      process.chdir(dirName);
    }

    // 1. If there is no package.json in the current directory, run npm init
    var pkgJsonFile = 'package.json';
    var pkgFile;
    try {
      pkgFile = await fs.promise.readFile(pkgJsonFile);
    } catch (e) {

      // No package.json, so let's create it
      log("No package.json file found. Using `npm init` to help you create one.");
      var zero = await spawnAsync('npm', ['init'], {stdio: 'inherit'});
      pkgFile = await fs.promise.readFile(pkgJsonFile);
    }

    try {
      var pkg = JSON.parse(pkgFile);
    } catch (e) {
      throw CommandError('INVALID_PACKAGE_JSON', env, "Invalid package.json: " + e);
    }

    var entryPoint = pkg.main || 'index.js';

    // 2. Figure out the entry point of the app. Try to create that file with the template
    //    ... but fail if it already exist

    var js = await fs.promise.readFile(path.join(__dirname, '..', '..', 'example', 'main.js'), 'utf8');
    try {
      await fs.promise.writeFile(entryPoint, js, {encoding: 'utf8', flag: 'wx'});
    } catch (e) {
      throw CommandError('ENTRY_POINT_EXISTS', env, "The entry point (" + entryPoint + ") already exists; refusing to overwrite it.\n" + e + "\nDelete that file and rerun `exp new` to try again.");
    }

    log("Created an entry point for your app at", entryPoint);

  },
};