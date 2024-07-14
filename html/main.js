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
const ROT_DEBUG = false;
const OPT_DEBUG = true;
const camera = new THREE.PerspectiveCamera(MII_DEBUG ? 15 : 75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 20 - Number(OPT_DEBUG) * 60;
camera.position.y = 10;
camera.rotation.x = -.5;

// Controls
const held = {
    "left": false,
    "right": false,
    "forward": false,
    "backward": false,
    "zoom_in": false,
    "zoom_out": false
};
const map = {
    "ArrowLeft": "left",
    "a": "left",
    "ArrowUp": "forward",
    "w": "forward",
    "ArrowDown": "backward",
    "s": "backward",
    "ArrowRight": "right",
    "d": "right",
    "-": "zoom_out",
    "_": "zoom_out",
    ",": "zoom_out",
    "+": "zoom_in",
    "=": "zoom_in",
    ".": "zoom_in",
};
document.addEventListener("keydown", e => {
    const { key } = e;
    const mapped = map[key];
    held[mapped] = true;
});
document.addEventListener("keyup", e => {
    const { key } = e;
    const mapped = map[key];
    held[mapped] = false;
});
setInterval(() => {
    if(held.left) camera.position.x -= .1;
    if(held.right) camera.position.x += .1;
    if(held.forward) camera.position.z -= .1;
    if(held.backward) camera.position.z += .1;
    if(held.zoom_in) camera.fov -= .1;
    if(held.zoom_out) camera.fov += .1;
    camera.updateProjectionMatrix();
}, 1);

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
const skinColors = [
    0xFDD3AE,
    0xFCC58E,
    0xFBB56A,
    0xAD5128,
    0x632C18,
    0xFABEA6,
    0xF8A98C,
    0xDE7941,
    0x8C3C23,
    0x3B2D22
];
const hairColors = [
    0x000000,
    0x402011,
    0x5C180B,
    0x7B3A14,
    0x777880,
    0x4E3E10,
    0x875818,
    0xD1A04A
];
const mouthColors = [
    0xD85422,
    0xF14225,
    0xF24849,
    0xF09A72,
    0x8C5040
];
const glassesColors = [
    0x000000,
    0x5F380F,
    0xAA2C17,
    0x203169,
    0xA8601C,
    0x787069
];

let angle = 0;
const dist = 12.5;
const positions = [];
for(let _i = 0; _i < 10; _i++) {
    positions.push([dist * Math.cos(angle), dist * Math.sin(angle)]);
    angle += Math.PI / 5;
}

const cacheGLTF = {};
const loadGLTF = (url, onDone, onProgress, onError) => {
    if(url in cacheGLTF) onDone(cacheGLTF[url].clone());
    gltfLoader.load(url, gltf => {
        cacheGLTF[url] = gltf;
        onDone(gltf);
    }, onProgress, onError);
}

const cacheImg = {};
const loadImg = (url, onDone, onProgress, onError) => {
    if(url in cacheGLTF) onDone(cacheImg[url].clone());
    imgLoader.load(url, img => {
        cacheImg[url] = img;
        onDone(img);
    }, onProgress, onError);
}

/**
 * @param {THREE.Texture} img The source image
 * @param {THREE.ColorRepresentation} r The color to replace red parts with (RGB)
 * @param {THREE.ColorRepresentation} g The color to replace green parts with (RGB)
 * @param {THREE.ColorRepresentation} b The color to replace blue parts with (RGB)
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
 * @param {THREE.Texture} img The source image
 * @param {THREE.ColorRepresentation} b The color to replace black parts with (RGBA)
 * @param {THREE.ColorRepresentation} w The color to replace white parts with (RGBA)
 * 
 * @returns {THREE.CanvasTexture} The resulting texture
 */
const colorCorrectBWA = (img, b, w) => {
    const canvas = document.createElement("canvas");
    canvas.width = img.source.data.width;
    canvas.height = img.source.data.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img.source.data, 0, 0);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for(let i = 0; i < imgData.data.length; i += 4) {
        const gs = imgData.data.slice(i, i + 3).map(x => x / 256).reduce((a, b) => a + b, 0) / 3;
        imgData.data[i] = 
            (Math.floor(b / 16777216) % 256) * (1 - gs)
            + (Math.floor(w / 16777216) % 256) * gs;
        imgData.data[i + 1] = 
            (Math.floor(b / 65536) % 256) * (1 - gs)
            + (Math.floor(w / 65536) % 256) * gs;
        imgData.data[i + 2] = 
            (Math.floor(b / 256) % 256) * (1 - gs)
            + (Math.floor(w / 256) % 256) * gs;
        imgData.data[i + 3] =
            (b % 256) * (1 - gs)
            + (w % 256) * gs;
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    canvas.remove();
    return texture;
}

/**
 * @param {THREE.Texture} img The source image
 * @param {THREE.ColorRepresentation} b The color to replace black parts with (RGB)
 * @param {THREE.ColorRepresentation} w The color to replace white parts with (RGB)
 * 
 * @returns {THREE.CanvasTexture} The resulting texture
 */
const colorCorrectBW = (img, b, w) => {
    const canvas = document.createElement("canvas");
    canvas.width = img.source.data.width;
    canvas.height = img.source.data.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img.source.data, 0, 0);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for(let i = 0; i < imgData.data.length; i += 4) {
        const gs = imgData.data.slice(i, i + 3).map(x => x / 256).reduce((a, b) => a + b, 0) / 3;
        imgData.data[i] = 
            (Math.floor(b / 65536) % 256) * (1 - gs)
            + (Math.floor(w / 65536) % 256) * gs;
        imgData.data[i + 1] = 
            (Math.floor(b / 256) % 256) * (1 - gs)
            + (Math.floor(w / 256) % 256) * gs;
        imgData.data[i + 2] = 
            (b % 256) * (1 - gs)
            + (w % 256) * gs;
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
    loadGLTF(mii.gender ? "models/body/Female.gltf" : "models/body/Male.gltf", gltf => {
        gltf.scene.position.x = pos.x;
        gltf.scene.position.y = 0;
        gltf.scene.position.z = pos.z;	
        scene.add(gltf.scene);
        const color = favoriteColors[mii.favoriteColor];
        const material = new THREE.MeshBasicMaterial({ "color": color });
        gltf.scene.children[mii.gender ? 1 : 0].material = material;
        miis[n].body = gltf.scene;
    }, undefined, console.error);
    loadGLTF(`models/head/mesh/shape_${268 + mii.faceType}.glb`, gltf => {
        gltf.scene.scale.set(.008, .008, .008);
        gltf.scene.position.x = pos.x;
        gltf.scene.position.y = 1.2;
        gltf.scene.position.z = pos.z;
        const material = new THREE.MeshBasicMaterial({ "color": skinColors[mii.skinColor] });
        for(const child of gltf.scene.children)
            child.material = material;
        scene.add(gltf.scene);
        miis[n].head = gltf.scene;
    }, undefined, console.error);
    loadGLTF(`models/head/mesh/shape_${329 + mii.hairType}.glb`, gltf => {
        gltf.scene.scale.set(.008, .008, .008);
        gltf.scene.position.x = pos.x;
        gltf.scene.position.y = 1.15;
        gltf.scene.position.z = pos.z;
        const material = new THREE.MeshBasicMaterial({ "color": hairColors[mii.hairColor] });
        for(const child of gltf.scene.children)
            child.material = material;
        scene.add(gltf.scene);
        miis[n].hair = gltf.scene;
    }, undefined, console.error);
    loadImg(`models/head/tex/tex_${135 + mii.eyeType}.png`, img => {
        let m = 0;
        miis[n].eyes = [];
        for(let i = -0.05; i <= 0.05; i += 0.1) {
            const scale = .1 * (1 + (mii.eyeScale - 4) * 0.15);
            const multSY = 1 + (mii.eyeVerticalStretch - 3) * 0.17;
            const eyePlane = new THREE.PlaneGeometry(scale, scale * multSY, 1, 1);
            const eyeMaterial = new THREE.MeshBasicMaterial({
                "map": colorCorrect(img, 0, 0xffffff, eyeColors[mii.eyeColor]),
                "shading": THREE.FlatShading,
                "transparent": true
            });
            const eyeMesh = new THREE.Mesh(eyePlane, eyeMaterial);
            eyeMesh.position.x = pos.x + i * (1 + mii.eyeSpacing * 0.27);
            eyeMesh.position.y = 1.45 - (mii.eyeYPosition - 12) * 0.007;
            eyeMesh.position.z = pos.z + .2;
            eyeMesh.rotation.z = (-Math.PI / 15) * (mii.eyeRotation - 4);
            // eyeMesh.material.side = THREE.DoubleSide;
            if(i > 0) {
                eyeMesh.rotation.y = Math.PI;
                eyeMesh.material.side = THREE.BackSide;
            }
            scene.add(eyeMesh);
            miis[n].eyes[m++] = eyeMesh;
        }
    }, undefined, console.error);
    loadImg(`models/head/tex/tex_${215 + mii.eyebrowType}.png`, img => {
        let m = 0;
        miis[n].eyebrows = [];
        for(let i = -0.05; i <= 0.05; i += 0.1) {
            const scale = .1 * (1 + (mii.eyebrowScale - 4) * 0.15);
            const multSY = 1 + (mii.eyebrowVerticalStretch - 3) * 0.17;
            const eyebrowPlane = new THREE.PlaneGeometry(scale, scale * multSY, 1, 1);
            const eyebrowMaterial = new THREE.MeshPhongMaterial({
                "map": colorCorrectBWA(img, 0, hairColors[mii.eyebrowColor] * 0x100 + 0xff),
                "shading": THREE.FlatShading,
                "transparent": true
            });
            const eyebrowMesh = new THREE.Mesh(eyebrowPlane, eyebrowMaterial);
            eyebrowMesh.position.x = pos.x + i * (1 + mii.eyebrowSpacing * 0.27);
            eyebrowMesh.position.y = 1.48 - (mii.eyebrowYPosition - 12) * 0.007;
            eyebrowMesh.position.z = pos.z + .2;
            eyebrowMesh.rotation.z = (-Math.PI / 15) * (mii.eyebrowRotation - 6);
            // eyebrowMesh.material.side = THREE.DoubleSide;
            if(i > 0) {
                eyebrowMesh.rotation.y = Math.PI;
                eyebrowMesh.material.side = THREE.BackSide;
            }
            scene.add(eyebrowMesh);
            miis[n].eyebrows[m++] = eyebrowMesh;
        }
    }, undefined, console.error);
    loadImg(`models/head/tex/tex_${347 + mii.noseType}.png`, img => {
        const scale = .1 * (1 + (mii.noseScale - 5) * 0.15);
        const nosePlane = new THREE.PlaneGeometry(scale, scale, 1, 1);
        const noseMaterial = new THREE.MeshBasicMaterial({
            "map": colorCorrectBWA(img, 0, 0x000000ff),
            "shading": THREE.FlatShading,
            "transparent": true
        });
        const noseMesh = new THREE.Mesh(nosePlane, noseMaterial);
        noseMesh.position.x = pos.x;
        noseMesh.position.y = 1.4 - (mii.noseYPosition - 9) * 0.007;
        noseMesh.position.z = pos.z + .2;
        // noseMesh.material.side = THREE.DoubleSide;
        scene.add(noseMesh);
        miis[n].nose = noseMesh;
    }, undefined, console.error);
    loadImg(`models/head/tex/tex_${289 + mii.mouthType}.png`, img => {
        const scale = .1 * (1 + (mii.mouthScale - 4) * 0.15);
        const multSY = 1 + (mii.mouthHorizontalStretch - 3) * 0.17;
        const mouthPlane = new THREE.PlaneGeometry(scale, scale * multSY, 1, 1);
        const mouthMaterial = new THREE.MeshBasicMaterial({
            "map": colorCorrect(img, mouthColors[mii.mouthColor],
                Math.floor(mouthColors[mii.mouthColor] / 65536) * 0.8 * 65536
                + Math.floor(mouthColors[mii.mouthColor] / 256) % 256 * 0.8 * 256
                + mouthColors[mii.mouthColor] % 256 * 0.8,
                0xffffff),
            "shading": THREE.FlatShading,
            "transparent": true
        });
        const mouthMesh = new THREE.Mesh(mouthPlane, mouthMaterial);
        mouthMesh.position.x = pos.x;
        mouthMesh.position.y = 1.3 - (mii.mouthYPosition - 13) * 0.007;
        mouthMesh.position.z = pos.z + .2;
        // mouthMesh.material.side = THREE.DoubleSide;
        scene.add(mouthMesh);
        miis[n].mouth = mouthMesh;
    }, undefined, console.error);
    loadImg(`models/head/tex/tex_${341 + mii.mustacheType}.png`, img => {
        let m = 0;
        miis[n].mustache = [];
        for(let i = -0.05; i <= 0.05; i += 0.1) {
            const scale = .1 * (1 + (mii.mustacheScale - 4) * 0.15);
            const mustachePlane = new THREE.PlaneGeometry(scale, scale, 1, 1);
            const mustacheMaterial = new THREE.MeshBasicMaterial({
                "map": colorCorrectBWA(img, 0, hairColors[mii.facialHairColor] * 0x100 + 0xff),
                "shading": THREE.FlatShading,
                "transparent": true
            });
            const mustacheMesh = new THREE.Mesh(mustachePlane, mustacheMaterial);
            mustacheMesh.position.x = pos.x + i;
            mustacheMesh.position.y = 1.35 - (mii.mustacheYPosition - 10) * 0.007;
            mustacheMesh.position.z = pos.z + .2;
            // mustacheMesh.material.side = THREE.DoubleSide;
            if(i > 0) {
                mustacheMesh.rotation.y = Math.PI;
                mustacheMesh.material.side = THREE.BackSide;
            }
            scene.add(mustacheMesh);
            miis[n].mustache[m++] = mustacheMesh;
        }
    }, undefined, console.error);
    if(mii.beardType != 0) 
        loadGLTF(`models/head/mesh/shape_${mii.beardType < 4 ? 1 + mii.beardType : [574, 583][mii.beardType - 4]}.glb`, gltf => {
            gltf.scene.scale.set(.008, .008, .008);
            gltf.scene.position.x = pos.x;
            gltf.scene.position.y = 1;
            gltf.scene.position.z = pos.z - 0.1;
            gltf.scene.rotation.y = Math.PI;
            const material = new THREE.MeshStandardMaterial({ "color": hairColors[mii.facialHairColor] });
            for(const child of gltf.scene.children)
                child.material = material;
            scene.add(gltf.scene);
            miis[n].beard = gltf.scene;
        }, undefined, console.error);
        loadImg(`models/head/tex/tex_${267 + mii.glassesType}.png`, img => {
        let m = 0;
        miis[n].glasses = [];
        const sizemult = (1 + (mii.glassesScale - 2) * 0.1);
        for(let i = -0.052 * sizemult; i <= 0.052 * sizemult; i += 0.052 * sizemult * 2) {
            const scale = .1 * (1 + (mii.glassesScale - 2) * 0.15);
            const glassesPlane = new THREE.PlaneGeometry(scale, scale, 1, 1);
            const glassesMaterial = new THREE.MeshBasicMaterial({
                "map": colorCorrectBW(img, 0x000000, glassesColors[mii.glassesColor]),
                "shading": THREE.FlatShading,
                "transparent": true
            });
            const glassesMesh = new THREE.Mesh(glassesPlane, glassesMaterial);
            glassesMesh.position.x = pos.x + i;
            glassesMesh.position.y = 1.45 - (mii.glassesYPosition - 10) * 0.007;
            glassesMesh.position.z = pos.z + .25;
            // glassesMesh.material.side = THREE.DoubleSide;
            if(i > 0) {
                glassesMesh.rotation.y = Math.PI;
                glassesMesh.material.side = THREE.BackSide;
            }
            scene.add(glassesMesh);
            miis[n].glasses[m++] = glassesMesh;
        }
    }, undefined, console.error);
    if(mii.moleEnabled)
        loadImg(`models/head/tex/tex_${288}.png`, img => {
            const scale = .03 * (1 + (mii.moleScale - 4) * 0.15);
            const molePlane = new THREE.PlaneGeometry(scale, scale, 1, 1);
            const moleMaterial = new THREE.MeshBasicMaterial({
                "map": colorCorrectBWA(img, 0, 0x000000ff),
                "shading": THREE.FlatShading,
                "transparent": true
            });
            const moleMesh = new THREE.Mesh(molePlane, moleMaterial);
            moleMesh.position.x = pos.x + (mii.moleXPosition - 8) * 0.03;
            moleMesh.position.y = 1.35 + (mii.moleYPosition - 15) * 0.01;
            moleMesh.position.z = pos.z + .2;
            // moleMesh.material.side = THREE.DoubleSide;
            scene.add(moleMesh);
            miis[n].mole = moleMesh;
        }, undefined, console.error);
}

for(const position of positions) {
    loadGLTF("models/community.gltf", gltf => {
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
            const iconPlane = RoundedRectangle(2.5, 2.5, .5, 18);
            const iconMaterial = new THREE.MeshBasicMaterial({
                "map": tga,
                "shading": THREE.FlatShading
            });
            const iconMesh = new THREE.Mesh(iconPlane, iconMaterial);
            iconMesh.position.x = positions[i][0];
            iconMesh.position.y = 5;
            iconMesh.position.z = positions[i][1];
            // iconMesh.material.side = THREE.DoubleSide;
            scene.add(iconMesh);
            icons.push(iconMesh);
        }, undefined, console.error);
    }
    let frame = 0; // max 3000
    let lastRot = -Infinity;
    setInterval(() => {
        for(let i = 0; i < positions.length; i++) {
            if(!icons[i] || !communities[i]) continue;
            const rot = Math.sin(frame / 1500 * Math.PI) / 2;
            // console.log(communities[i].rotation)
            communities[i].rotateX(lastRot == -Infinity ? rot : rot - lastRot);
            lastRot = rot;
            frame++;
            frame %= 3000;
        }
    }, 1000 / 60);
});

const imgLoader = new THREE.TextureLoader();

waitForData().then(() => {
    if(ROT_DEBUG) return;
    for(const comm of data)
        for(const person of comm.people)
            loadMii(person.mii, { "x": Math.random() * 100 - 50, "z": Math.random() * 70 - 35 }, comm.position - 1);
});

const animate = () => {
	renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});