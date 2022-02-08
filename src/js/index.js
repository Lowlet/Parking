import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { PositionalAudioHelper } from 'three/examples/jsm/helpers/PositionalAudioHelper.js'
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls'
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js'

import { AmmoPhysics, PhysicsLoader } from '@enable3d/ammo-physics'

import gsap from 'gsap'

let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false
let loaded = false
let lightmaps = []
let intersected

let canvas, blocker, audioElement, loaderPercent, loaderBar
let scene, scene1, camera, renderer, controls, mixer, mixer1, listener, musicLocator, positionalAudio, audioContext, biquadFilter, raycaster
let physics, clock, player, levelCollision, doorCollision, door, leverCollision, cageCollision, laptopCollision, hiddenDoor, doorOpened = false
let torchBillboards = [], torchMaterial, torchAnimator, fireplaceMaterial, fireplaceAnimator, emissiveMaterial, emissiveFloorMaterial
let zuckerberg, zuckerbergLocator

const MainScene = () =>
{
    init()
    update()
}

PhysicsLoader('/ammo', () => MainScene())

function init()
{
    canvas = document.getElementById('canvas')
    blocker = document.getElementById('blocker')
    audioElement = document.getElementById('music')
    loaderPercent = document.getElementById('loader__percent')
    loaderBar = document.getElementById('loader__bar')

    clock = new THREE.Clock()

    raycaster = new THREE.Raycaster()
    raycaster.far = 4
    raycaster.layers.set(0)

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.toneMapping = THREE.ACESFilmicToneMapping

    scene = new THREE.Scene()
    scene1 = new THREE.Scene()

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.set(-5, 0.8, -31.5)
    camera.rotation.set(0, -Math.PI / 2, 0)

    controls = new PointerLockControls(camera, renderer.domElement)

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
    biquadFilter.frequency.setValueAtTime(200, audioContext.currentTime)

    positionalAudio.setFilter(biquadFilter)
    positionalAudio.setVolume(0.5)

    //const helper = new PositionalAudioHelper(positionalAudio, 10)
    //positionalAudio.add(helper)

    loadResources()
}

