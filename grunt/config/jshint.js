// https://github.com/gruntjs/grunt-contrib-jshint
module.exports = function (grunt) {
    return {
        options: grunt.file.readJSON('jshint.json'),
        all: {
            src: [
                'package.json',
                'Gruntfile.js',
                'jshint.json',
                'tsconfig.json',
                'typings.json',
                'js/**/*.js'
            ]
        }
    };
};
