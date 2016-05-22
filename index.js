import firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/database'

import {autorun, computed, map, observable, when} from 'mobx'

import auth from './auth'
import config from './config'
import decorator from './decorator'
import LiveQuery from './liveQuery'
import MultiLiveQuery from './multiLiveQuery'
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

if (!config.isLive) {
  window.autorun = autorun
  window.computed = computed
  window.map = map
  window.observable = observable
  window.when = when

  window.M = {
    auth,
    config,
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
  firebase,
  decorator as m,
  LiveQuery,
  MultiLiveQuery,
  storage,
  util
}
