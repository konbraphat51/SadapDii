import { useState, useCallback } from "react";
import { audioRecordingService } from "../services/audioRecording";
import { azureSpeechService } from "../services/azureSpeechTranscription";

export interface UseAudioRecordingReturn {
	isRecording: boolean;
	startRecording: () => Promise<void>;
	stopRecording: () => Promise<void>;
	saveRecording: (filename: string) => Promise<void>;
	error: string | null;
	currentBlob: Blob | null;
	audioMagnitude: number;
}

export interface AudioRecordingOptions {
	onTranscription: (text: string) => void;
	selectedLanguage: string;
	audioSource?: "microphone" | "system";
	audioFormat?: "webm" | "mp3";
	selectedDeviceId?: string;
	// Real-time transcription options
	realtimeEnabled?: boolean;
	onRealtimeTranscription?: (text: string, isFinal: boolean) => void;
	startRealtimeTranscription?: (
		stream: MediaStream,
		language?: string
	) => Promise<void>;
	stopRealtimeTranscription?: () => Promise<void>;
}

export const useAudioRecording = (
	options: AudioRecordingOptions
): UseAudioRecordingReturn => {
	const {
		onTranscription,
		selectedLanguage,
		audioSource = "microphone",
		audioFormat = "webm",
		selectedDeviceId,
		realtimeEnabled = false,
		startRealtimeTranscription,
		stopRealtimeTranscription,
	} = options;
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

				// Start real-time transcription if enabled
				if (realtimeEnabled && startRealtimeTranscription) {
					console.log(
						"[Audio Recording] Real-time transcription is enabled, starting..."
					);
					try {
						const stream = audioRecordingService.getCurrentStream();
						if (stream) {
							console.log(
								"[Audio Recording] Got audio stream, starting real-time transcription"
							);
							await startRealtimeTranscription(stream, selectedLanguage);
							console.log("[Audio Recording] Real-time transcription started successfully");
						} else {
							console.warn(
								"[Audio Recording] No audio stream available for real-time transcription"
							);
						}
					} catch (realtimeError) {
						console.error("Failed to start real-time transcription:", realtimeError);
						// Don't fail the entire recording if real-time fails
					}
				} else {
					console.log(
						"[Audio Recording] Real-time transcription not enabled or function not available"
					);
				}
			} else {
				throw new Error("Failed to start recording");
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unknown error occurred");
		}
	}, [
		audioSource,
		audioFormat,
		selectedDeviceId,
		realtimeEnabled,
		startRealtimeTranscription,
		selectedLanguage,
	]);

	const stopRecording = useCallback(async () => {
		try {
			setError(null);

			// Stop real-time transcription if it was enabled
			if (realtimeEnabled && stopRealtimeTranscription) {
				try {
					await stopRealtimeTranscription();
				} catch (realtimeError) {
					console.error("Failed to stop real-time transcription:", realtimeError);
				}
			}

			const audioBlob = await audioRecordingService.stopRecording();
			setIsRecording(false);
			setCurrentBlob(audioBlob);
			setAudioMagnitude(0); // Reset magnitude when stopping

			// Only do batch transcription if real-time is not enabled
			if (!realtimeEnabled) {
				// Transcribe the audio using Azure Speech
				const result = await azureSpeechService.transcribeAudio(audioBlob, {
					language: selectedLanguage === "auto" ? undefined : selectedLanguage,
				});
				onTranscription(result.text);
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unknown error occurred");
			setIsRecording(false);
			setAudioMagnitude(0); // Reset magnitude on error
		}
	}, [
		onTranscription,
		selectedLanguage,
		realtimeEnabled,
		stopRealtimeTranscription,
	]);

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
