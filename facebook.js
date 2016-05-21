import config from './config'

const fbLoadCallbacks = []

window.fbAsyncInit = () => {
  FB.init({
    appId: config.facebookAppId,
    xfbml: true,
    version: 'v2.6'
  })
  for (let callback of fbLoadCallbacks) {
    callback()
  }
}

export default () => {
  return new Promise(resolve => {
    if (window.FB) {
      resolve(FB)
    } else {
      fbLoadCallbacks.push(() => resolve(FB))
    }
  })
}
