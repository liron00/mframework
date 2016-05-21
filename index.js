import firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/database'

import auth from './auth'
import config from './config'
import decorator from './decorator'
import LiveQuery from './liveQuery'
import storage from './storage'
import util from './util'

export default function initialize(cfg) {
  Object.assign(config, cfg)

  firebase.initializeApp({
    apiKey: config.firebaseApiKey,
    authDomain: `${config.firebaseAppName}.firebaseapp.com`,
    databaseURL: `https://${config.firebaseAppName}.firebaseio.com`,
    storageBucket: config.firebaseStorageBucket
  })

  auth.initialize()
}

export {
  auth,
  config,
  firebase,
  decorator as m,
  LiveQuery,
  storage,
  util
}
