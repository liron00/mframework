view Lightbox {
  const prop = initProp(view, {
    picKeys: M.listAtom(),
    isOpen: M.defaultAtom(true),
    selectedIndex: atom(),
    initialSelectedIndex: atom()
  })

  const bodyWidth = atom(document.body.offsetWidth)
  const bodyHeight = atom(document.body.offsetHeight)

  on.resize(e => {
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

  prop.isOpen.react(propIsOpen => {
    openCloseReactor.stop()
    isOpen.set(propIsOpen)
    openCloseReactor.start()
  })

  const selectedIndex = atom(prop.initialSelectedIndex.get() || 0)
  const selectReactor = selectedIndex.reactor(selectedIndex => {
    view.props.onSelect && view.props.onSelect({selectedIndex})
  }).start()

  prop.selectedIndex.react(propSelectedIndex => {
    if (propSelectedIndex != null) {
      selectReactor.stop()
      selectedIndex.set(propSelectedIndex)
      selectReactor.start()
    }
  })

  on.keydown(e => {
    if (e.keyCode == 37) {
      // Left
      selectedIndex.set(
        (selectedIndex.get() + prop.picKeys.get().size - 1) % prop.picKeys.get().size
      )
    } else if (e.keyCode == 39) {
      // Right
      selectedIndex.set((selectedIndex.get() + 1) % prop.picKeys.get().size)
    }
  })

  <Modal
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
    <Carousel if={prop.picKeys.get().size >= 2}
      selectedIndex={selectedIndex.get()}
      onSelect={e => selectedIndex.set(e.selectedIndex)}
      width={.8 * bodyWidth.get()}
      height={.9 * bodyHeight.get()}
      buttonWidth={60}
    >
      <Pic repeat={prop.picKeys.get()}
        picKey={_}
        fit="clip"
        style={{
          width: .8 * bodyWidth.get() - 120,
          height: .9 * bodyHeight.get(),
          background: '#f6f6f6'
        }}
      />
    </Carousel>
    <Pic if={prop.picKeys.get().size == 1}
      picKey={prop.picKeys.get().get(0)}
      fit="clip"
      style={{
        maxWidth: .8 * bodyWidth.get(),
        maxHeight: .9 * bodyHeight.get(),
        background: '#f6f6f6',
        cursor: 'zoom-out'
      }}
      onClick={() => isOpen.set(false)}
    />
  </Modal>
}
