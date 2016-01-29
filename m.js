import queryString from 'query-string'
import immutable from 'immutable'
import Firebase from 'firebase'
const Fireproof = require('fireproof')
import mixpanel from 'mixpanel-browser'
import uuid from 'node-uuid'

import config from '../config'
import splitTests from '../splitTests'
import records from '../records'
import util from './util'

const M = {}
window.M = M

const firebase = (config.firebaseAppName?
  new Firebase(`https://${config.firebaseAppName}.firebaseio.com`) :
  null
)
const ref = firebase && new Fireproof(firebase)
if (config.mixpanelToken) {
  mixpanel.init(config.mixpanelToken)
} else {
  mixpanel.track = () => {
    // Monkey patch Mixpanel tracking to be a no-op
    // since some MFramework components use it
  }
}

// Facebook SDK
window.fbAsyncInit = function() {
  FB.init({
    appId: config.facebookAppId,
    xfbml: true,
    version: 'v2.5'
  });
  M._onFacebookInit()
};

Object.assign(M, {
  config,
  mixpanel,
  ref,
  records,
  util
})

Object.assign(M, {
  _refs: {},

  _splitTestUuid4: undefined,
  splitTests,
  getUserSplit (testId) {
    if (!(testId in splitTests)) {
      throw new Error(`Unknown split test ID: ${testId}`)
    }
    if (!M._splitTestUuid4) {
      M._splitTestUuid4 = M.context.uid.get() || M.context.sessionId.get() || (
        // Either we're not tracking sessions, or a new browser session just got
        // pointed to the page and the ensureSession round trip didn't finish
        // before a component called getUserSplit. So just use a random
        // uuid4 until the next refresh.
        uuid.v4()
      )
    }
    const splitIndex = (
      parseInt(M._splitTestUuid4.substring(0, 8), 16) %
      splitTests[testId].length
    )
    return splitTests[testId][splitIndex]
  },

  defaultAtom (defaultValue) {
    return atom().lens({
      get: value => value === undefined? defaultValue : value,
      set: (oldValue, value) => value
    })
  },

  listAtom (defaultValue) {
    const defaultList = defaultValue? List(defaultValue) : defaultValue

    return atom().lens({
      get: value => value === undefined? defaultList : value,
      set: (oldValue, value) => value? List(value) : value
    })
  },

  mapAtom (defaultValue) {
    const defaultMap = defaultValue? IMap(defaultValue) : defaultValue

    return atom().lens({
      get: value => value === undefined? defaultMap : value,
      set: (oldValue, value) => value? IMap(value) : value
    })
  },

  mergeAtom (defaultValue, deep = true) {
    defaultValue = immutable.fromJS(defaultValue)
    if (defaultValue === undefined) {
      defaultValue = IMap({})
    } else if (!(defaultValue instanceof IMap)) {
      throw new Error(`mergeAtom defaultValue must be IMap, object or undefined`)
    }
    return atom(defaultValue).lens({
      get: value => value,
      set: (oldValue, value) => {
        if (value == null) {
          return oldValue
        } else if (value) {
          if (deep) {
            return defaultValue.mergeDeep(value)
          } else {
            return defaultValue.merge(value)
          }
        }
      }
    })
  },

  requiredAtom () {
    return atom().lens({
      get: value => value,
      set (oldValue, value) {
        if (value == null) {
          throw new Error("requiredAtom got value " + value)
        }
        return value
      }
    })
  },

  frozenAtom (defaultValue) {
    // Returns an atom that can be set once and then gets frozen
    let hasBeenSet = false
    let firstValue
    const a = defaultValue === undefined? atom() : M.defaultAtom(defaultValue)
    const frozenA = a.lens({
      get: value => value,
      set: (oldValue, value) => {
        if (hasBeenSet) {
          if (immutable.is(firstValue, value)) {
            return value
          } else {
            throw new Error(`Can't double-set frozenAtom` +
              `${frozenA.name? ' ' + JSON.stringify(frozenA.name) : ''}` +
              ` from ${JSON.stringify(firstValue)} to ${JSON.stringify(value)}.` +
              ` If you're passing in a component pro, try passing a 'key'` +
              ` attribute in order to re-create a component instance rather` +
              ` than modifying pro values on the existing instance.`
            )
          }
        } else {
          hasBeenSet = true
          firstValue = value
          return value
        }
      }
    })
    return frozenA
  },

  context: {
    sessionId: atom(localStorage.getItem('sessionId') || undefined),
    isAdmin: derivation(() => {
      if (M.context.uid.get() === undefined || M.context.user.get() === undefined) {
        return undefined
      } else {
        return !!(M.context.user.get() && M.context.user.get().isAdmin)
      }
    }),
    queryParams: atom(IMap(queryString.parse(window.location.search))),
    uid: atom(localStorage.getItem('uid') || undefined),
    user: atom(),
    route: atom(document.location.pathname)
  },

  _facebookInitCallbacks: [],
  _onFacebookInit: () => {
    M._facebookInitCallbacks.forEach(callback => {
      callback(FB)
    })
  },
  getFB: () => {
    if (window.FB) {
      return Promise.resolve(FB)
    } else {
      let resolveFunc
      const promise = new Promise((resolve, reject) => {
        resolveFunc = resolve
      })
      M._facebookInitCallbacks.push(resolveFunc)
      return promise
    }
  },

  apiCall: (endpoint, options) => {
    options = Object.assign({}, options)

    options.params = Object.assign({}, options.params)
    if (M.context.sessionId.get()) {
      options.params.sessionId = M.context.sessionId.get()
    }

    let url = M.config.apiBaseUrl + endpoint
    if (options.params) {
      if (options.method == 'post') {
        options.body = JSON.stringify(options.params)
      } else {
        url += '?' + M.util.objToParamString(options.params)
      }
      delete options.params
    }

    return fetch(url, options).then(apiResponse => {
      if (apiResponse.ok) {
        return apiResponse.json()
      } else {
        throw new Error(`${apiResponse.status}: ${apiResponse.statusText}`)
      }
    }).then(apiResponseJson => {
      if (apiResponseJson && apiResponseJson.err) {
        throw new Error(apiResponseJson.err)
      } else {
        return apiResponseJson
      }
    })
  },

  apiGet: (endpoint, options) => {
    return M.apiCall(endpoint, options)
  },

  apiPost: (endpoint, options) => {
    options = Object.assign({
      method: 'post',
      headers: {
        'Content-Type': "application/json"
      }
    }, options)
    return M.apiCall(endpoint, options)
  },

  ensureSession: () => {
    if (M.context.sessionId.get()) {
      M.apiGet('session').then(session => {
        if (session) {
          if (session.uid) {
            if (M.ref.getAuth()) {
              M.context.uid.set(session.uid)
            } else {
              // Apparently we're logged into the API but not into
              // Firebase. Just log out to restore a consistent state.
              M.logout()
            }

          } else {
            M.context.uid.set(null)
          }

        } else {
          // The client's cached session isn't valid on the server anymore
          M.startNewSession()
        }
      })

    } else {
      M.startNewSession()
    }
  },

  login: (options = {}) => {
    const fbPermissions = (
      options.fbPermissions ||
      M.config.facebookLoginPermissions ||
      ['public_profile']
    )

    transact(() => {
      M.context.uid.set(undefined)
      M.context.user.set(undefined)
    })

    return new Promise((resolve, reject) => {
      if (!window.FB) {
        M.context.uid.set(null)
        console.warn("Tried to log in before FB library loaded.")
        resolve()
        return
      }

      FB.login(response => {
        if (!response.authResponse) {
          // User cancelled login.
          // Don't throw an error but hope the caller
          // checks M.context.uid to see that login was cancelled
          M.context.uid.set(null)
          resolve()
          return
        }

        M.apiPost('login', {
          params: {
            fbAccessToken: response.authResponse.accessToken
          }
        }).then(apiResponse => {
          if (apiResponse.isNew) {
            M.mixpanel.alias(apiResponse.uid)
          } else {
            M.mixpanel.identify(apiResponse.uid)
          }
          M.mixpanel.track("Login")

          M._setFirebaseToken(apiResponse.firebaseToken)
          return ref.authWithCustomToken(apiResponse.firebaseToken)

        }).then(authData => {
          M.context.uid.set(authData.uid)
          resolve()

        }).catch(err => {
          M.context.uid.set(null)
          reject(err)
        })

      }, {
        scope: fbPermissions.join(',')
      })
    })
  },

  loginAs: (uid) => {
    const wasUid = M.context.uid.get()
    M.mixpanel.track("LoginAs", {uid})

    return M.apiPost('loginAs', {
      params: {
        uid
      }
    }).then(apiResponse => {
      M.mixpanel.identify(uid)
      M.mixpanel.track("Login", {wasUid})

      M._setFirebaseToken(apiResponse.firebaseToken)
      return ref.authWithCustomToken(apiResponse.firebaseToken)

    }).then(authData => {
      M.context.uid.set(authData.uid)

    }).catch(err => {
      alert(`Problem: ${err}`)
    })
  },

  logout: () => {
    M.mixpanel.track("Logout")
    M.mixpanel.cookie.clear()

    const logoutPromise = M.apiPost('logout').then(apiResponse => {
      M.context.sessionId.set(apiResponse.newSessionId)
    }, err => {
      console.error("Error during logout", err)
    })
    transact(() => {
      M.context.uid.set(null)
      M.context.sessionId.set(undefined)
      M.context.user.set(null)
    })
    M._setFirebaseToken(null)
    ref.unauth()
    return logoutPromise
  },

  startNewSession: () => {
    M.apiPost('newSession').then(session => {
      transact(() => {
        M.context.sessionId.set(session.id)
        M.context.uid.set(session.uid)
      })
    })
  },

  _setFirebaseToken: (firebaseToken) => {
    if (firebaseToken) {
      M.localStorageSet('firebaseToken', firebaseToken)
    } else {
      M.localStorageRemove('firebaseToken')
    }
  },

  routeIsActive: (path) => {
    if (path.match(/^https?:\/\//)) return false
    if (path[0] != '/') {
      path = '/' + path
    }
    return M.context.route.get() == path
  }
})

M._LOCALSTORAGE_WORKS = false
try {
  localStorage.setItem('mframework_test_key', 'test_value')
  localStorage.removeItem('mframework_test_key')
  M._LOCALSTORAGE_WORKS = true
} catch (ex) {
  console.info("LocalStorage doesn't work.")
}

M._fakeLocalStorage = M._LOCALSTORAGE_WORKS? null : {}
M.localStorageGet = (key) => {
  return M._LOCALSTORAGE_WORKS? localStorage.getItem(key) : M._fakeLocalStorage[key]
}
M.localStorageSet = (key, value) => {
  if (M._LOCALSTORAGE_WORKS) {
    localStorage.setItem(key, value)
  } else {
    M._fakeLocalStorage[key] = value
  }
}
M.localStorageRemove = (key) => {
  if (M._LOCALSTORAGE_WORKS) {
    localStorage.removeItem(key)
  } else {
    delete M._fakeLocalStorage[key]
  }
}

M.context.sessionId.reactor(sessionId => {
  if (sessionId) {
    M.localStorageSet('sessionId', sessionId)
  } else {
    M.localStorageRemove('sessionId')
  }
}).start()

M.context.uid.reactor(uid => {
  if (uid) {
    M.localStorageSet('uid', uid)
  } else {
    M.localStorageRemove('uid')
  }
}).start()

ref && ref.onAuth(authData => {
  if (!authData && M.context.uid.get()) {
    console.info("Firebase-triggered logout")
    // In case the Firebase session randomly expires,
    // log out to avoid inconsistency between the API's
    // session and Firebase's session.
    M.logout()
  }
})

window.addEventListener('storage', e => {
  // Handle localStorage change triggered from another tab/window
  if (e.key == "sessionId") {
    M.context.sessionId.set(e.newValue || undefined)
  } else if (e.key == "firebaseToken") {
    if (e.newValue) {
      const authData = M.ref.getAuth()
      if (!(authData && authData.token == e.newValue)) {
        M.ref.authWithCustomToken(e.newValue)
      }
    }
  } else if (e.key == "uid") {
    M.context.uid.set(e.newValue)
  }
})

Flint.router.onChange(() => {
  M.context.route.set(window.location.pathname)
  M.context.queryParams.set(IMap(queryString.parse(window.location.search)))
})
