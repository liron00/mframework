view FacebookPhotoImage {
  const pro = initPro(view, {
    photo: M.mapAtom(),
    width: M.defaultAtom(400),
    height: M.defaultAtom(300),
    style: M.mergeAtom({})
  })

  const bestImage = pro.photo.derive(photo => {
    photo = photo.toJS()

    let best = null
    photo.images.forEach(image => {
      if (
        !best || (
          image.width <= pro.width.get() && best.width < image.width
        ) || (
          pro.width.get() <= image.width && image.width < best.width
        )
      ) {
        best = image
      }
    })
    return immutable.fromJS(best)
  })

  <image src={bestImage.get().get('source')}
    style={pro.style.get().toJS()}
  />

  $image = {
    width: pro.width.get(),
    height: pro.height.get(),
    backgroundImage: `url(${bestImage.get().get('source')})`,
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    backgroundPosition: '50% 50%'
  }
}
