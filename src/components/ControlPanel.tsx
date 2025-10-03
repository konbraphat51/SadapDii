import React, { useState, useEffect } from 'react';
import { audioRecordingService, type AudioDevice } from '../services/audioRecording';
import { SUPPORTED_LANGUAGES } from '../services/whisperTranscription';

interface ControlPanelProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onSave: () => void;
  onLoad: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  error: string | null;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  isRecording,
  onStartRecording,
  onStopRecording,
  onSave,
  onLoad,
  onClear,
  selectedLanguage,
  onLanguageChange,
  error
}) => {
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');

  useEffect(() => {
    loadAudioDevices();
  }, []);

  const loadAudioDevices = async () => {
    const devices = await audioRecordingService.getAudioDevices();
    setAudioDevices(devices);
    if (devices.length > 0 && !selectedDevice) {
      setSelectedDevice(devices[0].deviceId);
    }
  };

  return (
    <div className="control-panel">
      <div className="control-section">
        <h3>Audio Settings</h3>
        <div className="form-group">
          <label htmlFor="audio-device">Microphone:</label>
          <select
            id="audio-device"
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
            className="form-control"
          >
            {audioDevices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label}
              </option>
            ))}
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
      </div>

      <div className="control-section">
        <h3>Recording</h3>
        <div className="button-group">
          {!isRecording ? (
            <button
              onClick={onStartRecording}
              className="btn btn-primary btn-record"
            >
              🎤 Start Recording
            </button>
          ) : (
            <button
              onClick={onStopRecording}
              className="btn btn-danger btn-stop"
            >
              ⏹️ Stop Recording
            </button>
          )}
        </div>
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
          <button
            onClick={onSave}
            className="btn btn-success"
          >
            💾 Save as HTML
          </button>
          
          <label className="btn btn-info file-input-label">
            📁 Load HTML File
            <input
              type="file"
              accept=".html"
              onChange={onLoad}
              style={{ display: 'none' }}
            />
          </label>

          <button
            onClick={onClear}
            className="btn btn-warning"
          >
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