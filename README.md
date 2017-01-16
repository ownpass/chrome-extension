# chrome-extension

[![Build Status][ico-travis]][link-travis]
[![Software License][ico-license]](LICENSE.md)


The OwnPass Chrome extension.

## Installation

Simply run `npm install` and next `grunt` to create the extension. The extension will be 
created in *build/packed/*. An unpacked extension will be generated in *build/unpacked/*.

A `ownpass-chrome-extension.crx` file will be generated in *build/packed/* together with a
`ownpass-chrome-extension.zip` file. In order to create the *.crx* file, a private key should 
be stored in `config/ownpass-chrome-extension.pem`. When no key is present, the key will 
automatically be generated.

## Publishing to the Chrome Web Store

To publish the extension to the webstore, make sure the file `config/webstore.json` exists 
and is correctly configured. The correct settings can be found by following the documentation
that can be found here: https://developer.chrome.com/webstore/using_webstore_api

## Contributing

Please see [CONTRIBUTING](CONTRIBUTING.md) and [CONDUCT](CONDUCT.md) for details.

## Security

If you discover any security related issues, please report them via [HackerOne][link-hackerone].

## Community

There's a Gitter room where you can drop questions: https://gitter.im/ownpass/Lobby
You can also find us on IRC. We're on the Freenode network in the channel #ownpass.

## License

All rights reserved. The application is free to use but the rights of the source code are with the OwnPass team.

[ico-license]: https://img.shields.io/badge/license-proprietary-brightgreen.svg?style=flat-square
[ico-travis]: https://img.shields.io/travis/ownpass/chrome-extension/master.svg?style=flat-square

[link-hackerone]: https://hackerone.com/ownpass
[link-travis]: https://travis-ci.org/ownpass/chrome-extension
[link-contributors]: ../../contributors
