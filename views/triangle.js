view Triangle {
  const pro = initPro(view, {
    pointAngle: M.defaultAtom('down'),
    style: M.mergeAtom({
      color: 'black',
      width: 50
    })
  })

  <triangle if={pro.pointAngle.get() == 'down'} style={{
    width: 0,
    height: 0,
    borderStyle: ['solid', 'solid', 'none', 'solid'],
    borderWidth: [
      pro.style.get().get('height'),
      pro.style.get().get('width'),
      0,
      pro.style.get().get('width')
    ],
    borderColor: `${pro.style.get().get('color')} transparent transparent transparent`
  }} />
  <triangle if={pro.pointAngle.get() == 'up'} style={{
    width: 0,
    height: 0,
    borderStyle: ['none', 'solid', 'solid', 'solid'],
    borderWidth: [
      0,
      pro.style.get().get('width'),
      pro.style.get().get('height'),
      pro.style.get().get('width')
    ],
    borderColor: `transparent transparent ${pro.style.get().get('color')} transparent`
  }} />
}
