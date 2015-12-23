/*
  Wrapper for jQuery UI Slider
*/

view Slider {
  const context = initContext(view, {
    colors: atom()
  })

  const pro = initPro(view, {
    value: atom(),
    values: M.listAtom(),

    width: M.defaultAtom(400),
    min: M.defaultAtom(0),
    max: M.defaultAtom(100),
    handleWidth: M.defaultAtom(14),
    handleHeight: M.defaultAtom(14),
    labelContent: atom(),
    labelHeight: M.defaultAtom(26),
    centerLabel: M.defaultAtom(true),
    barHeight: M.defaultAtom(8),
    range: M.defaultAtom(false), // true, fale, 'min', 'max'
    rangeStyle: M.mapAtom({}),
    handleStyle: M.mapAtom({}),
    barStyle: M.mapAtom({}),
  })

  const barWidth = derivation(() => {
    return pro.width.get() - pro.handleWidth.get()
  })

  const values = M.listAtom(
    pro.values.get() || List([pro.value.get() || 0])
  )

  const hovering = atom(false)
  hovering.reactor(hovering => {
    if (view.props.onHover) view.props.onHover({hovering})
  }).start()

  const rangeStyle = derivation(() => {
    return IMap({
      height: pro.barHeight.get(),
      background: 'rgba(221, 19, 123, 0.75)',
      borderRadius: 1,
      zIndex: 2
    }).merge(
      pro.rangeStyle.get()
    )
  })

  const handleStyle = derivation(() => {
    return IMap({
      background: 'black',
      borderRadius: '50%',
      cursor: 'pointer',
      height: pro.handleHeight.get(),
      width: pro.handleWidth.get(),
      border: 'none',
      top: pro.barHeight.get() / 2 - pro.handleHeight.get() / 2,
      marginLeft: -pro.handleWidth.get() / 2 + 2,
      zIndex: 2
    }).merge(
      pro.handleStyle.get()
    ).merge(
      hovering.get()?
        {
          background: 'black'
        } :
        null
    )
  })

  const barStyle = derivation(() => {
    return IMap({
      background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, #ceced9 100%)',
      cursor: 'pointer',
      borderRadius: 2
    }).merge(
      pro.barStyle.get()
    )
  })

  const slider = atom()
  slider.react(slider => {
    if (slider) {
      jQuery(slider).slider({
        range: pro.range.get(),
        min: pro.min.get(),
        max: pro.max.get(),
        value: pro.value.get(),
        values: (pro.value.get() == null)? values.get().toJS() : null,
        slide: (event, ui) => {
          if (view.props.onSlide) {
            const ret = view.props.onSlide({
              value: ui.value,
              values: ui.values
            })
            if (ret === false) {
              event.preventDefault()
              return
            }
          }
          values.set(List(ui.values || [ui.value]))
        }
      })

      styleJQuery()
    }
  })

  const styleJQuery = () => {
    if (!slider.get()) return

    jQuery(slider.get()).css(barStyle.get().toJS())
    jQuery(slider.get()).find('.ui-slider-range').css(rangeStyle.get().toJS())
    jQuery(slider.get()).find('.ui-slider-handle').attr({
      /* The tabIndex is a jQuery UI accessibility feature
         but it makes an awkward rectangle around the focused
         slider control. */
      tabIndex: null
    }).css(handleStyle.get().toJS())
  }

  derivation(() => List([
    barStyle.get(),
    rangeStyle.get(),
    handleStyle.get()
  ])).reactor(styleJQuery).start()

  const getLabelContent = (value) => {
    if (pro.labelContent.get() instanceof Function) {
      return pro.labelContent.get()(value)
    } else if (pro.labelContent.get() === true) {
      return `${value}`
    } else if (pro.labelContent.get()) {
      return pro.labelContent.get()
    } else {
      return null
    }
  }

  <slider ref={elem => slider.set(elem)}
    onMouseEnter={() => hovering.set(true)}
    onMouseLeave={() => hovering.set(false)}
  >
    <notch repeat={pro.max.get() - pro.min.get() - 1} />
  </slider>
  <valueLabelContainer if={pro.labelContent.get()} repeat={values.get()}>
    {getLabelContent(_)}
  </valueLabelContainer>

  $ = {
    paddingTop: Math.max(0, (pro.handleHeight.get() - pro.barHeight.get()) / 2) - 2 + (
      pro.labelContent.get()? pro.labelHeight.get() : 0
    ),
    paddingBottom: Math.max(0, (pro.handleHeight.get() - pro.barHeight.get()) / 2) - 2,
    paddingLeft: pro.handleWidth.get() / 2,
    paddingRight: pro.handleWidth.get() / 2,
    position: 'relative'
  }

  $slider = {
    width: pro.width.get() - pro.handleWidth.get(),
    height: pro.barHeight.get() + 2,
    zIndex: 2,
    borderStyle: 'solid',
    borderWidth: 1,
    borderTopColor: '#ddd',
    borderLeftColor: '#ddd',
    borderBottomColor: '#aaa',
    borderRightColor: '#aaa'
  }

  $notch = {
    position: 'absolute',
    height: pro.barHeight.get(),
    width: 2,
    borderLeft: '1px solid rgba(50, 50, 50, 0.5)', //#6e7a8d',
    borderRight: '1px solid rgba(200, 200, 200, 0.5)',
    zIndex: 2,
    left: (
      barWidth.get() * (_index + 1) / (pro.max.get() - pro.min.get())
    )
  }

  $valueLabelContainer = {
    flexDirection: 'row',
    position: 'absolute',
    width: 0,
    justifyContent: pro.centerLabel.get()? 'center' : null,
    marginTop: -pro.handleHeight.get() / 2 - pro.labelHeight.get(),
    left: 4 + (pro.centerLabel.get()?
      (pro.handleWidth.get() / 2 + (
        (pro.width.get() - pro.handleWidth.get()) *
        (values.get().get(_index) - pro.min.get()) /
        (pro.max.get() - pro.min.get())
      ))
    :
      (pro.width.get() - pro.handleWidth.get()) *
      (values.get().get(_index) - pro.min.get()) /
      (pro.max.get() - pro.min.get())
    ),
    fontSize: 13,
    whiteSpace: 'nowrap'
  }
}
