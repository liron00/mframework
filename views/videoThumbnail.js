view VideoThumbnail {
  const pro = initPro(view, {
    videoKey: M.requiredAtom(),
    width: M.defaultAtom(50),
    height: M.defaultAtom(50),
    circle: M.defaultAtom(false)
  })

  const wistiaId = derivation(() => {
    return pro.videoKey.get().split('/')[2]
  })

  const oEmbedUrl = derivation(() => {
    return `//fast.wistia.net/oembed?url=http://home.wistia.com/medias/${wistiaId.get()}`
  })

  const thumbnailUrl = atom()

  fetch(oEmbedUrl.get()).then(response => response.json()).then(videoJson => {
    if (videoJson.thumbnail_url) {
      thumbnailUrl.set(
        videoJson.thumbnail_url.replace(
          /\bimage_crop_resized=(\d+)x(\d+)\b/,
          `image_crop_resized=${Math.ceil(pro.width.get())}x${Math.ceil(pro.height.get())}`
        )
      )
    } else {
      thumbnailUrl.set(null)
    }
  }).catch(err => {
    console.error("Video thumbnail fetch error:", err)
    thumbnailUrl.set(null)
  })

  <Loader if={thumbnailUrl.get() === undefined} />
  <img if={thumbnailUrl.get()} src={thumbnailUrl.get()} />

  $ = {
    width: pro.width.get(),
    height: pro.height.get(),
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  }

  $Loader = {
    opacity: 0.1
  }

  $img = {
    width: pro.width.get(),
    height: pro.height.get(),
    borderRadius: pro.circle.get()? '50%' : 8
  }
}
