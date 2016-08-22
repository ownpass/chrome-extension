var credentialsStorage = [];

function persistCredentials(data) {
    for (var i = 0; i < data.length; ++i) {
        credentialsStorage.push({
            'id': data[i].id,
            'identity': data[i].identity,
            'credential': data[i].credential,
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
        callback();
    });
}

function handleFormSubmission(msg, sender, callback) {
    var oAuth = JSON.parse(window.localStorage.getItem('oauth'));

    var parser = document.createElement('a');
    parser.href = msg.raw_url;

    console.log(oAuth);
    console.log(parser);
    console.log(msg);
    console.log(sender);
    console.log(callback);

    $.ajax({
        method: 'POST',
        url: oAuth.server + '/api/user/credential?host=' + parser.hostname,
        headers: {
            'Authorization': oAuth.token_tye + ' ' + oAuth.access_token
        },
        dataType: 'json',
        error: function (jqXHR) {
            if (!jqXHR.responseJSON) {
                console.log(jqXHR.responseText);
            } else {
                console.log(jqXHR.responseJSON);
            }
        },
        success: function (data) {
            console.log(data);
        }
    });
}

function handleFindIdentities(msg, sender, callback) {
    var parser = document.createElement('a');
    parser.href = msg.raw_url;

    console.log(parser.hostname, credentialsStorage);
    console.log(msg, sender, callback);
}

function handleLogin(msg) {
    msg.data.expires_at = Date.now() + (msg.data.expires_in * 1000);

    handleSynchronization(msg.data, function() {
        window.localStorage.setItem('oauth', JSON.stringify(msg.data));

        chrome.browserAction.setPopup({
            popup: "html/popup.html"
        });
    });
}

function handleLogout() {
    window.localStorage.removeItem('oauth');

    chrome.browserAction.setPopup({
        popup: "html/login.html"
    });
}

chrome.runtime.onMessage.addListener(function (msg, sender, callback) {
    console.log('received message: ' + msg.cmd);

    switch (msg.cmd) {
        case 'document-form-submit':
            handleFormSubmission(msg, sender, callback);
            break;

        case 'find-identities':
            handleFindIdentities(msg, sender, callback);
            break;

        case 'login':
            handleLogin(msg, sender, callback);
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
