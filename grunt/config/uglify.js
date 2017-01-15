// https://github.com/gruntjs/grunt-contrib-uglify
module.exports = {
    background: {
        files: {
            'build/unpacked/js/ownpass-extension-background.min.js': [
                'build/unpacked/js/ownpass-extension-background.js'
            ]
        }
    },
    content: {
        files: {
            'build/unpacked/js/ownpass-extension-content.min.js': [
                'build/unpacked/js/ownpass-extension-content.js'
            ]
        }
    },
    popup: {
        files: {
            'build/unpacked/js/ownpass-extension-popup.min.js': [
                'build/unpacked/js/ownpass-extension-popup.js'
            ]
        }
    },
    worker: {
        files: {
            'build/unpacked/js/ownpass-extension-worker.min.js': [
                'build/unpacked/js/ownpass-extension-worker.js'
            ]
        }
    }
};
