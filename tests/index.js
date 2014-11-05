'use strict';

var tenon = require('../main');   // Normally this is 'tenon-api-client' if installed in node_modules

tenon({
  url: 'tests/index.html',        // file path to html, required
  key: 'Your Tenon API key',      // API key, required
  level: 'AAA',                   // Tenon option to filter by WCAG level,
  config: 'tests/.tenonrc',       // default values in this JSON file
  filter: [31, 54]                // in response, filter these tIDs out of resultSetFiltered
}, function(err, results) {
  if (err) {
    console.log('Failed: ' + err);
  } else {
    console.log(JSON.stringify(results, null, '  '));
  }
});
