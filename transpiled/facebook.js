'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var fbLoadCallbacks = [];

window.fbAsyncInit = function () {
  FB.init({
    appId: _config2.default.facebookAppId,
    xfbml: true,
    version: 'v2.6'
  });
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = fbLoadCallbacks[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var callback = _step.value;

      callback();
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }
};

exports.default = function () {
  return new Promise(function (resolve) {
    if (window.FB) {
      resolve(FB);
    } else {
      fbLoadCallbacks.push(function () {
        return resolve(FB);
      });
    }
  });
};