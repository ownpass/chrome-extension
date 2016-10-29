(function () {
    var ownPassTopBar = null;

    function removeTopBar() {
        if (ownPassTopBar) {
            document.body.removeChild(ownPassTopBar);

            ownPassTopBar = null;
        }
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

    function createTopBar(title, yesCallback, noCallback) {
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
        topBar.style.zIndex = 100000;

        topBar.appendChild(spanText);
        topBar.appendChild(createButton('No', noCallback));
        topBar.appendChild(createButton('Yes', yesCallback));

        return topBar;
    }

    function onFormSubmit(e) {
        var form = this;

        e.preventDefault();

        ownPassTopBar = createTopBar(
            document.title,
            function () {
                removeTopBar();

                form.dispatchEvent(new Event('submit'));
            },
            function () {
                removeTopBar();

                form.dispatchEvent(new Event('submit'));
            }
        );

        document.body.appendChild(ownPassTopBar);
    }

    document.addEventListener('DOMContentLoaded', function () {
        var forms = document.getElementsByTagName('form');

        for (var i = 0; i < forms.length; ++i) {
            forms[i].addEventListener('submit', onFormSubmit);
        }
    });
})();
