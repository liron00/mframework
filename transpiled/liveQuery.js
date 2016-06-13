'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _dec, _dec2, _desc, _value, _class, _descriptor, _descriptor2, _class2, _temp;

var _mobx = require('mobx');

var _index = require('./index');

function _initDefineProp(target, property, descriptor, context) {
  if (!descriptor) return;
  Object.defineProperty(target, property, {
    enumerable: descriptor.enumerable,
    configurable: descriptor.configurable,
    writable: descriptor.writable,
    value: descriptor.initializer ? descriptor.initializer.call(context) : void 0
  });
}

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) {
  var desc = {};
  Object['ke' + 'ys'](descriptor).forEach(function (key) {
    desc[key] = descriptor[key];
  });
  desc.enumerable = !!desc.enumerable;
  desc.configurable = !!desc.configurable;

  if ('value' in desc || desc.initializer) {
    desc.writable = true;
  }

  desc = decorators.slice().reverse().reduce(function (desc, decorator) {
    return decorator(target, property, desc) || desc;
  }, desc);

  if (context && desc.initializer !== void 0) {
    desc.value = desc.initializer ? desc.initializer.call(context) : void 0;
    desc.initializer = undefined;
  }

  if (desc.initializer === void 0) {
    Object['define' + 'Property'](target, property, desc);
    desc = null;
  }

  return desc;
}

function _initializerWarningHelper(descriptor, context) {
  throw new Error('Decorating class property failed. Please ensure that transform-class-properties is enabled.');
}

