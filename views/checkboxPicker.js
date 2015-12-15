/*
  props:
    options: [
      {label, value}
    ]
*/

view CheckboxPicker {
  const prop = initProp(view, {
    options: atom(),
    initialValues: M.listAtom([]),
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

  const onChange = (e) => {
    const value = e.target.value
    const index = selectedValues.get().indexOf(value)
    if (index >= 0) {
      selectedValues.set(selectedValues.get().splice(index, 1))
    } else {
      selectedValues.set(selectedValues.get().push(value).sort(M.util.compare))
    }
  }

  <content>
    <label repeat={prop.options.get()}>
      <input type="checkbox"
        value={_.value}
        checked={selectedValues.get().indexOf(_.value) >= 0}
        onChange={onChange}
      />
      {_.label}
    </label>
  </content>

  $label = {
    cursor: 'pointer'
  }
}
