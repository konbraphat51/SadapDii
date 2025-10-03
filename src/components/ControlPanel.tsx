import React, { useState, useEffect } from "react";
import {
	audioRecordingService,
	type AudioDevice,
} from "../services/audioRecording";
import { SUPPORTED_LANGUAGES } from "../services/whisperTranscription";
import { AudioMagnitudeVisualizer } from "./AudioMagnitudeVisualizer";

interface ControlPanelProps {
	isRecording: boolean;
	onStartRecording: () => void;
	onStopRecording: () => void;
	onSave: () => void;
	onSaveAudio: (filename: string) => Promise<void>;
	onLoad: (event: React.ChangeEvent<HTMLInputElement>) => void;
	onClear: () => void;
	selectedLanguage: string;
	onLanguageChange: (language: string) => void;
	audioSource: "microphone" | "system";
	onAudioSourceChange: (source: "microphone" | "system") => void;
	audioFormat: "webm" | "mp3";
	onAudioFormatChange: (format: "webm" | "mp3") => void;
	selectedDeviceId: string;
	onDeviceChange: (deviceId: string) => void;
	hasRecording: boolean;
	audioMagnitude: number;
	error: string | null;
	// Real-time transcription props
	realtimeEnabled: boolean;
	onRealtimeToggle: (enabled: boolean) => void;
	realtimeStatus: "disconnected" | "connecting" | "connected" | "error";
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
	isRecording,
	onStartRecording,
	onStopRecording,
	onSave,
	onSaveAudio,
	onLoad,
	onClear,
	selectedLanguage,
	onLanguageChange,
	audioSource,
	onAudioSourceChange,
	audioFormat,
	onAudioFormatChange,
	selectedDeviceId,
	onDeviceChange,
	hasRecording,
	audioMagnitude,
	error,
	// Real-time transcription props
	realtimeEnabled,
	onRealtimeToggle,
	realtimeStatus,
}) => {
	const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([]);
	const [supportedFormats, setSupportedFormats] = useState<string[]>([]);
	const [isSystemAudioSupported, setIsSystemAudioSupported] = useState(false);

	useEffect(() => {
		loadAudioDevices();
		checkCapabilities();
	}, []);

	const loadAudioDevices = async () => {
		const devices = await audioRecordingService.getAudioDevices();
		setAudioDevices(devices);
	};

	const checkCapabilities = async () => {
		const formats = audioRecordingService.getSupportedFormats();
		setSupportedFormats(formats);
		setIsSystemAudioSupported(audioRecordingService.isSystemAudioSupported());
	};

	const handleSaveAudio = async () => {
		const filename = prompt(
			"Enter filename (without extension):",
			`recording_${new Date().toISOString().split("T")[0]}`
		);
		if (filename) {
			try {
				await onSaveAudio(filename);
				alert("Audio file saved successfully!");
			} catch (error) {
				alert(
					"Failed to save audio file: " +
						(error instanceof Error ? error.message : "Unknown error")
				);
			}
		}
	};

	return (
		<div className="control-panel">
			<div className="control-section">
				<h3>Audio Settings</h3>

				<div className="form-group">
					<label htmlFor="audio-source">Audio Source:</label>
					<select
						id="audio-source"
						value={audioSource}
						onChange={(e) => onAudioSourceChange(e.target.value as "microphone" | "system")}
						className="form-control"
					>
						<option value="microphone">Microphone</option>
						{isSystemAudioSupported && <option value="system">System Audio</option>}
					</select>
				</div>

				{audioSource === "microphone" && (
					<div className="form-group">
						<label htmlFor="audio-device">Microphone:</label>
						<select
							id="audio-device"
							value={selectedDeviceId}
							onChange={(e) => onDeviceChange(e.target.value)}
							className="form-control"
						>
							{audioDevices.map((device) => (
								<option key={device.deviceId} value={device.deviceId}>
									{device.label}
								</option>
							))}
						</select>
					</div>
				)}

				<div className="form-group">
					<label htmlFor="audio-format">Recording Format:</label>
					<select
						id="audio-format"
						value={audioFormat}
						onChange={(e) => onAudioFormatChange(e.target.value as "webm" | "mp3")}
						className="form-control"
					>
						<option value="webm">WebM (recommended)</option>
						{supportedFormats.includes("mp3") && <option value="mp3">MP3</option>}
					</select>
				</div>

				<div className="form-group">
					<label htmlFor="language">Language:</label>
					<select
						id="language"
						value={selectedLanguage}
						onChange={(e) => onLanguageChange(e.target.value)}
						className="form-control"
					>
						{SUPPORTED_LANGUAGES.map((lang) => (
							<option key={lang.code} value={lang.code}>
								{lang.name}
							</option>
						))}
					</select>
				</div>

				<div className="form-group">
					<label>
						<input
							type="checkbox"
							checked={realtimeEnabled}
							onChange={(e) => onRealtimeToggle(e.target.checked)}
						/>{" "}
						Real-time Transcription{" "}
						{realtimeStatus !== "disconnected" && (
							<span className={`status-indicator status-${realtimeStatus}`}>
								{realtimeStatus}
							</span>
						)}
					</label>
					{realtimeEnabled && (
						<p className="form-help">
							📡 Text will appear in real-time as you speak during recording
						</p>
					)}
				</div>
			</div>

			<div className="control-section">
				<h3>Recording</h3>
				<div className="button-group">
					{!isRecording ? (
						<button onClick={onStartRecording} className="btn btn-primary btn-record">
							🎤 Start Recording
						</button>
					) : (
						<button onClick={onStopRecording} className="btn btn-danger btn-stop">
							⏹️ Stop Recording
						</button>
					)}
				</div>

				{/* Audio Magnitude Visualizer */}
				<AudioMagnitudeVisualizer
					magnitude={audioMagnitude}
					isActive={isRecording}
					className="magnitude-visualizer"
				/>

				{isRecording && (
					<div className="recording-indicator">
						<span className="recording-dot"></span>
						Recording...
					</div>
				)}
			</div>

			<div className="control-section">
				<h3>File Operations</h3>
				<div className="button-group vertical">
					<button onClick={onSave} className="btn btn-success">
						💾 Save as HTML
					</button>

					{hasRecording && (
						<button onClick={handleSaveAudio} className="btn btn-info">
							🎵 Save Audio ({audioFormat.toUpperCase()})
						</button>
					)}

					<label className="btn btn-info file-input-label">
						📁 Load HTML File
						<input
							type="file"
							accept=".html"
							onChange={onLoad}
							style={{ display: "none" }}
						/>
					</label>

					<button onClick={onClear} className="btn btn-warning">
						🗑️ Clear All
					</button>
				</div>
			</div>

			{error && (
				<div className="error-message">
					<strong>Error:</strong> {error}
				</div>
			)}
		</div>
	);
};