var LiveQuery = (_dec = (0, _mobx.computed)({ asStructure: true }), _dec2 = (0, _mobx.computed)({ asStructure: true }), (_class = (_temp = _class2 = function () {
  function LiveQuery(dataSpec) {
    var _ref = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    var _ref$start = _ref.start;
    var start = _ref$start === undefined ? true : _ref$start;
    var _ref$name = _ref.name;
    var name = _ref$name === undefined ? null : _ref$name;

    _classCallCheck(this, LiveQuery);

    _initDefineProp(this, '_value', _descriptor, this);

    _initDefineProp(this, 'isActive', _descriptor2, this);

    if (typeof dataSpec == 'function') {
      // Shorthand syntax
      this.dataConfig = {
        ref: dataSpec,
        value: true
      };
    } else {
      this.dataConfig = dataSpec;
    }
    if (this.dataConfig.value && typeof this.dataConfig.value != 'function') {
      this.dataConfig.value = this.constructor.compileValueFunc(this.dataConfig.value);
    }

    this._oldQuery = null;
    this._queryHandlers = {}; // eventType: handler

    this.name = name;
    if (start) this.start();
  }

  _createClass(LiveQuery, [{
    key: 'start',
    value: function start() {
      var _this = this;

      if (this.isActive) {
        throw new Error(this + ' already started');
      }

      this.isActive = true;

      this._disposer = (0, _mobx.autorun)(function () {
        _this._reallyStarted = true;

        if (_this._oldQuery) {
          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = undefined;

          try {
            for (var _iterator = Object.keys(_this._queryHandlers)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              var eventType = _step.value;

              var handler = _this._queryHandlers[eventType];
              _this._oldQuery.off(eventType, handler);
              delete _this._queryHandlers[eventType];
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
        }

        _this._oldQuery = _this.query;

        if (_this.query === null) {
          _this._value = null;
          return;
        }
        _this._value = undefined;
        if (_this.query === undefined) return;

        var _loop = function _loop(_eventType) {
          if (['value', 'child_added', 'child_changed', 'child_moved', 'child_removed'].indexOf(_eventType) == -1) return 'continue';

          var callback = _this.dataConfig[_eventType];
          if (typeof callback != 'function') {
            throw new Error('Invalid callback for ' + _eventType + ': ' + callback);
          }

          _this._queryHandlers[_eventType] = _this.query.on(_eventType, function (snap, prevChildKey) {
            var retVal = callback(snap, prevChildKey);
            if (_eventType == 'value') {
              _this._value = retVal;
            }
          }, function (err) {
            if ('onErr' in _this.dataConfig) {
              _this.dataConfig.onErr(err);
            } else {
              console.warn(_this.toString(), err);
            }
          });
        };

        for (var _eventType in _this.dataConfig) {
          var _ret = _loop(_eventType);

          if (_ret === 'continue') continue;
        }

        if (Object.keys(_this._queryHandlers).length == 0) {
          console.warn('No event handlers for LiveQuery', _this.name);
        }
      });
    }
  }, {
    key: 'dispose',
    value: function dispose() {
      this.stop();
    }
  }, {
    key: 'stop',
    value: function stop() {
      if (this._disposer) {
        this._disposer();
        delete this._disposer;
      }

      for (var eventType in this._queryHandlers) {
        this._oldQuery.off(eventType, this._queryHandlers[eventType]);
      }

      this._reallyStarted = false;
      this.isActive = false;
    }
  }, {
    key: 'toString',
    value: function toString() {
      return this.name ? '<LiveQuery ' + this.name + '>' : '<LiveQuery>';
    }
  }, {
    key: 'value',
    get: function get() {
      var _this2 = this;

      if (!(0, _mobx.untracked)(function () {
        return _this2.isActive;
      })) {
        // This used to be an error, but apparently this path happens naturally
        // during multiQueries and it's not a big deal, so just return undefined
        return undefined;
      }

      if (this.query === this._oldQuery) {
        return this._value;
      } else {
        // Computed query has changed before the autorun had time to update
        // this._value
        this._value; // for tracking
        return this.query === null ? null : undefined;
      }
    }
  }, {
    key: 'pathSpec',
    get: function get() {
      var pathParts = this.dataConfig.ref();
      if (pathParts === undefined) return undefined;
      if (pathParts === null) return null;
      if (!Array.isArray(pathParts)) {
        throw new Error(this + ' got non-array ref: ' + pathParts);
      }
      if (pathParts.indexOf(undefined) >= 0) return undefined;
      if (pathParts.findIndex(function (part) {
        return !part;
      }) >= 0) {
        throw new Error(this + ' Invalid path part in ' + JSON.stringify(pathParts));
      }
      return pathParts;
    }
  }, {
    key: 'query',
    get: function get() {
      var _this3 = this;

      if (!(0, _mobx.untracked)(function () {
        return _this3.isActive;
      })) {
        // This used to be an error, but apparently this path happens naturally
        // for multiQueries and it's not a big deal, so just return undefined
        return undefined;
      }
      if (this.pathSpec === undefined) return undefined;
      if (this.pathSpec === null) return null;

      // Return Firebase.Query
      var rawRef = _index.firebase.database().ref().child(this.pathSpec.join('/'));
      var refOptionsFunc = this.dataConfig.refOptions || function (ref) {
        return ref;
      };
      return refOptionsFunc(rawRef);
    }
  }]);

  return LiveQuery;
}(), _class2.compileValueFunc = function (valueFunc) {
  if (valueFunc === true) {
    return function (snap) {
      return snap.val();
    };
  } else if (valueFunc == 'WITH_ID') {
    return function (snap) {
      var ret = snap.val();
      if (ret) ret.id = snap.key;
      return ret;
    };
  } else if (valueFunc == 'ID_ARR') {
    return function (snap) {
      var ret = [];
      if (snap.val()) {
        snap.forEach(function (childRef) {
          ret.push(childRef.key);
        });
      }
      return ret;
    };
  } else if (valueFunc == 'ARR') {
    return function (snap) {
      var ret = [];
      if (snap.val()) {
        snap.forEach(function (childRef) {
          ret.push(childRef.val());
        });
      }
      return ret;
    };
  } else if (valueFunc == 'ARR_WITH_IDS') {
    return function (snap) {
      var ret = [];
      if (snap.val()) {
        snap.forEach(function (childRef) {
          var childObj = childRef.val();
          childObj.id = childRef.key;
          ret.push(childObj);
        });
      }
      return ret;
    };
  }
}, _temp), (_descriptor = _applyDecoratedDescriptor(_class.prototype, '_value', [_mobx.observable], {
  enumerable: true,
  initializer: null
}), _descriptor2 = _applyDecoratedDescriptor(_class.prototype, 'isActive', [_mobx.observable], {
  enumerable: true,
  initializer: null
}), _applyDecoratedDescriptor(_class.prototype, 'value', [_dec], Object.getOwnPropertyDescriptor(_class.prototype, 'value'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'pathSpec', [_dec2], Object.getOwnPropertyDescriptor(_class.prototype, 'pathSpec'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'query', [_mobx.computed], Object.getOwnPropertyDescriptor(_class.prototype, 'query'), _class.prototype)), _class));
exports.default = LiveQuery;