view PicChooser {
  const pro = initPro(view, {
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
      width: pro.width.get(),
      height: pro.height.get(),
      alignItems: 'center',
      justifyContent: 'center',
      background: 'white',
      border: '1px dashed #ccc',
      borderRadius: pro.circle.get()? '50%' : 8
    }).merge(pro.noPicStyle.get())
  })

  const picKey = atom(pro.initialPicKey.get())
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

  <uploadSection if={pro.allowUpload.get()}>
    <UploadPicChooser
      initialPicKey={pro.initialPicKey.get()}
      editable={pro.editable.get()}
      width={pro.width.get()}
      height={pro.height.get()}
      zoomable={pro.zoomable.get()}
      circle={pro.circle.get()}
      picStyle={pro.picStyle.get()}
      noPicStyle={pro.noPicStyle.get()}
      onSelect={e => picKey.set(e.picKey)}
    >
      <fromUpload>
        <img class="computerIcon" src="/images/computerIconGray.png" />
        pic from your computer
      </fromUpload>
    </UploadPicChooser>
  </uploadSection>
  <orSection if={pro.allowUpload.get() && pro.allowFacebook.get()}>
    or
  </orSection>
  <facebookSection if={pro.allowFacebook.get()}>
    <FacebookPhotoChooser
      if={!pendingFbPhoto.get()}
      editable={pro.editable.get()}
      width={pro.width.get()}
      height={pro.height.get()}
      circle={pro.circle.get()}
      picStyle={pro.picStyle.get()}
      noPicStyle={pro.noPicStyle.get()}
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
    width: pro.width.get(),
    height: pro.height.get(),
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
