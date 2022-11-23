import { TextGeometry, extendMSDFMaterial } from '../../build/index.esm'
import { initGUI, initScene } from './index'

async function init() {
  const { renderer, camera, scene, font, atlas, loader } = await initScene()
  const map = await loader.loadAsync('./img/uv_map.png')

  const state = {
    alignX: 'center',
    alignY: 'center',
    text: 'Type here',
  }

  const geometry = new TextGeometry({
    font: font,
    text: state.text,
    size: 5,
    alignY: 'center',
    alignX: 'center',
    uv: true,
    lineHeight: 1,
  })

  let material = extendMSDFMaterial(
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      opacity: 1,
      transparent: true,
      side: THREE.DoubleSide,
      map: map,
    }),
    {
      atlas,
    },
  )

  pane.addInput(state, 'text').on('change', event => {
    geometry.updateText(event.value)
  })

  window.addEventListener('keypress', e => {
    if (e.key.length > 1) return
    if (['Backspace', 'Enter'].indexOf(e.key) > -1) return
    state.text += e.key
    geometry.updateText(state.text)
  })

  window.addEventListener('keydown', e => {
    if (e.key === 'Backspace') {
      state.text = state.text.slice(0, -1)
    }
    if (e.key === 'Enter') {
      state.text += '\n'
    }
    geometry.updateText(state.text)
  })

  const mesh = new THREE.Mesh(geometry, material)
  initGUI(mesh)

  scene.add(mesh)

  function loop() {
    renderer.render(scene, camera)
    requestAnimationFrame(loop)
  }
  loop()
}

window.addEventListener('load', init)
