var credentialsStorage = [];

function persistCredentials(data) {
    for (var i = 0; i < data.length; ++i) {
        credentialsStorage.push({
            'id': data[i].id,
            'identity': data[i].identity,
            'credential': data[i].credential,
            'raw_url': data[i].urlRaw
        });
    }
}

function executeSynchronizationRequest(url, oAuth, callback) {
    $.ajax({
        method: 'GET',
        url: url,
        headers: {
            'Authorization': oAuth.token_type + ' ' + oAuth.access_token
        },
        dataType: 'json',
        error: function(jqXHR) {
            console.log(jqXHR);
            // TODO: Handle 401 errors but be careful not to end in an infinite loop.
            /*if (jqXHR.status === 401) {
                handleLoginRefreshment(function() {
                    executeSynchronizationRequest(url, oAuth, callback);
                });
            }*/

            callback();
        },
        success: function(data) {
            persistCredentials(data._embedded.user_credential);

            if (data._links.next) {
                executeSynchronizationRequest(data._links.next, oAuth, callback);
            } else {
                callback();
            }
        }
    });
}

function handleSynchronization(oAuth, callback) {
    var url = oAuth.server + '/api/user/credential';

    credentialsStorage = [];

    executeSynchronizationRequest(url, oAuth, function() {
        window.localStorage.setItem('cached-credentials', JSON.stringify(credentialsStorage));
        callback();
    });
}

function handleFormSubmission(msg, sender, callback) {
    var oAuth = JSON.parse(window.localStorage.getItem('oauth'));

    // When the user is not logged in, abort
    if (!oAuth) {
        return;
    }

    $.ajax({
        method: 'POST',
        url: oAuth.server + '/api/user/credential',
        headers: {
            'Authorization': oAuth.token_type + ' ' + oAuth.access_token,
            'Content-Type': 'application/json'
        },
        dataType: 'json',
        data: JSON.stringify({
            'identity': msg.identity,
            'credential': msg.credential,
            'raw_url': msg.raw_url
        }),
        error: function (jqXHR) {
            console.log(jqXHR);
            // TODO: Handle 401 errors but be careful not to end in an infinite loop.
            /*
            if (jqXHR.status === 401) {
                handleLoginRefreshment(function() {
                    handleFormSubmission(msg, sender, callback);
                });
            }
            */
        },
        success: function (data) {
            credentialsStorage.push({
                'id': data.id,
                'identity': data.identity,
                'credential': data.credential,
                'raw_url': data.urlRaw
            });

            window.localStorage.setItem('cached-credentials', JSON.stringify(credentialsStorage));
        }
    });

    callback();
}

function handleFindIdentities(msg, sender, callback) {
    var messageParser = document.createElement('a'),
        identityParser = document.createElement('a'),
        result = [];

    messageParser.href = msg.raw_url;

    for (var i = 0; i < credentialsStorage.length; ++i) {
        identityParser.href = credentialsStorage[i].raw_url;

        if (identityParser.hostname === messageParser.hostname) {
            result.push(credentialsStorage[i]);
        }
    }

    callback(result);
}

function handleLogin(data) {
    data.expires_at = Date.now() + (data.expires_in * 1000);

    handleSynchronization(data, function() {
        window.localStorage.setItem('oauth', JSON.stringify(data));

        chrome.browserAction.setPopup({
            popup: "html/popup.html"
        });
    });
}

function handleLoginRefreshment() {
    var oAuth = JSON.parse(window.localStorage.getItem('oauth'));

    $.ajax({
        method: 'POST',
        url: oAuth.server + '/oauth',
        dataType: 'json',
        data: {
            'grant_type': 'refresh_token',
            'refresh_token': oAuth.refresh_token,
            'client_id': 'chrome-extension'
        },
        error: function (jqXHR) {
            console.log(jqXHR);
        },
        success: function (data) {
            data.server = oAuth.server;

            handleLogin(data);
        }
    });
}

function handleLogout() {
    window.localStorage.removeItem('cached-credentials');
    window.localStorage.removeItem('oauth');

    credentialsStorage = [];

    chrome.browserAction.setPopup({
        popup: "html/login.html"
    });
}

chrome.runtime.onMessage.addListener(function (msg, sender, callback) {
    switch (msg.cmd) {
        case 'document-form-submit':
            handleFormSubmission(msg, sender, callback);
            break;

        case 'find-identities':
            handleFindIdentities(msg, sender, callback);
            break;

        case 'login':
            handleLogin(msg.data, sender, callback);
            break;

        case 'login-refresh':
            handleLoginRefreshment(msg, sender, callback);
            break;

        case 'logout':
            handleLogout(msg, sender, callback);
            break;
    }
});

if (!window.localStorage.getItem('oauth')) {
    chrome.browserAction.setPopup({
        popup: "html/login.html"
    });
}

credentialsStorage = JSON.parse(window.localStorage.getItem('cached-credentials'));
if (!credentialsStorage) {
    credentialsStorage = [];
}
