import * as THREE from "three";
import { GLTFLoader } from "three-gltfloader";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xE4EFED);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 35;
camera.position.y = 13;
camera.rotation.x = -.3;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const light = new THREE.DirectionalLight();
scene.add(light);
const ambientLight = new THREE.AmbientLight(0xffffff, 2);
scene.add(ambientLight);

const floor = new THREE.PlaneGeometry(1000, 1000, 1, 1);
const floorTexture = (new THREE.TextureLoader()).load("textures/floor.png");
floorTexture.wrapS = THREE.RepeatWrapping;
floorTexture.wrapT = THREE.RepeatWrapping;
floorTexture.repeat.set(1000, 1000);
console.log(floorTexture);
const floorMaterial = new THREE.MeshPhongMaterial({
    "map": floorTexture,
    "shading": THREE.FlatShading
});
const floorMesh = new THREE.Mesh(floor, floorMaterial);
floorMesh.position.y = 0;
floorMesh.rotation.x = -Math.PI / 2;
floorMesh.rotation.z = Math.PI / 4;
floorMesh.material.side = THREE.DoubleSide;
scene.add(floorMesh);

const loader = new GLTFLoader();

const miis = [];

loader.load("models/body/Female.gltf", gltf => {
    gltf.scene.scale.set(2,2,2,);
    gltf.scene.position.x = 0;
    gltf.scene.position.y = 0;
	gltf.scene.position.z = 0;	
    scene.add(gltf.scene);
    miis.push(gltf.scene);
}, undefined, console.error);

const animate = () => {
    for(const mii of miis)
        mii.rotation.y += 0.01;
	renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    renderer.setSize(window.innerWidth, window.innerHeight);
});