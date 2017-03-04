import { autorun, computed, observable, reaction, transaction, when } from 'mobx'
import URI from 'urijs'
import { firebase } from './index'

import config from './config'
import facebook from './facebook'
import util from './util'
import LiveQuery from './liveQuery'
import storage from './storage'

class Auth {
  @observable sessionId = storage.get('sessionId')
  @observable uid = undefined
  @observable _fiUser = undefined
  _loggingIn = false
  _loggedInWithFacebook = false

  hasPerm(user, permId) {
    // Syntax: hasPerm([user = auth.user], permId)
    if (permId === undefined) {
      permId = user
      user = this.user
    }

    if (!user) return user
    return permId in (user.permissions || {})
  }

  initialize() {
    reaction(
      () => this.sessionId,
      () => {
        if (this.sessionId) {
          storage.set('sessionId', this.sessionId)
        } else {
          storage.remove('sessionId')
        }
      }
    )

    let _initializedUid = false
    reaction(
      () => this.uid,
      () => {
        if (!_initializedUid && this.uid !== undefined) {
          _initializedUid = true
        }
        if (_initializedUid) {
          if (this.uid) {
            storage.set('uid', this.uid)
          } else {
            storage.remove('uid')
          }
        }
      },
      true
    )

    firebase.auth().onAuthStateChanged(fiUser => {
      this._fiUser = fiUser
      if (!fiUser && this.uid) {
        console.info('Firebase-triggered logout')
        // In case the Firebase session randomly expires,
        // log out to avoid inconsistency between the API's
        // session and Firebase's session.
        this.logout()
      }
    })

    window.addEventListener('storage', (async function(e) {
      // Handle localStorage change triggered from another tab/window
      if (e.key == 'sessionId') {
        this.sessionId = e.newValue || undefined
      } else if (e.key == 'firebaseToken') {
        if (e.newValue) {
          let currentToken = null
          if (this._fiUser) {
            currentToken = await firebase.auth().currentUser.getToken()
          }
          if (currentToken != e.newValue) {
            try {
              await firebase.auth().signInWithCustomToken(e.newValue)
            } catch (err) {
              console.error(err)
            }
          }
        }
      } else if (e.key == 'uid') {
        this.uid = e.newValue
      }
    }).bind(this))

    this.userLq = new LiveQuery(
      () => this.uid && ['users', this.uid],
      {name: 'Auth.user', start: true}
    )

    // The setTimeout is because ensureSession depends on util methods
    // which import this module and need it to have finished initializing
    setTimeout(() => {
      if (!this._loggingIn) this.ensureSession()
    })
  }

  @computed get user() {
    return this.userLq.value
  }

  _setFirebaseToken(firebaseToken) {
    if (firebaseToken) {
      storage.set('firebaseToken', firebaseToken)
    } else {
      storage.remove('firebaseToken')
    }
  }

  async startNewSession() {
    let session
    try {
      session = await util.apiCall('newSession', {
        method: 'post',
        headers: {
          'Content-Type': "application/json"
        }
      }, null)
    } catch(err) {
      console.error(`Error starting new session`, err)
      throw err
    }

    transaction(() => {
      this.sessionId = session.id
      this.uid = session.uid
    })
  }

  async ensureSession() {
    if (this.sessionId) {
      const session = await util.apiGet('session')
      if (session) {
        if (session.uid) {
          when(
            () => this._fiUser !== undefined,
            () => {
              if (this._fiUser && this._fiUser.uid == session.uid) {
                if (this.uid !== session.uid) {
                  transaction(() => {
                    this.uid = session.uid
                  })
                }
              } else {
                // Apparently we're logged into the API but not into
                // Firebase. Just log out to restore a consistent state.
                this.logout()
              }
            }
          )
        } else {
          this.uid = null
        }
      } else {
        await this.startNewSession()
      }

    } else {
      await this.startNewSession()
    }
  }

