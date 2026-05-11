import { useState, useEffect, useRef } from "react"
import { useParams } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import Topbar from "../components/layout/Topbar"
import { Button, Modal, Input, Textarea, StatusBadge, Avatar, EmptyState, Loader } from "../components/ui/ui"
import { formatRelative, formatFileSize } from "../utils/helpers"
import API from "../api/axios"
import "./ProjectDetail.css"

export default function ProjectDetail() {
    const { id } = useParams()
    const { user } = useAuth()
    const fileInputRef = useRef(null)

    const [project, setProject] = useState(null)
    const [submissions, setSubmissions] = useState([])
    const [selected, setSelected] = useState(null)
    const [comments, setComments] = useState([])
    const [reviews, setReviews] = useState([])
    const [loading, setLoading] = useState(true)

    // Modals
    const [showSubmit, setShowSubmit] = useState(false)
    const [showReview, setShowReview] = useState(false)
    const [submitForm, setSubmitForm] = useState({ title: "", description: "" })
    const [submitFiles, setSubmitFiles] = useState([])
    const [reviewForm, setReviewForm] = useState({ action: "approved", notes: "" })
    const [commentText, setCommentText] = useState("")
    const [creating, setCreating] = useState(false)

    useEffect(() => { fetchProject() }, [id])

    async function fetchProject() {
        setLoading(true)
        try {
            const { data: pData } = await API.get(`/projects/${id}`)
            setProject(pData.data)
            const { data: sData } = await API.get(`/submissions?project=${id}`)
            setSubmissions(sData.data)
            if (sData.data.length > 0) selectSubmission(sData.data[0])
        } catch {} finally { setLoading(false) }
    }

    async function selectSubmission(sub) {
        setSelected(sub)
        try {
            const { data: cData } = await API.get(`/comments?submission=${sub._id}`)
            setComments(cData.data)
            const { data: rData } = await API.get(`/reviews?submission=${sub._id}`)
            setReviews(rData.data)
        } catch {}
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setCreating(true)
        try {
            const formData = new FormData()
            formData.append("project", id)
            formData.append("title", submitForm.title)
            formData.append("description", submitForm.description)
            submitFiles.forEach(f => formData.append("files", f))

            await API.post("/submissions", formData, { headers: { "Content-Type": "multipart/form-data" } })
            setShowSubmit(false)
            setSubmitForm({ title: "", description: "" })
            setSubmitFiles([])
            fetchProject()
        } catch {} finally { setCreating(false) }
    }

    async function handleReview(e) {
        e.preventDefault()
        setCreating(true)
        try {
            await API.post("/reviews", { submission: selected._id, ...reviewForm })
            setShowReview(false)
            setReviewForm({ action: "approved", notes: "" })
            fetchProject()
        } catch {} finally { setCreating(false) }
    }

    async function handleComment(e) {
        e.preventDefault()
        if (!commentText.trim()) return
        try {
            await API.post("/comments", { submission: selected._id, text: commentText })
            setCommentText("")
            const { data: cData } = await API.get(`/comments?submission=${selected._id}`)
            setComments(cData.data)
        } catch {}
    }

    if (loading) return <div className="page"><Loader /></div>
    if (!project) return <div className="page"><EmptyState title="Project not found" /></div>

    return (
        <div className="page">
            <Topbar title={project.name} subtitle={project.description?.slice(0, 80)} />
            <div className="project-layout">
                {/* Left: Submissions List */}
                <div className="submissions-panel">
                    <div className="panel-header">
                        <h3>Submissions</h3>
                        <Button variant="primary" size="sm" onClick={() => setShowSubmit(true)}>+ Submit</Button>
                    </div>
                    {submissions.length === 0 ? (
                        <EmptyState title="No submissions" description="Submit your first piece of work" />
                    ) : (
                        <div className="sub-list">
                            {submissions.map(s => (
                                <div key={s._id} className={`sub-item ${selected?._id === s._id ? "active" : ""}`}
                                    onClick={() => selectSubmission(s)}>
                                    <div className="sub-item-top">
                                        <span className="sub-item-title">{s.title}</span>
                                        <StatusBadge status={s.status} />
                                    </div>
                                    <div className="sub-item-meta">
                                        <Avatar name={s.submittedBy?.name} src={s.submittedBy?.avatar} size={20} />
                                        <span>{s.submittedBy?.name}</span>
                                        <span>·</span>
                                        <span>{formatRelative(s.createdAt)}</span>
                                    </div>
                                    {s.files?.length > 0 && (
                                        <div className="sub-file-count">📎 {s.files.length} file{s.files.length > 1 ? "s" : ""}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Detail View */}
                <div className="detail-panel">
                    {selected ? (
                        <>
                            <div className="detail-header">
                                <div>
                                    <h2 className="detail-title">{selected.title}</h2>
                                    <div className="detail-meta">
                                        <Avatar name={selected.submittedBy?.name} src={selected.submittedBy?.avatar} size={24} />
                                        <span>{selected.submittedBy?.name}</span>
                                        <StatusBadge status={selected.status} />
                                        <span className="detail-time">{formatRelative(selected.createdAt)}</span>
                                    </div>
                                </div>
                                <div className="detail-actions">
                                    {user?.role === "client" && selected.status !== "approved" && (
                                        <Button variant="primary" size="sm" onClick={() => setShowReview(true)}>Review</Button>
                                    )}
                                </div>
                            </div>

                            {selected.description && <p className="detail-desc">{selected.description}</p>}

                            {/* File previews */}
                            {selected.files?.length > 0 && (
                                <div className="files-grid">
                                    {selected.files.map((f, i) => (
                                        <div key={i} className="file-preview">
                                            {f.type === "image" ? (
                                                <img src={f.url} alt={f.originalName} className="file-img" />
                                            ) : f.type === "video" ? (
                                                <video src={f.url} controls className="file-video" />
                                            ) : (
                                                <div className="file-doc">
                                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                                </div>
                                            )}
                                            <div className="file-info">
                                                <span className="file-name">{f.originalName}</span>
                                                <span className="file-size">{formatFileSize(f.size)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Reviews timeline */}
                            {reviews.length > 0 && (
                                <div className="reviews-section">
                                    <h3 className="sub-section-title">Review History</h3>
                                    {reviews.map(r => (
                                        <div key={r._id} className="review-item">
                                            <div className={`review-dot review-${r.action}`} />
                                            <div className="review-content">
                                                <span className="review-action">{r.reviewedBy?.name} — <strong>{r.action.replace("_", " ")}</strong></span>
                                                {r.notes && <p className="review-notes">{r.notes}</p>}
                                                <span className="review-time">{formatRelative(r.createdAt)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Comments */}
                            <div className="comments-section">
                                <h3 className="sub-section-title">Comments ({comments.length})</h3>
                                <div className="comments-list">
                                    {comments.map(c => (
                                        <div key={c._id} className="comment-item">
                                            <Avatar name={c.author?.name} src={c.author?.avatar} size={32} />
                                            <div className="comment-body">
                                                <div className="comment-header-row">
                                                    <span className="comment-author">{c.author?.name}</span>
                                                    <span className="comment-time">{formatRelative(c.createdAt)}</span>
                                                </div>
                                                <p className="comment-text">{c.text}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <form className="comment-form" onSubmit={handleComment}>
                                    <input className="comment-input" placeholder="Add a comment..." value={commentText}
                                        onChange={e => setCommentText(e.target.value)} />
                                    <Button type="submit" variant="primary" size="sm">Send</Button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <EmptyState title="Select a submission" description="Choose a submission from the left panel to view details" />
                    )}
                </div>
            </div>

            {/* Submit Modal */}
            <Modal isOpen={showSubmit} onClose={() => setShowSubmit(false)} title="New Submission" size="md">
                <form onSubmit={handleSubmit} className="modal-form">
                    <Input label="Title" placeholder="e.g. Homepage Banner v2" required
                        value={submitForm.title} onChange={e => setSubmitForm({ ...submitForm, title: e.target.value })} />
                    <Textarea label="Description" placeholder="Describe your submission..."
                        value={submitForm.description} onChange={e => setSubmitForm({ ...submitForm, description: e.target.value })} />
                    <div className="input-group">
                        <label className="input-label">Files</label>
                        <div className="file-drop-zone" onClick={() => fileInputRef.current?.click()}>
                            <input ref={fileInputRef} type="file" multiple hidden
                                onChange={e => setSubmitFiles(Array.from(e.target.files))} />
                            <span>{submitFiles.length > 0 ? `${submitFiles.length} file(s) selected` : "Click to upload files"}</span>
                        </div>
                    </div>
                    <Button type="submit" variant="primary" size="lg" loading={creating} style={{ width: "100%", marginTop: 8 }}>
                        Submit Work
                    </Button>
                </form>
            </Modal>

            {/* Review Modal */}
            <Modal isOpen={showReview} onClose={() => setShowReview(false)} title="Review Submission">
                <form onSubmit={handleReview} className="modal-form">
                    <div className="review-actions-grid">
                        {[
                            { action: "approved", icon: "✅", label: "Approve", color: "var(--color-success)" },
                            { action: "revision_requested", icon: "🔄", label: "Request Revision", color: "var(--color-warning)" },
                            { action: "rejected", icon: "❌", label: "Reject", color: "var(--color-danger)" },
                        ].map(opt => (
                            <button type="button" key={opt.action}
                                className={`review-opt ${reviewForm.action === opt.action ? "active" : ""}`}
                                style={{ "--opt-color": opt.color }}
                                onClick={() => setReviewForm({ ...reviewForm, action: opt.action })}>
                                <span className="review-opt-icon">{opt.icon}</span>
                                <span>{opt.label}</span>
                            </button>
                        ))}
                    </div>
                    <Textarea label="Notes" placeholder={reviewForm.action === "revision_requested" ? "What needs to change? (required)" : "Optional feedback..."}
                        required={reviewForm.action === "revision_requested"}
                        value={reviewForm.notes} onChange={e => setReviewForm({ ...reviewForm, notes: e.target.value })} />
                    <Button type="submit" variant="primary" size="lg" loading={creating} style={{ width: "100%", marginTop: 8 }}>
                        Submit Review
                    </Button>
                </form>
            </Modal>
        </div>
    )
}
