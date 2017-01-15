// https://github.com/gruntjs/grunt-contrib-concat
module.exports = {
    build: {
        options: {
            archive: 'build/packed/<%= pkg.name %>.zip',
            mode: 'zip',
            pretty: true
        },
        files: [
            {
                expand: true,
                cwd: 'build/unpacked/',
                src: ['**'],
                dest: ''
            }
        ]
    }
};
