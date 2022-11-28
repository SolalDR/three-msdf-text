/**
 * @author SolalDR
 * @link https://solaldr.github.io/three-msdf-text/public/demo/small-text.html
 */

import { TextGeometry, extendMSDFMaterial } from '../../src/index'
import { initGUI, initScene } from './utils/common'

async function init() {
  const { renderer, camera, scene, font, atlas, loader } = await initScene()

  const state = {
    text: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Sagittis aliquam malesuada bibendum arcu vitae elementum. Ullamcorper malesuada proin libero nunc. Tortor pretium viverra suspendisse potenti nullam ac. Gravida dictum fusce ut placerat. Sit amet consectetur adipiscing elit ut aliquam purus. Justo nec ultrices dui sapien eget mi. Varius morbi enim nunc faucibus a pellentesque sit amet. Elit sed vulputate mi sit amet mauris. In ornare quam viverra orci sagittis eu volutpat. Nunc pulvinar sapien et ligula ullamcorper malesuada proin libero. Quam adipiscing vitae proin sagittis nisl rhoncus mattis rhoncus urna. Fringilla phasellus faucibus scelerisque eleifend donec pretium vulputate sapien. Nibh mauris cursus mattis molestie a iaculis at. Risus commodo viverra maecenas accumsan. Senectus et netus et malesuada fames ac turpis egestas.
    
    Sem integer vitae justo eget magna. Mattis enim ut tellus elementum sagittis vitae et leo. Facilisis leo vel fringilla est ullamcorper eget nulla facilisi. Ultricies leo integer malesuada nunc vel risus. Urna cursus eget nunc scelerisque. Lacus laoreet non curabitur gravida. Nulla facilisi morbi tempus iaculis urna id volutpat lacus laoreet. Imperdiet nulla malesuada pellentesque elit eget gravida cum sociis. Aliquam etiam erat velit scelerisque in dictum non. Mollis aliquam ut porttitor leo a diam sollicitudin tempor id. Dictum varius duis at consectetur lorem donec massa sapien faucibus. Posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque egestas diam in arcu cursus euismod. Consequat id porta nibh venenatis. Morbi enim nunc faucibus a. Commodo sed egestas egestas fringilla phasellus faucibus scelerisque.

    Fermentum posuere urna nec tincidunt praesent semper feugiat nibh. Cursus risus at ultrices mi tempus imperdiet. Nisl nunc mi ipsum faucibus vitae aliquet nec. At auctor urna nunc id cursus metus aliquam eleifend. Donec ultrices tincidunt arcu non sodales neque. Sodales ut etiam sit amet nisl purus in mollis. Neque sodales ut etiam sit. Sit amet nisl purus in mollis nunc sed id. Bibendum est ultricies integer quis auctor elit sed vulputate mi. Sit amet aliquam id diam maecenas ultricies. Neque sodales ut etiam sit amet nisl. Ultrices tincidunt arcu non sodales neque. Risus viverra adipiscing at in tellus. Luctus venenatis lectus magna fringilla urna porttitor. Urna porttitor rhoncus dolor purus non enim praesent elementum.

    Nunc eget lorem dolor sed viverra ipsum. Risus ultricies tristique nulla aliquet enim. Adipiscing commodo elit at imperdiet dui accumsan sit amet. Vestibulum sed arcu non odio euismod lacinia. In ante metus dictum at tempor commodo ullamcorper. Tellus rutrum tellus pellentesque eu. Velit scelerisque in dictum non consectetur a erat nam. Tincidunt ornare massa eget egestas. Ac tortor vitae purus faucibus ornare suspendisse sed. Posuere ac ut consequat semper viverra. Neque egestas congue quisque egestas diam. Turpis egestas pretium aenean pharetra. In vitae turpis massa sed elementum. Blandit libero volutpat sed cras ornare arcu dui vivamus arcu. Praesent elementum facilisis leo vel fringilla est ullamcorper eget. Sit amet commodo nulla facilisi nullam vehicula. Ultricies leo integer malesuada nunc vel risus. Phasellus vestibulum lorem sed risus. Quis viverra nibh cras pulvinar mattis nunc sed blandit libero. Ligula ullamcorper malesuada proin libero.
    `,
  }

  const geometry = new TextGeometry({
    font: font,
    text: state.text,
    size: 0.3,
    alignY: 'center',
    alignX: 'left',
    lineHeight: 1.2,
    width: 26,
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
      threshold: 0.1,
    },
  )

  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.x = -13
  initGUI(mesh, scene)

  pane
    .addInput(material, 'threshold', {
      min: 0,
      max: 0.1,
    })
    .on('change', () => {
      material.needsUpdate = true
    })

  scene.add(mesh)

  function loop() {
    renderer.render(scene, camera)
    requestAnimationFrame(loop)
  }
  loop()
}

window.addEventListener('load', init)
