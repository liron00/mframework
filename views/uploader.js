view Uploader {
  const pro = initPro(view, {
    accept: atom(),
    children: atom()
  })
  
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