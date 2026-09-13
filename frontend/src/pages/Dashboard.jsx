import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import "./Dashboard.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const firstName = user.name ? user.name.split(" ")[0] : "Farmer";

  const [claims, setClaims] = useState([]);
  const [plots, setPlots] = useState([]);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClaims();
    fetchPlots();
    fetchWeather();
  }, []);

  const fetchClaims = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(API_BASE + "/claims", {
        headers: { Authorization: "Bearer " + token },
      });
      const data = await res.json();
      if (data.success) setClaims(data.claims);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlots = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(API_BASE + "/plots/mine", {
        headers: { Authorization: "Bearer " + token },
      });
      const data = await res.json();
      if (data.success) setPlots(data.plots);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchWeather = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            "https://api.open-meteo.com/v1/forecast?latitude=" + latitude +
            "&longitude=" + longitude +
            "&current_weather=true"
          );
          const data = await res.json();
          if (data.current_weather) setWeather(data.current_weather);
        } catch (err) {
          console.error(err);
        }
      },
      () => {}
    );
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleDownloadLastApproved = (claimId) => {
    const token = localStorage.getItem("token");
    fetch(API_BASE + "/claims/" + claimId + "/report", {
      headers: { Authorization: "Bearer " + token },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "claim-" + claimId + "-report.pdf";
        a.click();
        window.URL.revokeObjectURL(url);
      });
  };

  const navItems = [
    { label: "Dashboard", icon: "grid", active: true },
    { label: "My land", icon: "map" },
    { label: "My claims", icon: "file" },
    { label: "Profile", icon: "user" },
    { label: "About", icon: "info" },
  ];

  const icons = {
    grid: <path d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z" />,
    map: <path d="M9 3L3 6v15l6-3 6 3 6-3V3l-6 3-6-3z" />,
    file: <path d="M6 2h9l5 5v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" />,
    user: <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-4.4 0-8 2.2-8 5v2h16v-2c0-2.8-3.6-5-8-5z" />,
    info: <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 5a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4zm1.2 11h-2.4v-7.2h2.4z" />,
  };

  const total = claims.length;
  const approved = claims.filter((c) => c.status === "approved").length;
  const pending = claims.filter((c) => ["submitted", "pending_review", "manual_review"].includes(c.status)).length;
  const rejected = claims.filter((c) => c.status === "rejected").length;
  const recentClaims = claims.slice(0, 3);

  const notifications = claims
    .filter((c) => c.status === "approved" || c.status === "rejected")
    .slice(0, 3);

  const lastApproved = claims.find((c) => c.status === "approved");
  const firstPlot = plots[0];

  const statusClass = (status) => {
    if (status === "approved") return "approved";
    if (status === "rejected") return "rejected";
    return "pending";
  };

  const weatherIcon = (code) => {
    if (code === 0) return "??";
    if (code <= 3) return "?";
    if (code <= 48) return "???";
    if (code <= 67) return "???";
    if (code <= 77) return "???";
    if (code <= 82) return "???";
    return "??";
  };

  return (
    <div className="dash-shell">
      <aside className="sidebar">
        <div className="brand">
          <img src={logo} alt="Bhoomi Raksha logo" className="brand-logo" />
          Bhoomi Raksha
        </div>

        <nav className="nav-list">
          {navItems.map((item) => (
            <button
              key={item.label}
              className={"nav-item " + (item.active ? "active" : "")}
              onClick={
                item.label === "My claims" ? () => navigate("/claims") :
                item.label === "Profile" ? () => navigate("/profile") :
                item.label === "My land" ? () => navigate("/my-land") :
                item.label === "About" ? () => navigate("/about") :
                undefined
              }
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">{icons[item.icon]}</svg>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-tip">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C89B3C" strokeWidth="1.6">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v4M12 16v.01" />
          </svg>
          <p className="tip-title">Quick tip</p>
          <p className="tip-text">Take crop photos in daylight and keep the whole affected area in frame for a clearer damage estimate.</p>
        </div>

        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="user-avatar">{firstName.charAt(0)}</div>
            <div>
              <div className="user-chip-name">{user.name || "Farmer"}</div>
              <div className="user-chip-role">{user.village ? user.village + ", " + user.district : "Farmer"}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="M16 17l5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      <main className="dash-main">
        <div className="disclaimer-strip-inline">
          ?? This is a prototype system for academic demonstration — not an official government or insurance service. Claims here do not guarantee real compensation.
        </div>

        <div className="hero-banner">
          <svg className="hero-art" viewBox="0 0 700 220" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            <polygon points="0,60 140,40 160,140 20,160" fill="none" stroke="#C89B3C" strokeWidth="1.2" opacity="0.35"/>
            <polygon points="140,40 300,20 320,120 160,140" fill="none" stroke="#C89B3C" strokeWidth="1.2" opacity="0.3"/>
            <polygon points="300,20 480,10 500,110 320,120" fill="#C89B3C" fillOpacity="0.06" stroke="#C89B3C" strokeWidth="1.4" opacity="0.5"/>
            <circle cx="410" cy="65" r="4" fill="#3B6E8F"/>
            <circle cx="410" cy="65" r="10" fill="none" stroke="#3B6E8F" strokeWidth="1" opacity="0.5"/>
          </svg>
          <div className="hero-content">
            <span className="hero-eyebrow">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</span>
            <h1>Welcome back, {firstName}</h1>
            <p>Here's an overview of your crop-loss claims and land verification status.</p>
          </div>
          <button className="btn-report" onClick={() => navigate("/claims/new")}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            Report crop loss
          </button>
        </div>

        {notifications.length > 0 && (
          <div className="notif-panel">
            <div className="notif-panel-title">Recent updates</div>
            {notifications.map((n) => (
              <div key={n.claim_id} className="notif-row" onClick={() => navigate("/claims")}>
                <span className={"notif-dot " + statusClass(n.status)} />
                <span>Claim #{n.claim_id} was <strong>{n.status}</strong></span>
              </div>
            ))}
          </div>
        )}

        <div className="widget-row">
          {weather && (
            <div className="widget-card weather-widget">
              <div className="widget-icon">{weatherIcon(weather.weathercode)}</div>
              <div>
                <span className="widget-value">{Math.round(weather.temperature)}°C</span>
                <span className="widget-label">Current weather · Wind {Math.round(weather.windspeed)} km/h</span>
              </div>
            </div>
          )}

          {firstPlot && (
            <div className="widget-card land-widget" onClick={() => navigate("/my-land")}>
              <div className="widget-icon">???</div>
              <div>
                <span className="widget-value">Gat {firstPlot.gat_number}</span>
                <span className="widget-label">{firstPlot.village} · {firstPlot.area_acres} acres</span>
              </div>
            </div>
          )}

          {lastApproved && (
            <div className="widget-card report-widget" onClick={() => handleDownloadLastApproved(lastApproved.claim_id)}>
              <div className="widget-icon">??</div>
              <div>
                <span className="widget-value">Claim #{lastApproved.claim_id}</span>
                <span className="widget-label">Download approved report</span>
              </div>
            </div>
          )}
        </div>

        <div className="stat-cards">
          <div className="stat-card">
            <div className="stat-icon total">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2h9l5 5v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z"/></svg>
            </div>
            <div>
              <span className="stat-value">{loading ? "—" : total}</span>
              <span className="stat-label">Total claims</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon approved">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
            </div>
            <div>
              <span className="stat-value">{loading ? "—" : approved}</span>
              <span className="stat-label">Approved</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon pending">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            </div>
            <div>
              <span className="stat-value">{loading ? "—" : pending}</span>
              <span className="stat-label">Pending</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon rejected">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>
            </div>
            <div>
              <span className="stat-value">{loading ? "—" : rejected}</span>
              <span className="stat-label">Rejected</span>
            </div>
          </div>
        </div>

        <div className="claims-section">
          <div className="section-header">
            <h2>Recent claims</h2>
          </div>

          {loading ? (
            <div className="empty-state"><p>Loading...</p></div>
          ) : recentClaims.length === 0 ? (
            <div className="empty-state">
              <svg width="120" height="90" viewBox="0 0 120 90" fill="none">
                <polygon points="10,20 55,12 62,50 15,58" fill="none" stroke="#C89B3C" strokeWidth="1.4" opacity="0.6"/>
                <polygon points="55,12 100,8 108,44 62,50" fill="none" stroke="#1F4D3A" strokeWidth="1.4" opacity="0.5"/>
                <circle cx="70" cy="30" r="3" fill="#3B6E8F"/>
                <circle cx="70" cy="30" r="8" fill="none" stroke="#3B6E8F" strokeWidth="1" opacity="0.5"/>
              </svg>
              <h3>No claims yet</h3>
              <p>When you report a crop loss, it will appear here with its verification status.</p>
            </div>
          ) : (
            <div className="recent-claims-list">
              {recentClaims.map((c) => (
                <div key={c.claim_id} className="recent-claim-row" onClick={() => navigate("/claims")}>
                  <div>
                    <strong>Claim #{c.claim_id}</strong>
                    <span className="recent-claim-crop">{c.crop_type || "—"} · {c.gat_number ? "Gat " + c.gat_number : "—"}</span>
                  </div>
                  <span className={"status-pill-small " + statusClass(c.status)}>{c.status.replace("_", " ")}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}



