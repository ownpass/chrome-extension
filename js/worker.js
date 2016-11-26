/*
var rsaCreate = function (data) {
    var bits = data.bits || 4096, key, privateKey, publicKey;

    // Creating a new key, this will invoke the creation algoritm. Creating the key
    // can take about 2 minutes.
    console.log('Creating a new ' + bits + ' bits key.');
    key = new NodeRSA({b: bits});

    // Export the keys
    privateKey = key.exportKey('pkcs8-private');
    publicKey = key.exportKey('pkcs8-public');

    self.postMessage({
        cmd: data.cmd,
        privateKey: privateKey,
        publicKey: publicKey
    });

    console.log('Finished creating the keys.');
};

var rsaEncrypt = function (data) {
    var encoding = data.encoding || 'base64';
    var key = new NodeRSA();

    console.log('Importing public key...');
    key.importKey(data.publicKey, 'pkcs8-public');

    console.log('Encrypting data...');
    self.postMessage({
        cmd: data.cmd,
        result: key.encrypt(data.raw, encoding)
    });
};

var rsaDecrypt = function (data) {
    var encoding = data.encoding || 'utf8', key;

    console.log('Importing private key...');
    key = new NodeRSA(data.privateKey);

    console.log('Decrypting data...');
    self.postMessage({
        cmd: data.cmd,
        result: key.decrypt(data.encrypted, encoding)
    });
};*/

var encrypt = function (data) {
    self.postMessage({
        original: data,
        cmd: data.cmd,
        result: data.value
    });
};

var decrypt = function (data) {
    self.postMessage({
        original: data,
        cmd: data.cmd,
        result: data.value
    });
};

self.addEventListener('message', function (e) {
    var cmd = e.data.cmd || null;

    switch (cmd) {
        // case 'rsa-create':
        //     rsaCreate(e.data);
        //     break;
        //
        // case 'rsa-encrypt':
        //     rsaEncrypt(e.data);
        //     break;
        //
        // case 'rsa-decrypt':
        //     rsaDecrypt(e.data);
        //     break;

        case 'encrypt':
            encrypt(e.data);
            break;

        case 'decrypt':
            decrypt(e.data);
            break;

        default:
            console.error('Invalid command provided: ' + e.data);
            break;
    }
}, false);
