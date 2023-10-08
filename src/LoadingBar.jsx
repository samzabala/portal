
import * as THREE from 'three'
import { useProgress } from '@react-three/drei'
import { useEffect, useState } from 'react'


export default function LoadingBar(){

	const [started, setStart] = useState(false);

	const { progress } = useProgress()

	useEffect(()=>{
		if(progress >= 100) {
			setStart(true)
		}
	},[progress])


	return <div className="loading-bar" style={{
		'--progress' : started ? 100 : progress,
		'opacity' : started ? 0 : 1
	}}></div>
}