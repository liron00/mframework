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

      (0, _mobx.autorun)(function () {
        if (_this.sessionId) {
          _storage2.default.set('sessionId', _this.sessionId);
        } else {
          _storage2.default.remove('sessionId');
        }
      });

      var _initializedUid = false;
      (0, _mobx.autorun)(function () {
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
      });

      (0, _mobx.autorun)(function () {
        if (_this.isAdmin != null) {
          _storage2.default.set('isAdmin', _this.isAdmin);
        } else {
          _storage2.default.remove('isAdmin');
        }
      });

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
        var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(e) {
          var currentToken;
          return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  if (!(e.key == 'sessionId')) {
                    _context.next = 4;
                    break;
                  }

                  this.sessionId = e.newValue || undefined;
                  _context.next = 23;
                  break;

                case 4:
                  if (!(e.key == 'firebaseToken')) {
                    _context.next = 22;
                    break;
                  }

                  if (!e.newValue) {
                    _context.next = 20;
                    break;
                  }

                  currentToken = null;

                  if (!this._fiUser) {
                    _context.next = 11;
                    break;
                  }

                  _context.next = 10;
                  return _index.firebase.auth().currentUser.getToken();

                case 10:
                  currentToken = _context.sent;

                case 11:
                  if (!(currentToken != e.newValue)) {
                    _context.next = 20;
                    break;
                  }

                  _context.prev = 12;
                  _context.next = 15;
                  return _index.firebase.auth().signInWithCustomToken(e.newValue);

                case 15:
                  _context.next = 20;
                  break;

                case 17:
                  _context.prev = 17;
                  _context.t0 = _context['catch'](12);

                  console.error(_context.t0);

                case 20:
                  _context.next = 23;
                  break;

                case 22:
                  if (e.key == 'uid') {
                    this.uid = e.newValue;
                  } else if (e.key == 'isAdmin') {
                    this.isAdmin = e.newValue;
                  }

                case 23:
                case 'end':
                  return _context.stop();
              }
            }
          }, _callee, this, [[12, 17]]);
        }));

        return function (_x) {
          return ref.apply(this, arguments);
        };
      }().bind(this));

      this.userLq = new _liveQuery2.default(function () {
        return _this.uid && ['users', _this.uid];
      }, { name: 'Auth.user', start: true });

      (0, _mobx.autorun)(function () {
        if (_this.user) {
          _this.isAdmin = _this.user.isAdmin;
        }
      });

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
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee2() {
        var _this2 = this;

        var session;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                session = void 0;
                _context2.prev = 1;
                _context2.next = 4;
                return _util2.default.apiCall('newSession', {
                  method: 'post',
                  headers: {
                    'Content-Type': "application/json"
                  }
                }, null);

              case 4:
                session = _context2.sent;
                _context2.next = 11;
                break;

              case 7:
                _context2.prev = 7;
                _context2.t0 = _context2['catch'](1);

                console.error('Error starting new session', _context2.t0);
                throw _context2.t0;

              case 11:

                (0, _mobx.transaction)(function () {
                  _this2.sessionId = session.id;
                  _this2.uid = session.uid;
                });

              case 12:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this, [[1, 7]]);
      }));

      function startNewSession() {
        return ref.apply(this, arguments);
      }

      return startNewSession;
    }()
  }, {
    key: 'ensureSession',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee4() {
        var _this3 = this;

        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                if (!this.sessionId) {
                  _context4.next = 4;
                  break;
                }

                return _context4.delegateYield(regeneratorRuntime.mark(function _callee3() {
                  var session;
                  return regeneratorRuntime.wrap(function _callee3$(_context3) {
                    while (1) {
                      switch (_context3.prev = _context3.next) {
                        case 0:
                          _context3.next = 2;
                          return _util2.default.apiGet('session');

                        case 2:
                          session = _context3.sent;

                          if (!session) {
                            _context3.next = 7;
                            break;
                          }

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
                          }
                          _context3.next = 9;
                          break;

                        case 7:
                          _context3.next = 9;
                          return _this3.startNewSession();

                        case 9:
                        case 'end':
                          return _context3.stop();
                      }
                    }
                  }, _callee3, _this3);
                })(), 't0', 2);

              case 2:
                _context4.next = 6;
                break;

              case 4:
                _context4.next = 6;
                return this.startNewSession();

              case 6:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function ensureSession() {
        return ref.apply(this, arguments);
      }

      return ensureSession;
    }()
  }, {
    key: 'loginWithFacebook',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee5() {
        var _this4 = this;

        var FB, response, fbToken, apiResponse;
        return regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                this._loggingIn = true;
                (0, _mobx.transaction)(function () {
                  _this4.uid = undefined;
                  _this4.isAdmin = undefined;
                });

                FB = void 0;

                if (!window.FB) {
                  _context5.next = 7;
                  break;
                }

                // Bypass the elegant way because some browsers don't get that it's
                // is "synchronous" for the purpose of allowing a popup
                FB = window.FB;
                _context5.next = 10;
                break;

              case 7:
                _context5.next = 9;
                return (0, _facebook2.default)();

              case 9:
                FB = _context5.sent;

              case 10:
                _context5.next = 12;
                return new Promise(function (resolve) {
                  return window.FB.login(resolve);
                });

              case 12:
                response = _context5.sent;

                if (response.authResponse) {
                  _context5.next = 17;
                  break;
                }

                // User cancelled login
                this.uid = null;
                this._loggingIn = false;
                return _context5.abrupt('return');

              case 17:
                fbToken = response.authResponse.accessToken;
                apiResponse = void 0;
                _context5.prev = 19;
                _context5.next = 22;
                return _util2.default.apiPost('loginWithFacebook', {
                  fbToken: fbToken
                });

              case 22:
                apiResponse = _context5.sent;
                _context5.next = 31;
                break;

              case 25:
                _context5.prev = 25;
                _context5.t0 = _context5['catch'](19);

                this._loggingIn = false;
                (0, _mobx.transaction)(function () {
                  _this4.uid = null;
                  _this4.isAdmin = null;
                });
                _context5.t0.fbToken = fbToken;
                throw _context5.t0;

              case 31:

                this._setFirebaseToken(apiResponse.firebaseToken);
                _context5.next = 34;
                return _index.firebase.auth().signInWithCustomToken(apiResponse.firebaseToken);

              case 34:

                this._loggingIn = false;
                this._loggedInWithFacebook = true;
                (0, _mobx.transaction)(function () {
                  _this4.uid = _index.firebase.auth().currentUser.uid;
                  _this4.isAdmin = apiResponse.isAdmin;
                });

              case 37:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this, [[19, 25]]);
      }));

      function loginWithFacebook() {
        return ref.apply(this, arguments);
      }

      return loginWithFacebook;
    }()
  }, {
    key: 'registerWithFacebook',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee6(params) {
        var _this5 = this;

        var apiResponse;
        return regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                this._loggingIn = true;
                (0, _mobx.transaction)(function () {
                  _this5.uid = undefined;
                  _this5.isAdmin = undefined;
                });

                apiResponse = void 0;
                _context6.prev = 3;
                _context6.next = 6;
                return _util2.default.apiPost('registerWithFacebook', params);

              case 6:
                apiResponse = _context6.sent;
                _context6.next = 14;
                break;

              case 9:
                _context6.prev = 9;
                _context6.t0 = _context6['catch'](3);

                this._loggingIn = false;
                (0, _mobx.transaction)(function () {
                  _this5.uid = null;
                  _this5.isAdmin = null;
                });
                throw _context6.t0;

              case 14:

                this._setFirebaseToken(apiResponse.firebaseToken);
                _context6.next = 17;
                return _index.firebase.auth().signInWithCustomToken(apiResponse.firebaseToken);

              case 17:

                this._loggingIn = false;
                this._loggedInWithFacebook = true;
                (0, _mobx.transaction)(function () {
                  _this5.uid = _index.firebase.auth().currentUser.uid;
                  _this5.isAdmin = apiResponse.isAdmin;
                });

              case 20:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, this, [[3, 9]]);
      }));

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
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee7(linkedInCode, nextUrl) {
        var _this6 = this;

        var apiResponse;
        return regeneratorRuntime.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                this._loggingIn = true;
                (0, _mobx.transaction)(function () {
                  _this6.uid = undefined;
                  _this6.isAdmin = undefined;
                });

                apiResponse = void 0;
                _context7.prev = 3;
                _context7.next = 6;
                return _util2.default.apiPost('loginOrRegisterWithLinkedIn', {
                  linkedInCode: linkedInCode,
                  redirectUri: _config2.default.linkedInRedirectUri + '?' + _util2.default.objToParamString({
                    next: nextUrl
                  })
                });

              case 6:
                apiResponse = _context7.sent;
                _context7.next = 15;
                break;

              case 9:
                _context7.prev = 9;
                _context7.t0 = _context7['catch'](3);

                console.error('Login failed', _context7.t0);
                this._loggingIn = false;
                (0, _mobx.transaction)(function () {
                  _this6.uid = null;
                  _this6.isAdmin = null;
                });
                return _context7.abrupt('return');

              case 15:

                this._setFirebaseToken(apiResponse.firebaseToken);
                _context7.next = 18;
                return _index.firebase.auth().signInWithCustomToken(apiResponse.firebaseToken);

              case 18:

                this._loggingIn = false;
                (0, _mobx.transaction)(function () {
                  _this6.uid = _index.firebase.auth().currentUser.uid;
                  _this6.isAdmin = apiResponse.isAdmin;
                });

              case 20:
              case 'end':
                return _context7.stop();
            }
          }
        }, _callee7, this, [[3, 9]]);
      }));

      function loginOrRegisterWithLinkedIn(_x4, _x5) {
        return ref.apply(this, arguments);
      }

      return loginOrRegisterWithLinkedIn;
    }()
  }, {
    key: 'loginOrRegister',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee8(params) {
        var _this7 = this;

        var apiResponse;
        return regeneratorRuntime.wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                this._loggingIn = true;
                (0, _mobx.transaction)(function () {
                  _this7.uid = undefined;
                  _this7.isAdmin = undefined;
                });

                apiResponse = void 0;
                _context8.prev = 3;
                _context8.next = 6;
                return _util2.default.apiPost('loginOrRegister', params);

              case 6:
                apiResponse = _context8.sent;
                _context8.next = 14;
                break;

              case 9:
                _context8.prev = 9;
                _context8.t0 = _context8['catch'](3);

                this._loggingIn = false;
                (0, _mobx.transaction)(function () {
                  _this7.uid = null;
                  _this7.isAdmin = null;
                });
                throw _context8.t0;

              case 14:

                this._setFirebaseToken(apiResponse.firebaseToken);
                _context8.next = 17;
                return _index.firebase.auth().signInWithCustomToken(apiResponse.firebaseToken);

              case 17:

                this._loggingIn = false;
                (0, _mobx.transaction)(function () {
                  _this7.uid = _index.firebase.auth().currentUser.uid;
                  _this7.isAdmin = apiResponse.isAdmin;
                });

              case 19:
              case 'end':
                return _context8.stop();
            }
          }
        }, _callee8, this, [[3, 9]]);
      }));

      function loginOrRegister(_x6) {
        return ref.apply(this, arguments);
      }

      return loginOrRegister;
    }()
  }, {
    key: 'loginAs',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee9(linkedInId) {
        var _this8 = this;

        var apiResponse;
        return regeneratorRuntime.wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                (0, _mobx.transaction)(function () {
                  _this8.uid = undefined;
                  _this8.isAdmin = undefined;
                });

                apiResponse = void 0;
                _context9.prev = 2;
                _context9.next = 5;
                return _util2.default.apiPost('loginAs', {
                  linkedInId: linkedInId
                });

              case 5:
                apiResponse = _context9.sent;
                _context9.next = 12;
                break;

              case 8:
                _context9.prev = 8;
                _context9.t0 = _context9['catch'](2);

                console.log('loginAs failed');
                return _context9.abrupt('return');

              case 12:

                this._setFirebaseToken(apiResponse.firebaseToken);
                _context9.next = 15;
                return _index.firebase.auth().signInWithCustomToken(apiResponse.firebaseToken);

              case 15:
                (0, _mobx.transaction)(function () {
                  _this8.uid = apiResponse.uid, _this8.isAdmin = apiResponse.isAdmin;
                });

              case 16:
              case 'end':
                return _context9.stop();
            }
          }
        }, _callee9, this, [[2, 8]]);
      }));

      function loginAs(_x7) {
        return ref.apply(this, arguments);
      }

      return loginAs;
    }()
  }, {
    key: 'logout',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee10() {
        var _this9 = this;

        var oldSessionId, apiResponse;
        return regeneratorRuntime.wrap(function _callee10$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
                oldSessionId = this.sessionId;

                (0, _mobx.transaction)(function () {
                  _this9.uid = null;
                  _this9.isAdmin = null;
                  _this9.sessionId = undefined;
                });
                this._setFirebaseToken(null);
                _context10.next = 5;
                return Promise.all([_index.firebase.auth().signOut(), this._loggedInWithFacebook && (0, _facebook2.default)().then(function (FB) {
                  return new Promise(function (resolve) {
                    return FB.logout(resolve);
                  });
                })]);

              case 5:
                apiResponse = void 0;
                _context10.prev = 6;
                _context10.next = 9;
                return _util2.default.apiCall('logout', {
                  method: 'post',
                  headers: {
                    'Content-Type': "application/json"
                  }
                }, oldSessionId);

              case 9:
                apiResponse = _context10.sent;
                _context10.next = 16;
                break;

              case 12:
                _context10.prev = 12;
                _context10.t0 = _context10['catch'](6);

                console.error(_context10.t0);
                return _context10.abrupt('return');

              case 16:

                this._loggedInWithFacebook = false;
                this.sessionId = apiResponse.newSessionId;

              case 18:
              case 'end':
                return _context10.stop();
            }
          }
        }, _callee10, this, [[6, 12]]);
      }));

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