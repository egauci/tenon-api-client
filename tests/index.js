'use strict';

var tenon = require('../main');

tenon({
  url: 'tests/index.html',        // file path to html, required
  key: 'copy your API key here',  // API key, required
  level: 'AAA',                   // Tenon option to filter by WCAG level
  filter: [31, 54]                // in response, filter these tIDs out of resultSetFiltered
}, function(err, results) {
  if (err) {
    console.log('Failed: ' + err);
  } else {
    console.log(JSON.stringify(results, null, '  '));
  }
});
