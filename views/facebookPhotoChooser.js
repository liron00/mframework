view FacebookPhotoChooser {
  const prop = initProp(view, {
    width: M.defaultAtom(300),
    height: M.defaultAtom(168),
    circle: M.defaultAtom(false),
    children: atom(),
    style: M.mapAtom({}),
    noPicStyle: M.mapAtom({})
  })

  const showingFbPhotos = atom(false)
  const selectedPhoto = M.mapAtom(null)

  selectedPhoto.reactor(selectedPhoto => {
    if (view.props.onSelect) {
      view.props.onSelect({photo: selectedPhoto.toJS()})
    }
  }).start()

  const showFbPhotos = () => {
    FB.login(response => {
      if (response.authResponse) {
        showingFbPhotos.set(true)
      } else {
        console.log("Denied Facebook photos permission.")
      }
    }, {
      scope: 'user_photos'
    })
  }

  <selectedPhoto if={selectedPhoto.get()}>
    <FacebookPhotoImage photo={selectedPhoto.get()}
      width={prop.width.get()}
      height={prop.height.get()}
      style={prop.style.get()}
    />
    <actionRow>
      <EditLink onClick={showFbPhotos} />
      <DeleteButton onClick={() => selectedPhoto.set(null)} />
    </actionRow>
  </selectedPhoto>
  <noPhoto if={!selectedPhoto.get()}
    style={IMap({
      borderRadius: prop.circle.get()? '50%' : 8
    }).merge(prop.noPicStyle.get()).toJS()}
    onClick={showFbPhotos}
  >
    {prop.children.get()}
  </noPhoto>
  <MModal if={showingFbPhotos.get()}
    onRequestClose={() => showingFbPhotos.set(false)}
    contentStyle={{
      margin: 100,
      flexGrow: 1
    }}
    overlayStyle={{
      alignItems: 'stretch',
      justifyContent: 'stretch'
    }}
  >
    <topRow>
      <tip>
        Choose a Facebook photo.
      </tip>
      <CancelLink class="cancelModal"
        onClick={() => showingFbPhotos.set(false)}
      />
    </topRow>
    <FacebookPhotos onSelect={({photo}) => {
      selectedPhoto.set(photo)
      showingFbPhotos.set(false)
    }} />
  </MModal>

  $noPhoto = {
    cursor: 'pointer',
    width: prop.width.get(),
    height: prop.height.get(),
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
