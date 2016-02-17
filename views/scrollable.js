view Scrollable {
  const pro = initPro(view, {
    autoBottom: M.defaultAtom(false),
    children: atom(),
    shadowHeight: M.defaultAtom(3)
  })

  const elem = atom()
  const offsetHeight = atom()
  const scrollHeight = atom()
  const scrollTop = atom(0)

  const scrollHeightAfterAuto = atom()
  const scrollTopAfterAuto = atom()

  const atTop = derivation(() => {
    return scrollTop.get() == 0
  })

  const atBottom = derivation(() => {
    if (elem.get() && offsetHeight.get()) {
      return scrollTop.get() >= scrollHeight.get() - offsetHeight.get()
    } else {
      return false
    }
  })

  scrollHeight.react(scrollHeight => {
    if (elem.get() && pro.autoBottom.get() && (
      scrollHeightAfterAuto.get() == undefined || (
        scrollHeight > scrollHeightAfterAuto.get() &&
        scrollTop.get() >= scrollTopAfterAuto.get() - 5
      )
    )) {
      elem.get().scrollTop = elem.get().scrollHeight
      transact(() => {
        scrollHeightAfterAuto.set(elem.get().scrollHeight)
        scrollTopAfterAuto.set(elem.get().scrollTop)
      })
    }
  })

  on.change(() => {
    on.delay(1, () => {
      if (elem.get()) {
        transact(() => {
          scrollHeight.set(elem.get().scrollHeight)
          offsetHeight.set(elem.get().offsetHeight)
        })
      }
    })
  })

  scrollTop.react(() => {
    if (view.props.onScroll) {
      view.props.onScroll({scrollTop: scrollTop.get()})
    }
  }, {skipFirst: true})

  <scrollable
    ref={el => elem.set(el)}
    onScroll={e => {
      scrollTop.set(e.target.scrollTop)
    }}
  >
    <scrollContent>
      {pro.children.get()}
    </scrollContent>
  </scrollable>
  <topShadow />
  <bottomShadow />

  $ = {
    overflow: 'auto',
    alignItems: 'stretch',
    position: 'relative'
  }

  $container = {
    overflow: 'auto',
    flexGrow: 1,
    alignItems: 'stretch'
  }

  $scrollable = {
    overflowX: 'hidden',
    overflowY: 'auto',
    alignItems: 'stretch',
    flexGrow: 1
  }

  $scrollContent = {
    flexGrow: 1,
    alignItems: 'stretch'
  }

  $topShadow = {
    position: 'absolute',
    pointerEvents: 'none',
    zIndex: 2,
    top: 0,
    visibility: atTop.get()? 'hidden': 'visible',
    left: 0,
    right: 0,
    height: pro.shadowHeight.get(),
    background: 'linear-gradient(to bottom, rgba(150, 150, 150, 0.8) 0%, rgba(150, 150, 150, 0) 100%)'
  }

  $bottomShadow = {
    position: 'absolute',
    pointerEvents: 'none',
    zIndex: 2,
    bottom: 0,
    visibility: atBottom.get()? 'hidden' : 'visible',
    left: 0,
    right: 0,
    height: pro.shadowHeight.get(),
    background: 'linear-gradient(to bottom, rgba(150, 150, 150, 0) 0%, rgba(150, 150, 150, 0.8) 100%)'
  }
}
