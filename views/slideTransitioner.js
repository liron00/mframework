import {spring} from 'react-motion'

view SlideTransitioner {
  const prop = initProp(view, {
    children: atom(),
    selectedIndex: M.defaultAtom(-1),
    springStiffness: M.defaultAtom(290),
    springDamping: M.defaultAtom(29),
    style: M.mergeAtom({
      width: 100
    })
  })

  const desiredIndex = atom()
  prop.selectedIndex.react(propSelectedIndex => {
    if (propSelectedIndex != null) {
      desiredIndex.set(propSelectedIndex)
    }
  })

  const children = prop.children.derive(c => List(React.Children.toArray(c)))

  const selectedIndex = derivation(() => {
    return Math.min(desiredIndex.get(), children.get().size)
  })

  const makeSpring = (targetValue) => {
    return spring(targetValue, [
      prop.springStiffness.get(),
      prop.springDamping.get()
    ])
  }

  <TransitionMotion
    defaultStyles={() => {
      return selectedIndex.get() == -1? {} : {
        [selectedIndex.get()]: {
          left: -prop.style.get().get('width')
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
        left: -prop.style.get().get('width')
      }
    }}
    willLeave={i => {
      return {
        left: makeSpring(-prop.style.get().get('width'))
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
    width: prop.style.get().width
  }

  $thing = {
    position: 'absolute'
  }
}
