// https://github.com/gruntjs/grunt-contrib-concat
module.exports = {
    options: {
        separator: ";\n"
    },
    background: {
        src: [
            'node_modules/jquery/dist/jquery.min.js',
            'node_modules/crypto-js/crypto-js.js',
            'js/background.js'
        ],
        dest: 'build/unpacked/js/ownpass-extension-background.js'
    },
    content: {
        src: [
            'js/content.js'
        ],
        dest: 'build/unpacked/js/ownpass-extension-content.js'
    },
    popup: {
        src: [
            'node_modules/jquery/dist/jquery.min.js',
            'js/popup.js'
        ],
        dest: 'build/unpacked/js/ownpass-extension-popup.js'
    },
    worker: {
        src: [
            'node_modules/crypto-js/crypto-js.js',
            'js/worker.js'
        ],
        dest: 'build/unpacked/js/ownpass-extension-worker.js'
    }
};
