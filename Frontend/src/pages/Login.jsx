import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google"
import { Button, Input } from "../components/ui/ui"
import "./Auth.css"

export default function Login() {
    const { login, googleLogin } = useAuth()
    const navigate = useNavigate()
    const [form, setForm] = useState({ email: "", password: "" })
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e) {
        e.preventDefault()
        setError("")
        setLoading(true)
        try {
            await login(form.email, form.password)
            navigate("/dashboard")
        } catch (err) {
            setError(err.response?.data?.message || "Login failed")
        } finally {
            setLoading(false)
        }
    }

    async function handleGoogle(credentialResponse) {
        try {
            await googleLogin(credentialResponse.credential)
            navigate("/dashboard")
        } catch (err) {
            setError("Google login failed")
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-bg"><div className="auth-orb" /></div>
            <div className="auth-card animate-fade-in">
                <div className="auth-header">
                    <Link to="/" className="auth-logo">
                        <div className="logo-icon-lg">A</div>
                    </Link>
                    <h1 className="auth-title">Welcome back</h1>
                    <p className="auth-subtitle">Sign in to your Approvio account</p>
                </div>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <Input label="Email" type="email" placeholder="you@company.com" required
                        value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                    <Input label="Password" type="password" placeholder="••••••••" required
                        value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                    <Button type="submit" variant="primary" size="lg" loading={loading}
                        style={{ width: "100%" }}>Sign In</Button>
                </form>

                <div className="auth-divider"><span>or continue with</span></div>

                <div className="google-btn-wrapper">
                    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || "placeholder"}>
                        <GoogleLogin onSuccess={handleGoogle} onError={() => setError("Google login failed")}
                            theme="filled_black" shape="pill" size="large" width="100%" />
                    </GoogleOAuthProvider>
                </div>

                <p className="auth-footer-text">
                    Don't have an account? <Link to="/register" className="auth-link">Create one</Link>
                </p>
            </div>
        </div>
    )
}
