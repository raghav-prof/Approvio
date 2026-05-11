import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useApp } from "../context/AppContext"
import Topbar from "../components/layout/Topbar"
import { Button, Modal, Input, Textarea, StatusBadge, Avatar } from "../components/ui/ui"
import { formatRelative } from "../utils/helpers"
import API from "../api/axios"
import "./Dashboard.css"

export default function Dashboard() {
    const { user } = useAuth()
    const { workspaces, fetchWorkspaces } = useApp()
    const navigate = useNavigate()
    const [showCreate, setShowCreate] = useState(false)
    const [creating, setCreating] = useState(false)
    const [wsForm, setWsForm] = useState({ name: "", description: "" })
    const [stats, setStats] = useState({ projects: 0, submissions: 0, pending: 0, approved: 0 })

    // Editor-specific state
    const [notifications, setNotifications] = useState([])
    const [assignedProjects, setAssignedProjects] = useState([])
    const [loadingEditor, setLoadingEditor] = useState(false)

    const isEditor = user?.role === "editor"

    useEffect(() => {
        if (isEditor) {
            fetchEditorData()
            // Poll notifications every 30s
            const interval = setInterval(fetchEditorData, 30000)
            return () => clearInterval(interval)
        } else {
            fetchDashboardData()
        }
    }, [workspaces, isEditor])

    // ─── Client dashboard data ───
    async function fetchDashboardData() {
        if (workspaces.length === 0) return
        try {
            // Fetch notifications for client's recent activity feed
            const { data: notifData } = await API.get("/notifications?limit=15")
            setNotifications(notifData.data.notifications || [])

            let totalProjects = 0, totalSubs = 0, pendingSubs = 0, approvedSubs = 0
            for (const ws of workspaces.slice(0, 5)) {
                const { data: projData } = await API.get(`/projects?workspace=${ws._id}`)
                totalProjects += projData.data.length
                for (const p of projData.data.slice(0, 5)) {
                    const { data: subData } = await API.get(`/submissions?project=${p._id}`)
                    totalSubs += subData.data.length
                    pendingSubs += subData.data.filter(s => s.status === "pending").length
                    approvedSubs += subData.data.filter(s => s.status === "approved").length
                }
            }
            setStats({ projects: totalProjects, submissions: totalSubs, pending: pendingSubs, approved: approvedSubs })
        } catch {}
    }

    // ─── Editor dashboard data ───
    const fetchEditorData = useCallback(async () => {
        setLoadingEditor(true)
        try {
            // Fetch notifications
            const { data: notifData } = await API.get("/notifications?limit=15")
            setNotifications(notifData.data.notifications || [])

            // Fetch assigned projects across all workspaces
            let projects = []
            for (const ws of workspaces.slice(0, 10)) {
                try {
                    const { data: projData } = await API.get(`/projects?workspace=${ws._id}`)
                    const assigned = projData.data.filter(p =>
                        p.assignedEditors?.some(e => (e._id || e) === user?.id)
                    )
                    projects.push(...assigned.map(p => ({ ...p, workspaceName: ws.name })))
                } catch {}
            }
            setAssignedProjects(projects)
        } catch {} finally { setLoadingEditor(false) }
    }, [workspaces, user])

    async function handleCreateWorkspace(e) {
        e.preventDefault()
        setCreating(true)
        try {
            const { data } = await API.post("/workspaces", wsForm)
            await fetchWorkspaces()
            setShowCreate(false)
            setWsForm({ name: "", description: "" })
            navigate(`/workspace/${data.data._id}`)
        } catch {} finally { setCreating(false) }
    }

    async function markNotifRead(id) {
        try {
            await API.put(`/notifications/${id}/read`)
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n))
        } catch {}
    }

    async function markAllRead() {
        try {
            await API.put("/notifications/read-all")
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
        } catch {}
    }

    const firstName = user?.name?.split(" ")[0] || "there"
    const hour = new Date().getHours()
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"
    const hasData = workspaces.length > 0
    const unreadCount = notifications.filter(n => !n.isRead).length

    return (
        <div className="page">
            <Topbar
                title={`${greeting}, ${firstName}`}
                subtitle={isEditor ? "Here's what needs your attention" : (hasData ? "Here's your workspace overview" : "Let's get you started")}
            />
            <div className="page-content">

                {/* ═══════════════════════════════════════
                    EDITOR DASHBOARD
                   ═══════════════════════════════════════ */}
                {isEditor && (
                    <div className="editor-dashboard">
                        {/* Quick Stats Bar */}
                        <div className="editor-stats-bar anim-fade-up">
                            <div className="editor-stat">
                                <span className="editor-stat-value">{assignedProjects.length}</span>
                                <span className="editor-stat-label">Assigned Projects</span>
                            </div>
                            <div className="editor-stat-sep" />
                            <div className="editor-stat">
                                <span className="editor-stat-value">{unreadCount}</span>
                                <span className="editor-stat-label">Unread Notifications</span>
                            </div>
                            <div className="editor-stat-sep" />
                            <div className="editor-stat">
                                <span className="editor-stat-value">{workspaces.length}</span>
                                <span className="editor-stat-label">Workspaces</span>
                            </div>
                        </div>

                        <div className="editor-grid">
                            {/* LEFT — Assigned Projects */}
                            <div className="editor-col">
                                <div className="section-header">
                                    <h2 className="section-title">Your Projects</h2>
                                    <span className="section-count">{assignedProjects.length}</span>
                                </div>

                                {assignedProjects.length === 0 ? (
                                    <div className="editor-empty-card">
                                        <div className="editor-empty-icon">
                                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                                            </svg>
                                        </div>
                                        <h4>No projects assigned yet</h4>
                                        <p>When a client assigns you to a project, it will appear here. Check your notifications for updates.</p>
                                    </div>
                                ) : (
                                    <div className="editor-project-list">
                                        {assignedProjects.map((p, i) => (
                                            <div key={p._id} className={`editor-project-card anim-fade-up delay-${Math.min(i+1, 5)}`}
                                                onClick={() => navigate(`/workspace/${p.workspace?._id || p.workspace}`)}>
                                                <div className="editor-proj-top">
                                                    <div className="editor-proj-name-row">
                                                        <span className="editor-proj-name">{p.name}</span>
                                                        <StatusBadge status={p.status} />
                                                    </div>
                                                    <span className="editor-proj-ws">{p.workspaceName}</span>
                                                </div>
                                                {p.description && <p className="editor-proj-desc">{p.description}</p>}
                                                <div className="editor-proj-footer">
                                                    <div className="editor-proj-editors">
                                                        {(p.assignedEditors || []).slice(0, 4).map(e => (
                                                            <Avatar key={e._id} name={e.name} src={e.avatar} size={22} />
                                                        ))}
                                                    </div>
                                                    {p.deadline && (
                                                        <span className="editor-proj-deadline">
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                                                            </svg>
                                                            {new Date(p.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* RIGHT — Notifications Feed */}
                            <div className="editor-col">
                                <div className="section-header">
                                    <h2 className="section-title">
                                        Notifications
                                        {unreadCount > 0 && <span className="notif-count-badge">{unreadCount}</span>}
                                    </h2>
                                    {unreadCount > 0 && (
                                        <button className="mark-read-btn" onClick={markAllRead}>Mark all read</button>
                                    )}
                                </div>

                                {notifications.length === 0 ? (
                                    <div className="editor-empty-card">
                                        <div className="editor-empty-icon">
                                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                                            </svg>
                                        </div>
                                        <h4>All caught up!</h4>
                                        <p>No notifications yet. You'll be notified when you're assigned to projects or receive messages.</p>
                                    </div>
                                ) : (
                                    <div className="notif-feed">
                                        {notifications.map((n, i) => (
                                            <div key={n._id}
                                                className={`notif-feed-item ${!n.isRead ? "unread" : ""} anim-fade-up delay-${Math.min(i+1, 5)}`}
                                                onClick={() => {
                                                    if (!n.isRead) markNotifRead(n._id)
                                                    if (n.relatedProject) navigate(`/workspace/${n.relatedWorkspace?._id || n.relatedWorkspace}`)
                                                }}>
                                                <div className="notif-feed-indicator">
                                                    {!n.isRead && <div className="notif-feed-dot" />}
                                                </div>
                                                <div className="notif-feed-icon">
                                                    {n.type === "project_assigned" ? "📋" :
                                                     n.type === "new_message" ? "💬" :
                                                     n.type === "submission_reviewed" ? "✅" :
                                                     n.type === "deadline_reminder" ? "⏰" : "🔔"}
                                                </div>
                                                <div className="notif-feed-body">
                                                    <span className="notif-feed-title">{n.title}</span>
                                                    <span className="notif-feed-message">{n.message}</span>
                                                    <span className="notif-feed-time">{formatRelative(n.createdAt)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════════════
                    CLIENT DASHBOARD — Onboarding
                   ═══════════════════════════════════════ */}
                {!isEditor && !hasData && (
                    <div className="onboarding">
                        <div className="welcome-hero anim-fade-up">
                            <div className="welcome-glow" />
                            <h2 className="welcome-heading">
                                Welcome to <span className="welcome-accent">Approvio</span>
                            </h2>
                            <p className="welcome-sub">
                                Your creative approval workflow starts here. Set up your workspace,
                                invite your team, and start reviewing work.
                            </p>
                        </div>

                        <div className="quick-actions anim-fade-up delay-1">
                            <div className="action-card" onClick={() => setShowCreate(true)}>
                                <div className="action-icon action-icon-workspace">
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
                                </div>
                                <div className="action-info">
                                    <h3>Create a workspace</h3>
                                    <p>Set up a workspace for your team, client, or project. This is where everything lives.</p>
                                </div>
                                <button className="action-btn">Create workspace</button>
                            </div>

                            <div className="action-card">
                                <div className="action-icon action-icon-project">
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                                </div>
                                <div className="action-info">
                                    <h3>Start a project</h3>
                                    <p>Create a project inside your workspace. Assign editors and set deadlines for deliverables.</p>
                                </div>
                                <span className="action-hint">Create a workspace first</span>
                            </div>

                            <div className="action-card">
                                <div className="action-icon action-icon-invite">
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                                </div>
                                <div className="action-info">
                                    <h3>Invite your team</h3>
                                    <p>Add freelancers, editors, and collaborators. Control access with role-based permissions.</p>
                                </div>
                                <span className="action-hint">Create a workspace first</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════════════
                    CLIENT DASHBOARD — Active
                   ═══════════════════════════════════════ */}
                {!isEditor && hasData && (
                    <>
                        <div className="stats-row anim-fade-up">
                            {[
                                { value: workspaces.length, label: "Workspaces", color: "#6366f1" },
                                { value: stats.projects, label: "Projects", color: "#3b82f6" },
                                { value: stats.pending, label: "Pending", color: "#ca8a04" },
                                { value: stats.approved, label: "Approved", color: "#16a34a" },
                            ].map((s, i) => (
                                <div key={i} className="stat-card">
                                    <div className="stat-indicator" style={{ background: s.color }} />
                                    <div className="stat-card-info">
                                        <span className="stat-card-value">{s.value}</span>
                                        <span className="stat-card-label">{s.label}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="dash-grid">
                            <div className="dash-col">
                                <div className="section-header">
                                    <h2 className="section-title">Workspaces</h2>
                                    <Button variant="secondary" size="sm" onClick={() => setShowCreate(true)}>
                                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="3" x2="8" y2="13"/><line x1="3" y1="8" x2="13" y2="8"/></svg>
                                        New
                                    </Button>
                                </div>
                                <div className="ws-list">
                                    {workspaces.map((ws, i) => (
                                        <div key={ws._id} className={`ws-row anim-fade-up delay-${Math.min(i+1, 5)}`}
                                            onClick={() => navigate(`/workspace/${ws._id}`)}>
                                            <div className="ws-row-left">
                                                <div className="ws-row-icon" style={{ background: `hsl(${ws.name.charCodeAt(0) * 7 % 360}, 45%, 45%)` }}>
                                                    {ws.name[0]}
                                                </div>
                                                <div className="ws-row-info">
                                                    <span className="ws-row-name">{ws.name}</span>
                                                    <span className="ws-row-meta">{ws.members?.length || 1} member{(ws.members?.length || 1) > 1 ? "s" : ""}</span>
                                                </div>
                                            </div>
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--text-ghost)" strokeWidth="1.5" className="ws-row-arrow"><path d="M6 4l4 4-4 4"/></svg>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="dash-col">
                                <div className="section-header">
                                    <h2 className="section-title">Recent activity</h2>
                                </div>
                                {notifications.length === 0 ? (
                                    <div className="empty-activity">
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-ghost)" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                        <p>No activity yet. Notifications will appear here when there's action in your projects.</p>
                                    </div>
                                ) : (
                                    <div className="notif-feed">
                                        {notifications.map((n, i) => (
                                            <div key={n._id}
                                                className={`notif-feed-item ${!n.isRead ? "unread" : ""} anim-fade-up delay-${Math.min(i+1, 5)}`}
                                                onClick={() => {
                                                    if (!n.isRead) markNotifRead(n._id)
                                                    if (n.relatedProject) navigate(`/workspace/${n.relatedWorkspace?._id || n.relatedWorkspace}`)
                                                }}>
                                                <div className="notif-feed-indicator">
                                                    {!n.isRead && <div className="notif-feed-dot" />}
                                                </div>
                                                <div className="notif-feed-icon">
                                                    {n.type === "project_assigned" ? "📋" :
                                                     n.type === "new_message" ? "💬" :
                                                     n.type === "submission_new" ? "🚀" :
                                                     n.type === "submission_approved" ? "✅" :
                                                     n.type === "submission_rejected" ? "❌" :
                                                     n.type === "revision_requested" ? "🔄" :
                                                     n.type === "member_added" ? "👋" : "🔔"}
                                                </div>
                                                <div className="notif-feed-body">
                                                    <span className="notif-feed-title">{n.title}</span>
                                                    <span className="notif-feed-message">{n.message}</span>
                                                    <span className="notif-feed-time">{formatRelative(n.createdAt)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

            <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create workspace">
                <form onSubmit={handleCreateWorkspace} className="modal-form">
                    <Input label="Name" placeholder="e.g. Acme Studios" required
                        value={wsForm.name} onChange={e => setWsForm({ ...wsForm, name: e.target.value })} />
                    <Textarea label="Description" placeholder="What is this workspace for?"
                        value={wsForm.description} onChange={e => setWsForm({ ...wsForm, description: e.target.value })} />
                    <Button type="submit" variant="primary" size="lg" loading={creating} style={{ width: "100%", marginTop: 4 }}>
                        Create workspace
                    </Button>
                </form>
            </Modal>
        </div>
    )
}
