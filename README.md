# 🌐 AiChat Browser - GenAI-Powered Cross-Platform Browser

A full-stack, AI-powered browser application with voice commands and intelligent assistant features. Built with React, FastAPI, and integrated with Groq AI and ElevenLabs for advanced GenAI capabilities.

## ✨ Features

### 🔍 Browser Interface
- **Multi-tab browsing** with open, close, and switch functionality
- **Address bar** with URL input and search
- **Navigation controls**: Back, forward, refresh, home
- **Tab history** management
- **Light/Dark mode** toggle

### 🤖 AI Assistant (AiChat)
- **Floating chat interface** accessible from any page
- **Natural language processing** for queries
- **Page summarization** - Get instant summaries of current webpage
- **Question answering** - Ask questions about page content
- **Voice output** - Responses are spoken using ElevenLabs TTS
- **Context-aware** - Understands current page context

### 🎤 Voice Command System
- **Voice-to-text** transcription using Groq Whisper
- **Intelligent command parsing** - Natural language to browser actions
- **Supported commands**:
  - "Open Google" → Opens Google
  - "Go back" → Navigate back
  - "Next tab" → Switch to next tab
  - "Hey AiChat, summarize this page" → AI summarization
  - "Search for [query]" → Google search
- **Visual feedback** during recording

