import { extendObservable } from 'mobx'
import { asStructure, autorun, computed, observable, transaction,
  untracked } from 'mobx'
import { observer } from 'mobx-react'

import { firebase } from './index'

export default class LiveQuery {
  name
  dataConfig
  @observable _value
  @observable isActive
  _disposer
  _reallyStarted
  _oldQuery

  static compileValueFunc = valueFunc => {
    if (valueFunc === true) {
      return (snap) => snap.val()
    } else if (valueFunc == 'WITH_ID') {
      return (snap) => {
        const ret = snap.val()
        if (ret) ret.id = snap.key
        return ret
      }
    } else if (valueFunc == 'ID_ARR') {
      return (snap) => {
        const ret = []
        if (snap.val()) {
          snap.forEach(childRef => ret.push(childRef.key))
        }
        return ret
      }
    } else if (valueFunc == 'ARR') {
      return (snap) => {
        const ret = []
        if (snap.val()) {
          snap.forEach(childRef => ret.push(childRef.val()))
        }
        return ret
      }
    } else if (valueFunc == 'ARR_WITH_IDS') {
      return (snap) => {
        const ret = []
        if (snap.val()) {
          snap.forEach(childRef => {
            const childObj = childRef.val()
            childObj.id = childRef.key
            ret.push(childObj)
          })
        }
        return ret
      }
    }
  }

  constructor(dataSpec, {start = true, name = null} = {}) {
    if (typeof dataSpec == 'function') {
      // Shorthand syntax
      this.dataConfig = {
        ref: dataSpec,
        value: true
      }
    } else {
      this.dataConfig = dataSpec
    }
    if (this.dataConfig.value && typeof this.dataConfig.value != 'function') {
      this.dataConfig.value =
        this.constructor.compileValueFunc(this.dataConfig.value)
    }

    this._oldQuery = null
    this._queryHandlers = {} // eventType: handler

    this.name = name
    if (start) this.start()
  }

  @computed({asStructure: true}) get value() {
    if (!this.isActive) {
      throw new Error(`${this} can't get value when inactive`)
    }

    // Leaving this block here for now because I suspect this may be something
    // to address
    untracked(() => {
      if (this._reallyStarted && this._oldQuery !== this.query) {
        if (this._value !== undefined) {
          console.log(this.toString(), 'STALE VALUE', this._value, this.query, this._oldQuery)
          console.trace()
        }
      }
    })

    return this._value
  }

  @computed({asStructure: true}) get pathSpec() {
    const pathParts = this.dataConfig.ref()
    if (pathParts === null) {
      return null
    } else if (pathParts === undefined || pathParts.indexOf(undefined) >= 0) {
      return undefined
    } else if (pathParts.findIndex(part => !part) >= 0) {
      throw new Error(`Invalid path part in ${JSON.stringify(pathParts)}`)
    } else {
      return pathParts
    }
  }

  @computed get query() {
    if (this.pathSpec === undefined) return undefined
    if (this.pathSpec === null) return null

    // Return Firebase.Query
    const rawRef = firebase.database().ref().child(this.pathSpec.join('/'))
    const refOptionsFunc = this.dataConfig.refOptions || (ref => ref)
    return refOptionsFunc(rawRef)
  }

  start() {
    if (this.isActive) {
      throw new Error(`${this} already started`)
    }

    this._disposer = autorun(() => {
      this._reallyStarted = true

      if (this._oldQuery) {
        for (let eventType of Object.keys(this._queryHandlers)) {
          const handler = this._queryHandlers[eventType]
          this._oldQuery.off(eventType, handler)
          delete this._queryHandlers[eventType]
        }
      }

      this._oldQuery = this.query

      if (this.query === null) {
        this._value = null
        return
      }
      this._value = undefined
      if (this.query === undefined) return

      for (let eventType in this.dataConfig) {
        if ([
          'value', 'child_added', 'child_changed', 'child_moved', 'child_removed'
        ].indexOf(eventType) == -1) continue

        const callback = this.dataConfig[eventType]
        if (typeof callback != 'function') {
          throw new Error(`Invalid callback for ${eventType}: ${callback}`)
        }

        this._queryHandlers[eventType] = this.query.on(
          eventType,
          (snap, prevChildKey) => {
            const retVal = callback(snap, prevChildKey)
            if (eventType == 'value') {
              this._value = retVal
            }
          }
        )
      }

      if (Object.keys(this._queryHandlers).length == 0) {
        console.warn(`No event handlers for LiveQuery`, this.name)
      }
    })

    this.isActive = true
  }

  dispose() {
    this.stop()
  }

  stop() {
    if (this._disposer) {
      this._disposer()
      delete this._disposer
    }

    for (let eventType in this._queryHandlers) {
      this._oldQuery.off(eventType, this._queryHandlers[eventType])
    }

    this._reallyStarted = false
    this.isActive = false
  }

  toString() {
    return this.name? `<LiveQuery ${this.name}>` : `<LiveQuery>`
  }
}