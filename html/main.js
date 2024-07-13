import * as THREE from "three";
import { GLTFLoader } from "three-gltfloader";
import { TGALoader } from "three-tgaloader";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xE4EFED);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 20;
camera.position.y = 10;
camera.rotation.x = -.5;

let data = null;
fetch("/data").then(resp => resp.json()).then(json => data = json);
const checkForData = resolve => {
    if(data === null) setTimeout(checkForData, 1, resolve);
    else resolve();
}
const waitForData = () => new Promise(checkForData);

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

let angle = Math.PI / 4;
const dist = 12.5;
const positions = [];
for(let _i = 0; _i < 10; _i++) {
    positions.push([dist * Math.cos(angle), dist * Math.sin(angle)]);
    angle += Math.PI / 5;
}

for(const position of positions) {
    gltfLoader.load("models/community.gltf", gltf => {
        gltf.scene.scale.set(.5, .5, .5);
        gltf.scene.position.x = position[0];
        gltf.scene.position.y = 5;
        gltf.scene.position.z = position[1];
        const material = new THREE.MeshPhysicalMaterial({
            "roughness": 0,
            "transmission": 1,
            "thickness": 2
        });
        for(const child of gltf.scene.children)
            child.material = material;
        scene.add(gltf.scene);
        communities.push(gltf.scene);
    }, undefined, console.error);
}

const tgaLoader = new TGALoader();

waitForData().then(() => {
    for(let i = 0; i < positions.length; i++) {
        if(!data[i]?.icon) continue;
        tgaLoader.load("data:application/octet-stream;base64," + data[i].icon, tga => {
            const iconPlane = new THREE.PlaneGeometry(2.6, 2.6, 1, 1);
            const iconMaterial = new THREE.MeshPhongMaterial({
                "map": tga,
                "shading": THREE.FlatShading
            });
            const iconMesh = new THREE.Mesh(iconPlane, iconMaterial);
            iconMesh.position.x = positions[i][0];
            iconMesh.position.y = 5;
            iconMesh.position.z = positions[i][1];
            iconMesh.material.side = THREE.DoubleSide;
            scene.add(iconMesh);
            icons.push(iconMesh);
        }, undefined, console.error);
    }
});

let rot = 0;
const animate = () => {
    rot += .01;
    for(const community of communities)
        community.rotation.y = Math.PI / 2 + rot;
    for(const icon of icons)
        icon.rotation.y = rot;
	renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    renderer.setSize(window.innerWidth, window.innerHeight);
});