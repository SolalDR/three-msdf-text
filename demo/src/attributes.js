/**
 * @author SolalDR
 * @link https://solaldr.github.io/three-msdf-text/public/demo/attributes.html
 */

import { TextGeometry, extendMSDFMaterial } from '../../build/index.esm'
import { initGUI, initScene } from './utils/common'

async function init() {
  const { renderer, camera, scene, font, atlas } = await initScene()

  const geometry = new TextGeometry({
    font: font,
    text: 'Lorem ipsum\n dolor sit amet',
    size: 4,
    alignY: 'center',
    alignX: 'center',
    lineHeight: 1,
    widthSegments: 1,
    heightSegments: 1,
    uv: true,
    normal: true,
    charPosition: true,
    lineIndex: true,
    charIndex: true,
    charSize: true,
    wordIndex: true,
    lineCharIndex: true,
    lineWordIndex: true,
    lineWordCount: true,
    lineCharCount: true,
  })

  let material = extendMSDFMaterial(
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      opacity: 1,
      transparent: true,
      side: THREE.FrontSide,
    }),
    {
      atlas,
    },
  )

  const attributesMonitor = {
    charPosition: { x: 0, y: 0, z: 0 },
    charSize: { x: 0, y: 0 },
    lineIndex: 0,
    charIndex: 0,
    wordIndex: 0,
    lineCharIndex: 0,
    lineWordIndex: 0,
    lineWordCount: 0,
    lineCharCount: 0,
  }

  const code = document.createElement('code')
  document.body.appendChild(code)

  const updateMonitor = () => {
    let text = `{
    \tlineIndex: ${attributesMonitor.lineIndex},
    \tcharIndex: ${attributesMonitor.charIndex},
    \twordIndex: ${attributesMonitor.wordIndex},
    \tlineCharIndex: ${attributesMonitor.lineCharIndex},
    \tlineWordIndex: ${attributesMonitor.lineWordIndex},
    \tlineWordCount: ${attributesMonitor.lineWordCount},
    \tlineCharCount: ${attributesMonitor.lineCharCount},
    \tcharPosition: {
    \t\tx: ${attributesMonitor.charPosition.x},
    \t\ty: ${attributesMonitor.charPosition.y},
    \t\tz: ${attributesMonitor.charPosition.z}
    \t},
    \tcharSize: {
    \t\tx: ${attributesMonitor.charSize.x},
    \t\ty: ${attributesMonitor.charSize.y}
    \t}
    }
    `
    text = text.replaceAll('\n', '<br>')
    text = text.replaceAll('\t', '&nbsp;&nbsp;')
    code.innerHTML = text
  }

  updateMonitor()

  const mesh = new THREE.Mesh(geometry, material)
  initGUI(mesh, scene)

  const raycaster = new THREE.Raycaster()
  const normalizedMouse = new THREE.Vector2()

  window.addEventListener('mousemove', (e) => {
    normalizedMouse.set(
      (e.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1,
    )
    raycaster.setFromCamera(normalizedMouse, camera)
    const intersection = raycaster.intersectObject(mesh)

    if (intersection.length) {
      attributesMonitor.lineIndex =
        geometry.attributes.lineIndex.array[intersection[0].face.a]
      attributesMonitor.charIndex =
        geometry.attributes.charIndex.array[intersection[0].face.a]
      attributesMonitor.wordIndex =
        geometry.attributes.wordIndex.array[intersection[0].face.a]
      attributesMonitor.lineCharIndex =
        geometry.attributes.lineCharIndex.array[intersection[0].face.a]
      attributesMonitor.lineWordCount =
        geometry.attributes.lineWordCount.array[intersection[0].face.a]
      attributesMonitor.lineWordIndex =
        geometry.attributes.lineWordIndex.array[intersection[0].face.a]
      attributesMonitor.lineCharCount =
        geometry.attributes.lineCharCount.array[intersection[0].face.a]
      attributesMonitor.charPosition = {
        x: geometry.attributes.charPosition.array[intersection[0].face.a * 3],
        y: geometry.attributes.charPosition.array[
          intersection[0].face.a * 3 + 1
        ],
        z: geometry.attributes.charPosition.array[
          intersection[0].face.a * 3 + 2
        ],
      }
      attributesMonitor.charSize = {
        x: geometry.attributes.charSize.array[intersection[0].face.a * 2],
        y: geometry.attributes.charSize.array[intersection[0].face.a * 2 + 1],
      }

      updateMonitor()
    }
  })

  scene.add(mesh)

  function loop() {
    renderer.render(scene, camera)
    requestAnimationFrame(loop)
  }
  loop()
}

window.addEventListener('load', init)
