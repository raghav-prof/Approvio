import { useState, useEffect } from "react"
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
    const [recentSubmissions, setRecentSubmissions] = useState([])
    const [stats, setStats] = useState({ projects: 0, submissions: 0, pending: 0, approved: 0 })

    useEffect(() => { fetchDashboardData() }, [workspaces])

    async function fetchDashboardData() {
        if (workspaces.length === 0) return
        try {
            let totalProjects = 0, totalSubs = 0, pendingSubs = 0, approvedSubs = 0
            let allSubs = []
            for (const ws of workspaces.slice(0, 5)) {
                const { data: projData } = await API.get(`/projects?workspace=${ws._id}`)
                totalProjects += projData.data.length
                for (const p of projData.data.slice(0, 5)) {
                    const { data: subData } = await API.get(`/submissions?project=${p._id}`)
                    totalSubs += subData.data.length
                    pendingSubs += subData.data.filter(s => s.status === "pending").length
                    approvedSubs += subData.data.filter(s => s.status === "approved").length
                    allSubs.push(...subData.data.map(s => ({ ...s, projectName: p.name, workspaceName: ws.name })))
                }
            }
            setStats({ projects: totalProjects, submissions: totalSubs, pending: pendingSubs, approved: approvedSubs })
            setRecentSubmissions(allSubs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8))
        } catch {}
    }

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

    const firstName = user?.name?.split(" ")[0] || "there"
    const hour = new Date().getHours()
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"
    const hasData = workspaces.length > 0

    return (
        <div className="page">
            <Topbar title={`${greeting}, ${firstName}`} subtitle={hasData ? "Here's your workspace overview" : "Let's get you started"} />
            <div className="page-content">

                {/* ═══ EMPTY STATE — Onboarding ═══ */}
                {!hasData && (
                    <div className="onboarding">
                        {/* Welcome */}
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

                        {/* Quick Actions — YunoJuno style */}
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

                {/* ═══ HAS DATA — Dashboard ═══ */}
                {hasData && (
                    <>
                        {/* Stats Row */}
                        <div className="stats-row anim-fade-up">
                            {[
                                { value: workspaces.length, label: "Workspaces", color: "#8b5cf6" },
                                { value: stats.projects, label: "Projects", color: "#3b82f6" },
                                { value: stats.pending, label: "Pending", color: "#eab308" },
                                { value: stats.approved, label: "Approved", color: "#22c55e" },
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
                            {/* Left Column — Workspaces */}
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

                            {/* Right Column — Recent Activity */}
                            <div className="dash-col">
                                <div className="section-header">
                                    <h2 className="section-title">Recent activity</h2>
                                </div>
                                {recentSubmissions.length === 0 ? (
                                    <div className="empty-activity">
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-ghost)" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                        <p>No activity yet. Submit your first piece of work to see it here.</p>
                                    </div>
                                ) : (
                                    <div className="activity-feed">
                                        {recentSubmissions.map((sub, i) => (
                                            <div key={sub._id} className={`feed-item anim-fade-up delay-${Math.min(i+1, 5)}`}>
                                                <div className="feed-left">
                                                    <Avatar name={sub.submittedBy?.name} src={sub.submittedBy?.avatar} size={28} />
                                                    <div className="feed-info">
                                                        <span className="feed-title">{sub.title}</span>
                                                        <span className="feed-meta">
                                                            {sub.submittedBy?.name || "Unknown"} → {sub.projectName}
                                                            <span className="feed-dot">·</span>
                                                            {formatRelative(sub.createdAt)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <StatusBadge status={sub.status} />
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
