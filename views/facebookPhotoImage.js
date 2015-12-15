view FacebookPhotoImage {
  const prop = initProp(view, {
    photo: M.mapAtom(),
    width: M.defaultAtom(400),
    height: M.defaultAtom(300),
    style: M.mapAtom({})
  })

  const bestImage = prop.photo.derive(photo => {
    photo = photo.toJS()

    let best = null
    photo.images.forEach(image => {
      if (
        !best || (
          image.width <= prop.width.get() && best.width < image.width
        ) || (
          prop.width.get() <= image.width && image.width < best.width
        )
      ) {
        best = image
      }
    })
    return immutable.fromJS(best)
  })

  <image src={bestImage.get().get('source')}
    style={prop.style.get().toJS()}
  />

  $image = {
    width: prop.width.get(),
    height: prop.height.get(),
    backgroundImage: `url(${bestImage.get().get('source')})`,
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    backgroundPosition: '50% 50%'
  }
}
