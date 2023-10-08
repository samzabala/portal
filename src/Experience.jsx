import { useRef,useEffect } from 'react'
import * as THREE from 'three'
import { useFrame, extend } from '@react-three/fiber'
import { useProgress,shaderMaterial,Sparkles,Center,useTexture,useGLTF,OrbitControls } from '@react-three/drei'
import { useControls } from 'leva'
import gsap from 'gsap'

import portalVertexShader from './shaders/portal/vertex.glsl'
import portalFragmentShader from './shaders/portal/fragment.glsl'

const MODEL_PATH = './model/bu.portal.glb' // './model/portal.glb'


export default function Experience() {

    /*
    PoleLight_R
    PoleLight_L
    PortalLight
    Scene
    Baked
    */
    // const overlayUniforms = {
    //     uAlpha: 1
    // }

    const overlayVertexShader = `
        void main()
            {
                gl_Position = vec4(position, 1.0);
            }
    `
    const overlayFragmentShader = `
        uniform float uAlpha;
        void main()
        {
            gl_FragColor = vec4(1.0, 1.0, 1.0, uAlpha);
        }
    `

    // // habo kang sparkles ang arog kani garu na
    // const OverlayMaterial = shaderMaterial(
    //     overlayUniforms,
    //     overlayVertexShader,
    //     overlayFragmentShader
    // )
    // extend({ OverlayMaterial }) //tandaan mo nagegeng camelcase ang tag nyan

    const overlayMaterial = useRef()
    const overlay = useRef()


	const { progress } = useProgress()
    useEffect(()=>{

        if(overlayMaterial.current && progress >= 100){
            gsap.to(
                overlayMaterial.current.uniforms.uAlpha,
                {
                    duration: 3,
                    value: 0
                }
            )
        }
    },[progress])

    const { nodes } = useGLTF(MODEL_PATH)


    const bakedTexture = useTexture('./model/bu.baked.jpg')
    // bakedTexture.flipY = false


    const {
        portalColorStart,
        portalColorEnd,
        firefliesSize
    } = useControls('Bitch Settings',
        {
            portalColorStart: '#ffffff',
            portalColorEnd: '#ff1fd6',
            firefliesSize: { value: 6, min: 1, max: 10 }
        }
    )

    const fireFlies = useRef()

    const PortalMaterial = shaderMaterial(
        {
            uTime: 0,
            uColorStart: new THREE.Color( portalColorStart ),
            uColorEnd: new THREE.Color( portalColorEnd )
        },
        portalVertexShader,
        portalFragmentShader
        
    )
    extend({ PortalMaterial }) //tandaan mo nagegeng camelcase ang tag nyan
    const portalMaterial = useRef()

    useFrame((state,delta) => {
        portalMaterial.current.uTime += delta
    })

    useEffect(()=>{

        portalMaterial.current.uColorStart = new THREE.Color( portalColorStart )
        portalMaterial.current.uColorEnd = new THREE.Color( portalColorEnd )
        fireFlies.current.size = firefliesSize

    },[
        portalColorStart,
        portalColorEnd,
        firefliesSize
    ])



    return <>
        <color args={ [ '#422215'] } attach="background" />

        <OrbitControls makeDefault
            enableDamping={ true }
            maxPolarAngle ={ Math.PI / 2 * .98 }
            minPolarAngle ={ Math.PI / 4 }
            maxAzimuthAngle ={ Math.PI * -.5 }
            minAzimuthAngle ={ Math.PI * -1.5 }
            minDistance ={ 2 }
            maxDistance ={ 10 }
        />

        <mesh ref={overlay} position-y={ 2} >
             <shaderMaterial
                    vertexShader={overlayVertexShader}
                    fragmentShader={overlayFragmentShader}
                    ref={ overlayMaterial }
                    transparent={ true }
                    uniforms={{
                        uAlpha: { value: 1 },
                    }}
                />
            <planeGeometry args={[2,2,1,1]} />
            {/* <overlayMaterial
                ref={ overlayMaterial }
                transparent={ true }
                renderOrder={ 0 }
            /> */}
        </mesh>
        <group position-y={ 1 }>

            <Center>


                <mesh 
                    geometry={ nodes.baked.geometry }
                    position={ nodes.baked.position }
                    scale={ nodes.baked.scale }
                    rotation={ nodes.baked.rotation }
                >
                    <meshBasicMaterial map={ bakedTexture } map-flipY={ false } />
                </mesh>
                <mesh
                    geometry={ nodes.PoleLight_R.geometry }
                    position={ nodes.PoleLight_R.position }
                    scale={ nodes.PoleLight_R.scale }
                    rotation={ nodes.PoleLight_R.rotation }
                >
                    <meshBasicMaterial color="#fffe8b" />
                </mesh>
                <mesh
                    geometry={ nodes.PoleLight_L.geometry }
                    position={ nodes.PoleLight_L.position }
                    scale={ nodes.PoleLight_L.scale }
                    rotation={ nodes.PoleLight_L.rotation }
                >
                    <meshBasicMaterial color="#fffe8b" />
                </mesh>
                <mesh
                    geometry={ nodes.PortalLight.geometry }
                    position={ nodes.PortalLight.position }
                    scale={ nodes.PortalLight.scale }
                    rotation={ nodes.PortalLight.rotation }
                >
                    <portalMaterial
                        ref={ portalMaterial }
                    />
                </mesh>
                <Sparkles
                    ref={ fireFlies }
                    size={ firefliesSize }
                    scale={ [ 4, 2, 4 ] }
                    position-y={ 1 }
                    // speed={ 0.2 }
                    count={ 69 }
                />
            </Center>
        </group>
    </>


}
useGLTF.preload(MODEL_PATH);