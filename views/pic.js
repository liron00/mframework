view Pic {
  const prop = initProp(view, {
    picKey: atom(),
    style: M.mapAtom({}),

    enhance: M.defaultAtom(true),
    faces: M.defaultAtom(false),
    fit: M.defaultAtom('crop'),
    entropy: M.defaultAtom(false),

    zoomable: M.defaultAtom(false)
  })

  const zoomedIn = atom(false)

  const imgixUrl = derivation(() => {
    const params = {
      auto: prop.enhance.get()? 'enhance': null,
      crop: prop.faces.get()? 'faces' : (
        prop.entropy.get()? 'entropy': null
      ),
      fit: prop.fit.get(),
      w: prop.style.get().get('width') || prop.style.get().get('maxWidth'),
      h: prop.style.get().get('height') || prop.style.get().get('maxHeight')
    }
    const paramString = M.util.objToParamString(params)
    return `${M.config.imgixPrefix}${prop.picKey.get()}?${paramString}`
  })

  <pic
    style={
      IMap({
        alignItems: 'center',
        justifyContent: 'center',
        cursor: prop.zoomable.get()? 'zoom-in': null
      }).merge(
        prop.style.get()
      ).toJS()
    }
    onClick={e => {
      if (view.props.zoomable) {
        zoomedIn.set(true)
      }
      view.props.onClick && view.props.onClick(e)
    }}
  >
    <img
      src={imgixUrl.get()}
      style={
        prop.style.get().merge({
          width: null,
          height: null
        }).toJS()
      }
    />
    <Lightbox if={zoomedIn.get()}
      onClose={() => zoomedIn.set(false)}
      picKeys={[prop.picKey.get()]}
    />
  </pic>
}
