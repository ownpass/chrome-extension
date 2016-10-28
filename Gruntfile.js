module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        browserify: {
            dist: {
                files: {
                    'build/ng-compiled/ownpass-chrome-extension.js': [
                        'build/ng-compiled/main.js'
                    ]
                }
            }
        },
        clean: {
            build: [
                'build/unpacked/',
                'build/packed/',
                'build/ng-compiled/'
            ]
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
                    },
                ]
            }
        },
        copy: {
            html: {
                files: [
                    {
                        expand: true,
                        cwd: 'src/html/',
                        src: ['**/*.html'],
                        dest: 'build/unpacked/html/'
                    }
                ]
            },
            images: {
                files: [
                    {
                        expand: true,
                        cwd: 'src/images/',
                        src: ['**'],
                        dest: 'build/unpacked/images'
                    }
                ]
            },
            js: {
                files: [
                    {
                        expand: true,
                        cwd: 'src/js/',
                        src: ['**'],
                        dest: 'build/unpacked/js'
                    }
                ]
            },
            libs: {
                files: [
                    {
                        src: 'node_modules/jquery/dist/jquery.min.js',
                        dest: 'build/unpacked/js/jquery.min.js'
                    },
                    {
                        src: 'node_modules/zone.js/dist/zone.js',
                        dest: 'build/unpacked/js/zone.js'
                    },
                    {
                        src: 'node_modules/reflect-metadata/Reflect.js',
                        dest: 'build/unpacked/js/Reflect.js'
                    },
                    {
                        src: 'build/ng-compiled/ownpass-chrome-extension.js',
                        dest: 'build/unpacked/js/ownpass-chrome-extension.js'
                    },
                    {
                        src: 'build/ng-compiled/ownpass-chrome-extension.min.js',
                        dest: 'build/unpacked/js/ownpass-chrome-extension.min.js'
                    }
                ]
            },
            resources: {
                files: [
                    {
                        src: 'src/resources/manifest.json',
                        dest: 'build/unpacked/manifest.json'
                    }
                ]
            }
        },
        crx: {
            build: {
                "src": "build/unpacked/",
                "crx": "build/packed/<%= pkg.name %>.crx",
                "privateKey": "<%= pkg.name %>.pem",
                "publicKey": "build/packed/<%= pkg.name %>.pub",
                "zip": "build/packed/<%= pkg.name %>.zip"
            }
        },
        jshint: {
            options: grunt.file.readJSON('jshint.json'),
            all: {
                src: [
                    'package.json',
                    'Gruntfile.js',
                    'jshint.json',
                    'src/**/*.js',
                    'src/**/*.json'
                ]
            }
        },
        sass: {
            build: {
                options: {
                    style: 'expanded'
                },
                files: {
                    'build/unpacked/css/ownpass-chrome-extension.css': 'src/scss/application.scss'
                }
            }
        },
        ts: {
            build: {
                tsconfig: true
            }
        },
        uglify: {
            build: {
                files: {
                    'build/ng-compiled/ownpass-chrome-extension.min.js': [
                        'build/ng-compiled/ownpass-chrome-extension.js'
                    ]
                }
            }
        },
        watch: {
            build: {
                files: [
                    'src/**/*.css',
                    'src/**/*.html',
                    'src/**/*.js',
                    'src/**/*.json',
                    'src/**/*.ts',
                    'Gruntfile.js',
                    'package.json'
                ],
                tasks: ['build-unpacked'],
                options: {
                    spawn: false,
                },
            }
        }
    });

    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks("grunt-ts");

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

            privateRsaKey = new NodeRSA({b: 2048});
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
        'ts',
        'browserify',
        'sass',
        'copy',
        'update-manifest',
    ]);

    grunt.registerTask('build-packed', [
        'clean',
        'jshint',
        'ts',
        'browserify',
        'uglify',
        'sass',
        'copy',
        'update-manifest',
    ]);

    grunt.registerTask('default', [
        'build-packed'
    ]);
};
