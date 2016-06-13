'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

exports.default = m;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _mobx = require('mobx');

var _mobxReact = require('mobx-react');

var _liveQuery = require('./liveQuery');

var _liveQuery2 = _interopRequireDefault(_liveQuery);

var _multiLiveQuery = require('./multiLiveQuery');

var _multiLiveQuery2 = _interopRequireDefault(_multiLiveQuery);

var _util = require('./util');

var _util2 = _interopRequireDefault(_util);

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

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

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

var nextId = 1;

function m(NewComponent) {
  var _class, _desc, _value, _class2, _descriptor;

  var C = (0, _mobxReact.observer)(_class = (_class2 = function (_NewComponent) {
    _inherits(C, _NewComponent);

    function C(props) {
      _classCallCheck(this, C);

      var smartProps = (0, _mobx.observable)({});

      for (var propName in NewComponent.propTypes || {}) {
        var propType = NewComponent.propTypes[propName];
        if (propType != _react2.default.PropTypes.func) {
          if ([_react2.default.PropTypes.array, _react2.default.PropTypes.object, _util2.default.propTypes.array].indexOf(propType) >= 0) {
            (0, _mobx.extendObservable)(smartProps, _defineProperty({}, propName, (0, _mobx.asStructure)(props[propName])));
          } else {
            (0, _mobx.extendObservable)(smartProps, _defineProperty({}, propName, props[propName]));
          }
        }
      }
      for (var _propName in props) {
        if (!(_propName in smartProps)) {
          // Not using extendObservable to purposely make this field
          // non-observable
          smartProps[_propName] = props[_propName];
        }
      }

      var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(C).call(this, props));

      _initDefineProp(_this, 'data', _descriptor, _this);

      _this.liveQueries = {};


      _this.id = nextId++;

      if (_this.debug) {
        console.log(_this + '.constructor', props);
      }

      _this.smartProps = smartProps;

      var _foolReact = false;
      Object.defineProperty(_this, 'props', {
        __proto__: null,
        configurable: false,
        get: function get() {
          if (_foolReact) {
            // Do this once so React's initialization doesn't suspect anything
            _foolReact = false;
            return props;
          }
          return _this.smartProps;
        },
        set: function set(nextProps) {
          // When React plumbing tries to run `this.props = ...`, it'll be
          // a no-op. All the prop-setting we need happens in our constructor
          // and our componentWillReceiveProps handler.
        }
      });

      var _loop = function _loop(dataKey) {
        var specCopy = void 0;
        if (typeof _this.dataSpec[dataKey] == 'function') {
          specCopy = {
            ref: _this.dataSpec[dataKey],
            value: true
          };
        } else {
          specCopy = Object.assign({}, _this.dataSpec[dataKey]);
        }
        if (_this.active) {
          if (specCopy.ref) {
            (function () {
              var refFunc = specCopy.ref;
              specCopy.ref = function () {
                return _this.active() ? refFunc() : undefined;
              };
            })();
          } else if (specCopy.refs) {
            (function () {
              var refsFunc = specCopy.refs;
              specCopy.refs = function () {
                return _this.active() ? refsFunc() : undefined;
              };
            })();
          }
        }

        var isMulti = !!specCopy.refs;
        _this.liveQueries[dataKey] = new (isMulti ? _multiLiveQuery2.default : _liveQuery2.default)(specCopy, {
          start: false,
          name: _this + '.data.' + dataKey
        });
        (0, _mobx.extendObservable)(_this.data, _defineProperty({}, dataKey, (0, _mobx.asStructure)(function () {
          return _this.liveQueries[dataKey].isActive ? _this.liveQueries[dataKey].value : undefined;
        })));
      };

      for (var dataKey in _this.dataSpec || {}) {
        _loop(dataKey);
      }
      for (var _dataKey in _this.liveQueries) {
        _this.liveQueries[_dataKey].start();
      }

      // One-time thing to avoid getting a React warning about screwing
      // with props
      _foolReact = true;
      return _this;
    } // dataKey: liveQuery


    _createClass(C, [{
      key: 'componentWillReceiveProps',
      value: function componentWillReceiveProps(nextProps) {
        var _this2 = this;

        if (this.debug) {
          (0, _mobx.untracked)(function () {
            console.log(_this2 + '.componentWillReceiveProps', nextProps);
          });
        }

        (0, _mobx.transaction)(function () {
          for (var propName in nextProps) {
            _this2.smartProps[propName] = nextProps[propName];
          }
        });

        if (_get(Object.getPrototypeOf(C.prototype), 'componentWillReceiveProps', this)) _get(Object.getPrototypeOf(C.prototype), 'componentWillReceiveProps', this).call(this, nextProps);
      }
    }, {
      key: 'componentWillMount',
      value: function componentWillMount() {
        var _this3 = this;

        if (this.debug) {
          (0, _mobx.untracked)(function () {
            console.log(_this3 + '.componentWillMount', _this3.props);
          });
        }

        if (_get(Object.getPrototypeOf(C.prototype), 'componentWillMount', this)) _get(Object.getPrototypeOf(C.prototype), 'componentWillMount', this).call(this);
      }
    }, {
      key: 'componentDidMount',
      value: function componentDidMount() {
        var _this4 = this;

        if (this.debug) {
          (0, _mobx.untracked)(function () {
            console.log(_this4 + '.componentDidMount', _this4.props);
          });
        }
        this.when(function () {
          return !_this4.active || _this4.active();
        }, function () {
          if (_get(Object.getPrototypeOf(C.prototype), 'componentDidMount', _this4)) _get(Object.getPrototypeOf(C.prototype), 'componentDidMount', _this4).call(_this4);
        });
      }
    }, {
      key: 'autorun',
      value: function autorun(func) {
        var disposer = (0, _mobx.autorun)(func);
        if (!this._autorunDisposers) this._autorunDisposers = [];
        this._autorunDisposers.push(disposer);
      }
    }, {
      key: 'reaction',
      value: function reaction(expressionFunc, sideEffectFunc) {
        var fireImmediately = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];
        var delay = arguments.length <= 3 || arguments[3] === undefined ? 0 : arguments[3];

        var disposer = (0, _mobx.reaction)(expressionFunc, sideEffectFunc, fireImmediately, delay);
        if (!this._reactionDisposers) this._reactionDisposers = [];
        this._reactionDisposers.push(disposer);
      }
    }, {
      key: 'when',
      value: function when(predicate, effect) {
        var disposer = (0, _mobx.when)(predicate, effect);
        if (!this._whenDisposers) this._whenDisposers = [];
        this._whenDisposers.push(disposer);
      }
    }, {
      key: 'clearInterval',
      value: function (_clearInterval) {
        function clearInterval(_x) {
          return _clearInterval.apply(this, arguments);
        }

        clearInterval.toString = function () {
          return _clearInterval.toString();
        };

        return clearInterval;
      }(function (intervalId) {
        clearInterval(intervalId);
        delete this._intervalIds[intervalId];
      })
    }, {
      key: 'clearTimeout',
      value: function (_clearTimeout) {
        function clearTimeout(_x2) {
          return _clearTimeout.apply(this, arguments);
        }

        clearTimeout.toString = function () {
          return _clearTimeout.toString();
        };

        return clearTimeout;
      }(function (timeoutId) {
        clearTimeout(timeoutId);
        delete this._timeoutIds[timeoutId];
      })
    }, {
      key: 'setInterval',
      value: function (_setInterval) {
        function setInterval(_x3, _x4) {
          return _setInterval.apply(this, arguments);
        }

        setInterval.toString = function () {
          return _setInterval.toString();
        };

        return setInterval;
      }(function (f, interval) {
        var intervalId = setInterval(f, interval);
        if (!this._intervalIds) this._intervalIds = {};
        this._intervalIds[intervalId] = true;
        return intervalId;
      })
    }, {
      key: 'setTimeout',
      value: function (_setTimeout) {
        function setTimeout(_x5, _x6) {
          return _setTimeout.apply(this, arguments);
        }

        setTimeout.toString = function () {
          return _setTimeout.toString();
        };

        return setTimeout;
      }(function (f, timeout) {
        var timeoutId = setTimeout(f, timeout);
        if (!this._timeoutIds) this._timeoutIds = {};
        this._timeoutIds[timeoutId] = true;
        return timeoutId;
      })
    }, {
      key: 'shouldComponentUpdate',
      value: function shouldComponentUpdate(nextProps, nextState) {
        return false;
      }
    }, {
      key: 'render',
      value: function render() {
        var _this5 = this;

        if (this.debug) {
          (0, _mobx.untracked)(function () {
            console.log(_this5 + '.render', _this5.props);
          });
        }
        if (!this.active || this.active()) {
          return _get(Object.getPrototypeOf(C.prototype), 'render', this).call(this);
        } else {
          return null;
        }
      }
    }, {
      key: 'componentWillUnmount',
      value: function componentWillUnmount() {
        var _this6 = this;

        if (this.debug) {
          (0, _mobx.untracked)(function () {
            console.log(_this6 + '.componentWillUnmount');
          });
        }
        if (_get(Object.getPrototypeOf(C.prototype), 'componentWillUnmount', this)) _get(Object.getPrototypeOf(C.prototype), 'componentWillUnmount', this).call(this);

        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = (this._autorunDisposers || [])[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var disposer = _step.value;

            disposer();
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

        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = (this._reactionDisposers || [])[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var _disposer = _step2.value;

            _disposer();
          }
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2.return) {
              _iterator2.return();
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
            }
          }
        }

        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
          for (var _iterator3 = (this._whenDisposers || [])[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var _disposer2 = _step3.value;

            _disposer2();
          }
        } catch (err) {
          _didIteratorError3 = true;
          _iteratorError3 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion3 && _iterator3.return) {
              _iterator3.return();
            }
          } finally {
            if (_didIteratorError3) {
              throw _iteratorError3;
            }
          }
        }

        for (var dataKey in this.liveQueries) {
          this.liveQueries[dataKey].dispose();
        }

        var _iteratorNormalCompletion4 = true;
        var _didIteratorError4 = false;
        var _iteratorError4 = undefined;

        try {
          for (var _iterator4 = Object.keys(this._timeoutIds || {})[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            var timeoutIdStr = _step4.value;

            this.clearTimeout(parseInt(timeoutIdStr));
          }
        } catch (err) {
          _didIteratorError4 = true;
          _iteratorError4 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion4 && _iterator4.return) {
              _iterator4.return();
            }
          } finally {
            if (_didIteratorError4) {
              throw _iteratorError4;
            }
          }
        }

        var _iteratorNormalCompletion5 = true;
        var _didIteratorError5 = false;
        var _iteratorError5 = undefined;

        try {
          for (var _iterator5 = Object.keys(this._intervalIds || {})[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
            var intervalIdStr = _step5.value;

            this.clearInterval(parseInt(intervalIdStr));
          }
        } catch (err) {
          _didIteratorError5 = true;
          _iteratorError5 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion5 && _iterator5.return) {
              _iterator5.return();
            }
          } finally {
            if (_didIteratorError5) {
              throw _iteratorError5;
            }
          }
        }
      }
    }, {
      key: 'toString',
      value: function toString() {
        return '<' + NewComponent.name + ' ' + this.id + '>';
      }
    }]);

    return C;
  }(NewComponent), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, 'data', [_mobx.observable], {
    enumerable: true,
    initializer: function initializer() {
      return {};
    }
  })), _class2)) || _class;

  try {
    // This is useful for debugging in desktop Chrome browser
    Object.defineProperty(C, 'name', {
      value: NewComponent.name,
      writable: false
    });
  } catch (err) {
    // Lots of other browsers throw
    // TypeError: Attempting to change value of a readonly property
    // but it's not a big deal
  }

  return C;
}