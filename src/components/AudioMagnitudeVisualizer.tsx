import React from "react";

interface AudioMagnitudeVisualizerProps {
	magnitude: number;
	isActive: boolean;
	className?: string;
}

export const AudioMagnitudeVisualizer: React.FC<
	AudioMagnitudeVisualizerProps
> = ({ magnitude, isActive, className = "" }) => {
	// Create array of bars for visualization (16 bars)
	const barCount = 16;
	const bars = Array.from({ length: barCount }, (_, index) => {
		// Each bar represents a different frequency range
		// Lower index = lower frequencies, which typically have higher magnitude
		const barThreshold = (index / barCount) * 0.8;
		const isBarActive = isActive && magnitude > barThreshold;

		// Calculate bar height based on magnitude
		const baseHeight = 8; // minimum height in pixels
		const maxHeight = 32; // maximum height in pixels
		const barHeight = isBarActive
			? Math.max(
					baseHeight,
					Math.min(maxHeight, baseHeight + magnitude * (maxHeight - baseHeight))
			  )
			: baseHeight;

		return {
			id: index,
			isActive: isBarActive,
			height: barHeight,
			intensity: Math.max(0, Math.min(1, magnitude - barThreshold)),
		};
	});

	return (
		<div className={`audio-magnitude-visualizer ${className}`}>
			<div className="magnitude-info">
				<span className="magnitude-label">Audio Level:</span>
				<span className="magnitude-value">{Math.round(magnitude * 100)}%</span>
			</div>
			<div className="magnitude-bars">
				{bars.map((bar) => (
					<div
						key={bar.id}
						className={`magnitude-bar ${bar.isActive ? "active" : ""}`}
						style={{
							height: `${bar.height}px`,
							opacity: bar.isActive ? Math.max(0.3, bar.intensity) : 0.2,
						}}
					/>
				))}
			</div>
		</div>
	);
};
