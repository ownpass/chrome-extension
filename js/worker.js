function aesEncrypt(password, msg) {
    // Get a 16 byte salt:
    var salt = CryptoJS.lib.WordArray.random(16);

    // Create a PBKDF2 hash:
    var hashSize = 8;
    var hash = CryptoJS.PBKDF2(password, salt, {
        iterations: 5000,
        hasher: CryptoJS.algo.SHA256,
        keySize: hashSize * 2
    });

    // Extract the encryption key and the HMAC key:
    var keyAES = CryptoJS.lib.WordArray.create(hash.words.slice(0, hashSize));
    var keyHMAC = CryptoJS.lib.WordArray.create(hash.words.slice(hashSize));

    // Encryption the message:
    var encrypted = CryptoJS.AES.encrypt(msg, keyAES, {
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
        hasher: CryptoJS.algo.SHA256,
        iv: salt
    });

    var cipherText = CryptoJS.lib.WordArray.create(encrypted.iv.words);
    cipherText.concat(encrypted.ciphertext);

    // Create the cipher text that we are going to create a HMAC value for:
    var hmacStr = CryptoJS.enc.Latin1.parse('aes');
    hmacStr.concat(cipherText);

    var hmac = CryptoJS.HmacSHA256(hmacStr, keyHMAC);

    var result = hmac.toString(CryptoJS.enc.Hex) + cipherText.toString(CryptoJS.enc.Base64);

    return result;
}

function aesDecrypt(password, encrypted) {
    var hmac = encrypted.substr(0, 64);
    var cipherText = encrypted.substr(64);

    var decoded = CryptoJS.enc.Base64.parse(cipherText);
    var decodedHex = decoded.toString(CryptoJS.enc.Hex).substr(0, 16 * 2); // IV is 16 bytes
    var decodedCipher = decoded.toString(CryptoJS.enc.Hex).substr(16 * 2); // IV is 16 bytes

    var iv = CryptoJS.enc.Hex.parse(decodedHex);

    // Create a PBKDF2 hash:
    var hashSize = 8;
    var hash = CryptoJS.PBKDF2(password, iv, {
        iterations: 5000,
        hasher: CryptoJS.algo.SHA256,
        keySize: hashSize * 2,
        salt: iv
    });

    // Extract the encryption key and the HMAC key:
    var keyAES = CryptoJS.lib.WordArray.create(hash.words.slice(0, hashSize));
    var keyHMAC = CryptoJS.lib.WordArray.create(hash.words.slice(hashSize));

    // Create the cipher text that we are going to create a HMAC value for:
    var newHmacVal = CryptoJS.enc.Latin1.parse('aes');
    newHmacVal.concat(decoded);

    var newHmac = CryptoJS.HmacSHA256(newHmacVal, keyHMAC);
    var newHmacStr = CryptoJS.enc.Hex.stringify(newHmac);

    if (newHmacStr !== hmac) {
        return false;
    }
    var cipherTextRaw = CryptoJS.enc.Hex.parse(decodedCipher);

    var decrypted = CryptoJS.AES.decrypt({
        ciphertext: cipherTextRaw
    }, keyAES, {
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
        hasher: CryptoJS.algo.SHA256,
        iv: iv
    });

    return decrypted.toString(CryptoJS.enc.Latin1);
}

var encrypt = function (data) {
    if (!data.password) {
        throw 'No password provided for encryption.';
    }

    if (!data.value) {
        throw 'No value provided for encryption.';
    }

    var encrypted = aesEncrypt(data.password, data.value);

    self.postMessage({
        original: data,
        cmd: data.cmd,
        result: encrypted
    });
};

var decrypt = function (data) {
    if (!data.password) {
        throw 'No password provided for decryption.';
    }

    if (!data.value) {
        throw 'No value provided for decryption.';
    }

    var decrypted = aesDecrypt(data.password, data.value);

    self.postMessage({
        original: data,
        cmd: data.cmd,
        result: decrypted
    });
};

self.addEventListener('message', function (e) {
    var cmd = e.data.cmd || null;

    switch (cmd) {
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
