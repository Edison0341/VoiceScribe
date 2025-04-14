# Voice Transcription App

This application allows users to record their voice and receive instant transcriptions using AI. It leverages WebSockets for real-time audio streaming and OpenAI's Whisper API for transcription.

## Features

- **Real-time Voice Recording**: Record your voice directly from the browser.
- **Instant Transcription**: Get transcriptions of your recordings using AI.
- **Recording Timer**: See the duration of your recording in real-time.
- **Error Handling**: Provides feedback for connection and transcription errors.

## Prerequisites

- Node.js (v18 or higher) and npm installed on your machine.
- An OpenAI API key with access to the Whisper API.
- A modern web browser with microphone support.

## Setup

1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd voice-transcription-app
   ```

2. **Install Dependencies**:
   ```bash
   # Install frontend dependencies
   npm install

   # Install server dependencies
   cd server
   npm install
   cd ..
   ```

3. **Configure Environment Variables**:
   
   Create a `.env.local` file in the root directory:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_WS_URL=ws://localhost:3002
   ```

   Create a `.env` file in the `server` directory:
   ```
   OPENAI_API_KEY=your_openai_api_key
   WS_PORT=3002
   ```

4. **Build the Application**:
   ```bash
   # Build the Next.js application
   npm run build
   ```

5. **Start the Servers**:

   In one terminal, start the WebSocket server:
   ```bash
   cd server
   npm run start
   ```

   In another terminal, start the Next.js development server:
   ```bash
   npm run dev
   ```

## Usage

1. Open your browser and navigate to `http://localhost:3001`.
2. If this is your first time, click "Allow" when prompted for microphone access.
3. Enter a title for your transcription (optional).
4. Click "Start Recording" to begin recording your voice.
5. The timer will show your recording duration.
6. Click "Stop Recording" to end the session and receive your transcription.

## Troubleshooting

### Common Issues

1. **Black/Unstyled Page**:
   - Make sure you've installed all dependencies with `npm install`
   - Run `npm run build` before starting the development server
   - Clear your browser cache and reload the page

2. **WebSocket Connection Issues**:
   - Ensure the WebSocket server is running on port 3002
   - Check that your `.env.local` has `NEXT_PUBLIC_WS_URL=ws://localhost:3002`
   - Look for any connection errors in the browser console (F12)

3. **Transcription Not Working**:
   - Verify your OpenAI API key is correctly set in `server/.env`
   - Check the server console for any API-related errors
   - Ensure your audio is being recorded (check browser console for audio chunks)

4. **Microphone Not Working**:
   - Grant microphone permissions in your browser
   - Check if your microphone is working in other applications
   - Try using a different browser (Chrome recommended)

## Development

The application uses:
- Next.js 14 for the frontend
- Tailwind CSS for styling
- WebSocket for real-time communication
- OpenAI's Whisper API for transcription

## License

This project is licensed under the MIT License. 
