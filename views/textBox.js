'use strict'

view TextBox {
  const pro = initPro(view, {
    autoFocus: M.defaultAtom(false),
    autoSelect: M.defaultAtom(false),
    enabled: M.defaultAtom(true),
    maxLength: M.defaultAtom(null),
    multiline: M.defaultAtom(false),
    initialValue: M.defaultAtom(''),
    value: atom(),
    inpStyle: M.mapAtom({}),
    placeholder: atom(),
    tabIndex: atom(),
    type: M.defaultAtom('text'),
    pattern: atom()
  })

  if (view.props.onInit) {
    view.props.onInit(view)
  }

  const inp = atom()
  const hovering = atom(false)

  view.focus = () => {
    inp.get() && inp.get().focus()
  }

  view.blur = () => {
    inp.get() && inp.get().blur()
  }

  if (view.props.methodsHack) {
    view.props.methodsHack({focus: view.focus, blur: view.blur})
  }

  const value = atom(pro.initialValue.get())
  pro.value.react(propValue => {
    if (propValue != null) {
      value.set(propValue)
    }
  })

  value.react(value => {
    if (inp.get() && inp.get().value != value) {
      inp.get().value = value
    }
  })

  const onChange = (newValueFromUser) => {
    if (pro.value.get() == null) {
      value.set(newValueFromUser)
    }

    view.props.onChange && view.props.onChange({value: newValueFromUser})
  }

  const onKeyDown = (e) => {
    if (e.key == 'Enter' && view.props.onEnter) {
      view.props.onEnter({value: value.get()})
    } else if (e.key == 'Escape' && view.props.onEscape) {
      view.props.onEscape({value: value.get()})
    }

    if (view.props.onKeyDown) view.props.onKeyDown({event: e})
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

  <input class="inp" if={!pro.multiline.get()}
    ref={elem => {if (elem) inp.set(elem)}}
    type={pro.type.get() || 'text'}
    pattern={pro.pattern.get()}
    autoFocus={pro.autoFocus.get()}
    defaultValue={value.get()}
    disabled={!pro.enabled.get()}
    onChange={e => onChange(e.target.value)}
    onKeyDown={onKeyDown}
    onFocus={onFocus}
    onBlur={onBlur}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    style={pro.inpStyle.get().toJS()}
    placeholder={pro.placeholder.get()}
    tabIndex={pro.tabIndex.get()}
    onClick={view.props.onClick}
    maxLength={pro.maxLength.get()}
  />
  <textarea class="inp" if={pro.multiline.get()}
    ref={elem => {if (elem) inp.set(elem)}}
    autoFocus={pro.autoFocus.get()}
    defaultValue={value.get()}
    disabled={!pro.enabled.get()}
    onChange={e => onChange(e.target.value)}
    onKeyDown={onKeyDown}
    onFocus={onFocus}
    onBlur={onBlur}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    placeholder={pro.placeholder.get()}
    style={pro.inpStyle.get().toJS()}
    tabIndex={pro.tabIndex.get()}
    onClick={view.props.onClick}
    maxLength={pro.maxLength.get()}
  />

  $ = {
  }
}
