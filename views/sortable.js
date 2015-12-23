/*
  Wrapper for Sortable
  https://github.com/RubaXa/Sortable
*/

view Sortable {
  const pro = initPro(view, {
    children: atom(),
    animation: M.defaultAtom(150),
    enabled: M.defaultAtom(true),
    ghostClass: M.defaultAtom('ghost'),
    handle: atom(),
    filter: M.defaultAtom('.noDrag'),
    group: atom()
  })

  const children = pro.children.derive(propChildren => {
    if (propChildren instanceof Array) {
      return propChildren
    } else {
      return [propChildren]
    }
  })

  const wrapper = atom()
  const sortable = atom()

  const initSortable = () => {
    if (sortable.get()) {
      sortable.get().destroy()
    }
    sortable.set(window.Sortable.create(wrapper.get(), {
      animation: pro.animation.get(),
      ghostClass: pro.ghostClass.get(),
      handle: pro.handle.get(),
      filter: pro.filter.get(),
      group: pro.group.get(),

      onStart: view.props.onStart,
      onEnd: view.props.onEnd,
      onAdd: view.props.onAdd,
      onUpdate: view.props.onUpdate,
      onSort: view.props.onSort,
      onRemove: view.props.onRemove,
      onFilter: view.props.onFilter,
      onMove: view.props.onMove
    }))
  }

  wrapper.react(wrapper => {
    if (wrapper) {
      if (pro.enabled.get()) {
        initSortable()
      }
    } else {
      if (sortable.get()) {
        sortable.get().destroy()
        sortable.set(null)
      }
    }
  })

  <sortable key={
    pro.enabled.get()? children.get().map(c => c.key).join('\n') : 'frozen'
  }
    ref={wrapper.set.bind(wrapper)}
  >
    {children.get()}
  </sortable>

  $ghost = {
    opacity: 0
  }
}
