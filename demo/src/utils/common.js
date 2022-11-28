import { Font } from '../../../build/index.esm'
import fontsData from '../../assets/font/Roboto-Regular-msdf.json'
import list from '../demos.json'

window.pane = new Tweakpane.Pane()

const demoName = window.location.href.match(/([\w\-.]+?)$/)
const actualDemoName = demoName ? demoName[1] : 'index.html'

pane
  .addBlade({
    view: 'list',
    label: 'demo',
    options: list.map((entry) => {
      return { text: entry.name, value: entry.output }
    }),
    value: actualDemoName,
  })
  .on('change', (ev) => {
    window.location.href = window.location.href.replace(
      /\/[\w\-.]*?$/,
      `/${ev.value}`,
    )
  })

let renderer,
  canvas,
  scene,
  loader,
  atlas,
  font,
  camera,
  helper,
  boundingBox,
  mesh

export const state = {
  color: { r: 255, g: 0, b: 55 },
  opacity: 1,
  text: '',
  debug: {
    boundingBox: false,
    axes: false,
  },
  alignX: 'center',
  alignY: 'center',
  size: 5,
  letterSpacing: 0,
  lineHeight: 1,
  wordSpacing: 0,
  wordBreak: false,
  lineBreak: true,
}

function onResize() {
  renderer.setSize(window.innerWidth, window.innerHeight)
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
}

export async function initScene() {
  canvas = document.querySelector('#canvas')
  scene = new THREE.Scene()
  loader = new THREE.TextureLoader()
  atlas = await loader.loadAsync('./assets/font/Roboto-Regular.png')
  font = new Font(fontsData)
  renderer = new THREE.WebGLRenderer({
    canvas,
  })
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
  )

  camera.position.set(0, 0, 15)
  camera.lookAt(new THREE.Vector3())

  onResize()

  window.addEventListener('resize', onResize)

  return { renderer, camera, scene, font, atlas, loader }
}

function updateGeometry() {
  mesh.geometry.computeGeometry()
  boundingBox.setFromObject(mesh)
}

/**
 * Create debug folder in Tweakpane
 * Display THREE.js helpers
 */
function initDebugGUI() {
  const debugPane = pane.addFolder({
    title: 'Debug',
  })

  helper = new THREE.AxesHelper(10)
  helper.visible = state.debug.axes
  scene.add(helper)

  boundingBox = new THREE.BoxHelper(mesh, 0xffff00)
  boundingBox.visible = state.debug.boundingBox
  scene.add(boundingBox)

  debugPane.addInput(state.debug, 'axes').on('change', () => {
    helper.visible = state.debug.axes
  })

  debugPane.addInput(state.debug, 'boundingBox').on('change', () => {
    boundingBox.visible = state.debug.boundingBox
  })
}

/**
 * Create geometry folder in Tweakpane
 */
function initGeometryGUI() {
  const geoPane = pane.addFolder({
    title: 'Geometry',
  })

  geoPane
    .addInput(state, 'alignX', {
      options: {
        center: 'center',
        left: 'left',
        right: 'right',
      },
    })
    .on('change', () => {
      mesh.geometry.alignX = state.alignX
      updateGeometry()
    })

  geoPane
    .addInput(state, 'alignY', {
      options: {
        center: 'center',
        top: 'top',
        bottom: 'bottom',
      },
    })
    .on('change', () => {
      mesh.geometry.alignY = state.alignY
      updateGeometry()
    })

  geoPane
    .addInput(state, 'size', {
      min: 0.1,
      max: 20,
    })
    .on('change', (e) => {
      mesh.geometry.size = state.size
      updateGeometry()
    })

  geoPane
    .addInput(state, 'letterSpacing', {
      min: 0,
      max: 1,
    })
    .on('change', (e) => {
      mesh.geometry.letterSpacing = state.letterSpacing
      updateGeometry()
    })

  geoPane
    .addInput(state, 'lineHeight', {
      min: 0.5,
      max: 2,
    })
    .on('change', (e) => {
      mesh.geometry.lineHeight = state.lineHeight
      updateGeometry()
    })

  geoPane
    .addInput(state, 'wordSpacing', {
      min: 0,
      max: 1,
    })
    .on('change', (e) => {
      mesh.geometry.wordSpacing = state.wordSpacing
      updateGeometry()
    })

  geoPane.addInput(state, 'wordBreak').on('change', (e) => {
    mesh.geometry.wordBreak = state.wordBreak
    updateGeometry()
  })

  geoPane.addInput(state, 'lineBreak').on('change', (e) => {
    mesh.geometry.lineBreak = state.lineBreak
    updateGeometry()
  })
}

/**
 * Create material folder in Tweakpane
 */
function initMaterialGUI() {
  const matPane = pane.addFolder({
    title: 'Material',
  })

  matPane.addInput(state, 'color').on('change', (e) => {
    mesh.material.color.r = e.value.r / 256
    mesh.material.color.g = e.value.g / 256
    mesh.material.color.b = e.value.b / 256
  })

  matPane
    .addInput(state, 'opacity', {
      min: 0,
      max: 1,
    })
    .on('change', (e) => {
      mesh.material.opacity = e.value
    })
}

function initTypingListeners() {
  window.addEventListener('keypress', (e) => {
    if (e.key.length > 1) return
    if (['Backspace', 'Enter'].indexOf(e.key) > -1) return

    state.text += e.key
    mesh.geometry.updateText(state.text)
    boundingBox.setFromObject(mesh)
  })

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace') state.text = state.text.slice(0, -1)
    if (e.key === 'Enter') state.text += '\n'

    mesh.geometry.updateText(state.text)
    boundingBox.setFromObject(mesh)
  })
}

export function initGUI(m, scene) {
  mesh = m
  state.text = mesh.geometry.text

  initTypingListeners()
  initGeometryGUI()
  initDebugGUI()
  initMaterialGUI()
}
