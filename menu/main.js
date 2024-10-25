import * as THREE from './lib/three.module.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 0.1, 1000 );
const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

var sphereGeom =  new THREE.SphereGeometry( 2 );
var greenMaterial = new THREE.MeshBasicMaterial( { color: 0x00ff00, transparent: true, opacity: 0.5 } );
var sphere = new THREE.Mesh( sphereGeom, greenMaterial );
scene.add(sphere);

// const geometry = new THREE.BoxGeometry( 1, 1, 1 );
// const material = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
// const cube = new THREE.Mesh( geometry, material );
// scene.add( cube );
camera.position.z = 10;

function animate() {
    sphere.rotation.x += 0.01;
    sphere.rotation.y += 0.01;
    renderer.render( scene, camera );
}

renderer.setAnimationLoop( animate );
