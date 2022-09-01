import * as Package from '../../src/index'
import * as THREE from 'three';

function init() {
  const canvas = document.querySelector('#canvas');
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
  camera.position.set(0, 3, 5)
  camera.lookAt(new THREE.Vector3())
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas
  });
  renderer.setSize( window.innerWidth, window.innerHeight );
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  scene.add(new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshNormalMaterial()));

  function loop() {
    renderer.render(scene, camera);
    scene.children[0].rotation.y += 0.01
    requestAnimationFrame(loop);
  }
  loop();
}

window.addEventListener('load', init)