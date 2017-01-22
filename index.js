import fetch from 'whatwg-fetch'

import firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/database'

import {autorun, computed, map, observable, when} from 'mobx'

import auth from './auth'
import config from './config'
import decorator from './decorator'
import dimensions from './dimensions'
import LiveQuery from './liveQuery'
import MultiLiveQuery from './multiLiveQuery'
import storage from './storage'
import util from './util'

let initialized = false

export default function initialize(cfg) {
  Object.assign(config, cfg)

  if (config.firebaseAppName) {
    firebase.initializeApp({
      apiKey: config.firebaseApiKey,
      authDomain: `${config.firebaseAppName}.firebaseapp.com`,
      databaseURL: `https://${config.firebaseAppName}.firebaseio.com`,
      messagingSenderId: config.firebaseSenderId,
      storageBucket: config.firebaseStorageBucket,
    })
  }

  if (config.apiBaseUrl) {
    auth.initialize()
  }

  initialized = true
}

const isInitialized = () => initialized

if (!config.isLive) {
  window.autorun = autorun
  window.computed = computed
  window.map = map
  window.observable = observable
  window.when = when

  window.M = {
    auth,
    config,
    dimensions,
    firebase,
    decorator,
    LiveQuery,
    MultiLiveQuery,
    storage,
    util
  }
}

export {
  auth,
  config,
  dimensions,
  firebase,
  decorator as m,
  LiveQuery,
  isInitialized,
  MultiLiveQuery,
  storage,
  util
}
