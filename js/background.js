var remindedUnauthenticated = false;
var handler, menuBuilder;
var credentialsCache = null;
var worker = new Worker(chrome.extension.getURL('js/ownpass-extension-worker.js'));

function sendMessageToContent(msg, options) {
    options = options || {};

    chrome.tabs.query(options, function (tabs) {
        for (var i = 0; i < tabs.length; ++i) {
            chrome.tabs.sendMessage(tabs[i].id, msg);
        }
    });
}

function logout() {
    window.localStorage.removeItem('oauth-token');

    chrome.runtime.sendMessage(null, {
        'cmd': 'ownpass-activate-screen',
        'screen': 'login-screen'
    });

    sendMessageToContent({
        cmd: 'ownpass-update-state',
        state: 'deactivated'
    });

    credentialsCache = null;
    menuBuilder.update();
}

function loadPing() {
    var interval = 1000 * 60 * 30; // Every 30 minutes

    setInterval(function() {
        handler.ping({}, {}, function (response) {
            if (!response.authenticated) {
                logout();
            }
        });
    }, interval);
}

function loadCredentials() {
    var token = JSON.parse(window.localStorage.getItem('oauth-token'));
    var deviceIds = JSON.parse(window.localStorage.getItem('device-ids'));

    var executeSynchronizationRequest = function (url) {
        $.ajax({
            url: url,
            method: 'GET',
            headers: {
                'Authorization': token.token_type + ' ' + token.access_token,
                'X-OwnPass-Device': deviceIds[token.username].id
            },
            dataType: 'json',
            error: function (jqXHR) {
                console.error('An error did occur during the request:', jqXHR);

                if (jqXHR.status === 401) {
                    logout();
                }

                credentialsCache = [];

                sendMessageToContent({
                    cmd: 'ownpass-provide-credentials',
                    credentials: []
                });
            },
            success: function (data) {
                var link = document.createElement('a');

                for (var i = 0; i < data._embedded.user_credential.length; ++i) {
                    link.href = data._embedded.user_credential[i].urlRaw;

                    credentialsCache.push({
                        id: data._embedded.user_credential[i].id,
                        host: link.hostname,
                        identity: data._embedded.user_credential[i].identity,
                        credential: data._embedded.user_credential[i].credential
                    });
                }

                if (data._links.next) {
                    executeSynchronizationRequest(data._links.next);
                } else {
                    menuBuilder.update();

                    sendMessageToContent({
                        cmd: 'ownpass-provide-credentials',
                        credentials: credentialsCache
                    });
                }
            }
        });
    };

    if (credentialsCache !== null || token === null || !deviceIds || !deviceIds[token.username]) {
        return false;
    }

    credentialsCache = [];
    executeSynchronizationRequest(token.server + '/user/credential');
    return true;
}

