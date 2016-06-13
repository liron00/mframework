'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _dec, _dec2, _desc, _value, _class, _descriptor;

var _mobx = require('mobx');

var _index = require('./index');

var _liveQuery = require('./liveQuery');

var _liveQuery2 = _interopRequireDefault(_liveQuery);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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

var MultiLiveQuery = (_dec = (0, _mobx.computed)({ asStructure: true }), _dec2 = (0, _mobx.computed)({ asStructure: true }), (_class = function () {
  function MultiLiveQuery(dataSpec) {
    var _this = this;

    var _ref = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    var _ref$start = _ref.start;
    var start = _ref$start === undefined ? true : _ref$start;
    var _ref$name = _ref.name;
    var name = _ref$name === undefined ? null : _ref$name;

    _classCallCheck(this, MultiLiveQuery);

    _initDefineProp(this, 'isActive', _descriptor, this);

    this.queryMap = (0, _mobx.map)();

    if (typeof dataSpec == 'function') {
      // Shorthand syntax
      this.dataConfig = {
        refs: dataSpec,
        value: true
      };
    } else {
      this.dataConfig = dataSpec;
    }
    if (this.dataConfig.value && typeof this.dataConfig.value != 'function') {
      (function () {
        var valueFunc = _liveQuery2.default.compileValueFunc(_this.dataConfig.value);
        _this.dataConfig.value = function (key, snap, prevChildKey) {
          return valueFunc(snap, prevChildKey);
        };
      })();
    }

    this.name = name;
    if (start) this.start();
  }

  _createClass(MultiLiveQuery, [{
    key: '_makeLiveQuery',
    value: function _makeLiveQuery(key, pathSpec) {
      var _this2 = this;

      var lqConfig = {
        ref: function ref() {
          return pathSpec;
        }
      };
      if (this.dataConfig.refOptions) {
        lqConfig.refOptions = function (ref) {
          if (_this2.pathSpecs !== _this2._oldPathSpecs) {
            // Computed pathSpecs changed before our autorun had time to
            // stop potentially outdated LiveQuery instances
            return undefined;
          }
          return _this2.dataConfig.refOptions(key, ref);
        };
      }
      if (this.dataConfig.onErr) {
        lqConfig.onErr = function (err) {
          return _this2.dataConfig.onErr(key, err);
        };
      }
      var _arr = ['value', 'child_added', 'child_changed', 'child_moved', 'child_removed'];

      var _loop = function _loop() {
        var eventType = _arr[_i];
        if (_this2.dataConfig[eventType]) {
          lqConfig[eventType] = function (snap, prevChildKey) {
            return _this2.dataConfig[eventType](key, snap, prevChildKey);
          };
        }
      };

      for (var _i = 0; _i < _arr.length; _i++) {
        _loop();
      }
      return (0, _mobx.untracked)(function () {
        return new _liveQuery2.default(lqConfig, {
          name: (_this2.name || '[unnamed]') + '.' + key,
          start: true
        });
      });
    }
  }, {
    key: 'start',
    value: function start() {
      var _this3 = this;

      if (this.isActive) {
        throw new Error(this + ' already started');
      }

      var oldQueryByKey = {};
      this._disposer = (0, _mobx.autorun)(function () {
        (0, _mobx.transaction)(function () {
          var newQueryByKey = {};
          _this3.queryMap.clear();

          for (var key in _this3.pathSpecs || {}) {
            var liveQuery = _this3._makeLiveQuery(key, _this3.pathSpecs[key]);
            newQueryByKey[key] = liveQuery;
            _this3.queryMap.set(key, liveQuery);
          }

          for (var _key in oldQueryByKey) {
            oldQueryByKey[_key].dispose();
          }oldQueryByKey = newQueryByKey;
          _this3._oldPathSpecs = _this3.pathSpecs;
        });
      });

      this.isActive = true;
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

      this.queryMap.forEach(function (liveQuery, key) {
        liveQuery.dispose();
      });
      this.queryMap.clear();

      this.isActive = false;
    }
  }, {
    key: 'toString',
    value: function toString() {
      return this.name ? '<MultiLiveQuery ' + this.name + '>' : '<MultiLiveQuery>';
    }
  }, {
    key: 'value',
    get: function get() {
      var _this4 = this;

      if (!(0, _mobx.untracked)(function () {
        return _this4.isActive;
      })) {
        // This used to be an error, but apparently this path happens naturally
        // and it's not a big deal, so just return undefined
        return undefined;
      }
      if (!this.pathSpecs) return this.pathSpecs;

      var valueByKey = {};
      for (var key in this.pathSpecs) {
        if (this.queryMap.has(key)) {
          var liveQuery = this.queryMap.get(key);
          valueByKey[key] = liveQuery.value;
        } else {
          valueByKey[key] = undefined;
        }

        if (this.dataConfig.waitForAll && valueByKey[key] === undefined) {
          return undefined;
        }
      }
      return valueByKey;
    }
  }, {
    key: 'pathSpecs',
    get: function get() {
      var pathParts = this.dataConfig.refs();
      if (pathParts === undefined) return undefined;
      if (pathParts === null) return null;

      if (pathParts.constructor === Object) {
        var _pathSpecByKey = {};
        for (var key in pathParts) {
          _pathSpecByKey[key] = pathParts[key];
        }
        return _pathSpecByKey;
      }

      if (!Array.isArray(pathParts)) {
        console.log('pathParts', pathParts);
        throw new Error(this + ' got non-array refs: ' + pathParts);
      }
      if (pathParts.indexOf(undefined) >= 0) return undefined;
      if (pathParts.findIndex(function (part) {
        return !part;
      }) >= 0) {
        throw new Error('Invalid path part in ' + JSON.stringify(pathParts));
      }

      var multiIndex = pathParts.findIndex(function (part) {
        return part instanceof Array;
      });
      if (multiIndex == -1) {
        throw new Error('Invalid ref for MultiLiveQuery: ' + JSON.stringify(pathParts));
      }
      var pathSpecByKey = {};
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = pathParts[multiIndex][Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var _key2 = _step.value;

          var keyPathSpec = pathParts.slice();
          keyPathSpec.splice(multiIndex, 1, _key2);
          pathSpecByKey[_key2] = keyPathSpec;
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

      return pathSpecByKey;
    }
  }]);

  return MultiLiveQuery;
}(), (_descriptor = _applyDecoratedDescriptor(_class.prototype, 'isActive', [_mobx.observable], {
  enumerable: true,
  initializer: null
}), _applyDecoratedDescriptor(_class.prototype, 'value', [_dec], Object.getOwnPropertyDescriptor(_class.prototype, 'value'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'pathSpecs', [_dec2], Object.getOwnPropertyDescriptor(_class.prototype, 'pathSpecs'), _class.prototype)), _class));
exports.default = MultiLiveQuery;