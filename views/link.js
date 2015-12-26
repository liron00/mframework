view Link {
  const pro = initPro(view, {
    to: atom(),
    target: atom(),
    children: atom(),
    track: M.defaultAtom(true)
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
        if (pro.track.get()) {
          M.mixpanel.track("LinkClick", {to: pro.to.get()})
        }

        if (
          pro.target.get() != '_blank' &&
          // Flint.router.go can't handle redirecting to another site
          pro.to.get().indexOf('://') == -1
        ) {
          oldPreventDefault()
          Flint.router.go(pro.to.get())
        }
      }
    }
  }

  <link-a
    href={pro.to.get()}
    target={pro.target.get()}
    onClick={go}
  >
    {pro.children.get()}
  </link-a>

  $ = {
    textDecoration: 'none',
    display: 'inline-flex'
  }
}
