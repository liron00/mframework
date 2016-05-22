import { extendObservable } from 'mobx'
import { asStructure, autorun, observable, computed, untracked } from 'mobx'
import { observer } from 'mobx-react'

import { firebase } from './index'

export default class LiveQuery {
  @observable _value
  @observable isActive

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

  constructor(dataSpec, options = {start: true, name: null}) {
    if (typeof dataSpec == 'function') {
      // Shorthand syntax
      this.dataConfig = {
        ref: dataSpec,
        value: true
      }
    } else {
      this.dataConfig = dataSpec
    }

    this._oldQuery = null
    this._queryHandlers = {} // eventType: handler

    this.name = options.name
    if (options.start) this.start()
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
    const rawRef = firebase.database().ref().child(this.pathSpec.join('/'))
    const refOptionsFunc = this.dataConfig.refOptions || (ref => ref)
    return refOptionsFunc(rawRef)
  }

  start() {
    this._queryDisposer = autorun(() => {
      this._reallyStarted = true

      for (let eventType of Object.keys(this._queryHandlers)) {
        const handler = this._queryHandlers[eventType]
        this._oldQuery.off(eventType, handler)
        delete this._queryHandlers[eventType]
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

        this._queryHandlers[eventType] = this.query.on(eventType, (snapshot, prevChildKey) => {
          if (typeof callback == 'function') {
            const retVal = callback(snapshot, prevChildKey)
            if (eventType == 'value') {
              this._value = retVal
            }

          } else {
            if (eventType == 'value') {
              let retVal
              if (callback === true) {
                retVal = snapshot.val()
              } else if (callback == 'WITH_ID') {
                retVal = snapshot.val()
                if (retVal) retVal.id = snapshot.key
              } else if (callback == 'ID_ARR') {
                retVal = []
                if (snapshot.val()) {
                  snapshot.forEach(childRef => {
                    retVal.push(childRef.key)
                  })
                }
              } else if (callback == 'ARR') {
                retVal = []
                if (snapshot.val()) {
                  snapshot.forEach(childRef => {
                    retVal.push(childRef.val())
                  })
                }
              } else if (callback == 'ARR_WITH_IDS') {
                retVal = []
                if (snapshot.val()) {
                  snapshot.forEach(childRef => {
                    const childObj = childRef.val()
                    childObj.id = childRef.key
                    retVal.push(childObj)
                  })
                }
              } else {
                throw new Error(`Unsupported value spec: ${callback}`)
              }
              this._value = retVal

            } else {
              throw new Error(`Invalid callback for ${eventType}: ${callback}`)
            }
          }
        })
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
    if (this._queryDisposer) {
      this._queryDisposer()
      delete this._queyDisposer
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
