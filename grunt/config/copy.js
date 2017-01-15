// https://github.com/gruntjs/grunt-contrib-copy
module.exports = {
    fonts: {
        files: [
            {
                src: 'node_modules/ownpass-pattern-library/build/fonts/Rokkitt.woff2',
                dest: 'build/unpacked/fonts/Rokkitt.woff2'
            }
        ]
    },
    html: {
        files: [
            {
                expand: true,
                cwd: 'html/',
                src: ['**/*.html'],
                dest: 'build/unpacked/html/'
            }
        ]
    },
    images: {
        files: [
            {
                expand: true,
                cwd: 'images/',
                src: ['**'],
                dest: 'build/unpacked/images'
            }
        ]
    },
    resources: {
        files: [
            {
                src: 'manifest.json',
                dest: 'build/unpacked/manifest.json'
            }
        ]
    }
};
