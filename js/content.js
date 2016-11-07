(function () {
    var ownPassActivated = false,
        ownPassBackground = null,
        ownPassTopBar = null,
        zIndex = 100000,
        submitForm = null;

    function removeTopBar() {
        if (ownPassBackground) {
            document.body.removeChild(ownPassBackground);

            ownPassBackground = null;
        }

        if (ownPassTopBar) {
            document.body.removeChild(ownPassTopBar);

            ownPassTopBar = null;
        }
    }

    function createTransparentBackground() {
        var backgroundDiv = document.createElement('div');

        backgroundDiv.style.backgroundColor = '#FFF';
        backgroundDiv.style.bottom = 0;
        backgroundDiv.style.left = 0;
        backgroundDiv.style.opacity = '0.8';
        backgroundDiv.style.position = 'fixed';
        backgroundDiv.style.top = 0;
        backgroundDiv.style.right = 0;
        backgroundDiv.style.zIndex = zIndex - 1;

        return backgroundDiv;
    }

    function createButton(title, callback) {
        var button = document.createElement('span');

        button.appendChild(document.createTextNode(title));
        button.addEventListener('click', callback);

        button.style.backgroundColor = '#15b588';
        button.style.borderRadius = '5px';
        button.style.cursor = 'pointer';
        button.style.display = 'inline-block';
        button.style.float = 'right';
        button.style.lineHeight = '23px';
        button.style.marginLeft = '10px';
        button.style.padding = '7px';
        button.style.textAlign = 'center';
        button.style.width = '60px';

        return button;
    }

    function createTopBar(title, yesCallback, noCallback, cancelCallback) {
        var spanTitle = document.createElement('span');
        spanTitle.appendChild(document.createTextNode(title));
        spanTitle.style.fontWeight = 'bolder';

        var spanText = document.createElement('span');
        spanText.appendChild(document.createTextNode('Would you like to add '));
        spanText.appendChild(spanTitle);
        spanText.appendChild(document.createTextNode(' to OwnPass?'));

        var topBar = document.createElement('div');
        topBar.style.backgroundColor = '#00263e';
        topBar.style.color = 'white';
        topBar.style.fontFamily = '"Helvetica Neue",Helvetica,Arial,sans-serif';
        topBar.style.fontSize = '14px';
        topBar.style.left = 0;
        topBar.style.lineHeight = '35px';
        topBar.style.padding = '10px';
        topBar.style.position = 'fixed';
        topBar.style.top = 0;
        topBar.style.right = 0;
        topBar.style.zIndex = zIndex;

        topBar.appendChild(spanText);
        topBar.appendChild(createButton('Cancel', cancelCallback));
        topBar.appendChild(createButton('No', noCallback));
        topBar.appendChild(createButton('Yes', yesCallback));

        return topBar;
    }

    function serializeForm(form) {
        var result = {}, i, valueFields = [], selectFields;

        selectFields = form.getElementsByTagName('select');

        valueFields = valueFields.concat([].slice.call(form.getElementsByTagName('button')));
        valueFields = valueFields.concat([].slice.call(form.getElementsByTagName('input')));
        valueFields = valueFields.concat([].slice.call(form.getElementsByTagName('textarea')));

        for (i = 0; i < valueFields.length; ++i) {
            if (valueFields[i].name) {
                result[valueFields[i].name] = valueFields[i].value;
            }
        }

        for (i = 0; i < selectFields.length; ++i) {
            if (selectFields[i].name) {
                result[selectFields[i].name] = selectFields[i].options[selectFields[i].selectedIndex];
            }
        }

        return result;
    }

    function onFormSubmit(e) {
        var form = this;

        // When the form has already been checked, allow the submit.
        if (form.getAttribute('data-ownpass-checked') === 'true') {
            return true;
        }

        if (!ownPassActivated) {
            chrome.runtime.sendMessage(null, {
                'cmd': 'ownpass-remind-unauthenticated'
            });

            return true;
        }

        e.preventDefault();

        ownPassTopBar = createTopBar(
            document.title,
            function () {
                removeTopBar();

                chrome.runtime.sendMessage(
                    null,
                    {
                        'cmd': 'ownpass-document-form-submit',
                        'title': document.title,
                        'url': window.location.href,
                        'values': serializeForm(form)
                    }
                );

                submitForm(form);
            },
            function () {
                removeTopBar();
                submitForm(form);
            },
            function () {
                removeTopBar();
            }
        );

        ownPassBackground = createTransparentBackground();

        document.body.appendChild(ownPassTopBar);
        document.body.appendChild(ownPassBackground);
        return false;
    }

    submitForm = function (form) {
        var inputs;

        form.setAttribute('data-ownpass-checked', true);

        if (form.submit instanceof Function) {
            form.submit();
        } else {
            inputs = document.forms[0].getElementsByTagName('input');

            for (var i = 0; i < inputs.length; ++i) {
                if (inputs[i].type === 'submit') {
                    inputs[i].click();
                }
            }
        }
    };

    chrome.runtime.onMessage.addListener(function (msg, sender, callback) {
        switch (msg.cmd) {
            case 'ownpass-activated':
                ownPassActivated = true;
                break;

            case 'ownpass-deactivated':
                ownPassActivated = false;
                break;

            default:
                break;
        }

        callback();
    });

    document.addEventListener('DOMContentLoaded', function () {
        var forms = document.getElementsByTagName('form');

        chrome.runtime.sendMessage(null, {
            'cmd': 'ownpass-has-identity'
        }, function (response) {
            ownPassActivated = response.authenticated;
        });

        for (var i = 0; i < forms.length; ++i) {
            forms[i].addEventListener('submit', onFormSubmit);
        }
    });
})();
