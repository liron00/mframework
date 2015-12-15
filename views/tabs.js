view Tabs {
  const context = initContext(view, {
    colors: atom()
  })

  const prop = initProp(view, {
    options: M.listAtom(),
    initialSelectedValue: atom(),
    selectedValue: atom(),
    style: M.mapAtom({})
  })

  const selectedValue = atom(prop.initialSelectedValue.get())
  prop.selectedValue.react(propSelectedValue => {
    if (propSelectedValue !== undefined) {
      selectedValue.set(propSelectedValue)
    }
  })

  const selectedIndex = derivation(() => {
    if (selectedValue == null) {
      return -1
    }
    return prop.options.get().findIndex(selectedValue.get())
  })

  selectedValue.reactor(selectedValue => {
    if (view.props.onSelect) view.props.onSelect({value: selectedValue})
  }).start()

  <tab repeat={prop.options.get()}
    onClick={() => selectedValue.set(_.value)}
    style={IMap({
      background: selectedValue.get() == _.value? 'white': '#ececf0',
      color: (selectedValue.get() == _.value?
        context.colors.get().accent : '#70767b'
      ),
      fontFamily: 'bebas',
      fontStyle: 'italic',
      wordSpacing: 4,
      cursor: selectedValue.get() == _.value? null : 'pointer',
      padding: [12, 20],
      borderRadius: [8, 8, 0, 0],
      borderStyle: 'solid',
      borderWidth: 1,
      borderLeftColor: selectedValue.get() == _.value? '#ccc' : '#ddd',
      borderTopColor: selectedValue.get() == _.value? '#ccc' : '#ddd',
      borderRightColor: selectedValue.get() == _.value? '#ccc' : '#ddd',
      borderBottomColor: selectedValue.get() == _.value? 'white': '#ccc',
      position: 'relative',
      zIndex: 1,
      top: 1
    }).merge(
      prop.style.get().get('tab') || {}
    ).toJS()}
  >
    {_.label}
  </tab>

  $ = {
    flexDirection: 'row'
  }
}
