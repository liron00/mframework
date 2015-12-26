view UploadPicChooser {
  const pro = initPro(view, {
    initialPicKey: M.defaultAtom(null),
    editable: M.defaultAtom(true),
    width: M.defaultAtom(300),
    height: M.defaultAtom(168),
    circle: M.defaultAtom(false),
    children: atom(),
    picStyle: M.mapAtom({}),
    noPicStyle: M.mapAtom({}),
    zoomable: M.defaultAtom(false)
  })

  const picKey = atom(pro.initialPicKey.get())
  const uploading = atom(false)

  picKey.reactor(picKey => {
    if (view.props.onSelect) {
      view.props.onSelect({picKey})
    }
  }).start()

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
      onStartUpload={() => uploading.set(true)}
      onUploaded={({s3Key}) => {uploading.set(false); picKey.set(s3Key)}}
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
      onStartUpload={() => uploading.set(true)}
      onUploaded={({s3Key}) => {uploading.set(false); picKey.set(s3Key)}}
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
