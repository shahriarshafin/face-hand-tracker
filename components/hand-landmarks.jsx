'use client';
import {
	DrawingUtils,
	FilesetResolver,
	HandLandmarker,
} from '@mediapipe/tasks-vision';
import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';

export default function HandLandmarks() {
	const [handsData, setHandsData] = useState([]);
	const webcamRef = useRef(null);
	const canvasRef = useRef(null);
	const handLandmarkerRef = useRef(null);
	const drawingUtilsRef = useRef(null);

	useEffect(() => {
		const initializeHandLandmarker = async () => {
			const vision = await FilesetResolver.forVisionTasks(
				'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
			);
			const handLandmarker = await HandLandmarker.createFromOptions(vision, {
				baseOptions: {
					modelAssetPath: './models/hand_landmarker.task',
					delegate: 'GPU',
				},
				runningMode: 'VIDEO',
				numHands: 2,
				minHandDetectionConfidence: 0.5,
				minHandPresenceConfidence: 0.5,
				minTrackingConfidence: 0.5,
			});
			handLandmarkerRef.current = handLandmarker;
			console.log('Hand landmarker is created!');
			startCapture();
		};
		initializeHandLandmarker();
	}, []);

	const startCapture = async () => {
		if (
			webcamRef.current &&
			handLandmarkerRef.current &&
			webcamRef.current.video
		) {
			const video = webcamRef.current.video;
			if (video.currentTime > 0) {
				const result = await handLandmarkerRef.current.detectForVideo(
					video,
					performance.now()
				);
				if (result.landmarks && result.handedness) {
					const handsData = result.landmarks.map((landmark, index) => ({
						landmark,
						handedness: result.handedness[index][0].categoryName,
					}));
					setHandsData(handsData);
				}
			}
		}
		requestAnimationFrame(startCapture);
	};

	useEffect(() => {
		const ctx = canvasRef.current.getContext('2d');
		drawingUtilsRef.current = new DrawingUtils(ctx);
	}, []);

	useEffect(() => {
		const ctx = canvasRef.current.getContext('2d');
		if (drawingUtilsRef.current) {
			ctx.clearRect(0, 0, 1280, 720);
			handsData.forEach(({ landmark, handedness }) => {
				const isLeftHand = handedness === 'Left';
				const handColor = isLeftHand ? '#FF0000' : '#00FF00';
				const handConnect = isLeftHand ? '#00FF00' : '#FF0000';

				// Draw hand connectors
				drawingUtilsRef.current.drawConnectors(
					landmark,
					HandLandmarker.HAND_CONNECTIONS,
					{
						color: handColor,
						lineWidth: 5,
					}
				);

				drawingUtilsRef.current.drawLandmarks(landmark, {
					color: handColor,
					radius: 10,
					lineWidth: 4,
					fillColor: handConnect,
				});
			});
		}
	}, [handsData]);

	return (
		<section>
			<div className='relative w-full pt-[56.25%]'>
				{handsData.map((hand, idx) => (
					<div
						key={idx}
						className={`flex flex-col gap-2 absolute top-0 z-10 p-4 ${
							hand.handedness === 'Left' ? 'left-0' : 'right-0'
						}`}
					>
						<h2 className='text-lg tracking-widest'>{`Hand ${idx + 1} (${
							hand.handedness
						})`}</h2>
						{hand.landmark.map((point, pointIdx) => (
							<p
								key={pointIdx}
								className='text-sm tracking-widest text-black'
							>{`Landmark ${pointIdx}: X: ${point.x.toFixed(
								3
							)}, Y: ${point.y.toFixed(3)}, Z: ${point.z.toFixed(
								3
							)}, Visibility: ${point.visibility}`}</p>
						))}
					</div>
				))}

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
