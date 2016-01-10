view VideoChooser {
  const pro = initPro(view, {
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

  const videoKey = atom(pro.initialVideoKey.get())

  const workingVideoKey = atom(null)

  const editing = atom(false)

  const previewVideoKey = derivation(() => {
    return editing.get()? workingVideoKey.get() : videoKey.get()
  })

  videoKey.react(videoKey => {
    if (pro.editable.get() && !videoKey) {
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
    <TextBox class="inpVideoKey"
      placeholder="Wistia video hash-id"
      value={wistiaId.or('')}
      onChange={e => wistiaId.set(e.value.trim() || null)}
      onEnter={select}
      inpStyle={{
        width: pro.width.get()
      }}
    />
  </editSection>
  <noVideo if={!videoKey.get()}
    style={pro.noVideoStyle.get()}
  >
  </noVideo>
  <Video if={
    (!editing.get() && videoKey.get() && !pro.children.get()) ||
    (editing.get() && previewVideoKey.get())
  }
    videoKey={previewVideoKey.get()}
    width={pro.width.get()}
    height={pro.height.get()}
    circle={pro.circle.get()}
    videoStyle={pro.videoStyle.get()}
  />
  <customViewMode if={!editing.get() && videoKey.get() && pro.children.get()}>
    {pro.children.get()}
  </customViewMode>
  <actionRow if={pro.editable.get() && !editing.get()}>
    <EditLink onClick={() => editing.set(true)} />
    <DeleteButton if={videoKey.get()} onClick={() => {
      workingVideoKey.set(null)
      select()
    }} />
  </actionRow>

  $actionRow = {
    flexDirection: 'row',
    width: pro.width.get(),
    justifyContent: 'space-around'
  }
}
