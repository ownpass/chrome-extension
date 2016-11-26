module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        clean: {
            build: [
                'build/unpacked/',
                'build/packed/'
            ]
        },
        concat: {
            options: {
                separator: ";\n"
            },
            background: {
                src: [
                    'node_modules/jquery/dist/jquery.min.js',
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
            }
        },
        compress: {
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
        },
        copy: {
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
        },
        crx: {
            build: {
                'src': 'build/unpacked/',
                'crx': 'build/packed/<%= pkg.name %>.crx',
                'privateKey': '<%= pkg.name %>.pem',
                'publicKey': 'build/packed/<%= pkg.name %>.pub',
                'zip': 'build/packed/<%= pkg.name %>.zip'
            }
        },
        exec: {
            'browserify-worker': 'browserify js/worker.js -o build/unpacked/js/ownpass-extension-worker.js'
        },
        jshint: {
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
        },
        sass: {
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
        },
        uglify: {
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
            }
        },
        watch: {
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
        }
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-exec');

    grunt.registerTask('update-manifest', 'Updates the manifest file with the needed information.', function () {
        var manifest = grunt.file.readJSON('build/unpacked/manifest.json');
        var package = grunt.file.readJSON('package.json');

        if (!manifest.name) {
            manifest.name = package.name;
        }

        if (!manifest.short_name) {
            manifest.short_name = package.name;
        }

        if (!manifest.version) {
            manifest.version = package.version;
        }

        grunt.file.write('build/unpacked/manifest.json', JSON.stringify(manifest, undefined, 4));
    });

    grunt.registerMultiTask('crx', 'Builds the CRX file.', function () {
        var fs = require('fs');
        var NodeRSA = require('node-rsa');
        var privateKey, privateRsaKey, publicKey;

        if (grunt.file.exists(this.data.privateKey)) {
            grunt.log.writeln('Loading private key from ' + this.data.privateKey);

            privateKey = fs.readFileSync(this.data.privateKey);
            privateRsaKey = new NodeRSA(privateKey);
            publicKey = privateRsaKey.exportKey('pkcs8-public-der');
        } else {
            grunt.log.writeln('Writing private key to ' + this.data.privateKey);

            privateRsaKey = new NodeRSA({b: 4096});
            privateKey = privateRsaKey.exportKey('pkcs8-private');
            publicKey = privateRsaKey.exportKey('pkcs8-public-der');

            fs.writeFileSync(this.data.privateKey, privateKey);
        }

        var contents = fs.readFileSync(this.data.zip);
        var signature = new Buffer(
            require("crypto")
                .createSign("sha1")
                .update(contents)
                .sign(privateKey),
            "binary"
        );

        var keyLength = publicKey.length;
        var sigLength = signature.length;
        var zipLength = contents.length;
        var length = 16 + keyLength + sigLength + zipLength;

        var crx = new Buffer(length);
        crx.write("Cr24" + new Array(13).join("\x00"), "binary");

        crx[4] = 2;
        crx.writeUInt32LE(keyLength, 8);
        crx.writeUInt32LE(sigLength, 12);

        publicKey.copy(crx, 16);
        signature.copy(crx, 16 + keyLength);
        contents.copy(crx, 16 + keyLength + sigLength);

        fs.writeFileSync(this.data.crx, crx);
        fs.writeFileSync(this.data.publicKey, publicKey);
    });

    grunt.registerTask('build-unpacked', [
        'clean',
        'jshint',
        'concat',
        'exec:browserify-worker',
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

    grunt.registerTask('default', [
        'build-unpacked',
        'build-packed'
    ]);
};