function loadResources()
{
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

    gltfLoader.load('./assets/Zuckerberg.glb', (gltf) =>
    {
        const light = new THREE.AmbientLight('#CC4916')
        scene1.add(light)

        zuckerberg = SkeletonUtils.clone(gltf.scene)
        zuckerberg.traverse((child) =>
        {
            if (child.isMesh)
            {
                child.frustumCulled = false
            }
        })

        mixer1 = new THREE.AnimationMixer(zuckerberg)
        mixer1.clipAction(gltf.animations[0]).play()

        scene1.add(zuckerberg)
    })

    loadingManager.onProgress = (url, itemsLoaded, itemsTotal) =>
    {
        let progress = itemsLoaded / itemsTotal * 100
        loaderPercent.innerHTML = Math.floor(progress) + '%'
        loaderBar.style.width = progress + '%'
    }

    loadingManager.onLoad = () =>
    {
        loaded = true

        gsap.fromTo('#loader', { autoAlpha: 1 }, { autoAlpha: 0, delay: 0.5, duration: 0.5 })
        gsap.fromTo('#instructions', { autoAlpha: 0 }, { autoAlpha: 1, delay: 0.5, duration: 0.5 })

        mixer = new THREE.AnimationMixer(scene)

        scene.traverse((child) =>
        {
            if (child.isMesh)
            {
                if (child.material)
                {
                    if (child.material.name === 'MAT_default')
                    {
                        child.material.lightMap = lightmaps[1]
                    }
                    else if (child.material.name !== 'MAT_floor' && child.material.name !== 'MAT_glass')
                    {
                        child.material.lightMap = lightmaps[0]
                    }
                    /*                 if (child.name.includes('_l1'))
                                    {
                                        child.material.lightMap = lightmaps[0]
                                    }
                                    else
                                    {
                                        child.material.lightMap = lightmaps[1]
                                    } */

                    if (child.material.name === 'MAT_emission')
                    {
                        emissiveMaterial = child.material
                        emissiveMaterial.emissiveIntensity = 2
                    }

                    if (child.material.name === 'MAT_floor')
                    {
                        emissiveFloorMaterial = child.material
                        emissiveFloorMaterial.emissiveIntensity = 2
                        changeMaterialOffset()
                    }

                    child.material.lightMapIntensity = 1.5
                }

                if (child.name.includes('BILLBOARD_torch'))
                {
                    torchBillboards.push(child)
                    torchMaterial = child.material
                    torchMaterial.emissiveIntensity = 10
                }

                if (child.name.includes('BILLBOARD_fireplace'))
                {
                    fireplaceMaterial = child.material
                    fireplaceMaterial.emissiveIntensity = 10
                }
            }
        })

        torchAnimator = new TextureAnimator(torchMaterial.emissiveMap, 6, 6, 36, 50)
        fireplaceAnimator = new TextureAnimator(fireplaceMaterial.emissiveMap, 8, 8, 64, 50)

        door = scene.getObjectByName('MESH_door')
        doorCollision = scene.getObjectByName('COLLISION_door')
        leverCollision = scene.getObjectByName('COLLISION_lever')
        levelCollision = scene.getObjectByName('COLLISION_level')
        cageCollision = scene.getObjectByName('COLLISION_cage')
        laptopCollision = scene.getObjectByName('COLLISION_laptop')
        hiddenDoor = scene.getObjectByName('MESH_hiddenDoor')
        player = scene.getObjectByName('Player')
        musicLocator = scene.getObjectByName('LOCATOR_music')
        zuckerbergLocator = scene.getObjectByName('LOCATOR_zuckerberg')

        physics.add.existing(levelCollision, { shape: 'concave', mass: 0 })
        levelCollision.visible = false

        physics.add.existing(doorCollision, { shape: 'convex' })
        doorCollision.body.setCollisionFlags(2)
        doorCollision.visible = false

        physics.add.existing(leverCollision, { shape: 'convex' })
        leverCollision.body.setCollisionFlags(2)
        leverCollision.visible = false

        physics.add.existing(cageCollision, { shape: 'convex' })
        cageCollision.body.setCollisionFlags(2)
        cageCollision.visible = false

        physics.add.existing(laptopCollision, { shape: 'convex' })
        laptopCollision.body.setCollisionFlags(2)
        laptopCollision.visible = false

        physics.add.existing(hiddenDoor, { shape: 'convex' })
        hiddenDoor.body.setCollisionFlags(2)

        physics.add.existing(player, { shape: 'convex', mass: 1 })
        player.body.setFriction(0.5)
        player.body.setAngularFactor(0, 0, 0)
        player.body.setCcdMotionThreshold(1e-7)
        player.body.setCcdSweptSphereRadius(0.5)
        player.visible = false
        player.layers.set(1)

        musicLocator.add(positionalAudio)

        zuckerberg.position.copy(zuckerbergLocator.position)
        zuckerberg.rotation.copy(zuckerbergLocator.rotation)
    }

    setupEvents()
}

