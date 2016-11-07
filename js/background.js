var remindedUnauthenticated = false, handler;

function sendMessageToContent(msg) {
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, function (tabs) {
        for (var i = 0; i < tabs.length; ++i) {
            chrome.tabs.sendMessage(tabs[i].id, msg);
        }
    });
}

function Handler() {
    this.displayReminder = function (msg, sender, callback) {
        var notification;

        if (remindedUnauthenticated) {
            callback();
            return;
        }

        remindedUnauthenticated = true;

        notification = new Notification('OwnPass', {
            icon: 'images/icon-48.png',
            body: 'You are not authenticated so passwords are not managed.'
        });

        setTimeout(function () {
            notification.close();
        }, 3000);

        callback();

        return false;
    };

    this.hasIdentity = function (msg, sender, callback) {
        var token = JSON.parse(window.localStorage.getItem('oauth-token'));
        var deviceIds = JSON.parse(window.localStorage.getItem('device-ids'));
        var deviceId, deviceActivated = false;

        if (!token) {
            callback({
                authenticated: false,
                deviceActivated: false,
                deviceId: null
            });

            return false;
        }

        if (deviceIds && deviceIds[token.username]) {
            deviceActivated = deviceIds[token.username].activated;
            deviceId = deviceIds[token.username].id;
        }

        callback({
            authenticated: true,
            deviceActivated: deviceActivated,
            deviceId: deviceId
        });

        return false;
    };

    this.login = function (msg, sender, callback) {
        $.ajax({
            url: msg.server + '/oauth',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            data: JSON.stringify({
                grant_type: 'password',
                client_id: 'chrome-extension',
                username: msg.username,
                password: msg.password
            }),
            dataType: 'json',
            error: function (jqXHR) {
                callback({
                    error: jqXHR.responseJSON.error_description
                });
            },
            success: function (data) {
                var deviceIds, deviceId, deviceActivated = false;

                data.server = msg.server;
                data.username = msg.username;

                window.localStorage.setItem('oauth-token', JSON.stringify(data));

                deviceIds = JSON.parse(window.localStorage.getItem('device-ids'));

                if (deviceIds && deviceIds[msg.username]) {
                    deviceId = deviceIds[msg.username].id;
                    deviceActivated = deviceIds[msg.username].activated;
                }

                if (deviceActivated) {
                    sendMessageToContent({
                        cmd: 'ownpass-activated'
                    });
                }

                callback({
                    deviceActivated: deviceActivated,
                    deviceId: deviceId,
                    token: data
                });
            }
        });

        return true;
    };

    this.logout = function (msg, sender, callback) {
        window.localStorage.removeItem('oauth-token');

        sendMessageToContent({
            cmd: 'ownpass-deactivated'
        });

        callback();

        return false;
    };

    this.forgetDevice = function (msg, sender, callback) {
        var token = JSON.parse(window.localStorage.getItem('oauth-token'));
        var deviceIds = JSON.parse(window.localStorage.getItem('device-ids'));

        delete deviceIds[token.username];

        window.localStorage.setItem('device-ids', JSON.stringify(deviceIds));

        callback();
    };

    this.activateDevice = function (msg, sender, callback) {
        var token = JSON.parse(window.localStorage.getItem('oauth-token'));

        $.ajax({
            url: token.server + '/device/activate',
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token.access_token,
                'Content-Type': 'application/json'
            },
            data: JSON.stringify({
                code: msg.code
            }),
            dataType: 'json',
            error: function (jqXHR) {
                callback({
                    error: jqXHR.responseJSON.detail
                });
            },
            success: function () {
                var deviceIds = JSON.parse(window.localStorage.getItem('device-ids'));

                deviceIds[token.username].activated = true;

                window.localStorage.setItem('device-ids', JSON.stringify(deviceIds));

                callback({
                    error: false
                });
            }
        });

        return true;
    };

    this.registerDevice = function (msg, sender, callback) {
        var token = JSON.parse(window.localStorage.getItem('oauth-token'));
        var deviceIds = JSON.parse(window.localStorage.getItem('device-ids'));

        $.ajax({
            url: token.server + '/device',
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token.access_token,
                'Content-Type': 'application/json'
            },
            data: JSON.stringify({
                name: 'Chrome Extension',
                description: msg.description
            }),
            dataType: 'json',
            error: function (jqXHR) {
                callback({
                    status: jqXHR.status,
                    error: jqXHR.responseJSON.error_description
                });
            },
            success: function (data) {
                if (!deviceIds) {
                    deviceIds = {};
                }

                deviceIds[token.username] = {
                    id: data.id,
                    activated: false
                };

                window.localStorage.setItem('device-ids', JSON.stringify(deviceIds));

                callback({
                    deviceId: data.id
                });
            }
        });
        return false;
    };

    this.activateAccount = function (msg, sender, callback) {
        $.ajax({
            url: msg.server + '/account/activate',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            data: JSON.stringify({
                activation_code: msg.code,
                credential: msg.credential
            }),
            dataType: 'json',
            error: function (jqXHR) {
                callback({
                    status: jqXHR.status,
                    error: jqXHR.responseJSON.detail
                });
            },
            success: function (data) {
                callback(data);
            }
        });

        return true;
    };

    this.recoverAccount = function (msg, sender, callback) {
        $.ajax({
            url: msg.server + '/account/deactivate',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            data: JSON.stringify({
                email_address: msg.email
            }),
            dataType: 'json',
            error: function (jqXHR) {
                callback({
                    status: jqXHR.status,
                    error: jqXHR.responseJSON.error_description
                });
            },
            success: function (data) {
                callback(data);
            }
        });

        return true;
    };

    this.formSubmit = function (msg, sender, callback) {
        var token = JSON.parse(window.localStorage.getItem('oauth-token'));
        var deviceIds = JSON.parse(window.localStorage.getItem('device-ids'));

        $.ajax({
            url: token.server + '/user/credential',
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token.access_token,
                'Content-Type': 'application/json',
                'X-OwnPass-Device': deviceIds[token.username].id
            },
            data: JSON.stringify({
                raw_url: msg.url,
                title: msg.title,
                identity: 'TODO',
                credential: 'TODO',
                description: ''
            }),
            dataType: 'json',
            error: function (jqXHR) {
                console.log(jqXHR);
                callback();
            },
            success: function (data) {
                console.log(data);
                callback();
            }
        });

        return true;
    };
}

handler = new Handler();

chrome.runtime.onMessage.addListener(function (msg, sender, callback) {
    var result = false;

    switch (msg.cmd) {
        case 'ownpass-document-form-submit':
            result = handler.formSubmit(msg, sender, callback);
            break;

        case 'ownpass-remind-unauthenticated':
            result = handler.displayReminder(msg, sender, callback);
            break;

        case 'ownpass-has-identity':
            result = handler.hasIdentity(msg, sender, callback);
            break;

        case 'ownpass-login':
            result = handler.login(msg, sender, callback);
            break;

        case 'ownpass-logout':
            result = handler.logout(msg, sender, callback);
            break;

        case 'ownpass-forget-device':
            result = handler.forgetDevice(msg, sender, callback);
            break;

        case 'ownpass-activate-device':
            result = handler.activateDevice(msg, sender, callback);
            break;

        case 'ownpass-register-device':
            result = handler.registerDevice(msg, sender, callback);
            break;

        case 'ownpass-activate-account':
            result = handler.activateAccount(msg, sender, callback);
            break;

        case 'ownpass-recover-account':
            result = handler.recoverAccount(msg, sender, callback);
            break;
    }

    return result;
});
