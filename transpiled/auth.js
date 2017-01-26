'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _desc, _value, _class, _descriptor, _descriptor2, _descriptor3, _descriptor4;

var _mobx = require('mobx');

var _urijs = require('urijs');

var _urijs2 = _interopRequireDefault(_urijs);

var _index = require('./index');

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var _facebook = require('./facebook');

var _facebook2 = _interopRequireDefault(_facebook);

var _util = require('./util');

var _util2 = _interopRequireDefault(_util);

var _liveQuery = require('./liveQuery');

var _liveQuery2 = _interopRequireDefault(_liveQuery);

var _storage = require('./storage');

var _storage2 = _interopRequireDefault(_storage);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

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

var Auth = (_class = function () {
  function Auth() {
    _classCallCheck(this, Auth);

    _initDefineProp(this, 'sessionId', _descriptor, this);

    _initDefineProp(this, 'uid', _descriptor2, this);

    _initDefineProp(this, 'isAdmin', _descriptor3, this);

    _initDefineProp(this, '_fiUser', _descriptor4, this);

    this._loggingIn = false;
    this._loggedInWithFacebook = false;
  }

  _createClass(Auth, [{
    key: 'initialize',
    value: function initialize() {
      var _this = this;

      (0, _mobx.reaction)(function () {
        return _this.sessionId;
      }, function () {
        if (_this.sessionId) {
          _storage2.default.set('sessionId', _this.sessionId);
        } else {
          _storage2.default.remove('sessionId');
        }
      });

      var _initializedUid = false;
      (0, _mobx.reaction)(function () {
        return _this.uid;
      }, function () {
        if (!_initializedUid && _this.uid !== undefined) {
          _initializedUid = true;
        }
        if (_initializedUid) {
          if (_this.uid) {
            _storage2.default.set('uid', _this.uid);
          } else {
            _storage2.default.remove('uid');
          }
        }
      }, true);

      (0, _mobx.reaction)(function () {
        return _this.isAdmin;
      }, function () {
        if (_this.isAdmin !== undefined) {
          if (_this.isAdmin == null) {
            _storage2.default.remove('isAdmin');
          } else {
            _storage2.default.set('isAdmin', _this.isAdmin);
          }
        }
      }, true);

      _index.firebase.auth().onAuthStateChanged(function (fiUser) {
        _this._fiUser = fiUser;
        if (!fiUser && _this.uid) {
          console.info('Firebase-triggered logout');
          // In case the Firebase session randomly expires,
          // log out to avoid inconsistency between the API's
          // session and Firebase's session.
          _this.logout();
        }
      });

      window.addEventListener('storage', function () {
        var ref = _asyncToGenerator(function* (e) {
          // Handle localStorage change triggered from another tab/window
          if (e.key == 'sessionId') {
            this.sessionId = e.newValue || undefined;
          } else if (e.key == 'firebaseToken') {
            if (e.newValue) {
              var currentToken = null;
              if (this._fiUser) {
                currentToken = yield _index.firebase.auth().currentUser.getToken();
              }
              if (currentToken != e.newValue) {
                try {
                  yield _index.firebase.auth().signInWithCustomToken(e.newValue);
                } catch (err) {
                  console.error(err);
                }
              }
            }
          } else if (e.key == 'uid') {
            this.uid = e.newValue;
          } else if (e.key == 'isAdmin') {
            this.isAdmin = e.newValue;
          }
        });

        return function (_x) {
          return ref.apply(this, arguments);
        };
      }().bind(this));

      this.userLq = new _liveQuery2.default(function () {
        return _this.uid && ['users', _this.uid];
      }, { name: 'Auth.user', start: true });

      (0, _mobx.reaction)(function () {
        return _this.user;
      }, function () {
        if (_this.user) {
          _this.isAdmin = _this.user.isAdmin || false;
        }
      }, true);

      // The setTimeout is because ensureSession depends on util methods
      // which import this module and need it to have finished initializing
      setTimeout(function () {
        if (!_this._loggingIn) _this.ensureSession();
      });
    }
  }, {
    key: '_setFirebaseToken',
    value: function _setFirebaseToken(firebaseToken) {
      if (firebaseToken) {
        _storage2.default.set('firebaseToken', firebaseToken);
      } else {
        _storage2.default.remove('firebaseToken');
      }
    }
  }, {
    key: 'startNewSession',
    value: function () {
      var ref = _asyncToGenerator(function* () {
        var _this2 = this;

        var session = void 0;
        try {
          session = yield _util2.default.apiCall('newSession', {
            method: 'post',
            headers: {
              'Content-Type': "application/json"
            }
          }, null);
        } catch (err) {
          console.error('Error starting new session', err);
          throw err;
        }

        (0, _mobx.transaction)(function () {
          _this2.sessionId = session.id;
          _this2.uid = session.uid;
        });
      });

      function startNewSession() {
        return ref.apply(this, arguments);
      }

      return startNewSession;
    }()
  }, {
    key: 'ensureSession',
    value: function () {
      var ref = _asyncToGenerator(function* () {
        var _this3 = this;

        if (this.sessionId) {
          yield* function* () {
            var session = yield _util2.default.apiGet('session');
            if (session) {
              if (session.uid) {
                (0, _mobx.when)(function () {
                  return _this3._fiUser !== undefined;
                }, function () {
                  if (_this3._fiUser && _this3._fiUser.uid == session.uid) {
                    if (_this3.uid !== session.uid) {
                      (0, _mobx.transaction)(function () {
                        _this3.uid = session.uid;

                        // If undefined, will be set when user loads
                        _this3.isAdmin = session.uid ? undefined : null;
                      });
                    }
                  } else {
                    // Apparently we're logged into the API but not into
                    // Firebase. Just log out to restore a consistent state.
                    _this3.logout();
                  }
                });
              } else {
                _this3.uid = null;
                _this3.isAdmin = false;
              }
            } else {
              yield _this3.startNewSession();
            }
          }();
        } else {
          yield this.startNewSession();
        }
      });

      function ensureSession() {
        return ref.apply(this, arguments);
      }

      return ensureSession;
    }()
  }, {
    key: 'loginWithFacebook',
    value: function () {
      var ref = _asyncToGenerator(function* () {
        var _this4 = this;

        this._loggingIn = true;
        (0, _mobx.transaction)(function () {
          _this4.uid = undefined;
          _this4.isAdmin = undefined;
        });

        var FB = void 0;
        if (window.FB) {
          // Bypass the elegant way because some browsers don't get that it's
          // is "synchronous" for the purpose of allowing a popup
          FB = window.FB;
        } else {
          FB = yield (0, _facebook2.default)();
        }
        var response = yield new Promise(function (resolve) {
          return window.FB.login(resolve);
        });
        if (!response.authResponse) {
          // User cancelled login
          this.uid = null;
          this._loggingIn = false;
          return;
        }
        var fbToken = response.authResponse.accessToken;

        var apiResponse = void 0;
        try {
          apiResponse = yield _util2.default.apiPost('loginWithFacebook', {
            fbToken: fbToken
          });
        } catch (err) {
          this._loggingIn = false;
          (0, _mobx.transaction)(function () {
            _this4.uid = null;
            _this4.isAdmin = null;
          });
          err.fbToken = fbToken;
          throw err;
        }

        this._setFirebaseToken(apiResponse.firebaseToken);
        yield _index.firebase.auth().signInWithCustomToken(apiResponse.firebaseToken);

        this._loggingIn = false;
        this._loggedInWithFacebook = true;
        (0, _mobx.transaction)(function () {
          _this4.uid = _index.firebase.auth().currentUser.uid;
          _this4.isAdmin = apiResponse.isAdmin;
        });
      });

      function loginWithFacebook() {
        return ref.apply(this, arguments);
      }

      return loginWithFacebook;
    }()
  }, {
    key: 'registerWithFacebook',
    value: function () {
      var ref = _asyncToGenerator(function* (params) {
        var _this5 = this;

        this._loggingIn = true;
        (0, _mobx.transaction)(function () {
          _this5.uid = undefined;
          _this5.isAdmin = undefined;
        });

        var apiResponse = void 0;
        try {
          apiResponse = yield _util2.default.apiPost('registerWithFacebook', params);
        } catch (err) {
          this._loggingIn = false;
          (0, _mobx.transaction)(function () {
            _this5.uid = null;
            _this5.isAdmin = null;
          });
          throw err;
        }

        this._setFirebaseToken(apiResponse.firebaseToken);
        yield _index.firebase.auth().signInWithCustomToken(apiResponse.firebaseToken);

        this._loggingIn = false;
        this._loggedInWithFacebook = true;
        (0, _mobx.transaction)(function () {
          _this5.uid = _index.firebase.auth().currentUser.uid;
          _this5.isAdmin = apiResponse.isAdmin;
        });
      });

      function registerWithFacebook(_x2) {
        return ref.apply(this, arguments);
      }

      return registerWithFacebook;
    }()
  }, {
    key: 'redirectToLinkedInOauth',
    value: function redirectToLinkedInOauth() {
      var nextUrl = arguments.length <= 0 || arguments[0] === undefined ? window.location.href : arguments[0];

      window.location = 'https://www.linkedin.com/uas/oauth2/authorization?' + _util2.default.objToParamString({
        response_type: 'code',
        client_id: _config2.default.linkedInClientId,
        redirect_uri: _config2.default.linkedInRedirectUri + '?' + _util2.default.objToParamString({
          next: (0, _urijs2.default)(nextUrl).resource()
        }),
        state: 'TODO'
      });
    }
  }, {
    key: 'loginOrRegisterWithLinkedIn',
    value: function () {
      var ref = _asyncToGenerator(function* (linkedInCode, nextUrl) {
        var _this6 = this;

        this._loggingIn = true;
        (0, _mobx.transaction)(function () {
          _this6.uid = undefined;
          _this6.isAdmin = undefined;
        });

        var apiResponse = void 0;
        try {
          apiResponse = yield _util2.default.apiPost('loginOrRegisterWithLinkedIn', {
            linkedInCode: linkedInCode,
            redirectUri: _config2.default.linkedInRedirectUri + '?' + _util2.default.objToParamString({
              next: nextUrl
            })
          });
        } catch (err) {
          console.error('Login failed', err);
          this._loggingIn = false;
          (0, _mobx.transaction)(function () {
            _this6.uid = null;
            _this6.isAdmin = null;
          });
          return;
        }

        this._setFirebaseToken(apiResponse.firebaseToken);
        yield _index.firebase.auth().signInWithCustomToken(apiResponse.firebaseToken);

        this._loggingIn = false;
        (0, _mobx.transaction)(function () {
          _this6.uid = _index.firebase.auth().currentUser.uid;
          _this6.isAdmin = apiResponse.isAdmin;
        });

        return apiResponse;
      });

      function loginOrRegisterWithLinkedIn(_x4, _x5) {
        return ref.apply(this, arguments);
      }

      return loginOrRegisterWithLinkedIn;
    }()
  }, {
    key: 'loginOrRegister',
    value: function () {
      var ref = _asyncToGenerator(function* (params) {
        var _this7 = this;

        this._loggingIn = true;
        (0, _mobx.transaction)(function () {
          _this7.uid = undefined;
          _this7.isAdmin = undefined;
        });

        var apiResponse = void 0;
        try {
          apiResponse = yield _util2.default.apiPost('loginOrRegister', params);
        } catch (err) {
          this._loggingIn = false;
          (0, _mobx.transaction)(function () {
            _this7.uid = null;
            _this7.isAdmin = null;
          });
          throw err;
        }

        this._setFirebaseToken(apiResponse.firebaseToken);
        yield _index.firebase.auth().signInWithCustomToken(apiResponse.firebaseToken);

        this._loggingIn = false;
        (0, _mobx.transaction)(function () {
          _this7.uid = _index.firebase.auth().currentUser.uid;
          _this7.isAdmin = apiResponse.isAdmin;
        });

        return apiResponse;
      });

      function loginOrRegister(_x6) {
        return ref.apply(this, arguments);
      }

      return loginOrRegister;
    }()
  }, {
    key: 'loginAs',
    value: function () {
      var ref = _asyncToGenerator(function* (linkedInId) {
        var _this8 = this;

        (0, _mobx.transaction)(function () {
          _this8.uid = undefined;
          _this8.isAdmin = undefined;
        });

        var apiResponse = void 0;
        try {
          apiResponse = yield _util2.default.apiPost('loginAs', {
            linkedInId: linkedInId
          });
        } catch (err) {
          console.log('loginAs failed');
          return;
        }

        this._setFirebaseToken(apiResponse.firebaseToken);
        yield _index.firebase.auth().signInWithCustomToken(apiResponse.firebaseToken);
        (0, _mobx.transaction)(function () {
          _this8.uid = apiResponse.uid, _this8.isAdmin = apiResponse.isAdmin;
        });
      });

      function loginAs(_x7) {
        return ref.apply(this, arguments);
      }

      return loginAs;
    }()
  }, {
    key: 'logout',
    value: function () {
      var ref = _asyncToGenerator(function* () {
        var _this9 = this;

        var oldSessionId = this.sessionId;
        (0, _mobx.transaction)(function () {
          _this9.uid = null;
          _this9.isAdmin = null;
          _this9.sessionId = undefined;
        });
        this._setFirebaseToken(null);
        yield Promise.all([_index.firebase.auth().signOut(), this._loggedInWithFacebook && (0, _facebook2.default)().then(function (FB) {
          return new Promise(function (resolve) {
            return FB.logout(resolve);
          });
        })]);

        var apiResponse = void 0;
        try {
          apiResponse = yield _util2.default.apiCall('logout', {
            method: 'post',
            headers: {
              'Content-Type': "application/json"
            }
          }, oldSessionId);
        } catch (err) {
          console.error(err);
          return;
        }

        this._loggedInWithFacebook = false;
        this.sessionId = apiResponse.newSessionId;
      });

      function logout() {
        return ref.apply(this, arguments);
      }

      return logout;
    }()
  }, {
    key: 'user',
    get: function get() {
      return this.userLq.value;
    }
  }]);

  return Auth;
}(), (_descriptor = _applyDecoratedDescriptor(_class.prototype, 'sessionId', [_mobx.observable], {
  enumerable: true,
  initializer: function initializer() {
    return _storage2.default.get('sessionId');
  }
}), _descriptor2 = _applyDecoratedDescriptor(_class.prototype, 'uid', [_mobx.observable], {
  enumerable: true,
  initializer: function initializer() {
    return undefined;
  }
}), _descriptor3 = _applyDecoratedDescriptor(_class.prototype, 'isAdmin', [_mobx.observable], {
  enumerable: true,
  initializer: function initializer() {
    return undefined;
  }
}), _descriptor4 = _applyDecoratedDescriptor(_class.prototype, '_fiUser', [_mobx.observable], {
  enumerable: true,
  initializer: function initializer() {
    return undefined;
  }
}), _applyDecoratedDescriptor(_class.prototype, 'user', [_mobx.computed], Object.getOwnPropertyDescriptor(_class.prototype, 'user'), _class.prototype)), _class);
exports.default = new Auth();