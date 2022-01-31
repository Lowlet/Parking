import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { PositionalAudioHelper } from 'three/examples/jsm/helpers/PositionalAudioHelper.js'
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls'

import { AmmoPhysics, PhysicsLoader, ExtendedObject3D } from '@enable3d/ammo-physics'

let moveForward = false
let moveBackward = false
let moveLeft = false
let moveRight = false

let loaded = false

let scene, camera, renderer, controls, mixer, listener, positionalAudio, audioContext, biquadFilter
let physics, clock, player, levelCollision, doorCollision, door, lever, hiddenDoor, musicLocator

let lightmaps = []

const MainScene = () =>
{
    init()
    update()
}

PhysicsLoader('/ammo', () => MainScene())

function init()
{
    const canvas = document.getElementById('canvas')
    const blocker = document.getElementById('blocker')
    const instructions = document.getElementById('instructions')
    const audioElement = document.getElementById('music')

    clock = new THREE.Clock()

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.toneMapping = THREE.ACESFilmicToneMapping

    scene = new THREE.Scene()

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.set(-5, 0.8, -31.5)
    camera.rotation.set(0, -Math.PI / 2, 0)

    physics = new AmmoPhysics(scene)
    //physics.debug.enable(true)

    listener = new THREE.AudioListener()
    camera.add(listener)

    positionalAudio = new THREE.PositionalAudio(listener)
    positionalAudio.setMediaElementSource(audioElement)
    positionalAudio.setRefDistance(10)
    positionalAudio.setRolloffFactor(2)
    positionalAudio.setDistanceModel('exponential')
    positionalAudio.setDirectionalCone(180, 360, 0.2)

    audioContext = positionalAudio.context

    biquadFilter = audioContext.createBiquadFilter()
    biquadFilter.type = 'lowpass'
    biquadFilter.frequency.setValueAtTime(300, audioContext.currentTime)

    positionalAudio.setFilter(biquadFilter)
    positionalAudio.setVolume(0.5)
    

    const helper = new PositionalAudioHelper(positionalAudio, 10)
    positionalAudio.add(helper)

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

        lightmaps[0] = texture
    })

    rgbeLoader.load('./assets/2_final.hdr', (texture) =>
    {
        texture.flipY = false

        lightmaps[1] = texture
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
        scene.animations = gltf.animations
        console.log(scene)
    })

    loadingManager.onLoad = () =>
    {
        loaded = true

        mixer = new THREE.AnimationMixer(scene)

        scene.traverse((child) =>
        {
            if (child.isMesh)
            {
                if (child.name.includes('_l1'))
                {
                    child.material.lightMap = lightmaps[0]
                }
                else
                {
                    child.material.lightMap = lightmaps[1]
                }
                child.material.lightMapIntensity = 2
            }
        })

        door = scene.getObjectByName('MESH_door')
        doorCollision = scene.getObjectByName('COLLISION_door')
        lever = scene.getObjectByName('MESH_lever')
        levelCollision = scene.getObjectByName('COLLISION_level')
        hiddenDoor = scene.getObjectByName('MESH_hiddenDoor')
        player = scene.getObjectByName('Player')
        musicLocator = scene.getObjectByName('LOCATOR_music')

        musicLocator.add(positionalAudio)

        physics.add.existing(levelCollision, { shape: 'concave', mass: 0 })
        levelCollision.visible = false

        physics.add.existing(doorCollision, { shape: 'convex' })
        doorCollision.body.setCollisionFlags(2)
        doorCollision.visible = false

        physics.add.existing(hiddenDoor, { shape: 'convex' })
        hiddenDoor.body.setCollisionFlags(2)

        physics.add.existing(player, { shape: 'convex', mass: 1 })
        player.body.setFriction(0.5)
        player.body.setAngularFactor(0, 0, 0)
        player.body.setCcdMotionThreshold(1e-7)
        player.body.setCcdSweptSphereRadius(0.5)
        player.visible = false

        document.addEventListener('mousedown', () =>
        {
            var distanceToDoor = player.position.distanceTo(door.position)

            if (distanceToDoor < 4)
            {
                scene.animations.forEach((animation) =>
                {
                    if (animation.name === 'ANIM_door')
                    {
                        const action = mixer.clipAction(animation)
                        action.clampWhenFinished = true
                        action.setLoop(THREE.LoopOnce)
                        action.play()

                        biquadFilter.frequency.linearRampToValueAtTime(2400, audioContext.currentTime + 3);
                    }
                })
            }

            var distanceToLever = player.position.distanceTo(lever.position)

            if (distanceToLever < 4)
            {
                scene.animations.forEach((animation) =>
                {
                    if (animation.name === 'ANIM_lever')
                    {
                        const action = mixer.clipAction(animation)
                        action.clampWhenFinished = true
                        action.setLoop(THREE.LoopOnce)
                        action.play()
                    }

                    if (animation.name === 'ANIM_hiddenDoor')
                    {
                        const action = mixer.clipAction(animation)
                        action.clampWhenFinished = true
                        action.setLoop(THREE.LoopOnce)
                        action.play()
                    }
                })
            }
        })
    }

    controls = new PointerLockControls(camera, renderer.domElement)

    instructions.addEventListener('click', () =>
    {
        controls.lock()
        audioElement.play()
        listener.context.resume()
    })

    controls.addEventListener('lock', () =>
    {
        instructions.style.display = 'none'
        blocker.style.display = 'none'
    })

    controls.addEventListener('unlock', () =>
    {
        blocker.style.display = 'block'
        instructions.style.display = ''
    })

    document.addEventListener('keydown', (event) =>
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
    })

    document.addEventListener('keyup', (event) =>
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
    })

    window.addEventListener('resize', onWindowResize)
}

function update()
{
    requestAnimationFrame(update)

    const delta = clock.getDelta()

    if (!loaded) return

    if (controls.isLocked === true)
    {
        physics.update(delta * 1000)
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

        camera.position.copy(player.position.clone().add(new THREE.Vector3(0, 1, 0)))

        // Rotate door collider
        doorCollision.rotation.copy(door.rotation)
        doorCollision.body.needUpdate = true

        hiddenDoor.body.needUpdate = true

        // Update animations
        mixer.update(delta)
    }

    renderer.render(scene, camera)
}

function onWindowResize()
{
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()

    renderer.setSize(window.innerWidth, window.innerHeight)
}