### 🎯 Smart Features
- **Real-time voice processing**
- **Audio playback** of AI responses
- **Cross-platform** - Web, Desktop (Electron), Mobile (Capacitor)
- **Modular AI architecture** using LangChain
- **WebSocket support** for real-time features

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────┐   │
│  │ Browser  │  │ AiChat   │  │ Voice Recorder     │   │
│  │ Component│  │ Component│  │ Component          │   │
│  └──────────┘  └──────────┘  └────────────────────┘   │
│         │              │                  │             │
│         └──────────────┴──────────────────┘             │
│                        │                                │
│                   Axios/HTTP                            │
└────────────────────────┼────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Backend (FastAPI/Python)                    │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────┐   │
│  │ AI Route │  │ Voice    │  │ Browser Route      │   │
│  │          │  │ Route    │  │                    │   │
│  └────┬─────┘  └────┬─────┘  └────────────────────┘   │
│       │             │                                   │
│  ┌────▼─────────────▼──────────────────────────────┐   │
│  │           Services Layer                        │   │
│  │  • LangChain (Summarization, Q&A)              │   │
│  │  • Groq Client (LLM + Whisper STT)             │   │
│  │  • ElevenLabs (Text-to-Speech)                 │   │
│  │  • Command Parser (NL → Actions)               │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
root/
├── backend/
│   ├── main.py                 # FastAPI application entry
│   ├── requirements.txt        # Python dependencies
│   ├── .env.example           # Environment variables template
│   ├── routes/
│   │   ├── ai.py              # AI assistant endpoints
│   │   ├── voice.py           # Voice command processing
│   │   └── browser.py         # Browser control endpoints
│   ├── services/
│   │   ├── groq_client.py     # Groq API integration
│   │   ├── eleven_labs.py     # ElevenLabs TTS
│   │   ├── langchain_utils.py # LangChain workflows
│   │   └── command_parser.py  # Command interpretation
│   └── models/
│       └── __init__.py        # Pydantic models
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Browser.jsx    # Main browser UI
│   │   │   ├── AiChat.jsx     # AI chat interface
│   │   │   └── VoiceRecorder.jsx # Voice input
│   │   ├── context/
│   │   │   ├── ThemeContext.jsx
│   │   │   └── BrowserContext.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── electron/
│   │   ├── main.js            # Electron main process
│   │   └── preload.js         # Electron preload script
│   ├── capacitor.config.ts    # Capacitor configuration
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.9+
- **API Keys**:
  - [Groq API Key](https://console.groq.com/) (for LLM and Whisper)
  - [ElevenLabs API Key](https://elevenlabs.io/) (for TTS)

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Create virtual environment**:
   ```bash
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your API keys:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
   ```

5. **Run the backend**:
   ```bash
   python main.py
   ```
   
   Backend will start at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env`:
   ```env
   VITE_API_URL=http://localhost:8000
   VITE_WS_URL=ws://localhost:8000/ws
   ```

4. **Run development server**:
   ```bash
   npm run dev
   ```
   
   Frontend will start at `http://localhost:5173`

## 📦 Building for Production

### Web Build

```bash
cd frontend
npm run build
npm run preview  # Preview production build
```

### Desktop Build (Electron)

1. **Build the web app**:
   ```bash
   cd frontend
   npm run build
   ```

2. **Build Electron app**:
   ```bash
   npm run electron:build
   ```
   
   Output: `frontend/dist-electron/`
   - Windows: `.exe` installer
   - macOS: `.dmg` installer
   - Linux: `.AppImage`

### Mobile Build (Capacitor)

#### Android

1. **Build web app**:
   ```bash
   cd frontend
   npm run build
   ```

2. **Initialize Capacitor** (first time only):
   ```bash
   npm run capacitor:init
   npm run capacitor:add:android
   ```

3. **Sync and open Android Studio**:
   ```bash
   npm run capacitor:sync
   npm run capacitor:open:android
   ```

4. **Build APK** in Android Studio:
   - Build → Build Bundle(s) / APK(s) → Build APK(s)

#### iOS

1. **Build web app**:
   ```bash
   cd frontend
   npm run build
   ```

2. **Initialize Capacitor** (first time only):
   ```bash
   npm run capacitor:add:ios
   ```

3. **Sync and open Xcode**:
   ```bash
   npm run capacitor:sync
   npm run capacitor:open:ios
   ```

4. **Build in Xcode**:
   - Product → Archive
   - Distribute App

## 🎯 API Endpoints

### AI Assistant

- `POST /api/ai/chat` - General AI chat
- `POST /api/ai/summarize` - Summarize page content
- `POST /api/ai/question` - Answer questions
- `POST /api/ai/tts` - Text-to-speech

### Voice Commands

- `POST /api/voice/command` - Process voice command
- `POST /api/voice/transcribe` - Transcribe audio
- `POST /api/voice/parse` - Parse text command

### Browser Control

- `POST /api/browser/action` - Log browser actions
- `GET /api/browser/health` - Health check

## 🎤 Voice Command Examples

| Command | Action |
|---------|--------|
| "Open Google" | Opens https://google.com |
| "Go back" | Navigate to previous page |
| "Go forward" | Navigate to next page |
| "Refresh" | Reload current page |
| "New tab" | Open a new tab |
| "Close tab" | Close current tab |
| "Next tab" / "Previous tab" | Switch tabs |
| "Search for [query]" | Google search |
| "Hey AiChat, summarize this page" | AI summarizes current page |
| "AiChat, what is this page about?" | AI answers about page |

## 🔧 Configuration

### Backend Configuration

Edit `backend/.env`:

```env
# API Keys
GROQ_API_KEY=your_key
ELEVENLABS_API_KEY=your_key

# Server
HOST=0.0.0.0
PORT=8000
DEBUG=True

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Models
GROQ_MODEL=mixtral-8x7b-32768
GROQ_WHISPER_MODEL=whisper-large-v3
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
```

### Frontend Configuration

Edit `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/ws
```

## 🎨 Customization

### Theme

The app supports light and dark modes. Toggle using the moon/sun icon in the navigation bar.

### Voice Settings

Modify voice settings in `backend/services/eleven_labs.py`:

```python
Voice(
    voice_id=voice_id,
    settings=VoiceSettings(
        stability=0.5,        # 0-1
        similarity_boost=0.75 # 0-1
    )
)
```

### AI Model

Change the LLM model in `backend/.env`:

```env
GROQ_MODEL=mixtral-8x7b-32768
# or
GROQ_MODEL=llama2-70b-4096
```

## 🐛 Troubleshooting

### Backend Issues

**Import errors**:
```bash
pip install -r requirements.txt --upgrade
```

**API key errors**:
- Verify keys in `.env`
- Check key validity on provider websites

### Frontend Issues

**Module not found**:
```bash
rm -rf node_modules package-lock.json
npm install
```

**CORS errors**:
- Ensure backend is running
- Check `CORS_ORIGINS` in backend `.env`

### Voice Issues

**Microphone not working**:
- Grant browser microphone permissions
- Use HTTPS or localhost (required for getUserMedia)

**Audio not playing**:
- Check browser audio permissions
- Verify ElevenLabs API key

## 📝 Development Notes

### Adding New Voice Commands

1. Update command parser in `backend/services/groq_client.py`
2. Add action handler in `frontend/src/components/VoiceRecorder.jsx`
3. Update documentation

### Adding New AI Features

1. Create service in `backend/services/`
2. Add route in `backend/routes/ai.py`
3. Integrate in `frontend/src/components/AiChat.jsx`

## 🔐 Security Notes

- Never commit `.env` files
- Use environment variables for all secrets
- Implement rate limiting in production
- Validate all user inputs
- Use HTTPS in production

## 📄 License

MIT License - feel free to use for personal or commercial projects.

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 🙏 Acknowledgments

- **Groq** - Fast LLM inference and Whisper STT
- **ElevenLabs** - High-quality text-to-speech
- **LangChain** - AI workflow orchestration
- **React** - Frontend framework
- **FastAPI** - Backend framework
- **Electron** - Desktop app framework
- **Capacitor** - Mobile app framework

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation
- Review API provider documentation

---

**Built with ❤️ using GenAI technologies**
