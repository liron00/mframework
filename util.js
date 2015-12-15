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

  urlRegex: /((?:https?:\/\/)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b(?:[-a-zA-Z0-9@:%_\+.~#?&//=]*))/
}
