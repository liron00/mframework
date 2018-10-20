import {action, computed, observable, reaction, untracked} from 'mobx'

import config from './config'
import {firebase} from './index'

window.liveQueries = []
window.getLiveQueries = () => {
  return window.liveQueries.map(q => {
    return {
      name: q.name,
      pathSpec: JSON.stringify(q.pathSpec),
      value: toJS(q._value),
    }
  })
}

let nextId = 1

export default class LiveQuery {
  id
  debug
  name
  dataConfig
  @observable _value
  @observable isActive
  _disposer
  _oldQuery

  static compileValueFunc = valueFunc => {
    if (valueFunc === true) {
      return snap => snap.val()
    } else if (valueFunc == 'WITH_ID') {
      return snap => {
        const ret = snap.val()
        if (ret) ret.id = snap.key
        return ret
      }
    } else if (valueFunc == 'ID_ARR') {
      return snap => {
        const ret = []
        if (snap.val()) {
          snap.forEach(childRef => {
            ret.push(childRef.key)
          })
        }
        return ret
      }
    } else if (valueFunc == 'ARR') {
      return snap => {
        const ret = []
        if (snap.val()) {
          snap.forEach(childRef => {
            ret.push(childRef.val())
          })
        }
        return ret
      }
    } else if (valueFunc == 'ARR_WITH_IDS') {
      return snap => {
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

  constructor(dataSpec, {start = true, name = null, debug = false} = {}) {
    this.debug = debug
    this.id = nextId++

    if (typeof dataSpec == 'function') {
      // Shorthand syntax
      this.dataConfig = {
        ref: dataSpec,
        value: true,
      }
    } else {
      this.dataConfig = dataSpec
    }
    if (this.dataConfig.value && typeof this.dataConfig.value != 'function') {
      this.dataConfig.value = this.constructor.compileValueFunc(
        this.dataConfig.value,
      )
    }

    this._oldQuery = null
    this._queryHandlers = {} // eventType: handler

    this.name = name
    if (start) this.start()
  }

  @computed.struct
  get value() {
    if (!untracked(() => this.isActive)) {
      // // This used to be an error, but apparently this path happens naturally
      // // during multiQueries and it's not a big deal, so just return undefined
      // return undefined
      throw new Error(`Can't get value because not active: ${this}`)
    }

    if (this.query === this._oldQuery) {
      return this._value
    } else {
      // Computed query has changed before the reaction had time to update
      // this._value
      this._value // for tracking
      return this.query === null ? null : undefined
    }
  }

  @computed.struct
  get pathSpec() {
    const pathParts = this.dataConfig.ref()
    if (pathParts === undefined) return undefined
    if (pathParts === null) return null
    if (!Array.isArray(pathParts)) {
      throw new Error(`${this} got non-array ref: ${pathParts}`)
    }
    if (pathParts.indexOf(undefined) >= 0) return undefined
    if (pathParts.findIndex(part => !part) >= 0) {
      throw new Error(
        `${this} Invalid path part in ${JSON.stringify(pathParts)}`,
      )
    }
    return pathParts
  }

  @computed
  get query() {
    if (!untracked(() => this.isActive)) {
      throw new Error(`${this}.query accessed while not active`)
      // This used to be an error, but apparently this path happens naturally
      // for multiQueries and it's not a big deal, so just return undefined
      // return undefined
    }
    if (this.pathSpec === undefined) return undefined
    if (this.pathSpec === null) return null

    // Return Firebase.Query
    const rawRef = firebase
      .database()
      .ref()
      .child(this.pathSpec.join('/'))
    const refOptionsFunc = this.dataConfig.refOptions || (ref => ref)
    return refOptionsFunc(rawRef)
  }

  @action
  start() {
    if (this.isActive) {
      throw new Error(`${this} already started`)
    }

    this.isActive = true

    if (config.debugData) {
      window.liveQueries.push(this)
    }

    this._disposer = reaction(
      () => this.query,
      query => {
        if (this._oldQuery) {
          for (let eventType of Object.keys(this._queryHandlers)) {
            const handler = this._queryHandlers[eventType]
            this._oldQuery.off(eventType, handler)
            delete this._queryHandlers[eventType]
          }
        }

        this._oldQuery = query

        if (query === null) {
          this._value = null
          return
        }
        this._value = undefined
        if (query === undefined) return

        for (let eventType in this.dataConfig) {
          if (
            [
              'value',
              'child_added',
              'child_changed',
              'child_moved',
              'child_removed',
            ].indexOf(eventType) == -1
          )
            continue

          const callback = this.dataConfig[eventType]
          if (typeof callback != 'function') {
            throw new Error(`Invalid callback for ${eventType}: ${callback}`)
          }

          this._queryHandlers[eventType] = query.on(
            eventType,
            action((snap, prevChildKey) => {
              if (this.debug) {
                console.log(`${this} on.${eventType}`, snap.val())
              }
              const retVal = callback(snap, prevChildKey)
              if (eventType == 'value') {
                this._value = retVal
              }
            }),
            err => {
              if ('onErr' in this.dataConfig) {
                this.dataConfig.onErr(err)
              } else {
                console.warn(this.toString(), err)
              }
            },
          )
        }

        if (Object.keys(this._queryHandlers).length == 0) {
          console.warn(`No event handlers for LiveQuery`, this.name)
        }
      },
      {
        name: `${this.toString()}.queryReaction`,
        compareStructural: false,
        fireImmediately: true,
      },
    )
  }

  @action
  dispose() {
    this.stop()
  }

  @action
  stop() {
    if (this._disposer) {
      this._disposer()
      delete this._disposer
    }

    for (let eventType in this._queryHandlers) {
      this._oldQuery.off(eventType, this._queryHandlers[eventType])
    }

    this.isActive = false

    if (config.debugData) {
      const i = window.liveQueries.indexOf(this)
      window.liveQueries.splice(i, 1)
    }
  }

  toString() {
    return `<LiveQuery #${this.id} ${this.name ? ` ${this.name}` : ''}>`
  }
}
