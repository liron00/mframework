view MediaChooser {
  const context = initContext(view, {
    isAdmin: atom()
  })

  const pro = initPro(view, {
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

  const mediaKey = atom(pro.initialMediaKey.get())
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
    editable={pro.editable.get()}
    width={pro.width.get()}
    height={pro.height.get()}
    circle={pro.circle.get()}
    picStyle={pro.mediaStyle.get()}
    noPicStyle={pro.noMediaStyle.get()}
    zoomable={pro.zoomable.get()}
    onSelect={e => picKey.set(e.picKey)}
    onZoomIn={view.props.onZoomIn}
    onZoomOut={view.props.onZoomOut}
  >
    {pro.children.get()}
  </PicChooser>
  <VideoChooser if={!picKey.get()}
    initialVideoKey={videoKey.get()}
    editable={
      pro.editable.get()

      // Only admins can edit video media right now because the UI is crude
      && context.isAdmin.get()
    }
    circle={pro.circle.get()}
    width={pro.width.get()}
    height={pro.height.get()}
    videoStyle={pro.mediaStyle.get()}
    noVideoStyle={pro.noMediaStyle.get()}
    zoomable={pro.zoomable.get()}
    onSelect={e => videoKey.set(e.videoKey)}
    onZoomIn={view.props.onZoomIn}
    onZoomOut={view.props.onZoomOut}
  >
    {pro.children.get()}
  </VideoChooser>
}
