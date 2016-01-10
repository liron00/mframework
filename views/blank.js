view Blank {
  const context = initContext(view, {
    colors: atom(),
    isMobile: atom()
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
    if (view.props.valueToString) {
      return view.props.valueToString(v)
    } else if (pro.type.get() == 'number' || pro.type.get() == 'int') {
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
  }, {
    when: editing
  })

  workingValue.react(workingValue => {
    if (
      workingValue != null &&
      valueToString(workingValue) == str.get() &&
      str.get().length >= pro.autoSaveOnCharCount.get()
    ) {
      save()
    }
  }, {
    when: () => {return pro.autoSaveOnCharCount.get() && autoSaving.get()}
  })

  editing.react(editing => {
    if (editing) {
      autoSaving.set(false)
      workingValue.set(value.get())
      str.set(valueToString(workingValue.get()))
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

    if (pro.value.get() === undefined) {
      editing.set(false)
    } else {
      // In controlled-component mode, give props time to change the value
      // shown in view mode.
      on.delay(100, () => {
        editing.set(false)
      })
    }

    inp.get().blur()
  }

  const inp = atom()

  <TextBox
    key={context.isMobile.get()? '' : 'editing-' + editing.get()}
    type={
      (
        window.navigator.userAgent.match(/iPad|iPhone/i) && (
          pro.type.get() == 'number' || pro.type.get() == 'int'
        )
      )? 'number' : null
    }
    pattern={
      window.navigator.userAgent.match(/iPad|iPhone/i)? (
        pro.type.get() == 'number'? '\\d+(\\.\\d*)?' : (
          pro.type.get() == 'int'? '\\d*' : null
        )
      ) : null
    }
    onInit={v => inp.set(v)}
    value={editing.get()?
      str :
      value.derive(valueToString).or('')
    }
    enabled={context.isMobile.get() || editing.get()}
    autoFocus={editing.get()}
    autoSelect={true}
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
    onChange={e => {
      if (editing.get()) {
        str.set(e.value)
      }
    }}
    onKeyDown={e => {
      on.delay(context.isMobile.get()? 500 : 1, () => {
        autoSaving.set(true)
      })
    }}
    onEnter={() => {if (editing.get()) save()}}
    onEscape={() => {if (editing.get()) editing.set(false)}}
    onBlur={() => {if (editing.get()) save()}}
    onClick={() => {
      editing.set(true)
    }}
    onHover={(e) => {
      if (!context.isMobile.get()) {
        hovering.set(e.hovering)
      }
    }}
  />

  $ = {
    display: 'inline-block'
  }
}
