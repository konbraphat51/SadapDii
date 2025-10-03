import { useState, useCallback } from "react";
import { audioRecordingService } from "../services/audioRecording";
import { whisperService } from "../services/whisperTranscription";

export interface UseAudioRecordingReturn {
	isRecording: boolean;
	startRecording: () => Promise<void>;
	stopRecording: () => Promise<void>;
	saveRecording: (filename: string) => Promise<void>;
	error: string | null;
	currentBlob: Blob | null;
	audioMagnitude: number;
}

export const useAudioRecording = (
	onTranscription: (text: string) => void,
	selectedLanguage: string,
	audioSource: "microphone" | "system" = "microphone",
	audioFormat: "webm" | "mp3" = "webm",
	selectedDeviceId?: string
): UseAudioRecordingReturn => {
	const [isRecording, setIsRecording] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [currentBlob, setCurrentBlob] = useState<Blob | null>(null);
	const [audioMagnitude, setAudioMagnitude] = useState<number>(0);

	const startRecording = useCallback(async () => {
		try {
			setError(null);

			// Set up magnitude update callback
			audioRecordingService.setMagnitudeUpdateCallback((magnitude: number) => {
				setAudioMagnitude(magnitude);
			});

			const success = await audioRecordingService.startRecording({
				deviceId: selectedDeviceId,
				audioSource,
				format: audioFormat,
			});
			if (success) {
				setIsRecording(true);
			} else {
				throw new Error("Failed to start recording");
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unknown error occurred");
		}
	}, [audioSource, audioFormat, selectedDeviceId]);

	const stopRecording = useCallback(async () => {
		try {
			setError(null);
			const audioBlob = await audioRecordingService.stopRecording();
			setIsRecording(false);
			setCurrentBlob(audioBlob);
			setAudioMagnitude(0); // Reset magnitude when stopping

			// Transcribe the audio
			const result = await whisperService.transcribeAudio(audioBlob, {
				language: selectedLanguage === "auto" ? undefined : selectedLanguage,
			});

			onTranscription(result.text);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unknown error occurred");
			setIsRecording(false);
			setAudioMagnitude(0); // Reset magnitude on error
		}
	}, [onTranscription, selectedLanguage]);

	const saveRecording = useCallback(
		async (filename: string) => {
			if (!currentBlob) {
				throw new Error("No recording to save");
			}

			try {
				await audioRecordingService.saveAudioFile(currentBlob, filename, audioFormat);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Failed to save recording");
				throw err;
			}
		},
		[currentBlob, audioFormat]
	);

	return {
		isRecording,
		startRecording,
		stopRecording,
		saveRecording,
		error,
		currentBlob,
		audioMagnitude,
	};
};
