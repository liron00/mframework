import {spring} from 'react-motion'

view SlideTransitioner {
  const pro = initPro(view, {
    children: atom(),
    selectedIndex: M.defaultAtom(-1),
    springStiffness: M.defaultAtom(290),
    springDamping: M.defaultAtom(29),
    width: M.defaultAtom(100)
  })

  const desiredIndex = atom()
  pro.selectedIndex.react(propSelectedIndex => {
    if (propSelectedIndex != null) {
      desiredIndex.set(propSelectedIndex)
    }
  })

  const children = pro.children.derive(c => List(React.Children.toArray(c)))

  const selectedIndex = derivation(() => {
    return Math.min(desiredIndex.get(), children.get().size)
  })

  const makeSpring = (targetValue) => {
    return spring(targetValue, [
      pro.springStiffness.get(),
      pro.springDamping.get()
    ])
  }

  <TransitionMotion
    defaultStyles={() => {
      return selectedIndex.get() == -1? {} : {
        [selectedIndex.get()]: {
          left: -pro.width.get()
        }
      }
    }()}
    styles={() => {
      return selectedIndex.get() == -1? {} : {
        [selectedIndex.get()]: {
          left: makeSpring(0)
        }
      }
    }()}
    willEnter={i => {
      return {
        left: -pro.width.get()
      }
    }}
    willLeave={i => {
      return {
        left: makeSpring(-pro.width.get())
      }
    }}
  >
    {styles =>
      <thing repeat={Object.keys(styles)} key={_} style={styles[_]}>
        {children.get().get(_)}
      </thing>
    }
  </TransitionMotion>

  $ = {
  }

  $thing = {
    position: 'absolute'
  }
}
