view PicChooser {
  const prop = initProp(view, {
    initialPicKey: M.defaultAtom(null),
    editable: M.defaultAtom(true),
    circle: M.defaultAtom(false),
    width: M.defaultAtom(300),
    height: M.defaultAtom(300),
    allowUpload: M.defaultAtom(true),
    allowFacebook: M.defaultAtom(false),
    picStyle: M.mapAtom({}),
    noPicStyle: M.mapAtom({}),
    zoomable: M.defaultAtom(false)
  })

  const noPicStyle = derivation(() => {
    return IMap({
      width: prop.width.get(),
      height: prop.height.get(),
      alignItems: 'center',
      justifyContent: 'center',
      background: 'white',
      border: '1px dashed #ccc',
      borderRadius: prop.circle.get()? '50%' : 8
    }).merge(prop.noPicStyle.get())
  })

  const picKey = atom(prop.initialPicKey.get())
  const pendingFbPhoto = atom(null)

  picKey.reactor(picKey => {
    if (view.props.onSelect) {
      view.props.onSelect({picKey})
    }
  }).start()

  const selectFbPhoto = (photo) => {
    pendingFbPhoto.set(photo)

    let biggestImage = null
    photo.images.forEach(image => {
      if (!biggestImage || image.width > biggestImage.width) {
        biggestImage = image
      }
    })

    M.apiPost('transloadPic', {
      params: {
        url: biggestImage.source
      }
    }).then(apiResponse => {
      pendingFbPhoto.set(null)
      picKey.set(apiResponse.picKey)

    }, err => {
      pendingFbPhoto.set(null)
      M.util.alertError(err)
    })
  }

  <uploadSection if={prop.allowUpload.get()}>
    <UploadPicChooser
      initialPicKey={prop.initialPicKey.get()}
      editable={prop.editable.get()}
      width={prop.width.get()}
      height={prop.height.get()}
      zoomable={prop.zoomable.get()}
      circle={prop.circle.get()}
      picStyle={prop.picStyle.get()}
      noPicStyle={prop.noPicStyle.get()}
      onSelect={e => picKey.set(e.picKey)}
    >
      <fromUpload>
        <img class="computerIcon" src="/images/computerIconGray.png" />
        pic from your computer
      </fromUpload>
    </UploadPicChooser>
  </uploadSection>
  <orSection if={prop.allowUpload.get() && prop.allowFacebook.get()}>
    or
  </orSection>
  <facebookSection if={prop.allowFacebook.get()}>
    <FacebookPhotoChooser
      if={!pendingFbPhoto.get()}
      editable={prop.editable.get()}
      width={prop.width.get()}
      height={prop.height.get()}
      circle={prop.circle.get()}
      picStyle={prop.picStyle.get()}
      noPicStyle={prop.noPicStyle.get()}
      onSelect={({photo}) => selectFbPhoto(photo)}
    >
      <fromFacebook>
        <img class="fbIcon" src="/images/facebookIconGray.png" />
        pic from Facebook
      </fromFacebook>
    </FacebookPhotoChooser>
    <fbLoading if={pendingFbPhoto.get()}
      style={noPicStyle.get().toJS()}
    >
      <Loader />
    </fbLoading>
  </facebookSection>

  $ = {
    flexDirection: 'row'
  }

  $fbLoading = {
    width: prop.width.get(),
    height: prop.height.get(),
    border: '1px dashed #ccc',
    alignItems: 'center',
    justifyContent: 'center'
  }

  $Loader = {
    marginTop: 20
  }

  $fromUpload = {
    alignItems: 'center',
    position: 'relative',
    top: -6,
    color: '#999',
    fontSize: 12
  }

  $orSection = {
    marginLeft: 20,
    marginRight: 20,
    alignSelf: 'center',
    color: '#999'
  }

  $fromFacebook = {
    alignItems: 'center',
    position: 'relative',
    top: 4,
    color: '#999',
    fontSize: 12
  }

  $computerIcon = {
    width: 80,
    opacity: 0.7
  }

  $fbIcon = {
    width: 40,
    opacity: 0.8,
    marginBottom: 16
  }
}
