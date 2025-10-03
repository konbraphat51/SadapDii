export interface AudioDevice {
	deviceId: string;
	label: string;
}

export type AudioSource = "microphone" | "system";
export type AudioFormat = "webm" | "mp3";

export interface AudioRecordingOptions {
	deviceId?: string;
	mimeType?: string;
	audioSource?: AudioSource;
	format?: AudioFormat;
}

export class AudioRecordingService {
	private mediaRecorder: MediaRecorder | null = null;
	private audioChunks: Blob[] = [];
	private stream: MediaStream | null = null;

	async getAudioDevices(): Promise<AudioDevice[]> {
		try {
			const devices = await navigator.mediaDevices.enumerateDevices();
			return devices
				.filter((device) => device.kind === "audioinput")
				.map((device) => ({
					deviceId: device.deviceId,
					label: device.label || `Microphone ${device.deviceId.slice(0, 8)}`,
				}));
		} catch (error) {
			console.error("Error getting audio devices:", error);
			return [];
		}
	}

	async startRecording(options: AudioRecordingOptions = {}): Promise<boolean> {
		try {
			// Determine audio source and get appropriate stream
			if (options.audioSource === "system") {
				this.stream = await this.getSystemAudioStream();
			} else {
				// Default to microphone
				this.stream = await navigator.mediaDevices.getUserMedia({
					audio: {
						deviceId: options.deviceId ? { exact: options.deviceId } : undefined,
						echoCancellation: true,
						noiseSuppression: true,
						autoGainControl: true,
					},
				});
			}

			// Determine MIME type based on format
			let mimeType = options.mimeType;
			if (!mimeType) {
				if (options.format === "mp3") {
					// For MP3, we'll record in WebM and convert later
					mimeType = "audio/webm;codecs=opus";
				} else {
					mimeType = "audio/webm;codecs=opus";
				}
			}

			this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });

			this.audioChunks = [];

			this.mediaRecorder.ondataavailable = (event) => {
				if (event.data.size > 0) {
					this.audioChunks.push(event.data);
				}
			};

			this.mediaRecorder.start(100); // Collect data every 100ms for real-time processing
			return true;
		} catch (error) {
			console.error("Error starting recording:", error);
			return false;
		}
	}

	private async getSystemAudioStream(): Promise<MediaStream> {
		try {
			// Use getDisplayMedia to capture system audio
			const displayStream = await navigator.mediaDevices.getDisplayMedia({
				video: false,
				audio: {
					echoCancellation: true,
					noiseSuppression: true,
					autoGainControl: true,
				} as MediaTrackConstraints,
			});

			return displayStream;
		} catch (error) {
			// Fallback: try to capture with a minimal video track and extract audio
			const displayStream = await navigator.mediaDevices.getDisplayMedia({
				video: {
					width: { ideal: 1 },
					height: { ideal: 1 },
					frameRate: { ideal: 1 },
				},
				audio: {
					echoCancellation: true,
					noiseSuppression: true,
					autoGainControl: true,
				} as MediaTrackConstraints,
			});

			// Remove video tracks to keep only audio
			const videoTracks = displayStream.getVideoTracks();
			videoTracks.forEach((track) => {
				displayStream.removeTrack(track);
				track.stop();
			});

			return displayStream;
		}
	}

	stopRecording(): Promise<Blob> {
		return new Promise((resolve, reject) => {
			if (!this.mediaRecorder) {
				reject(new Error("No active recording"));
				return;
			}

			this.mediaRecorder.onstop = () => {
				const mimeType = this.mediaRecorder?.mimeType || "audio/webm";
				const audioBlob = new Blob(this.audioChunks, { type: mimeType });
				this.cleanup();
				resolve(audioBlob);
			};

			this.mediaRecorder.stop();
		});
	}

	isRecording(): boolean {
		return this.mediaRecorder?.state === "recording";
	}

	private cleanup(): void {
		if (this.stream) {
			this.stream.getTracks().forEach((track) => track.stop());
			this.stream = null;
		}
		this.mediaRecorder = null;
		this.audioChunks = [];
	}

	// Save audio file in specified format
	async saveAudioFile(
		audioBlob: Blob,
		filename: string,
		format: AudioFormat = "webm"
	): Promise<void> {
		const { saveAs } = await import("file-saver");

		if (format === "mp3") {
			// Convert to MP3 using lamejs library
			const mp3Blob = await this.convertToMp3(audioBlob);
			const fullFilename = `${filename}.mp3`;
			saveAs(mp3Blob, fullFilename);
		} else {
			const fullFilename = `${filename}.webm`;
			saveAs(audioBlob, fullFilename);
		}
	}

	// Convert WebM audio to MP3
	private async convertToMp3(audioBlob: Blob): Promise<Blob> {
		try {
			// Import lamejs dynamically
			const { Mp3Encoder } = await import("lamejs");

			// Convert blob to audio buffer
			const arrayBuffer = await audioBlob.arrayBuffer();
			const audioContext = new AudioContext();
			const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

			// Get audio data
			const left = audioBuffer.getChannelData(0);
			const right =
				audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : left;

			// Convert to 16-bit PCM
			const sampleRate = audioBuffer.sampleRate;
			const leftPCM = this.floatTo16BitPCM(left);
			const rightPCM = this.floatTo16BitPCM(right);

			// Encode to MP3
			const mp3encoder = new Mp3Encoder(
				audioBuffer.numberOfChannels,
				sampleRate,
				128
			);
			const mp3Data = [];

			const blockSize = 1152; // MP3 block size
			for (let i = 0; i < leftPCM.length; i += blockSize) {
				const leftChunk = leftPCM.subarray(i, i + blockSize);
				const rightChunk = rightPCM.subarray(i, i + blockSize);
				const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
				if (mp3buf.length > 0) {
					mp3Data.push(mp3buf);
				}
			}

			// Flush remaining data
			const finalMp3buf = mp3encoder.flush();
			if (finalMp3buf.length > 0) {
				mp3Data.push(finalMp3buf);
			}

			// Create MP3 blob
			const mp3Buffer = new Uint8Array(
				mp3Data.reduce((acc, arr) => acc + arr.length, 0)
			);
			let offset = 0;
			for (const data of mp3Data) {
				mp3Buffer.set(new Uint8Array(data), offset);
				offset += data.length;
			}
			return new Blob([mp3Buffer], { type: "audio/mp3" });
		} catch (error) {
			console.error("MP3 conversion failed:", error);
			// Fallback: return original blob with MP3 type
			return new Blob([audioBlob], { type: "audio/mp3" });
		}
	}

	private floatTo16BitPCM(input: Float32Array): Int16Array {
		const output = new Int16Array(input.length);
		for (let i = 0; i < input.length; i++) {
			const sample = Math.max(-1, Math.min(1, input[i]));
			output[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
		}
		return output;
	}

	// Get supported recording formats
	getSupportedFormats(): AudioFormat[] {
		// MP3 is supported through conversion, WebM is native
		return ["webm", "mp3"];
	}

	// Check if system audio capture is supported
	isSystemAudioSupported(): boolean {
		return "getDisplayMedia" in navigator.mediaDevices;
	}
}

export const audioRecordingService = new AudioRecordingService();
