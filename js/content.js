var identityNames = [
        /^.*identity$/,
        /^.*username$/,
        /^.*user$/
    ],
    credentialNames = [
        /^.*credential$/,
        /^.*password$/,
        /^.*pass$/
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

function findIdentity(url) {
    var callback = function(data) {
        console.log(data);
    };

    console.log('sending message to find identities');
    chrome.runtime.sendMessage(
        null,
        {
            'cmd': 'find-identities',
            'raw_url': url
        },
        callback
    );
}

function handleFormPopulation() {
    var forms = findRelevantForms();
    var firstIdentity = findIdentity(window.location.href);

    console.log(forms, firstIdentity);
}

function handleFormSubmission() {
    // Attach the submit listeners so we know what data to store on submit.
    $('form').on('submit', function () {
        var inputElements = $('input', this);

        var identity = findElement(identityNames, inputElements);
        if (!identity) {
            console.info('No identity found, aborting registration.');
            return;
        }

        var credential = findElement(credentialNames, inputElements);
        if (!credential) {
            console.info('No credential found, aborting registration.');
            return;
        }

        chrome.runtime.sendMessage(
            null,
            {
                'cmd': 'document-form-submit',
                'raw_url': window.location.href,
                'identity': identity.val(),
                'credential': credential.val()
            }
        );
    });
}

window.onload = function () {
    handleFormPopulation();
    handleFormSubmission();
};
