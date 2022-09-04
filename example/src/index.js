import { Font, MSDFGeometry } from '../../src/index'
import * as THREE from 'three';
import fontsData from './font/font.json';
import { MeshBasicMaterial } from 'three';
import { extendMaterial } from '../../src/MSDFMaterial';

async function init() {
  const canvas = document.querySelector('#canvas');
  const scene = new THREE.Scene();

  const loader = new THREE.TextureLoader();
  const texture = await loader.loadAsync('/dist/font/font.png')
  const map = await loader.loadAsync('/dist/uv_test.jpeg')

  const font = new Font(fontsData);

  console.time()
  const geometry = new MSDFGeometry({
    font,
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc a ante turpis. Aliquam diam urna, malesuada vel nibh vel, cursus dapibus risus. Suspendisse eu odio risus. Aenean id purus vitae purus pretium accumsan id elementum odio. Mauris elit odio, condimentum id massa in, lobortis hendrerit metus. In non tellus vitae ipsum eleifend facilisis vel vel sapien. Proin sed metus euismod, ornare velit semper, tempus quam. Sed pellentesque volutpat sapien, nec scelerisque risus volutpat at.",
    width: 15,
    size: 1,
    align: 'left',
    useUv: true,
    lineHeight: 1
  })
  console.timeEnd()

  // const material = new MSDFMaterial({ atlas: texture });
  let material = extendMaterial(new MeshBasicMaterial({
    color: 0xFFFFFF,
    opacity: 0.5,
    transparent: true,
    side: THREE.DoubleSide,
    map: map
  }), {
    atlas: texture
  })

  // material.onBeforeCompile = (shader) => {
  //   console.log(shader)
  // }

  // material = new MSDFBasicMaterial({
  //   color: 0xFF0000,
  //   opacity: 0.5,
  //   transparent: true,
  //   side: THREE.DoubleSide
  // })

  console.log(geometry, material);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = 10
  mesh.position.x = -10


  const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
  camera.position.set(0, 0, 15)
  camera.lookAt(new THREE.Vector3())
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas
  });

  renderer.setSize( window.innerWidth, window.innerHeight );
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  // scene.add(new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshBasicMaterial({
  //   map: texture
  // })));

  scene.add(mesh);

  function loop() {
    renderer.render(scene, camera);
    // mesh.rotation.y += 0.01
    requestAnimationFrame(loop);
  }
  loop();
}

window.addEventListener('load', init)