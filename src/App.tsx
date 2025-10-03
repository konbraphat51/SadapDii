import React, { useState } from 'react';
import { TitleInput } from './components/TitleInput';
import { TextEditor } from './components/TextEditor';
import { ControlPanel } from './components/ControlPanel';
import { useAudioRecording } from './hooks/useAudioRecording';
import { useTextSegments } from './hooks/useTextSegments';
import { FileService } from './services/fileService';
import './App.css';

function App() {
  const [title, setTitle] = useState('Untitled Note');
  const [selectedLanguage, setSelectedLanguage] = useState('auto');

  const {
    segments,
    addWhisperText,
    updateSegment,
    clearSegments
  } = useTextSegments();

  const {
    isRecording,
    startRecording,
    stopRecording,
    error
  } = useAudioRecording(addWhisperText, selectedLanguage);

  const handleSave = () => {
    if (segments.length === 0) {
      alert('Nothing to save! Please record some audio first.');
      return;
    }
    FileService.saveAsHtml(title, segments);
  };

  const handleLoad = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const { title: loadedTitle, segments: loadedSegments } = await FileService.loadFromHtml(file);
      setTitle(loadedTitle);
      clearSegments();
      // Add loaded segments one by one
      loadedSegments.forEach((segment, index) => {
        setTimeout(() => {
          addWhisperText(segment.text);
          if (segment.isUserInput) {
            updateSegment(segment.id, segment.text, true);
          }
        }, index * 10); // Small delay to ensure proper ordering
      });
    } catch (error) {
      alert('Failed to load file: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleClear = () => {
    if (segments.length > 0 && !confirm('Are you sure you want to clear all content?')) {
      return;
    }
    clearSegments();
    setTitle('Untitled Note');
  };

  return (
    <div className="app">
      <header className="app-header">
        <TitleInput
          title={title}
          onChange={setTitle}
          placeholder="Enter your note title..."
        />
      </header>

      <main className="app-main">
        <div className="text-area-container">
          <TextEditor
            segments={segments}
            onSegmentUpdate={updateSegment}
            placeholder="Start recording to see transcribed text here..."
          />
        </div>

        <aside className="control-panel-container">
          <ControlPanel
            isRecording={isRecording}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
            onSave={handleSave}
            onLoad={handleLoad}
            onClear={handleClear}
            selectedLanguage={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
            error={error}
          />
        </aside>
      </main>
    </div>
  );
}

export default App;
