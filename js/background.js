var ownPassAuthenticated = false;

function handleFormSubmission(msg, sender, callback) {
    console.log(msg);
    console.log(sender);
    console.log(callback);

    callback();
}

chrome.runtime.onMessage.addListener(function (msg, sender, callback) {
    switch (msg.cmd) {
        case 'ownpass-document-form-submit':
            handleFormSubmission(msg, sender, callback);
            break;

        case 'ownpass-has-identity':
            callback({
                authenticated: ownPassAuthenticated
            });
            break;

        case 'ownpass-logged-in':
            console.log('ownpass-logged-in');
            ownPassAuthenticated = true;
            break;

        case 'ownpass-logged-out':
            console.log('ownpass-logged-out');
            ownPassAuthenticated = false;
            break;
    }
});
