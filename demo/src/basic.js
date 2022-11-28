import { TextGeometry, extendMSDFMaterial } from '../../build/index.esm'
import { initGUI, initScene } from './utils/common'

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
    charPosition: true,
    normal: true,
    lineIndex: true,
    charIndex: true,
    wordIndex: true,
    lineCharIndex: true,
    lineWordIndex: true,
    lineWordCount: true,
    lineCharCount: true,
    lineHeight: 1,
    width: 25,
    height: 25,
  })

  let material = extendMSDFMaterial(
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      opacity: 1,
      transparent: true,
      side: THREE.DoubleSide,
    }),
    {
      atlas,
    },
  )

  const mesh = new THREE.Mesh(geometry, material)
  initGUI(mesh, scene)

  scene.add(mesh)

  function loop() {
    renderer.render(scene, camera)
    requestAnimationFrame(loop)
  }
  loop()
}

window.addEventListener('load', init)
