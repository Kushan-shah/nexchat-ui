# ⚡ NexChat UI — Real-Time Chat Frontend

> The client interface for [NexChat](https://github.com/Kushan-shah/nexchat-realtime-messaging) — a production-grade real-time messaging system.

![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)
![Vite](https://img.shields.io/badge/Vite-8-646cff?style=flat-square&logo=vite)
![Socket.IO](https://img.shields.io/badge/Socket.IO-Client-black?style=flat-square&logo=socket.io)
![CSS](https://img.shields.io/badge/CSS-Glassmorphism-1572b6?style=flat-square&logo=css3)

---

## 🚀 Key Highlights

- **Zero-dependency UI** — No CSS framework, no UI library; every component hand-crafted with vanilla CSS
- **Optimistic message rendering** with `crypto.randomUUID()` idempotency keys
- **Real-time Socket.IO integration** — typing indicators, online presence, DM notifications
- **Glassmorphic design system** — backdrop blur, CSS custom properties, animated gradient orbs
- **AI smart reply chips** rendered inline with one-click send
- **Instant Demo mode** — single-click temporary account for recruiter walkthroughs

## 🎯 What This Frontend Demonstrates

- State management with React Context (no Redux overhead)
- WebSocket lifecycle management with proper cleanup
- Optimistic UI patterns used in production chat apps (WhatsApp, Slack)
- Responsive, accessible design without any external UI library
- Clean component architecture: Context → Pages → UI

---

## 🏗️ Architecture

```
src/
├── context/
│   ├── AuthContext.jsx        # JWT auth state, login/register/logout
│   └── SocketContext.jsx      # Socket.IO lifecycle, online users, typing events
├── pages/
│   ├── Login.jsx              # Split-panel auth with animated orbs + instant demo
│   └── Dashboard.jsx          # Sidebar + chat view (global room + DM)
├── App.jsx                    # Auth-gated routing
├── index.css                  # Glassmorphic design system (CSS custom properties)
└── main.jsx                   # React 18 entry point
```

---

## ✨ UI Features

### Authentication
- **Split-panel login** with floating gradient orbs and glassmorphic card
- **Toggle** between Login and Register
- **Instant Demo** button — creates a temporary account for zero-friction testing

### Chat Dashboard
- **Global Room** — broadcast to all connected users
- **Direct Messaging** — click any online user or paste their ID
- **Typing indicators** with animated bounce dots
- **Online presence** — live user list with status
- **Unread badges** with pulsing animation
- **Message search** across chat history
- **Emoji picker** with inline insertion
- **AI Smart Replies** — Gemini-generated suggestions rendered as clickable chips

### Message System
- **Optimistic rendering** — messages appear instantly before server confirmation
- **Delivery status** — single check (sent) → double check (delivered)
- **Auto-scroll** on new messages
- **Double-tap reactions** (❤️) with count display
- **Cursor-based history** loaded from backend API

---

## 🎨 Design System

Built entirely with CSS custom properties — no Tailwind, no Bootstrap:

```css
--bg-gradient: linear-gradient(135deg, #0f1219, #1a1f2e, #0d1117)
--glass-bg: rgba(255, 255, 255, 0.03)
--accent: #6b4cff
--text-main: #f1f5f9
```

| Element | Technique |
|---|---|
| Panels | `backdrop-filter: blur(20px)` + semi-transparent borders |
| Buttons | Gradient backgrounds with hover elevation |
| Orbs | CSS `@keyframes` with blur(80px) for ambient light |
| Messages | Slide-in animations (left for self, right for others) |
| Badges | Pulsing `@keyframes` with gradient + box-shadow |

---

## 🔧 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 18 |
| **Build** | Vite 8 |
| **WebSocket** | socket.io-client 4.7 |
| **Icons** | Lucide React |
| **Styling** | Vanilla CSS (glassmorphism, custom properties) |
| **State** | React Context API |

---

## ⚡ Quick Start

```bash
# Clone
git clone https://github.com/Kushan-shah/nexchat-ui.git
cd nexchat-ui

# Install
npm install

# Run (backend must be running on port 3000)
npm run dev
```

> **Note:** This frontend connects to the [NexChat Backend](https://github.com/Kushan-shah/nexchat-realtime-messaging). Ensure the backend is running before starting.

---

## 📁 Related Repository

| Repository | Description |
|---|---|
| [nexchat-realtime-messaging](https://github.com/Kushan-shah/nexchat-realtime-messaging) | Node.js backend — Socket.IO, Redis, PostgreSQL, K6 tested |

---

## 📄 License

MIT
