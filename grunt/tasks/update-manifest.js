module.exports = function (grunt) {
    "use strict";

    grunt.registerTask('update-manifest', 'Updates the manifest file with the needed information.', function () {
        var manifest = grunt.file.readJSON('build/unpacked/manifest.json');
        var pck = grunt.file.readJSON('package.json');

        if (!manifest.name) {
            manifest.name = pck.name;
        }

        if (!manifest.short_name) {
            manifest.short_name = pck.name;
        }

        if (!manifest.version) {
            manifest.version = pck.version;
        }

        grunt.file.write('build/unpacked/manifest.json', JSON.stringify(manifest, undefined, 4));
    });
};
