view MediaChooser {
  const context = initContext(view, {
    isAdmin: atom()
  })

  const prop = initProp(view, {
    initialMediaKey: M.defaultAtom(null),
    editable: M.defaultAtom(false),
    width: M.defaultAtom(300),
    height: M.defaultAtom(300),
    allowUpload: M.defaultAtom(true),
    allowFacebook: M.defaultAtom(false),
    circle: M.defaultAtom(false),
    mediaStyle: M.mapAtom({}),
    noMediaStyle: M.mapAtom({}),
    zoomable: M.defaultAtom(false),

    children: atom()
  })

  const mediaKey = atom(prop.initialMediaKey.get())
  mediaKey.reactor(mediaKey => {
    if (view.props.onSelect) {
      view.props.onSelect({mediaKey})
    }
  }).start()

  const picKey = mediaKey.lens({
    get: mediaKey => mediaKey && mediaKey.startsWith('pics/')? mediaKey : null,
    set: (mediaKey, picKey) => picKey
  })
  const videoKey = mediaKey.lens({
    get: mediaKey => mediaKey && mediaKey.startsWith('videos/')? mediaKey : null,
    set: (mediaKey, videoKey) => videoKey
  })

  <PicChooser if={!videoKey.get()}
    initialPicKey={picKey.get()}
    editable={prop.editable.get()}
    width={prop.width.get()}
    height={prop.height.get()}
    circle={prop.circle.get()}
    picStyle={prop.mediaStyle.get()}
    noPicStyle={prop.noMediaStyle.get()}
    zoomable={prop.zoomable.get()}
    onSelect={e => picKey.set(e.picKey)}
  >
    {prop.children.get()}
  </PicChooser>
  <VideoChooser if={!picKey.get()}
    initialVideoKey={videoKey.get()}
    editable={
      prop.editable.get()

      // Only admins can edit video media right now because the UI is crude
      && context.isAdmin.get()
    }
    circle={prop.circle.get()}
    width={prop.width.get()}
    height={prop.height.get()}
    videoStyle={prop.mediaStyle.get()}
    noVideoStyle={prop.noMediaStyle.get()}
    zoomable={prop.zoomable.get()}
    onSelect={e => videoKey.set(e.videoKey)}
  >
    {prop.children.get()}
  </VideoChooser>
}
