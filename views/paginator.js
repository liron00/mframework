view Paginator {
  const pro = initPro(view, {
    initialPageIndex: M.defaultAtom(0),
    numPages: atom(),
    pageIndex: atom(),
    pageRadius: M.defaultAtom(2),
    style: M.mergeAtom({
      page: {
        padding: [8, 12],
        borderRadius: 8,
        border: '1px solid #eee',
        cursor: 'pointer',
        margin: 2,
        background: 'white',
        color: '#999'
      },
      selectedPage: {
        background: 'rgb(215, 98, 124)',
        fontWeight: 'bold',
        color: 'white'
      }
    })
  })

  const pageIndex = atom(pro.initialPageIndex.get())
  pro.pageIndex.react(propPageIndex => {
    if (propPageIndex != null) {
      pageIndex.set(propPageIndex)
    }
  })

  const requestPage = (i) => {
    if (pro.pageIndex.get() == null) {
      pageIndex.set(i)
    }

    if (view.props.onSelect) {
      view.props.onSelect({page: i})
    }
  }

  <prevSec if={pageIndex.get() > 0}
    style={pro.style.get().get('page').toJS()}
    onClick={() => requestPage(pageIndex.get() - 1)}
  >
    &lt;
  </prevSec>
  <pageSecWrapper if={pro.numPages.get() > 1} repeat={2 * pro.pageRadius.get() + 1}>
    <pageSec
      if={
        pageIndex.get() - pro.pageRadius.get() + _index >= 0 &&
        pageIndex.get() - pro.pageRadius.get() + _index < pro.numPages.get()
      }
      onClick={() => requestPage(pageIndex.get() - pro.pageRadius.get() + _index)}
      style={
        pro.style.get().get('page').merge(
          (pageIndex.get() - pro.pageRadius.get() + _index == pageIndex.get())?
            pro.style.get().get('selectedPage') :
            {}
        ).toJS()
      }
    >
      {pageIndex.get() - pro.pageRadius.get() + _index + 1}
    </pageSec>
  </pageSecWrapper>
  <nextSec if={pageIndex.get() < pro.numPages.get() - 1}
    style={pro.style.get().get('page').toJS()}
    onClick={() => requestPage(pageIndex.get() + 1)}
  >
    &gt;
  </nextSec>

  $ = {
    flexDirection: 'row'
  }
}
