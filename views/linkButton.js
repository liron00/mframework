view LinkButton {
  const pro = initPro(view, {
    children: atom(),
    style: M.defaultAtom({})
  })

  <linkButton
    style={IMap({
      cursor: 'pointer',
      color: 'black'
    }).merge(pro.style.get()).toJS()}
    onClick={view.props.onClick}
  >
    {pro.children.get()}
  </linkButton>
}
