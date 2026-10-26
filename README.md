# AI Chat Assistant (Real-Time Streaming Studio)

An intelligent real-time AI chat application built with **React + Vite** and **Node.js + Express**, featuring **MongoDB persistence**, dynamic **Tone Toggle** system prompt modulation, and **Server-Sent Events (SSE)** real-time streaming.

---

## 🚀 Quick Start Guide

### 1. Start the Backend (`server`)
```bash
cd server
npm install
npm run dev
```
- Server runs on: `http://localhost:5000`
- MongoDB URI: configured in `server/.env` (defaults to `mongodb://127.0.0.1:27017/aichat`)
- *(Optional)* Set `OPENAI_API_KEY` in `server/.env` to stream live from OpenAI. If omitted, the server automatically uses the built-in intelligent contextual streaming engine!

### 2. Start the Frontend (`client`)
```bash
cd client
npm install
npm run dev
```
- Client runs on: `http://localhost:5173`

---

## ✨ Features Checklist

- [x] **Scrollable Conversation View:** Distinct chat bubbles for user and AI, timestamps, avatars.
- [x] **Real-Time Streaming View:** Token-by-token text appearance with animated blinking cursor.
- [x] **History Sidebar:** Past conversation threads with quick switching, inline renaming, and deletion.
- [x] **MongoDB Persistence:** Stores full conversation objects including timestamps, user prompts, AI responses, and tone tags.
- [x] **The Vibe Check (Tone Toggle):** Switch between **Professional**, **Casual**, and **Concise** tones. Injects tone modifier system instructions into the AI prompt dynamically.
- [x] **Extra Feature 1:** **Markdown & Code Syntax Highlighting** with 1-click **Copy Code** and **Copy Message** buttons.
- [x] **Extra Feature 2:** **Sidebar History Search Filter** + **Export Chat** (Download transcript as `.md` or `.json`).
- [x] **Resilience & Fault Tolerance:** Automatic fallback to in-memory store if MongoDB is offline; intelligent local streaming if OpenAI API key is not provided.
- [x] **Stop Generating Button:** Aborts active streaming via `AbortController` and signals the backend to stop generation.

---

📖 **For detailed architecture, API specifications, and technical justifications, see [PROJECT_DOCUMENTATION.md](file:///d:/Placement/Resume/sde+genai/quantiphi/PROJECT_DOCUMENTATION.md).**
