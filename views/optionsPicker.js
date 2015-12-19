/*
  props:
    options: [
      {label, value}
    ]
*/

view OptionsPicker {
  const prop = initProp(view, {
    innerStyle: M.mapAtom({}),
    options: M.listAtom(),
    initialValues: M.listAtom([]),
    limit: M.defaultAtom(null),
    values: M.listAtom()
  })

  const selectedValues = atom(prop.initialValues.get())

  prop.values.react(values => {
    if (values != null) {
      selectedValues.set(values)
    }
  })

  selectedValues.reactor(selectedValues => {
    if (view.props.onChange) {
      view.props.onChange({selectedValues})
    }
  }).start()

  const onChange = (value, selected) => {
    const index = selectedValues.get().indexOf(value)
    if (selected) {
      if (index == -1) {
        if (
          prop.limit.get() == null ||
          selectedValues.get().size < prop.limit.get()
        ) {
          selectedValues.set(selectedValues.get().push(value).sort(M.util.compare))

        } else if (prop.limit.get() == 1) {
          selectedValues.set(List([value]))
        }
      }
    } else {
      if (index >= 0) {
        selectedValues.set(selectedValues.get().splice(index, 1))
      }
    }
  }

  const hoveringIndex = atom(-1)

  <FilterOption repeat={prop.options.get()}
    selected={selectedValues.get().indexOf(_.value) >= 0}
    onChange={e => onChange(_.value, e.selected)}
    onHover={e => hoveringIndex.set(e.hovering? _index : -1)}
    innerStyle={
      IMap({
        padding: [4, 8],
        margin: 4
      }).merge(
        prop.innerStyle.get()
      ).merge(
        selectedValues.get().size?
          null :
          (hoveringIndex.get() == _index? null : {background: '#fff'})
      ).toJS()
    }
  >
    {_.label}
  </FilterOption>

  $ = {
    flexDirection: 'row',
    flexWrap: 'wrap'
  }
}
