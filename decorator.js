import PropTypes from 'prop-types'
import {
  action,
  autorun,
  comparer,
  computed,
  extendObservable,
  observable,
  reaction,
  toJS,
  transaction,
  untracked,
  when,
} from 'mobx'
import {observer} from 'mobx-react'

import config from './config'
import LiveQuery from './liveQuery'
import MultiLiveQuery from './multiLiveQuery'
import util from './util'

let nextId = 1

export default function m(NewComponent) {
  @observer
  class C extends NewComponent {
    @observable data = {}
    liveQueries = {} // dataKey: liveQuery
    _intervalIds
    _timeoutIds
    _autorunDisposers
    _reactionDisposers
    _whenDisposers
    _className = NewComponent.name // debugging
    @observable pro = undefined // like props but granular reactivity

    constructor(props) {
      super(props)

      this.data = {} // Because `@observable data = {}` doesn't initialize early enough

      if (this.debug === undefined) {
        this.debug = config.debugComponents || false
      }

      this.id = nextId++

      if (this.debug) {
        console.log(`${this}.constructor`, props)
      }

      for (let dataKey in this.dataSpec || {}) {
        let specCopy
        if (typeof this.dataSpec[dataKey] == 'function') {
          specCopy = {
            ref: this.dataSpec[dataKey],
            value: true,
          }
        } else {
          specCopy = Object.assign({}, this.dataSpec[dataKey])
        }
        if (specCopy.ref) {
          const refFunc = specCopy.ref
          specCopy.ref = () => refFunc()
        } else if (specCopy.refs) {
          const refsFunc = specCopy.refs
          specCopy.refs = () => refsFunc()
        }
        let debug = specCopy.debug || false
        if (specCopy.debug) delete specCopy.debug

        const isMulti = !!specCopy.refs
        this.liveQueries[dataKey] = new (isMulti ? MultiLiveQuery : LiveQuery)(
          specCopy,
          {
            debug,

            name: `${this}.data.${dataKey}`,

            // Can't start yet MobX-react hasn't wired up this.props
            // to be reactive when accessed in the spec functions
            start: false,
          },
        )

        const _this = this
        extendObservable(
          this.data,
          {
            get [dataKey]() {
              return _this.liveQueries[dataKey].isActive
                ? _this.liveQueries[dataKey].value
                : undefined
            },
          },
          {
            [dataKey]: computed({
              name: `${this.toString()}.data.${dataKey}`,
              equals: comparer.structural,
            }),
          },
        )
      }
    }

    componentWillReceiveProps(nextProps) {
      if (this.debug) {
        console.log(`${this}.componentWillReceiveProps`, nextProps)

        for (let propName in nextProps) {
          if (!(propName in NewComponent.propTypes)) {
            console.warn(`${this} received unexpected prop: ${propName}`)
          }
        }
      }

      if (super.componentWillReceiveProps)
        super.componentWillReceiveProps(nextProps)
    }

    componentWillMount() {
      if (this.debug) {
        console.log(`${this}.componentWillMount`, this.props)
      }

      this.pro = {}
      for (let propName in NewComponent.propTypes || {}) {
        const propType = NewComponent.propTypes[propName]
        if (propType == PropTypes.func) {
          Object.defineProperty(this.pro, propName, {
            configurable: true,
            enumerable: true,
            get: () => {
              return this.props[propName]
            },
          })
        } else {
          const _this = this
          extendObservable(
            this.pro,
            {
              get [propName]() {
                return _this.props[propName]
              },
            },
            {
              [propName]: computed({
                equals:
                  [
                    PropTypes.array,
                    PropTypes.object,
                    util.propTypes.array,
                  ].indexOf(propType) >= 0
                    ? comparer.structural
                    : comparer.identity,
              }),
            },
          )
        }
      }

      for (let dataKey in this.liveQueries) {
        this.liveQueries[dataKey].start()
      }

      if (super.componentWillMount) super.componentWillMount()
    }

    componentDidMount() {
      if (this.debug) {
        console.log(`${this}.componentDidMount`, this.props)
      }
      if (super.componentDidMount) super.componentDidMount()
    }

    autorun(func) {
      const disposer = autorun(func)
      if (!this._autorunDisposers) this._autorunDisposers = []
      this._autorunDisposers.push(disposer)
    }

    reaction(expressionFunc, sideEffectFunc, options = {}) {
      if (typeof options == 'boolean') options = {fireImmediately: options}
      options = Object.assign(
        {
          name: `${this.toString()}.reaction`,
          compareStructural: false,
        },
        options,
      )

      const disposer = reaction(expressionFunc, sideEffectFunc, options)
      if (!this._reactionDisposers) this._reactionDisposers = []
      this._reactionDisposers.push(disposer)
    }

    when(predicate, effect) {
      let done = false
      const disposer = when(predicate, () => {
        effect()

        done = true
        const i = (this._whenDisposers || []).indexOf(disposer)
        if (i >= 0) {
          this._whenDisposers.splice(i, 1)
        }
      })
      disposer.tag = this.toString() + '_whenDisposer'
      if (!done) {
        if (!this._whenDisposers) this._whenDisposers = []
        this._whenDisposers.push(disposer)
      }
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
      if (this.debug) {
        untracked(() => {
          console.log(`${this}.render`, toJS(this.props))
        })
      }
      return super.render()
    }

    componentWillUnmount() {
      if (this.debug) {
        console.log(`${this}.componentWillUnmount`)
      }
      if (super.componentWillUnmount) super.componentWillUnmount()

      for (let disposer of this._autorunDisposers || []) {
        disposer()
      }
      for (let disposer of this._reactionDisposers || []) {
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
  }

  try {
    // This is useful for debugging in desktop Chrome browser
    Object.defineProperty(C, 'name', {
      value: NewComponent.name,
      writable: false,
    })
  } catch (err) {
    // Lots of other browsers throw
    // TypeError: Attempting to change value of a readonly property
    // but it's not a big deal
  }

  return C
}
