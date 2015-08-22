'use strict';

/*
 * This module is the interface to the Tenon API.
 * Receives two paramters: options and a callback.
 * Options includes any of the options documented by Tenon (except src), plus:
 *   - urlPrefix - this (if present) is prepended to url. May be useful if processing
 *     many urls with a common initial part for URL. In practice, this hasn't been
 *     that helpful (not useful for Grunt for example).
 *     Update: Actually there is a grunt usecase for urlPrefix. If Tenon can access
 *             your server, you can use this to convert filepaths to urls.
 *   - userid and password. If both are present and the prefix+url parameters start
 *     with 'http', they are incorporated in the url passed to Tenon for basic auth.
 *   - config - a path to a local file that contains JSON configuration. If present,
 *     the contents of this file are used as defaults. It overrides the hardcoded,
 *     defaults, and is in turn overriden by options added inidivually.
 *   - filter - an array of tID values (test IDs) to filter out. Before returning
 *     results to the caller, this module creates a new array within results called
 *     resultSetFiltered with these tests filtered out.
 *   - inline - if present should be a function or false. If false then it
 *     suppresses inlining of local Javascript and CSS. If a function, it will
 *     be used for inlining in place of the companion inliner.js module. The
 *     function must accept a config object, with one property -- fname, containing
 *     a string path to the HTML file. It must return a promise and fulfill that
 *     promise with a string that we will send to the Tenon API as the "src"
 *     parameter. Any other value (null, undefined) will cause normal inlining.
 * These are required:
 *   - url: this is either an http URL or a local path.
 *   - key: Tenon API key
 * The Tenon "src" property cannot be passed in. This module will set src if the
 * supplied url is a local file.
 *
 * Given options and a reference to an html target, it will:
 *   - if the reference is a local file, inline local scripts and css and hand it off to the tenon API
 *   - if the reference is http, hand it off as is to the tenon API
 *
 */

module.exports = function(opts, callback) {
  var Promise = require('bluebird'),
      fs = Promise.promisifyAll(require('fs')),
      merge = require('merge'),
      clone = require('clone'),
      request = require('request'),
      URL = require('url'),
      inline = require('./inliner'),
      inlineContent = true,
      cssUrlReplacer,
      defaults = {
        apiURL: 'https://tenon.io/api/',
        fragment: '0',
        ref: '0',
        store: '0',
        viewPortHeight: '768',
        viewPortWidth: '1024',
        urlPrefix: '',
        cssUrlReplacer: false
      },
      res,
      fname,
      filter = [],
      cfg
  ;

  /*
   * haveResults is the callback for the request module. Called when the API call is
   * resolved.
   */
  function haveResults(err, response, body) {
    var jsn;
    if (err) {
      callback(err);
      return;
    }
    //fs.writeFileSync('response.txt', JSON.stringify(response, null, '  '), 'utf8');
    if (response && response.statusCode !== 200) {
      callback('Resp Status: ' + response.statusCode);
      return;
    }
    try {
      jsn = JSON.parse(body);
    } catch(e) {
      callback('JSON Parse error:\n' + body);
      return;
    }
    if (!jsn.status || jsn.status !== 200) {
      callback('Status: ' + (jsn.status ? String(jsn.status) : '555') + ' ' + (jsn.message ? jsn.message : ''));
      return;
    }
    jsn.resultSetFiltered = jsn.resultSet.filter(function(itm) {
      return filter.indexOf(itm.tID) === -1;
    });
    callback(null, jsn, fname); // DONE - return results to caller
  }

  /* createForm makes the form to POST to Tenon.
   * If userid and password are both present, incorporate them in the
   * remote url. Otherwise, if the url parameter looks like a local file, inline
   * its local javascript and css assets and make the resulting string the src
   * parameter in the form.
   *
   * Inlining is an async process and this function returns a Promise.
   */
  function createForm() {
    return new Promise(function(resolve, reject) {
      var frm = {},
          fname,
          url;
      function returnForm() {
        delete res.url;
        delete res.userid;
        delete res.password;
        delete res.urlPrefix;
        Object.keys(res).forEach(function(itm) {
          frm[itm] = res[itm];
        });
        resolve(frm);
      }

      fname = res.urlPrefix + res.url;
      if (res.userid && res.password && fname.search('http') === 0) {
        url = URL.parse(fname);
        url.auth = res.userid + ':' + res.password;
        frm.url = URL.format(url);
        returnForm();
      } else {
        if (fname.search('http') === 0) {
          frm.url = fname;
          returnForm();
        } else {
          inline({fname: fname, cssUrlReplacer: cssUrlReplacer, inlineContent: inlineContent})
          .then(function(src) {
            //fs.writeFileSync('src.html', src, 'utf8');
            frm.src = src;
            returnForm();
          })
          .catch(function(boo) {
            reject(boo);
          });
        }
      }
    });
  }

  /* Merge defaults, config file JSON (if present) and options. Make sure that
   * required parameters are present, then call createForm to build the API
   * request. Once createForm resolves its promise, hand things off to the
   * request module.
   */
  function haveConfig(conf) {
    var uri,
        hdrs;

    res = merge(defaults, res);    // override defaults with given parameters

    try {
      conf = JSON.parse(conf);
    } catch(e) {
      conf = false;
    }
    if (conf === false) {
      return callback('Config file JSON parse error');
    }
    res = merge(conf, res);       // override file values with given parameters

    if (typeof res.inline === 'function') {
      inline = res.inline; // using code is supplying own inliner
    } else if (res.inline === false) {
      inlineContent = false;  // using code does not want to perform inlining
    }
    delete res.inline;

    cssUrlReplacer = res.cssUrlReplacer;
    delete res.cssUrlReplacer;

    Object.keys(res).forEach(function(itm) {
      if (typeof res[itm] === 'boolean') {
        res[itm] = res[itm] ? '1' : '0';
      } else if (typeof res[itm] === 'number') {
        res[itm] = String(res[itm]);
      }
    });

    if (!res.apiURL) {
      callback('API URL is required');
      return;
    }
    if (!res.url) {
      callback('Target URL is required');
      return;
    }
    if (!res.key) {
      callback('API Key is required');
      return;
    }
    fname = res.urlPrefix + res.url;
    delete res._;
    uri = res.apiURL;
    delete res.apiURL;
    filter = res.filter || [];
    delete res.filter;
    createForm().then(function(frm) {
      hdrs = {
        uri: uri,
        method: 'POST',
        form: frm
      };
      if (process.env.HTTP_PROXY) {
        hdrs.proxy = process.env.HTTP_PROXY;
      }

      //fs.writeFileSync('request.txt', JSON.stringify(hdrs, null, '  '), 'utf8');
      request(hdrs, haveResults); // POST API request
    })
    .catch(function(err) {
      callback(err);
    });
  }

  /*
   * Main code starts here.
   */
  if (!callback || typeof callback !== 'function') {
    if (opts && typeof opts === 'function') {
      process.nextTick(function() {
        opts('Configuration object is required');
      });
      return;
    } else {
      throw 'Callback is required';
    }
  }

  if (!opts || typeof opts !== 'object') {
    process.nextTick(function() {
      callback('Configuration object is required');
    });
    return;
  }

  res = clone(opts, false);

  cfg = res.config;
  delete res.config;

  if (cfg) {
    fs.readFileAsync(cfg)
    .then(function(conf) {
      haveConfig(conf);
    })
    .catch(function() {
      haveConfig('{}');
    });
  } else {
    process.nextTick(function() {
      haveConfig('{}');
    });
  }
};
