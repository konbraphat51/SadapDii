export interface RealtimeTranscriptionOptions {
	language?: string;
	model?: string;
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
	private apiKey: string;
	private websocket: WebSocket | null = null;
	private isConnected = false;
	private onTranscriptionCallback?: (event: RealtimeTranscriptionEvent) => void;
	private audioContext: AudioContext | null = null;
	private processor: ScriptProcessorNode | null = null;
	private mediaStream: MediaStream | null = null;

	constructor() {
		this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || "";
		if (!this.apiKey) {
			console.warn("OpenAI API key not found in environment variables");
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
			this.mediaStream = stream;

			// Connect to OpenAI Realtime API via WebSocket
			await this.connectWebSocket(options);

			// Set up audio processing
			await this.setupAudioProcessing(stream);

			this.emitEvent({
				type: "connection",
				status: "connected",
			});
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
			// Stop audio processing
			if (this.processor) {
				this.processor.disconnect();
				this.processor = null;
			}

			if (this.audioContext) {
				await this.audioContext.close();
				this.audioContext = null;
			}

			// Close WebSocket connection
			if (this.websocket) {
				this.websocket.close();
				this.websocket = null;
			}

			this.isConnected = false;
			this.mediaStream = null;

			this.emitEvent({
				type: "connection",
				status: "disconnected",
			});
		} catch (error) {
			console.error("Error stopping real-time transcription:", error);
		}
	}

	// Connect to OpenAI Realtime API WebSocket
	private async connectWebSocket(
		options: RealtimeTranscriptionOptions
	): Promise<void> {
		return new Promise((resolve, reject) => {
			try {
				// Note: OpenAI doesn't have a direct WebSocket API for transcription yet
				// We'll simulate real-time by chunking audio and using regular API
				this.setupChunkedTranscription(options);
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	}

	// Set up chunked transcription to simulate real-time
	private setupChunkedTranscription(
		_options: RealtimeTranscriptionOptions
	): void {
		// We'll collect audio in chunks and transcribe them periodically
		this.isConnected = true;
	}

	// Set up audio processing for real-time capture
	private async setupAudioProcessing(stream: MediaStream): Promise<void> {
		try {
			console.log("[Real-time] Setting up audio processing with stream:", stream);

			this.audioContext = new AudioContext({ sampleRate: 16000 });
			const source = this.audioContext.createMediaStreamSource(stream);

			// Create a script processor for audio chunks
			const bufferSize = 4096;
			this.processor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);

			let audioBuffer: Float32Array[] = [];
			let lastTranscriptionTime = Date.now();
			const transcriptionInterval = 2000; // Transcribe every 2 seconds

			console.log(
				`[Real-time] Audio processing setup complete, will transcribe every ${transcriptionInterval}ms`
			);

			this.processor.onaudioprocess = (event) => {
				if (!this.isConnected) return;

				const inputData = event.inputBuffer.getChannelData(0);
				audioBuffer.push(new Float32Array(inputData));

				// Transcribe accumulated audio every interval
				const now = Date.now();
				if (
					now - lastTranscriptionTime >= transcriptionInterval &&
					audioBuffer.length > 0
				) {
					console.log(
						`[Real-time] Triggering transcription, buffer has ${audioBuffer.length} chunks`
					);
					this.transcribeAudioChunk(audioBuffer);
					audioBuffer = [];
					lastTranscriptionTime = now;
				}
			};

			source.connect(this.processor);
			this.processor.connect(this.audioContext.destination);
		} catch (error) {
			console.error("Error setting up audio processing:", error);
			throw error;
		}
	}

	// Transcribe accumulated audio chunk
	private async transcribeAudioChunk(audioBuffer: Float32Array[]): Promise<void> {
		try {
			console.log(
				`[Real-time] Processing audio chunk with ${audioBuffer.length} segments`
			);

			// Convert Float32Array buffer to audio blob
			const audioBlob = await this.convertToAudioBlob(audioBuffer);
			console.log(`[Real-time] Created audio blob: ${audioBlob.size} bytes`);

			// Use regular OpenAI API for transcription
			const result = await this.transcribeChunk(audioBlob);
			console.log(`[Real-time] Transcription result: "${result.text}"`);

			if (result.text.trim()) {
				this.emitEvent({
					type: "transcript",
					text: result.text,
					isFinal: false,
					confidence: 0.8,
				});
			}
		} catch (error) {
			console.error("Error transcribing audio chunk:", error);
			this.emitEvent({
				type: "error",
				error: error instanceof Error ? error.message : "Transcription error",
			});
		}
	}

	// Convert audio buffer to blob
	private async convertToAudioBlob(audioBuffer: Float32Array[]): Promise<Blob> {
		// Combine all audio chunks
		const totalLength = audioBuffer.reduce((sum, chunk) => sum + chunk.length, 0);
		const combinedBuffer = new Float32Array(totalLength);

		let offset = 0;
		for (const chunk of audioBuffer) {
			combinedBuffer.set(chunk, offset);
			offset += chunk.length;
		}

		// Convert to 16-bit PCM
		const pcmBuffer = new Int16Array(combinedBuffer.length);
		for (let i = 0; i < combinedBuffer.length; i++) {
			const sample = Math.max(-1, Math.min(1, combinedBuffer[i]));
			pcmBuffer[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
		}

		// Create WAV header
		const wavBuffer = this.createWavFile(pcmBuffer, 16000);
		return new Blob([wavBuffer], { type: "audio/wav" });
	}

	// Create WAV file from PCM data
	private createWavFile(pcmData: Int16Array, sampleRate: number): ArrayBuffer {
		const buffer = new ArrayBuffer(44 + pcmData.length * 2);
		const view = new DataView(buffer);

		// WAV header
		const writeString = (offset: number, string: string) => {
			for (let i = 0; i < string.length; i++) {
				view.setUint8(offset + i, string.charCodeAt(i));
			}
		};

		writeString(0, "RIFF");
		view.setUint32(4, 36 + pcmData.length * 2, true);
		writeString(8, "WAVE");
		writeString(12, "fmt ");
		view.setUint32(16, 16, true);
		view.setUint16(20, 1, true);
		view.setUint16(22, 1, true);
		view.setUint32(24, sampleRate, true);
		view.setUint32(28, sampleRate * 2, true);
		view.setUint16(32, 2, true);
		view.setUint16(34, 16, true);
		writeString(36, "data");
		view.setUint32(40, pcmData.length * 2, true);

		// PCM data
		let offset = 44;
		for (let i = 0; i < pcmData.length; i++) {
			view.setInt16(offset, pcmData[i], true);
			offset += 2;
		}

		return buffer;
	}

	// Transcribe a single audio chunk
	private async transcribeChunk(audioBlob: Blob): Promise<{ text: string }> {
		if (!this.apiKey) {
			throw new Error("OpenAI API key is not configured");
		}

		const formData = new FormData();
		const audioFile = new File([audioBlob], "chunk.wav", { type: "audio/wav" });

		formData.append("file", audioFile);
		formData.append("model", "whisper-1");
		formData.append("response_format", "json");

		const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${this.apiKey}`,
			},
			body: formData,
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				`API request failed: ${response.status} ${response.statusText}. ${
					errorData.error?.message || ""
				}`
			);
		}

		const result = await response.json();
		return { text: result.text || "" };
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

	// Check if API key is configured
	isConfigured(): boolean {
		return !!this.apiKey;
	}
}

export const realtimeTranscriptionService = new RealtimeTranscriptionService();
