function login(server, username, password, data) {
    data.server = server;

    chrome.runtime.sendMessage(
        null,
        {
            'cmd': 'login',
            'data': data
        }
    );

    window.localStorage.setItem('server', server);
    window.localStorage.setItem('username', username);
    window.location.href = chrome.extension.getURL('html/popup.html');
}

function logout() {
    chrome.runtime.sendMessage(
        null,
        {
            'cmd': 'logout'
        }
    );

    window.location.href = chrome.extension.getURL('html/login.html');
}

function initializeLoginForm() {
    var loginForm = $('form');

    $('#server', loginForm).val(window.localStorage.getItem('server') || '');
    $('#username', loginForm).val(window.localStorage.getItem('username') || '');
    $('#password', loginForm).val('');

    loginForm.on('submit', function () {
        var form = $(this);
        var status = $('#status-container');
        var server = $('#server', loginForm);
        var serverVal = server.val().replace(/\/+$/, '');
        var username = $('#username', loginForm);
        var usernameVal = username.val();
        var password = $('#password', loginForm);
        var passwordVal = password.val();

        if (!serverVal) {
            status.text('Invalid server given.');
            server.focus();
            return false;
        }

        if (!usernameVal) {
            status.text('Invalid username given.');
            username.focus();
            return false;
        }

        if (!passwordVal) {
            status.text('Invalid password given.');
            password.focus();
            return false;
        }

        $.ajax({
            method: 'POST',
            url: serverVal + '/oauth',
            data: {
                'grant_type': 'password',
                'client_id': 'chrome-extension',
                'username': usernameVal,
                'password': passwordVal
            },
            dataType: 'json',
            beforeSend: function () {
                status.text('Loading...');

                form.hide();
            },
            error: function(jqXHR) {
                if (!jqXHR.responseJSON) {
                    status.text('The server does not seem to be accessible.');
                } else {
                    status.text(jqXHR.responseJSON.detail);
                }

                password.val('');

                form.show();
            },
            success: function(data) {
                login(serverVal, usernameVal, passwordVal, data);

                status.text('Successfully authenticated!');

                form.hide();
            }
        });

        return false;
    });
}

function initializeLogoutButton() {
    $('#menu-logout').on('click', function() {
        logout();

        return false;
    });
}

$(function() {
    initializeLoginForm();
    initializeLogoutButton();
});