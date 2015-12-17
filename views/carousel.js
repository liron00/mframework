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
    showButtons: M.defaultAtom(true),
    wrap: M.defaultAtom(true),
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
    desiredIndex.set(propSelectedIndex)
  }, {
    when: () => prop.selectedIndex.get() != null
  })

  const selectedIndex = lens({
    get: () => Math.min(
      prop.selectedIndex.get() == null? desiredIndex.get() : prop.selectedIndex.get(),
      prop.children.get().length - 1
    ),
    set: val => {
      if (prop.selectedIndex.get() == null) {
        desiredIndex.set(val)
      }
      view.props.onSelect && view.props.onSelect({
        selectedIndex: val
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
    let nextIndex = (selectedIndex.get() + inc) % prop.children.get().length
    if (nextIndex < 0) {
      nextIndex = prop.children.get().length + nextIndex
    }
    selectedIndex.set(nextIndex)
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
          if (selectedIndex.get() < prop.children.get().length - 1) {
            advance(1)
          }
        } else if (panDeltaX.get() >= innerWidth.get() / 2) {
          if (selectedIndex.get() > 0) {
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
        prop.wrap.get() || selectedIndex.get() > 0
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
    <TransitionMotion
      styles={() => {
        const styles = {}
        prop.children.get().forEach((child, i) => {
          styles[i] = {
            x: spring(
              (i - selectedIndex.get()) * innerWidth.get()
            ),
            dx: panning.get()? panDeltaX.get() : spring(0)
          }
        })
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
          {prop.children.get()[_]}
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
          onClick={() => {selectedIndex.set(_index)}}
        />
      </Sortable>
      <dot if={!prop.sortable.get()} repeat={prop.children.get()}
        onClick={() => {selectedIndex.set(_index)}}
      />
    </dotsSection>
  </midSection>
  <rightSection>
    <button class="rightButton"
      if={prop.showButtons.get() && prop.children.get().length > 1 && (
        prop.wrap.get() || selectedIndex.get() < prop.children.get().length - 1
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
    overflow: 'hidden'
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