function setupEvents()
{
    canvas.addEventListener('click', () =>
    {
        if (!loaded) return

        if (intersected && intersected.name === 'COLLISION_door')
        {
            scene.animations.forEach((animation) =>
            {
                if (animation.name === 'ANIM_door')
                {
                    const action = mixer.clipAction(animation)
                    action.clampWhenFinished = true
                    action.setLoop(THREE.LoopOnce)
                    action.setDuration(1)

                    if (doorOpened)
                    {
                        action.timeScale *= -1

                        if (player.position.x < 12.2)
                        {
                            biquadFilter.frequency.setValueAtTime(biquadFilter.frequency.value, audioContext.currentTime)
                            biquadFilter.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 1)
                        }
                    }
                    else
                    {
                        biquadFilter.frequency.setValueAtTime(biquadFilter.frequency.value, audioContext.currentTime)
                        biquadFilter.frequency.exponentialRampToValueAtTime(24000, audioContext.currentTime + 1)
                    }

                    action.paused = false
                    action.play()

                    doorOpened = !doorOpened
                }
            })
        }

        if (intersected && intersected.name === 'COLLISION_lever')
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

        if (intersected && intersected.name === 'COLLISION_cage')
        {
            window.open('https://www.twitter.com')
        }

        if (intersected && intersected.name === 'COLLISION_laptop')
        {
            window.open('https://www.discord.com')
        }
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

    blocker.addEventListener('click', () =>
    {
        if (!loaded) return

        controls.lock()
        audioElement.play()
    })

    controls.addEventListener('lock', () =>
    {
        gsap.fromTo('#blocker', { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.2 })
        listener.context.resume()
    })

    controls.addEventListener('unlock', () =>
    {
        gsap.fromTo('#blocker', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 })
        listener.context.suspend()
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
        const d = Math.PI / 24

        let rotationSpeed = /* isTouchDevice ? 2 : */ 10

        if (l > d)
        {
            if (l > Math.PI - d) rotationSpeed *= -1
            if (theta < thetaPlayer) rotationSpeed *= -1

            player.body.setAngularVelocityY(rotationSpeed)
        }

        // Move player
        const speed = 5

        let x = 0, z = 0

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

        // Rotate billboards
        for (let i = 0; i < torchBillboards.length; i++)
        {
            torchBillboards[i].rotation.setFromRotationMatrix(camera.matrix)
        }

        // Update spritesheets
        torchAnimator.update(1000 * delta)
        fireplaceAnimator.update(1000 * delta)

        // Emissive material animation
        emissiveMaterial.emissiveMap.offset.x += delta / 15

        // Raycast
        raycaster.setFromCamera(new THREE.Vector2(), camera)

        const intersects = raycaster.intersectObjects(scene.children)

        if (intersects.length > 0)
        {
            if (intersected != intersects[0].object)
            {
                if (intersected)
                {
                }
                intersected = intersects[0].object
            }

        }
        else
        {
            if (intersected)
            {
                intersected = null
            }
        }

        if (intersected && intersected.name === 'COLLISION_door' ||
            intersected && intersected.name === 'COLLISION_lever' ||
            intersected && intersected.name === 'COLLISION_cage' ||
            intersected && intersected.name === 'COLLISION_laptop')
        {
            gsap.to('#dot', { width: '10px', height: '10px', backgroundColor: 'rgba(203, 203, 203, 0)', duration: 0.1 })
            gsap.to('#interact__container', { autoAlpha: 1, delay: 0.2, duration: 0.2 })
        }
        else
        {
            gsap.to('#dot', { width: '2px', height: '2px', backgroundColor: 'rgba(203, 203, 203, 1)', duration: 0.1 })
            gsap.to('#interact__container', { autoAlpha: 0, delay: 0.2, duration: 0.2 })
        }

        // Update animations
        mixer.update(delta)
        mixer1.update(delta)
    }

    renderer.render(scene, camera)
    renderer.autoClear = false
    renderer.render(scene1, camera)
    renderer.autoClear = true
}

function onWindowResize()
{
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()

    renderer.setSize(window.innerWidth, window.innerHeight)
}

function changeMaterialOffset()
{
    emissiveFloorMaterial.emissiveMap.offset.x += 1 / 6
    emissiveFloorMaterial.emissiveMap.offset.y += 3 / 8

    setTimeout(() => changeMaterialOffset(), 400)
}

function TextureAnimator(texture, tilesHoriz, tilesVert, numTiles, tileDispDuration) 
{
    // note: texture passed by reference, will be updated by the update function.

    this.tilesHorizontal = tilesHoriz
    this.tilesVertical = tilesVert
    // how many images does this spritesheet contain?
    //  usually equals tilesHoriz * tilesVert, but not necessarily,
    //  if there at blank tiles at the bottom of the spritesheet. 
    this.numberOfTiles = numTiles
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(1 / this.tilesHorizontal, 1 / this.tilesVertical)

    // how long should each image be displayed?
    this.tileDisplayDuration = tileDispDuration

    // how long has the current image been displayed?
    this.currentDisplayTime = 0

    // which image is currently being displayed?
    this.currentTile = 0

    this.update = function (milliSec)
    {
        this.currentDisplayTime += milliSec
        while (this.currentDisplayTime > this.tileDisplayDuration)
        {
            this.currentDisplayTime -= this.tileDisplayDuration
            this.currentTile++
            if (this.currentTile == this.numberOfTiles)
                this.currentTile = 0
            var currentColumn = this.currentTile % this.tilesHorizontal
            texture.offset.x = currentColumn / this.tilesHorizontal
            var currentRow = Math.floor(this.currentTile / this.tilesHorizontal)
            texture.offset.y = currentRow / this.tilesVertical
        }
    }
}