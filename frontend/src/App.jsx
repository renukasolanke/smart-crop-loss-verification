import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import ClaimCamera from "./pages/ClaimCamera";
import LandMatch from "./pages/LandMatch";
import ClaimDetails from "./pages/ClaimDetails";
import MyClaims from "./pages/MyClaims";
import Profile from "./pages/Profile";
import MyLand from "./pages/MyLand";
import About from "./pages/About";
import AdminDashboard from "./pages/AdminDashboard";
import AdminClaimDetail from "./pages/AdminClaimDetail";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/" />;
}

function AdminRoute({ children }) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (!token) return <Navigate to="/" />;
  if (user.role !== "admin") return <Navigate to="/dashboard" />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/claims/new" element={<ProtectedRoute><ClaimCamera /></ProtectedRoute>} />
        <Route path="/claims/land-match" element={<ProtectedRoute><LandMatch /></ProtectedRoute>} />
        <Route path="/claims/details" element={<ProtectedRoute><ClaimDetails /></ProtectedRoute>} />
        <Route path="/claims" element={<ProtectedRoute><MyClaims /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/my-land" element={<ProtectedRoute><MyLand /></ProtectedRoute>} />
        <Route path="/about" element={<ProtectedRoute><About /></ProtectedRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/claims/:id" element={<AdminRoute><AdminClaimDetail /></AdminRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;



