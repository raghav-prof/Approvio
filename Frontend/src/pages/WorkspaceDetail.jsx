import { useState, useEffect, useRef, useCallback } from "react"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import { useApp } from "../context/AppContext"
import { useAuth } from "../context/AuthContext"
import Topbar from "../components/layout/Topbar"
import { Button, Modal, Input, Textarea, Select, StatusBadge, Avatar, EmptyState, Loader, Skeleton } from "../components/ui/ui"
import { formatDate, formatRelative, getInitials } from "../utils/helpers"
import API from "../api/axios"
import "./WorkspaceDetail.css"

export default function WorkspaceDetail() {
    const { id } = useParams()
    const { user } = useAuth()
    const { setCurrentWorkspace, socket } = useApp()
    const navigate = useNavigate()
    const location = useLocation()

    const [workspace, setWorkspace] = useState(null)
    const [projects, setProjects] = useState([])
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState(() => location.pathname.endsWith("/members") ? "members" : "projects")

    useEffect(() => {
        if (location.pathname.endsWith("/members")) setTab("members")
        else if (tab === "members") setTab("projects") // Only revert if it was members and URL changed back
    }, [location.pathname])

    // Chat state
    const [selectedProject, setSelectedProject] = useState(null)
    const [messages, setMessages] = useState([])
    const [msgText, setMsgText] = useState("")
    const [sending, setSending] = useState(false)
    const [loadingMsgs, setLoadingMsgs] = useState(false)
    const [typingUsers, setTypingUsers] = useState([])
    const chatEndRef = useRef(null)
    const typingTimeout = useRef(null)
    const fileInputRef = useRef(null)
    const [chatFiles, setChatFiles] = useState([])

    // Thread state
    const [threadParent, setThreadParent] = useState(null)
    const [threadReplies, setThreadReplies] = useState([])
    const [threadText, setThreadText] = useState("")
    const [loadingThread, setLoadingThread] = useState(false)

    // Editor assignment state
    const [showAssignModal, setShowAssignModal] = useState(false)
    const [assignProject, setAssignProject] = useState(null)
    const [selectedEditors, setSelectedEditors] = useState([])

    // Editors directory state
    const [allEditors, setAllEditors] = useState([])
    const [editorSearch, setEditorSearch] = useState("")
    const [loadingEditors, setLoadingEditors] = useState(false)
    const [addingEditor, setAddingEditor] = useState(null)

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
        if (socket) socket.emit("join_project", selectedProject._id)
        return () => {
            if (socket) socket.emit("leave_project", selectedProject._id)
        }
    }, [selectedProject, socket])

    // Listen for real-time messages
    useEffect(() => {
        if (!socket || !selectedProject) return
        const handleNewMessage = (msg) => {
            if (msg.project === selectedProject._id || msg.project?._id === selectedProject._id) {
                if (!msg.parentMessage) {
                    setMessages(prev => {
                        if (prev.some(m => m._id === msg._id)) return prev
                        return [...prev, msg]
                    })
                    scrollToBottom()
                } else if (threadParent && msg.parentMessage === threadParent._id) {
                    setThreadReplies(prev => {
                        if (prev.some(m => m._id === msg._id)) return prev
                        return [...prev, msg]
                    })
                }
            }
        }
        const handleTyping = ({ projectId, user: u }) => {
            if (projectId === selectedProject._id && u?.id !== user?.id)
                setTypingUsers(prev => prev.find(x => x.id === u.id) ? prev : [...prev, u])
        }
        const handleStopTyping = ({ projectId, user: u }) => {
            if (projectId === selectedProject._id)
                setTypingUsers(prev => prev.filter(x => x.id !== u.id))
        }
        socket.on("chat_message", handleNewMessage)
        socket.on("user_typing", handleTyping)
        socket.on("user_stop_typing", handleStopTyping)
        return () => {
            socket.off("chat_message", handleNewMessage)
            socket.off("user_typing", handleTyping)
            socket.off("user_stop_typing", handleStopTyping)
        }
    }, [socket, selectedProject, user, threadParent])

    async function fetchMessages(projectId) {
        setLoadingMsgs(true)
        try {
            const { data } = await API.get(`/messages?project=${projectId}&limit=100`)
            setMessages(data.data.messages)
            setTimeout(scrollToBottom, 100)
            API.put(`/messages/read?project=${projectId}`).catch(() => {})
        } catch {} finally { setLoadingMsgs(false) }
    }

    function scrollToBottom() {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    async function handleSendMessage(e) {
        e.preventDefault()
        if (!msgText.trim() && chatFiles.length === 0) return
        if (!selectedProject) return
        setSending(true)
        try {
            if (chatFiles.length > 0) {
                const formData = new FormData()
                formData.append("project", selectedProject._id)
                if (msgText.trim()) formData.append("text", msgText)
                chatFiles.forEach(f => formData.append("files", f))
                await API.post("/messages", formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                })
            } else {
                await API.post("/messages", { project: selectedProject._id, text: msgText })
            }
            setMsgText("")
            setChatFiles([])
            if (fileInputRef.current) fileInputRef.current.value = ""
            if (socket) socket.emit("stop_typing", { projectId: selectedProject._id, user: { id: user.id, name: user.name } })
        } catch {} finally { setSending(false) }
    }

    function handleFileSelect(e) {
        const files = Array.from(e.target.files).slice(0, 5)
        setChatFiles(prev => [...prev, ...files].slice(0, 5))
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    function removeFile(index) {
        setChatFiles(prev => prev.filter((_, i) => i !== index))
    }

    function handleTyping() {
        if (!socket || !selectedProject) return
        socket.emit("typing", { projectId: selectedProject._id, user: { id: user.id, name: user.name } })
        clearTimeout(typingTimeout.current)
        typingTimeout.current = setTimeout(() => {
            socket.emit("stop_typing", { projectId: selectedProject._id, user: { id: user.id, name: user.name } })
        }, 2000)
    }

    // Thread
    async function openThread(msg) {
        setThreadParent(msg)
        setLoadingThread(true)
        try {
            const { data } = await API.get(`/messages/${msg._id}/thread`)
            setThreadReplies(data.data)
        } catch {} finally { setLoadingThread(false) }
    }

    function closeThread() {
        setThreadParent(null)
        setThreadReplies([])
        setThreadText("")
    }

    async function handleSendThreadReply(e) {
        e.preventDefault()
        if (!threadText.trim() || !threadParent) return
        setSending(true)
        try {
            await API.post("/messages", {
                project: selectedProject._id,
                text: threadText,
                parentMessage: threadParent._id,
            })
            setThreadText("")
            // Re-fetch thread
            const { data } = await API.get(`/messages/${threadParent._id}/thread`)
            setThreadReplies(data.data)
            // Update parent thread count in messages list
            setMessages(prev => prev.map(m =>
                m._id === threadParent._id ? { ...m, threadCount: (m.threadCount || 0) + 1 } : m
            ))
        } catch {} finally { setSending(false) }
    }

    // Editor assignment
    function openAssignModal(project) {
        setAssignProject(project)
        setSelectedEditors(project.assignedEditors?.map(e => e._id || e) || [])
        setShowAssignModal(true)
    }

    async function handleAssignEditors(e) {
        e.preventDefault()
        if (!assignProject) return
        setCreating(true)
        try {
            await API.put(`/projects/${assignProject._id}/assign`, { editors: selectedEditors })
            setShowAssignModal(false)
            fetchData()
        } catch (err) {
            alert(err.response?.data?.message || "Failed to assign")
        } finally { setCreating(false) }
    }

    function toggleEditor(editorId) {
        setSelectedEditors(prev =>
            prev.includes(editorId)
                ? prev.filter(id => id !== editorId)
                : [...prev, editorId]
        )
    }

    // Project CRUD
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

    // Editors directory
    const searchTimer = useRef(null)
    useEffect(() => {
        if (tab === "editors") {
            clearTimeout(searchTimer.current)
            searchTimer.current = setTimeout(() => fetchEditors(), 300)
        }
        return () => clearTimeout(searchTimer.current)
    }, [tab, editorSearch])

    async function fetchEditors() {
        setLoadingEditors(true)
        try {
            const params = editorSearch ? `?search=${encodeURIComponent(editorSearch)}` : ""
            const { data } = await API.get(`/auth/editors${params}`)
            setAllEditors(data.data)
        } catch {} finally { setLoadingEditors(false) }
    }

    async function handleAddToWorkspace(editorId) {
        setAddingEditor(editorId)
        try {
            await API.post(`/workspaces/${id}/add-member`, { userId: editorId })
            fetchData()
        } catch (err) {
            alert(err.response?.data?.message || "Failed to add")
        } finally { setAddingEditor(null) }
    }

    const myRole = workspace?.members?.find(m => (m.user?._id || m.user) === user?.id)?.role
    const isAdmin = myRole === "owner" || myRole === "admin"
    const workspaceEditors = workspace?.members?.filter(m => m.role === "editor") || []

    if (loading) return <div className="page"><Loader /></div>
    if (!workspace) return <div className="page"><EmptyState title="Workspace not found" /></div>

    return (
        <div className="page ws-page">
            <Topbar title={workspace.name} subtitle={`${workspace.members?.length} members · ${projects.length} projects`} />

            <div className="ws-layout">
                {/* LEFT — Projects / Members */}
                <div className="ws-left-panel">
                    <div className="ws-panel-tabs">
                        <button className={`ws-tab ${tab === "projects" ? "active" : ""}`} onClick={() => setTab("projects")}>Projects</button>
                        <button className={`ws-tab ${tab === "members" ? "active" : ""}`} onClick={() => setTab("members")}>Members</button>
                        {isAdmin && <button className={`ws-tab ${tab === "editors" ? "active" : ""}`} onClick={() => setTab("editors")}>Find Editors</button>}
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
                            ) : projects.map(p => (
                                <div key={p._id}
                                    className={`ws-project-item ${selectedProject?._id === p._id ? "active" : ""}`}
                                    onClick={() => { setSelectedProject(p); closeThread() }}>
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
                                        <div className="ws-proj-actions-row">
                                            {isAdmin && (
                                                <button className="ws-assign-btn" onClick={ev => { ev.stopPropagation(); openAssignModal(p) }} title="Assign editors">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                                                </button>
                                            )}
                                            {p.deadline && <span className="ws-proj-deadline">{formatDate(p.deadline)}</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
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

                    {tab === "editors" && (
                        <div className="ws-editors-dir">
                            <div className="editors-search">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                                <input type="text" className="editors-search-input" placeholder="Search editors by name or email..."
                                    value={editorSearch} onChange={e => setEditorSearch(e.target.value)} />
                            </div>
                            {loadingEditors ? (
                                <div className="ws-editors-dir" style={{ padding: "16px" }}>
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} className="editor-dir-item" style={{ border: "none", pointerEvents: "none" }}>
                                            <div className="ws-member-left">
                                                <Skeleton width={32} height={32} circle />
                                                <div className="ws-member-info" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                                    <Skeleton width={120} height={14} />
                                                    <Skeleton width={160} height={12} />
                                                </div>
                                            </div>
                                            <Skeleton width={60} height={24} />
                                        </div>
                                    ))}
                                </div>
                            ) : allEditors.length === 0 ? (
                                <div className="ws-empty">No editors found</div>
                            ) : (
                                allEditors.map(editor => {
                                    const isMember = workspace?.members?.some(m => (m.user?._id || m.user) === editor._id)
                                    return (
                                        <div key={editor._id} className="editor-dir-item">
                                            <div className="ws-member-left">
                                                <Avatar name={editor.name} src={editor.avatar} size={32} />
                                                <div className="ws-member-info">
                                                    <span className="ws-member-name">{editor.name}</span>
                                                    <span className="ws-member-email">{editor.email}</span>
                                                </div>
                                            </div>
                                            {isMember ? (
                                                <span className="editor-dir-added">Added</span>
                                            ) : (
                                                <button className="editor-dir-add-btn"
                                                    disabled={addingEditor === editor._id}
                                                    onClick={() => handleAddToWorkspace(editor._id)}>
                                                    {addingEditor === editor._id ? "Adding..." : "+ Add"}
                                                </button>
                                            )}
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    )}
                </div>

                {/* RIGHT — Chat */}
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
                            <div className="chat-header">
                                <div className="chat-header-info">
                                    <h3 className="chat-proj-name">{selectedProject.name}</h3>
                                    <span className="chat-proj-meta">
                                        {(selectedProject.assignedEditors?.length || 0)} editors
                                        {selectedProject.deadline && ` · Due ${formatDate(selectedProject.deadline)}`}
                                    </span>
                                </div>
                                <div className="chat-header-actions">
                                    <Button variant="ghost" size="sm" onClick={() => navigate(`/project/${selectedProject._id}`)}>View details</Button>
                                    <button className="chat-close-btn" onClick={() => { setSelectedProject(null); closeThread() }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                    </button>
                                </div>
                            </div>

                            <div className="chat-main-area">
                                {/* Messages Area */}
                                <div className={`chat-messages-col ${threadParent ? "with-thread" : ""}`}>
                                    <div className="chat-messages">
                                        {loadingMsgs ? (
                                            <div className="chat-messages" style={{ padding: "20px" }}>
                                                {[1, 2, 3].map(i => (
                                                    <div key={i} className={`chat-msg ${i % 2 === 0 ? "chat-msg-me" : "chat-msg-other"}`}>
                                                        {i % 2 !== 0 && <Skeleton width={28} height={28} circle />}
                                                        <div className="chat-bubble" style={{ background: "transparent", border: "none", boxShadow: "none", padding: 0 }}>
                                                            {i % 2 !== 0 && <Skeleton width={80} height={12} style={{ marginBottom: "6px" }} />}
                                                            <Skeleton width={180 + (i * 20)} height={36} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
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
                                                    const hasMedia = msg.attachments?.some(a => a.type === "image" || a.type === "video")
                                                    return (
                                                        <div key={msg._id} className={`chat-msg ${isMe ? "chat-msg-me" : "chat-msg-other"} ${!showAvatar ? "chat-msg-grouped" : ""}`}>
                                                            {!isMe && showAvatar && <Avatar name={msg.sender?.name} src={msg.sender?.avatar} size={28} />}
                                                            {!isMe && !showAvatar && <div className="chat-msg-spacer" />}
                                                            <div className="chat-bubble">
                                                                {!isMe && showAvatar && <span className="chat-sender">{msg.sender?.name}</span>}
                                                                {msg.text && <p className="chat-text">{msg.text}</p>}
                                                                {msg.attachments?.map((att, j) => (
                                                                    <div key={j} className="chat-attachment">
                                                                        {att.type === "image" ? (
                                                                            <img src={att.url} alt={att.originalName} className="chat-att-img" />
                                                                        ) : att.type === "video" ? (
                                                                            <video src={att.url} controls className="chat-att-video" />
                                                                        ) : (
                                                                            <a href={att.url} target="_blank" rel="noopener noreferrer" className="chat-att-doc">📄 {att.originalName}</a>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                                <div className="chat-bubble-footer">
                                                                    <span className="chat-time">{formatRelative(msg.createdAt)}</span>
                                                                    {hasMedia && (
                                                                        <button className="chat-thread-btn" onClick={() => openThread(msg)}>
                                                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                                                                            {msg.threadCount > 0 ? `${msg.threadCount} replies` : "Thread"}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                                <div ref={chatEndRef} />
                                            </>
                                        )}
                                        {typingUsers.length > 0 && (
                                            <div className="chat-typing">
                                                <div className="typing-dots"><span/><span/><span/></div>
                                                <span>{typingUsers.map(u => u.name?.split(" ")[0]).join(", ")} typing...</span>
                                            </div>
                                        )}
                                    </div>
                                    {chatFiles.length > 0 && (
                                        <div className="chat-file-preview">
                                            {chatFiles.map((f, i) => (
                                                <div key={i} className="chat-file-thumb">
                                                    {f.type.startsWith("image/") ? (
                                                        <img src={URL.createObjectURL(f)} alt={f.name} />
                                                    ) : (
                                                        <span className="chat-file-name">{f.name}</span>
                                                    )}
                                                    <button className="chat-file-remove" onClick={() => removeFile(i)}>×</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <form className="chat-input-bar" onSubmit={handleSendMessage}>
                                        <input type="file" ref={fileInputRef} onChange={handleFileSelect}
                                            multiple accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx" className="chat-file-input" />
                                        <button type="button" className="chat-attach-btn" onClick={() => fileInputRef.current?.click()} title="Attach files">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                                            </svg>
                                        </button>
                                        <input type="text" className="chat-input" placeholder="Type a message..."
                                            value={msgText} onChange={e => { setMsgText(e.target.value); handleTyping() }} disabled={sending} />
                                        <button type="submit" className="chat-send-btn" disabled={(!msgText.trim() && chatFiles.length === 0) || sending}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                                            </svg>
                                        </button>
                                    </form>
                                </div>

                                {/* Thread Panel */}
                                {threadParent && (
                                    <div className="thread-panel">
                                        <div className="thread-header">
                                            <h4>Thread</h4>
                                            <button className="chat-close-btn" onClick={closeThread}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                            </button>
                                        </div>
                                        {/* Original message */}
                                        <div className="thread-original">
                                            <div className="thread-msg-header">
                                                <Avatar name={threadParent.sender?.name} src={threadParent.sender?.avatar} size={24} />
                                                <span className="thread-author">{threadParent.sender?.name}</span>
                                                <span className="thread-time">{formatRelative(threadParent.createdAt)}</span>
                                            </div>
                                            {threadParent.text && <p className="thread-text">{threadParent.text}</p>}
                                            {threadParent.attachments?.map((att, j) => (
                                                <div key={j} className="chat-attachment">
                                                    {att.type === "image" ? (
                                                        <img src={att.url} alt={att.originalName} className="chat-att-img" />
                                                    ) : att.type === "video" ? (
                                                        <video src={att.url} controls className="chat-att-video" />
                                                    ) : (
                                                        <a href={att.url} target="_blank" rel="noopener noreferrer" className="chat-att-doc">📄 {att.originalName}</a>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        {/* Replies */}
                                        <div className="thread-replies">
                                            {loadingThread ? (
                                                <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
                                                    {[1, 2].map(i => (
                                                        <div key={i} className="thread-reply" style={{ border: "none", padding: 0 }}>
                                                            <Skeleton width={22} height={22} circle />
                                                            <div className="thread-reply-body" style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                                                                <Skeleton width={80} height={12} />
                                                                <Skeleton width="100%" height={14} />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : threadReplies.map(r => (
                                                <div key={r._id} className="thread-reply">
                                                    <Avatar name={r.sender?.name} src={r.sender?.avatar} size={22} />
                                                    <div className="thread-reply-body">
                                                        <div className="thread-reply-header">
                                                            <span className="thread-reply-name">{r.sender?.name}</span>
                                                            <span className="thread-time">{formatRelative(r.createdAt)}</span>
                                                        </div>
                                                        <p className="thread-reply-text">{r.text}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <form className="thread-input-bar" onSubmit={handleSendThreadReply}>
                                            <input type="text" className="chat-input" placeholder="Reply..."
                                                value={threadText} onChange={e => setThreadText(e.target.value)} disabled={sending} />
                                            <button type="submit" className="chat-send-btn" disabled={!threadText.trim() || sending}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                                                </svg>
                                            </button>
                                        </form>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
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
                    <Button type="submit" variant="primary" size="lg" loading={creating} style={{ width: "100%", marginTop: 4 }}>Create Project</Button>
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
                    <Button type="submit" variant="primary" size="lg" loading={creating} style={{ width: "100%", marginTop: 4 }}>Send Invitation</Button>
                </form>
            </Modal>

            {/* Assign Editors Modal */}
            <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title={`Assign editors to ${assignProject?.name || ""}`}>
                <form onSubmit={handleAssignEditors} className="modal-form">
                    <p className="assign-hint">Select editors from your workspace to assign to this project.</p>
                    <div className="editor-select-list">
                        {workspaceEditors.length === 0 ? (
                            <p className="assign-empty">No editors in this workspace yet. Invite one first.</p>
                        ) : workspaceEditors.map(m => {
                            const editorId = m.user?._id || m.user
                            const isSelected = selectedEditors.includes(editorId)
                            return (
                                <label key={editorId} className={`editor-select-item ${isSelected ? "selected" : ""}`}>
                                    <input type="checkbox" checked={isSelected} onChange={() => toggleEditor(editorId)} className="editor-checkbox" />
                                    <Avatar name={m.user?.name} src={m.user?.avatar} size={32} />
                                    <div className="editor-select-info">
                                        <span className="editor-select-name">{m.user?.name || "Unknown"}</span>
                                        <span className="editor-select-email">{m.user?.email}</span>
                                    </div>
                                </label>
                            )
                        })}
                    </div>
                    <Button type="submit" variant="primary" size="lg" loading={creating} style={{ width: "100%", marginTop: 4 }}>
                        Assign {selectedEditors.length} editor{selectedEditors.length !== 1 ? "s" : ""}
                    </Button>
                </form>
            </Modal>
        </div>
    )
}
