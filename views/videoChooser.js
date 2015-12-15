view VideoChooser {
  const prop = initProp(view, {
    initialVideoKey: M.defaultAtom(null),
    editable: M.defaultAtom(true),
    circle: M.defaultAtom(false),
    width: M.defaultAtom(300),
    height: M.defaultAtom(300),
    videoStyle: M.mapAtom({}),
    noVideoStyle: M.mapAtom({}),
    zoomable: M.defaultAtom(false),

    // If we get children, the children are the viewer when we have a videoKey.
    // Otherwise we'll provide our own viewer.
    children: atom()
  })

  const videoKey = atom(prop.initialVideoKey.get())

  const workingVideoKey = atom(null)

  const editing = atom(false)

  const previewVideoKey = derivation(() => {
    return editing.get()? workingVideoKey.get() : videoKey.get()
  })

  videoKey.react(videoKey => {
    if (prop.editable.get() && !videoKey) {
      editing.set(true)
    }
  })

  editing.react(editing => {
    if (editing) {
      workingVideoKey.set(videoKey.get())
    }
  })

  const select = () => {
    videoKey.set(workingVideoKey.get())

    if (view.props.onSelect) {
      view.props.onSelect({videoKey: videoKey.get()})
    }

    editing.set(false)
  }

  const wistiaId = workingVideoKey.lens({
    get: videoKey => videoKey? videoKey.split('/')[2] : null,
    set: (videoKey, wistiaId) => {
      return wistiaId? 'videos/wistia/' + wistiaId : null
    }
  })

  <editSection if={editing.get()}>
    <input class="inpVideoKey"
      placeholder="Wistia video hash-id"
      value={wistiaId.get() || ''}
      onChange={e => wistiaId.set(e.target.value || null)}
      onEnter={select}
    />
  </editSection>
  <noVideo if={!videoKey.get()}
    style={prop.noVideoStyle.get()}
  >
  </noVideo>
  <Video if={
    (!editing.get() && videoKey.get() && !prop.children.get()) ||
    (editing.get() && previewVideoKey.get())
  }
    videoKey={previewVideoKey.get()}
    width={prop.width.get()}
    height={prop.height.get()}
    circle={prop.circle.get()}
    videoStyle={prop.videoStyle.get()}
  />
  <customViewMode if={!editing.get() && videoKey.get() && prop.children.get()}>
    {prop.children.get()}
  </customViewMode>
  <actionRow if={prop.editable.get() && !editing.get()}>
    <EditLink onClick={() => editing.set(true)} />
    <DeleteButton if={videoKey.get()} onClick={() => {
      workingVideoKey.set(null)
      select()
    }} />
  </actionRow>

  $inpVideoKey = {
    width: prop.width.get()
  }

  $actionRow = {
    flexDirection: 'row',
    width: prop.width.get(),
    justifyContent: 'space-around'
  }
}
