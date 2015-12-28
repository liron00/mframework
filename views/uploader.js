view Uploader {
  const context = initContext(view, {
    isMobile: atom()
  })

  const pro = initPro(view, {
    accept: atom(),
    children: atom()
  })

  <desktopMode if={!context.isMobile.get()}>
    <label>
      <input
        type="file"
        accept={pro.accept.get()}
        onChange={view.props.onChange}
      />
      <friendly>
        {pro.children.get() || "Choose file..."}
      </friendly>
    </label>
  </desktopMode>

  $input = {
    width: 0.1,
    height: 0.1,
    opacity: 0,
    overflow: 'hidden',
    position: 'absolute',
    zIndex: -1
  }

  $friendly = {
    cursor: 'pointer'
  }
}
