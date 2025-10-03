export interface TextSegment {
  id: string;
  text: string;
  isUserInput: boolean;
  timestamp: number;
}

export interface NoteData {
  title: string;
  segments: TextSegment[];
  language: string;
  createdAt: number;
  updatedAt: number;
}

export interface AppSettings {
  selectedAudioDevice: string;
  selectedLanguage: string;
  openaiApiKey: string;
}