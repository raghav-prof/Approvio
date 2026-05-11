import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useApp } from "../context/AppContext"
import Topbar from "../components/layout/Topbar"
import { Button, Modal, Input, Textarea, EmptyState, StatusBadge } from "../components/ui/ui"
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
    const [stats, setStats] = useState({ projects: 0, submissions: 0, pending: 0 })

    useEffect(() => {
        fetchDashboardData()
    }, [workspaces])

    async function fetchDashboardData() {
        if (workspaces.length === 0) return
        try {
            let totalProjects = 0, totalSubs = 0, pendingSubs = 0
            let allSubs = []
            for (const ws of workspaces.slice(0, 3)) {
                const { data: projData } = await API.get(`/projects?workspace=${ws._id}`)
                totalProjects += projData.data.length
                for (const p of projData.data.slice(0, 3)) {
                    const { data: subData } = await API.get(`/submissions?project=${p._id}`)
                    totalSubs += subData.data.length
                    pendingSubs += subData.data.filter(s => s.status === "pending").length
                    allSubs.push(...subData.data.map(s => ({ ...s, projectName: p.name, workspaceName: ws.name })))
                }
            }
            setStats({ projects: totalProjects, submissions: totalSubs, pending: pendingSubs })
            setRecentSubmissions(allSubs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5))
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

    return (
        <div className="page">
            <Topbar title={`Welcome, ${user?.name?.split(" ")[0] || "there"}`} subtitle="Here's what's happening across your workspaces" />
            <div className="page-content">
                {/* Stats Cards */}
                <div className="stats-row">
                    <div className="stat-card">
                        <div className="stat-card-icon" style={{ background: "var(--accent-muted)" }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-text)" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        </div>
                        <div className="stat-card-info">
                            <span className="stat-card-value">{workspaces.length}</span>
                            <span className="stat-card-label">Workspaces</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-icon" style={{ background: "var(--info-muted)" }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--info)" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                        </div>
                        <div className="stat-card-info">
                            <span className="stat-card-value">{stats.projects}</span>
                            <span className="stat-card-label">Projects</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-icon" style={{ background: "var(--success-muted)" }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        </div>
                        <div className="stat-card-info">
                            <span className="stat-card-value">{stats.submissions}</span>
                            <span className="stat-card-label">Submissions</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-icon" style={{ background: "var(--warning-muted)" }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        </div>
                        <div className="stat-card-info">
                            <span className="stat-card-value">{stats.pending}</span>
                            <span className="stat-card-label">Pending Review</span>
                        </div>
                    </div>
                </div>

                {/* Workspace List + Create */}
                <div className="section-header">
                    <h2 className="section-title">Your Workspaces</h2>
                    <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>+ New Workspace</Button>
                </div>

                {workspaces.length === 0 ? (
                    <EmptyState title="No workspaces yet" description="Create your first workspace to start collaborating"
                        action={<Button variant="primary" onClick={() => setShowCreate(true)}>Create Workspace</Button>} />
                ) : (
                    <div className="workspace-grid">
                        {workspaces.map(ws => (
                            <div key={ws._id} className="workspace-card" onClick={() => navigate(`/workspace/${ws._id}`)}>
                                <div className="ws-card-header">
                                    <div className="ws-card-icon" style={{ background: `hsl(${ws.name.charCodeAt(0) * 7 % 360}, 55%, 50%)` }}>
                                        {ws.name[0]}
                                    </div>
                                    <div>
                                        <h3 className="ws-card-name">{ws.name}</h3>
                                        <span className="ws-card-members">{ws.members?.length || 1} members</span>
                                    </div>
                                </div>
                                {ws.description && <p className="ws-card-desc">{ws.description}</p>}
                            </div>
                        ))}
                    </div>
                )}

                {/* Recent Activity */}
                {recentSubmissions.length > 0 && (
                    <>
                        <div className="section-header" style={{ marginTop: 32 }}>
                            <h2 className="section-title">Recent Submissions</h2>
                        </div>
                        <div className="activity-list">
                            {recentSubmissions.map(sub => (
                                <div key={sub._id} className="activity-item">
                                    <div className="activity-info">
                                        <span className="activity-title">{sub.title}</span>
                                        <span className="activity-meta">{sub.workspaceName} → {sub.projectName}</span>
                                    </div>
                                    <div className="activity-right">
                                        <StatusBadge status={sub.status} />
                                        <span className="activity-time">{formatRelative(sub.createdAt)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Workspace">
                <form onSubmit={handleCreateWorkspace} className="modal-form">
                    <Input label="Workspace Name" placeholder="e.g. Acme Studios" required
                        value={wsForm.name} onChange={e => setWsForm({ ...wsForm, name: e.target.value })} />
                    <Textarea label="Description (optional)" placeholder="What is this workspace for?"
                        value={wsForm.description} onChange={e => setWsForm({ ...wsForm, description: e.target.value })} />
                    <Button type="submit" variant="primary" size="lg" loading={creating} style={{ width: "100%", marginTop: 8 }}>
                        Create Workspace
                    </Button>
                </form>
            </Modal>
        </div>
    )
}
