import { useState } from "react"
import { useAuth } from "../context/AuthContext"
import Topbar from "../components/layout/Topbar"
import { Button, Input, Textarea } from "../components/ui/ui"
import "./Settings.css"

export default function Settings() {
    const { user, updateProfile } = useAuth()
    const [form, setForm] = useState({ name: user?.name || "", bio: user?.bio || "" })
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
