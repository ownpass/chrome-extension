// https://github.com/gruntjs/grunt-contrib-watch
module.exports = {
    build: {
        files: [
            'html/**/*.html',
            'js/**/*.js',
            'scss/**/*.scss',
            'manifest.json',
            'Gruntfile.js',
            'package.json'
        ],
        tasks: ['build-unpacked'],
        options: {
            spawn: false
        }
    }
};
