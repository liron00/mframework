view FacebookPhotos {
  const fbPhotos = M.listAtom()
  const selectedPhoto = M.mapAtom(null)

  selectedPhoto.reactor(photo => {
    if (view.props.onSelect) {
      view.props.onSelect({photo: photo.toJS()})
    }
  }).start()

  on.mount(() => {
    FB.api(
      '/me/photos',
      'GET',
      {
        fields: 'images',
        limit: 200
      },
      response => {
        fbPhotos.set(response.data)
      }
    )
  })

  <loading if={fbPhotos.get() === undefined}>
    Loading Facebook photos...
    <Loader />
  </loading>
  <photosSection if={fbPhotos.get()}>
    <photoSection
      repeat={fbPhotos.get()}
      onClick={() => selectedPhoto.set(_)}
    >
      <FacebookPhotoImage
        photo={_}
        width={200}
        height={200}
      />
    </photoSection>
  </photosSection>

  $loading = {
    fontSize: 12,
    color: '#999'
  }

  $Loader = {
    marginTop: 20
  }

  $photosSection = {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around'
  }

  $photoSection = {
    margin: 10,
    cursor: 'pointer'
  }

  $FacebookPhotoImage = {
    border: '1px solid #ddd'
  }
}
