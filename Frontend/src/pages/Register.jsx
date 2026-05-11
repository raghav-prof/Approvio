import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google"
import { Button, Input, Select } from "../components/ui/ui"
import "./Auth.css"

export default function Register() {
    const { register, googleLogin } = useAuth()
    const navigate = useNavigate()
    const [form, setForm] = useState({ name: "", email: "", password: "", role: "client" })
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e) {
        e.preventDefault()
        setError("")
        setLoading(true)
        try {
            await register(form.name, form.email, form.password, form.role)
            navigate("/dashboard")
        } catch (err) {
            setError(err.response?.data?.message || "Registration failed")
        } finally {
            setLoading(false)
        }
    }

    async function handleGoogle(credentialResponse) {
        try {
            await googleLogin(credentialResponse.credential)
            navigate("/dashboard")
        } catch {
            setError("Google login failed")
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-bg"><div className="auth-orb" /></div>
            <div className="auth-card animate-fade-in">
                <div className="auth-header">
                    <Link to="/" className="auth-logo"><div className="logo-icon-lg">A</div></Link>
                    <h1 className="auth-title">Create your account</h1>
                    <p className="auth-subtitle">Start managing your creative workflow</p>
                </div>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <Input label="Full Name" type="text" placeholder="John Doe" required
                        value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                    <Input label="Email" type="email" placeholder="you@company.com" required
                        value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                    <Input label="Password" type="password" placeholder="Minimum 8 characters" required
                        value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                    <Select label="I am a..." value={form.role}
                        onChange={e => setForm({ ...form, role: e.target.value })}
                        options={[
                            { value: "client", label: "Client — I review and approve work" },
                            { value: "editor", label: "Editor — I create and submit work" }
                        ]} />
                    <Button type="submit" variant="primary" size="lg" loading={loading}
                        style={{ width: "100%" }}>Create Account</Button>
                </form>

                <div className="auth-divider"><span>or continue with</span></div>

                <div className="google-btn-wrapper">
                    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || "placeholder"}>
                        <GoogleLogin onSuccess={handleGoogle} onError={() => setError("Google login failed")}
                            theme="filled_black" shape="pill" size="large" width="100%" />
                    </GoogleOAuthProvider>
                </div>

                <p className="auth-footer-text">
                    Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
                </p>
            </div>
        </div>
    )
}
