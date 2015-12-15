view Uploader {
  const prop = initProp(view, {
    accept: atom(),
    children: atom()
  })
  
  <label>
    <input
      type="file"
      accept={prop.accept.get()}
      onChange={view.props.onChange}
    />
    <friendly>
      {prop.children.get() || "Choose file..."}
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