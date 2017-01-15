module.exports = {
    build: {
        'src': 'build/unpacked/',
        'crx': 'build/packed/<%= pkg.name %>.crx',
        'privateKey': 'config/<%= pkg.name %>.pem',
        'publicKey': 'build/packed/<%= pkg.name %>.pub',
        'zip': 'build/packed/<%= pkg.name %>.zip'
    }
};
