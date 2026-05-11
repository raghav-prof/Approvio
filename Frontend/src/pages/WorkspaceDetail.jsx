import { useState, useEffect, useRef, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useApp } from "../context/AppContext"
import { useAuth } from "../context/AuthContext"
import Topbar from "../components/layout/Topbar"
import { Button, Modal, Input, Textarea, Select, StatusBadge, Avatar, EmptyState, Loader } from "../components/ui/ui"
import { formatDate, formatRelative, getInitials } from "../utils/helpers"
import API from "../api/axios"
import "./WorkspaceDetail.css"

export default function WorkspaceDetail() {
    const { id } = useParams()
    const { user } = useAuth()
    const { setCurrentWorkspace, socket } = useApp()
    const navigate = useNavigate()

    const [workspace, setWorkspace] = useState(null)
    const [projects, setProjects] = useState([])
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState("projects")

    // Chat state
    const [selectedProject, setSelectedProject] = useState(null)
    const [messages, setMessages] = useState([])
    const [msgText, setMsgText] = useState("")
    const [sending, setSending] = useState(false)
    const [loadingMsgs, setLoadingMsgs] = useState(false)
    const [typingUsers, setTypingUsers] = useState([])
    const chatEndRef = useRef(null)
    const typingTimeout = useRef(null)

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

    // Chat — fetch messages when project selected
    useEffect(() => {
        if (!selectedProject) return
        fetchMessages(selectedProject._id)
        // Join project room for real-time
        if (socket) {
            socket.emit("join_project", selectedProject._id)
        }
        return () => {
            if (socket) socket.emit("leave_project", selectedProject._id)
        }
    }, [selectedProject, socket])

    // Listen for real-time messages
    useEffect(() => {
        if (!socket || !selectedProject) return

        const handleNewMessage = (msg) => {
            if (msg.project === selectedProject._id || msg.project?._id === selectedProject._id) {
                setMessages(prev => {
                    if (prev.some(m => m._id === msg._id)) return prev
                    return [...prev, msg]
                })
                scrollToBottom()
            }
        }

        const handleTyping = ({ projectId, user: typingUser }) => {
            if (projectId === selectedProject._id && typingUser?.id !== user?.id) {
                setTypingUsers(prev => {
                    if (prev.find(u => u.id === typingUser.id)) return prev
                    return [...prev, typingUser]
                })
            }
        }

        const handleStopTyping = ({ projectId, user: typingUser }) => {
            if (projectId === selectedProject._id) {
                setTypingUsers(prev => prev.filter(u => u.id !== typingUser.id))
            }
        }

        socket.on("chat_message", handleNewMessage)
        socket.on("user_typing", handleTyping)
        socket.on("user_stop_typing", handleStopTyping)

        return () => {
            socket.off("chat_message", handleNewMessage)
            socket.off("user_typing", handleTyping)
            socket.off("user_stop_typing", handleStopTyping)
        }
    }, [socket, selectedProject, user])

    async function fetchMessages(projectId) {
        setLoadingMsgs(true)
        try {
            const { data } = await API.get(`/messages?project=${projectId}&limit=100`)
            setMessages(data.data.messages)
            setTimeout(scrollToBottom, 100)
            // Mark as read
            API.put(`/messages/read?project=${projectId}`).catch(() => {})
        } catch {} finally { setLoadingMsgs(false) }
    }

    function scrollToBottom() {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    async function handleSendMessage(e) {
        e.preventDefault()
        if (!msgText.trim() || !selectedProject) return
        setSending(true)
        try {
            await API.post("/messages", { project: selectedProject._id, text: msgText })
            setMsgText("")
            // Stop typing indicator
            if (socket) {
                socket.emit("stop_typing", { projectId: selectedProject._id, user: { id: user.id, name: user.name } })
            }
        } catch {} finally { setSending(false) }
    }

    function handleTyping() {
        if (!socket || !selectedProject) return
        socket.emit("typing", { projectId: selectedProject._id, user: { id: user.id, name: user.name } })
        clearTimeout(typingTimeout.current)
        typingTimeout.current = setTimeout(() => {
            socket.emit("stop_typing", { projectId: selectedProject._id, user: { id: user.id, name: user.name } })
        }, 2000)
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
        <div className="page ws-page">
            <Topbar title={workspace.name} subtitle={`${workspace.members?.length} members · ${projects.length} projects`} />

            <div className="ws-layout">
                {/* LEFT PANEL — Projects/Members */}
                <div className="ws-left-panel">
                    <div className="ws-panel-tabs">
                        <button className={`ws-tab ${tab === "projects" ? "active" : ""}`} onClick={() => setTab("projects")}>
                            Projects
                        </button>
                        <button className={`ws-tab ${tab === "members" ? "active" : ""}`} onClick={() => setTab("members")}>
                            Members
                        </button>
                    </div>

                    {tab === "projects" && (
                        <div className="ws-project-list">
                            {isAdmin && (
                                <button className="ws-add-btn" onClick={() => setShowCreateProject(true)}>
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="8" y1="3" x2="8" y2="13"/><line x1="3" y1="8" x2="13" y2="8"/></svg>
                                    New project
                                </button>
                            )}
                            {projects.length === 0 ? (
                                <div className="ws-empty">No projects yet</div>
                            ) : (
                                projects.map(p => (
                                    <div key={p._id}
                                        className={`ws-project-item ${selectedProject?._id === p._id ? "active" : ""}`}
                                        onClick={() => setSelectedProject(p)}>
                                        <div className="ws-proj-top">
                                            <span className="ws-proj-name">{p.name}</span>
                                            <StatusBadge status={p.status} />
                                        </div>
                                        <div className="ws-proj-meta">
                                            <div className="ws-proj-editors">
                                                {(p.assignedEditors || []).slice(0, 3).map(e => (
                                                    <Avatar key={e._id} name={e.name} src={e.avatar} size={20} />
                                                ))}
                                                {(p.assignedEditors?.length || 0) > 3 && (
                                                    <span className="more-count">+{p.assignedEditors.length - 3}</span>
                                                )}
                                            </div>
                                            {p.deadline && <span className="ws-proj-deadline">{formatDate(p.deadline)}</span>}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {tab === "members" && (
                        <div className="ws-members-list">
                            {isAdmin && (
                                <button className="ws-add-btn" onClick={() => setShowInvite(true)}>
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="8" y1="3" x2="8" y2="13"/><line x1="3" y1="8" x2="13" y2="8"/></svg>
                                    Invite member
                                </button>
                            )}
                            {workspace.members?.map(m => (
                                <div key={m.user?._id || m.user} className="ws-member-item">
                                    <div className="ws-member-left">
                                        <Avatar name={m.user?.name} src={m.user?.avatar} size={32} />
                                        <div className="ws-member-info">
                                            <span className="ws-member-name">{m.user?.name || "Unknown"}</span>
                                            <span className="ws-member-email">{m.user?.email}</span>
                                        </div>
                                    </div>
                                    <span className={`role-badge role-${m.role}`}>{m.role}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* RIGHT PANEL — Chat or Empty */}
                <div className="ws-right-panel">
                    {!selectedProject ? (
                        <div className="chat-empty">
                            <div className="chat-empty-icon">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                                </svg>
                            </div>
                            <h3>Select a project</h3>
                            <p>Click on a project to open the conversation and collaborate with your team.</p>
                        </div>
                    ) : (
                        <div className="chat-panel">
                            {/* Chat Header */}
                            <div className="chat-header">
                                <div className="chat-header-info">
                                    <h3 className="chat-proj-name">{selectedProject.name}</h3>
                                    <span className="chat-proj-meta">
                                        {(selectedProject.assignedEditors?.length || 0)} editors
                                        {selectedProject.deadline && ` · Due ${formatDate(selectedProject.deadline)}`}
                                    </span>
                                </div>
                                <div className="chat-header-actions">
                                    <Button variant="ghost" size="sm" onClick={() => navigate(`/project/${selectedProject._id}`)}>
                                        View details
                                    </Button>
                                    <button className="chat-close-btn" onClick={() => setSelectedProject(null)}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                    </button>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="chat-messages">
                                {loadingMsgs ? (
                                    <div className="chat-loading"><Loader /></div>
                                ) : messages.length === 0 ? (
                                    <div className="chat-start">
                                        <div className="chat-start-icon">💬</div>
                                        <h4>Start the conversation</h4>
                                        <p>Send a message to begin collaborating on this project.</p>
                                    </div>
                                ) : (
                                    <>
                                        {messages.map((msg, i) => {
                                            const isMe = msg.sender?._id === user?.id || msg.sender === user?.id
                                            const showAvatar = i === 0 || messages[i - 1]?.sender?._id !== msg.sender?._id
                                            return (
                                                <div key={msg._id} className={`chat-msg ${isMe ? "chat-msg-me" : "chat-msg-other"} ${!showAvatar ? "chat-msg-grouped" : ""}`}>
                                                    {!isMe && showAvatar && (
                                                        <Avatar name={msg.sender?.name} src={msg.sender?.avatar} size={28} />
                                                    )}
                                                    {!isMe && !showAvatar && <div className="chat-msg-spacer" />}
                                                    <div className="chat-bubble">
                                                        {!isMe && showAvatar && (
                                                            <span className="chat-sender">{msg.sender?.name}</span>
                                                        )}
                                                        {msg.text && <p className="chat-text">{msg.text}</p>}
                                                        {msg.attachments?.map((att, j) => (
                                                            <div key={j} className="chat-attachment">
                                                                {att.type === "image" ? (
                                                                    <img src={att.url} alt={att.originalName} className="chat-att-img" />
                                                                ) : att.type === "video" ? (
                                                                    <video src={att.url} controls className="chat-att-video" />
                                                                ) : (
                                                                    <a href={att.url} target="_blank" rel="noopener noreferrer" className="chat-att-doc">
                                                                        📄 {att.originalName}
                                                                    </a>
                                                                )}
                                                            </div>
                                                        ))}
                                                        <span className="chat-time">{formatRelative(msg.createdAt)}</span>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                        <div ref={chatEndRef} />
                                    </>
                                )}

                                {/* Typing indicator */}
                                {typingUsers.length > 0 && (
                                    <div className="chat-typing">
                                        <div className="typing-dots"><span/><span/><span/></div>
                                        <span>{typingUsers.map(u => u.name?.split(" ")[0]).join(", ")} typing...</span>
                                    </div>
                                )}
                            </div>

                            {/* Message Input */}
                            <form className="chat-input-bar" onSubmit={handleSendMessage}>
                                <input
                                    type="text"
                                    className="chat-input"
                                    placeholder="Type a message..."
                                    value={msgText}
                                    onChange={e => { setMsgText(e.target.value); handleTyping() }}
                                    disabled={sending}
                                />
                                <button type="submit" className="chat-send-btn" disabled={!msgText.trim() || sending}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="22" y1="2" x2="11" y2="13"/>
                                        <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                                    </svg>
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <Modal isOpen={showCreateProject} onClose={() => setShowCreateProject(false)} title="Create Project">
                <form onSubmit={handleCreateProject} className="modal-form">
                    <Input label="Project Name" placeholder="e.g. Q3 Marketing Campaign" required
                        value={projectForm.name} onChange={e => setProjectForm({ ...projectForm, name: e.target.value })} />
                    <Textarea label="Description" placeholder="Describe the project..."
                        value={projectForm.description} onChange={e => setProjectForm({ ...projectForm, description: e.target.value })} />
                    <Input label="Deadline" type="date"
                        value={projectForm.deadline} onChange={e => setProjectForm({ ...projectForm, deadline: e.target.value })} />
                    <Button type="submit" variant="primary" size="lg" loading={creating} style={{ width: "100%", marginTop: 4 }}>Create Project</Button>
                </form>
            </Modal>

            <Modal isOpen={showInvite} onClose={() => setShowInvite(false)} title="Invite Team Member">
                <form onSubmit={handleInvite} className="modal-form">
                    <Input label="Email Address" type="email" placeholder="editor@company.com" required
                        value={inviteForm.email} onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })} />
                    <Select label="Role" value={inviteForm.role}
                        onChange={e => setInviteForm({ ...inviteForm, role: e.target.value })}
                        options={[{ value: "editor", label: "Editor" }, { value: "admin", label: "Admin" }]} />
                    <Button type="submit" variant="primary" size="lg" loading={creating} style={{ width: "100%", marginTop: 4 }}>Send Invitation</Button>
                </form>
            </Modal>
        </div>
    )
}
