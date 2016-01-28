import {spring} from 'react-motion'

view FadeTransitioner {
  const pro = initPro(view, {
    children: atom(),
    preloadChildren: M.defaultAtom(true),
    selectedIndex: atom(),
    springStiffness: M.defaultAtom(290),
    springDamping: M.defaultAtom(29),
    style: M.mergeAtom({})
  })

  const desiredIndex = atom()
  pro.selectedIndex.react(propSelectedIndex => {
    if (propSelectedIndex !== undefined) {
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
      if (pro.preloadChildren.get()) {
        const ret = {}
        children.get().forEach((child, i) => {
          ret[i] = {
            opacity: i == selectedIndex.get()? 1 : 0,
            zIndex: i == selectedIndex.get()? 1 : -1
          }
        })
        return ret
      } else {
        return selectedIndex.get() == -1? {} : {
          [selectedIndex.get()]: {
            opacity: 1
          }
        }
      }
    }()}
    styles={() => {
      if (pro.preloadChildren.get()) {
        const ret = {}
        children.get().forEach((child, i) => {
          ret[i] = {
            opacity: makeSpring(i == selectedIndex.get()? 1 : 0),
            zIndex: i == selectedIndex.get()? 1 : -1
          }
        })
        return ret
      } else {
        return selectedIndex.get() == -1? {} : {
          [selectedIndex.get()]: {
            opacity: makeSpring(1)
          }
        }
      }
    }()}
    willEnter={i => {
      return {
        opacity: 0
      }
    }}
    willLeave={i => {
      return {
        opacity: makeSpring(0)
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
    width: pro.style.get().width,
    height: pro.style.get().height
  }

  $thing = {
    position: 'absolute'
  }
}
