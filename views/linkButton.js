view LinkButton {
  const prop = initProp(view, {
    children: atom(),
    style: M.defaultAtom({})
  })

  <linkButton
    style={IMap({
      cursor: 'pointer',
      color: 'black'
    }).merge(prop.style.get()).toJS()}
    onClick={view.props.onClick}
  >
    {prop.children.get()}
  </linkButton>
}
