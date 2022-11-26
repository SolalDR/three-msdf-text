import { Font } from '../../build/index.esm'
import fontsData from './font/roboto.json'

export async function initScene() {
  const canvas = document.querySelector('#canvas')
  const scene = new THREE.Scene()
  const loader = new THREE.TextureLoader()
  const atlas = await loader.loadAsync('./font/roboto.png')
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

export function initGUI(mesh, scene) {
  const state = {
    color: { r: 255, g: 0, b: 55 },
    opacity: 1,
    text: mesh.geometry.text,
    axes: false,
    debug: false,
    alignX: 'center',
    alignY: 'center',
    size: 5,
    letterSpacing: 0,
    lineHeight: 1,
    wordSpacing: 0,
    wordBreak: false,
    lineBreak: true,
  }

  const helper = new THREE.AxesHelper(5)
  helper.visible = false
  scene.add(helper)

  window.addEventListener('keypress', (e) => {
    if (e.key.length > 1) return
    if (['Backspace', 'Enter'].indexOf(e.key) > -1) return
    state.text += e.key
    mesh.geometry.updateText(state.text)
  })

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace') {
      state.text = state.text.slice(0, -1)
    }

    if (e.key === 'Enter') {
      state.text += '\n'
    }

    mesh.geometry.updateText(state.text)
  })

  const mat = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    wireframe: true,
  })
  let trueMat = mesh.material

  pane.addInput(state, 'axes').on('change', () => {
    helper.visible = state.axes
  })

  pane.addInput(state, 'debug').on('change', () => {
    if (state.debug) {
      mesh.material = mat
    } else {
      mesh.material = trueMat
    }
  })

  pane
    .addInput(state, 'alignX', {
      options: {
        center: 'center',
        left: 'left',
        right: 'right',
      },
    })
    .on('change', () => {
      mesh.geometry.alignX = state.alignX
      mesh.geometry.computeGeometry()
    })

  pane
    .addInput(state, 'alignY', {
      options: {
        center: 'center',
        top: 'top',
        bottom: 'bottom',
      },
    })
    .on('change', () => {
      mesh.geometry.alignY = state.alignY
      mesh.geometry.computeGeometry()
    })

  pane.addInput(state, 'color').on('change', (e) => {
    mesh.material.color.r = e.value.r / 256
    mesh.material.color.g = e.value.g / 256
    mesh.material.color.b = e.value.b / 256
  })

  pane
    .addInput(state, 'opacity', {
      min: 0,
      max: 1,
    })
    .on('change', (e) => {
      mesh.material.opacity = e.value
    })
}
