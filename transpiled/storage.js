'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var localStorageWorks = void 0;
try {
  localStorage.setItem('__test_key', 'test_value');
  localStorage.removeItem('__test_key');
  localStorageWorks = true;
} catch (err) {
  console.info('LocalStorage doesn\'t work');
}

var fakeLocalStorage = localStorageWorks ? null : {};

var storage = {
  get: function get(key) {
    return localStorageWorks ? localStorage.getItem(key) : fakeLocalStorage[key];
  },
  set: function set(key, value) {
    if (localStorageWorks) {
      localStorage.setItem(key, value);
    } else {
      fakeLocalStorage[key] = value;
    }
  },
  remove: function remove(key) {
    if (localStorageWorks) {
      localStorage.removeItem(key);
    } else {
      delete fakeLocalStorage[key];
    }
  }
};

exports.default = storage;