# 🌐 Lernova Browser - AI-Powered Cross-Platform Browser with Collaborative Features

A full-stack, AI-powered browser application with voice commands, intelligent assistant, focus mode, collaborative group context, and advanced learning features. Built with React, FastAPI, MongoDB, and integrated with Groq AI and ElevenLabs for advanced GenAI capabilities.

## ✨ Features

### 🔍 Browser Interface
- **Multi-tab browsing** with open, close, and switch functionality
- **Address bar** with URL input and search
- **Navigation controls**: Back, forward, refresh, home
- **Tab history** management with bookmarks
- **Light/Dark mode** toggle
- **Downloads manager** with progress tracking
- **Settings panel** with customization options
- **Cross-platform**: Web, Desktop (Electron), Mobile (Capacitor)

### 🤖 AI Assistant (AiChat)
- **Floating chat interface** accessible from any page
- **Full-screen mode** - Open AI chat in dedicated tab
- **Natural language processing** for queries
- **Page summarization** - Get instant summaries of current webpage
- **Question answering** - Ask questions about page content
- **Voice output** - Responses are spoken using ElevenLabs TTS
- **Context-aware** - Understands current page and browsing history
- **RAG (Retrieval Augmented Generation)** - Uses vector storage for relevant context
- **Document parsing** - Supports PDF, DOCX, XLSX, HTML documents
- **Group context integration** - Access shared research from team members
- **Website suggestions** - AI recommends relevant learning resources
- **Markdown rendering** - Beautiful formatted responses with code blocks, tables, lists

### 👥 Group Context (Collaborative Research)
- **Create groups** - Start collaborative research teams
- **Invite system** - Secure 8-character invite codes
- **Join groups** - Collaborate with team members
- **Shared context** - All browsing automatically shared with group
- **Real-time sync** - Auto-refresh contexts every 10 seconds
- **AI integration** - AI uses all group members' research for answers
- **Mobile responsive** - Optimized UI for mobile devices
- **Context management** - View, search, and filter shared research

### 🎤 Voice Command System
- **Voice-to-text** transcription using Groq Whisper
- **Voice navigation** - Navigate websites hands-free
- **Intelligent command parsing** - Natural language to browser actions
- **Supported commands**:
  - "Open Google" → Opens Google
  - "Go back" → Navigate back
  - "Next tab" → Switch to next tab
  - "Hey AiChat, summarize this page" → AI summarization
  - "Search for [query]" → Google search
  - "Click on [element]" → Click webpage elements
  - "Scroll down/up" → Scroll webpage
- **Visual feedback** during recording
- **Tap or hold** recording modes

### 🎯 Focus Mode
- **Distraction-free browsing** - Block non-relevant websites
- **Topic-based filtering** - AI determines relevance to your focus topic
- **Keyword whitelisting** - Allow specific domains
- **Real-time statistics** - Track URLs checked, allowed, blocked
- **Auto-refresh counters** - Updates every 3 seconds
- **Session management** - Start/end focus sessions with stats

### 📝 Notes System
- **Text selection notes** - Drag-select and save any text
- **Context menu integration** - Right-click to save notes
- **Rich metadata** - Saves page URL, title, timestamp
- **Color coding** - Organize notes with colors
- **Tags support** - Categorize notes
- **Search & filter** - Find notes quickly
- **Export notes** - Download all notes as JSON
- **Edit & delete** - Full CRUD operations

### 🧠 History Quiz
- **AI-generated quizzes** - Based on your browsing history
- **10 questions per quiz** - Test your knowledge
- **Score tracking** - View recent quiz scores
- **Personalized questions** - Relevant to your browsing patterns

### 🎨 Highlight Important
- **AI-powered highlighting** - Automatically highlights relevant sections
- **Topic-based analysis** - Highlights content related to your research topic
- **Visual markers** - Yellow highlights on important text
- **Smart selection** - AI identifies 5-15 most relevant sections

### 📊 Data Management
- **Bookmarks** - Save and organize favorite sites
- **History tracking** - Browse your browsing history
- **Search functionality** - Find bookmarks and history
- **Vector storage** - Semantic search across browsing history
- **MongoDB integration** - Persistent data storage
- **Settings sync** - Save preferences across sessions

### 🔐 User Management
- **Authentication** - User login/logout
- **User profiles** - Display name, email, user ID
- **Session management** - Secure token-based auth
- **Mobile logout** - Easy logout on mobile devices

