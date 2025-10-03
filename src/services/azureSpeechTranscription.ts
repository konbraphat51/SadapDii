import * as sdk from "microsoft-cognitiveservices-speech-sdk";

export interface TranscriptionOptions {
	language?: string;
	prompt?: string;
}

export interface TranscriptionResult {
	text: string;
	language?: string;
}

// Azure Speech service supported languages
export const SUPPORTED_LANGUAGES = [
	{ code: "auto", name: "Auto-detect" },
	{ code: "en-US", name: "English (US)" },
	{ code: "en-GB", name: "English (UK)" },
	{ code: "es-ES", name: "Spanish (Spain)" },
	{ code: "es-MX", name: "Spanish (Mexico)" },
	{ code: "fr-FR", name: "French" },
	{ code: "de-DE", name: "German" },
	{ code: "it-IT", name: "Italian" },
	{ code: "pt-BR", name: "Portuguese (Brazil)" },
	{ code: "pt-PT", name: "Portuguese (Portugal)" },
	{ code: "ru-RU", name: "Russian" },
	{ code: "ja-JP", name: "Japanese" },
	{ code: "ko-KR", name: "Korean" },
	{ code: "zh-CN", name: "Chinese (Simplified)" },
	{ code: "zh-TW", name: "Chinese (Traditional)" },
	{ code: "ar-SA", name: "Arabic (Saudi Arabia)" },
	{ code: "hi-IN", name: "Hindi" },
	{ code: "nl-NL", name: "Dutch" },
	{ code: "pl-PL", name: "Polish" },
	{ code: "sv-SE", name: "Swedish" },
	{ code: "da-DK", name: "Danish" },
	{ code: "no-NO", name: "Norwegian" },
	{ code: "fi-FI", name: "Finnish" },
];

export class AzureSpeechTranscriptionService {
	private speechKey: string;
	private speechRegion: string;
	private speechConfig: sdk.SpeechConfig | null = null;

	constructor() {
		this.speechKey = import.meta.env.VITE_AZURE_SPEECH_KEY || "";
		this.speechRegion = import.meta.env.VITE_AZURE_SPEECH_REGION || "";

		if (!this.speechKey || !this.speechRegion) {
			console.warn("Azure Speech key or region not found in environment variables");
		} else {
			this.initializeSpeechConfig();
		}
	}

	private initializeSpeechConfig(): void {
		try {
			this.speechConfig = sdk.SpeechConfig.fromSubscription(
				this.speechKey,
				this.speechRegion
			);
			this.speechConfig.speechRecognitionLanguage = "en-US"; // Default language
		} catch (error) {
			console.error("Failed to initialize Azure Speech Config:", error);
		}
	}

	async transcribeAudio(
		audioBlob: Blob,
		options: TranscriptionOptions = {}
	): Promise<TranscriptionResult> {
		if (!this.speechConfig) {
			throw new Error("Azure Speech service is not configured");
		}

		try {
			// Set language if specified
			if (options.language && options.language !== "auto") {
				this.speechConfig.speechRecognitionLanguage = options.language;
			}

			// Convert blob to audio buffer
			const audioBuffer = await audioBlob.arrayBuffer();
			const audioFormat = sdk.AudioStreamFormat.getWaveFormatPCM(16000, 16, 1);
			const audioStream = sdk.AudioInputStream.createPushStream(audioFormat);

			// Push audio data to stream
			audioStream.write(audioBuffer);
			audioStream.close();

			// Create audio config from stream
			const audioConfig = sdk.AudioConfig.fromStreamInput(audioStream);

			// Create speech recognizer
			const recognizer = new sdk.SpeechRecognizer(this.speechConfig, audioConfig);

			return new Promise((resolve, reject) => {
				recognizer.recognizeOnceAsync(
					(result) => {
						recognizer.close();

						switch (result.reason) {
							case sdk.ResultReason.RecognizedSpeech:
								resolve({
									text: result.text || "",
									language: this.speechConfig?.speechRecognitionLanguage,
								});
								break;
							case sdk.ResultReason.NoMatch:
								resolve({
									text: "",
									language: this.speechConfig?.speechRecognitionLanguage,
								});
								break;
							case sdk.ResultReason.Canceled:
								const cancellation = sdk.CancellationDetails.fromResult(result);
								reject(
									new Error(
										`Speech recognition canceled: ${cancellation.reason}. Error: ${cancellation.errorDetails}`
									)
								);
								break;
							default:
								reject(new Error(`Unexpected result reason: ${result.reason}`));
						}
					},
					(error) => {
						recognizer.close();
						reject(new Error(`Speech recognition failed: ${error}`));
					}
				);
			});
		} catch (error) {
			console.error("Azure Speech transcription error:", error);
			throw error;
		}
	}

	// Create a speech recognizer for real-time transcription
	createRealtimeRecognizer(
		audioConfig: sdk.AudioConfig,
		language?: string
	): sdk.SpeechRecognizer {
		if (!this.speechConfig) {
			throw new Error("Azure Speech service is not configured");
		}

		// Clone config to avoid modifying the shared instance
		const config = sdk.SpeechConfig.fromSubscription(
			this.speechKey,
			this.speechRegion
		);

		if (language && language !== "auto") {
			config.speechRecognitionLanguage = language;
		} else {
			config.speechRecognitionLanguage = "en-US";
		}

		// Enable continuous recognition
		config.setProperty(sdk.PropertyId.Speech_SegmentationSilenceTimeoutMs, "2000");
		config.setProperty(
			sdk.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs,
			"5000"
		);

		return new sdk.SpeechRecognizer(config, audioConfig);
	}

	// Create audio config from MediaStream for real-time recognition
	createAudioConfigFromStream(stream: MediaStream): sdk.AudioConfig {
		// Create audio format for 16kHz, 16-bit, mono PCM
		const audioFormat = sdk.AudioStreamFormat.getWaveFormatPCM(16000, 16, 1);
		const audioStream = sdk.AudioInputStream.createPushStream(audioFormat);

		// Set up audio processing from MediaStream
		const audioContext = new AudioContext({ sampleRate: 16000 });
		const source = audioContext.createMediaStreamSource(stream);

		// Create script processor for audio data
		const processor = audioContext.createScriptProcessor(4096, 1, 1);

		processor.onaudioprocess = (event) => {
			const inputData = event.inputBuffer.getChannelData(0);

			// Convert Float32Array to Int16Array (PCM 16-bit)
			const pcmData = new Int16Array(inputData.length);
			for (let i = 0; i < inputData.length; i++) {
				const sample = Math.max(-1, Math.min(1, inputData[i]));
				pcmData[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
			}

			// Write PCM data to Azure audio stream
			audioStream.write(pcmData.buffer);
		};

		source.connect(processor);
		processor.connect(audioContext.destination);

		// Store references for cleanup
		(audioStream as any)._audioContext = audioContext;
		(audioStream as any)._processor = processor;

		return sdk.AudioConfig.fromStreamInput(audioStream);
	}

	isConfigured(): boolean {
		return !!(this.speechKey && this.speechRegion && this.speechConfig);
	}

	setSpeechKey(speechKey: string): void {
		this.speechKey = speechKey;
		this.initializeSpeechConfig();
	}

	setSpeechRegion(speechRegion: string): void {
		this.speechRegion = speechRegion;
		this.initializeSpeechConfig();
	}
}

export const azureSpeechService = new AzureSpeechTranscriptionService();
