view Pic {
  const pro = initPro(view, {
    picKey: atom(),
    style: M.mergeAtom({}),

    enhance: M.defaultAtom(true),
    faces: M.defaultAtom(false),
    fit: M.defaultAtom('crop'),
    entropy: M.defaultAtom(false),

    zoomable: M.defaultAtom(false)
  })

  const zoomedIn = atom(false)

  const width = derivation(() => {
    return pro.style.get().get('width') || pro.style.get().get('maxWidth')
  })
  const height = derivation(() => {
    return pro.style.get().get('height') || pro.style.get().get('maxHeight')
  })

  const imgixUrl = derivation(() => {
    const params = {
      auto: pro.enhance.get()? 'enhance': null,
      crop: pro.faces.get()? 'faces' : (
        pro.entropy.get()? 'entropy': null
      ),
      fit: pro.fit.get(),
      w: width.get(),
      h: height.get()
    }
    const paramString = M.util.objToParamString(params)
    return `${M.config.imgixPrefix}${pro.picKey.get()}?${paramString}`
  })

  <pic
    style={
      IMap({
        alignItems: 'center',
        justifyContent: 'center',
        cursor: pro.zoomable.get()? 'zoom-in': null
      }).merge(
        pro.style.get()
      ).toJS()
    }
    onClick={e => {
      if (pro.zoomable.get()) {
        zoomedIn.set(true)
        if (zoomedIn.get() && view.props.onZoomIn) {
          view.props.onZoomIn({})
        } else if (!zoomedIn.get() && view.props.onZoomOut) {
          view.props.onZoomOut({})
        }
      }
      view.props.onClick && view.props.onClick(e)
    }}
  >
    <img
      src={imgixUrl.get()}
      style={
        pro.style.get().merge({
          width: null,
          height: null,
          maxWidth: width.get(),
          maxHeight: height.get()
        }).toJS()
      }
    />
    <Lightbox if={zoomedIn.get()}
      onClose={() => zoomedIn.set(false)}
      picKeys={[pro.picKey.get()]}
    />
  </pic>
}
