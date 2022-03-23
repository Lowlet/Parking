import * as THREE from 'three'
import { REVISION } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls'
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js'

import { AmmoPhysics, PhysicsLoader } from '@enable3d/ammo-physics'

import gsap from 'gsap'
import nipplejs from 'nipplejs'

const THREE_PATH = `https://unpkg.com/three@0.${REVISION}.x`

let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false
let loaded = false
let lightmaps = []
let mixers = []
let intersected

let canvas, blocker, audioElement, loaderPercent, loaderBar, interactText, menuButton
let levelCollision, doorCollision, cageCollision, laptopCollision, foxCollision, leverCollision, button1Collision, button2Collision, button3Collision
let scene, camera, renderer, controls, mixer, mixer1, mixer2, listener, pmremGenerator, musicLocator, positionalAudio, audioContext, biquadFilter, cameraRaycaster, playerRaycaster
let physics, clock, player, door, hiddenDoor, doorOpened = false, discoBall, doorHoverText = 'OPEN DOOR'
let torchBillboards = [], torchMaterial, torchAnimator, fireplaceMaterial, fireplaceAnimator, emissiveMaterial, emissiveFloorMaterial
let zuckerberg, buterin, baby1, baby2, baby3, baby4
let zuckerbergLocator, buterinLocator, baby1Locator, baby2Locator, baby3Locator, baby4Locator
let reflectionProbe, reflectionProbe1, reflectionProbe2, reflectionProbe3
let velocity, playing = false
let inputRotationX = 0, inputRotationY = 0
let cameraRotationX = 0, cameraRotationY = 0
let displacement = new THREE.Vector3()
let angle = null, force = 0


let leftJoystick = nipplejs.create({
    zone: document.getElementById('leftjoystick'),
    mode: 'static',
    position: { left: '100px', bottom: '100px' }
})

let rightJoystick = nipplejs.create({
    zone: document.getElementById('rightjoystick'),
    mode: 'static',
    position: { right: '100px', bottom: '100px' }
})

let isMobile = false

if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent)
    || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0, 4)))
{
    isMobile = true
}

const MainScene = () =>
{
    init()
    update()
}

PhysicsLoader('./js/ammo', () => MainScene())

function init()
{
    canvas = document.getElementById('canvas')
    blocker = document.getElementById('blocker')
    audioElement = document.getElementById('music')
    loaderPercent = document.getElementById('loader__percent')
    loaderBar = document.getElementById('loader__bar')
    interactText = document.getElementById('interact__text')
    menuButton = document.getElementById('menu-button')

    clock = new THREE.Clock()

    cameraRaycaster = new THREE.Raycaster()
    cameraRaycaster.far = 4
    cameraRaycaster.layers.set(0)

    playerRaycaster = new THREE.Raycaster()
    playerRaycaster.layers.set(0)

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, stencil: false })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(isMobile ? Math.min(3, window.devicePixelRatio) : window.devicePixelRatio)
    renderer.toneMapping = THREE.ACESFilmicToneMapping

    scene = new THREE.Scene()

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.set(-5, 0.8, -31.5)
    camera.rotation.set(0, -Math.PI / 2, 0)
    camera.layers.enable(1)

    cameraRotationX = -Math.PI / 2

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

    pmremGenerator = new THREE.PMREMGenerator(renderer)
    pmremGenerator.compileEquirectangularShader()

    loadResources()
}

