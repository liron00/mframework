import moment from 'moment'

view Timestamp {
  const context = initContext(view, {
    fonts: atom()
  })

  const pro = initPro(view, {
    timestamp: atom()
  })

  const timestampString = atom(
    moment(pro.timestamp.get()).fromNow()
  )

  on.every(5000, () => {
    timestampString.set(
      moment(pro.timestamp.get()).fromNow()
    )
  })

  <timestamp>{timestampString.get()}</timestamp>

  $timestamp = {
    font: context.fonts.get().normal
  }
}
