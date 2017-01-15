module.exports = function (grunt) {
    "use strict";

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
};
