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
    this.displayReminder = function(msg, sender, callback) {
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

        if (!token) {
            callback({
                authenticated: false,
                validDevice: false
            });

            return false;
        }

        callback({
            authenticated: true,
            validDevice: deviceIds ? !!deviceIds[token.username] : false
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
            error : function (jqXHR) {
                callback({
                    error: jqXHR.responseJSON.error_description
                });
            },
            success: function(data) {
                var deviceIds, deviceId;

                data.server = msg.server;
                data.username = msg.username;

                window.localStorage.setItem('oauth-token', JSON.stringify(data));

                deviceIds = JSON.parse(window.localStorage.getItem('device-ids'));
                deviceId = deviceIds ? deviceIds[msg.username] : false;

                if (deviceId) {
                    sendMessageToContent({
                        cmd: 'ownpass-activated'
                    });
                }

                callback({
                    validDevice: !!deviceId,
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

    this.activateDevice = function (msg, sender, callback) {
        callback();
        return false;
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
            error : function (jqXHR) {
                callback({
                    status: jqXHR.status,
                    error: jqXHR.responseJSON.error_description
                });
            },
            success: function(data) {
                if (!deviceIds) {
                    deviceIds = {};
                }

                deviceIds[token.username] = data.id;

                window.localStorage.setItem('device-ids', JSON.stringify(deviceIds));

                callback({
                    deviceId: data.id
                });
            }
        });
        return false;
    };
}

function handleFormSubmission(msg, sender, callback) {
    console.log(msg);
    console.log(sender);
    console.log(callback);

    callback();
}

handler = new Handler();

chrome.runtime.onMessage.addListener(function (msg, sender, callback) {
    var result = false;

    switch (msg.cmd) {
        case 'ownpass-document-form-submit':
            handleFormSubmission(msg, sender, callback);
            callback();
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

        case 'ownpass-activate-device':
            result = handler.activateDevice(msg, sender, callback);
            break;

        case 'ownpass-register-device':
            result = handler.registerDevice(msg, sender, callback);
            break;
    }

    return result;
});
