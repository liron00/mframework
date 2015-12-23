'use strict'

// FIXME:
// When parent sets a value and reacts to onChange by editing it, then if
// types too quickly, their cursor moves to the end because pro.value gets
// changed to a stale copy of valueFromUser.
// Idea: Make it not-directly-editable when it's a controlled component,
// i.e. React's move

view TextBox {
  const pro = initPro(view, {
    autoFocus: M.defaultAtom(false),
    autoSelect: M.defaultAtom(false),
    enabled: M.defaultAtom(true),
    multiline: M.defaultAtom(false),
    initialValue: M.defaultAtom(''),
    value: atom(),
    inpStyle: M.mapAtom({}),
    placeholder: atom(),
    tabIndex: atom()
  })

  const inp = atom()
  const hovering = atom(false)

  view.focus = () => {
    inp.get() && inp.get().focus()
  }

  const value = atom(pro.initialValue.get())
  pro.value.react(propValue => {
    if (propValue != null) {
      value.set(propValue)
    }
  })

  const valueFromUser = atom(value.get())
  valueFromUser.react(valueFromUser => {
    value.set(valueFromUser)

    if (view.props.onChange) {
      view.props.onChange({value: valueFromUser})
    }
  })

  value.react(value => {
    if (value != valueFromUser.get()) {
      // pro just momentarily took control of the value from the user
      if (inp.get()) {
        inp.get().value = value
      }
    }
  })

  const onKeyDown = (e) => {
    if (e.key == 'Enter' && view.props.onEnter) {
      view.props.onEnter({value: value.get()})
    } else if (e.key == 'Escape' && view.props.onEscape) {
      view.props.onEscape({value: value.get()})
    }

    if (view.props.onKeyDown) view.props.onKeyDown(e)
  }

  const onFocus = (e) => {
    if (pro.autoSelect.get()) {
      on.delay(1, () => {
        if (inp.get()) {
          inp.get().select()
        }
      })
    }
    if (view.props.onFocus) view.props.onFocus(e)
  }
  const onBlur = (e) => {
    if (view.props.onBlur) view.props.onBlur(e)
  }

  const onMouseEnter = (e) => {
    hovering.set(true)
    if (view.props.onMouseEnter) view.props.onMouseEnter(e)
  }
  const onMouseLeave = (e) => {
    hovering.set(false)
    if (view.props.onMouseLeave) view.props.onMouseLeave(e)
  }
  hovering.react(hovering => {
    if (view.props.onHover) view.props.onHover({hovering})
  })

  <input class="inp" type="text" if={!pro.multiline.get()}
    ref={elem => {if (elem) inp.set(elem)}}
    autoFocus={pro.autoFocus.get()}
    defaultValue={value.get()}
    disabled={!pro.enabled.get()}
    onChange={e => valueFromUser.set(e.target.value)}
    onKeyDown={onKeyDown}
    onFocus={onFocus}
    onBlur={onBlur}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    style={pro.inpStyle.get().toJS()}
    placeholder={pro.placeholder.get()}
    tabIndex={pro.tabIndex.get()}
    onClick={view.props.onClick}
  />
  <textarea class="inp" if={pro.multiline.get()}
    ref={elem => {if (elem) inp.set(elem)}}
    autoFocus={pro.autoFocus.get()}
    defaultValue={value.get()}
    disabled={!pro.enabled.get()}
    onChange={e => valueFromUser.set(e.target.value)}
    onKeyDown={onKeyDown}
    onFocus={onFocus}
    onBlur={onBlur}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    placeholder={pro.placeholder.get()}
    style={pro.inpStyle.get().toJS()}
    tabIndex={pro.tabIndex.get()}
    onClick={view.props.onClick}
  />

  $ = {
  }
}
