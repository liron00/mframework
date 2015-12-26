import {spring} from 'react-motion'

view Video {
  const context = initContext(view, {
    colors: atom()
  })

  const pro = initPro(view, {
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
    videoKey={pro.videoKey.get()}
    allowPause={pro.allowPause.get()}
    allowPlay={pro.allowPlay.get()}
    autoPlay={pro.autoPlay.get()}
    controlsVisibleOnLoad={pro.controlsVisibleOnLoad.get()}
    endVideoBehavior={pro.endVideoBehavior.get()}
    initialTime={pro.initialTime.get()}
    initialVolume={pro.initialVolume.get()}
    playerColor={pro.playerColor.get()}
    showPlaybar={pro.showPlaybar.get()}
    showVolume={pro.showVolume.get()}
    wmode={pro.wmode.get()}

    enabled={pro.enabled.get()}
    smoothVolume={pro.smoothVolume.get()}

    circle={pro.circle.get()}
    height={pro.height.get()}
    width={pro.width.get()}
    videoStyle={pro.videoStyle.get()}

    playing={pro.playing.get()}
    time={pro.time.get()}
    volume={pro.volume.get()}

    onEnd={view.props.onEnd}
    onTime={view.props.onTime}
    onVideoData={view.props.onVideoData}
  />
}
