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

        switch (name) {
            case 'login-screen':
                resetLoginScreen();
                break;

            case 'activate-account-screen':
                $('#activate-account-server').val(window.localStorage.getItem('login-server'));
                break;

            case 'recover-screen':
                $('#recover-server').val(window.localStorage.getItem('login-server'));
                break;

            default:
                break;
        }

        $('#' + name).show();
    };

    var bindCallbacks = function () {
        $('.forget-device-button').on('click', function (e) {
            e.preventDefault();

            chrome.runtime.sendMessage(null, {
                'cmd': 'ownpass-forget-device'
            }, function () {
                chrome.runtime.sendMessage(null, {
                    'cmd': 'ownpass-logout'
                });

                activateScreen('login-screen');
            });
        });

        $('.logout-button').on('click', function (e) {
            e.preventDefault();

            chrome.runtime.sendMessage(null, {
                'cmd': 'ownpass-logout'
            });

            activateScreen('login-screen');
        });

        $('[data-op-goto]').on('click', function (e) {
            e.preventDefault();

            activateScreen($(this).data('op-goto'));
        });

        $('#login-screen form').on('submit', function (e) {
            var server = $('#login-server', this).val().trim().replace(/\/$/g, ''),
                username = $('#login-username', this).val().trim(),
                passwordField = $('#login-password', this),
                password = passwordField.val();

            e.preventDefault();

            $('.op-form-error', this).hide();

            if (server === '') {
                $('#login-server', this).next('.op-form-error').show().text('The server is required.');
                return;
            }

            window.localStorage.setItem('login-server', server);

            if (username === '') {
                $('#login-username', this).next('.op-form-error').show().text('The username is required.');
                return;
            }

            window.localStorage.setItem('login-username', username);

            if (password === '') {
                $('#login-password', this).next('.op-form-error').show().text('The password is required.');
                return;
            }

            chrome.runtime.sendMessage(null, {
                'cmd': 'ownpass-login',
                'server': server,
                'username': username,
                'password': password
            }, function (response) {
                if (response.error) {
                    passwordField.next('.op-form-error').show().text(response.error);
                } else if (response.deviceActivated) {
                    activateScreen('popup-screen');
                } else if (response.deviceId) {
                    activateScreen('activate-device-screen');
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
                descriptionField.next('.op-form-error').show().text('The description is required.');
                return;
            }

            chrome.runtime.sendMessage(null, {
                'cmd': 'ownpass-register-device',
                'description': description
            });

            activateScreen('activate-device-screen');
        });

        $('#recover-screen form').on('submit', function (e) {
            var serverField = $('#recover-server', this), emailField = $('#recover-email', this);
            var server = serverField.val(), email = emailField.val();

            e.preventDefault();

            $('.op-form-error', this).hide();

            if (server === '') {
                serverField.next('.op-form-error').show().text('A server is required.');
                return;
            }

            if (email === '') {
                emailField.next('.op-form-error').show().text('Your e-mail address is required.');
                return;
            }

            chrome.runtime.sendMessage(null, {
                'cmd': 'ownpass-recover-account',
                'server': server,
                'email': email
            }, function (response) {
                if (response.error) {
                    emailField.next('.op-form-error').show().text(response.error);
                } else {
                    activateScreen('activate-account-screen');
                }
            });
        });

        $('#activate-account-screen').on('submit', function (e) {
            var serverField = $('#activate-account-server', this),
                server = serverField.val(),
                codeField = $('#activate-account-code', this),
                code = codeField.val(),
                credentialField = $('#activate-account-credential', this),
                credential = credentialField.val(),
                validationField = $('#activate-account-validation', this),
                validation = validationField.val();

            e.preventDefault();

            $('.op-form-error', this).hide();

            if (server === '') {
                serverField.next('.op-form-error').show().text('The server is required.');
                return;
            }

            if (code === '') {
                codeField.next('.op-form-error').show().text('The code is required.');
                return;
            }

            if (credential === '') {
                credentialField.next('.op-form-error').show().text('The credential is required.');
                return;
            }

            if (credential !== validation) {
                validationField.next('.op-form-error').show().text('The two passwords do not match.');
                return;
            }

            chrome.runtime.sendMessage(null, {
                'cmd': 'ownpass-activate-account',
                'server': server,
                'code': code,
                'credential': credential
            }, function (response) {
                if (response.error) {
                    validationField.next('.op-form-error').show().text(response.error);
                } else {
                    activateScreen('login-screen');
                }
            });
        });

        $('#activate-device-screen form').on('submit', function (e) {
            var codeField = $('#activate-device-code', this);
            var code = codeField.val();

            e.preventDefault();

            $('.op-form-error', this).hide();

            if (code === '') {
                codeField.next('.op-form-error').show().text('The code is required.');
                return;
            }

            chrome.runtime.sendMessage(null, {
                'cmd': 'ownpass-activate-device',
                'code': code
            }, function (response) {
                if (response.error) {
                    codeField.next('.op-form-error').show().text(response.error);
                } else {
                    activateScreen('popup-screen');
                }
            });
        });

        resetLoginScreen();
    };

    hideScreens();
    bindCallbacks();

    chrome.runtime.sendMessage(null, {
        'cmd': 'ownpass-has-identity'
    }, function (response) {
        if (response.deviceActivated) {
            activateScreen('popup-screen');
        } else if (response.deviceId) {
            activateScreen('activate-device-screen');
        } else if (response.authenticated) {
            activateScreen('register-device-screen');
        } else {
            activateScreen('login-screen');
        }
    });
});
