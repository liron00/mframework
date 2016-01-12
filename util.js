import moment from 'moment'

export default {
  alertError: (err) => {
    // TODO: Show a modal dialogue
    // alert(err.message)
    console.error(err)
  },

  compare: (a, b) => {
    return M.util.makeComparator(x => {
      if (x instanceof String) {
        return x.toUpperCase()
      } else {
        return x
      }
    })(a, b)
  },

  formatMessengerDate: (date) => {
    date = moment(date)
    const now = moment()

    if (now.diff(date, 'days') < 1) {
      return date.format('h:mma')
    } else if (now.diff(date, 'weeks') < 1) {
      return date.format('ddd')
    } else {
      return date.format('MMM D')
    }
  },

  makeComparator: (keyFunc, reverse = false) => {
    return (a, b) => {
      if (reverse) {
        [a, b] = [b, a]
      }
      const [aKey, bKey] = [keyFunc(a), keyFunc(b)]
      if (aKey < bKey) {
        return -1
      } else if (bKey < aKey) {
        return 1
      } else {
        return 0
      }
    }
  },

  makeSlug: str => {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  },

  makeUrl: (pathParams, queryParams) => {
    let url = '/' + (pathParams || []).join('/')
    const queryParamsStr = M.util.objToParamString(queryParams)
    if (queryParamsStr) {
      url += '?' + queryParamsStr
    }
    return url
  },

  mod: (a, b) => {
    // Like a % b but behaves properly when a is negative
    return ((a % b) + b) % b
  },

  objToParamString: obj => {
    let str = ""
    for (let key in obj) {
      if (obj[key] == null) continue

      if (str != "") {
        str += "&"
      }
      str += key + "=" + encodeURIComponent(obj[key])
    }
    return str
  },

  shuffle: arr => {
    // http://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array-in-javascript
    const stackOverflowShuffleFunc = function shuffle(o){
      for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
      return o;
    }
    stackOverflowShuffleFunc(arr)
  },

  urlRegex: /((?:https?:\/\/)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b(?:[-a-zA-Z0-9@:%_\+.~#?&//=]*))/
}