  async loginWithFacebook() {
    this._loggingIn = true
    transaction(() => {
      this.uid = undefined
    })

    let FB
    if (window.FB) {
      // Bypass the elegant way because some browsers don't get that it's
      // is "synchronous" for the purpose of allowing a popup
      FB = window.FB
    } else {
      FB = await facebook()
    }
    const response = await new Promise(resolve => window.FB.login(resolve))
    if (!response.authResponse) {
      // User cancelled login
      this.uid = null
      this._loggingIn = false
      return
    }
    const fbToken = response.authResponse.accessToken

    let apiResponse
    try {
      apiResponse = await util.apiPost('loginWithFacebook', {
        fbToken
      })
    } catch (err) {
      this._loggingIn = false
      transaction(() => {
        this.uid = null
      })
      err.fbToken = fbToken
      throw err
    }

    this._setFirebaseToken(apiResponse.firebaseToken)
    await firebase.auth().signInWithCustomToken(apiResponse.firebaseToken)

    this._loggingIn = false
    this._loggedInWithFacebook = true
    transaction(() => {
      this.uid = firebase.auth().currentUser.uid
    })
  }

  async registerWithFacebook(params) {
    this._loggingIn = true
    transaction(() => {
      this.uid = undefined
    })

    let apiResponse
    try {
      apiResponse = await util.apiPost('registerWithFacebook', params)
    } catch (err) {
      this._loggingIn = false
      transaction(() => {
        this.uid = null
      })
      throw err
    }

    this._setFirebaseToken(apiResponse.firebaseToken)
    await firebase.auth().signInWithCustomToken(apiResponse.firebaseToken)

    this._loggingIn = false
    this._loggedInWithFacebook = true
    transaction(() => {
      this.uid = firebase.auth().currentUser.uid
    })
  }

  redirectToLinkedInOauth(nextUrl = window.location.href) {
    window.location = `https://www.linkedin.com/uas/oauth2/authorization?${
      util.objToParamString({
        response_type: 'code',
        client_id: config.linkedInClientId,
        redirect_uri: config.linkedInRedirectUri + '?' + util.objToParamString({
          next: URI(nextUrl).resource()
        }),
        state: 'TODO'
      })
    }`
  }

  async loginOrRegisterWithLinkedIn(linkedInCode, nextUrl) {
    this._loggingIn = true
    transaction(() => {
      this.uid = undefined
    })

    let apiResponse
    try {
      apiResponse = await util.apiPost('loginOrRegisterWithLinkedIn', {
        linkedInCode,
        redirectUri: config.linkedInRedirectUri + '?' + util.objToParamString({
          next: nextUrl
        })
      })
    } catch (err) {
      console.error(`Login failed`, err)
      this._loggingIn = false
      transaction(() => {
        this.uid = null
      })
      return
    }

    this._setFirebaseToken(apiResponse.firebaseToken)
    await firebase.auth().signInWithCustomToken(apiResponse.firebaseToken)

    this._loggingIn = false
    transaction(() => {
      this.uid = firebase.auth().currentUser.uid
    })

    return apiResponse
  }

  async loginOrRegister(params) {
    this._loggingIn = true
    transaction(() => {
      this.uid = undefined
    })

    let apiResponse
    try {
      apiResponse = await util.apiPost('loginOrRegister', params)
    } catch (err) {
      this._loggingIn = false
      transaction(() => {
        this.uid = null
      })
      throw err
    }

    this._setFirebaseToken(apiResponse.firebaseToken)
    await firebase.auth().signInWithCustomToken(apiResponse.firebaseToken)

    this._loggingIn = false
    transaction(() => {
      this.uid = firebase.auth().currentUser.uid
    })

    return apiResponse
  }

  async loginAs(linkedInId) {
    transaction(() => {
      this.uid = undefined
    })

    let apiResponse
    try {
      apiResponse = await util.apiPost('loginAs', {
        linkedInId
      })
    } catch (err) {
      console.log('loginAs failed')
      return
    }

    this._setFirebaseToken(apiResponse.firebaseToken)
    await firebase.auth().signInWithCustomToken(apiResponse.firebaseToken)
    transaction(() => {
      this.uid = apiResponse.uid
    })
  }

  async logout() {
    const oldSessionId = this.sessionId
    transaction(() => {
      this.uid = null
      this.sessionId = undefined
    })
    this._setFirebaseToken(null)
    await Promise.all([
      firebase.auth().signOut(),
      this._loggedInWithFacebook && facebook().then(FB => {
        return new Promise(resolve => FB.logout(resolve))
      })
    ])

    let apiResponse
    try {
      apiResponse = await util.apiCall('logout', {
        method: 'post',
        headers: {
          'Content-Type': "application/json"
        }
      }, oldSessionId)
    } catch (err) {
      console.error(err)
      return
    }

    this._loggedInWithFacebook = false
    this.sessionId = apiResponse.newSessionId
  }
}

export default new Auth()
