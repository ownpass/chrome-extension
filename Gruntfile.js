module.exports = function (grunt) {
    'use strict';

    var project = {
        pkg: grunt.file.readJSON('package.json'),
        paths: {
            get config() {
                return 'grunt/config/';
            }
        },
        files: {
            get config() {
                return project.paths.config + '*.js';
            },
            grunt: 'Gruntfile.js'
        }
    };

    require('load-grunt-config')(grunt, {
        configPath: require('path').join(process.cwd(), project.paths.config),
        data: project
    });

    grunt.loadTasks('grunt/tasks/');

    grunt.registerTask('build-unpacked', [
        'clean',
        'jshint',
        'concat',
        'uglify',
        'sass',
        'copy',
        'update-manifest'
    ]);

    grunt.registerTask('build-packed', [
        'build-unpacked',
        'compress',
        'crx'
    ]);

    grunt.registerTask('publish', [
        'webstore_upload'
    ]);

    grunt.registerTask('default', [
        'build-unpacked',
        'build-packed'
    ]);
};
