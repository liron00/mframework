import {spring} from 'react-motion'

view Video {
  const context = initContext(view, {
    colors: atom()
  })

  const prop = initProp(view, {
    videoKey: M.requiredAtom(),

    // Wrapping Wistia config
    allowPause: M.defaultAtom(true), // WARNING: False messes up mobile browsers
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

  <WistiaVideo
    videoKey={prop.videoKey.get()}
    allowPause={prop.allowPause.get()}
    allowPlay={prop.allowPlay.get()}
    autoPlay={prop.autoPlay.get()}
    controlsVisibleOnLoad={prop.controlsVisibleOnLoad.get()}
    endVideoBehavior={prop.endVideoBehavior.get()}
    initialTime={prop.initialTime.get()}
    initialVolume={prop.initialVolume.get()}
    playerColor={prop.playerColor.get()}
    showPlaybar={prop.showPlaybar.get()}
    showVolume={prop.showVolume.get()}
    wmode={prop.wmode.get()}

    enabled={prop.enabled.get()}
    smoothVolume={prop.smoothVolume.get()}

    circle={prop.circle.get()}
    height={prop.height.get()}
    width={prop.width.get()}
    videoStyle={prop.videoStyle.get()}

    playing={prop.playing.get()}
    time={prop.time.get()}
    volume={prop.volume.get()}

    onTime={view.props.onTime}
    onVideoData={view.props.onVideoData}
  />
}
