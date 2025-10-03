import { useState, useCallback } from "react";
import type { TextSegment } from "../types";

export interface UseTextSegmentsReturn {
	segments: TextSegment[];
	addTranscribedText: (text: string) => void;
	addRealtimeText: (text: string, isFinal: boolean) => void;
	updateSegment: (id: string, newText: string, isUserInput: boolean) => void;
	clearSegments: () => void;
	getFormattedText: () => string;
}

export const useTextSegments = (): UseTextSegmentsReturn => {
	const [segments, setSegments] = useState<TextSegment[]>([]);
	const [currentRealtimeId, setCurrentRealtimeId] = useState<string | null>(null);

	const addTranscribedText = useCallback((text: string) => {
		const newSegment: TextSegment = {
			id: `azure_speech_${Date.now()}_${Math.random()}`,
			text: text.trim(),
			isUserInput: false,
			timestamp: Date.now(),
		};

		setSegments((prev) => [...prev, newSegment]);
	}, []);

	const addRealtimeText = useCallback(
		(text: string, isFinal: boolean) => {
			if (!text.trim()) return;

			if (isFinal) {
				// Final transcription - create a new permanent segment
				const newSegment: TextSegment = {
					id: `realtime_final_${Date.now()}_${Math.random()}`,
					text: text.trim(),
					isUserInput: false,
					timestamp: Date.now(),
				};

				setSegments((prev) => {
					// Remove any temporary realtime segment
					const filtered = currentRealtimeId
						? prev.filter((seg) => seg.id !== currentRealtimeId)
						: prev;
					return [...filtered, newSegment];
				});
				setCurrentRealtimeId(null);
			} else {
				// Partial transcription - update or create temporary segment
				const segmentId = currentRealtimeId || `realtime_temp_${Date.now()}`;

				if (currentRealtimeId) {
					// Update existing temporary segment
					setSegments((prev) =>
						prev.map((segment) =>
							segment.id === currentRealtimeId ? { ...segment, text: text.trim() } : segment
						)
					);
				} else {
					// Create new temporary segment
					const tempSegment: TextSegment = {
						id: segmentId,
						text: text.trim(),
						isUserInput: false,
						timestamp: Date.now(),
					};
					setSegments((prev) => [...prev, tempSegment]);
					setCurrentRealtimeId(segmentId);
				}
			}
		},
		[currentRealtimeId]
	);

	const updateSegment = useCallback(
		(id: string, newText: string, isUserInput: boolean) => {
			setSegments((prev) =>
				prev.map((segment) =>
					segment.id === id ? { ...segment, text: newText, isUserInput } : segment
				)
			);
		},
		[]
	);

	const clearSegments = useCallback(() => {
		setSegments([]);
	}, []);

	const getFormattedText = useCallback(() => {
		return segments.map((segment) => segment.text).join(" ");
	}, [segments]);

	return {
		segments,
		addTranscribedText,
		addRealtimeText,
		updateSegment,
		clearSegments,
		getFormattedText,
	};
};
