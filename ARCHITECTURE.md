# Approvio — Architecture Reference Map

> **Purpose**: This file is an internal AI reference. It maps every file in the project to its responsibility so that future AI sessions can quickly orient themselves without re-reading every file.

---

## Backend (`Backend/src/`) 

### Entry Points 
| File | Purpose |
|------|---------|
| `index.js` | Server entry — creates HTTP server, connects DB, initializes Socket.IO, listens on port 4100 |
| `app.js` | Express app — CORS config, middleware chain, route registration, 404 handler, health check at `/` |

### Utils (`utils/`)
| File | Purpose |
|------|---------|
| `apiError.js` | Custom error class extending `Error`. Fields: statusCode, message, success, errors. Used with `throw new ApiError(code, msg)` |
| `apiResponse.js` | Standard API response wrapper. Constructor: `(statusCode, data, message)`. Auto-sets `success` based on statusCode < 400 |
| `asyncHandler.js` | HOF wrapping async route handlers in try/catch. Catches errors and returns JSON error response |

### Database (`db/`)
| File | Purpose |
|------|---------|
| `ConnectDB.js` | Connects to MongoDB Atlas via `MONGO_URI` env var. Exports `{ ConnectDB }` |

### Models (`models/`) — 8 Mongoose schemas
| File | Fields | Notes |
|------|--------|-------|
| `user.model.js` | name, email, password, googleId, avatar, bio, role(client/editor) | bcrypt pre-save hook, JWT generation methods, password optional for Google users |
| `workspace.model.js` | name, description, owner(→User), logo, members[{user, role, joinedAt}] | Pre-save hook auto-adds owner to members. Embedded members array |
| `project.model.js` | name, description, workspace(→Workspace), coverImage, deadline, status, assignedEditors[→User], createdBy | Indexed on workspace+status |
| `submission.model.js` | project(→Project), submittedBy(→User), title, description, files[{url, publicId, type, originalName, size}], version, parentSubmission, status | Supports versioning via parentSubmission chain. Statuses: pending, in_review, approved, revision_requested, rejected |
| `review.model.js` | submission(→Submission), reviewedBy(→User), action(approved/revision_requested/rejected), notes | Indexed on submission+createdAt |
| `comment.model.js` | submission(→Submission), author(→User), text, attachments[], parentComment(→Comment), mentions[→User] | Threaded via parentComment |
| `notification.model.js` | recipient(→User), type(enum 8 types), title, message, relatedSubmission/Project/Workspace, isRead | Indexed on recipient+isRead+createdAt |
| `invitation.model.js` | workspace(→Workspace), invitedBy(→User), email, role, token(UUID), status, expiresAt(7d) | Token auto-generated via uuid |

### Middlewares (`middlewares/`)
| File | Purpose |
|------|---------|
| `auth.middleware.js` | `verifyJWT` — extracts JWT from cookies or Bearer header, verifies, attaches `req.user` |
| `role.middleware.js` | `requireRole(...roles)` — factory that checks workspace membership + role. Attaches `req.workspace`, `req.memberRole` |
| `upload.middleware.js` | Multer config — disk storage in `public/temp/`, UUID filenames, file type filter (images/videos/docs), 50MB limit, max 10 files |

### Services (`services/`)
| File | Purpose |
|------|---------|
| `cloudinary.js` | `uploadToCloudinary(path, folder)` — uploads file, deletes local copy, returns result. `deleteFromCloudinary(publicId)`. Auto-detects resource type |
| `socket.js` | Socket.IO manager — `initializeSocket(server)`, rooms: `user_{id}`, `workspace_{id}`, `project_{id}`. Exports `emitToUser()`, `emitToWorkspace()`, `emitToProject()` |

### Controllers (`controllers/`) — 8 controller files
| File | Key Functions | Notes |
|------|--------------|-------|
| `auth.controllers.js` | register, login, googleAuth, refreshAccessToken, logout, getMe, updateProfile | Google auth verifies token via Google tokeninfo endpoint. Cookie options auto-detect HTTPS |
| `workspace.controllers.js` | createWorkspace, getWorkspaces, getWorkspaceById, updateWorkspace, deleteWorkspace | Membership checks on read, owner/admin checks on write |
| `member.controllers.js` | inviteMember, acceptInvitation, getMembers, updateMemberRole, removeMember | Creates Invitation with UUID token, sends notification to existing users. Accept validates expiry |
| `project.controllers.js` | createProject, getProjects, getProjectById, updateProject, deleteProject, assignEditors | Workspace membership validation. AssignEditors sends notifications |
| `submission.controllers.js` | createSubmission, getSubmissions, getSubmissionById, updateSubmission, deleteSubmission, resubmit | Files uploaded to Cloudinary. Resubmit creates new version linked via parentSubmission |
| `review.controllers.js` | createReview, getReviews | Updates submission status, creates notification, emits socket events |
| `comment.controllers.js` | createComment, getComments, deleteComment | Notifies submission owner + mentioned users, emits to project room |
| `notification.controllers.js` | getNotifications, markAsRead, markAllAsRead, getUnreadCount | Paginated (default 30), sorted by newest |

