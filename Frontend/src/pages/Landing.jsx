import { Link } from "react-router-dom"
import "./Landing.css"

export default function Landing() {
    return (
        <div className="landing">
            {/* Ambient background */}
            <div className="ambient">
                <div className="ambient-gradient" />
                <div className="ambient-grid" />
                <div className="ambient-noise" />
            </div>

            {/* Navigation */}
            <nav className="land-nav">
                <div className="land-nav-inner">
                    <Link to="/" className="brand">
                        <svg className="brand-mark" width="28" height="28" viewBox="0 0 28 28" fill="none">
                            <rect width="28" height="28" rx="7" fill="url(#brand-grad)"/>
                            <path d="M8 19L14 9L20 19H8Z" fill="white" fillOpacity="0.9"/>
                            <defs><linearGradient id="brand-grad" x1="0" y1="0" x2="28" y2="28"><stop stopColor="#8b5cf6"/><stop offset="1" stopColor="#6366f1"/></linearGradient></defs>
                        </svg>
                        <span className="brand-name">Approvio</span>
                    </Link>
                    <div className="land-nav-links">
                        <Link to="/login" className="nav-link">Log in</Link>
                        <Link to="/register" className="btn btn-primary btn-sm">Get started <span className="btn-arrow">→</span></Link>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="hero">
                <div className="hero-inner">
                    <div className="hero-eyebrow anim-fade-up">
                        <span className="eyebrow-dot" />
                        Now in public beta
                    </div>

                    <h1 className="hero-heading anim-fade-up delay-1">
                        The approval workflow<br/>
                        <span className="hero-gradient">your team deserves.</span>
                    </h1>

                    <p className="hero-sub anim-fade-up delay-2">
                        Approvio replaces scattered emails, Slack threads, and messy file sharing 
                        with one structured workspace for creative review and approval.
                    </p>

                    <div className="hero-ctas anim-fade-up delay-3">
                        <Link to="/register" className="btn btn-primary btn-lg">
                            Start for free
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3.33 8h9.34M8.67 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </Link>
                        <a href="#features" className="btn btn-secondary btn-lg">See how it works</a>
                    </div>

                    {/* Proof bar */}
                    <div className="proof anim-fade-up delay-4">
                        <div className="proof-item">
                            <span className="proof-value">10×</span>
                            <span className="proof-label">faster approvals</span>
                        </div>
                        <div className="proof-sep" />
                        <div className="proof-item">
                            <span className="proof-value">∞</span>
                            <span className="proof-label">team members</span>
                        </div>
                        <div className="proof-sep" />
                        <div className="proof-item">
                            <span className="proof-value">100%</span>
                            <span className="proof-label">version history</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="features" id="features">
                <div className="features-inner">
                    <div className="features-header anim-fade-up">
                        <span className="section-overline">Platform</span>
                        <h2 className="section-heading">Everything you need to ship creative work.</h2>
                        <p className="section-sub">Built for agencies, studios, and freelance teams who need structured feedback loops.</p>
                    </div>

                    <div className="features-bento">
                        {[
                            { title: "Structured Submissions", desc: "Upload images, videos, and documents with context. Every submission gets versioned automatically.", icon: "↗" },
                            { title: "One-Click Reviews", desc: "Approve, reject, or request changes instantly. No more email chains or lost feedback.", icon: "✓" },
                            { title: "Inline Comments", desc: "Threaded discussions with @mentions directly on submissions. Everyone stays in context.", icon: "◎" },
                            { title: "Real-Time Notifications", desc: "Instant alerts when work is submitted, reviewed, or discussed. Never miss a deadline.", icon: "⚡" },
                            { title: "Team Workspaces", desc: "Organize by client or project. Invite editors, assign roles, and manage permissions.", icon: "◈" },
                            { title: "Full Audit Trail", desc: "Every review, revision, and approval is logged. Complete transparency for your team.", icon: "≡" },
                        ].map((f, i) => (
                            <div key={i} className={`bento-card anim-fade-up delay-${Math.min(i + 1, 5)}`}>
                                <div className="bento-icon">{f.icon}</div>
                                <h3 className="bento-title">{f.title}</h3>
                                <p className="bento-desc">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="cta-inner anim-fade-up">
                    <div className="cta-glow" />
                    <h2 className="cta-heading">Ready to streamline your workflow?</h2>
                    <p className="cta-sub">Join teams who've replaced scattered feedback with structured approvals.</p>
                    <Link to="/register" className="btn btn-primary btn-lg">
                        Get started — it's free
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3.33 8h9.34M8.67 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="land-footer">
                <div className="land-footer-inner">
                    <div className="footer-brand">
                        <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
                            <rect width="28" height="28" rx="7" fill="url(#brand-grad2)"/>
                            <path d="M8 19L14 9L20 19H8Z" fill="white" fillOpacity="0.9"/>
                            <defs><linearGradient id="brand-grad2" x1="0" y1="0" x2="28" y2="28"><stop stopColor="#8b5cf6"/><stop offset="1" stopColor="#6366f1"/></linearGradient></defs>
                        </svg>
                        <span>Approvio</span>
                    </div>
                    <span className="footer-copy">© 2026 Approvio. All rights reserved.</span>
                </div>
            </footer>
        </div>
    )
}
