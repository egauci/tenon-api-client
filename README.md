Tenon API Client Module
=======================

This is an interface to [TENON](http://tenon.io/) - a web accessiblity testing API.

Tenon docs: http://tenon.io/documentation/

This API client module is open and free. However, access to the Tenon API must
be granted by [Tenon](http://tenon.io/). You will need to obtain an API key to
use it.

To Use
------

    var tenon = require('tenon-api-client');
    tenon({
      url: 'local/path/to/html or http:// URL', // required
      key: 'your Tenon API key'                 // required
      // any additional options, see below
    }, function(err, response) {
      if (err) {
        console.log('Oops: ' + err);
      } else {
        console.log(JSON.stringify(response, null, '  ')); // or something useful
      }
    });

See *tests/index.js* for sample code.

Usage Details
-------------

This API client module
receives a configuration object as its first parameter.
This object can contain properties corresponding to
all the request parameters documented in the Tenon API documentation (except for *src*, see below).
In addition, it can also contain the following properties:

- config -- Path to a JSON file with parameters to merge in.
This file would be
a convenient place to put the API key.
- userid and password -- if both are present and the url starts with http, then these
are incorporated into the url passed to the Tenon API for basic auth: (userid:password&#x00040;domain.com/...)
- filter -- an array of tIDs to filter out of the results. Actually it leaves resultSet unmolested, but creates a
new array, resultSetFiltered, with these particular errors filtered out.
- cssUrlReplacer -- a function which receives a CSS URL as its parameter and returns a replacement.
See below for more on this.

The only Tenon API parameter that cannot be passed is *src*. The module requires the url property
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

Inlining would likely make these URLs incorrect. The cssUrlReplacer configuration property is a function
that receives the url portion (in the first example above, it would receive *"../images/foo.png"*). It
returns text to replace it. The configuration property is optional. It defaults to this:

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

The modules in the lib folder are fully async and should be usable in a server that has to support
multiple connections.

