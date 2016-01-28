view Lightbox {
  const pro = initPro(view, {
    picKeys: M.listAtom(),
    isOpen: M.defaultAtom(true),
    selectedIndex: atom(),
    initialSelectedIndex: atom()
  })

  const bodyWidth = atom(document.body.offsetWidth)
  const bodyHeight = atom(document.body.offsetHeight)

  on.resize(window, e => {
    bodyWidth.set(document.body.offsetWidth)
    bodyHeight.set(document.body.offsetHeight)
  })

  const isOpen = atom()

  const openCloseReactor = isOpen.reactor(isOpen => {
    if (isOpen) {
      view.props.onOpen && view.props.onOpen({})
    } else {
      view.props.onClose && view.props.onClose({})
    }
  }).start()

  pro.isOpen.react(propIsOpen => {
    openCloseReactor.stop()
    isOpen.set(propIsOpen)
    openCloseReactor.start()
  })

  const selectedIndex = atom(pro.initialSelectedIndex.get() || 0)
  const selectReactor = selectedIndex.reactor(selectedIndex => {
    view.props.onSelect && view.props.onSelect({selectedIndex})
  }).start()

  pro.selectedIndex.react(propSelectedIndex => {
    if (propSelectedIndex != null) {
      selectReactor.stop()
      selectedIndex.set(propSelectedIndex)
      selectReactor.start()
    }
  })

  on.keydown(window, e => {
    if (!view.mounted) {
      // This code path is due to a Flint bug
      return
    }

    if (e.keyCode == 37) {
      // Left
      selectedIndex.set(
        (selectedIndex.get() + pro.picKeys.get().size - 1) % pro.picKeys.get().size
      )
    } else if (e.keyCode == 39) {
      // Right
      selectedIndex.set((selectedIndex.get() + 1) % pro.picKeys.get().size)
    }
  })

  <MModal
    isOpen={isOpen.get()}
    onRequestClose={() => isOpen.set(false)}
    overlayStyle={{
      cursor: 'zoom-out'
    }}
    contentStyle={{
      cursor: 'default',
      borderRadius: 8
    }}
  >
    <Carousel if={pro.picKeys.get().size >= 2}
      selectedIndex={selectedIndex.get()}
      onSelect={e => selectedIndex.set(e.selectedIndex)}
      width={.8 * bodyWidth.get()}
      height={.9 * bodyHeight.get()}
      buttonWidth={60}
    >
      <Pic repeat={pro.picKeys.get()}
        picKey={_}
        fit="clip"
        style={{
          width: .8 * bodyWidth.get() - 120,
          height: .9 * bodyHeight.get(),
          background: '#f6f6f6'
        }}
      />
    </Carousel>
    <Pic if={pro.picKeys.get().size == 1}
      picKey={pro.picKeys.get().get(0)}
      fit="clip"
      style={{
        maxWidth: .8 * bodyWidth.get(),
        maxHeight: .9 * bodyHeight.get(),
        background: '#f6f6f6',
        cursor: 'zoom-out'
      }}
      onClick={() => isOpen.set(false)}
    />
  </MModal>
}
