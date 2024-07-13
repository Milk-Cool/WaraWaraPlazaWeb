import * as THREE from "three";
import { GLTFLoader } from "three-gltfloader";
import { TGALoader } from "three-tgaloader";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xE4EFED);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 17;
camera.position.y = 7;
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
floorTexture.repeat.set(2000, 2000);
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

const gltfLoader = new GLTFLoader();

const miis = [];
const communities = [];
const icons = [];

gltfLoader.load("models/body/Female.gltf", gltf => {
    gltf.scene.position.x = 0;
    gltf.scene.position.y = 0;
	gltf.scene.position.z = 0;	
    scene.add(gltf.scene);
    miis.push(gltf.scene);
}, undefined, console.error);

gltfLoader.load("models/community.gltf", gltf => {
    gltf.scene.scale.set(.5, .5, .5);
    gltf.scene.position.x = 0;
    gltf.scene.position.y = 5;
	gltf.scene.position.z = 0;
    const material = new THREE.MeshPhysicalMaterial({
        "roughness": 0,
        "transmission": 1,
        "thickness": 2
    });
    for(const child of gltf.scene.children)
        child.material = material;
    gltf.scene.rotation.y = Math.PI / 2;
    scene.add(gltf.scene);
    communities.push(gltf.scene);
}, undefined, console.error);

const tgaLoader = new TGALoader();

const icon = tgaLoader.load("textures/test_community.tga", tga => {
    const iconPlane = new THREE.PlaneGeometry(2.6, 2.6, 1, 1);
    const iconMaterial = new THREE.MeshPhongMaterial({
        "map": tga,
        "shading": THREE.FlatShading
    });
    const iconMesh = new THREE.Mesh(iconPlane, iconMaterial);
    iconMesh.position.y = 5;
    iconMesh.material.side = THREE.DoubleSide;
    scene.add(iconMesh);
    icons.push(iconMesh);
}, undefined, console.error);

const animate = () => {
    for(const community of communities)
        community.rotation.y += 0.01;
    for(const icon of icons)
        icon.rotation.y += 0.01;
	renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    renderer.setSize(window.innerWidth, window.innerHeight);
});