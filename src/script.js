import * as dat from 'lil-gui'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import gsap from 'gsap'

import firefliesVertexShader from './shaders/fireflies/vertex.glsl'
import firefliesFragmentShader from './shaders/fireflies/fragment.glsl'
import portalVertexShader from './shaders/portal/vertex.glsl'
import portalFragmentShader from './shaders/portal/fragment.glsl'

const devicePixelRatio = Math.min(window.devicePixelRatio, 2)

/**
 * Loaders
 */
const loadingBarElement = document.querySelector('.loading-bar')
const loadingManager = new THREE.LoadingManager(
    // callback when completed
        ()=>{
            console.log('coimpletex')
            if(overlayMaterial) gsap.to(
                overlayMaterial.uniforms.uAlpha,
                {
                    duration: 3,
                    value: 0
                }
            )
            
            loadingBarElement.style.setProperty('--opacity',0)
        },
    // progress callback
        (itemUrl, itemsLoaded, itemsTotal) =>
        {
            console.log('loading')
            const progressRatio = itemsLoaded / itemsTotal
            loadingBarElement.style.setProperty('--progress',progressRatio)
        }
)

/**
 * Base
 */
// Debug
const debugObject = {}
const gui = new dat.GUI({
    width: 400
})

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Loaders
 */
// Texture loader
const textureLoader = new THREE.TextureLoader(loadingManager)

// Draco loader
const dracoLoader = new DRACOLoader(loadingManager)
dracoLoader.setDecoderPath('draco/')

// GLTF loader
const gltfLoader = new GLTFLoader(loadingManager)
gltfLoader.setDRACOLoader(dracoLoader)



/**
 * Overlay
 */
const overlayGeometry = new THREE.PlaneGeometry(2, 2, 1, 1)
const overlayMaterial = new THREE.ShaderMaterial({
    // wireframe: true,
    transparent: true,
    uniforms:
    {
        uAlpha: { value: 1 }
    },
    vertexShader: `
        void main()
        {
            gl_Position = vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float uAlpha;

        void main()
        {
            gl_FragColor = vec4(1.0, 1.0, 1.0, uAlpha);
        }
    `
})
const overlay = new THREE.Mesh(overlayGeometry, overlayMaterial)
scene.add(overlay)

/**
 * Textures
 */
const bakedTexture = textureLoader.load('baked.jpg')
bakedTexture.flipY = false // fix the flipped texture misalignment and shit
bakedTexture.colorSpace = THREE.SRGBColorSpace // correct color profile



// bitches
const bakedMaterial = new THREE.MeshBasicMaterial({
    map: bakedTexture,
})
debugObject.portalColorStart = '#ffffff'
debugObject.portalColorEnd = '#ff1fd6'

const poleLightMaterial = new THREE.MeshBasicMaterial({ color: 0xfffe8b })
const portalLightMaterial = new THREE.ShaderMaterial({
    uniforms:  {
        uTime: { value: 0 },
        uColorStart: { value: new THREE.Color(debugObject.portalColorStart)  },
        uColorEnd: { value: new THREE.Color(debugObject.portalColorEnd ) }
    },
    vertexShader: portalVertexShader,
    fragmentShader: portalFragmentShader
})

gui
    .addColor(debugObject, 'portalColorStart')
    .onChange(() =>
    {
        portalLightMaterial.uniforms.uColorStart.value.set(debugObject.portalColorStart)
    })
    
gui
    .addColor(debugObject, 'portalColorEnd')
    .onChange(() =>
    {
        portalLightMaterial.uniforms.uColorEnd.value.set(debugObject.portalColorEnd)
    })

gltfLoader.load(
    'portal.glb',
    (gltf) => {

        const bakedMesh = gltf.scene.children.find(child => child.name === 'baked')
        const poleLightLMesh = gltf.scene.children.find(child => child.name === 'PoleLight_L')
        const poleLightRMesh = gltf.scene.children.find(child => child.name === 'PoleLight_R')
        const portalLightMesh = gltf.scene.children.find(child => child.name === 'PortalLight')

        
        poleLightLMesh.material = poleLightMaterial
        poleLightRMesh.material = poleLightMaterial
        portalLightMesh.material = portalLightMaterial
        bakedMesh.material = bakedMaterial

        scene.add(gltf.scene) //pbr becomes mesh standardf material so it blek
    }
)

// particles
const firefliesGeometry = new THREE.BufferGeometry()
const firefliesCount = 30
const positionArray = new Float32Array(firefliesCount * 3)

const scaleArray = new Float32Array(firefliesCount)

for(let i = 0; i < firefliesCount; i++)
{
    positionArray[i * 3 + 0] = (Math.random() - 0.5) * 4
    positionArray[i * 3 + 1] = Math.random() * 1.5
    positionArray[i * 3 + 2] = (Math.random() - 0.5) * 4

    scaleArray[i] = Math.random()
}

firefliesGeometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3))
firefliesGeometry.setAttribute('aScale', new THREE.BufferAttribute(scaleArray, 1))

// Material
const firefliesMaterial = new THREE.ShaderMaterial({
    uniforms:
    {
        uTime: { value: 0 },
        uPixelRatio: { value: devicePixelRatio },
        uSize: { value: 100 }
    },
    vertexShader: firefliesVertexShader,
    fragmentShader: firefliesFragmentShader,
    // transparent: true, // NO
    // u do this instead
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
})

gui.add(firefliesMaterial.uniforms.uSize, 'value')
    .min(0)
    .max(500)
    .step(1)
    .name('firefliesSize')

const fireflies = new THREE.Points(firefliesGeometry, firefliesMaterial)
scene.add(fireflies)



/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(devicePixelRatio)

    firefliesMaterial.uniforms.uPixelRatio.value = devicePixelRatio  //dont let it squish on resize
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100)
camera.position.x = -4
camera.position.y = 3
camera.position.z = -4
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas) // dae mo hilingun lubot ko iyo
controls.enableDamping = true
controls.maxPolarAngle = Math.PI / 2 * .9
controls.minPolarAngle = 0
controls.minDistance = 4
controls.maxDistance = 8

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
// renderer.outputColorSpace = THREE.SRGBColorSpace // colorspace bitch
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

debugObject.clearColor = '#422215'
renderer.setClearColor(debugObject.clearColor)
gui
    .addColor(debugObject, 'clearColor')
    .onChange(() => {
        renderer.setClearColor(debugObject.clearColor)
    })


/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    firefliesMaterial.uniforms.uTime.value = elapsedTime
    portalLightMaterial.uniforms.uTime.value = elapsedTime

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()