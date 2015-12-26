view FacebookPhotoChooser {
  const pro = initPro(view, {
    width: M.defaultAtom(300),
    height: M.defaultAtom(168),
    circle: M.defaultAtom(false),
    children: atom(),
    style: M.mapAtom({}),
    noPicStyle: M.mapAtom({})
  })

  const showingFbPhotos = atom(false)
  const selectedPhoto = M.mapAtom(null)

  selectedPhoto.react(selectedPhoto => {
    if (view.props.onSelect) {
      view.props.onSelect({photo: selectedPhoto.toJS()})
    }
  }, {skipFirst: true})

  const showFbPhotos = () => {
    FB.login(response => {
      if (response.authResponse) {
        showingFbPhotos.set(true)
        M.mixpanel.track("FacebookPhotoChooserView")
      } else {
        console.log("Denied Facebook photos permission.")
        M.mixpanel.track("FacebookPhotoChooserPermissionDenied")
      }
    }, {
      scope: 'user_photos'
    })
  }

  <selectedPhoto if={selectedPhoto.get()}>
    <FacebookPhotoImage photo={selectedPhoto.get()}
      width={pro.width.get()}
      height={pro.height.get()}
      style={pro.style.get()}
    />
    <actionRow>
      <EditLink onClick={showFbPhotos} />
      <DeleteButton onClick={() => selectedPhoto.set(null)} />
    </actionRow>
  </selectedPhoto>
  <noPhoto if={!selectedPhoto.get()}
    style={IMap({
      borderRadius: pro.circle.get()? '50%' : 8
    }).merge(pro.noPicStyle.get()).toJS()}
    onClick={showFbPhotos}
  >
    {pro.children.get()}
  </noPhoto>
  <MModal if={showingFbPhotos.get()}
    onRequestClose={() => {
      showingFbPhotos.set(false)
      M.mixpanel.track("FacebookPhotoChooserCancel")
    }}
    contentStyle={{
      margin: 50,
      flexGrow: 1,
      border: '1px solid #ccc',
      orderRadius: 8
    }}
    overlayStyle={{
      alignItems: 'stretch',
      justifyContent: 'stretch',
      background: 'white'
    }}
  >
    <topRow>
      <tip>
        Choose a Facebook photo.
      </tip>
      <CancelLink class="cancelModal"
        onClick={() => {
          showingFbPhotos.set(false)
          M.mixpanel.track("FacebookPhotoChooserCancel")
        }}
      />
    </topRow>
    <FacebookPhotos onSelect={({photo}) => {
      selectedPhoto.set(photo)
      showingFbPhotos.set(false)
      M.mixpanel.track("FacebookPhotoChooserSelect")
    }} />
  </MModal>

  $noPhoto = {
    cursor: 'pointer',
    width: pro.width.get(),
    height: pro.height.get(),
    alignItems: 'center',
    justifyContent: 'center',
    background: 'white',
    border: '1px dashed #ccc'
  }

  $actionRow = {
    flexDirection: 'row'
  }

  $topRow = {
    flexDirection: 'row',
    alignSelf: 'stretch',
    alignItems: 'stretch',
    alignContent: 'stretch',
    paddingBottom: 20,
    borderBottom: '1px solid #eee',
    marginBottom: 20
  }

  $tip = {
    flexGrow: 1
  }

  $cancelModal = {
    alignSelf: 'flex-end'
  }
}
