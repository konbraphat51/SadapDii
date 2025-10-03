import { useState, useCallback, useEffect } from "react";
import {
	realtimeTranscriptionService,
	type RealtimeTranscriptionEvent,
} from "../services/realtimeTranscription";

export interface UseRealtimeTranscriptionReturn {
	isConnected: boolean;
	connectionStatus: "disconnected" | "connecting" | "connected" | "error";
	startRealtimeTranscription: (
		stream: MediaStream,
		language?: string
	) => Promise<void>;
	stopRealtimeTranscription: () => Promise<void>;
	error: string | null;
}

export const useRealtimeTranscription = (
	onTranscriptionUpdate: (text: string, isFinal: boolean) => void
): UseRealtimeTranscriptionReturn => {
	const [isConnected, setIsConnected] = useState(false);
	const [connectionStatus, setConnectionStatus] = useState<
		"disconnected" | "connecting" | "connected" | "error"
	>("disconnected");
	const [error, setError] = useState<string | null>(null);

	// Set up transcription event handler
	useEffect(() => {
		const handleTranscriptionEvent = (event: RealtimeTranscriptionEvent) => {
			switch (event.type) {
				case "transcript":
					if (event.text) {
						onTranscriptionUpdate(event.text, event.isFinal || false);
					}
					break;

				case "connection":
					if (event.status === "connected") {
						setIsConnected(true);
						setConnectionStatus("connected");
						setError(null);
					} else if (event.status === "connecting") {
						setConnectionStatus("connecting");
					} else if (event.status === "disconnected") {
						setIsConnected(false);
						setConnectionStatus("disconnected");
					} else if (event.status === "error") {
						setIsConnected(false);
						setConnectionStatus("error");
					}
					break;

				case "error":
					setError(event.error || "Unknown transcription error");
					setConnectionStatus("error");
					break;

				case "final":
					if (event.text) {
						onTranscriptionUpdate(event.text, true);
					}
					break;
			}
		};

		realtimeTranscriptionService.setTranscriptionCallback(handleTranscriptionEvent);

		return () => {
			// Cleanup on unmount
			realtimeTranscriptionService.setTranscriptionCallback(() => {});
		};
	}, [onTranscriptionUpdate]);

	const startRealtimeTranscription = useCallback(
		async (stream: MediaStream, language?: string) => {
			try {
				setError(null);
				setConnectionStatus("connecting");

				await realtimeTranscriptionService.startRealtimeTranscription(stream, {
					language: language === "auto" ? undefined : language,
				});
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : "Failed to start real-time transcription";
				setError(errorMessage);
				setConnectionStatus("error");
				throw err;
			}
		},
		[]
	);

	const stopRealtimeTranscription = useCallback(async () => {
		try {
			await realtimeTranscriptionService.stopRealtimeTranscription();
			setIsConnected(false);
			setConnectionStatus("disconnected");
			setError(null);
		} catch (err) {
			console.error("Error stopping real-time transcription:", err);
		}
	}, []);

	return {
		isConnected,
		connectionStatus,
		startRealtimeTranscription,
		stopRealtimeTranscription,
		error,
	};
};
