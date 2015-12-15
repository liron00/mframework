view AreYouSure {
  const prop = initProp(view, {
    children: atom(),
    prompt: atom()
  })

  const confirming = atom(false)

  <normal if={!confirming.get()} onClick={() => confirming.set(true)}>
    {prop.children.get()}
  </normal>
  <confirming if={confirming.get()}>
    <prompt>
      {prop.prompt.get() || "Are you sure?"}
    </prompt>
    <LinkButton class="yes" onClick={(e) => {
      if (view.props.onClick) {
        view.props.onClick(e)
      }
      confirming.set(false)
    }}>
      Yes
    </LinkButton>
    <separator>|</separator>
    <LinkButton class="no" onClick={(e) => confirming.set(false)}>
      No
    </LinkButton>
  </confirming>

  $ = {}

  $confirming = {
    flexDirection: 'row',
    color: '#999',
    fontSize: 12
  }

  $prompt = {
    marginRight: 4,
    fontFamily: 'proximanova'
  }

  $separator = {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
    marginRight: 4
  }
}
