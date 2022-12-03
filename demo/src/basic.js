/**
 * @author SolalDR
 * @link https://solaldr.github.io/three-msdf-text/public/demo/index.html
 */

import { TextGeometry, extendMSDFMaterial } from '../../build/index.esm'
import { initGUI, initScene } from './utils/common'

async function init() {
  const { renderer, camera, scene, font, atlas } = await initScene()

  const geometry = new TextGeometry({
    font: font,
    text: 'Type here',
    size: 5,
    alignY: 'center',
    alignX: 'center',
    lineHeight: 1,
    widthSegments: 1,
    heightSegments: 1,
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
