/**
 * @author SolalDR
 * @link https://solaldr.github.io/three-msdf-text/public/demo/shader.html
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
  })

  const vertexShader = `
    #include <msdf_char_uv_pars_vertex>
    void main() {
      #include <msdf_char_uv_vertex>
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `

  const fragmentShader = `
    #include <msdf_alphatest_pars_fragment>

    void main() {
      vec4 diffuseColor = vec4(1.0, 1.0, 1.0, 1.0);
      #include <msdf_alphatest_fragment>

      gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    }
  `

  let material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uAtlas: { value: atlas },
    },
    transparent: true,
    defines: {
      USE_MSDF_GEOMETRY: '1.0',
    },
  })

  const mesh = new THREE.Mesh(geometry, material)
  initGUI(mesh, scene, {
    material: false,
  })

  scene.add(mesh)

  function loop() {
    renderer.render(scene, camera)
    requestAnimationFrame(loop)
  }
  loop()
}

window.addEventListener('load', init)
