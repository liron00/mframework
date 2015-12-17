import ReactModal from 'react-modal'

view MModal {
  const prop = initProp(view, {
    contentStyle: M.mapAtom({}),
    overlayStyle: M.mapAtom({}),
    isOpen: M.defaultAtom(true),
    children: atom()
  })

  <ReactModal if={false}
    appElement={document.getElementById('_flintapp')}
    isOpen={prop.isOpen.get()}
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
      }).merge(prop.contentStyle.get()).toJS(),
      overlay: IMap({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: null,
        zIndex: 100
      }).merge(prop.overlayStyle.get()).toJS()
    }}
  >
    <hack id="_flintapp">
      {prop.children.get()}
    </hack>
  </ReactModal>

  // The <hack> tag addresses two problems:
  // 1. Flint's styles only work inside a tag with id="_flintapp"
  // 2. ReactModal.setAppElement appears to be totally broken.
  // Therefore we'll just wrap the modal's elements in a second
  // component with id="_flintapp".
}
