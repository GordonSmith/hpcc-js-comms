"use strict";
const argv = require('yargs').argv;
const gulp = require('gulp');
const bump = require('gulp-bump');
const filter = require('gulp-filter');
const git = require('gulp-git');
const replace = require('gulp-replace');
const tag_version = require('gulp-tag-version');
/*
const fs = require('fs')
const gutil = require('gulp-util')
const path = require('path')
const _ = require('lodash')
const async = require('async')
const rjs = require('requirejs')
const minifyCss = require('gulp-minify-css')
const concatCss = require('gulp-concat-css')
const sort = require('gulp-natural-sort')
const dir = require('node-dir')
const del = require('del');
const jshint = require('gulp-jshint');
const jscs = require('gulp-jscs');
const mochaPhantomJS = require('gulp-mocha-phantomjs');
*/

//  Bumping / tagging  ---
gulp.task("bump-packages", [], function () {
    var args = {};
    if (argv.version) {
        args.version = argv.version;
    } else if (argv.type) {
        args.type = argv.type;
    } else if (argv.major) {
        args.type = "major";
    } else if (argv.minor) {
        args.type = "minor";
    } else {
        args.type = "patch";
    }
    return gulp.src(["./package.json"])
        .pipe(bump(args))
        .pipe(gulp.dest("./"))
        ;
});

gulp.task("bump", ["bump-packages"], function () {
    const npmPackage = require('./package.json');
    return gulp.src(["./src/index.ts"])
        .pipe(replace(/export const version = "(.*?)";/, "export const version = \"" + npmPackage.version + "\";"))
        .pipe(gulp.dest("./src/"))
        ;
});

const TAG_FILES = ["./package.json", "./src/index.ts", "./lib"];
gulp.task("git-create-branch", function (cb) {
    var version = require("./package.json").version;
    git.checkout("b" + version, { args: "-b" }, cb);
});

gulp.task("git-add-dist", ["git-create-branch"], function (cb) {
    return gulp.src(TAG_FILES)
        .pipe(git.add({ args: "-f" }))
        ;
});

gulp.task("tag", ["git-add-dist"], function () {
    var version = require("./package.json").version;
    return gulp.src(TAG_FILES)
        .pipe(git.commit("Release " + version + "\n\nTag for release.\nAdd dist files.\n", { args: "-s" }))
        .pipe(filter("package.json"))
        .pipe(tag_version())
        ;
});

gulp.task("tag-release", ["tag"], function (cb) {
    var version = require("./package.json").version;
    var target = argv.upstream ? "upstream" : "origin"
    git.push(target, 'b' + version, function (err) {
        if (err) {
            cb(err);
        } else {
            git.push(target, 'v' + version, function (err) {
                cb(err);
            });
        }
    });
});