function loadResources()
{
    const loadingManager = new THREE.LoadingManager()
    const rgbeLoader = new RGBELoader(loadingManager)
    const exrLoader = new EXRLoader(loadingManager)
    const dracoLoader = new DRACOLoader(loadingManager)
    const ktx2Loader = new KTX2Loader(loadingManager)
    const gltfLoader = new GLTFLoader(loadingManager)

    dracoLoader.setDecoderPath(`${THREE_PATH}/examples/js/libs/draco/gltf/`)

    //ktx2Loader.setTranscoderPath(`${THREE_PATH}/examples/js/libs/basis/`)
    //ktx2Loader.detectSupport(renderer)

    gltfLoader.setDRACOLoader(dracoLoader)
    //gltfLoader.setMeshoptDecoder(MeshoptDecoder)
    //gltfLoader.setKTX2Loader(ktx2Loader)

    rgbeLoader.load('./images/TEX_lightmap_outside.hdr', (texture) =>
    {
        texture.flipY = false

        lightmaps[0] = texture
    })

    rgbeLoader.load('./images/TEX_lightmap_inside.hdr', (texture) =>
    {
        texture.flipY = false

        lightmaps[1] = texture
    })

    exrLoader.load('./images/sky.exr', (texture) =>
    {
        texture.mapping = THREE.EquirectangularReflectionMapping
        scene.background = texture
    })

    exrLoader.load('./images/ReflectionProbe.exr', (texture) =>
    {
        reflectionProbe = pmremGenerator.fromEquirectangular(texture)
        pmremGenerator.dispose()
    })

    exrLoader.load('./images/ReflectionProbe1.exr', (texture) =>
    {
        reflectionProbe1 = pmremGenerator.fromEquirectangular(texture)
        pmremGenerator.dispose()
    })

    exrLoader.load('./images/ReflectionProbe2.exr', (texture) =>
    {
        reflectionProbe2 = pmremGenerator.fromEquirectangular(texture)
        pmremGenerator.dispose()
    })

    exrLoader.load('./images/ReflectionProbe3.exr', (texture) =>
    {
        reflectionProbe3 = pmremGenerator.fromEquirectangular(texture)
        pmremGenerator.dispose()
    })

/*     gltfLoader.load('./models/Parking_static.glb', (gltf) =>
    {
        scene.add(gltf.scene)
        scene.traverse((child) =>
        {
            if (child.material)
            {
                if (child.material.map !== null &&
                    child.material.name !== 'MAT_emission')
                {
                    child.material.map.encoding = THREE.LinearEncoding
                }
            }
        })
        console.log(scene)
    }) */

    gltfLoader.load('./models/Parking.glb', (gltf) =>
    {
        scene.add(gltf.scene)
        scene.animations = gltf.animations
        scene.traverse((child) =>
        {
            if (child.material)
            {
                if (child.material.map !== null &&
                    child.material.name !== 'MAT_emission' &&
                    child.material.name !== 'MAT_floor')
                {
                    child.material.map.encoding = THREE.LinearEncoding
                }
            }

            if (!child.name.includes('COLLISION'))
            {
                child.layers.set(1)
            }
        })
        console.log(scene)
    })

    gltfLoader.load('./models/Zuckerberg.glb', (gltf) =>
    {
        zuckerberg = SkeletonUtils.clone(gltf.scene)
        zuckerberg.traverse((child) =>
        {
            if (child.isMesh)
            {
                child.frustumCulled = false
                child.material.map.encoding = THREE.LinearEncoding
                child.material.envMap = reflectionProbe3.texture
            }
            child.layers.set(1)
        })

        mixer1 = new THREE.AnimationMixer(zuckerberg)
        mixer1.clipAction(gltf.animations[0]).play()

        scene.add(zuckerberg)

    })

    gltfLoader.load('./models/Buterin.glb', (gltf) =>
    {
        buterin = SkeletonUtils.clone(gltf.scene)
        buterin.traverse((child) =>
        {
            if (child.isMesh)
            {
                child.material.map.encoding = THREE.LinearEncoding
                child.material.envMap = reflectionProbe.texture
                child.material.envMapIntensity = 2
            }
            child.layers.set(1)
        })

        mixer2 = new THREE.AnimationMixer(buterin)
        mixer2.clipAction(gltf.animations[0]).play()

        scene.add(buterin)
    })

    gltfLoader.load('./models/Baby.glb', (gltf) =>
    {
        baby1 = SkeletonUtils.clone(gltf.scene)

        const mixer1 = new THREE.AnimationMixer(baby1)

        const action = mixer1.clipAction(gltf.animations[2])
        action.timeScale = 0.25
        action.play()

        scene.add(baby1)
        mixers.push(mixer1)
    })

    gltfLoader.load('./models/Baby_dj.glb', (gltf) =>
    {
        baby2 = SkeletonUtils.clone(gltf.scene)

        const mixer2 = new THREE.AnimationMixer(baby2)
        mixer2.clipAction(gltf.animations[0]).play()

        scene.add(baby2)
        mixers.push(mixer2)
    })

    gltfLoader.load('./models/Baby_dancer.glb', (gltf) =>
    {
        baby3 = SkeletonUtils.clone(gltf.scene)

        const mixer3 = new THREE.AnimationMixer(baby3)
        mixer3.clipAction(gltf.animations[2]).play()

        scene.add(baby3)
        mixers.push(mixer3)
    })

    gltfLoader.load('./models/Baby_fbi.glb', (gltf) =>
    {
        baby4 = SkeletonUtils.clone(gltf.scene)

        const mixer4 = new THREE.AnimationMixer(baby4)
        mixer4.clipAction(gltf.animations[1]).play()

        scene.add(baby4)
        mixers.push(mixer4)
    })

    loadingManager.onProgress = (url, itemsLoaded, itemsTotal) =>
    {
        let progress = itemsLoaded / itemsTotal * 100
        loaderPercent.innerHTML = Math.floor(progress) + '%'
        loaderBar.style.width = progress + '%'
    }

    loadingManager.onLoad = () =>
    {
        gsap.to('#blocker', { backgroundColor: '#07070999', delay: 0.5, duration: 0.5 })
        gsap.fromTo('#loader', { autoAlpha: 1 }, { autoAlpha: 0, delay: 0.5, duration: 0.5 })
        gsap.fromTo('.instructions', { autoAlpha: 0 }, { autoAlpha: 1, delay: 0.5, duration: 0.5 })
        gsap.fromTo('.keymapping', { autoAlpha: 0 }, { autoAlpha: 1, delay: 0.5, duration: 0.5 })
        gsap.to('.instructions__title', { opacity: 0.2, delay: 1, duration: 1, ease: 'power1.in', repeat: -1, yoyo: true })

        mixer = new THREE.AnimationMixer(scene)

        scene.traverse((child) =>
        {
            traverseBaby(baby1, reflectionProbe2)
            traverseBaby(baby2, reflectionProbe1)
            traverseBaby(baby3, reflectionProbe)
            traverseBaby(baby4, reflectionProbe)

            if (child.isMesh)
            {
                if (child.material)
                {
                    if (child.name.includes('_l1'))
                    {
                        child.material.lightMap = lightmaps[0]
                    }
                    else
                    {
                        child.material.lightMap = lightmaps[1]
                    }

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

                    if (child.material.name === 'MAT_discoball')
                    {
                        child.material.envMap = reflectionProbe.texture
                    }

                    if (child.material.name === 'MAT_glass')
                    {
                        child.material = new THREE.MeshPhysicalMaterial({
                            lightMap: lightmaps[1],
                            specularIntensity: 1,
                            roughness: 0,
                            transmission: 1,
                            thickness: 0.1,
                            envMap: reflectionProbe2.texture
                        })
                    }

                    if (child.material.name === 'MAT_glass_green')
                    {
                        child.material = new THREE.MeshPhysicalMaterial({
                            lightMap: lightmaps[1],
                            color: '#54B884',
                            specularIntensity: 1,
                            roughness: 0,
                            transmission: 0.9,
                            thickness: 0.1,
                            envMap: reflectionProbe2.texture
                        })
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

        door = scene.getObjectByName('MESH_door_l1')
        levelCollision = scene.getObjectByName('COLLISION_level')
        doorCollision = scene.getObjectByName('COLLISION_door')
        cageCollision = scene.getObjectByName('COLLISION_cage')
        laptopCollision = scene.getObjectByName('COLLISION_laptop')
        foxCollision = scene.getObjectByName('COLLISION_fox')
        leverCollision = scene.getObjectByName('COLLISION_lever')
        hiddenDoor = scene.getObjectByName('MESH_hiddenDoor')
        button1Collision = scene.getObjectByName('COLLISION_button_01')
        button2Collision = scene.getObjectByName('COLLISION_button_02')
        button3Collision = scene.getObjectByName('COLLISION_button_03')
        player = scene.getObjectByName('Player')

        musicLocator = scene.getObjectByName('LOCATOR_music')
        zuckerbergLocator = scene.getObjectByName('LOCATOR_zuckerberg')
        buterinLocator = scene.getObjectByName('LOCATOR_buterin')
        baby1Locator = scene.getObjectByName('LOCATOR_baby_01')
        baby2Locator = scene.getObjectByName('LOCATOR_baby_02')
        baby3Locator = scene.getObjectByName('LOCATOR_baby_03')
        baby4Locator = scene.getObjectByName('LOCATOR_baby_04')

        discoBall = scene.getObjectByName('MESH_discoball')

        physics.add.existing(levelCollision, { shape: 'concave', mass: 0 })
        levelCollision.visible = false

        physics.add.existing(doorCollision, { shape: 'convex' })
        doorCollision.body.setCollisionFlags(2)
        doorCollision.visible = false

        physics.add.existing(cageCollision, { shape: 'convex' })
        cageCollision.body.setCollisionFlags(2)
        cageCollision.visible = false

        physics.add.existing(laptopCollision, { shape: 'convex' })
        laptopCollision.body.setCollisionFlags(2)
        laptopCollision.visible = false

        physics.add.existing(foxCollision, { shape: 'convex' })
        foxCollision.body.setCollisionFlags(2)
        foxCollision.visible = false

        physics.add.existing(leverCollision, { shape: 'convex' })
        leverCollision.body.setCollisionFlags(2)
        leverCollision.visible = false

        physics.add.existing(hiddenDoor, { shape: 'convex' })
        hiddenDoor.body.setCollisionFlags(2)

        physics.add.existing(button1Collision, { shape: 'convex' })
        button1Collision.body.setCollisionFlags(2)
        button1Collision.visible = false

        physics.add.existing(button2Collision, { shape: 'convex' })
        button2Collision.body.setCollisionFlags(2)
        button2Collision.visible = false

        physics.add.existing(button3Collision, { shape: 'convex' })
        button3Collision.body.setCollisionFlags(2)
        button3Collision.visible = false

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

        buterin.position.copy(buterinLocator.position)
        buterin.rotation.copy(buterinLocator.rotation)

        baby1.position.copy(baby1Locator.position)

        baby2.position.copy(baby2Locator.position)
        baby2.rotation.copy(baby2Locator.rotation)
        baby2.scale.set(1.2, 1.2, 1.2)

        baby3.position.copy(baby3Locator.position)
        baby3.rotation.copy(baby3Locator.rotation)
        baby3.scale.set(1.2, 1.2, 1.2)

        baby4.position.copy(baby4Locator.position)
        baby4.rotation.copy(baby4Locator.rotation)
        baby4.scale.set(1.2, 1.2, 1.2)

        loaded = true
    }

    setupEvents()
}

function setupEvents()
{
    canvas.addEventListener('click', () =>
    {
        interact()
    })

    menuButton.addEventListener('click', () =>
    {
        playing = false
        gsap.fromTo('#blocker', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 })
        listener.context.suspend()
    })

    canvas.addEventListener('ontouchstart', () =>
    {
        interact()
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

    leftJoystick.on('move', (event, data) =>
    {
        angle = data.angle.radian
        force = data.force < 1 ? data.force : 1
    })

    leftJoystick.on('end', () =>
    {
        angle = null
    })

    rightJoystick.on('move', (event, data) =>
    {
        const angle = data.angle.radian
        const force = data.force < 1 ? data.force : 1

        inputRotationX = -Math.cos(angle) * force * 0.03
        inputRotationY = Math.sin(angle) * force * 0.03
    })

    rightJoystick.on('end', () =>
    {
        inputRotationX = 0
        inputRotationY = 0
    })

    blocker.addEventListener('click', () =>
    {
        if (!loaded) return

        if (isMobile)
        {
            playing = true
            gsap.fromTo('#blocker', { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.2 })
            audioElement.play()
            listener.context.resume()
        }
        else
        {
            controls.lock()
            audioElement.play()
        }
    })

    controls.addEventListener('lock', () =>
    {
        playing = true
        gsap.fromTo('#blocker', { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.2 })
        listener.context.resume()
    })

    controls.addEventListener('unlock', () =>
    {
        playing = false
        gsap.fromTo('#blocker', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 })
        listener.context.suspend()
    })

    window.addEventListener('resize', onWindowResize)
}

function update()
{
    requestAnimationFrame(update)

    if (!loaded) return

    const delta = clock.getDelta()

    if (playing)
    {
        // Update physics
        physics.update(delta * 1000)
        physics.updateDebugger()

        const speed = 5

        if (angle !== null)
        {
            displacement.set(Math.cos(angle), 0, -Math.sin(angle)).multiplyScalar(force)
        }
        else
        {
            displacement.set(0, 0, 0)
        }

        if (!isMobile)
        {
            let x = 0, z = 0

            const cameraDirection = new THREE.Vector3()
            camera.getWorldDirection(cameraDirection)
            const theta = Math.atan2(cameraDirection.x, cameraDirection.z)

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

            velocity = new THREE.Vector3(x, player.body.velocity.y, z)
        }
        else
        {
            // Rotate camera with virtual joystick
            cameraRotationX += inputRotationX
            cameraRotationY += inputRotationY

            cameraRotationY = THREE.MathUtils.clamp(cameraRotationY, -Math.PI / 3, Math.PI / 3)

            let xQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), cameraRotationX)
            let yQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), cameraRotationY)
            let xyQuaternion = new THREE.Quaternion().multiplyQuaternions(xQuaternion, yQuaternion)

            camera.rotation.setFromQuaternion(xyQuaternion)

            // Move character with virtual joystick in direction of camera
            const direction = displacement.transformDirection(camera.matrixWorld).multiplyScalar(speed)

            velocity = new THREE.Vector3(direction.x, player.body.velocity.y, direction.z)
        }

        // Raycast down from player position
        playerRaycaster.set(player.position, new THREE.Vector3(0, -1, 0))

        // Get ground hits
        const groundIntersects = playerRaycaster.intersectObjects(scene.children, true)

        if (groundIntersects.length > 0)
        {
            // Ground normal
            const normal = groundIntersects[0].face.normal.normalize()
            // Project player velocity on ground plane
            const projectedVelocity = velocity.projectOnPlane(normal)
            // Set player velocity
            player.body.setVelocity(projectedVelocity.x, projectedVelocity.y, projectedVelocity.z)
        }

        // Set camera position to the center of player and move up by 1 unit
        camera.position.copy(player.position.clone().add(new THREE.Vector3(0, 1, 0)))

        // Update door collider with animation
        doorCollision.rotation.copy(door.rotation)
        doorCollision.body.needUpdate = true

        // Update hidden door collider with animation
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

        // Disco ball rotation
        discoBall.rotateY(THREE.MathUtils.degToRad(50) * delta)

        // Raycast from camera
        cameraRaycaster.setFromCamera(new THREE.Vector2(), camera)

        const intersects = cameraRaycaster.intersectObjects(scene.children)

        if (intersects.length > 0)
        {
            if (intersected != intersects[0].object)
            {
                intersected = intersects[0].object

                if (intersected.name === 'COLLISION_door')
                {
                    interactText.innerHTML = doorHoverText
                }
                if (intersected.name === 'COLLISION_lever')
                {
                    interactText.innerHTML = 'USE LEVER'
                }
                if (intersected.name === 'COLLISION_cage')
                {
                    interactText.innerHTML = 'OPEN TWITTER'
                }
                if (intersected.name === 'COLLISION_laptop')
                {
                    interactText.innerHTML = 'OPEN DISCORD'
                }
                if (intersected.name === 'COLLISION_fox')
                {
                    interactText.innerHTML = 'CONNECT WALLET'
                }
                if (intersected.name === 'COLLISION_button_01')
                {
                    interactText.innerHTML = 'QTY: 1'
                }
                if (intersected.name === 'COLLISION_button_02')
                {
                    interactText.innerHTML = 'QTY: 3'
                }
                if (intersected.name === 'COLLISION_button_03')
                {
                    interactText.innerHTML = 'QTY: 5'
                }
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
            intersected && intersected.name === 'COLLISION_laptop' ||
            intersected && intersected.name === 'COLLISION_fox' ||
            intersected && intersected.name === 'COLLISION_button_01' ||
            intersected && intersected.name === 'COLLISION_button_02' ||
            intersected && intersected.name === 'COLLISION_button_03')
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
        mixer2.update(delta)
        for (const mixer of mixers) mixer.update(delta)
    }

    renderer.render(scene, camera)
}

function interact()
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
                    interactText.innerHTML = doorHoverText = 'OPEN DOOR'
                }
                else
                {
                    biquadFilter.frequency.setValueAtTime(biquadFilter.frequency.value, audioContext.currentTime)
                    biquadFilter.frequency.exponentialRampToValueAtTime(24000, audioContext.currentTime + 1)
                    interactText.innerHTML = doorHoverText = 'CLOSE DOOR'
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

    if (intersected && intersected.name === 'COLLISION_fox')
    {
        // Fox onclick logic
    }

    if (intersected && intersected === button1Collision)
    {
        playButtonAnimation('ANIM_button_01')
        // Button1 onclick logic
    }

    if (intersected && intersected === button2Collision)
    {
        playButtonAnimation('ANIM_button_02')
        // Button2 onclick logic
    }

    if (intersected && intersected === button3Collision)
    {
        playButtonAnimation('ANIM_button_03')
        // Button3 onclick logic
    }
}

function onWindowResize()
{
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()

    renderer.setSize(window.innerWidth, window.innerHeight)
}

function traverseBaby(baby, probe)
{
    baby.traverse((child) =>
    {
        if (child.material)
        {
            if (child.material.map !== null)
            {
                child.material.map.encoding = THREE.LinearEncoding
            }
            child.material.envMap = probe.texture
        }
        if (child.isMesh)
        {
            child.frustumCulled = false
        }
        child.layers.set(1)
    })
}

function changeMaterialOffset()
{
    emissiveFloorMaterial.emissiveMap.offset.x += 1 / 6
    emissiveFloorMaterial.emissiveMap.offset.y += 3 / 8

    setTimeout(() => changeMaterialOffset(), 400)
}

function playButtonAnimation(button)
{
    const action = mixer.clipAction(getAnimationByName(scene.animations, button))
    action.setLoop(THREE.LoopOnce)
    action.stop()
    action.play()
}

function getAnimationByName(arr, name)
{
    for (var i = 0; i < arr.length; i++)
    {
        if (arr[i].name == name)
        {
            return arr[i]
        }
    }
    return undefined
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