# Approvio

**Enterprise Client-Editor Collaboration & Approval Platform**

A full-stack web application where clients manage teams of freelancers/editors, exchange media & text submissions, and run structured approval workflows with inline feedback.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 + Vite |
| **Backend** | Node.js + Express 5 |
| **Database** | MongoDB Atlas (Mongoose) |
| **Real-time** | Socket.IO |
| **File Storage** | Cloudinary |
| **Auth** | JWT (access + refresh tokens) + Google OAuth |
| **Styling** | Vanilla CSS with design tokens |

---

## 📁 Project Structure

```
Approvio/
├── Backend/
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── db/              # MongoDB connection
│   │   ├── middlewares/      # Auth, RBAC, file upload
│   │   ├── models/          # Mongoose schemas (8 models)
│   │   ├── routes/          # Express routers
│   │   ├── services/        # Cloudinary, Socket.IO
│   │   ├── utils/           # ApiError, ApiResponse, asyncHandler
│   │   ├── app.js           # Express app configuration
│   │   └── index.js         # Server entry point
│   ├── public/temp/         # Temporary file uploads
│   ├── .env                 # Environment variables
│   └── package.json
│
├── Frontend/
│   ├── src/
│   │   ├── api/             # Axios instance with interceptors
│   │   ├── components/      # Reusable UI components
│   │   │   ├── layout/      # Sidebar, Topbar, AppLayout
│   │   │   └── ui/          # Button, Modal, Avatar, etc.
│   │   ├── context/         # React Context providers
│   │   ├── pages/           # Route-level page components
│   │   ├── utils/           # Helper functions
│   │   ├── App.jsx          # Router + auth guards
│   │   ├── index.css        # Design system tokens
│   │   └── main.jsx         # App entry point
│   ├── index.html
│   └── package.json
│
└── README.md
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account (for file uploads)

### 1. Clone and Install

```bash
# Backend
cd Approvio/Backend
npm install

# Frontend
cd ../Frontend
npm install
```

### 2. Configure Environment

Edit `Backend/.env`:

```env
PORT=4100
MONGO_URI=mongodb+srv://...
ACCESS_TOKEN_SECRET=your_secret
ACCESS_TOKEN_EXPIRY=7d
REFRESH_TOKEN_SECRET=your_secret
REFRESH_TOKEN_EXPIRY=14d
CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FRONTEND_URL=http://localhost:5173
```

For Google OAuth on the frontend, create `Frontend/.env`:
```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### 3. Run

```bash
# Terminal 1 — Backend
cd Backend && npm run dev

# Terminal 2 — Frontend
cd Frontend && npm run dev
```

- Backend: http://localhost:4100
- Frontend: http://localhost:5173

---

## ✨ Core Features

### 🔐 Authentication
- Email/password registration & login
- Google OAuth sign-in
- JWT access + refresh token flow (HTTP-only cookies)
- Role selection (Client / Editor)

### 🏢 Workspaces (Teams)
- Create and manage workspaces
- Invite members via email (generates shareable link)
- Role-based access: Owner, Admin, Editor
- Member management (add, remove, update roles)

### 📂 Projects
- Create projects within workspaces
- Set deadlines, status, cover images
- Assign specific editors to projects
- Status tracking: Active, Completed, Archived

### 📤 Submissions
- Upload images, videos, and documents (via Cloudinary)
- Rich text descriptions
- Version tracking (resubmit creates new version)
- Status flow: Pending → In Review → Approved / Revision / Rejected

### ✅ Review & Approval
- One-click actions: Approve ✅, Request Revision 🔄, Reject ❌
- Mandatory notes on revision requests
- Full review history / audit trail

### 💬 Comments
- Threaded comments on submissions
- @mentions for team members
- Real-time comment updates via Socket.IO

### 🔔 Notifications
- Real-time in-app notifications
- Types: new submission, approval, rejection, revision, comments, invitations
- Mark as read / mark all read
- Unread count badge

### 📊 Dashboard
- Stats overview (workspaces, projects, submissions, pending reviews)
- Recent submissions activity feed
- Quick workspace navigation

---

## 🛡️ API Endpoints

| Module | Endpoints |
|--------|-----------|
| Auth | `POST /api/auth/register, login, google, refresh, logout` `GET /api/auth/me` `PUT /api/auth/profile` |
| Workspaces | `CRUD /api/workspaces` + `POST /invite, /join/:token` + `GET /members` |
| Projects | `CRUD /api/projects` + `PUT /assign` |
| Submissions | `CRUD /api/submissions` + `POST /:id/resubmit` |
| Reviews | `POST /api/reviews` `GET /api/reviews?submission=` |
| Comments | `POST /api/comments` `GET /api/comments?submission=` `DELETE /:id` |
| Notifications | `GET /api/notifications` `PUT /:id/read` `PUT /read-all` `GET /unread-count` |

---

## 🎨 Design System

- **Theme**: Deep navy dark mode
- **Primary**: Electric Violet `#7c3aed`
- **Success**: Emerald `#10b981` (approvals)
- **Warning**: Amber `#f59e0b` (pending/revision)
- **Danger**: Rose `#f43f5e` (rejected)
- **Typography**: Inter font family
- **Effects**: Glassmorphism cards, gradient accents, micro-animations

---

## 📜 License

ISC © Raghav
