const lastVolumeSetting = atom(0.5)

view VolumeBars {
  const context = initContext(view, {
    colors: atom()
  })

  const prop = initProp(view, {
    height: M.defaultAtom(30),
    initialVolume: M.defaultAtom(null),
    numBars: M.defaultAtom(5),
    volume: atom(),
    width: M.defaultAtom(30)
  })

  const spacerWidth = atom(1)
  const selectedColor = atom(context.colors.get().accent)
  const hoveringColor = atom('rgba(221, 19, 123, 0.5)')

  const barWidth = derivation(() => {
    return (
      prop.width.get() - spacerWidth.get() * (prop.numBars.get() - 1)
    ) / prop.numBars.get()
  })
  const getBarHeight = (barIndex) => {
    const heightFraction = (barIndex + 1) / prop.numBars.get()
    return heightFraction * prop.height.get()
  }
  const barBorderRadius = derivation(() => {
    return barWidth.get() / 2 + 2
  })

  const desiredVolume = atom(prop.initialVolume.get())
  const hoveringBarIndex = atom(null)

  prop.volume.react(propVolume => {
    if (propVolume !== undefined) {
      desiredVolume.set(propVolume)
    }
  })

  const volume = derivation(() => {
    return desiredVolume.get() == null?
      lastVolumeSetting.get() :
      desiredVolume.get()
  })

  const selectedBarIndex = volume.derive(volume => {
    return Math.ceil(volume * prop.numBars.get()) - 1
  })

  const setSelectedBarIndex = (i) => {
    const userDesiredVolume = (i + 1) / prop.numBars.get()
    transact(() => {
      desiredVolume.set(userDesiredVolume)
      lastVolumeSetting.set(userDesiredVolume)
    })
  }

  volume.react(volume => {
    view.props.onChange && view.props.onChange({volume})
  })

  <mouseTarget repeat={prop.numBars.get()}
    onMouseEnter={() => hoveringBarIndex.set(_index)}
    onMouseLeave={() => hoveringBarIndex.set(null)}
    onClick={() => setSelectedBarIndex(_index)}
  >
    <bar />
  </mouseTarget>

  $ = {
    flexDirection: 'row',
    alignItems: 'flex-end'
  }

  $mouseTarget = {
    cursor: 'pointer',
    height: prop.height.get(),
    justifyContent: 'flex-end'
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
    borderRadius: [barBorderRadius.get()], // , barBorderRadius.get(), 0, 0],
    marginRight: _index < prop.numBars.get() - 1? spacerWidth.get() : null
  }
}
