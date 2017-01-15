// https://github.com/c301/grunt-webstore-upload
module.exports = function (grunt) {
    var json = grunt.file.readJSON('config/webstore.json');

    return {
        "accounts": {
            "default": {
                publish: true,
                client_id: json.client_id,
                client_secret: json.client_secret,
                refresh_token: json.refresh_token
            }
        },
        "extensions": {
            "ownpass": {
                appID: json.extension_id,
                zip: "build/packed/ownpass-chrome-extension.zip"
            }
        }
    };
};
