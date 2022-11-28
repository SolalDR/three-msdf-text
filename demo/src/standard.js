import { TextGeometry, extendMSDFMaterial } from '../../src/index'
import { initGUI, initScene } from './utils/common'

async function init() {
  const { renderer, camera, scene, font, atlas, loader } = await initScene()
  const map = await loader.loadAsync('./assets/img/diffuse.jpeg')
  const normal = await loader.loadAsync('./assets/img/normal.jpeg')
  map.wrapS = map.wrapT = THREE.RepeatWrapping
  normal.wrapS = normal.wrapT = THREE.RepeatWrapping

  const geometry = new TextGeometry({
    font: font,
    text: 'Hello World',
    size: 5,
    alignY: 'center',
    alignX: 'center',
    uv: true,
    lineHeight: 1,
    normal: true,
    width: 5,
    height: 5,
  })

  let material = extendMSDFMaterial(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      side: THREE.DoubleSide,
      map: map,
      metalness: 0.5,
      roughness: 0.5,
      normalMap: normal,
    }),
    {
      atlas,
    },
  )

  const mesh = new THREE.Mesh(geometry, material)
  initGUI(mesh, scene)

  scene.add(mesh)

  const pointLight = new THREE.PointLight(0xffffff, 1)
  pointLight.position.set(0, 0, 10)
  scene.add(pointLight)

  const pointLight2 = new THREE.PointLight(0xffffff, 0.5)
  pointLight2.position.set(-3, 3, 10)
  scene.add(pointLight2)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
  directionalLight.position.set(-3, 3, 10)
  directionalLight.lookAt(new THREE.Vector3())
  scene.add(directionalLight)

  function loop() {
    renderer.render(scene, camera)
    mesh.rotation.y += 0.01
    requestAnimationFrame(loop)
  }
  loop()
}

window.addEventListener('load', init)
