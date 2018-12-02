import deepEqual from 'deep-equal'
import {action, computed, observable, reaction, untracked} from 'mobx'

import {firebase} from './index'
import LiveQuery from './liveQuery'

export default class MultiLiveQuery {
  debug
  name
  dataConfig
  @observable isActive
  _disposer
  _oldPathSpecs
  queryMap = new observable.map()
  _initialized = false

  constructor(dataSpec, {start = true, name = null, debug = false} = {}) {
    this.debug = debug

    if (typeof dataSpec == 'function') {
      // Shorthand syntax
      this.dataConfig = {
        refs: dataSpec,
        value: true,
      }
    } else {
      this.dataConfig = dataSpec
    }
    if (this.dataConfig.value && typeof this.dataConfig.value != 'function') {
      const valueFunc = LiveQuery.compileValueFunc(this.dataConfig.value)
      this.dataConfig.value = (key, snap, prevChildKey) => {
        return valueFunc(snap, prevChildKey)
      }
    }

    this.name = name
    if (start) this.start()
  }

  @computed.struct
  get value() {
    if (!untracked(() => this.isActive)) {
      throw new Error(`Can't get value because not active: ${this}`)
    }
    if (!this.pathSpecs) return this.pathSpecs

    const valueByKey = {}
    let hasUndefinedValue = false
    for (let key in this.pathSpecs) {
      if (this.queryMap.has(key)) {
        const liveQuery = this.queryMap.get(key)
        valueByKey[key] = liveQuery.value
      } else {
        valueByKey[key] = undefined
      }

      if (valueByKey[key] === undefined) {
        hasUndefinedValue = true
        if (
          this.dataConfig.waitForAll ||
          (this.dataConfig.waitForInit && !this._initialized)
        ) {
          return undefined
        }
      }
    }
    if (!hasUndefinedValue) {
      this._initialized = true
    }
    return valueByKey
  }

  @computed.struct
  get pathSpecs() {
    const pathParts = this.dataConfig.refs()
    if (pathParts === undefined) return undefined
    if (pathParts === null) return null

    if (pathParts.constructor === Object) {
      const pathSpecByKey = {}
      for (let key in pathParts) {
        pathSpecByKey[key] = pathParts[key]
      }
      return pathSpecByKey
    }

    if (!Array.isArray(pathParts)) {
      throw new Error(`${this} got non-array refs: ${pathParts}`)
    }
    if (pathParts.indexOf(undefined) >= 0) return undefined
    if (pathParts.findIndex(part => !part) >= 0) {
      throw new Error(`Invalid path part in ${JSON.stringify(pathParts)}`)
    }

    const multiIndex = pathParts.findIndex(part => part instanceof Array)
    if (multiIndex == -1) {
      throw new Error(
        `Invalid ref for MultiLiveQuery: ${JSON.stringify(pathParts)}`,
      )
    }
    const pathSpecByKey = {}
    for (let key of pathParts[multiIndex]) {
      const keyPathSpec = pathParts.slice()
      keyPathSpec.splice(multiIndex, 1, key)
      pathSpecByKey[key] = keyPathSpec
    }
    return pathSpecByKey
  }

  _makeLiveQuery(key, pathSpec) {
    const lqConfig = {
      ref: () => pathSpec,
    }
    if (this.dataConfig.refOptions) {
      lqConfig.refOptions = ref => {
        if (
          !(
            this.pathSpecs &&
            JSON.stringify(this.pathSpecs[key]) == JSON.stringify(pathSpec)
          )
        ) {
          // Computed pathSpecs changed before our reaction had time to
          // stop potentially outdated LiveQuery instances
          return undefined
        }
        return this.dataConfig.refOptions(key, ref)
      }
    }
    if (this.dataConfig.onErr) {
      lqConfig.onErr = err => this.dataConfig.onErr(key, err)
    }
    for (let eventType of [
      'value',
      'child_added',
      'child_changed',
      'child_moved',
      'child_removed',
    ]) {
      if (this.dataConfig[eventType]) {
        lqConfig[eventType] = (snap, prevChildKey) => {
          return this.dataConfig[eventType](key, snap, prevChildKey)
        }
      }
    }
    const lq = new LiveQuery(lqConfig, {
      debug: this.debug,
      name: `${this.name || '[unnamed]'}.${key}`,
      start: false,
    })
    lq._pathSpecArr = pathSpec
    return lq
  }

  @action
  start() {
    if (this.isActive) {
      throw new Error(`${this} already started`)
    }

    // When pathSpecs change, lets us dispose of the old LiveQueries
    // that are no longer needed
    let oldQueryByKey = {} // key: liveQuery

    this._disposer = reaction(
      () => this.pathSpecs,
      pathSpecs => {
        const newQueryByKey = {}
        this.queryMap.clear()

        for (let key in pathSpecs || {}) {
          const pathSpec = pathSpecs[key]
          const oldQuery = oldQueryByKey[key]
          let liveQuery
          if (
            oldQuery &&
            JSON.stringify(oldQuery._pathSpecArr) == JSON.stringify(pathSpec)
          ) {
            liveQuery = oldQuery
          } else {
            liveQuery = this._makeLiveQuery(key, pathSpec)
          }
          this.queryMap.set(key, liveQuery)
          newQueryByKey[key] = liveQuery
        }

        for (let key in oldQueryByKey) {
          if (!newQueryByKey[key]) {
            oldQueryByKey[key].dispose()
          }
        }
        oldQueryByKey = newQueryByKey
        this._oldPathSpecs = pathSpecs

        for (let key in pathSpecs || {}) {
          if (!newQueryByKey[key].isActive) {
            newQueryByKey[key].start()
          }
        }
      },
      {
        name: `${this.toString()}.pathSpecsReaction`,
        compareStructural: true,
        fireImmediately: true,
      },
    )

    this.isActive = true
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

    this.queryMap.forEach((liveQuery, key) => {
      liveQuery.dispose()
    })
    this.queryMap.clear()

    this.isActive = false
  }

  toString() {
    return this.name ? `<MultiLiveQuery ${this.name}>` : `<MultiLiveQuery>`
  }
}