function MenuBuilder() {
    var contextMenuId,
        useId,
        copyUsernameId,
        copyPasswordId,
        removeId,
        removeAllId,
        useList = [],
        removeList = [],
        copyUsernameList = [],
        copyPasswordList = [];

    var setItemEnabled = function (id, enabled) {
        chrome.contextMenus.update(id, {
            enabled: enabled
        });
    };

    var deleteItems = function (list) {
        for (var i = 0; i < list.length; ++i) {
            chrome.contextMenus.remove(list[i].id);
        }
    };

    var onUse = function (info) {
        for (var i = 0; i < useList.length; ++i) {
            if (useList[i].id === info.menuItemId) {
                sendMessageToContent({
                    cmd: 'ownpass-use',
                    identity: useList[i].identity,
                    credential: useList[i].credential
                }, {
                    active: true
                });

                break;
            }
        }
    };

    var onCopyUsername = function (info) {
        for (var i = 0; i < copyUsernameList.length; ++i) {
            if (copyUsernameList[i].id === info.menuItemId) {
                sendMessageToContent({
                    cmd: 'ownpass-copy-username',
                    value: copyUsernameList[i].value
                }, {
                    active: true
                });

                break;
            }
        }
    };

    var onCopyPassword = function (info) {
        for (var i = 0; i < copyPasswordList.length; ++i) {
            if (copyPasswordList[i].id === info.menuItemId) {
                sendMessageToContent({
                    cmd: 'ownpass-copy-password',
                    value: copyPasswordList[i].value
                }, {
                    active: true
                });

                break;
            }
        }
    };

    var onRemove = function (info) {
        console.log(info);
    };

    var onRemoveAll = function (info) {
        for (var i = 0; i < credentialsCache.length; ++i) {
            console.log(credentialsCache[i]);
        }
        credentialsCache = [];
        console.log(info);
    };

    this.update = function () {
        var hasCredentials = credentialsCache !== null && credentialsCache.length > 0;
        var token = window.localStorage.getItem('oauth-token');

        if (!contextMenuId) {
            contextMenuId = chrome.contextMenus.create({
                title: 'OwnPass',
                contexts: ['editable']
            });
        }

        if (!useId) {
            useId = chrome.contextMenus.create({
                parentId: contextMenuId,
                contexts: ['all'],
                title: 'Use'
            });
        }

        if (!copyUsernameId) {
            copyUsernameId = chrome.contextMenus.create({
                parentId: contextMenuId,
                contexts: ['all'],
                title: 'Copy username'
            });
        }

        if (!copyPasswordId) {
            copyPasswordId = chrome.contextMenus.create({
                parentId: contextMenuId,
                contexts: ['all'],
                title: 'Copy password'
            });
        }

        if (!removeId) {
            removeId = chrome.contextMenus.create({
                parentId: contextMenuId,
                contexts: ['all'],
                title: 'Remove'
            });
        }

        if (!removeAllId) {
            removeAllId = chrome.contextMenus.create({
                parentId: contextMenuId,
                contexts: ['all'],
                title: 'Remove all',
                onclick: onRemoveAll
            });
        }

        setItemEnabled(contextMenuId, token !== null);
        setItemEnabled(useId, hasCredentials);
        setItemEnabled(copyUsernameId, hasCredentials);
        setItemEnabled(copyPasswordId, hasCredentials);
        setItemEnabled(removeId, hasCredentials);
        setItemEnabled(removeAllId, hasCredentials);

        deleteItems(useList);
        deleteItems(copyUsernameList);
        deleteItems(copyPasswordList);
        deleteItems(removeList);

        useList = [];
        copyUsernameList = [];
        copyPasswordList = [];
        removeList = [];

        if (hasCredentials) {
            for (var i = 0; i < credentialsCache.length; ++i) {
                useList.push({
                    id: chrome.contextMenus.create({
                        parentId: useId,
                        contexts: ['all'],
                        title: credentialsCache[i].identity,
                        onclick: onUse
                    }),
                    identity: credentialsCache[i].identity,
                    credential: credentialsCache[i].credential
                });

                copyUsernameList.push({
                    id: chrome.contextMenus.create({
                        parentId: copyUsernameId,
                        contexts: ['all'],
                        title: credentialsCache[i].identity,
                        onclick: onCopyUsername
                    }),
                    value: credentialsCache[i].identity
                });

                copyPasswordList.push({
                    id: chrome.contextMenus.create({
                        parentId: copyPasswordId,
                        contexts: ['all'],
                        title: credentialsCache[i].identity,
                        onclick: onCopyPassword
                    }),
                    value: credentialsCache[i].credential
                });

                removeList.push({
                    id: chrome.contextMenus.create({
                        parentId: removeId,
                        contexts: ['all'],
                        title: credentialsCache[i].identity,
                        onclick: onRemove
                    }),
                    value: i
                });
            }
        }
    };
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

    this.getIdentity = function (msg, sender, callback) {
        var token = JSON.parse(window.localStorage.getItem('oauth-token'));

        callback(token);

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

    this.ping = function (msg, sender, callback) {
        var token = JSON.parse(window.localStorage.getItem('oauth-token'));

        $.ajax({
            url: token.server + '/ping',
            method: 'GET',
            headers: {
                'Authorization': token.token_type + ' ' + token.access_token
            },
            dataType: 'json',
            error: function (jqXHR) {
                console.error('An error did occur during the request:', jqXHR);

                if (jqXHR.status === 401) {
                    logout();
                }

                callback({
                    authenticated: false,
                    jqXhr: jqXHR
                });
            },
            success: function (data) {
                callback({
                    authenticated: true,
                    data: data
                });
            }
        });

        return true;
    };

    var retrieveOAuthToken = function (msg, callback) {
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
                console.error('An error did occur during the request:', jqXHR);

                if (jqXHR.status === 401) {
                    logout();
                }

                callback({
                    error: jqXHR.responseJSON ? jqXHR.responseJSON.error_description : 'Cannot connect to the server'
                });
            },
            success: function (data) {
                var deviceIds, deviceId, deviceActivated = false;

                data.control_panel = msg.control_panel;
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
                        cmd: 'ownpass-update-state',
                        state: 'activated'
                    });
                }

                menuBuilder.update();

                callback({
                    deviceActivated: deviceActivated,
                    deviceId: deviceId,
                    token: data
                });
            }
        });
    };

    this.login = function (msg, sender, callback) {
        var serverUrl = msg.server.replace(/\/$/, '');
        var configUrl = serverUrl + '/assets/config.json';

        $.ajax({
            url: configUrl,
            dataType: 'json',
            success: function (data) {
                msg.control_panel = serverUrl;
                msg.server = data.server_url;

                retrieveOAuthToken(msg, function (data) {
                    loadCredentials();

                    callback(data);
                });
            },
            error: function (jqXHR) {
                var errorMsg;

                console.error('An error did occur during the request:', jqXHR);

                if (jqXHR.status === 401) {
                    logout();
                }

                if (jqXHR.responseJSON && jqXHR.responseJSON.error_description) {
                    errorMsg = jqXHR.responseJSON.error_description;
                } else {
                    errorMsg = 'Cannot connect to the server';
                }

                callback({
                    error: errorMsg
                });
            }
        });

        return true;
    };

    this.loginRefresh = function (msg, sender, callback) {
        var token = JSON.parse(window.localStorage.getItem('oauth-token'));

        if (!token) {
            callback({
                authenticated: false
            });
            return false;
        }

        $.ajax({
            url: token.server + '/oauth',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            data: JSON.stringify({
                grant_type: 'refresh_token',
                refresh_token: token.refresh_token,
                client_id: 'chrome-extension'
            }),
            dataType: 'json',
            error: function (jqXHR) {
                console.error('An error did occur during the request:', jqXHR);

                logout();

                callback({
                    authenticated: false
                });
            },
            success: function (data) {
                token.access_token = data.access_token;
                token.refresh_token = data.refresh_token;

                window.localStorage.setItem('oauth-token', JSON.stringify(token));

                callback({
                    authenticated: true
                });
            }
        });

        return true;
    };

    this.logout = function (msg, sender, callback) {
        logout();

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
                console.error('An error did occur during the request:', jqXHR);

                if (jqXHR.status === 401) {
                    logout();
                }

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
                var error;

                console.error('An error did occur during the request:', jqXHR);

                if (jqXHR.status === 401) {
                    logout();
                }

                if (!jqXHR.responseJSON) {
                    error = 'An error did occur.';
                } else if (jqXHR.responseJSON.error_description) {
                    error = jqXHR.responseJSON.error_description;
                } else if (jqXHR.responseJSON.detail) {
                    error = jqXHR.responseJSON.detail;
                }

                callback({
                    status: jqXHR.status,
                    error: error
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
                    status: 200,
                    deviceId: data.id
                });
            }
        });
        return true;
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
                console.error('An error did occur during the request:', jqXHR);

                if (jqXHR.status === 401) {
                    logout();
                }

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
                console.error('An error did occur during the request:', jqXHR);

                if (jqXHR.status === 401) {
                    logout();
                }

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

    this.loadDocument = function (msg, sender, callback) {
        sendMessageToContent({
            cmd: 'ownpass-provide-credentials',
            credentials: credentialsCache
        });

        callback();
        return false;
    };

    this.formSubmit = function (msg, sender, callback) {
        var token = JSON.parse(window.localStorage.getItem('oauth-token'));
        var deviceIds = JSON.parse(window.localStorage.getItem('device-ids'));
        var link = document.createElement('a');

        link.href = msg.url;

        for (var i = 0; i < credentialsCache.length; ++i) {
            if (credentialsCache[i].host === link.hostname &&
                credentialsCache[i].identity === msg.identity &&
                credentialsCache[i].credential === msg.credential) {
                // The credential already exists.
                return;
            }
        }

        credentialsCache.push({
            host: link.hostname,
            identity: msg.identity,
            credential: msg.credential
        });

        menuBuilder.update();

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
                identity: msg.identity,
                credential: msg.credential,
                description: ''
            }),
            dataType: 'json',
            error: function(jqXHR) {
                console.error('An error did occur during the request:', jqXHR);

                if (jqXHR.status === 401) {
                    logout();
                }

                callback({
                    authenticated: false
                });
            },
            success: function () {
                callback({
                    authenticated: true
                });
            }
        });

        return true;
    };
}

