import * as THREE from 'https://cdn.skypack.dev/three@0.132.2/build/three.module.js'
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/loaders/DRACOLoader.js';
import { EXRLoader } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/loaders/EXRLoader.js';
import { PointerLockControls } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/PointerLockControls';

let canvas, scene, camera, renderer, controls;

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;

let prevTime = performance.now();

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

init();
update()

function init()
{
    canvas = document.getElementById('canvas');

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    //renderer.outputEncoding = THREE.sRGBEncoding;

    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    //renderer.toneMappingExposure = 0.3;

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(-5, 0.8, -31.5);
    camera.rotation.set(0, -Math.PI / 2, 0);

    //controls = new OrbitControls(camera, renderer.domElement);
    controls = new PointerLockControls(camera, renderer.domElement);

    const blocker = document.getElementById('blocker');
    const instructions = document.getElementById('instructions');

    instructions.addEventListener('click', function ()
    {
        controls.lock();
    });

    controls.addEventListener('lock', function ()
    {
        instructions.style.display = 'none';
        blocker.style.display = 'none';
    });

    controls.addEventListener('unlock', function ()
    {
        blocker.style.display = 'block';
        instructions.style.display = '';
    });

    //scene.add(controls.getObject());

    const onKeyDown = function (event)
    {
        switch (event.code)
        {
            case 'ArrowUp':
            case 'KeyW':
                moveForward = true;
                break;

            case 'ArrowLeft':
            case 'KeyA':
                moveLeft = true;
                break;

            case 'ArrowDown':
            case 'KeyS':
                moveBackward = true;
                break;

            case 'ArrowRight':
            case 'KeyD':
                moveRight = true;
                break;
        }
    };

    const onKeyUp = function (event)
    {
        switch (event.code)
        {
            case 'ArrowUp':
            case 'KeyW':
                moveForward = false;
                break;

            case 'ArrowLeft':
            case 'KeyA':
                moveLeft = false;
                break;

            case 'ArrowDown':
            case 'KeyS':
                moveBackward = false;
                break;

            case 'ArrowRight':
            case 'KeyD':
                moveRight = false;
                break;
        }
    };

    const loadingManager = new THREE.LoadingManager();

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderConfig({ type: 'js' });
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.4.1/');

    new THREE.TextureLoader().load('./img/TEX_lightmap.png', (texture) =>
    {
        texture.flipY = false;

        const gltfLoader = new GLTFLoader(loadingManager)
        gltfLoader.setDRACOLoader(dracoLoader);
        gltfLoader.load('./mdl/Parking.glb', (gltf) =>
        {
            scene.add(gltf.scene);

            gltf.scene.traverse(function (child)
            {
                if (child.isMesh)
                {
                    child.material.lightMap = texture;
                    //child.material.lightMapIntensity = 2;
                }
            });
        });
    });

    new EXRLoader().load('./img/kloppenheim_02_4k.exr', (texture) =>
    {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.background = texture;
        //scene.environment = texture;
    });

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', onWindowResize);
}

function update()
{
    requestAnimationFrame(update);

    const time = performance.now();

    if (controls.isLocked === true)
    {
        const delta = (time - prevTime) / 1000;

        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();

        if (moveForward || moveBackward) velocity.z -= direction.z * 100.0 * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * 100.0 * delta;

        controls.moveRight(- velocity.x * delta);
        controls.moveForward(- velocity.z * delta);
    }

    prevTime = time;

    renderer.render(scene, camera);
}

function onWindowResize()
{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}