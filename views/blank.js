view Blank {
  const context = initContext(view, {
    colors: atom()
  })

  const prop = initProp(view, {
    autoSaveOnCharCount: M.defaultAtom(null), // save after typing N chars
    initialValue: atom(),
    type: M.defaultAtom('string'),
    defaultValue: atom(),
    min: atom(),
    max: atom(),
    nullable: M.defaultAtom(false),
    placeholder: atom(),
    value: atom(),
    inpStyle: M.mapAtom({})
  })

  const valueToString = (v) => {
    if (prop.type.get() == 'number' || prop.type.get() == 'int') {
      return v == null? '' : '' + v
    } else if (prop.type.get() == 'string') {
      return v
    } else {
      throw new Error(`Unknown type: ${prop.type.get()}`)
    }
  }

  const stringToValue = (s) => {
    if (prop.type.get() == 'int' || prop.type.get() == 'number') {
      const v = (prop.type.get() == 'int')? parseInt(s, 10) : parseFloat(s, 10)
      if (isNaN(v)) return null
      if (prop.min.get() != null && v < prop.min.get()) return null
      if (prop.max.get() != null && v > prop.max.get()) return null
      return v
    } else if (prop.type.get() == 'string') {
      if (s) {
        return s
      } else {
        return prop.defaultValue.get() || ''
      }
    } else {
      throw new Error(`Unknown type: ${prop.type.get()}`)
    }
  }

  const hovering = atom(false)
  const editing = atom(false)

  const value = atom(prop.initialValue.get())

  prop.value.react(propValue => {
    if (propValue !== undefined) {
      value.set(propValue)
    }
  })

  const workingValue = atom()

  const str = atom(valueToString(value.get()))

  const autoSaving = atom(false)
  str.react(str => {
    workingValue.set(stringToValue(str))
    if (prop.autoSaveOnCharCount.get()) {
      if (
        workingValue.get() != null &&
        valueToString(workingValue.get()) == str &&
        str.length >= prop.autoSaveOnCharCount.get()
      ) {
        save()
      }
    }
  }, {
    when: autoSaving
  })

  editing.react(editing => {
    if (editing) {
      workingValue.set(value.get())
      str.set(valueToString(workingValue.get()))
      autoSaving.set(true)
    } else {
      autoSaving.set(false)
    }
  })

  const save = () => {
    let nextValue

    if (workingValue.get() == null) {
      if (prop.defaultValue.get() != null) {
        nextValue = prop.defaultValue.get()
      } else if (prop.nullable.get()) {
        nextValue = null
      }
    } else {
      nextValue = workingValue.get()
    }

    if (prop.value.get() === undefined) {
      value.set(nextValue)
    }

    if (view.props.onChange) {
      view.props.onChange({value: nextValue})
    }

    editing.set(false)
  }

  <TextBox
    key={'editing-' + editing.get()}
    autoSelect={true}
    value={editing.get()?
      str.get() :
      valueToString(value.get()) || ' '
    }
    enabled={editing.get()}
    autoFocus={editing.get()}
    inpStyle={Object.assign(
      {
        cursor: editing.get()? 'text' : 'pointer',
        color: context.colors.get().accent,
        outline: 0,
        background: 'none',
        borderRadius: editing.get()? 4 : 0
      },
      editing.get()?
        {
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: context.colors.get().accent,
          padding: 0
        } : {
          borderWidth: 1,
          borderStyle: ['none', 'none', 'dotted', 'none'],
          padding: [1, 1, 0, 1],
          borderColor: context.colors.get().accent,
          background: hovering.get()? 'rgba(225, 205, 225, 0.25)' : 'none'
        }
      ,
      prop.inpStyle.get().toJS()
    )}
    placeholder={prop.placeholder.get()}
    onChange={e => {if (editing.get()) str.set(e.value)}}
    onEnter={() => {if (editing.get()) save()}}
    onEscape={() => {if (editing.get()) editing.set(false)}}
    onBlur={() => {if (editing.get()) save()}}
    onClick={() => {if (!editing.get()) editing.set(true)}}
    onHover={(e) => hovering.set(e.hovering)}
  />

  $ = {
    display: 'inline-block'
  }
}
