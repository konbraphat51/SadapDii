# SadapDii - Audio Transcription App

A React-based application for real-time audio recording and transcription using Azure Speech Recognition API.

สดับ (sadap) = listen

## Features

- 🎤 **Audio Recording**: Record from microphone or system audio output
- 🎵 **Multiple Formats**: Save recordings as WebM or MP3 files
- 💻 **System Audio Capture**: Record computer's audio output (system sounds, music, etc.)
- 🔤 **Real-time Transcription**: Transcribe audio using Azure Speech Recognition API
- 🌍 **Multi-language Support**: Choose from 20+ supported languages or auto-detect
- ✏️ **Text Editing**: Edit transcribed text with visual distinction between AI and user input
- 💾 **File Operations**: Save as HTML files and load existing transcriptions
- 🎨 **Modern UI**: Clean, responsive interface with aesthetic design

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Azure Speech Service

Create a `.env` file in the project root and add your Azure Speech Service credentials:

```env
VITE_AZURE_SPEECH_KEY=your_azure_speech_key_here
VITE_AZURE_SPEECH_REGION=your_azure_region_here
```

**Important**: Get your credentials from [Azure Cognitive Services](https://portal.azure.com/) by creating a Speech service resource.

### 3. Run the Application

```bash
pnpm dev
```

The application will be available at `http://localhost:5173/`

## Usage

### Recording Audio

1. **Select Audio Source**: Choose between microphone or system audio
   - **Microphone**: Record from your selected microphone device
   - **System Audio**: Record computer's audio output (requires screen sharing permission)
2. **Select Audio Device**: Choose your preferred microphone (when using microphone source)
3. **Choose Format**: Select WebM (recommended) or MP3 for recording format
4. **Choose Language**: Select the language for transcription (or use auto-detect)
5. **Start Recording**: Click the "🎤 Start Recording" button
6. **Stop Recording**: Click "⏹️ Stop Recording" when finished

### Editing Text

- **Black Text**: Original Whisper transcription
- **Green Text**: User-edited content
- Edit directly in the text area - changes will be highlighted in green

### File Operations

- **Save HTML**: Export your transcription as an HTML file with proper formatting
- **Save Audio**: Export the recorded audio as WebM or MP3 file
- **Load**: Import previously saved HTML files to continue editing
- **Clear**: Remove all content (with confirmation prompt)

### Title Management

- Set a custom title for your notes using the input field at the top
- The title becomes the H1 heading in saved HTML files

## Technical Details

### Architecture

- **Frontend**: React + TypeScript + Vite
- **Audio Recording**: Web Audio API with MediaRecorder
- **Transcription**: Azure Speech Recognition API
- **Real-time Processing**: Azure Speech SDK for continuous recognition
- **Styling**: Custom CSS with modern design principles
- **File Handling**: HTML export/import with colored text segments

### Key Components

- `AudioRecordingService`: Handles microphone access and audio capture
- `AzureSpeechTranscriptionService`: Manages Azure Speech API integration
- `RealtimeTranscriptionService`: Handles continuous speech recognition
- `FileService`: Handles HTML export/import functionality
- `TextEditor`: Rich text editing with color-coded segments
- `ControlPanel`: Audio settings and file operations

### Supported Languages

- Auto-detect
- English (US & UK), Spanish (Spain & Mexico), French, German, Italian
- Portuguese (Brazil & Portugal), Russian, Japanese, Korean
- Chinese (Simplified & Traditional), Arabic, Hindi, Dutch, Polish
- Swedish, Danish, Norwegian, Finnish

## Browser Requirements

- Modern browser with Web Audio API support
- Microphone access permissions
- Internet connection for transcription

## Development

### Project Structure

```
src/
├── components/          # React components
├── hooks/              # Custom React hooks
├── services/           # Business logic and API services
├── types/              # TypeScript type definitions
├── App.tsx             # Main application component
└── App.css             # Styling
```

### Available Scripts

- `pnpm dev`: Start development server
- `pnpm build`: Build for production
- `pnpm lint`: Run ESLint
- `pnpm preview`: Preview production build

## License

See LICENSE file for details.
