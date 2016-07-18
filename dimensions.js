import { autorun, computed, observable } from 'mobx'
import { throttle } from 'throttle-debounce'

class Dimensions {
  @observable width
  @observable height

  constructor() {
    this.refresh()
    window.addEventListener('resize', this.handleResize)
  }

  refresh() {
    if (window.orientation) {
      this.width = window.innerWidth
      this.height = window.innerHeight
    } else {
      // Sometimes mobile devices lie and say they have more width than they do,
      // even with our meta viewport tag telling them not to scale
      this.width = Math.min(window.screen.availWidth, window.innerWidth)
      this.height = Math.min(window.screen.availHeight, window.innerHeight)
    }
  }

  handleResize = throttle(100, e => this.refresh())

  @computed get isMobile() {
    return this.width < 960
  }
}

export default new Dimensions()
