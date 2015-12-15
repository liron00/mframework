view Link {
  const prop = initProp(view, {
    to: atom(),
    children: atom()
  })

  const go = (e) => {
    if (e.button == 0 && !e.metaKey) {
      const oldPreventDefault = e.preventDefault.bind(e)
      oldPreventDefault()

      let defaultPrevented = false
      e.preventDefault = () => {
        defaultPrevented = true
      }

      if (view.props.onClick) view.props.onClick(e)

      e.preventDefault = oldPreventDefault

      if (!defaultPrevented) {
        Flint.router.go(prop.to.get())
      }
    }
  }

  <link-a href={prop.to.get()} onClick={go}>{prop.children.get()}</link-a>

  $ = {
    textDecoration: 'none',
    display: 'flex',
    flexDirection: 'row'
  }
}
