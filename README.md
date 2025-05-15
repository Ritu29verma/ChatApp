---

# 💬 Real-Time Client-Agent Chat System

A full-stack real-time chat application built using **React**, **Node.js**, and **Socket.IO** that enables seamless communication between clients and agents with user presence tracking, chat requests, and secure session handling.

---

## 🚀 Features Implemented

### 👤 User Roles

* **Client/Guest** – Can initiate and chat with agents
* **Agent/Admin** – Views online users and handles multiple conversations

### 🔧 Core Features

| Feature                        | Description                                                      |
| ------------------------------ | ---------------------------------------------------------------- |
| **Real-time messaging**        | Live socket-based messaging between clients and agents           |
| **Session tracking**           | Stores username and session in `sessionStorage`                  |
| **Online users list**          | Backend tracks all connected users and notifies agents           |
| **Chat request system**        | Clients send requests; agents accept and start conversations     |
| **Logout logic**               | Proper session cleanup and real-time updates to agent dashboards |
| **Modular chat UI components** | Separate chat interfaces for guest, user, and agents             |
| **Live chat notifications**    | Agents receive new request alerts as modals                      |

---

## 🛠️ Tech Stack

* **Frontend:** React, Tailwind CSS, Axios
* **Backend:** Node.js, Express, Socket.IO
* **State/Session:** `sessionStorage`, React State Hooks
* **Utilities:** Nodemon, Logger, UUID for IDs
* **Database:** MY SQL
---

## 📁 Project Structure (Example)

```
/client
  /components
    ChatWindow.jsx
    GuestChatWindow.jsx
    AgentChatWindow.jsx
    ChatRequestModal.jsx
  /utils
    socket.js
    helpers.js
  App.jsx
  index.js

/server
  index.js
  socketHandlers.js
  utils/onlineUsers.js
```

---

## 🧭 Roadmap: Upcoming Features

### 🔄 Phase 1: Core Stability & Enhancements

* [ ] **Fix race conditions during login/logout**
* [ ] **Prevent duplicate usernames / handle reconnects**
* [ ] **Store chats in memory for session continuity**

---

### 📝 Phase 2: Chat Enhancements

* [ ] **💬 Chat History (Session-only)**

  * Store messages per session (in-memory or localStorage)
  * Agent can view past conversation of the current session

* [ ] **🗂 Chat Transcripts**

  * Allow agents and clients to download or email transcripts
  * Add a "📧 Email Chat Transcript" button in chat header

* [ ] **📎 File & Image Attachments**

  * Enable sending attachments (PDF, JPG, PNG, etc.)
  * Show file previews in the chat window

* [ ] **📊 Typing Indicators**

  * Show “User is typing…” indicator
  * Use throttled socket event to show typing in real time

* [ ] **📨 Unread Message Badges**

  * Show unread count in minimized chat window
  * Highlight when new messages arrive and chat is not focused

---

### 📚 Phase 3: Persistence & Admin Dashboard

* [ ] **🗄 Persistent Chat History (MongoDB or PostgreSQL)**

  * Store messages in DB with timestamp, user IDs, etc.
  * Allow admin to view history per user

* [ ] **📊 Admin Panel**

  * Dashboard for all chats, transcripts, analytics
  * View online users, sessions, and agent performance

* [ ] **🔒 Authentication & Roles**

  * Add secure login for agents (JWT-based)
  * Role-based access for client/agent/admin

---

### 🌐 Phase 4: Integration & Deployability

* [ ] **🔌 Webhook or CRM Integrations**

  * Integrate with CRMs like Hubspot, Salesforce
  * Send lead/contact info via API when chat ends

* [ ] **📦 Add as Widget to Any Website**

  * Create embeddable chat widget script
  * Allow deployment via a single JS snippet

* [ ] **🌍 Internationalization**

  * Support multiple languages
  * Detect or switch locale dynamically

---

## 📦 Setup Instructions

### 1. Clone the Repo

```bash
git clone https://github.com/Ritu29verma/ChatApp
cd ChatApp
```

### 2. setup frontend

```bash
cd FE
npm install
npm run dev
```

### 3. setup Backend

```bash
cd BE
npm install
npm run dev
```

---
## 🤝 Contributing

Pull requests and feature ideas are welcome! For major changes, please open an issue first to discuss what you’d like to change.
