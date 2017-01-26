'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _mobx = require('mobx');

var _reactRouter = require('react-router');

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var _auth = require('./auth');

var _auth2 = _interopRequireDefault(_auth);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

var util = {
  apiCall: function apiCall(endpoint, options, sessionId) {
    return _asyncToGenerator(function* () {
      options = Object.assign({}, options);
      options.params = Object.assign({}, options.params);

      if (sessionId === undefined) {
        yield new Promise(function (resolve) {
          return (0, _mobx.when)(function () {
            return _auth2.default.sessionId;
          }, resolve);
        });
        sessionId = _auth2.default.sessionId;
      }
      options.params.sessionId = sessionId;

      var url = _config2.default.apiBaseUrl + endpoint;
      if (options.params) {
        if (options.method == 'post') {
          options.body = JSON.stringify(options.params);
        } else {
          url += '?' + util.objToParamString(options.params);
        }
        delete options.params;
      }

      var apiResponse = yield fetch(url, options);
      if (!apiResponse.ok) {
        throw new Error(apiResponse.status + ': ' + apiResponse.statusText);
      }

      var apiResponseJson = yield apiResponse.json();
      if (apiResponseJson && apiResponseJson.err) {
        var err = new Error(apiResponseJson.err);
        err.id = apiResponseJson.errId || null;
        throw err;
      }

      return apiResponseJson;
    })();
  },
  apiGet: function apiGet(endpoint) {
    var params = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    return util.apiCall(endpoint, {
      headers: {
        'Content-Type': "application/json"
      },
      params: params
    });
  },
  apiPost: function apiPost(endpoint) {
    var params = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    return util.apiCall(endpoint, {
      method: 'post',
      headers: {
        'Content-Type': "application/json"
      },
      params: params
    });
  },


  formatMessengerDate: function formatMessengerDate(date) {
    date = (0, _moment2.default)(date);
    var now = (0, _moment2.default)();

    if (now.diff(date, 'hours') <= 11) {
      return date.format('h:mma');
    } else if (now.diff(date, 'days') <= 5) {
      return date.format('ddd');
    } else {
      return date.format('MMM D');
    }
  },

  makeComparator: function makeComparator(keyFunc, reverse) {
    return function (a, b) {
      if (reverse) {
        var temp = a;
        a = b;
        b = temp;
      }
      var aKey = keyFunc(a);
      var bKey = keyFunc(b);
      if (aKey instanceof Array && bKey instanceof Array) {
        for (var i = 0; i < aKey.length; i++) {
          if (aKey[i] < bKey[i]) {
            return -1;
          } else if (bKey[i] < aKey[i]) {
            return 1;
          }
        }
        return 0;
      } else {
        if (aKey < bKey) {
          return -1;
        } else if (bKey < aKey) {
          return 1;
        } else {
          return 0;
        }
      }
    };
  },

  objToParamString: function objToParamString(obj) {
    var options = arguments.length <= 1 || arguments[1] === undefined ? { spaceToPlus: false } : arguments[1];

    var str = "";
    for (var key in obj) {
      if (obj[key] == null) continue;

      var valueStr = encodeURIComponent(obj[key]);
      if (options.spaceToPlus) {
        valueStr = valueStr.replace(/%20/g, '+');
      }

      if (str != "") {
        str += "&";
      }
      str += key + "=" + valueStr;
    }
    return str;
  },

  regexEscape: function regexEscape(pattern) {
    return pattern.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  },
  routeIsActive: function routeIsActive(path) {
    if (path[0] != '/') {
      path = '/' + path;
    }
    return util.browserLocation.pathname == path;
  },


  browserLocation: (0, _mobx.observable)({})
};

_reactRouter.browserHistory.listen(function (location) {
  (0, _mobx.extendObservable)(util.browserLocation, location);
});

util.propTypes = {
  array: function array(props, propName, componentName) {
    if (!(props[propName] == null || Array.isArray(props[propName]) || (0, _mobx.isObservableArray)(props[propName]))) {
      return new Error(componentName + '.props.' + propName + ' must be' + ' an Array or ObservableArray');
    }
  }
};

exports.default = util;