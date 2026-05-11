import { Link } from "react-router-dom"
import "./Landing.css"

export default function Landing() {
    return (
        <div className="landing">
            <div className="landing-bg">
                <div className="landing-orb orb-1" />
                <div className="landing-orb orb-2" />
                <div className="landing-orb orb-3" />
            </div>

            <nav className="landing-nav">
                <div className="landing-logo">
                    <div className="logo-icon-lg">A</div>
                    <span className="logo-text-lg">Approvio</span>
                </div>
                <div className="landing-nav-links">
                    <Link to="/login" className="nav-link-landing">Sign In</Link>
                    <Link to="/register" className="btn btn-primary btn-md">Get Started</Link>
                </div>
            </nav>

            <section className="hero">
                <div className="hero-badge animate-fade-in">✨ Streamline your creative workflow</div>
                <h1 className="hero-title animate-fade-in">
                    Review. Approve.<br />
                    <span className="gradient-text">Ship Faster.</span>
                </h1>
                <p className="hero-subtitle animate-fade-in">
                    The enterprise collaboration platform where clients and creative teams
                    exchange media, give feedback, and approve work — all in one beautiful space.
                </p>
                <div className="hero-actions animate-fade-in">
                    <Link to="/register" className="btn btn-primary btn-lg">Start Free →</Link>
                    <Link to="/login" className="btn btn-secondary btn-lg">Sign In</Link>
                </div>

                <div className="hero-stats animate-fade-in">
                    <div className="stat"><span className="stat-number">10x</span><span className="stat-label">Faster Reviews</span></div>
                    <div className="stat-divider" />
                    <div className="stat"><span className="stat-number">100%</span><span className="stat-label">File Versioning</span></div>
                    <div className="stat-divider" />
                    <div className="stat"><span className="stat-number">∞</span><span className="stat-label">Team Members</span></div>
                </div>
            </section>

            <section className="features-grid animate-fade-in">
                {[
                    { icon: "📤", title: "Submit Work", desc: "Upload images, videos, and documents with rich descriptions" },
                    { icon: "✅", title: "One-Click Approvals", desc: "Approve, reject, or request revisions instantly" },
                    { icon: "💬", title: "Inline Feedback", desc: "Threaded comments with @mentions on every submission" },
                    { icon: "🔔", title: "Real-Time Alerts", desc: "Instant notifications when your work is reviewed" },
                    { icon: "👥", title: "Team Management", desc: "Invite editors, assign roles, manage permissions" },
                    { icon: "📊", title: "Version History", desc: "Track every revision with full submission history" },
                ].map((f, i) => (
                    <div key={i} className="feature-card glass-card">
                        <span className="feature-icon">{f.icon}</span>
                        <h3 className="feature-title">{f.title}</h3>
                        <p className="feature-desc">{f.desc}</p>
                    </div>
                ))}
            </section>

            <footer className="landing-footer">
                <p>© 2026 Approvio. Built for creative teams that move fast.</p>
            </footer>
        </div>
    )
}
