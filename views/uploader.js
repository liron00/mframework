view Uploader {
  const context = initContext(view, {
    isMobile: atom()
  })

  const pro = initPro(view, {
    accept: atom(),
    children: atom()
  })

  <label>
    <childrenSec>
      {pro.children.get() || "Choose file..."}
    </childrenSec>
    <input
      type="file"
      capture="camera"
      accept={pro.accept.get()}
      onChange={view.props.onChange}
    />
  </label>

  $label = {
    position: 'relative',
    cursor: 'pointer'
  }

  $input = {
    position: 'absolute',
    zIndex: -1,
    width: '100%',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 0,
    opacity: 0
  }

  $childrenSec = {
    pointerEvents: 'none'
  }
}
