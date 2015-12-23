view Blank {
  const context = initContext(view, {
    colors: atom()
  })

  const pro = initPro(view, {
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
    if (pro.type.get() == 'number' || pro.type.get() == 'int') {
      return v == null? '' : '' + v
    } else if (pro.type.get() == 'string') {
      return v
    } else {
      throw new Error(`Unknown type: ${pro.type.get()}`)
    }
  }

  const stringToValue = (s) => {
    if (pro.type.get() == 'int' || pro.type.get() == 'number') {
      const v = (pro.type.get() == 'int')? parseInt(s, 10) : parseFloat(s, 10)
      if (isNaN(v)) return null
      if (pro.min.get() != null && v < pro.min.get()) return null
      if (pro.max.get() != null && v > pro.max.get()) return null
      return v
    } else if (pro.type.get() == 'string') {
      if (s) {
        return s
      } else {
        return pro.defaultValue.get() || ''
      }
    } else {
      throw new Error(`Unknown type: ${pro.type.get()}`)
    }
  }

  const hovering = atom(false)
  const editing = atom(false)

  const value = atom(pro.initialValue.get())

  pro.value.react(propValue => {
    if (propValue !== undefined) {
      value.set(propValue)
    }
  })

  const workingValue = atom()

  const str = atom(valueToString(value.get()))

  const autoSaving = atom(false)
  str.react(str => {
    workingValue.set(stringToValue(str))
    if (pro.autoSaveOnCharCount.get()) {
      if (
        workingValue.get() != null &&
        valueToString(workingValue.get()) == str &&
        str.length >= pro.autoSaveOnCharCount.get()
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
      if (pro.defaultValue.get() != null) {
        nextValue = pro.defaultValue.get()
      } else if (pro.nullable.get()) {
        nextValue = null
      }
    } else {
      nextValue = workingValue.get()
    }

    if (pro.value.get() === undefined) {
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
      pro.inpStyle.get().toJS()
    )}
    placeholder={pro.placeholder.get()}
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
