import { useNavigate } from "react-router-dom";
import "./Profile.css";

export default function Profile() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="profile-shell">
      <header className="profile-header">
        <button className="back-btn" onClick={() => navigate("/dashboard")}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Dashboard
        </button>
        <span className="profile-title">My profile</span>
        <span style={{ width: 90 }} />
      </header>

      <div className="profile-body">
        <div className="avatar-block">
          <div className="avatar-circle">{(user.name || "F").charAt(0)}</div>
          <h2>{user.name || "Farmer"}</h2>
          <span className="role-tag">{user.role || "farmer"}</span>
        </div>

        <div className="profile-card">
          <div className="profile-row">
            <span>Mobile number</span>
            <strong>{user.mobile || "—"}</strong>
          </div>
          <div className="profile-row">
            <span>Village</span>
            <strong>{user.village || "Not set"}</strong>
          </div>
          <div className="profile-row">
            <span>District</span>
            <strong>{user.district || "Not set"}</strong>
          </div>
        </div>

        <button className="btn-logout" onClick={handleLogout}>Sign out</button>
      </div>
    </div>
  );
}
