const lastVolumeSetting = atom(0.5)

view VolumeBars {
  const context = initContext(view, {
    colors: atom()
  })

  const pro = initPro(view, {
    height: M.defaultAtom(30),
    initialVolume: M.defaultAtom(null),
    inverted: M.defaultAtom(false),
    numBars: M.defaultAtom(5),
    volume: atom(),
    width: M.defaultAtom(30)
  })

  const spacerWidth = atom(1)
  const selectedColor = atom(context.colors.get().accent)
  const hoveringColor = atom('rgba(221, 19, 123, 0.5)')

  const barWidth = derivation(() => {
    return (
      pro.width.get() - spacerWidth.get() * (pro.numBars.get() - 1)
    ) / pro.numBars.get()
  })
  const getBarHeight = (barIndex) => {
    const heightFraction = (barIndex + 1) / pro.numBars.get()
    return heightFraction * pro.height.get()
  }
  const barBorderRadius = derivation(() => {
    return barWidth.get() / 2 + 2
  })

  const desiredVolume = atom(pro.initialVolume.get())
  const hoveringBarIndex = atom(null)

  pro.volume.react(propVolume => {
    if (propVolume !== undefined) {
      desiredVolume.set(propVolume)
    }
  })

  const volume = derivation(() => {
    return desiredVolume.get() == null?
      lastVolumeSetting.get() :
      desiredVolume.get()
  })
  volume.react(initialVolume => {
    view.props.onInit && view.props.onInit({volume: initialVolume})
  }, {once: true})

  const selectedBarIndex = volume.derive(volume => {
    return Math.ceil(volume * pro.numBars.get()) - 1
  })

  const setSelectedBarIndex = (i) => {
    const userDesiredVolume = (i + 1) / pro.numBars.get()
    transact(() => {
      desiredVolume.set(userDesiredVolume)
      lastVolumeSetting.set(userDesiredVolume)
    })
    if (view.props.onChange) {
      view.props.onChange({volume: volume.get()})
    }
  }

  <mouseTarget repeat={pro.numBars.get()}
    onMouseEnter={() => hoveringBarIndex.set(_index)}
    onMouseLeave={() => hoveringBarIndex.set(null)}
    onClick={() => setSelectedBarIndex(_index)}
  >
    <bar />
  </mouseTarget>

  $ = {
    flexDirection: 'row'
  }

  $mouseTarget = {
    cursor: 'pointer',
    height: pro.height.get(),
    justifyContent: pro.inverted.get()? 'flex-start' : 'flex-end'
  }

  $bar = {
    background: (
      (
        hoveringBarIndex.get() == null ||
        hoveringBarIndex.get() == selectedBarIndex.get()
      )? (
        _index <= selectedBarIndex.get()? selectedColor.get() : 'white'
      ) : (
        _index <= hoveringBarIndex.get()? hoveringColor.get() : 'white'
      )
    ),
    borderStyle: 'solid',
    borderColor: '#ccc',
    borderWidth: 1,
    width: barWidth.get(),
    height: getBarHeight(_index),
    borderRadius: (pro.inverted.get()?
      [0, 0, barBorderRadius.get(), barBorderRadius.get()] :
      [barBorderRadius.get(), barBorderRadius.get(), 0, 0]
    ),
    marginRight: _index < pro.numBars.get() - 1? spacerWidth.get() : null
  }
}
