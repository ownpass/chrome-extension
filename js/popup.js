$(function () {
    var resetLoginScreen = function () {
        $('#login-server').val(window.localStorage.getItem('login-server'));
        $('#login-username').val(window.localStorage.getItem('login-username'));
        $('#login-password').val('');
    };

    var hideScreens = function () {
        $('.op-model-box').hide();
    };

    var activateScreen = function (name) {
        hideScreens();

        if (name === 'login-screen') {
            resetLoginScreen();
        }

        $('#' + name).show();
    };

    var bindCallbacks = function () {
        $('[data-op-goto]').on('click', function (e) {
            e.preventDefault();

            activateScreen($(this).data('op-goto'));
        });

        $('.logout-button').on('click', function (e) {
            e.preventDefault();

            chrome.runtime.sendMessage(null, {
                'cmd': 'ownpass-logout'
            });

            activateScreen('login-screen');
        });

        $('#login-screen form').on('submit', function (e) {
            var server = $('#login-server', this).val().trim().replace(/\/$/g, ''),
                username = $('#login-username', this).val().trim(),
                passwordField = $('#login-password', this),
                password = passwordField.val();

            e.preventDefault();

            $('.op-form-error', this).hide();

            if (server === '') {
                $('#login-server', this).next('.op-form-error').show().html('The server is required.');
                return;
            }

            window.localStorage.setItem('login-server', server);

            if (username === '') {
                $('#login-username', this).next('.op-form-error').show().html('The username is required.');
                return;
            }

            window.localStorage.setItem('login-username', username);

            if (password === '') {
                $('#login-password', this).next('.op-form-error').show().html('The password is required.');
                return;
            }

            chrome.runtime.sendMessage(null, {
                'cmd': 'ownpass-login',
                'server': server,
                'username': username,
                'password': password
            }, function (response) {
                if (response.error) {
                    passwordField.next('.op-form-error').show().html(response.error);
                } else if (response.validDevice) {
                    activateScreen('popup-screen');
                } else {
                    activateScreen('register-device-screen');
                }
            });
        });

        $('#register-device-screen form').on('submit', function (e) {
            var descriptionField = $('#register-device-description', this);
            var description = descriptionField.val();

            e.preventDefault();

            if (description === '') {
                descriptionField.next('.op-form-error').show().html('The description is required.');
                return;
            }

            chrome.runtime.sendMessage(null, {
                'cmd': 'ownpass-register-device',
                'description': description
            });

            activateScreen('activate-device-screen');
        });

        $('#activate-device-screen form').on('submit', function (e) {
            var codeField = $('#activate-device-code', this);
            var code = codeField.val();

            e.preventDefault();

            if (code === '') {
                codeField.next('.op-form-error').show().html('The code is required.');
                return;
            }

            chrome.runtime.sendMessage(null, {
                'cmd': 'ownpass-activate-device',
                'code': code
            }, function (response) {
                if (response.success) {

                } else {
                    activateScreen('popup-screen');
                }
            });
        });

        resetLoginScreen();
    };

    hideScreens();
    bindCallbacks();

    chrome.runtime.onMessage.addListener(function (msg, sender, callback) {
        console.log('POPUP', msg, sender, callback);
    });

    chrome.runtime.sendMessage(null, {
        'cmd': 'ownpass-has-identity'
    }, function (response) {
        console.log(response);

        if (response.validDevice) {
            activateScreen('popup-screen');
        } else if (response.authenticated) {
            activateScreen('register-device-screen');
        } else {
            activateScreen('login-screen');
        }
    });
});
