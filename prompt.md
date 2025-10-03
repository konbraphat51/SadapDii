## Requirements

### Functionality

- Record audio from microphone or specific application.
  - Make them selectable.
  - Save as .mp3 file.
- Transcribe audio to text using OpenAI Whisper API in realtime.
  - enable to select language
  - fetch API key from environment variable.
- Show the transcribed text in a text area.
- Allow user to edit the transcribed text.
  - Make the input by user green.
  - Make the input by Whisper black.
- Allow user to save the transcribed text as single .html file.
  - The .html file should contain the text with different colors for user input and Whisper input.
- Allow user to load a .html file and continue editing.
- Run the app locally on Windows OS.
- Create input for the title of the note.
  - Make this as the H1 title in the saved .html file.

### UI Design

- Show a wide and long text area for in the middle.
- Show buttons for recording, saving, and loading at the right side.
- Show input for the title at the top.

## Tech Stack

- Use React for the frontend.
- Use TypeScript for type safety.
- Use pnpm as the package manager.
