/*jshint camelcase: false*/

module.exports = function (grunt) {
  'use strict';

  grunt.loadNpmTasks('grunt-node-webkit-builder');

  grunt.initConfig({
    nodewebkit: {
      options: {
          platforms: ['osx'],
          buildDir: './webkitbuilds', // Where the build version of my node-webkit app is saved
          macIcns: './app/assets/sleepicon.icns'
      },
      src: ['./app/**/*'] // Your node-webkit app
    },
  })
};
