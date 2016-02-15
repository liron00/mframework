import ReactModal from 'react-modal'

view MModal {
  const pro = initPro(view, {
    contentStyle: M.mapAtom({}),
    overlayStyle: M.mapAtom({}),
    isOpen: M.defaultAtom(true),
    children: atom()
  })

  pro.isOpen.react(() => {
    document.body.style.overflow = pro.isOpen.get()? 'hidden' : null
  })

  on.unmount(() => {
    document.body.style.overflow = null
  })

  <ReactModal
    appElement={document.getElementById('_motionapp')}
    isOpen={pro.isOpen.get()}
    onRequestClose={view.props.onRequestClose}
    style={{
      content: IMap({
        top: null,
        bottom: null,
        left: null,
        right: null,
        position: null,
        display: 'flex',
        overflow: 'auto'
      }).merge(pro.contentStyle.get()).toJS(),
      overlay: IMap({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: null,
        zIndex: 100
      }).merge(pro.overlayStyle.get()).toJS()
    }}
  >
    <hack id="_motionapp">
      {pro.children.get()}
    </hack>
  </ReactModal>

  // The <hack> tag addresses two problems:
  // 1. Motion's styles only work inside a tag with id="_motionapp"
  // 2. ReactModal.setAppElement appears to be totally broken.
  // Therefore we'll just wrap the modal's elements in a second
  // component with id="_motionapp".
}
