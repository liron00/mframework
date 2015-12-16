view Link {
  const prop = initProp(view, {
    to: atom(),
    target: atom(),
    children: atom()
  })

  const go = (e) => {
    if (e.button == 0 && !e.metaKey) {
      const oldPreventDefault = e.preventDefault.bind(e)

      let defaultPrevented = false
      e.preventDefault = () => {
        defaultPrevented = true
      }

      if (view.props.onClick) view.props.onClick(e)

      e.preventDefault = oldPreventDefault

      if (defaultPrevented) {
        oldPreventDefault()
      } else {
        if (
          prop.target.get() != '_blank' &&
          // Flint.router.go can't handle redirecting to another site
          prop.to.get().indexOf('://') == -1
        ) {
          oldPreventDefault()
          Flint.router.go(prop.to.get())
        }
      }
    }
  }

  <link-a
    href={prop.to.get()}
    target={prop.target.get()}
    onClick={go}
  >
    {prop.children.get()}
  </link-a>

  $ = {
    textDecoration: 'none',
    display: 'flex',
    flexDirection: 'row'
  }
}
