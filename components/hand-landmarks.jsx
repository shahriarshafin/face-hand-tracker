'use client';

import {
	DrawingUtils,
	FilesetResolver,
	HandLandmarker,
} from '@mediapipe/tasks-vision';
import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';

export default function HandLandmarks() {
	const [poseData, setPoseData] = useState([]);
	const webcamRef = useRef(null);
	const canvasRef = useRef(null);
	const landmarkerRef = useRef(null);
	const drawingUtilsRef = useRef(null);

	useEffect(() => {
		const createHandLandmarker = async () => {
			const vision = await FilesetResolver.forVisionTasks(
				'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
			);
			const handLandmarker = await HandLandmarker.createFromOptions(vision, {
				baseOptions: {
					modelAssetPath: `./models/hand_landmarker.task`,
					delegate: 'GPU',
				},
				runningMode: 'VIDEO',
				numHands: 2,
			});
			landmarkerRef.current = handLandmarker;
			console.log('Hand landmarker is created!');
			capture();
		};
		createHandLandmarker();
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
				if (result.landmarks) {
					setPoseData(result.landmarks);
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
			poseData.forEach((hand, index) => {
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
	}, [poseData]);

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
		</section>
	);
}
