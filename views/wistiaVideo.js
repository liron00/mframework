import {spring} from 'react-motion'

view WistiaVideo {
  const context = initContext(view, {
    colors: atom()
  })

  const prop = initProp(view, {
    videoKey: M.requiredAtom(),

    // Wrapping Wistia config
    allowPause: M.defaultAtom(true),
    allowPlay: M.defaultAtom(true),
    autoPlay: M.defaultAtom(false),
    controlsVisibleOnLoad: M.defaultAtom(true),
    endVideoBehavior: M.defaultAtom('default'), // default | reset | loop
    initialTime: M.defaultAtom(null),
    initialVolume: M.defaultAtom(null), // null means previous Wistia setting
    playerColor: M.defaultAtom(context.colors.get().accent),
    showPlaybar: M.defaultAtom(true),
    showVolume: M.defaultAtom(true),
    wmode: M.defaultAtom('transparent'),

    // Non-Wistia config
    enabled: M.defaultAtom(true),
    smoothVolume: M.defaultAtom(false),

    // Style
    circle: M.defaultAtom(false),
    height: M.defaultAtom(400 * 9 / 16),
    width: M.defaultAtom(400),
    videoStyle: M.mapAtom({}),

    // Parent-controlled state
    playing: atom(),
    time: atom(),
    volume: atom()
  })

  const wistiaId = prop.videoKey.derive(videoKey => {
    if (!videoKey.startsWith('videos/wistia/')) {
      throw new Error(`Invalid Wistia video key: ${videoKey}`)
    }
    return videoKey.split('/')[2]
  })

  const wantToPlay = atom(prop.autoPlay.get())
  const targetVolume = atom(prop.initialVolume.get())
  const time = atom(prop.initialTime.get())
  const wistiaTime = atom()

  // Controlled by <Motion> as a function of targetVolume
  const volume = atom(targetVolume.get())

  const VIEW_ID = parseInt(Math.random() * 10000000000)
  const wistia = atom()
  const lastRenderedWistiaConfig = atom()
  const refreshCount = atom(0)

  // Data reported from Wistia
  const aspect = atom()
  const duration = atom()
  const videoData = derivation(() => {
    const data = IMap({
      aspect: aspect.get(),
      duration: duration.get()
    })
    if (List(data.values()).findIndex(v => v === undefined) == -1) {
      return data
    }
  })
  videoData.reactor(videoData => {
    if (view.props.onVideoData) {
      view.props.onVideoData({videoData})
    }
  }).start()

  prop.playing.react(propPlaying => {
    if (propPlaying != null) {
      wantToPlay.set(propPlaying)
    }
  })
  prop.time.react(propTime => {
    if (propTime != null) {
      time.set(propTime)
    }
  })
  prop.volume.react(propVolume => {
    if (propVolume !== undefined) {
      targetVolume.set(propVolume)
    }
  })

  const playing = derivation(() => {
    return prop.enabled.get() && wantToPlay.get()
  })
  playing.react(playing => {
    if (wistia.get()) {
      if (playing) {
        wistia.get().play()
      } else {
        wistia.get().pause()
      }
    }
  })

  wistiaTime.reactor(wistiaTime => {
    time.set(wistiaTime)
  }).start()

  time.react(time => {
    if (wistia.get()) {
      if (Math.abs(time - wistiaTime.get()) > 0.25) {
        wistia.get().time(time)
      }
    }

    if (view.props.onTime) {
      view.props.onTime({time})
    }
  })

  volume.react(volume => {
    if (wistia.get()) {
      wistia.get().volume(volume)
    }
  })

  const diameter = derivation(() => {
    return Math.min(prop.width.get(), prop.height.get())
  })
  const width = derivation(() => {
    if (prop.circle.get()) {
      const aspectGuess = aspect.get() || 16 / 9
      return Math.max(diameter.get(), diameter.get() * aspectGuess)
    } else {
      return prop.width.get()
    }
  })
  const height = derivation(() => {
    if (prop.circle.get()) {
      const aspectGuess = aspect.get() || 16 / 9
      return Math.max(diameter.get(), diameter.get() / aspectGuess)
    } else {
      return prop.height.get()
    }
  })

  wistia.reactor(wistia => {
    wistia.hasData(() => {
      transact(() => {
        aspect.set(wistia.aspect())
        duration.set(wistia.duration())
      })
    })

    wistia.bind('play', () => {
      if (!playing.get()) {
        if (wistiaTime.get() == null && time.get() != null) {
          // This happens when programmatically seeking to a time when Wistia's
          // state is beforePlay. It changes to play, but then it'll change
          // immediately back to pause. So do nothing.
        } else {
          // Since our state would have had the video stay paused, this must
          // be a user-triggered event.
          if (prop.allowPlay.get()) {
            wantToPlay.set(true)
          } else {
            wistia.pause()
          }
        }
      }
    })

    wistia.bind('pause', () => {
      if (playing.get()) {
        // Since our state would have had the video keep playing, this must
        // be a user-triggered event.
        if (prop.allowPause.get()) {
          wantToPlay.set(false)
        } else {
          wistia.play()
        }
      }
    })

    wistia.bind('volumechange', v => {
      if (v != volume.get()) {
        // User-triggered volume change
        targetVolume.set(v)
        volume.set(v)
      }
    })

    wistia.bind('timechange', t => {
      wistiaTime.set(t)
    })
  }).start()

  const tellWistia = (wistiaMessage) => {
    // Wistia's script watches a global message queue so we can "tell it"
    // to call our callback with a handle or update some configs.

    // We use refreshCount.get() + 1 because we need to get the message
    // to Wistia before this component's rendered elements refresh
    const matcher = `video_${VIEW_ID}_${refreshCount.get() + 1}`
    window._wq = window._wq || []
    _wq.push({[matcher]: wistiaMessage})
  }

  const refreshWistia = () => {
    if (wistia.get()) {
      wistia.get().remove()
      wistiaTime.set(undefined)
    }

    const wistiaConfigSnapshot = wistiaConfig.get()
    tellWistia(wistiaVideoHandle => wistia.set(wistiaVideoHandle))
    tellWistia(wistiaConfigSnapshot.toJS())
    refreshCount.set(refreshCount.get() + 1)

    on.delay(1, () => {
      lastRenderedWistiaConfig.set(wistiaConfigSnapshot)
    })
  }

  prop.videoKey.react(videoKey => {
    if (view.mounted) {
      lastRenderedWistiaConfig.set(null)
    }
  })

  const wistiaConfig = derivation(() => {
    return IMap({
      autoPlay: playing.get(),
      controlsVisibleOnLoad: prop.controlsVisibleOnLoad.get(),
      endVideoBehavior: prop.endVideoBehavior.get(),
      playbar: prop.showPlaybar.get(),
      playerColor: prop.playerColor.get(),
      time: time.get(),
      volumeControl: prop.showVolume.get(),
      volume: targetVolume.get(),
      wmode: prop.wmode.get()
    })
  })

  const needsRefreshing = derivation(() => {
    const lastConfig = lastRenderedWistiaConfig.get()
    if (!lastConfig) {
      return true
    }
    return !immutable.is(
      IMap({
        endVideoBehavior: prop.endVideoBehavior.get(),
        playbar: prop.showPlaybar.get(),
        playerColor: prop.playerColor.get(),
        volumeControl: prop.showVolume.get(),
        wmode: prop.wmode.get()
      }),
      IMap({
        endVideoBehavior: lastConfig.get('endVideoBehavior'),
        playbar: lastConfig.get('playbar'),
        playerColor: lastConfig.get('playerColor'),
        volumeControl: lastConfig.get('volumeControl'),
        wmode: lastConfig.get('wmode')
      })
    )
  })
  needsRefreshing.react(needsRefreshing => {
    if (needsRefreshing && view.mounted) {
      refreshWistia()
    }
  })

  on.mount(() => {
    if (lastRenderedWistiaConfig.get() === undefined) {
      // First render
      refreshWistia()
    } else {
      lastRenderedWistiaConfig.set(null)
    }
  })

  on.unmount(() => {
    if (wistia.get()) {
      wistia.get().remove()
    }
  })

  <Motion
    defaultStyle={{v: targetVolume.get() || 0}}
    style={{
      v: (
        prop.smoothVolume.get() && targetVolume.get() != null &&
        targetVolume.get() != volume.get()
      )? spring(targetVolume.get()) : targetVolume.get()
    }}
  >
    {style => {
      if (style.v != null) {
        setTimeout(() => {
          volume.set(style.v)
        }, 1)
      }

      return <wrapper style={prop.videoStyle.get().toJS()}>
        <div
          key={`render_${refreshCount.get()}`}
          id={`video_${VIEW_ID}_${refreshCount.get()}`}
          class={`wistia_embed wistia_async_${wistiaId.get()}`}
        />
      </wrapper>
    }}
  </Motion>

  $wistia_embed = {
    width: width.get(),
    height: height.get()
  }

  $wrapper = {
    overflow: 'hidden',
    width: prop.circle.get()? diameter.get() : prop.width.get(),
    height: prop.circle.get()? diameter.get() : prop.height.get(),
    alignItems: 'center',
    zIndex: 1,
    borderRadius: prop.circle.get()? '50%' : 8
  }
}
