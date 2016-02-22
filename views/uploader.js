view Uploader {
  const context = initContext(view, {
    isMobile: atom()
  })

  const pro = initPro(view, {
    accept: atom(),
    capture: M.defaultAtom('camera'),
    children: atom(),
    multiple: M.defaultAtom(false)
  })

  const dragging = atom(false)

  <label
    onDragEnter={() => dragging.set(true)}
    onDragLeave={() => dragging.set(false)}
  >
    <childrenSec>
      {pro.children.get() || "Choose file..."}
    </childrenSec>
    <input
      type="file"
      capture={pro.capture.get()}
      accept={pro.accept.get()}
      multiple={pro.multiple.get()}
      onChange={view.props.onChange}
    />
  </label>

  $label = {
    position: 'relative',
    overflow: 'hidden'
  }

  $input = {
    position: 'absolute',
    cursor: 'pointer',
    borderRadius: 0,

    // Get the button+text UI out of the visible container area because
    // e.g. the button doesn't have the cursor:'pointer' style we want.
    width: 2000,
    left: -500,
    right: 0,
    top: 0,
    bottom: 0,

    background: 'yellow',
    opacity: dragging.get()? 0.3 : 0
  }
}
