import { useState, useCallback } from 'react';
import { audioRecordingService } from '../services/audioRecording';
import { whisperService } from '../services/whisperTranscription';

export interface UseAudioRecordingReturn {
  isRecording: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  error: string | null;
}

export const useAudioRecording = (
  onTranscription: (text: string) => void,
  selectedLanguage: string
): UseAudioRecordingReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const success = await audioRecordingService.startRecording();
      if (success) {
        setIsRecording(true);
      } else {
        throw new Error('Failed to start recording');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    }
  }, []);

  const stopRecording = useCallback(async () => {
    try {
      setError(null);
      const audioBlob = await audioRecordingService.stopRecording();
      setIsRecording(false);

      // Transcribe the audio
      const result = await whisperService.transcribeAudio(audioBlob, {
        language: selectedLanguage === 'auto' ? undefined : selectedLanguage
      });

      onTranscription(result.text);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setIsRecording(false);
    }
  }, [onTranscription, selectedLanguage]);

  return {
    isRecording,
    startRecording,
    stopRecording,
    error
  };
};