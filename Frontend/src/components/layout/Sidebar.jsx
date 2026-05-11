import { useState } from "react"
import { NavLink, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { useApp } from "../../context/AppContext"
import { getInitials } from "../../utils/helpers"
import "./Sidebar.css"

export default function Sidebar() {
    const { user, logout } = useAuth()
    const { workspaces, currentWorkspace, setCurrentWorkspace } = useApp()
    const [collapsed, setCollapsed] = useState(false)
    const navigate = useNavigate()

    async function handleLogout() {
        await logout()
        navigate("/login")
    }

    return (
        <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
            <div className="sidebar-header">
                <div className="sidebar-logo" onClick={() => navigate("/dashboard")}>
                    <div className="logo-icon">A</div>
                    {!collapsed && <span className="logo-text">Approvio</span>}
                </div>
                <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)} title={collapsed ? "Expand" : "Collapse"}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {collapsed
                            ? <><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></>
                            : <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                        }
                    </svg>
                </button>
            </div>

            <nav className="sidebar-nav">
                <div className="nav-section">
                    {!collapsed && <span className="nav-label">Main</span>}
                    <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                        {!collapsed && <span>Dashboard</span>}
                    </NavLink>
                    <NavLink to="/workspaces" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        {!collapsed && <span>Workspaces</span>}
                    </NavLink>
                </div>

                {currentWorkspace && !collapsed && (
                    <div className="nav-section">
                        <span className="nav-label">Current Workspace</span>
                        <div className="current-workspace-badge">
                            <div className="ws-icon">{currentWorkspace.name?.[0]}</div>
                            <span className="ws-name">{currentWorkspace.name}</span>
                        </div>
                        <NavLink to={`/workspace/${currentWorkspace._id}`} className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                            <span>Projects</span>
                        </NavLink>
                        <NavLink to={`/workspace/${currentWorkspace._id}/members`} className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                            <span>Members</span>
                        </NavLink>
                    </div>
                )}

                {!collapsed && workspaces.length > 0 && (
                    <div className="nav-section">
                        <span className="nav-label">Workspaces</span>
                        {workspaces.slice(0, 5).map(ws => (
                            <button key={ws._id} className={`nav-item ws-item ${currentWorkspace?._id === ws._id ? "active" : ""}`}
                                onClick={() => { setCurrentWorkspace(ws); navigate(`/workspace/${ws._id}`) }}>
                                <div className="ws-dot" style={{ background: `hsl(${ws.name.charCodeAt(0) * 7 % 360}, 70%, 60%)` }} />
                                <span>{ws.name}</span>
                            </button>
                        ))}
                    </div>
                )}
            </nav>

            <div className="sidebar-footer">
                <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                    {!collapsed && <span>Settings</span>}
                </NavLink>
                <div className="user-card" onClick={handleLogout}>
                    <div className="user-avatar">{user?.avatar ? <img src={user.avatar} alt="" /> : getInitials(user?.name)}</div>
                    {!collapsed && (
                        <div className="user-info">
                            <span className="user-name">{user?.name}</span>
                            <span className="user-role">{user?.role}</span>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    )
}
