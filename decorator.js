import React from 'react'
import { asStructure, autorun, computed, extendObservable, observable, transaction, when } from 'mobx'
import { observer } from 'mobx-react'

import LiveQuery from './liveQuery'

let nextId = 1

export default function m(NewComponent) {
  return observer(class extends NewComponent {
    @observable smartProps = {}
    @observable data = {}
    liveQueries = {} // dataKey: liveQuery
    _intervalIds
    _timeoutIds
    _autorunDisposers
    _whenDisposers

    constructor(props) {
      super(props)

      this.id = nextId++

      Object.assign(this.smartProps, props)

      transaction(() => {
        for (let propName in NewComponent.propTypes || {}) {
          const propType = NewComponent.propTypes[propName]

          if ([
            React.PropTypes.func,
          ].indexOf(propType) == -1) {
            extendObservable(this.smartProps, {[propName]: props[propName]})
          }
        }

        this.props = this.smartProps
      })

      for (let dataKey in this.dataSpec || {}) {
        let specCopy
        if (typeof this.dataSpec[dataKey] == 'function') {
          specCopy = {
            ref: this.dataSpec[dataKey],
            value: true
          }
        } else {
          specCopy = Object.assign({}, this.dataSpec[dataKey])
        }
        if (this.active) {
          const refFunc = specCopy.ref
          specCopy.ref = () => this.active()? refFunc() : undefined
        }

        this.liveQueries[dataKey] = new LiveQuery(
          specCopy,
          {
            start: false,
            name: `${this}.data.${dataKey}`
          }
        )
        extendObservable(this.data, {
          [dataKey]: asStructure(() => this.liveQueries[dataKey].value)
        })
      }
      for (let dataKey in this.liveQueries) {
        this.liveQueries[dataKey].start()
      }

      delete this.props
    }

    componentWillReceiveProps(nextProps) {
      transaction(() => {
        for (let propName in nextProps) {
          const propType = (NewComponent.propTypes || {})[propName]

          if (propType && [
            React.PropTypes.func,
          ].indexOf(propType) == -1) {
            extendObservable(this.smartProps, {[propName]: nextProps[propName]})
          } else {
            this.smartProps[propName] = nextProps[propName]
          }
        }

        this.props = this.smartProps
      })

      if (super.componentWillReceiveProps) super.componentWillReceiveProps(nextProps)
    }

    componentWillMount() {
      this.props = this.smartProps

      if (super.componentWillMount) super.componentWillMount()
    }

    componentDidMount() {
      this.when(
        () => !this.active || this.active(),
        () => {
          if (super.componentDidMount) super.componentDidMount()
        }
      )
    }

    autorun(func) {
      const disposer = autorun(func)
      if (!this._autorunDisposers) this._autorunDisposers = []
      this._autorunDisposers.push(disposer)
    }

    when(predicate, effect) {
      const disposer = when(predicate, effect)
      if (!this._whenDisposers) this._whenDisposers = []
      this._whenDisposers.push(disposer)
    }

    clearInterval(intervalId) {
      clearInterval(intervalId)
      delete this._intervalIds[intervalId]
    }

    clearTimeout(timeoutId) {
      clearTimeout(timeoutId)
      delete this._timeoutIds[timeoutId]
    }

    setInterval(f, interval) {
      const intervalId = setInterval(f, interval)
      if (!this._intervalIds) this._intervalIds = {}
      this._intervalIds[intervalId] = true
      return intervalId
    }

    setTimeout(f, timeout) {
      const timeoutId = setTimeout(f, timeout)
      if (!this._timeoutIds) this._timeoutIds = {}
      this._timeoutIds[timeoutId] = true
      return timeoutId
    }

    render() {
      this.props = this.smartProps
      if (!this.active || this.active()) {
        return super.render()
      } else {
        return null
      }
    }

    componentWillUnmount() {
      if (super.componentWillUnmount) super.componentWillUnmount()

      for (let disposer of this._autorunDisposers || []) {
        disposer()
      }
      for (let disposer of this._whenDisposers || []) {
        disposer()
      }

      for (let dataKey in this.liveQueries) {
        this.liveQueries[dataKey].dispose()
      }

      for (let timeoutIdStr of Object.keys(this._timeoutIds || {})) {
        this.clearTimeout(parseInt(timeoutIdStr))
      }
      for (let intervalIdStr of Object.keys(this._intervalIds || {})) {
        this.clearInterval(parseInt(intervalIdStr))
      }
    }

    toString() {
      return `<${NewComponent.name} ${this.id}>`
    }
  })
}
