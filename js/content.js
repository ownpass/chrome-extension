var identityNames = [
        /^.*identity.*$/,
        /^.*email.*$/,
        /^.*username.*$/,
        /^.*user.*$/
    ],
    credentialNames = [
        /^.*credential.*$/,
        /^.*password.*$/,
        /^.*pass.*$/
    ];

function findElement(possibleNames, inputElements) {
    var element, elementIndex, elementName, nameIndex;

    for (elementIndex = 0; elementIndex < inputElements.length; ++elementIndex) {
        element = inputElements[elementIndex];
        elementName = $(element).attr("name");

        for (nameIndex = 0; nameIndex < possibleNames.length; ++nameIndex) {
            if (possibleNames[nameIndex].test(elementName)) {
                return $(element);
            }
        }
    }

    return null;
}

function findRelevantForms() {
    var result = [],
        elements = document.getElementsByTagName('form');

    // There must be an identity- and a credential field in the form.
    for (var i = 0; i < elements.length; ++i) {
        var inputElements = $('input', elements[i]);

        var identity = findElement(identityNames, inputElements);
        if (!identity) {
            continue;
        }

        var credential = findElement(credentialNames, inputElements);
        if (!credential) {
            continue;
        }

        result.push({
            'form': elements[i],
            'identity': identity,
            'credential': credential
        });
    }

    return result;
}

function findIdentities(url, callback) {
    chrome.runtime.sendMessage(
        null,
        {
            'cmd': 'find-identities',
            'raw_url': url
        },
        callback
    );
}

function populateForm(form, identity) {
    form.identity.val(identity.identity);
    form.credential.val(identity.credential);
}

function handleFormPopulation() {
    var forms = findRelevantForms();

    if (forms.length === 0) {
        return;
    }

    findIdentities(window.location.href, function (identities) {
        if (identities.length === 0) {
            return;
        }

        for (var i = 0; i < forms.length; ++i) {
            populateForm(forms[i], identities[0]);
        }
    });
}

function handleFormSubmission() {
    var forms = findRelevantForms(),
        url = window.location.href,
        onSubmit = function (form, identity, credential) {
            return function () {
                chrome.runtime.sendMessage(
                    null,
                    {
                        'cmd': 'document-form-submit',
                        'raw_url': url,
                        'identity': identity.val(),
                        'credential': credential.val()
                    }
                );
            };
        };

    for (var i = 0; i < forms.length; ++i) {
        $(forms[i].form).on('submit', onSubmit(forms[i].form, forms[i].identity, forms[i].credential));
    }
}

window.onload = function () {
    handleFormPopulation();
    handleFormSubmission();
};
