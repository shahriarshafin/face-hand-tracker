'use client';

import {
	DrawingUtils,
	FaceLandmarker,
	FilesetResolver,
} from '@mediapipe/tasks-vision';
import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';

export default function FaceLandmarks() {
	const [faceData, setFaceData] = useState([]);
	const [blendShapes, setBlendShapes] = useState([]);
	const webcamRef = useRef(null);
	const canvasRef = useRef(null);
	const landmarkerRef = useRef(null);
	const drawingUtilsRef = useRef(null);

	useEffect(() => {
		const createFaceLandmarker = async () => {
			const vision = await FilesetResolver.forVisionTasks(
				'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
			);
			const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
				baseOptions: {
					modelAssetPath: `./models/face_landmarker.task`,
					delegate: 'GPU',
				},
				outputFaceBlendshapes: true, // Ensure blend shapes are enabled
				runningMode: 'VIDEO',
				numFaces: 1,
			});
			landmarkerRef.current = faceLandmarker;
			console.log('Face landmarker is created!');
			capture();
		};
		createFaceLandmarker();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const capture = async () => {
		if (webcamRef.current && landmarkerRef.current && webcamRef.current.video) {
			const video = webcamRef.current.video;
			if (video.currentTime > 0) {
				const result = await landmarkerRef.current.detectForVideo(
					video,
					performance.now()
				);

				if (result.faceLandmarks) {
					setFaceData(result.faceLandmarks);
				}
				if (result.faceBlendshapes) {
					setBlendShapes(result.faceBlendshapes);
				} else {
					console.log('No blend shapes detected'); // Log if no blend shapes
				}
			}
		}
		requestAnimationFrame(capture);
	};

	useEffect(() => {
		const ctx = canvasRef.current.getContext('2d');
		drawingUtilsRef.current = new DrawingUtils(ctx);
	}, []);

	useEffect(() => {
		const ctx = canvasRef.current.getContext('2d');
		if (drawingUtilsRef.current) {
			ctx.clearRect(0, 0, 1280, 720);
			for (const face of faceData) {
				drawingUtilsRef.current.drawConnectors(
					face,
					FaceLandmarker.FACE_LANDMARKS_TESSELATION,
					{ color: '#C0C0C070', lineWidth: 1 }
				);
				drawingUtilsRef.current.drawConnectors(
					face,
					FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
					{ color: '#FF3030', lineWidth: 3 }
				);
				drawingUtilsRef.current.drawConnectors(
					face,
					FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW,
					{ color: '#FF3030', lineWidth: 3 }
				);
				drawingUtilsRef.current.drawConnectors(
					face,
					FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
					{ color: '#30FF30', lineWidth: 3 }
				);
				drawingUtilsRef.current.drawConnectors(
					face,
					FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW,
					{ color: '#30FF30', lineWidth: 3 }
				);
				drawingUtilsRef.current.drawConnectors(
					face,
					FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
					{ color: '#E0E0E0', lineWidth: 3 }
				);
				drawingUtilsRef.current.drawConnectors(
					face,
					FaceLandmarker.FACE_LANDMARKS_LIPS,
					{ color: '#E0E0E0', lineWidth: 2 }
				);
				drawingUtilsRef.current.drawConnectors(
					face,
					FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS,
					{ color: '#FF3030', lineWidth: 3 }
				);
				drawingUtilsRef.current.drawConnectors(
					face,
					FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS,
					{ color: '#30FF30', lineWidth: 3 }
				);
			}
		}
	}, [faceData]);

	return (
		<section className='container mx-auto'>
			<div className='relative w-full pt-[56.25%]'>
				<Webcam
					width='1280'
					height='720'
					mirrored
					id='webcam'
					audio={false}
					videoConstraints={{
						width: 1280,
						height: 720,
						facingMode: 'user',
					}}
					ref={webcamRef}
					className='absolute top-0 left-0 w-full h-full'
				/>
				<canvas
					ref={canvasRef}
					width='1280'
					height='720'
					style={{ transform: 'rotateY(180deg)' }}
					className='absolute top-0 left-0 w-full h-full'
				></canvas>
			</div>
			{/* <ul>
				{blendShapes.length === 0 && <p>No blend shapes detected.</p>}
				{blendShapes.map((blendShapeSet, index) => (
					<div key={index}>
						{blendShapeSet.categories.map((shape, shapeIndex) => (
							<li key={shapeIndex} className='blend-shapes-item'>
								<span className='blend-shapes-label'>
									{shape.displayName || shape.categoryName}
								</span>
								<span
									className='blend-shapes-value'
									style={{
										width: `calc(${shape.score * 100}% - 120px)`,
										backgroundColor: 'red',
									}}
								>
									{shape.score.toFixed(4)}
								</span>
							</li>
						))}
					</div>
				))}
			</ul> */}
		</section>
	);
}
