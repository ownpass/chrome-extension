# chrome-extension

The OwnPass Chrome extension.

## Installation

Simply run `npm install` and next `grunt` to create the extension. The extension will be 
created in *build/packed/*. An unpacked extension will be generated in *build/unpacked/*.

A `ownpass-chrome-extension.crx` file will be generated in *build/packed/* together with a
`ownpass-chrome-extension.zip` file. In order to create the *.crx* file, a private key should 
be stored in `resources/ownpass-chrome-extension.key`. When no key is present, the key will 
automatically be generated.
