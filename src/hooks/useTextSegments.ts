import { useState, useCallback } from 'react';
import type { TextSegment } from '../types';

export interface UseTextSegmentsReturn {
  segments: TextSegment[];
  addWhisperText: (text: string) => void;
  updateSegment: (id: string, newText: string, isUserInput: boolean) => void;
  clearSegments: () => void;
  getFormattedText: () => string;
}

export const useTextSegments = (): UseTextSegmentsReturn => {
  const [segments, setSegments] = useState<TextSegment[]>([]);

  const addWhisperText = useCallback((text: string) => {
    const newSegment: TextSegment = {
      id: `whisper_${Date.now()}_${Math.random()}`,
      text: text.trim(),
      isUserInput: false,
      timestamp: Date.now()
    };

    setSegments(prev => [...prev, newSegment]);
  }, []);

  const updateSegment = useCallback((id: string, newText: string, isUserInput: boolean) => {
    setSegments(prev => prev.map(segment => 
      segment.id === id 
        ? { ...segment, text: newText, isUserInput }
        : segment
    ));
  }, []);

  const clearSegments = useCallback(() => {
    setSegments([]);
  }, []);

  const getFormattedText = useCallback(() => {
    return segments.map(segment => segment.text).join(' ');
  }, [segments]);

  return {
    segments,
    addWhisperText,
    updateSegment,
    clearSegments,
    getFormattedText
  };
};