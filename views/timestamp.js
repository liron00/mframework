import moment from 'moment'

view Timestamp {
  const prop = initProp(view, {
    timestamp: atom()
  })

  const timestampString = atom(
    moment(prop.timestamp.get()).fromNow()
  )

  on.every(5000, () => {
    timestampString.set(
      moment(prop.timestamp.get()).fromNow()
    )
  })

  <timestamp>{timestampString.get()}</timestamp>

  $timestamp = {
    fontFamily: 'proximanova',
    fontWeight: 'normal'
  }
}
