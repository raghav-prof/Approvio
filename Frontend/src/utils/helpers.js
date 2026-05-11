export function formatDate(date) {
    if (!date) return ""
    const d = new Date(date)
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export function formatRelative(date) {
    if (!date) return ""
    const now = new Date()
    const d = new Date(date)
    const diff = Math.floor((now - d) / 1000)

    if (diff < 60) return "just now"
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
    return formatDate(date)
}

export function getInitials(name) {
    if (!name) return "?"
    return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
}

export function getStatusColor(status) {
    const map = {
        pending: "var(--color-warning)",
        in_review: "var(--color-info)",
        approved: "var(--color-success)",
        revision_requested: "var(--color-warning)",
        rejected: "var(--color-danger)",
        active: "var(--color-success)",
        completed: "var(--color-info)",
        archived: "var(--text-muted)"
    }
    return map[status] || "var(--text-secondary)"
}

export function getStatusLabel(status) {
    const map = {
        pending: "Pending",
        in_review: "In Review",
        approved: "Approved",
        revision_requested: "Revision Requested",
        rejected: "Rejected",
        active: "Active",
        completed: "Completed",
        archived: "Archived"
    }
    return map[status] || status
}

export function formatFileSize(bytes) {
    if (!bytes) return "0 B"
    const units = ["B", "KB", "MB", "GB"]
    let i = 0
    let size = bytes
    while (size >= 1024 && i < units.length - 1) { size /= 1024; i++ }
    return `${size.toFixed(1)} ${units[i]}`
}
