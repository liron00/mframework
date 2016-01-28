import ReactMotion from 'react-motion'
const RMotion = ReactMotion.Motion
const RStaggeredMotion = ReactMotion.StaggeredMotion
const RTransitionMotion = ReactMotion.TransitionMotion
const spring = ReactMotion.spring

view Motion {
  const pro = initPro(view, {
    defaultStyle: M.mapAtom({}),
    style: M.mergeAtom()
  })

  const styleAtom = atom(pro.defaultStyle.get())

  const der = styleAtom.derive(styleMap => {
    return view.props.children(styleMap.toJS())
  })

  const elemFunc = (style) => {
    styleAtom.set(immutable.fromJS(style))
    return der.get()
  }

  <RMotion
    defaultStyle={pro.defaultStyle.get().toJS()}
    style={pro.style.get().toJS()}
  >
    {() => {
      der.get() // Register derivable dependencies
      return elemFunc
    }()}
  </RMotion>
}

view TransitionMotion {
  const pro = initPro(view, {
    defaultStyles: M.mapAtom({}),
    styles: M.mapAtom(),
    willEnter: atom(),
    willLeave: atom()
  })

  const stylesAtom = atom(pro.defaultStyles.get())

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
    defaultStyles={pro.defaultStyles.get().toJS()}
    styles={pro.styles.get().toJS()}
    willEnter={pro.willEnter.get()}
    willLeave={pro.willLeave.get()}
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
