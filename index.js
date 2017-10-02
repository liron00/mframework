import firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/database'

import { Component } from 'react'
import {autorun, computed, observable, when} from 'mobx'

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

window.autorun = autorun
window.computed = computed
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
  util,

  // Export React's Component just so we can make a flow declaration
  // that mframework's component has special things like this.data
  Component,
}
