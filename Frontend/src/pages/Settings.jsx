import { useState } from "react"
import { useAuth } from "../context/AuthContext"
import Topbar from "../components/layout/Topbar"
import { Button, Input, Textarea } from "../components/ui/ui"
import "./Settings.css"

export default function Settings() {
    const { user, updateProfile } = useAuth()
    const [form, setForm] = useState({ name: user?.name || "", bio: user?.bio || "", role: user?.role || "client" })
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    async function handleSave(e) {
        e.preventDefault()
        setSaving(true)
        try {
            await updateProfile(form)
            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
        } catch {} finally { setSaving(false) }
    }

    return (
        <div className="page">
            <Topbar title="Settings" subtitle="Manage your account preferences" />
            <div className="page-content">
                <div className="settings-card">
                    <h3 className="settings-section-title">Profile</h3>
                    <form onSubmit={handleSave} className="settings-form">
                        <div className="settings-avatar-row">
                            <div className="settings-avatar">
                                {user?.avatar ? <img src={user.avatar} alt="" /> : user?.name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                                <span className="settings-email">{user?.email}</span>
                                <span className="settings-role">{user?.role}</span>
                            </div>
                        </div>
                        <Input label="Display Name" value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })} />
                        <Textarea label="Bio" placeholder="Tell us about yourself..."
                            value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} />
                        <div className="input-group">
                            <label className="input-label">Role</label>
                            <div className="role-switcher">
                                <button type="button" className={`role-option ${form.role === "client" ? "active" : ""}`}
                                    onClick={() => setForm({ ...form, role: "client" })}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                                    Client
                                </button>
                                <button type="button" className={`role-option ${form.role === "editor" ? "active" : ""}`}
                                    onClick={() => setForm({ ...form, role: "editor" })}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                                    Editor
                                </button>
                            </div>
                        </div>
                        <div className="settings-actions">
                            <Button type="submit" variant="primary" loading={saving}>Save Changes</Button>
                            {saved && <span className="saved-indicator">✓ Saved</span>}
                        </div>
                    </form>
                </div>

                <div className="settings-card">
                    <h3 className="settings-section-title">Account</h3>
                    <div className="settings-info-row">
                        <span className="settings-label">Email</span>
                        <span className="settings-value">{user?.email}</span>
                    </div>
                    <div className="settings-info-row">
                        <span className="settings-label">Role</span>
                        <span className="settings-value" style={{ textTransform: "capitalize" }}>{user?.role}</span>
                    </div>
                    <div className="settings-info-row">
                        <span className="settings-label">Auth Method</span>
                        <span className="settings-value">{user?.googleId ? "Google" : "Email / Password"}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
