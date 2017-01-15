// https://github.com/gruntjs/grunt-contrib-sass
module.exports = {
    build: {
        options: {
            style: 'compressed',
            loadPath: [
                'node_modules/ownpass-pattern-library/scss/'
            ]
        },
        files: {
            'build/unpacked/css/ownpass-extension.css': 'scss/application.scss'
        }
    }
};
