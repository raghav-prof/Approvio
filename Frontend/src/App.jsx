import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "./context/AuthContext"
import { AppProvider } from "./context/AppContext"
import AppLayout from "./components/layout/AppLayout"
import Landing from "./pages/Landing"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Dashboard from "./pages/Dashboard"
import WorkspaceDetail from "./pages/WorkspaceDetail"
import ProjectDetail from "./pages/ProjectDetail"
import Settings from "./pages/Settings"
import JoinWorkspace from "./pages/JoinWorkspace"
import { Loader } from "./components/ui/ui"

function ProtectedRoute({ children }) {
    const { user, loading } = useAuth()
    if (loading) return <Loader />
    if (!user) return <Navigate to="/login" replace />
    return children
}

function PublicRoute({ children }) {
    const { user, loading } = useAuth()
    if (loading) return <Loader />
    if (user) return <Navigate to="/dashboard" replace />
    return children
}

function AppRoutes() {
    return (
        <Routes>
            {/* Public */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

            {/* Invite (semi-public) */}
            <Route path="/join/:token" element={<JoinWorkspace />} />

            {/* Protected — App Layout */}
            <Route element={<ProtectedRoute><AppProvider><AppLayout /></AppProvider></ProtectedRoute>}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/workspaces" element={<Dashboard />} />
                <Route path="/workspace/:id" element={<WorkspaceDetail />} />
                <Route path="/workspace/:id/members" element={<WorkspaceDetail />} />
                <Route path="/project/:id" element={<ProjectDetail />} />
                <Route path="/settings" element={<Settings />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    )
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    )
}
