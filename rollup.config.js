var rollup = require('rollup');
var nodeResolve = require('rollup-plugin-node-resolve');
var commonjs = require("rollup-plugin-commonjs");
var css = require('rollup-plugin-css-only');
var alias = require('rollup-plugin-alias');
var uglify = require('rollup-plugin-uglify');
var sourcemaps = require('rollup-plugin-sourcemaps');

var dependencies = require("./package.json").dependencies;

var config = {
    entry: './lib-es6/index-browser.js',
    format: "umd",
    moduleName: "HPCCComms",
    dest: "./lib-browser/index.js",
    sourceMap: true,
    external: [],
    globals: {},
    plugins: [
        alias({}),
        nodeResolve({
            jsnext: true,
            main: true
        }),
        commonjs({}),
        css({}),
        sourcemaps()
    ]
};

console.log("Rollup " + process.env.BUILD + " for " + process.env.RUNTIME);
var entry = "index";
var dest = "comms";

switch (process.env.RUNTIME) {
    case "node":
        entry += "-node";
        config.format = "cjs";
        console.log("Externals:  " + Object.keys(dependencies));
        config.external = Object.keys(dependencies);
        break;
    case "browser":
        entry += "-browser";
        dest += '-browser';
        break;
}

switch (process.env.BUILD) {
    case "src":
        entry = "src/" + entry;
        break;
    case "test":
        entry = "test/" + entry;
        dest += "-test";
        config.external.push("chai");
        config.globals.chai = "chai";
        break;
}



/*
switch (process.env.NODE_ENV) {
    case "min":
        config.dest = "./lib-browser/index.min.js";
        config.plugins.push(uglify({}));
        break;
    case "watch":
    case "testXXX":
        config.entry = "./tmp-test-es6/test/index.js";
        config.dest = "./lib-browser/index.test.js";
        config.external.push("chai");
        config.globals.chai = "chai";
        break;
    default:
}
*/


if (process.env.PACKAGE === "min") {
    dest += ".min";
    config.plugins.push(uglify({}));
}

config.entry = "./tmp/" + entry + ".js";
config.dest = "./lib/" + dest + ".js";

module.exports = config;
