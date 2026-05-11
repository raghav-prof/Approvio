import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useApp } from "../context/AppContext"
import { useAuth } from "../context/AuthContext"
import Topbar from "../components/layout/Topbar"
import { Button, Modal, Input, Textarea, Select, StatusBadge, Avatar, EmptyState, Loader } from "../components/ui/ui"
import { formatDate } from "../utils/helpers"
import API from "../api/axios"
import "./WorkspaceDetail.css"

export default function WorkspaceDetail() {
    const { id } = useParams()
    const { user } = useAuth()
    const { setCurrentWorkspace } = useApp()
    const navigate = useNavigate()

    const [workspace, setWorkspace] = useState(null)
    const [projects, setProjects] = useState([])
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState("projects")

    // Modals
    const [showCreateProject, setShowCreateProject] = useState(false)
    const [showInvite, setShowInvite] = useState(false)
    const [projectForm, setProjectForm] = useState({ name: "", description: "", deadline: "" })
    const [inviteForm, setInviteForm] = useState({ email: "", role: "editor" })
    const [creating, setCreating] = useState(false)

    useEffect(() => { fetchData() }, [id])

    async function fetchData() {
        setLoading(true)
        try {
            const { data: wsData } = await API.get(`/workspaces/${id}`)
            setWorkspace(wsData.data)
            setCurrentWorkspace(wsData.data)
            const { data: projData } = await API.get(`/projects?workspace=${id}`)
            setProjects(projData.data)
        } catch {} finally { setLoading(false) }
    }

    async function handleCreateProject(e) {
        e.preventDefault()
        setCreating(true)
        try {
            await API.post("/projects", { ...projectForm, workspace: id })
            setShowCreateProject(false)
            setProjectForm({ name: "", description: "", deadline: "" })
            fetchData()
        } catch {} finally { setCreating(false) }
    }

    async function handleInvite(e) {
        e.preventDefault()
        setCreating(true)
        try {
            const { data } = await API.post(`/workspaces/${id}/invite`, inviteForm)
            alert(`Invite link: ${data.data.inviteLink}`)
            setShowInvite(false)
            setInviteForm({ email: "", role: "editor" })
            fetchData()
        } catch (err) {
            alert(err.response?.data?.message || "Invite failed")
        } finally { setCreating(false) }
    }

    const myRole = workspace?.members?.find(m => (m.user?._id || m.user) === user?.id)?.role
    const isAdmin = myRole === "owner" || myRole === "admin"

    if (loading) return <div className="page"><Loader /></div>
    if (!workspace) return <div className="page"><EmptyState title="Workspace not found" /></div>

    return (
        <div className="page">
            <Topbar title={workspace.name} subtitle={`${workspace.members?.length} members · Created ${formatDate(workspace.createdAt)}`} />
            <div className="page-content">
                {/* Tabs */}
                <div className="tabs-row">
                    <button className={`tab ${tab === "projects" ? "active" : ""}`} onClick={() => setTab("projects")}>
                        Projects ({projects.length})
                    </button>
                    <button className={`tab ${tab === "members" ? "active" : ""}`} onClick={() => setTab("members")}>
                        Members ({workspace.members?.length})
                    </button>
                </div>

                {tab === "projects" && (
                    <>
                        <div className="section-header">
                            <h2 className="section-title">Projects</h2>
                            {isAdmin && <Button variant="primary" size="sm" onClick={() => setShowCreateProject(true)}>+ New Project</Button>}
                        </div>
                        {projects.length === 0 ? (
                            <EmptyState title="No projects yet" description="Create your first project to get started"
                                action={isAdmin && <Button variant="primary" onClick={() => setShowCreateProject(true)}>Create Project</Button>} />
                        ) : (
                            <div className="project-grid">
                                {projects.map(p => (
                                    <div key={p._id} className="project-card glass-card" onClick={() => navigate(`/project/${p._id}`)}>
                                        <div className="project-card-top">
                                            <h3 className="project-card-name">{p.name}</h3>
                                            <StatusBadge status={p.status} />
                                        </div>
                                        {p.description && <p className="project-card-desc">{p.description.slice(0, 100)}</p>}
                                        <div className="project-card-footer">
                                            <div className="project-editors">
                                                {(p.assignedEditors || []).slice(0, 3).map(e => (
                                                    <Avatar key={e._id} name={e.name} src={e.avatar} size={28} />
                                                ))}
                                                {(p.assignedEditors?.length || 0) > 3 && <span className="more-count">+{p.assignedEditors.length - 3}</span>}
                                            </div>
                                            {p.deadline && <span className="project-deadline">Due {formatDate(p.deadline)}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {tab === "members" && (
                    <>
                        <div className="section-header">
                            <h2 className="section-title">Members</h2>
                            {isAdmin && <Button variant="primary" size="sm" onClick={() => setShowInvite(true)}>+ Invite</Button>}
                        </div>
                        <div className="members-list">
                            {workspace.members?.map(m => (
                                <div key={m.user?._id || m.user} className="member-row glass-card">
                                    <div className="member-info">
                                        <Avatar name={m.user?.name} src={m.user?.avatar} size={40} />
                                        <div>
                                            <span className="member-name">{m.user?.name || "Unknown"}</span>
                                            <span className="member-email">{m.user?.email}</span>
                                        </div>
                                    </div>
                                    <span className={`role-badge role-${m.role}`}>{m.role}</span>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Create Project Modal */}
            <Modal isOpen={showCreateProject} onClose={() => setShowCreateProject(false)} title="Create Project">
                <form onSubmit={handleCreateProject} className="modal-form">
                    <Input label="Project Name" placeholder="e.g. Q3 Marketing Campaign" required
                        value={projectForm.name} onChange={e => setProjectForm({ ...projectForm, name: e.target.value })} />
                    <Textarea label="Description" placeholder="Describe the project..."
                        value={projectForm.description} onChange={e => setProjectForm({ ...projectForm, description: e.target.value })} />
                    <Input label="Deadline" type="date"
                        value={projectForm.deadline} onChange={e => setProjectForm({ ...projectForm, deadline: e.target.value })} />
                    <Button type="submit" variant="primary" size="lg" loading={creating} style={{ width: "100%", marginTop: 8 }}>Create Project</Button>
                </form>
            </Modal>

            {/* Invite Modal */}
            <Modal isOpen={showInvite} onClose={() => setShowInvite(false)} title="Invite Team Member">
                <form onSubmit={handleInvite} className="modal-form">
                    <Input label="Email Address" type="email" placeholder="editor@company.com" required
                        value={inviteForm.email} onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })} />
                    <Select label="Role" value={inviteForm.role}
                        onChange={e => setInviteForm({ ...inviteForm, role: e.target.value })}
                        options={[{ value: "editor", label: "Editor" }, { value: "admin", label: "Admin" }]} />
                    <Button type="submit" variant="primary" size="lg" loading={creating} style={{ width: "100%", marginTop: 8 }}>Send Invitation</Button>
                </form>
            </Modal>
        </div>
    )
}
