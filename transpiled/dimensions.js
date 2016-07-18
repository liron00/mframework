'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _desc, _value, _class, _descriptor, _descriptor2;

var _mobx = require('mobx');

var _throttleDebounce = require('throttle-debounce');

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

var Dimensions = (_class = function () {
  function Dimensions() {
    var _this = this;

    _classCallCheck(this, Dimensions);

    _initDefineProp(this, 'width', _descriptor, this);

    _initDefineProp(this, 'height', _descriptor2, this);

    this.handleResize = (0, _throttleDebounce.throttle)(100, function (e) {
      return _this.refresh();
    });

    this.refresh();
    window.addEventListener('resize', this.handleResize);
  }

  _createClass(Dimensions, [{
    key: 'refresh',
    value: function refresh() {
      if (window.orientation) {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
      } else {
        // Sometimes mobile devices lie and say they have more width than they do,
        // even with our meta viewport tag telling them not to scale
        this.width = Math.min(window.screen.availWidth, window.innerWidth);
        this.height = Math.min(window.screen.availHeight, window.innerHeight);
      }
    }
  }, {
    key: 'isMobile',
    get: function get() {
      return this.width < 960;
    }
  }]);

  return Dimensions;
}(), (_descriptor = _applyDecoratedDescriptor(_class.prototype, 'width', [_mobx.observable], {
  enumerable: true,
  initializer: null
}), _descriptor2 = _applyDecoratedDescriptor(_class.prototype, 'height', [_mobx.observable], {
  enumerable: true,
  initializer: null
}), _applyDecoratedDescriptor(_class.prototype, 'isMobile', [_mobx.computed], Object.getOwnPropertyDescriptor(_class.prototype, 'isMobile'), _class.prototype)), _class);
exports.default = new Dimensions();