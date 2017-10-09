import { action, computed, observable, ObservableMap,
  reaction, untracked } from 'mobx'

import { firebase } from './index'
import LiveQuery from './liveQuery'

export default class MultiLiveQuery {
  name
  dataConfig
  @observable isActive
  _disposer
  _oldPathSpecs
  queryMap = new ObservableMap()

  constructor(dataSpec, {start = true, name = null} = {}) {
    if (typeof dataSpec == 'function') {
      // Shorthand syntax
      this.dataConfig = {
        refs: dataSpec,
        value: true
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

  @computed.struct get value() {
    if (!untracked(() => this.isActive)) {
      throw new Error(`Can't get value because not active: ${this}`)
    }
    if (!this.pathSpecs) return this.pathSpecs

    const valueByKey = {}
    for (let key in this.pathSpecs) {
      if (this.queryMap.has(key)) {
        const liveQuery = this.queryMap.get(key)
        valueByKey[key] = liveQuery.value
      } else {
        valueByKey[key] = undefined
      }

      if (this.dataConfig.waitForAll && valueByKey[key] === undefined) {
        return undefined
      }
    }
    return valueByKey
  }

  @computed.struct get pathSpecs() {
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
        `Invalid ref for MultiLiveQuery: ${JSON.stringify(pathParts)}`
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
    const myId = parseInt(Math.random() * 1000)

    const lqConfig = {
      ref: () => pathSpec
    }
    if (this.dataConfig.refOptions) {
      lqConfig.refOptions = (ref) => {
        if (this.pathSpecs !== this._oldPathSpecs) {
          // Computed pathSpecs changed before our reaction had time to
          // stop potentially outdated LiveQuery instances
          return undefined
        }
        return this.dataConfig.refOptions(key, ref)
      }
    }
    if (this.dataConfig.onErr) {
      lqConfig.onErr = (err) => this.dataConfig.onErr(key, err)
    }
    for (let eventType of [
      'value', 'child_added', 'child_changed', 'child_moved', 'child_removed'
    ]) {
      if (this.dataConfig[eventType]) {
        lqConfig[eventType] = (snap, prevChildKey) => {
          return this.dataConfig[eventType](key, snap, prevChildKey)
        }
      }
    }
    return new LiveQuery(
      lqConfig,
      {
        name: `${this.name || '[unnamed]'}.${key}`,
        start: false,
      }
    )
  }

  @action start() {
    if (this.isActive) {
      throw new Error(`${this} already started`)
    }

    let oldQueryByKey = {}
    this._disposer = reaction(
      () => this.pathSpecs,
      pathSpecs => {
        const newQueryByKey = {}
        this.queryMap.clear()

        for (let key in pathSpecs || {}) {
          const liveQuery = this._makeLiveQuery(key, pathSpecs[key])
          newQueryByKey[key] = liveQuery
          this.queryMap.set(key, liveQuery)
        }

        for (let key in oldQueryByKey) {
          oldQueryByKey[key].dispose()
        }
        oldQueryByKey = newQueryByKey
        this._oldPathSpecs = pathSpecs

        for (let key in pathSpecs || {}) {
          newQueryByKey[key].start()
        }
      },
      {
        name: `${this.toString()}.pathSpecsReaction`,
        compareStructural: true,
        fireImmediately: true,
      }
    )

    this.isActive = true
  }

  @action dispose() {
    this.stop()
  }

  @action stop() {
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
    return this.name? `<MultiLiveQuery ${this.name}>` : `<MultiLiveQuery>`
  }
}