### 🎯 Smart Features
- **Real-time voice processing**
- **Audio playback** of AI responses
- **Cross-platform** - Web, Desktop (Electron), Mobile (Capacitor)
- **Modular AI architecture** using LangChain
- **WebSocket support** for real-time features
- **Responsive design** - Optimized for all screen sizes
- **Dark/Light themes** - System-aware theming

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │ Browser  │ │ AiChat   │ │ Group    │ │ Focus Mode   │   │
│  │          │ │          │ │ Context  │ │              │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │ Notes    │ │ Settings │ │ Voice    │ │ Downloads    │   │
│  │          │ │          │ │ Recorder │ │              │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │
│                        │                                     │
│                   Axios/HTTP + WebSocket                     │
└────────────────────────┼─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│              Backend (FastAPI + Python)                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │ AI       │ │ Voice    │ │ Groups   │ │ Focus        │   │
│  │ Routes   │ │ Routes   │ │ Routes   │ │ Routes       │   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────┬───────┘   │
│  ┌────┴─────┐ ┌────┴─────┐ ┌────┴─────┐ ┌──────┴───────┐   │
│  │ Notes    │ │ Quiz     │ │ Document │ │ Data         │   │
│  │ Routes   │ │ Routes   │ │ Parser   │ │ Routes       │   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────┬───────┘   │
│       │            │             │               │           │
│  ┌────▼────────────▼─────────────▼───────────────▼───────┐  │
│  │              Services Layer                            │  │
│  │  • LangChain (RAG, Summarization, Q&A)               │  │
│  │  • Groq Client (LLM + Whisper STT)                   │  │
│  │  • ElevenLabs (Text-to-Speech)                       │  │
│  │  • Vector Store (Semantic Search)                    │  │
│  │  • Document Parser (PDF, DOCX, XLSX)                 │  │
│  │  • Command Parser (NL → Actions)                     │  │
│  └──────────────────────────┬────────────────────────────┘  │
│                             │                                │
│  ┌──────────────────────────▼────────────────────────────┐  │
│  │              MongoDB Database                          │  │
│  │  • Users Collection                                    │  │
│  │  • Groups Collection                                   │  │
│  │  • Shared Contexts Collection                         │  │
│  │  • Notes Collection                                    │  │
│  │  • Quiz Scores Collection                             │  │
│  │  • Focus Sessions Collection                          │  │
│  │  • Bookmarks & History Collections                    │  │
│  │  • Vector Embeddings Collection                       │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
root/
├── backend/
│   ├── main.py                      # FastAPI application entry
│   ├── requirements.txt             # Python dependencies
│   ├── .env.example                 # Environment variables template
│   ├── routes/
│   │   ├── ai.py                    # AI assistant endpoints
│   │   ├── voice.py                 # Voice command processing
│   │   ├── voice_navigation.py      # Voice navigation
│   │   ├── browser.py               # Browser control endpoints
│   │   ├── groups.py                # Group context management
│   │   ├── notes.py                 # Notes CRUD operations
│   │   ├── quiz.py                  # History quiz generation
│   │   ├── document_parser.py       # Document parsing (PDF, DOCX, XLSX)
│   │   ├── focus.py                 # Focus mode management
│   │   ├── data.py                  # Data management (bookmarks, history)
│   │   ├── downloads.py             # Download tracking
│   │   ├── auth.py                  # Authentication
│   │   ├── proxy.py                 # Proxy services
│   │   └── vector_storage.py        # Vector database operations
│   ├── services/
│   │   ├── groq_client.py           # Groq API integration
│   │   ├── eleven_labs.py           # ElevenLabs TTS
│   │   ├── langchain_utils.py       # LangChain workflows
│   │   ├── command_parser.py        # Command interpretation
│   │   └── vector_store.py          # Vector storage service
│   ├── database/
│   │   ├── mongodb.py               # MongoDB connection
│   │   └── group_model.py           # Group context models
│   └── models/
│       └── __init__.py              # Pydantic models
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Browser.jsx          # Main browser UI
│   │   │   ├── AiChat.jsx           # AI chat interface
│   │   │   ├── AiChatFullScreen.jsx # Full-screen AI chat
│   │   │   ├── GroupContext.jsx     # Group collaboration UI
│   │   │   ├── FocusMode.jsx        # Focus mode component
│   │   │   ├── Notes.jsx            # Notes management
│   │   │   ├── HistoryQuiz.jsx      # Quiz interface
│   │   │   ├── Settings.jsx         # Settings panel
│   │   │   ├── Downloads.jsx        # Downloads manager
│   │   │   ├── HighlightImportant.jsx # AI highlighting
│   │   │   ├── VoiceRecorder.jsx    # Voice input
│   │   │   ├── HomePage.jsx         # Browser home page
│   │   │   ├── ElectronWebView.jsx  # Electron webview
│   │   │   ├── CapacitorWebView.jsx # Capacitor webview
│   │   │   ├── FocusBlockedPage.jsx # Focus mode blocked page
│   │   │   └── MobileBottomBar.jsx  # Mobile navigation
│   │   ├── context/
│   │   │   ├── ThemeContext.jsx     # Theme management
│   │   │   └── BrowserContext.jsx   # Browser state
│   │   ├── utils/
│   │   │   └── platform.js          # Platform detection
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── electron/
│   │   ├── main.js                  # Electron main process
│   │   └── preload.js               # Electron preload script
│   ├── capacitor.config.ts          # Capacitor configuration
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
- **MongoDB** 4.4+ (local or MongoDB Atlas)
- **API Keys**:
  - [Groq API Key](https://console.groq.com/) (for LLM and Whisper)
  - [ElevenLabs API Key](https://elevenlabs.io/) (for TTS - Optional)

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
   
   Edit `.env` and add your configuration:
   ```env
   # API Keys
   GROQ_API_KEY=your_groq_api_key_here
   ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
   
   # MongoDB
   MONGODB_URL=mongodb://localhost:27017
   # Or for MongoDB Atlas:
   # MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/
   
   # Server
   HOST=0.0.0.0
   PORT=8000
   
   # CORS
   CORS_ORIGINS=http://localhost:5173,http://localhost:3000
   
   # Models (Optional)
   GROQ_MODEL=llama-3.1-70b-versatile
   ```

5. **Start MongoDB** (if running locally):
   ```bash
   # Windows
   mongod
   
   # macOS/Linux
   sudo systemctl start mongod
   ```

6. **Run the backend**:
   ```bash
   python main.py
   ```
   
   Backend will start at `http://localhost:8000`
   
   You should see:
   ```
   ✅ Lernova API started successfully
   INFO:     Uvicorn running on http://0.0.0.0:8000
   ```

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

### AI Assistant (`/api/ai`)

- `POST /api/ai/chat` - General AI chat with optional group context
- `POST /api/ai/summarize` - Summarize page content
- `POST /api/ai/question` - Answer questions
- `POST /api/ai/tts` - Text-to-speech
- `POST /api/ai/suggest-websites` - Get website suggestions
- `POST /api/ai/suggest-websites-ai` - AI-powered website suggestions
- `POST /api/ai/generate-questions` - Generate assessment questions
- `POST /api/ai/highlight-important` - Identify important page sections

### Group Context (`/api/groups`)

- `POST /api/groups/create` - Create a new group
- `POST /api/groups/join` - Join group with invite code
- `GET /api/groups/my-groups` - Get user's groups
- `GET /api/groups/{group_id}` - Get group details
- `POST /api/groups/context/add` - Add shared context to group
- `POST /api/groups/context/get` - Get group's shared contexts
- `DELETE /api/groups/{group_id}/leave` - Leave a group

### Notes (`/api/notes`)

- `GET /api/notes` - Get all notes
- `POST /api/notes` - Create a new note
- `GET /api/notes/{note_id}` - Get specific note
- `PUT /api/notes/{note_id}` - Update note
- `DELETE /api/notes/{note_id}` - Delete note
- `GET /api/notes/export` - Export all notes as JSON

### Quiz (`/api/quiz`)

- `POST /api/quiz/generate` - Generate quiz from browsing history
- `POST /api/quiz/submit` - Submit quiz answers
- `GET /api/quiz/scores` - Get recent quiz scores

### Focus Mode (`/api/focus`)

- `POST /api/focus/start` - Start focus session
- `POST /api/focus/end` - End focus session
- `GET /api/focus/active` - Get active session
- `POST /api/focus/check-url` - Check if URL is allowed

### Document Parser (`/api/document`)

- `POST /api/document/parse` - Parse document from URL (PDF, DOCX, XLSX)
- `POST /api/document/upload` - Upload and parse document

### Voice Commands (`/api/voice`)

- `POST /api/voice/command` - Process voice command
- `POST /api/voice/transcribe` - Transcribe audio
- `POST /api/voice/parse` - Parse text command
- `POST /api/ai/voice-navigate` - Voice navigation commands

### Data Management (`/api/data`)

- `GET /api/data/bookmarks` - Get bookmarks
- `POST /api/data/bookmarks` - Add bookmark
- `DELETE /api/data/bookmarks/{id}` - Delete bookmark
- `GET /api/data/history` - Get browsing history
- `POST /api/data/history` - Add history entry
- `DELETE /api/data/history` - Clear history
- `GET /api/data/settings` - Get user settings
- `PUT /api/data/settings` - Update settings

### Vector Storage (`/api/vector`)

- `POST /api/vector/store` - Store page in vector database
- `POST /api/vector/query` - Query similar content

### Downloads (`/api/downloads`)

- `GET /api/downloads` - Get download list
- `POST /api/downloads` - Add download
- `PUT /api/downloads/{id}` - Update download status

### Authentication (`/api/auth`)

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### Browser Control (`/api/browser`)

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

## 👥 Group Context - Collaborative Research

### How It Works

1. **Create a Group**:
   - Go to Settings → Group Context
   - Click "Create Group"
   - Enter group name and description
   - Share the invite code with team members

2. **Join a Group**:
   - Click "Join Group"
   - Enter the 8-character invite code
   - Start collaborating!

3. **Automatic Context Sharing**:
   - Browse any webpage
   - Content is automatically saved to the group
   - All members can access each other's research

4. **AI with Group Context**:
   - Select an active group
   - AI chat shows "🔗 Using Group Context"
   - Ask questions - AI uses ALL group members' research!

### Example Use Case

```
Team researching "Machine Learning":

User A browses: "Neural Networks basics"
User B browses: "Deep Learning tutorials"  
User C browses: "TensorFlow documentation"

User A asks: "How do I implement a neural network in TensorFlow?"
AI responds using content from ALL three users! ✅
```

## 🙏 Acknowledgments

- **Groq** - Fast LLM inference and Whisper STT
- **ElevenLabs** - High-quality text-to-speech
- **LangChain** - AI workflow orchestration
- **MongoDB** - Database for persistent storage
- **ChromaDB** - Vector database for semantic search
- **React** - Frontend framework
- **FastAPI** - Backend framework
- **Electron** - Desktop app framework
- **Capacitor** - Mobile app framework
- **Tailwind CSS** - Styling framework
- **Vite** - Build tool

## 🛠️ Technologies Used

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS
- **Lucide React** - Icon library
- **Axios** - HTTP client
- **React Markdown** - Markdown rendering
- **Electron** - Desktop app wrapper
- **Capacitor** - Mobile app wrapper

### Backend
- **FastAPI** - Modern Python web framework
- **Python 3.9+** - Programming language
- **MongoDB** - NoSQL database
- **Motor** - Async MongoDB driver
- **Pydantic** - Data validation
- **Uvicorn** - ASGI server

### AI & ML
- **Groq API** - Fast LLM inference (Llama 3.1)
- **Groq Whisper** - Speech-to-text
- **LangChain** - AI workflow orchestration
- **ChromaDB** - Vector database
- **Sentence Transformers** - Text embeddings
- **ElevenLabs** - Text-to-speech (optional)

### Document Processing
- **PyPDF2** - PDF parsing
- **python-docx** - DOCX parsing
- **openpyxl** - Excel parsing
- **BeautifulSoup4** - HTML parsing

## 📊 Key Statistics

- **15+ Components** - Modular React architecture
- **12+ API Routes** - Comprehensive backend
- **8 Collections** - MongoDB database schema
- **3 Platforms** - Web, Desktop, Mobile
- **RAG-Powered** - Semantic search with vector DB
- **Real-time Sync** - Auto-refresh every 3-10 seconds

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation
- Review API provider documentation

## 🚀 Future Enhancements

- [ ] Real-time collaboration with WebSockets
- [ ] Browser extension version
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Offline mode with sync
- [ ] Custom AI model integration
- [ ] Team workspace management
- [ ] Advanced search filters

---

**Built with ❤️ using GenAI technologies for collaborative learning and research**
