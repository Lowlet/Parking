import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';

import * as CANNON from 'cannon-es'
import CannonDebugger from 'cannon-es-debugger'
import { threeToCannon, ShapeType } from 'three-to-cannon'

import { PointerLockControlsCannon } from './PointerLockControlsCannon.js'

import { AmmoPhysics, PhysicsLoader, ExtendedObject3D } from '@enable3d/ammo-physics'

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

let canvas, scene, camera, renderer, controls

let prevTime = performance.now()

let world, sphereShape, sphereBody, physicsMaterial

let physics, clock, player

//initCannon()
//init()
//update()

const MainScene = () =>
{
    init()
    update()
}

PhysicsLoader('/ammo', () => MainScene())

function initCannon()
{
    world = new CANNON.World()
    world.gravity.set(0, -9.8, 0)

    physicsMaterial = new CANNON.Material('physics')
    const physics_physics = new CANNON.ContactMaterial(physicsMaterial, physicsMaterial, { friction: 0, restitution: 0, })

    world.addContactMaterial(physics_physics)

    sphereShape = new CANNON.Cylinder(0.5, 0.5, 2, 16)
    sphereBody = new CANNON.Body({ mass: 1, shape: sphereShape, material: physicsMaterial, linearDamping: 0.99 })
    sphereBody.position.set(-5, 10.8, -31.5)
    sphereBody.fixedRotation = true
    world.addBody(sphereBody)

    const groundShape = new CANNON.Plane()
    const groundBody = new CANNON.Body({ mass: 0, shape: groundShape, material: physicsMaterial })
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
    world.addBody(groundBody)
}

function init()
{
    clock = new THREE.Clock()

    canvas = document.getElementById('canvas')

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)

    //renderer.outputEncoding = THREE.sRGBEncoding

    renderer.toneMapping = THREE.ACESFilmicToneMapping
    //renderer.toneMappingExposure = 0.3

    scene = new THREE.Scene()

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.set(-10, 0.8, -31.5)
    camera.rotation.set(0, -Math.PI / 2, 0)

    physics = new AmmoPhysics(scene)
    physics.debug.enable(true)

    physics.add.box({ x: 0.05, y: 10 }, { lambert: { color: 0x2194ce } })

    const blocker = document.getElementById('blocker')
    const instructions = document.getElementById('instructions')

    const loadingManager = new THREE.LoadingManager()

    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderConfig({ type: 'js' })
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.4.1/')

    new RGBELoader().load('./assets/1_final.hdr', (texture) =>
    {
        texture.flipY = false

        const gltfLoader = new GLTFLoader(loadingManager)
        gltfLoader.setDRACOLoader(dracoLoader)
        gltfLoader.load('./assets/Parking.glb', (gltf) =>
        {
            scene.add(gltf.scene)
            console.log(gltf.scene)

            gltf.scene.traverse(function (child)
            {
                if (child.isMesh)
                {
                    child.material.lightMap = texture
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

            /*             controls = new PointerLockControlsCannon(camera, player)
                        scene.add(controls.getObject())
            
                        instructions.addEventListener('click', function ()
                        {
                            controls.lock()
                        })
            
                        controls.addEventListener('lock', function ()
                        {
                            controls.enabled = true
                            instructions.style.display = 'none'
                            blocker.style.display = 'none'
                        })
            
                        controls.addEventListener('unlock', function ()
                        {
                            controls.enabled = false
                            blocker.style.display = 'block'
                            instructions.style.display = ''
                        }) */

            //const collisionShape = createTrimesh(collision.geometry)

            // Construct polyhedron
            //const polyhedron = createConvexPolyhedron(collision.geometry)

            /*             const result = threeToCannon(collision, {type: ShapeType.MESH})
            
                        const collisionBody = new CANNON.Body({ mass: 0, shape: result, type: CANNON.Body.KINEMATIC })
                        world.addBody(collisionBody) */
        })
    })

    new EXRLoader().load('./assets/kloppenheim_02_4k.exr', (texture) =>
    {
        texture.mapping = THREE.EquirectangularReflectionMapping
        scene.background = texture
    })

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

//const cannonDebugger = new CannonDebugger(scene, world)

function update()
{
    requestAnimationFrame(update)

    const time = performance.now()
    const delta = (time - prevTime) / 1000

    physics.update(clock.getDelta() * 1000)
    physics.updateDebugger()

    if (controls.isLocked === true)
    {
/*         const delta = (time - prevTime) / 1000

        velocity.x -= velocity.x * 10 * delta
        velocity.z -= velocity.z * 10 * delta

        direction.z = Number(moveForward) - Number(moveBackward)
        direction.x = Number(moveRight) - Number(moveLeft)
        direction.normalize()

        if (moveForward || moveBackward) 
        {
            velocity.z -= direction.z * 50 * delta
        }
        if (moveLeft || moveRight)
        {
            velocity.x -= direction.x * 50 * delta
        } */

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

        //player.rotation.set(0, theta, 0)
        //player.body.needUpdate = true

        const speed = 5

        var x = 0, z = 0

        // move forwards and backwards
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

        // move sideways
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

        //player.body.setVelocity(-velocity.x, player.body.velocity.y, -velocity.z)
        camera.position.copy(player.position.clone().add(new THREE.Vector3(0, 1.3, 0)))


        //controls.moveRight(-velocity.x * delta)
        //controls.moveForward(-velocity.z * delta)
    }

    /*     if (controls.enabled)
        {
            world.fixedStep()
            cannonDebugger.update()
        } */

    prevTime = time
    //controls.update(delta)
    renderer.render(scene, camera)
}

function onWindowResize()
{
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()

    renderer.setSize(window.innerWidth, window.innerHeight)
}