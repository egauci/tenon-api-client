'use strict';

var tenon = require('../main');

tenon({
  url: 'tests/index.html',
  apiURL: 'http://www.tenon.io/api/',
  config: 'tests/.tenonrc'
}, function(err, results) {
  if (err) {
    console.log('Failed: ' + err);
  } else {
    JSON.stringify(results, null, '  ');
  }
});
