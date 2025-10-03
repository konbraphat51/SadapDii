# SadapDii - Audio Transcription App

A React-based application for real-time audio recording and transcription using OpenAI's Whisper API.

สดับ (sadap) = listen

## Features

- 🎤 **Audio Recording**: Record from microphone or system audio output
- 🎵 **Multiple Formats**: Save recordings as WebM or MP3 files
- 💻 **System Audio Capture**: Record computer's audio output (system sounds, music, etc.)
- 🔤 **Real-time Transcription**: Transcribe audio using OpenAI Whisper API
- 🌍 **Multi-language Support**: Choose from 15+ supported languages or auto-detect
- ✏️ **Text Editing**: Edit transcribed text with visual distinction between AI and user input
- 💾 **File Operations**: Save as HTML files and load existing transcriptions
- 🎨 **Modern UI**: Clean, responsive interface with aesthetic design

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure OpenAI API Key

Create a `.env` file in the project root and add your OpenAI API key:

```env
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

**Important**: Get your API key from [OpenAI's platform](https://platform.openai.com/api-keys)

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
- **Transcription**: OpenAI Whisper API
- **Styling**: Custom CSS with modern design principles
- **File Handling**: HTML export/import with colored text segments

### Key Components

- `AudioRecordingService`: Handles microphone access and audio capture
- `WhisperTranscriptionService`: Manages OpenAI API integration
- `FileService`: Handles HTML export/import functionality
- `TextEditor`: Rich text editing with color-coded segments
- `ControlPanel`: Audio settings and file operations

### Supported Languages

- Auto-detect
- English, Spanish, French, German, Italian
- Portuguese, Russian, Japanese, Korean
- Chinese, Arabic, Hindi, Dutch, Polish

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