### Routes (`routes/`) — 7 route files
| File | Base Path | Auth | Notable |
|------|-----------|------|---------|
| `auth.routes.js` | `/api/auth` | Mixed | `/google` for Google OAuth |
| `workspace.routes.js` | `/api/workspaces` | All | Combines workspace CRUD + member management |
| `project.routes.js` | `/api/projects` | All | `PUT /:id/assign` for editor assignment |
| `submission.routes.js` | `/api/submissions` | All | `upload.array("files", 10)` on POST and resubmit |
| `review.routes.js` | `/api/reviews` | All | POST create + GET list |
| `comment.routes.js` | `/api/comments` | All | CRUD |
| `notification.routes.js` | `/api/notifications` | All | `/unread-count`, `/read-all`, `/:id/read` |

---

## Frontend (`Frontend/src/`)

### Entry & Routing
| File | Purpose |
|------|---------|
| `main.jsx` | ReactDOM render entry |
| `App.jsx` | BrowserRouter + route definitions. `ProtectedRoute` (requires auth), `PublicRoute` (redirects to dashboard if authed). AppProvider wraps protected routes |
| `index.css` | Global design system: CSS custom properties (colors, typography, spacing, shadows), resets, utility classes (.glass-card, .gradient-text), animations (fadeIn, slideInUp, shimmer, spin), scrollbar styles |

### API (`api/`)
| File | Purpose |
|------|---------|
| `axios.js` | Pre-configured Axios instance. Base URL `localhost:4100/api`. Request interceptor adds Bearer token from localStorage. Response interceptor auto-refreshes on 401 |

### Contexts (`context/`)
| File | Provides | Notes |
|------|----------|-------|
| `AuthContext.jsx` | user, loading, login, register, googleLogin, logout, updateProfile, checkAuth | Checks `/auth/me` on mount |
| `AppContext.jsx` | socket, notifications, unreadCount, workspaces, currentWorkspace, fetchWorkspaces, markNotificationRead, markAllRead | Connects Socket.IO on user login, fetches notifications + workspaces |

### Layout Components (`components/layout/`)
| File | Purpose |
|------|---------|
| `AppLayout.jsx` | Flex container: Sidebar + `<Outlet />` for page content |
| `Sidebar.jsx` | Collapsible sidebar — Logo, nav links (Dashboard, Workspaces), current workspace context, workspace quick-switch, settings, user card with logout |
| `Topbar.jsx` | Sticky header — page title/subtitle, notification bell with dropdown panel (shows notifications, mark-as-read) |

### UI Components (`components/ui/`)
| File | Exports |
|------|---------|
| `ui.jsx` | `Button` (variants: primary/secondary/danger/success/ghost, sizes: sm/md/lg, loading state), `Modal` (overlay + content, sizes: sm/md/lg), `StatusBadge` (colored pill for status), `Avatar` (initials or image, auto-color from name), `EmptyState` (icon + title + desc + action), `Loader` (spinning circle), `Input`, `Textarea`, `Select` (label + error support) |
| `ui.css` | Styles for all UI components |

### Pages (`pages/`)
| File | Route | Purpose |
|------|-------|---------|
| `Landing.jsx` | `/` | Marketing page — hero with gradient text, stats bar, 6 feature cards, animated orb backgrounds |
| `Login.jsx` | `/login` | Email/password form + Google OAuth button |
| `Register.jsx` | `/register` | Registration form with role selection (client/editor) + Google OAuth |
| `Dashboard.jsx` | `/dashboard` | 4 stat cards, workspace grid, recent submissions activity feed, create workspace modal |
| `WorkspaceDetail.jsx` | `/workspace/:id` | Tabs: Projects (grid with status badges) + Members (list with role badges). Create project modal, invite member modal |
| `ProjectDetail.jsx` | `/project/:id` | Split layout — left: submissions list, right: detail view with file previews (image/video/doc), review history timeline, comments thread, comment input. Submit work modal, review modal with approve/revise/reject |
| `Settings.jsx` | `/settings` | Profile editing (name, bio), account info display |
| `JoinWorkspace.jsx` | `/join/:token` | Invitation acceptance — handles authenticated and unauthenticated states |

### Utils (`utils/`)
| File | Exports |
|------|---------|
| `helpers.js` | `formatDate`, `formatRelative` (just now, 5m ago, etc.), `getInitials`, `getStatusColor`, `getStatusLabel`, `formatFileSize` |

---

## Data Flow

```
User Action → React Component → API.post/get (Axios) → Express Route → Controller → Mongoose Model → MongoDB
                                                                          ↓
                                                              Socket.IO emit → React Context (real-time update)
                                                              Cloudinary upload (for files)
```

## Key Patterns
1. **Auth flow**: JWT in HTTP-only cookies + localStorage fallback. Auto-refresh on 401
2. **Error handling**: `asyncHandler` wraps all controllers, `ApiError` for structured errors
3. **Real-time**: Socket.IO rooms per user/workspace/project. Notifications emitted server-side
4. **File upload**: Multer → local temp → Cloudinary upload → URL saved in DB → local file deleted
5. **RBAC**: Workspace-level roles (owner/admin/editor). Owner can do everything, admin can manage projects + invite, editor can submit work

## Environment Variables Required
- **Backend**: PORT, MONGO_URI, ACCESS_TOKEN_SECRET/EXPIRY, REFRESH_TOKEN_SECRET/EXPIRY, CLOUDINARY_*, GOOGLE_CLIENT_ID/SECRET, FRONTEND_URL
- **Frontend**: VITE_GOOGLE_CLIENT_ID
