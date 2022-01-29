import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';

import { AmmoPhysics, PhysicsLoader, ExtendedObject3D } from '@enable3d/ammo-physics'

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;

let canvas, scene, camera, renderer, controls
let physics, clock, player

let lightmaps = []

const MainScene = () =>
{
    init()
    update()
}

PhysicsLoader('/ammo', () => MainScene())

function init()
{
    clock = new THREE.Clock()

    canvas = document.getElementById('canvas')
    const blocker = document.getElementById('blocker')
    const instructions = document.getElementById('instructions')

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    //renderer.outputEncoding = THREE.sRGBEncoding

    renderer.toneMapping = THREE.ACESFilmicToneMapping
    //renderer.toneMappingExposure = 0.3

    scene = new THREE.Scene()

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.set(-5, 0.8, -31.5)
    camera.rotation.set(0, -Math.PI / 2, 0)

    physics = new AmmoPhysics(scene)
    //physics.debug.enable(true)

    const loadingManager = new THREE.LoadingManager()

    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderConfig({ type: 'js' })
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.4.1/')

    const rgbeLoader = new RGBELoader(loadingManager)
    const exrLoader = new EXRLoader(loadingManager)
    const gltfLoader = new GLTFLoader(loadingManager)

    rgbeLoader.load('./assets/1_final.hdr', (texture) =>
    {
        texture.flipY = false

        lightmaps.push(texture)
    })

    rgbeLoader.load('./assets/2_final.hdr', (texture) =>
    {
        texture.flipY = false

        lightmaps.push(texture)
    })

    exrLoader.load('./assets/kloppenheim_02_4k.exr', (texture) =>
    {
        texture.mapping = THREE.EquirectangularReflectionMapping
        scene.background = texture
    })

    gltfLoader.setDRACOLoader(dracoLoader)
    gltfLoader.load('./assets/Parking.glb', (gltf) =>
    {
        scene.add(gltf.scene)
        console.log(gltf.scene)
    })

    loadingManager.onLoad = () =>
    {
        scene.traverse(function (child)
        {
            if (child.isMesh)
            {
                if (child.name.includes('_l1'))
                {
                    console.log('1:' + child.name)
                    child.material.lightMap = lightmaps[0]
                }
                else
                {
                    console.log('2:' + child.name)
                    child.material.lightMap = lightmaps[1]
                }
                child.material.lightMapIntensity = 2
            }
        })

        const collision = scene.getObjectByName('MESH_collision')

        physics.add.existing(collision, { shape: 'concave', mass: 0 })

        collision.visible = false

        player = scene.getObjectByName('Player')

        physics.add.existing(player, { shape: 'capsule', mass: 1 })
        player.body.setFriction(0.8)
        player.body.setAngularFactor(0, 0, 0)
        player.body.setCcdMotionThreshold(1e-7)
        player.body.setCcdSweptSphereRadius(0.25)

        player.visible = false
    }

    controls = new PointerLockControls(camera, renderer.domElement)

    instructions.addEventListener('click', function ()
    {
        controls.lock()
    })

    controls.addEventListener('lock', function ()
    {
        instructions.style.display = 'none'
        blocker.style.display = 'none'
    })

    controls.addEventListener('unlock', function ()
    {
        blocker.style.display = 'block'
        instructions.style.display = ''
    })

    scene.add(controls.getObject())

    const onKeyDown = function (event)
    {
        switch (event.code)
        {
            case 'ArrowUp':
            case 'KeyW':
                moveForward = true
                break

            case 'ArrowLeft':
            case 'KeyA':
                moveLeft = true
                break

            case 'ArrowDown':
            case 'KeyS':
                moveBackward = true
                break

            case 'ArrowRight':
            case 'KeyD':
                moveRight = true
                break
        }
    }

    const onKeyUp = function (event)
    {
        switch (event.code)
        {
            case 'ArrowUp':
            case 'KeyW':
                moveForward = false
                break

            case 'ArrowLeft':
            case 'KeyA':
                moveLeft = false
                break

            case 'ArrowDown':
            case 'KeyS':
                moveBackward = false
                break

            case 'ArrowRight':
            case 'KeyD':
                moveRight = false
                break
        }
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('keyup', onKeyUp)

    window.addEventListener('resize', onWindowResize)
}

function update()
{
    requestAnimationFrame(update)

    if (controls.isLocked === true)
    {
        physics.update(clock.getDelta() * 1000)
        physics.updateDebugger()

        // Rotate player
        const cameraDirection = new THREE.Vector3()
        const rotation = camera.getWorldDirection(cameraDirection)
        const theta = Math.atan2(rotation.x, rotation.z)

        const rotationPlayer = player.getWorldDirection(cameraDirection)
        const thetaPlayer = Math.atan2(rotationPlayer.x, rotationPlayer.z)
        player.body.setAngularVelocityY(0)

        const l = Math.abs(theta - thetaPlayer)
        let rotationSpeed = /* isTouchDevice ? 2 : */ 10
        let d = Math.PI / 24

        if (l > d)
        {
            if (l > Math.PI - d) rotationSpeed *= -1
            if (theta < thetaPlayer) rotationSpeed *= -1

            player.body.setAngularVelocityY(rotationSpeed)
        }

        // Move player
        const speed = 5

        var x = 0, z = 0

        if (moveForward)
        {
            x += Math.sin(theta) * speed
            z += Math.cos(theta) * speed
        }
        else if (moveBackward)
        {
            x -= Math.sin(theta) * speed
            z -= Math.cos(theta) * speed
        }

        if (moveLeft)
        {
            x += Math.sin(theta + Math.PI * 0.5) * speed
            z += Math.cos(theta + Math.PI * 0.5) * speed
        }
        else if (moveRight)
        {
            x += Math.sin(theta - Math.PI * 0.5) * speed
            z += Math.cos(theta - Math.PI * 0.5) * speed
        }

        player.body.setVelocity(x, player.body.velocity.y, z)

        camera.position.copy(player.position.clone().add(new THREE.Vector3(0, 1.3, 0)))
    }

    //controls.update(delta)
    renderer.render(scene, camera)
}

function onWindowResize()
{
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()

    renderer.setSize(window.innerWidth, window.innerHeight)
}