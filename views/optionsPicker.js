/*
  props:
    options: [
      {label, value}
    ]
*/

view OptionsPicker {
  const pro = initPro(view, {
    innerStyle: M.mapAtom({}),
    options: M.listAtom(),
    initialValues: M.listAtom([]),
    limit: M.defaultAtom(null),
    values: M.listAtom()
  })

  const selectedValues = atom(pro.initialValues.get())

  pro.values.react(propValues => {
    selectedValues.set(propValues)
  }, {when: () => pro.values.get() != null})

  const onChange = (value, selected) => {
    let nextSelectedValues = selectedValues.get()

    const index = selectedValues.get().indexOf(value)
    if (selected) {
      if (index == -1) {
        if (
          pro.limit.get() == null ||
          selectedValues.get().size < pro.limit.get()
        ) {
          nextSelectedValues = selectedValues.get().push(value).sort(M.util.compare)

        } else if (pro.limit.get() == 1) {
          nextSelectedValues = List([value])
        }
      }
    } else {
      if (index >= 0) {
        nextSelectedValues = selectedValues.get().splice(index, 1)
      }
    }

    if (pro.values.get() == null) {
      selectedValues.set(nextSelectedValues)
    }

    if (view.props.onChange) {
      view.props.onChange({selectedValues: nextSelectedValues})
    }
  }

  const hoveringIndex = atom(-1)

  <FilterOption repeat={pro.options.get()}
    selected={selectedValues.get().indexOf(_.value) >= 0}
    onChange={e => onChange(_.value, e.selected)}
    onHover={e => hoveringIndex.set(e.hovering? _index : -1)}
    innerStyle={
      IMap({
        padding: [4, 8],
        margin: 4
      }).merge(
        pro.innerStyle.get()
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
