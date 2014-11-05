Tenon API Client Module
=======================

This is an interface to [TENON](http://tenon.io/) - a web accessiblity testing API.

Tenon docs: http://tenon.io/documentation/

This API client module is [open and free](https://github.com/egauci/tenon-api-client/blob/master/LICENSE).
However, access to the Tenon API must be granted by [Tenon](http://tenon.io/).
You will need to obtain an API key to
use it.

This module is fully async and should be usable in a server that has to support
multiple simultaneous connections.

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

Details
-------

This API client module receives a configuration object as its first parameter.
This object can contain properties corresponding to all the request parameters documented
in the [Tenon API documentation](http://tenon.io/documentation/) (except for *src*, see below).
In addition, it can also contain the following properties:

- url -- either a web URL (http or https) or a path to a local html file. This property is required.
- config -- Path to a JSON file with parameters to merge in.
This file would be
a convenient place to put the API key.
- userid and password -- if both are present and the url starts with "http", then these
are incorporated into the url passed to the Tenon API for basic auth: (userid:password&#x00040;domain.com/...)
- filter -- an array of tIDs to filter out of the results. Actually it leaves resultSet unmolested, but creates a
new array, resultSetFiltered, with these particular errors filtered out. Default is the empty array: [].
- cssUrlReplacer -- a function which receives a CSS URL as its parameter and returns a replacement.
See below for more on this. This applies only if *url* is a path to a local html file.
- inline -- if present should be a *function* or *false.* If false then it
suppresses inlining of local Javascript and CSS. If a function, it will
be used for inlining in place of the companion inliner.js module. The
function must accept a config object with one property -- fname, containing
a string path to the HTML file. It must return a promise and fulfill that
promise with a string that we will send to the Tenon API as the *src*
parameter. Any other value (including null and undefined) will cause normal inlining with the
companion inliner module. This property applies only if *url* is a path to a local html file.

The only Tenon API parameter that cannot be passed is *src*. The module requires the *url* property
and will populate src if *url* points to a local file.

IMPORTANT: If the given url is a local file (it doesn't start with "http") and
the *inline* property in the configuration is not false or a function,
this module will inline all local Javascript and CSS. For example:

    <link rel="stylesheet" href="css/combo.css" media="screen">

will be converted to:

    <style media="screen">
      [[content of css/combo.css]]
    </style>

CSS files may have URLs  within, such as:

    background: url(../images/foo.png) no-repeat;
    background: url("../../images/bar.png");

Inlining would likely make these URLs incorrect. The cssUrlReplacer configuration property is a function
that receives the url portion (in the first example above, it would receive *"../images/foo.png"*). It
returns text to replace it. This configuration property is optional. It defaults to this:

    function(url) {
      return url.replace(/^(\.\.\/)*/, '');
    }

This default CSS URL replacer removes any number of "../" substrings from the beginning of the URL.

The inlined files must be relative to the HTML file. For example, if a javascript src attribute
in an html file at C:\project\index.html is "js/script.js" then the file should be at
C:\project\js\script.js.

If the target file is not found (or cannot be opened for some reason) its reference is left unaltered
and it is not inlined.

Javascript and CSS references that start with "http" are not touched.

Userid/password are ignored for local files.

*The basic assumption is that files loaded with HTTP (or HTTPS) are accessible to the Tenon server, but
local files are not.*

Returned Results
----------------

The callback receives two parameters: err, and results.

If err is null, then results is an object. It consists of the results returned
by the Tenon API with one additional property: *resultSetFiltered*. This property is an array
created by filtering *resultSet* against the *filter* configuration (see above.)

Calling code can test *results.resultSetFiltered.length* to see if there are any
unfiltered accessibility errors.

Default Tenon API Parameters
----------------------------

These are default values for various Tenon API parameters.

    fragment: '0',
    ref: '0',
    store: '0',
    viewPortHeight: '768',
    viewPortWidth: '1024',

Used In
-------

This module is used in [Tenon Grunt Plugin](https://github.com/egauci/grunt-tenon-client) and
[Tenon Gulp Plugin](https://github.com/egauci/gulp-tenon-client).
