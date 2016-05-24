import { asStructure, autorun, computed, extendObservable, map, observable,
  transaction, untracked } from 'mobx'

import { firebase } from './index'
import LiveQuery from './liveQuery'

export default class MultiLiveQuery {
  name
  dataConfig
  @observable isActive
  _disposer
  queryMap = map()

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

  @computed({asStructure: true}) get value() {
    if (!untracked(() => this.isActive)) {
      throw new Error(`${this} can't get value when inactive`)
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
    }
    return valueByKey
  }

  @computed({asStructure: true}) get pathSpecs() {
    const pathParts = this.dataConfig.refs()
    if (pathParts === null) {
      return null
    } else if (pathParts === undefined || pathParts.indexOf(undefined) >= 0) {
      return undefined
    } else if (pathParts.findIndex(part => !part) >= 0) {
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
    const lqConfig = {
      ref: () => pathSpec
    }
    if (this.dataConfig.refOptions) {
      lqConfig.refOptions = (ref) => this.dataConfig.refOptions(key, ref)
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
        start: true
      }
    )
  }

  start() {
    if (this.isActive) {
      throw new Error(`${this} already started`)
    }

    let oldQueryByKey = {}
    this._disposer = autorun(() => {
      transaction(() => {
        const newQueryByKey = {}
        for (let key in oldQueryByKey) {
          // queryMap.clear has a dependency-tracking bug
          // https://github.com/mobxjs/mobx/issues/256
          this.queryMap.delete(key)
        }

        for (let key in this.pathSpecs || {}) {
          const liveQuery = this._makeLiveQuery(key, this.pathSpecs[key])
          newQueryByKey[key] = liveQuery
          this.queryMap.set(key, liveQuery)
        }

        for (let key in oldQueryByKey) oldQueryByKey[key].dispose()
        oldQueryByKey = newQueryByKey
      })
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
