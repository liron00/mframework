import ReactMotion from 'react-motion'
const RMotion = ReactMotion.Motion
const RStaggeredMotion = ReactMotion.StaggeredMotion
const RTransitionMotion = ReactMotion.TransitionMotion
const spring = ReactMotion.spring

view Motion {
  const prop = initProp(view, {
    defaultStyle: M.mapAtom({}),
    style: M.mapAtom()
  })

  const styleAtom = atom(prop.defaultStyle.get())

  const der = styleAtom.derive(styleMap => {
    return view.props.children(styleMap.toJS())
  })

  const elemFunc = (style) => {
    styleAtom.set(immutable.fromJS(style))
    return der.get()
  }

  <RMotion
    defaultStyle={prop.defaultStyle.get().toJS()}
    style={prop.style.get().toJS()}
  >
    {() => {
      der.get() // Register derivable dependencies
      return elemFunc
    }()}
  </RMotion>
}

view TransitionMotion {
  const prop = initProp(view, {
    defaultStyles: M.mapAtom({}),
    styles: M.mapAtom(),
    willEnter: atom(),
    willLeave: atom()
  })

  const stylesAtom = atom(prop.defaultStyles.get())

  const der = stylesAtom.derive(stylesMap => {
    const ret = view.props.children(stylesMap.toJS())
    if (ret instanceof List || ret instanceof Array) {
      return <wrapper>{ret}</wrapper>
    } else {
      return ret
    }
  })

  const elemFunc = (styles) => {
    stylesAtom.set(immutable.fromJS(styles))
    return der.get()
  }

  <RTransitionMotion
    defaultStyles={prop.defaultStyles.get().toJS()}
    styles={prop.styles.get().toJS()}
    willEnter={prop.willEnter.get()}
    willLeave={prop.willLeave.get()}
  >
    {() => {
      der.get() // Register derivable dependencies
      return elemFunc
    }()}
  </RTransitionMotion>

  $wrapper = {
    position: 'relative'
  }
}
