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
          M.mixpanel.track("LinkClick", {
            to: pro.to.get(),
            linkId: pro.track.get() === true? null : pro.track.get()
          })
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

  const hovering = atom(false)
  hovering.react(hovering => {
    if (view.props.onHover) {
      view.props.onHover({hovering})
    }
  }, {skipFirst: true})

  <link-a
    href={pro.to.get()}
    target={pro.target.get()}
    onClick={go}
    onMouseEnter={() => hovering.set(true)}
    onMouseLeave={() => hovering.set(false)}
  >
    {pro.children.get()}
  </link-a>

  $ = {
    textDecoration: 'none',
    display: 'inline-flex'
  }
}
