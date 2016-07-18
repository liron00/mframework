'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.util = exports.storage = exports.MultiLiveQuery = exports.isInitialized = exports.LiveQuery = exports.m = exports.firebase = exports.dimensions = exports.config = exports.auth = undefined;
exports.default = initialize;

var _whatwgFetch = require('whatwg-fetch');

var _whatwgFetch2 = _interopRequireDefault(_whatwgFetch);

var _app = require('firebase/app');

var _app2 = _interopRequireDefault(_app);

require('firebase/auth');

require('firebase/database');

var _mobx = require('mobx');

var _auth = require('./auth');

var _auth2 = _interopRequireDefault(_auth);

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var _decorator = require('./decorator');

var _decorator2 = _interopRequireDefault(_decorator);

var _dimensions = require('./dimensions');

var _dimensions2 = _interopRequireDefault(_dimensions);

var _liveQuery = require('./liveQuery');

var _liveQuery2 = _interopRequireDefault(_liveQuery);

var _multiLiveQuery = require('./multiLiveQuery');

var _multiLiveQuery2 = _interopRequireDefault(_multiLiveQuery);

var _storage = require('./storage');

var _storage2 = _interopRequireDefault(_storage);

var _util = require('./util');

var _util2 = _interopRequireDefault(_util);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var initialized = false;

function initialize(cfg) {
  Object.assign(_config2.default, cfg);

  if (_config2.default.firebaseAppName) {
    _app2.default.initializeApp({
      apiKey: _config2.default.firebaseApiKey,
      authDomain: _config2.default.firebaseAppName + '.firebaseapp.com',
      databaseURL: 'https://' + _config2.default.firebaseAppName + '.firebaseio.com',
      storageBucket: _config2.default.firebaseStorageBucket
    });
  }

  if (_config2.default.apiBaseUrl) {
    _auth2.default.initialize();
  }

  initialized = true;
}

var isInitialized = function isInitialized() {
  return initialized;
};

if (!_config2.default.isLive) {
  window.autorun = _mobx.autorun;
  window.computed = _mobx.computed;
  window.map = _mobx.map;
  window.observable = _mobx.observable;
  window.when = _mobx.when;

  window.M = {
    auth: _auth2.default,
    config: _config2.default,
    dimensions: _dimensions2.default,
    firebase: _app2.default,
    decorator: _decorator2.default,
    LiveQuery: _liveQuery2.default,
    MultiLiveQuery: _multiLiveQuery2.default,
    storage: _storage2.default,
    util: _util2.default
  };
}

exports.auth = _auth2.default;
exports.config = _config2.default;
exports.dimensions = _dimensions2.default;
exports.firebase = _app2.default;
exports.m = _decorator2.default;
exports.LiveQuery = _liveQuery2.default;
exports.isInitialized = isInitialized;
exports.MultiLiveQuery = _multiLiveQuery2.default;
exports.storage = _storage2.default;
exports.util = _util2.default;