import "./ui.css"

export function Button({ children, variant = "primary", size = "md", loading, disabled, ...props }) {
    return (
        <button className={`btn btn-${variant} btn-${size} ${loading ? "loading" : ""}`}
            disabled={disabled || loading} {...props}>
            {loading && <span className="btn-spinner" />}
            {children}
        </button>
    )
}

export function Modal({ isOpen, onClose, title, children, size = "md" }) {
    if (!isOpen) return null
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className={`modal-content modal-${size} animate-slide-up`} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">{title}</h2>
                    <button className="modal-close" onClick={onClose}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>
                <div className="modal-body">{children}</div>
            </div>
        </div>
    )
}

export function StatusBadge({ status }) {
    const labels = {
        pending: "Pending", in_review: "In Review", approved: "Approved",
        revision_requested: "Revision", rejected: "Rejected",
        active: "Active", completed: "Completed", archived: "Archived"
    }
    return <span className={`status-badge status-${status}`}>{labels[status] || status}</span>
}

export function Avatar({ name, src, size = 36 }) {
    const initials = name ? name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : "?"
    const hue = name ? name.charCodeAt(0) * 7 % 360 : 0
    return (
        <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.35, background: src ? "transparent" : `hsl(${hue}, 55%, 50%)` }}>
            {src ? <img src={src} alt={name} /> : initials}
        </div>
    )
}

export function EmptyState({ icon, title, description, action }) {
    return (
        <div className="empty-state">
            {icon && <div className="empty-icon">{icon}</div>}
            <h3 className="empty-title">{title}</h3>
            {description && <p className="empty-desc">{description}</p>}
            {action}
        </div>
    )
}

export function Loader({ size = 40 }) {
    return (
        <div className="loader-container">
            <div className="loader-spinner" style={{ width: size, height: size }} />
        </div>
    )
}

export function Input({ label, error, ...props }) {
    return (
        <div className="input-group">
            {label && <label className="input-label">{label}</label>}
            <input className={`input-field ${error ? "input-error" : ""}`} {...props} />
            {error && <span className="input-error-text">{error}</span>}
        </div>
    )
}

export function Textarea({ label, error, ...props }) {
    return (
        <div className="input-group">
            {label && <label className="input-label">{label}</label>}
            <textarea className={`input-field textarea ${error ? "input-error" : ""}`} {...props} />
            {error && <span className="input-error-text">{error}</span>}
        </div>
    )
}

export function Select({ label, options, error, ...props }) {
    return (
        <div className="input-group">
            {label && <label className="input-label">{label}</label>}
            <select className={`input-field select-field ${error ? "input-error" : ""}`} {...props}>
                {options.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                ))}
            </select>
        </div>
    )
}
