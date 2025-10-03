import React, { useRef } from 'react';
import type { TextSegment } from '../types';

interface TextEditorProps {
  segments: TextSegment[];
  onSegmentUpdate: (id: string, newText: string, isUserInput: boolean) => void;
  placeholder?: string;
}

export const TextEditor: React.FC<TextEditorProps> = ({
  segments,
  onSegmentUpdate,
  placeholder = "Start recording to see transcribed text..."
}) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const combinedText = segments.map(segment => segment.text).join(' ');

  const handleTextChange = (newText: string) => {
    // Simple approach: when text changes, mark the entire content as user input
    if (segments.length > 0) {
      const lastSegment = segments[segments.length - 1];
      onSegmentUpdate(lastSegment.id, newText, true);
    }
  };

  const renderSegment = (segment: TextSegment, index: number) => {
    const segmentStyle = {
      color: segment.isUserInput ? '#22c55e' : '#000000',
      backgroundColor: 'transparent',
      display: 'inline'
    };

    return (
      <span
        key={segment.id}
        style={segmentStyle}
        className={segment.isUserInput ? 'user-input' : 'whisper-input'}
      >
        {segment.text}
        {index < segments.length - 1 ? ' ' : ''}
      </span>
    );
  };

  return (
    <div className="text-editor-container">
      <textarea
        ref={textAreaRef}
        value={combinedText}
        onChange={(e) => handleTextChange(e.target.value)}
        placeholder={placeholder}
        className="text-editor"
        spellCheck="true"
      />
      <div className="text-preview" style={{ display: 'none' }}>
        {segments.map((segment, index) => renderSegment(segment, index))}
      </div>
    </div>
  );
};