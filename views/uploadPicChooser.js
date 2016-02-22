view UploadPicChooser {
  const pro = initPro(view, {
    capture: atom(),
    initialPicKey: M.defaultAtom(null),
    initialPicKeys: M.defaultAtom(null),
    editable: M.defaultAtom(true),
    width: M.defaultAtom(300),
    height: M.defaultAtom(168),
    circle: M.defaultAtom(false),
    children: atom(),
    multiple: M.defaultAtom(false),
    picStyle: M.mapAtom({}),
    noPicStyle: M.mapAtom({}),
    zoomable: M.defaultAtom(false)
  })

  const picKeys = M.listAtom(pro.initialPicKeys.get() || (
    pro.initialPicKey.get()? [pro.initialPicKey.get()] : null
  ))
  const picKey = derivation(() => picKeys.get() && picKeys.get().get(0))
  const uploading = atom(false)

  picKeys.react(picKeys => {
    if (pro.multiple.get()) {
      if (view.props.onSelect) {
        view.props.onSelect({picKeys})
      }
      M.mixpanel.track("UploadPicChooserSelect", {picKeys})
    }
  }, {skipFirst: true})

  picKey.react(picKey => {
    if (!pro.multiple.get()) {
      if (view.props.onSelect) {
        view.props.onSelect({picKey})
      }
      M.mixpanel.track("UploadPicChooserSelect", {picKey})
    }
  }, {skipFirst: true})

  const noPicStyle = derivation(() => {
    return IMap({
      width: pro.width.get(),
      height: pro.height.get(),
      alignItems: 'center',
      justifyContent: 'center',
      background: 'white',
      border: '1px dashed #ccc',
      borderRadius: pro.circle.get()? '50%' : 8
    }).merge(pro.noPicStyle.get())
  })

  <picSection>
    <Pic if={picKey.get() && !uploading.get()}
      picKey={picKey.get()}
      faces={true}
      zoomable={pro.zoomable.get()}
      onZoomIn={view.props.onZoomIn}
      onZoomOut={view.props.onZoomOut}
      style={
        IMap({
          width: pro.width.get(),
          height: pro.height.get(),
          borderRadius: pro.circle.get()? '50%' : null
        }).merge(
          pro.picStyle.get()
        ).toJS()
      }
    />
    <S3Uploader if={pro.editable.get() && !picKey.get() && !uploading.get()}
      accept="image/*"
      capture={pro.capture.get()}
      multiple={pro.multiple.get()}
      onStartUpload={() => uploading.set(true)}
      onUploaded={e => {
        uploading.set(false)
        picKeys.set(e.s3Keys || [e.s3Key])
      }}
    >
      <noPic style={noPicStyle.get().toJS()}>
        {pro.children.get()}
      </noPic>
    </S3Uploader>
    <noPic if={!pro.editable.get() && !picKey.get() && !uploading.get()}
      style={noPicStyle.get().toJS()}
    />
    <noPic if={uploading.get()} style={noPicStyle.get().toJS()}>
      <Loader />
    </noPic>
  </picSection>
  <actionRow if={picKey.get() && pro.editable.get()}>
    <S3Uploader
      accept="image/*"
      capture={pro.capture.get()}
      multiple={pro.multiple.get()}
      onStartUpload={() => uploading.set(true)}
      onUploaded={e => {
        uploading.set(false)
        picKeys.set(e.s3Keys || [e.s3Key])
      }}
    >
      <EditLink />
    </S3Uploader>
    <DeleteButton onClick={() => picKey.set(null)} />
  </actionRow>

  $actionRow = {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around'
  }

  $uploader = {
    flexGrow: 1
  }
}
