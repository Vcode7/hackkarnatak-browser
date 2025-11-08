# 🚀 GenAI Browser

A **cross-platform GenAI-powered web browser** with an integrated AI chat assistant.  
Built with modern full-stack technologies — React, Electron, Capacitor, FastAPI, and Groq AI.

---

## 🧠 Tech Stack

| Layer | Technology |
|--------|-------------|
| **Frontend** | React (Vite) + TypeScript |
| **Desktop** | Electron |
| **Mobile** | Capacitor |
| **Backend** | FastAPI |
| **Database** | MongoDB |
| **AI Model** | Groq (LLaMA models) |

---

## 📁 Project Structure

genai-browser/
├── frontend/
│ ├── src/ # React app
│ │ ├── components/ # AddressBar, WebSurface, ChatPanel
│ │ └── services/ # API client
│ ├── electron/ # Electron main & preload scripts
│ └── capacitor.config.ts
├── backend/
│ ├── app/
│ │ ├── database/ # MongoDB adapters
│ │ ├── models/ # Pydantic models
│ │ ├── routes/ # FastAPI routers
│ │ └── services/ # Groq, history, and business logic
│ └── main.py

yaml
Copy code

---

## ⚙️ Setup

### 🧩 Prerequisites
Make sure you have the following installed:
- **Node.js 18+**
- **Python 3.9+**
- **MongoDB 5+**

---

### 🔧 Installation

#### 1️⃣ Frontend dependencies
```bash
cd frontend
npm install

2️⃣ Backend dependencies
bash
Copy code
cd backend
python -m venv venv
# macOS/Linux
source venv/bin/activate
# Windows
venv\Scripts\activate
pip install -r requirements.txt

3️⃣ Environment configuration
bash
Copy code
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env and add your GROQ_API_KEY
# Frontend
cp frontend/.env.example frontend/.env

🚀 Running the Project
🖥️ Backend (FastAPI)
bash
Copy code
npm run backend:dev
# or
cd backend && uvicorn main:app --reload --port 8000

🌐 Frontend (React)
bash
Copy code
cd frontend
npm run dev

🪟 Desktop (Electron)
bash
Copy code
cd frontend
npm run dev:electron

📱 Mobile (Capacitor)
bash
Copy code
npm run build:web
npm run cap:sync
npm run cap:ios      # For iOS
npm run cap:android  # For Android

✨ Features
✅ AI Chat Assistant powered by Groq (LLaMA models)
✅ Built-in web browser surface with address bar & iframe
✅ Persistent conversation history stored in MongoDB
✅ Cross-platform: Web, Desktop (Electron), and Mobile (Capacitor)
✅ Clean, modular React + FastAPI architecture


