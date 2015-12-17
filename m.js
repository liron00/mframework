import queryString from 'query-string'
import immutable from 'immutable'
import Firebase from 'firebase'
const Fireproof = require('fireproof')
Fireproof.bless(Promise)

import config from '../config'
import records from '../records'
import util from './util'

const M = {}
window.M = M

const firebase = new Firebase(`https://${config.firebaseAppName}.firebaseio.com`)
const ref = new Fireproof(firebase)

Object.assign(M, {
  config,
  ref,
  records,
  util
})

Object.assign(M, {
  _refs: {},

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
    // defaultValue can be an IMap, an object, or missing/undefined
    return atom(immutable.fromJS(defaultValue)).lens({
      get: value => value,
      set: (oldValue, value) => {
        if (value === undefined) {
          return oldValue
        } else if (value) {
          if (deep) {
            return oldValue.mergeDeep(value)
          } else {
            return oldValue.merge(value)
          }
        } else {
          throw new Error("Invalid value for mergeAtom")
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
              ` If you're passing in a component prop, try passing a 'key'` +
              ` attribute in order to re-create a component instance rather` +
              ` than modifying prop values on the existing instance.`
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

  login: () => {
    transact(() => {
      M.context.uid.set(undefined)
      M.context.user.set(undefined)
    })

    return new Promise((resolve, reject) => {
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
          M._setFirebaseToken(apiResponse.firebaseToken)
          return ref.authWithCustomToken(apiResponse.firebaseToken)

        }).then(authData => {
          M.context.uid.set(authData.uid)
          resolve()

        }).catch(err => {
          console.error('Problem during login', err)
          M.context.uid.set(null)
          reject(err)
        })

      }, {
        scope: 'public_profile,email'
      })
    })
  },

  loginAs: (uid) => {
    return M.apiPost('loginAs', {
      params: {
        uid
      }
    }).then(apiResponse => {
      M._setFirebaseToken(apiResponse.firebaseToken)
      return ref.authWithCustomToken(apiResponse.firebaseToken)

    }).then(authData => {
      M.context.uid.set(authData.uid)

    }).catch(err => {
      alert(`Problem: ${err}`)
    })
  },

  logout: () => {
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
      localStorage.setItem('firebaseToken', firebaseToken)
    } else {
      localStorage.removeItem('firebaseToken')
    }
  },

  routeIsActive: (path) => {
    if (path[0] != '/') {
      path = '/' + path
    }
    if (M.context.route.get() == path) {
      return true
    } else if (path.indexOf(':') >= 0) {
      return true
    } else {
      return false
    }
  }
})

M.context.sessionId.reactor(sessionId => {
  if (sessionId) {
    localStorage.setItem('sessionId', sessionId)
  } else {
    localStorage.removeItem('sessionId')
  }
}).start()

M.context.uid.reactor(uid => {
  if (uid) {
    localStorage.setItem('uid', uid)
  } else {
    localStorage.removeItem('uid')
  }
}).start()

ref.onAuth(authData => {
  if (!authData && M.context.uid.get()) {
    console.info("Firebase-triggered logout")
    // In case the Firebase session randomly expires,
    // log out to avoid inconsistency between the API's
    // session and Firebase's session.
    M.logout()
  }
})

window.addEventListener('storage', e => {
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