menuBuilder = new MenuBuilder();
menuBuilder.update();

handler = new Handler();

worker.addEventListener('message', function (e) {
    var cmd = e.data.cmd || null;

    switch (cmd) {
        case 'encrypt':
            console.log('Encrypted result: ' + e.data.result, e.data);
            break;

        case 'decrypt':
            console.log('Decrypted result: ' + e.data.result, e.data);
            break;

        default:
            console.error('Invalid command recieved from worker: ' + cmd);
            break;
    }
}, false);

chrome.runtime.onMessage.addListener(function (msg, sender, callback) {
    var result = false;

    switch (msg.cmd) {
        case 'ownpass-ping':
            result = handler.ping(msg, sender, callback);
            break;

        case 'ownpass-document-load':
            result = handler.loadDocument(msg, sender, callback);
            break;

        case 'ownpass-document-form-submit':
            result = handler.formSubmit(msg, sender, callback);
            break;

        case 'ownpass-remind-unauthenticated':
            result = handler.displayReminder(msg, sender, callback);
            break;

        case 'ownpass-get-identity':
            result = handler.getIdentity(msg, sender, callback);
            break;

        case 'ownpass-has-identity':
            result = handler.hasIdentity(msg, sender, callback);
            break;

        case 'ownpass-login':
            result = handler.login(msg, sender, callback);
            break;

        case 'ownpass-login-refresh':
            result = handler.loginRefresh(msg, sender, callback);
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

loadCredentials();
loadPing();

logout();
