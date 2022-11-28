import { TextGeometry, extendMSDFMaterial } from '../../src/index'
import { initGUI, initScene } from './utils/common'

async function init() {
  const { renderer, camera, scene, font, atlas, loader } = await initScene()

  const geometry = new TextGeometry({
    font: font,
    text: 'Hello World',
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
    }),
    {
      atlas,
      stroke: true,
      strokeInnerWidth: 0.3,
      strokeOuterWidth: 0,
    },
  )

  pane.addInput(material, 'strokeOuterWidth', {
    min: 0,
    max: 1,
    label: 'outerWidth',
  })

  pane.addInput(material, 'strokeInnerWidth', {
    min: 0,
    max: 1,
    label: 'innerWidth',
  })

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
