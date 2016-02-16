import {spring} from 'react-motion'

view Carousel {
  const context = initContext(view, {
    colors: atom()
  })

  const pro = initPro(view, {
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
        display: 'block',
        flexDirection: 'row',
        cursor: 'pointer',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#aaa',
        fontFamily: 'Franklin Gothic Book',
        zIndex: 5
      },
      buttonHover: {
        background: '#f9e7f2'
      },
      dot: {
        size: 10
      },
      dots: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 12,
        flexDirection: 'row',
        justifyContent: 'center'
      },
      shadow: {
        width: 30
      }
    })
  })

  const buttonStyle = derivation(() => {
    return IMap({
      width: pro.buttonWidth.get(),
      height: innerHeight.get()
    }).merge(
      pro.style.get().get('button')
    )
  })

  const leftButtonStyle = derivation(() => {
    return buttonStyle.get().merge({
      borderRadius: [8, 0, 0, 8]
    }).merge(
      hoveringLeft.get()? pro.style.get().get('buttonHover') : undefined
    ).merge(
      pro.style.get().get('leftButton')
    )
  })

  const rightButtonStyle = derivation(() => {
    return buttonStyle.get().merge({
      borderRadius: [0, 8, 8, 0]
    }).merge(
      hoveringRight.get()? pro.style.get().get('buttonHover') : undefined
    ).merge(
      pro.style.get().get('rightButton')
    )
  })


  const innerWidth = derivation(() => {
    return pro.width.get() - (
      pro.showButtons.get()? 2 * pro.buttonWidth.get() : 0
    )
  })
  const innerHeight = derivation(() => {
    return pro.height.get()
  })

  const desiredIndex = atom(pro.initialSelectedIndex.get() || 0)

  pro.selectedIndex.react(propSelectedIndex => {
    const inc = (
      M.util.mod(propSelectedIndex, React.Children.count(pro.children.get())) -
      M.util.mod(desiredIndex.get(), React.Children.count(pro.children.get()))
    )
    desiredIndex.set(desiredIndex.get() + inc)
  }, {
    when: () => pro.selectedIndex.get() != null
  })

  const selectedIndex = lens({
    get: () => M.util.mod(desiredIndex.get(), React.Children.count(pro.children.get())),
    set: val => {
      if (pro.selectedIndex.get() == null) {
        desiredIndex.set(val)
      }
      view.props.onSelect && view.props.onSelect({
        selectedIndex: M.util.mod(val, React.Children.count(pro.children.get()))
      })
    }
  })

  selectedIndex.react(selectedIndex => {
    M.mixpanel.track("CarouselThingView", {
      selectedIndex,
      numThings: React.Children.count(pro.children.get())
    })
  })

  const selectedChild = derivation(() => {
    return React.Children.toArray(pro.children.get())[selectedIndex.get()] || null
  })

  pro.children.react(() => {
    if (desiredIndex.get() >= React.Children.count(pro.children.get())) {
      desiredIndex.set(React.Children.count(pro.children.get()) - 1)
    }
  })

  const advance = (inc, inputMethod) => {
    if (pro.wrapMode.get() == 'cylinder') {
      selectedIndex.set(desiredIndex.get() + inc)
    } else {
      selectedIndex.set(
        M.util.mod(selectedIndex.get() + inc, React.Children.count(pro.children.get()))
      )
    }

    M.mixpanel.track("CarouselAdvance", {
      inc,
      inputMethod,
      numThings: React.Children.count(pro.children.get())
    })
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
        if (panDeltaX.get() <= 0.15 * -innerWidth.get()) {
          if (
            pro.wrapMode.get() == 'cylinder' ||
            selectedIndex.get() < React.Children.count(pro.children.get()) - 1
          ) {
            advance(1, 'swipe')
          }
        } else if (panDeltaX.get() >= 0.15 * innerWidth.get()) {
          if (pro.wrapMode.get() == 'cylinder' || selectedIndex.get() > 0) {
            advance(-1, 'swipe')
          }
        }

        panning.set(false)
        panDeltaX.set(0)
      })
    })
  }


  const hoveringLeft = atom(false)
  const hoveringRight = atom(false)

  <leftSection if={pro.showButtons.get()}>
    <button class="leftButton"
      if={React.Children.count(pro.children.get()) > 1 && (
        pro.wrapMode.get() || selectedIndex.get() > 0
      )}
      onClick={() => advance(-1, 'button')}
      onMouseEnter={() => hoveringLeft.set(true)}
      onMouseLeave={() => hoveringLeft.set(false)}
      style={leftButtonStyle.get().toJS()}
    >
      &lt;
    </button>
  </leftSection>
  <midSection>
    <leftShadow if={
      pro.shadows.get() && (
        selectedIndex.get() > 0 || pro.wrapMode.get() == 'cylinder'
      )
    } />
    <rightShadow if={
      pro.shadows.get() && (
        selectedIndex.get() < React.Children.count(pro.children.get()) - 1 ||
        pro.wrapMode.get() == 'cylinder'
      )
    } />
    <things>
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
            pro.wrapMode.get() == 'cylinder'?
            React.Children.count(pro.children.get()) - 1 :
            selectedIndex.get()
          )
          const end = desiredIndex.get() + (
            pro.wrapMode.get() == 'cylinder'?
            React.Children.count(pro.children.get()) - 1 :
            React.Children.count(pro.children.get()) - 1 - selectedIndex.get()
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
            {React.Children.toArray(pro.children.get())[
              M.util.mod(parseInt(_), React.Children.count(pro.children.get()))
            ]}
          </thing>
        }
      </TransitionMotion>
    </things>
    <dotsSection if={pro.children.get().length > 1}
      style={pro.style.get().get('dots').toJS()}
    >
      <Sortable if={pro.sortable.get()}
        key={pro.children.get().map(c => c.key).join('\n') + '\n' + selectedIndex.get()}
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
        <dot repeat={pro.children.get()}
          onClick={() => {
            const inc = _index - (
              M.util.mod(desiredIndex.get(), pro.children.get().length)
            )
            selectedIndex.set(desiredIndex.get() + inc)
          }}
        />
      </Sortable>
      <dot if={!pro.sortable.get()} repeat={pro.children.get()}
        onClick={() => {
          const inc = _index - (
            M.util.mod(desiredIndex.get(), pro.children.get().length)
          )
          selectedIndex.set(desiredIndex.get() + inc)
          M.mixpanel.track("CarouselDotClick", {
            dotIndex: _index,
            numThings: pro.children.get().length
          })
        }}
      />
    </dotsSection>
  </midSection>
  <rightSection if={pro.showButtons.get()}>
    <button class="rightButton"
      if={pro.children.get().length > 1 && (
        pro.wrapMode.get() || selectedIndex.get() < pro.children.get().length - 1
      )}
      onClick={() => advance(1, 'button')}
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
    width: pro.buttonWidth.get()
  }

  $midSection = {
    flexDirection: 'row',
    width: innerWidth.get(),
    height: innerHeight.get(),
    position: 'relative'
  }

  $things = {
    width: innerWidth.get(),
    height: innerHeight.get(),
    overflow: 'hidden'
  }

  $leftShadow = {
    position: 'absolute',
    pointerEvents: 'none',
    zIndex: 2,
    top: 0,
    left: 0,
    bottom: 0,
    width: pro.style.get().get('shadow').get('width'),
    background: 'linear-gradient(to right, rgba(100, 100, 100, 0.8) 0%, rgba(150, 150, 150, 0) 100%)'
  }

  $rightShadow = {
    position: 'absolute',
    pointerEvents: 'none',
    zIndex: 2,
    top: 0,
    right: 0,
    bottom: 0,
    width: pro.style.get().get('shadow').get('width'),
    background: 'linear-gradient(to left, rgba(100, 100, 100, 0.8) 0%, rgba(150, 150, 150, 0) 100%)'
  }

  $rightSection = {
    width: pro.buttonWidth.get()
  }

  $Sortable = {
    flexDirection: 'row'
  }

  $dot = {
    zIndex: 1,
    width: pro.style.get().get('dot').get('size'),
    height: pro.style.get().get('dot').get('size'),
    margin: [0, 4],
    borderRadius: '50%',
    background: (_index == selectedIndex.get()?
      context.colors.get().accent : '#999'
    ),
    cursor: pro.sortable.get()? 'move' : 'pointer'
  }

  $thing = {
    position: 'absolute',
    width: innerWidth.get(),
    height: innerHeight.get()
  }

  $ghost = {
    visibility: 'hidden'
  }
}
