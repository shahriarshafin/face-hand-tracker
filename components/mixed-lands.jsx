'use client';

import {
	DrawingUtils,
	FaceLandmarker,
	FilesetResolver,
	HandLandmarker,
} from '@mediapipe/tasks-vision';
import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';

const videoConstraints = {
	width: 1280,
	height: 720,
	facingMode: 'user',
};

export default function MixedLands() {
	const [faceData, setFaceData] = useState([]);
	const [handData, setHandData] = useState([]);
	const webcamRef = useRef(null);
	const canvasRef = useRef(null);
	const faceLandmarkerRef = useRef(null);
	const handLandmarkerRef = useRef(null);
	const drawingUtilsRef = useRef(null);

	useEffect(() => {
		const initializeLandmarkers = async () => {
			const vision = await FilesetResolver.forVisionTasks(
				'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
			);

			faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(
				vision,
				{
					baseOptions: {
						modelAssetPath: `./models/face_landmarker.task`,
						delegate: 'GPU',
					},
					outputFaceBlendshapes: true,
					runningMode: 'VIDEO',
					numFaces: 1,
				}
			);

			handLandmarkerRef.current = await HandLandmarker.createFromOptions(
				vision,
				{
					baseOptions: {
						modelAssetPath: `./models/hand_landmarker.task`,
						delegate: 'GPU',
					},
					runningMode: 'VIDEO',
					numHands: 2,
				}
			);

			console.log('Landmarkers initialized!');
			requestAnimationFrame(capture);
		};
		initializeLandmarkers();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const capture = async () => {
		const video = webcamRef.current?.video;
		if (video && video.currentTime > 0) {
			const [faceResult, handResult] = await Promise.all([
				faceLandmarkerRef.current.detectForVideo(video, performance.now()),
				handLandmarkerRef.current.detectForVideo(video, performance.now()),
			]);

			if (faceResult.faceLandmarks) setFaceData(faceResult.faceLandmarks);
			if (faceResult.faceBlendshapes)
				if (handResult.landmarks) setHandData(handResult.landmarks);
		}
		requestAnimationFrame(capture);
	};

	useEffect(() => {
		drawingUtilsRef.current = new DrawingUtils(
			canvasRef.current.getContext('2d')
		);
	}, []);

	useEffect(() => {
		const ctx = canvasRef.current.getContext('2d');
		ctx.clearRect(0, 0, 1280, 720);

		if (drawingUtilsRef.current) {
			faceData.forEach((face) => {
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
			});

			handData.forEach((hand, index) => {
				const handColor = index % 2 === 0 ? '#00FF00' : '#ff0000';
				const handConnect = index % 2 === 0 ? '#ff0000' : '#00FF00';

				drawingUtilsRef.current.drawConnectors(
					hand,
					HandLandmarker.HAND_CONNECTIONS,
					{
						color: handColor,
						lineWidth: 5,
					}
				);

				drawingUtilsRef.current.drawLandmarks(hand, {
					color: handColor,
					radius: 10,
					lineWidth: 4,
					fillColor: handConnect,
				});
			});
		}
	}, [faceData, handData]);

	return (
		<section className='container mx-auto'>
			<div className='relative w-full pt-[56.25%]'>
				<Webcam
					width='1280'
					height='720'
					mirrored
					id='webcam'
					audio={false}
					videoConstraints={videoConstraints}
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
		</section>
	);
}
