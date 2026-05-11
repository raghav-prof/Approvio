import { useState, useRef, useEffect } from "react"
import { useApp } from "../../context/AppContext"
import { formatRelative } from "../../utils/helpers"
import "./Topbar.css"

export default function Topbar({ title, subtitle }) {
    const { notifications, unreadCount, markNotificationRead, markAllRead } = useApp()
    const [showNotifs, setShowNotifs] = useState(false)
    const panelRef = useRef(null)

    useEffect(() => {
        function handleClick(e) {
            if (panelRef.current && !panelRef.current.contains(e.target)) setShowNotifs(false)
        }
        document.addEventListener("mousedown", handleClick)
        return () => document.removeEventListener("mousedown", handleClick)
    }, [])

    return (
        <header className="topbar">
            <div className="topbar-left">
                <div>
                    <h1 className="topbar-title">{title || "Dashboard"}</h1>
                    {subtitle && <p className="topbar-subtitle">{subtitle}</p>}
                </div>
            </div>
            <div className="topbar-right">
                <div className="notif-container" ref={panelRef}>
                    <button className="notif-btn" onClick={() => setShowNotifs(!showNotifs)}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                        </svg>
                        {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>}
                    </button>

                    {showNotifs && (
                        <div className="notif-panel animate-slide-up">
                            <div className="notif-panel-header">
                                <h3>Notifications</h3>
                                {unreadCount > 0 && (
                                    <button className="mark-all-btn" onClick={markAllRead}>Mark all read</button>
                                )}
                            </div>
                            <div className="notif-list">
                                {notifications.length === 0 ? (
                                    <div className="notif-empty">No notifications yet</div>
                                ) : (
                                    notifications.map(n => (
                                        <div key={n._id} className={`notif-item ${n.isRead ? "" : "unread"}`}
                                            onClick={() => markNotificationRead(n._id)}>
                                            <div className="notif-dot" />
                                            <div className="notif-content">
                                                <span className="notif-title-text">{n.title}</span>
                                                <span className="notif-message">{n.message}</span>
                                                <span className="notif-time">{formatRelative(n.createdAt)}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}
