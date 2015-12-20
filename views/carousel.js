import {spring} from 'react-motion'

view Carousel {
  const context = initContext(view, {
    colors: atom()
  })

  const prop = initProp(view, {
    children: atom(),
    width: M.defaultAtom(200),
    buttonWidth: M.defaultAtom(40),
    height: M.defaultAtom(200),
    sortable: M.defaultAtom(false),
    initialSelectedIndex: atom(),
    selectedIndex: atom(),
    shadows: M.defaultAtom(false),
    showButtons: M.defaultAtom(true),
    wrapMode: M.defaultAtom('rewind'), // 'rewind'|'cylinder'|false
    style: M.mergeAtom({
      button: {
        border: 'none',
        background: '#f6f6f6',
        position: 'relative',
        fontSize: 48,
        display: 'flex',
        cursor: 'pointer',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#aaa',
        fontFamily: 'Franklin Gothic Book',
        zIndex: 5
      },
      buttonHover: {
        background: '#f9e7f2'
      }
    })
  })

  const buttonStyle = derivation(() => {
    return IMap({
      width: prop.buttonWidth.get(),
      height: innerHeight.get()
    }).merge(
      prop.style.get().get('button')
    )
  })

  const leftButtonStyle = derivation(() => {
    return buttonStyle.get().merge({
      borderRadius: [8, 0, 0, 8]
    }).merge(
      hoveringLeft.get()? prop.style.get().get('buttonHover') : undefined
    ).merge(
      prop.style.get().get('leftButton')
    )
  })

  const rightButtonStyle = derivation(() => {
    return buttonStyle.get().merge({
      borderRadius: [0, 8, 8, 0]
    }).merge(
      hoveringRight.get()? prop.style.get().get('buttonHover') : undefined
    ).merge(
      prop.style.get().get('rightButton')
    )
  })


  const innerWidth = derivation(() => {
    return prop.width.get() - (
      prop.showButtons.get()? 2 * prop.buttonWidth.get() : 0
    )
  })
  const innerHeight = derivation(() => {
    return prop.height.get()
  })

  const desiredIndex = atom(prop.initialSelectedIndex.get() || 0)

  prop.selectedIndex.react(propSelectedIndex => {
    const inc = (
      M.util.mod(propSelectedIndex, prop.children.get().length) -
      M.util.mod(desiredIndex.get(), prop.children.get().length)
    )
    desiredIndex.set(desiredIndex.get() + inc)
  }, {
    when: () => prop.selectedIndex.get() != null
  })

  const selectedIndex = lens({
    get: () => M.util.mod(desiredIndex.get(), prop.children.get().length),
    set: val => {
      if (prop.selectedIndex.get() == null) {
        desiredIndex.set(val)
      }
      view.props.onSelect && view.props.onSelect({
        selectedIndex: M.util.mod(val, prop.children.get().length)
      })
    }
  })

  const selectedChild = derivation(() => {
    return prop.children.get()[selectedIndex.get()] || null
  })

  prop.children.react(children => {
    if (desiredIndex.get() >= children.length) {
      desiredIndex.set(prop.children.get().length - 1)
    }
  })

  const advance = (inc) => {
    if (prop.wrapMode.get() == 'cylinder') {
      selectedIndex.set(desiredIndex.get() + inc)
    } else {
      selectedIndex.set(
        M.util.mod(selectedIndex.get() + inc, prop.children.get().length)
      )
    }
  }

  const panning = atom(false)
  const panDeltaX = atom(0)

  const things = atom(List())
  const setThing = (i, thing) => {
    if (!thing || things.get().contains(thing)) return
    things.set(things.get().push(thing))

    const hammer = Hammer(thing)

    hammer.on('panstart', e => {
      panning.set(true)
    })

    hammer.on('pan', e => {
      panDeltaX.set(e.deltaX)
    })

    hammer.on('panend', e => {
      transact(() => {
        if (panDeltaX.get() <= -innerWidth.get() / 2) {
          if (
            prop.wrapMode.get() == 'cylinder' ||
            selectedIndex.get() < prop.children.get().length - 1
          ) {
            advance(1)
          }
        } else if (panDeltaX.get() >= innerWidth.get() / 2) {
          if (prop.wrapMode.get() == 'cylinder' || selectedIndex.get() > 0) {
            advance(-1)
          }
        }

        panning.set(false)
        panDeltaX.set(0)
      })
    })
  }


  const hoveringLeft = atom(false)
  const hoveringRight = atom(false)

  <leftSection>
    <button class="leftButton"
      if={prop.showButtons.get() && prop.children.get().length > 1 && (
        prop.wrapMode.get() || selectedIndex.get() > 0
      )}
      onClick={() => advance(-1)}
      onMouseEnter={() => hoveringLeft.set(true)}
      onMouseLeave={() => hoveringLeft.set(false)}
      style={leftButtonStyle.get().toJS()}
    >
      &lt;
    </button>
  </leftSection>
  <midSection>
    <leftShadow if={
      prop.shadows.get() && (
        selectedIndex.get() > 0 || prop.wrapMode.get() == 'cylinder'
      )
    } />
    <rightShadow if={
      prop.shadows.get() && (
        selectedIndex.get() < prop.children.get().length - 1 ||
        prop.wrapMode.get() == 'cylinder'
      )
    } />
    <TransitionMotion
      styles={() => {
        const makeStyle = (i) => {
          return {
            x: spring(
              (i - desiredIndex.get()) * innerWidth.get()
            ),
            dx: panning.get()? panDeltaX.get() : spring(0)
          }
        }

        const styles = {}
        const start = desiredIndex.get() - (
          prop.wrapMode.get() == 'cylinder'?
          prop.children.get().length - 1 :
          selectedIndex.get()
        )
        const end = desiredIndex.get() + (
          prop.wrapMode.get() == 'cylinder'?
          prop.children.get().length - 1 :
          prop.children.get().length - 1 - selectedIndex.get()
        )
        for (let i = start; i <= end; i++) {
          styles[i] = makeStyle(i)
        }

        return styles
      }()}
    >
      {styles =>
        <thing repeat={Object.keys(styles)}
          key={_}
          ref={elem => setThing(_index, elem)}
          style={{
            left: styles[_].x + styles[_].dx
          }}
        >
          {prop.children.get()[
            M.util.mod(parseInt(_), prop.children.get().length)
          ]}
        </thing>
      }
    </TransitionMotion>
    <dotsSection if={prop.children.get().length > 1}>
      <Sortable if={prop.sortable.get()}
        key={prop.children.get().map(c => c.key).join('\n') + '\n' + selectedIndex.get()}
        onSort={e => {
          if (e.oldIndex < selectedIndex.get()) {
            if (e.newIndex >= selectedIndex.get()) {
              selectedIndex.set(selectedIndex.get() - 1)
            }
          } else if (e.oldIndex > selectedIndex.get()) {
            if (e.newIndex <= selectedIndex.get()) {
              selectedIndex.set(selectedIndex.get() + 1)
            }
          } else if (e.oldIndex == selectedIndex.get()) {
            selectedIndex.set(e.newIndex)
          }
          view.props.onSort(e)
        }}
      >
        <dot repeat={prop.children.get()}
          onClick={() => {
            const inc = _index - (
              M.util.mod(desiredIndex.get(), prop.children.get().length)
            )
            selectedIndex.set(desiredIndex.get() + inc)
          }}
        />
      </Sortable>
      <dot if={!prop.sortable.get()} repeat={prop.children.get()}
        onClick={() => {
          const inc = _index - (
            M.util.mod(desiredIndex.get(), prop.children.get().length)
          )
          selectedIndex.set(desiredIndex.get() + inc)
        }}
      />
    </dotsSection>
  </midSection>
  <rightSection>
    <button class="rightButton"
      if={prop.showButtons.get() && prop.children.get().length > 1 && (
        prop.wrapMode.get() || selectedIndex.get() < prop.children.get().length - 1
      )}
      onClick={() => advance(1)}
      onMouseEnter={() => hoveringRight.set(true)}
      onMouseLeave={() => hoveringRight.set(false)}
      style={rightButtonStyle.get().toJS()}
    >
      &gt;
    </button>
  </rightSection>

  $ = {
    flexDirection: 'row',
    alignItems: 'center'
  }

  $leftSection = {
    width: prop.buttonWidth.get()
  }

  $midSection = {
    flexDirection: 'row',
    width: innerWidth.get(),
    height: innerHeight.get(),
    overflow: 'hidden',
    position: 'relative'
  }

  $leftShadow = {
    position: 'absolute',
    zIndex: 2,
    top: 0,
    left: 0,
    bottom: 0,
    width: 30,
    background: 'linear-gradient(to right, rgba(100, 100, 100, 0.8) 0%, rgba(150, 150, 150, 0) 100%)'
  }

  $rightShadow = {
    position: 'absolute',
    zIndex: 2,
    top: 0,
    right: 0,
    bottom: 0,
    width: 30,
    background: 'linear-gradient(to left, rgba(100, 100, 100, 0.8) 0%, rgba(150, 150, 150, 0) 100%)'
  }

  $rightSection = {
    width: prop.buttonWidth.get()
  }

  $dotsSection = {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    marginLeft: 'auto',
    marginRight: 'auto',
    marginBottom: 12
  }

  $Sortable = {
    flexDirection: 'row'
  }

  $dot = {
    zIndex: 1,
    width: 10,
    height: 10,
    margin: [0, 4],
    borderRadius: '50%',
    background: (_index == selectedIndex.get()?
      context.colors.get().accent : '#999'
    ),
    cursor: prop.sortable.get()? 'move' : 'pointer'
  }

  $thing = {
    position: 'absolute',
    width: innerWidth.get(),
    height: innerHeight.get()
  }
}
