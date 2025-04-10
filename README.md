# Voice Transcription App

This application allows users to record their voice and receive instant transcriptions using AI. It leverages WebSockets for real-time audio streaming and OpenAI's Whisper API for transcription.

## Features

- **Real-time Voice Recording**: Record your voice directly from the browser.
- **Instant Transcription**: Get transcriptions of your recordings using AI.
- **Recording Timer**: See the duration of your recording in real-time.
- **Error Handling**: Provides feedback for connection and transcription errors.

## Prerequisites

- Node.js and npm installed on your machine.
- An OpenAI API key with access to the Whisper API.

## Setup

1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd voice-transcription-app
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   - Create a `.env` file in the `server` directory with the following content:
     ```
     OPENAI_API_KEY=your_openai_api_key
     WS_PORT=3002
     ```

4. **Start the WebSocket Server**:
   ```bash
   cd server
   npm run start
   ```

5. **Start the Next.js Development Server**:
   ```bash
   npm run dev
   ```

## Usage

- Open your browser and navigate to `http://localhost:3001`.
- Click "Start Recording" to begin recording your voice.
- The timer will display the duration of your recording.
- Click "Stop Recording" to end the session and receive a transcription.

## Troubleshooting

- **WebSocket Connection Issues**: Ensure the WebSocket server is running and accessible.
- **Transcription Errors**: Check the server logs for any errors related to the OpenAI API call.
- **Microphone Access**: Ensure your browser has permission to access the microphone.

## License

This project is licensed under the MIT License. 
