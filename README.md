Tenon API Module
================

This is an interface to [TENON](http://tenon.io/) - a web accessiblity testing API.

Tenon docs: https://bitbucket.org/tenon-io/tenon.io-documentation/

What's Here
-----------

The lib folder contains node modules.

1. *tenon.js* is the interface for the Tenon API.
2. *inliner.js* inlines LOCAL Javascript and CSS into the document


To Use
------

var tenon = require('tenon-api');

tenon(request, function(err, response) {});



Things to Note
--------------

The tenon module (in tenon.js)
receives a configuration object. This object can contain properties corresponding to
all the options documented in the Tenon API documentation (with one exception, see below).
In addition, it can also contain the
following properties:

- config -- Path to a JSON file with parameters to merge in. Default for this in both
index.js and the Grunt task is '.tenonrc' in the current working directory. This file would be
a convenient place to put the API URL and the API key.
- userid and password -- if both are present and the url starts with http, then these
are incorporated into the url passed to Tenon for basic auth: (use<span>rid:</span>password@domain.com/...)
- filter -- an array of tIDs to filter out of the results. Actually it leaves resultSet unmolested, but creates a
new array, resultSetFiltered, with these particular errors filtered out.
- cssUrlReplacer -- a function which receives a CSS URL as its parameter and returns a replacement.
See below for more on this.

The only Tenon API property that cannot be passed is *src*. The module requires the url property
and will populate src if it points to a local file.

If tenon.js determines that the given url is a local file (it doesn't start with "http") it will inline all
local Javascript and CSS. For example:

    <link rel="stylesheet" href="css/combo.css" media="screen">

will be converted to:

    <style media="screen">
      [[content of css/combo.css]]
    </style>

CSS files may have URLs  within, such as:

    background: url(../images/foo.png) no-repeat;
    background: url('../../images/bar.png');

Inlining would likely make these URLs incorrect. The cssUrlReplacer configuration item is a function
that receives the url portion (in the first example above, it would receive *"../images/foo.png"*). It
returns text to replace it. The configuration item is optional. It defaults to this:

    function(url) {
      return url.replace(/^(\.\.\/)*/, '');
    }

This default CSS URL replacer removes any number of "../" substrings from the beginning of the URL.

The inlined files must be relative to the HTML file. For example, if a javascript src attribute
in an html file at C:\project\index.html is "js/script.js" then the file should be at
C:\project\js\script.js.

Javascript and CSS references that start with "http" are not touched. Userid/password are ignored
for local files.

The basic assumption is that files loaded with HTTP are accessible to the Tenon server, but
local files are not.

The modules in the lib folder are fully async and would be usable in a server that has to support
multiple connections.

