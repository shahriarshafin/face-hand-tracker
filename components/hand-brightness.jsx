'use client';
import {
	DrawingUtils,
	FilesetResolver,
	HandLandmarker,
} from '@mediapipe/tasks-vision';
import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';

export default function HandBrightness() {
	const [handsData, setHandsData] = useState([]);
	const [scaledDistance, setScaledDistance] = useState(0); // State to store scaled distance

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
					calculateBrightness(handsData);
				}
			}
		}
		requestAnimationFrame(startCapture);
	};

	const calculateDistance = (point1, point2) => {
		const dx = point2.x - point1.x;
		const dy = point2.y - point1.y;
		return Math.sqrt(dx * dx + dy * dy);
	};

	const calculateBrightness = (handsData) => {
		handsData.forEach(({ landmark }) => {
			const thumbTip = landmark[4];
			const indexTip = landmark[8];
			const distance = calculateDistance(thumbTip, indexTip);

			const maxDistance = 0.2; // Maximum distance between thumb and index finger for full brightness (adjust as needed)
			const minDistance = 0.01; // Minimum distance (fingers very close or touching)

			// Invert the scaling: high distance should result in high brightness
			let scaledDistance =
				100 * ((maxDistance - distance) / (maxDistance - minDistance));
			scaledDistance = Math.max(0, Math.min(scaledDistance, 100));

			// Store the scaled distance in state
			setScaledDistance(scaledDistance);
		});
	};

	useEffect(() => {
		const ctx = canvasRef.current.getContext('2d');
		drawingUtilsRef.current = new DrawingUtils(ctx);
	}, []);

	useEffect(() => {
		const ctx = canvasRef.current.getContext('2d');
		if (drawingUtilsRef.current) {
			ctx.clearRect(0, 0, 1280, 720);

			// Set opacity based on scaled distance for the full body overlay
			ctx.globalAlpha = scaledDistance / 100;

			// Draw full body overlay
			ctx.fillStyle = '#000000';
			ctx.fillRect(0, 0, 1280, 720);

			// Reset globalAlpha to 1 for drawing the hands
			ctx.globalAlpha = 1;

			// Draw hands
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

				// Draw hand landmarks
				landmark.forEach((point, index) => {
					const isThumbOrIndex = index === 4 || index === 8;
					const color = isThumbOrIndex ? '#FFFF00' : handColor;
					drawingUtilsRef.current.drawLandmarks([point], {
						color: color,
						radius: 10,
						lineWidth: 4,
						fillColor: handConnect,
					});
				});

				// Draw a line connecting the thumb tip (landmark[4]) and the index finger tip (landmark[8])
				const thumbTip = landmark[4];
				const indexTip = landmark[8];
				ctx.beginPath();
				ctx.moveTo(thumbTip.x * 1280, thumbTip.y * 720);
				ctx.lineTo(indexTip.x * 1280, indexTip.y * 720);
				ctx.strokeStyle = '#FFFF00';
				ctx.lineWidth = 4;
				ctx.stroke();
			});
		}
	}, [handsData, scaledDistance]);

	let progressBarDistance = 100 - scaledDistance;

	return (
		<section>
			<div className='relative w-full pt-[56.25%]'>
				<div className='py-6 flex flex-col justify-center items-center sm:py-12 px-4 space-y-3 absolute top-0 z-20'>
					<div className='bg-white rounded-xl shadow-lg overflow-hidden p-1'>
						<div className='relative w-6 h-96 flex flex-col justify-center items-center'>
							<div
								className={`absolute left-0 right-0 bottom-0 rounded-lg bg-orange-200`}
								style={{
									height: `${progressBarDistance.toFixed(0)}%`, // Use height for vertical progress bar
								}}
							/>
							<div className='relative text-orange-900 font-medium text-sm'>
								{progressBarDistance.toFixed(0)}
							</div>
							<svg
								xmlns='http://www.w3.org/2000/svg'
								fill='none'
								viewBox='0 0 24 24'
								strokeWidth={1.5}
								stroke='currentColor'
								className='size-6 absolute bottom-0'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									d='M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z'
								/>
							</svg>
						</div>
					</div>
				</div>
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
