import {extendObservable, isObservableArray, observable, when} from 'mobx'
import createHistory from 'history/createBrowserHistory'
import moment from 'moment-timezone'
import queryString from 'query-string'

import config from './config'
import auth from './auth'

const util = {
  _nowObj: observable({}), // interval: +new Date()
  now(msInterval) {
    if (!(msInterval in this._nowObj)) {
      extendObservable(this._nowObj, {[msInterval]: moment()})
      setInterval(() => (this._nowObj[msInterval] = moment()), msInterval)
    }
    return this._nowObj[msInterval]
  },

  async apiCall(endpoint, options, sessionId) {
    options = Object.assign({}, options)
    options.params = Object.assign({}, options.params)

    if (sessionId === undefined) {
      await new Promise(resolve => when(() => auth.sessionId, resolve))
      sessionId = auth.sessionId
    }
    options.params.sessionId = sessionId

    let url = config.apiBaseUrl + endpoint
    if (options.params) {
      if (options.method == 'post') {
        options.body = JSON.stringify(options.params)
      } else {
        url += '?' + util.objToParamString(options.params)
      }
      delete options.params
    }

    const apiResponse = await fetch(url, options)
    if (!apiResponse.ok) {
      throw new Error(`${apiResponse.status}: ${apiResponse.statusText}`)
    }

    const apiResponseJson = await apiResponse.json()
    if (apiResponseJson && apiResponseJson.err) {
      const err = new Error(apiResponseJson.err)
      err.id = apiResponseJson.errId || null
      throw err
    }

    return apiResponseJson
  },

  apiGet(endpoint, params = {}) {
    return util.apiCall(endpoint, {
      headers: {
        'Content-Type': 'application/json',
      },
      params,
    })
  },

  apiPost(endpoint, params = {}) {
    return util.apiCall(endpoint, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
      },
      params,
    })
  },

  formatMessengerDate: date => {
    date = moment(date)
    const now = moment()

    if (now.diff(date, 'hours') <= 11) {
      return date.format('h:mma')
    } else if (now.diff(date, 'days') <= 5) {
      return date.format('ddd')
    } else {
      return date.format('MMM D')
    }
  },

  makeComparator: (keyFunc, reverse) => {
    return (a, b) => {
      if (reverse) {
        const temp = a
        a = b
        b = temp
      }
      const aKey = keyFunc(a)
      const bKey = keyFunc(b)
      if (aKey instanceof Array && bKey instanceof Array) {
        for (let i = 0; i < aKey.length; i++) {
          if (aKey[i] < bKey[i]) {
            return -1
          } else if (bKey[i] < aKey[i]) {
            return 1
          }
        }
        return 0
      } else {
        if (aKey < bKey) {
          return -1
        } else if (bKey < aKey) {
          return 1
        } else {
          return 0
        }
      }
    }
  },

  objToParamString: (obj, options = {spaceToPlus: false}) => {
    let str = ''
    for (let key in obj) {
      if (obj[key] == null) continue

      let valueStr = encodeURIComponent(obj[key])
      if (options.spaceToPlus) {
        valueStr = valueStr.replace(/%20/g, '+')
      }

      if (str != '') {
        str += '&'
      }
      str += key + '=' + valueStr
    }
    return str
  },

  regexEscape(pattern) {
    return pattern.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
  },

  routeIsActive(path) {
    if (path[0] != '/') {
      path = '/' + path
    }
    return util.browserLocation.pathname == path
  },

  browserLocation: observable({}),
}

const history = createHistory()
extendObservable(util.browserLocation, history.location)
extendObservable(util.browserLocation, {
  query: queryString.parse(history.location.search),
})
history.listen(location => {
  extendObservable(util.browserLocation, location)
  extendObservable(util.browserLocation, {
    query: queryString.parse(history.location.search),
  })
})
util.history = history

util.propTypes = {
  array: (props, propName, componentName) => {
    if (
      !(
        props[propName] == null ||
        Array.isArray(props[propName]) ||
        isObservableArray(props[propName])
      )
    ) {
      return new Error(
        `${componentName}.props.${propName} must be` +
          ` an Array or ObservableArray`,
      )
    }
  },
}

export default util
