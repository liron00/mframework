let localStorageWorks
try {
  localStorage.setItem('__test_key', 'test_value')
  localStorage.removeItem('__test_key')
  localStorageWorks = true
} catch (err) {
  console.info(`LocalStorage doesn't work`)
}

const fakeLocalStorage = localStorageWorks? null : {}

const storage = {
  get(key) {
    return localStorageWorks? localStorage.getItem(key) : fakeLocalStorage[key]
  },

  set(key, value) {
    if (localStorageWorks) {
      localStorage.setItem(key, value)
    } else {
      fakeLocalStorage[key] = value
    }
  },

  remove(key) {
    if (localStorageWorks) {
      localStorage.removeItem(key)
    } else {
      delete fakeLocalStorage[key]
    }
  }
}

export default storage
