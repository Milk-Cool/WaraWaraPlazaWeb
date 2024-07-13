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

THREE.Cache.enabled = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xE4EFED);
const MII_DEBUG = false;
const camera = new THREE.PerspectiveCamera(MII_DEBUG ? 25 : 75, window.innerWidth / window.innerHeight, 0.1, 1000);
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

const favoriteColors = [
    0xD4391F,
    0xF56E29,
    0xFED93A,
    0x78D32C,
    0x377930,
    0x0C49B3,
    0x3CAADF,
    0xF1597C,
    0x774CAE,
    0x483817,
    0xE0E0E0,
    0x181914
];
const eyeColors = [
    0x000000,
    0x6C7071,
    0x663C2C,
    0x605D30,
    0x4554A7,
    0x397158
];

let angle = 0;
const dist = 12.5;
const positions = [];
for(let _i = 0; _i < 10; _i++) {
    positions.push([dist * Math.cos(angle), dist * Math.sin(angle)]);
    angle += Math.PI / 5;
}

/**
 * 
 * @param {THREE.Texture} img The source image
 * @param {THREE.ColorRepresentation} r The color to replace red parts with
 * @param {THREE.ColorRepresentation} g The color to replace green parts with
 * @param {THREE.ColorRepresentation} b The color to replace blue parts with
 * 
 * @returns {THREE.CanvasTexture} The resulting texture
 */
const colorCorrect = (img, r, g, b) => {
    const canvas = document.createElement("canvas");
    canvas.width = img.source.data.width;
    canvas.height = img.source.data.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img.source.data, 0, 0);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for(let i = 0; i < imgData.data.length; i += 4) {
        const irgb = imgData.data.slice(i, i + 3).map(x => x / 256);
        imgData.data[i] = 
            Math.floor(r / 65536) * irgb[0]
            + Math.floor(g / 65536) * irgb[1]
            + Math.floor(b / 65536) * irgb[2];
        imgData.data[i + 1] = 
            (Math.floor(r / 256) % 256) * irgb[0]
            + (Math.floor(g / 256) % 256) * irgb[1]
            + (Math.floor(b / 256) % 256) * irgb[2];
        imgData.data[i + 2] = 
            (r % 256) * irgb[0]
            + (g % 256) * irgb[1]
            + (b % 256) * irgb[2];
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    canvas.remove();
    return texture;
}

/** 
 * Loads a Mii onto the screen.
 * 
 * @param {object} mii The Mii data
 * @param {{ x: number, z: number }} pos The Mii position
 * @param {number} commid The community number
 */
const loadMii = (mii, pos, commid) => {
    miis.push({});
    const n = miis.length - 1;
    gltfLoader.load(mii.gender ? "models/body/Female.gltf" : "models/body/Male.gltf", gltf => {
        gltf.scene.position.x = pos.x;
        gltf.scene.position.y = 0;
        gltf.scene.position.z = pos.z;	
        scene.add(gltf.scene);
        const color = favoriteColors[mii.favoriteColor];
        const material = new THREE.MeshStandardMaterial({ "color": color });
        gltf.scene.children[mii.gender ? 1 : 0].material = material;
        miis[n].body = gltf.scene;
    }, undefined, console.error);
    gltfLoader.load(`models/head/mesh/shape_${268 + mii.faceType}.glb`, gltf => {
        gltf.scene.scale.set(.008, .008, .008);
        gltf.scene.position.x = pos.x;
        gltf.scene.position.y = 1.2;
        gltf.scene.position.z = pos.z;
        const material = new THREE.MeshStandardMaterial({ "color": 0xFDD3AE });
        for(const child of gltf.scene.children)
            child.material = material;
        scene.add(gltf.scene);
        miis[n].head = gltf.scene;
    }, undefined, console.error);
    gltfLoader.load(`models/head/mesh/shape_${329 + mii.hairType}.glb`, gltf => {
        gltf.scene.scale.set(.008, .008, .008);
        gltf.scene.position.x = pos.x;
        gltf.scene.position.y = 1.15;
        gltf.scene.position.z = pos.z;
        const material = new THREE.MeshStandardMaterial({ "color": 0x7B3A14 });
        for(const child of gltf.scene.children)
            child.material = material;
        scene.add(gltf.scene);
        miis[n].hair = gltf.scene;
    }, undefined, console.error);
    imgLoader.load(`models/head/tex/tex_${135 + mii.eyeType}.png`, img => {
        let m = 0;
        miis[n].eyes = [];
        for(let i = -0.05; i <= 0.05; i += 0.1) {
            const eyePlane = new THREE.PlaneGeometry(.1, .1, 1, 1);
            const eyeMaterial = new THREE.MeshPhongMaterial({
                "map": colorCorrect(img, 0, 0xffffff, eyeColors[mii.eyeColor]),
                "shading": THREE.FlatShading,
                "transparent": true
            });
            const eyeMesh = new THREE.Mesh(eyePlane, eyeMaterial);
            eyeMesh.position.x = pos.x + i * (1 + mii.eyeSpacing * 0.27);
            eyeMesh.position.y = 1.5;
            eyeMesh.position.z = pos.z + .2;
            eyeMesh.material.side = THREE.DoubleSide;
            if(i > 0) eyeMesh.rotation.y = Math.PI;
            scene.add(eyeMesh);
            miis[n].eyes[m++] = eyeMesh;
        }
    }, undefined, console.error);
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

const imgLoader = new THREE.TextureLoader();

let i = -30;
waitForData().then(() => {
    for(const comm of data)
        for(const person of comm.people)
            loadMii(person.mii, { "x": i++, "z": 0 }, comm.position - 1);
});

const animate = () => {
	renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    renderer.setSize(window.innerWidth, window.innerHeight);
});