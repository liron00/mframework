view FilterOption {
  const context = initContext(view, {
    colors: atom()
  })

  const prop = initProp(view, {
    children: atom(),
    selected: M.defaultAtom(false),
    innerStyle: M.mapAtom({})
  })

  const selected = atom()
  prop.selected.react(propSelected => {
    selected.set(propSelected)
  })

  selected.reactor(selected => {
    if (view.props.onChange) {
      view.props.onChange({selected})
    }
  }).start()

  const hovering = atom(false)
  hovering.reactor(hovering => {
    if (view.props.onHover) view.props.onHover({hovering})
  }).start()

  <filterOption
    onClick={() => selected.set(!selected.get())}
    onMouseEnter={() => hovering.set(true)}
    onMouseLeave={() => hovering.set(false)}
    style={
      IMap({
        flexGrow: 1,
        alignSelf: 'stretch',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        borderRadius: 8,
        padding: 4,
        cursor: 'pointer',
        fontSize: 13,
        border: '1px solid #d5dade',
        background: (selected.get()?
          context.colors.get().accent :
          'linear-gradient(to bottom, #f1f1f6 0%, #c1c1d2 100%)'
        ),
        color: selected.get()? 'white' : 'black'
      }).merge(
        prop.innerStyle.get()
      ).toJS()
    }
  >
    {prop.children.get()}
  </filterOption>
}
