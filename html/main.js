import * as THREE from "three";
import { GLTFLoader } from "three-gltfloader";
import { TGALoader } from "three-tgaloader";

// HELPER FUNCTIONS

// https://hofk.de/main/discourse.threejs/2021/RoundedRectangle/RoundedRectangle.html
function RoundedRectangle( w, h, r, s ) { // width, height, radius corner, smoothness
		
	// helper const's
	const wi = w / 2 - r;		// inner width
	const hi = h / 2 - r;		// inner height
	const w2 = w / 2;			// half width
	const h2 = h / 2;			// half height
	const ul = r / w;			// u left
	const ur = ( w - r ) / w;	// u right
	const vl = r / h;			// v low
	const vh = ( h - r ) / h;	// v high	
	
	let positions = [
	
		 wi, hi, 0, -wi, hi, 0, -wi, -hi, 0, wi, -hi, 0
		 
	];
	
	let uvs = [
		
		ur, vh, ul, vh, ul, vl, ur, vl
		
	];
	
	let n = [
		
		3 * ( s + 1 ) + 3,  3 * ( s + 1 ) + 4,  s + 4,  s + 5,
		2 * ( s + 1 ) + 4,  2,  1,  2 * ( s + 1 ) + 3,
		3,  4 * ( s + 1 ) + 3,  4, 0
		
	];
	
	let indices = [
		
		n[0], n[1], n[2],  n[0], n[2],  n[3],
		n[4], n[5], n[6],  n[4], n[6],  n[7],
		n[8], n[9], n[10], n[8], n[10], n[11]
		
	];
	
	let phi, cos, sin, xc, yc, uc, vc, idx;
	
	for ( let i = 0; i < 4; i ++ ) {
	
		xc = i < 1 || i > 2 ? wi : -wi;
		yc = i < 2 ? hi : -hi;
		
		uc = i < 1 || i > 2 ? ur : ul;
		vc = i < 2 ? vh : vl;
			
		for ( let j = 0; j <= s; j ++ ) {
		
			phi = Math.PI / 2  *  ( i + j / s );
			cos = Math.cos( phi );
			sin = Math.sin( phi );

			positions.push( xc + r * cos, yc + r * sin, 0 );

			uvs.push( uc + ul * cos, vc + vl * sin );
					
			if ( j < s ) {
			
				idx =  ( s + 1 ) * i + j + 4;
				indices.push( i, idx, idx + 1 );
				
			}
			
		}
		
	}
		
	const geometry = new THREE.BufferGeometry( );
	geometry.setIndex( new THREE.BufferAttribute( new Uint32Array( indices ), 1 ) );
	geometry.setAttribute( 'position', new THREE.BufferAttribute( new Float32Array( positions ), 3 ) );
	geometry.setAttribute( 'uv', new THREE.BufferAttribute( new Float32Array( uvs ), 2 ) );
	
	return geometry;	
	
}

// ACTUAL CODE

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
let faceType = 0;
gltfLoader.load(`models/head/mesh/shape_${268 + faceType}.glb`, gltf => {
    gltf.scene.scale.set(.008, .008, .008);
    gltf.scene.position.x = 0;
    gltf.scene.position.y = 1.2;
	gltf.scene.position.z = 0;
    const material = new THREE.MeshStandardMaterial({ "color": 0xFDD3AE });
    for(const child of gltf.scene.children)
        child.material = material;
    scene.add(gltf.scene);
}, undefined, console.error);

let angle = 0;
const dist = 12.5;
const positions = [];
for(let _i = 0; _i < 10; _i++) {
    positions.push([dist * Math.cos(angle), dist * Math.sin(angle)]);
    angle += Math.PI / 5;
}

for(const position of positions) {
    gltfLoader.load("models/community.gltf", gltf => {
        gltf.scene.scale.set(.4, .4, .4);
        gltf.scene.position.x = position[0];
        gltf.scene.position.y = 5;
        gltf.scene.position.z = position[1];
        const material = new THREE.MeshPhysicalMaterial({
            "roughness": 0,
            "transmission": 1,
            "thickness": .8
        });
        for(const child of gltf.scene.children)
            child.material = material;
        gltf.scene.rotation.y = Math.PI / 2;
        scene.add(gltf.scene);
        communities.push(gltf.scene);
    }, undefined, console.error);
}

const tgaLoader = new TGALoader();

waitForData().then(() => {
    for(let i = 0; i < positions.length; i++) {
        if(!data[i]?.icon) continue;
        tgaLoader.load("data:application/octet-stream;base64," + data[i].icon, tga => {
            const iconPlane = RoundedRectangle(2.2, 2.2, .4, 18);
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

const animate = () => {
	renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    renderer.setSize(window.innerWidth, window.innerHeight);
});