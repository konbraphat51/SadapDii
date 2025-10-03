import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import { azureSpeechService } from "./azureSpeechTranscription";

export interface RealtimeTranscriptionOptions {
	language?: string;
	model?: string; // Kept for backward compatibility but not used in Azure
}

export interface RealtimeTranscriptionEvent {
	type: "transcript" | "error" | "connection" | "final";
	text?: string;
	isFinal?: boolean;
	confidence?: number;
	error?: string;
	status?: "connecting" | "connected" | "disconnected" | "error";
}

export class RealtimeTranscriptionService {
	private speechKey: string;
	private speechRegion: string;
	private recognizer: sdk.SpeechRecognizer | null = null;
	private audioConfig: sdk.AudioConfig | null = null;
	private isConnected = false;
	private onTranscriptionCallback?: (event: RealtimeTranscriptionEvent) => void;

	constructor() {
		this.speechKey = import.meta.env.VITE_AZURE_SPEECH_KEY || "";
		this.speechRegion = import.meta.env.VITE_AZURE_SPEECH_REGION || "";

		if (!this.speechKey || !this.speechRegion) {
			console.warn("Azure Speech key or region not found in environment variables");
		}
	}

	// Set callback for transcription events
	setTranscriptionCallback(
		callback: (event: RealtimeTranscriptionEvent) => void
	): void {
		this.onTranscriptionCallback = callback;
	}

	// Start real-time transcription session
	async startRealtimeTranscription(
		stream: MediaStream,
		options: RealtimeTranscriptionOptions = {}
	): Promise<void> {
		try {
			console.log("[Azure Real-time] Starting real-time transcription...");

			if (!this.speechKey || !this.speechRegion) {
				throw new Error("Azure Speech key or region not configured");
			}

			this.emitEvent({
				type: "connection",
				status: "connecting",
			});

			// Create Azure audio config from MediaStream
			this.audioConfig = azureSpeechService.createAudioConfigFromStream(stream);

			// Create Azure speech recognizer
			this.recognizer = azureSpeechService.createRealtimeRecognizer(
				this.audioConfig,
				options.language
			);

			// Set up event handlers
			this.setupRecognizerEvents();

			// Start continuous recognition
			this.recognizer.startContinuousRecognitionAsync(
				() => {
					console.log("[Azure Real-time] Continuous recognition started");
					this.isConnected = true;
					this.emitEvent({
						type: "connection",
						status: "connected",
					});
				},
				(error) => {
					console.error("[Azure Real-time] Failed to start recognition:", error);
					this.emitEvent({
						type: "error",
						error: error,
					});
				}
			);
		} catch (error) {
			console.error("Failed to start real-time transcription:", error);
			this.emitEvent({
				type: "error",
				error: error instanceof Error ? error.message : "Unknown error",
			});
			throw error;
		}
	}

	// Stop real-time transcription
	async stopRealtimeTranscription(): Promise<void> {
		try {
			console.log("[Azure Real-time] Stopping real-time transcription...");

			if (this.recognizer) {
				this.recognizer.stopContinuousRecognitionAsync(
					() => {
						console.log("[Azure Real-time] Continuous recognition stopped");
						if (this.recognizer) {
							this.recognizer.close();
							this.recognizer = null;
						}
					},
					(error) => {
						console.error("[Azure Real-time] Error stopping recognition:", error);
					}
				);
			}

			if (this.audioConfig) {
				// Clean up audio context and processor if they exist
				const audioStream = (this.audioConfig as any)._audioInputStream;
				if (audioStream && audioStream._audioContext) {
					await audioStream._audioContext.close();
				}
				this.audioConfig = null;
			}

			this.isConnected = false;

			this.emitEvent({
				type: "connection",
				status: "disconnected",
			});
		} catch (error) {
			console.error("Error stopping real-time transcription:", error);
		}
	}

	// Set up Azure Speech Recognizer event handlers
	private setupRecognizerEvents(): void {
		if (!this.recognizer) return;

		// Intermediate results (partial transcription)
		this.recognizer.recognizing = (_, event) => {
			if (event.result.text) {
				console.log(`[Azure Real-time] Recognizing: ${event.result.text}`);
				this.emitEvent({
					type: "transcript",
					text: event.result.text,
					isFinal: false,
					confidence: 0.8,
				});
			}
		};

		// Final results
		this.recognizer.recognized = (_, event) => {
			if (
				event.result.reason === sdk.ResultReason.RecognizedSpeech &&
				event.result.text
			) {
				console.log(`[Azure Real-time] Recognized: ${event.result.text}`);
				this.emitEvent({
					type: "final",
					text: event.result.text,
					isFinal: true,
					confidence: 0.9,
				});
			} else if (event.result.reason === sdk.ResultReason.NoMatch) {
				console.log("[Azure Real-time] No speech recognized");
			}
		};

		// Handle errors
		this.recognizer.canceled = (_, event) => {
			console.error(`[Azure Real-time] Recognition canceled: ${event.reason}`);

			if (event.reason === sdk.CancellationReason.Error) {
				const errorMessage = `Recognition error: ${event.errorDetails}`;
				this.emitEvent({
					type: "error",
					error: errorMessage,
				});
			}
		};

		// Session events
		this.recognizer.sessionStarted = () => {
			console.log("[Azure Real-time] Session started");
		};

		this.recognizer.sessionStopped = () => {
			console.log("[Azure Real-time] Session stopped");
		};
	}

	// Emit transcription event
	private emitEvent(event: RealtimeTranscriptionEvent): void {
		if (this.onTranscriptionCallback) {
			this.onTranscriptionCallback(event);
		}
	}

	// Check if service is connected
	isRealtimeConnected(): boolean {
		return this.isConnected;
	}

	// Check if Azure Speech service is configured
	isConfigured(): boolean {
		return !!(this.speechKey && this.speechRegion);
	}

	// Set Azure Speech key
	setSpeechKey(speechKey: string): void {
		this.speechKey = speechKey;
	}

	// Set Azure Speech region
	setSpeechRegion(speechRegion: string): void {
		this.speechRegion = speechRegion;
	}
}

export const realtimeTranscriptionService = new RealtimeTranscriptionService();
