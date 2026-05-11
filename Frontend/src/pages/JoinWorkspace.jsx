import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { Button, Loader } from "../components/ui/ui"
import API from "../api/axios"
import "./Auth.css"

export default function JoinWorkspace() {
    const { token } = useParams()
    const { user } = useAuth()
    const navigate = useNavigate()
    const [status, setStatus] = useState("loading") // loading, success, error
    const [message, setMessage] = useState("")
    const [workspace, setWorkspace] = useState(null)

    useEffect(() => {
        if (user) acceptInvite()
    }, [user])

    async function acceptInvite() {
        try {
            const { data } = await API.post(`/workspaces/join/${token}`)
            setWorkspace(data.data)
            setStatus("success")
            setMessage(data.message)
        } catch (err) {
            setStatus("error")
            setMessage(err.response?.data?.message || "Failed to join workspace")
        }
    }

    if (!user) {
        return (
            <div className="auth-page">
                <div className="auth-bg"><div className="auth-orb" /></div>
                <div className="auth-card animate-fade-in">
                    <h1 className="auth-title">You've been invited!</h1>
                    <p className="auth-subtitle">Sign in or create an account to join the workspace</p>
                    <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "center" }}>
                        <Button variant="primary" onClick={() => navigate(`/login?redirect=/join/${token}`)}>Sign In</Button>
                        <Button variant="secondary" onClick={() => navigate(`/register?redirect=/join/${token}`)}>Create Account</Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="auth-page">
            <div className="auth-bg"><div className="auth-orb" /></div>
            <div className="auth-card animate-fade-in">
                {status === "loading" && <Loader />}
                {status === "success" && (
                    <>
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
                            <h1 className="auth-title">You're in!</h1>
                            <p className="auth-subtitle">{message}</p>
                        </div>
                        <Button variant="primary" size="lg" style={{ width: "100%", marginTop: 24 }}
                            onClick={() => navigate(workspace?._id ? `/workspace/${workspace._id}` : "/dashboard")}>
                            Go to Workspace
                        </Button>
                    </>
                )}
                {status === "error" && (
                    <>
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
                            <h1 className="auth-title">Oops!</h1>
                            <p className="auth-subtitle">{message}</p>
                        </div>
                        <Button variant="secondary" size="lg" style={{ width: "100%", marginTop: 24 }}
                            onClick={() => navigate("/dashboard")}>
                            Go to Dashboard
                        </Button>
                    </>
                )}
            </div>
        </div>
    )
}
