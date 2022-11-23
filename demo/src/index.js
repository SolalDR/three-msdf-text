import { Font } from '../../build/index.esm'
import fontsData from './font/font.json'

export async function initScene() {
  const canvas = document.querySelector('#canvas')
  const scene = new THREE.Scene()
  const loader = new THREE.TextureLoader()
  const atlas = await loader.loadAsync('./font/font.png')
  const font = new Font(fontsData)

  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
  )
  camera.position.set(0, 0, 15)
  camera.lookAt(new THREE.Vector3())
  const renderer = new THREE.WebGLRenderer({
    canvas,
  })

  const onResize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight)
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
  }

  onResize()
  window.addEventListener('resize', onResize)

  return { renderer, camera, scene, font, atlas, loader }
}

export function initGUI(mesh) {
  const PARAMS = {
    color: { r: 255, g: 0, b: 55 },
    opacity: 1,
  }

  pane.addInput(PARAMS, 'color').on('change', e => {
    mesh.material.color.r = e.value.r / 256
    mesh.material.color.g = e.value.g / 256
    mesh.material.color.b = e.value.b / 256
  })

  pane
    .addInput(PARAMS, 'opacity', {
      min: 0,
      max: 1,
    })
    .on('change', e => {
      mesh.material.opacity = e.value
    })
}
