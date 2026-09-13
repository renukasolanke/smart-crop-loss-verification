import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import "./AdminDashboard.css";

const API_BASE = "http://localhost:5000";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const admin = JSON.parse(localStorage.getItem("user") || "{}");

  const token = localStorage.getItem("token");
  const headers = { Authorization: "Bearer " + token };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, claimsRes] = await Promise.all([
        fetch(API_BASE + "/admin/stats", { headers }),
        fetch(API_BASE + "/admin/claims", { headers }),
      ]);
      const statsData = await statsRes.json();
      const claimsData = await claimsRes.json();
      if (statsData.success) setStats(statsData.stats);
      if (claimsData.success) setClaims(claimsData.claims);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const filteredClaims = claims.filter((c) => {
    if (filter === "all") return true;
    if (filter === "pending") return ["submitted", "pending_review"].includes(c.status);
    if (filter === "high_risk") return c.final_result === "HIGH_RISK";
    return c.status === filter;
  });

  const riskBadgeClass = (result) => {
    if (result === "LOW_RISK") return "low";
    if (result === "MEDIUM_RISK") return "medium";
    if (result === "HIGH_RISK") return "high";
    return "";
  };

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div className="brand">
          <img src={logo} alt="Bhoomi Raksha logo" className="brand-logo" />
          Bhoomi Raksha <span className="admin-tag">Admin</span>
        </div>
        <div className="header-right">
          <span className="admin-name">{admin.name || "Admin"}</span>
          <button className="logout-btn" onClick={handleLogout}>Sign out</button>
        </div>
      </header>

      <main className="admin-main">
        <div className="disclaimer-strip-inline">
          ?? Prototype system — approvals here are for demonstration only and are not connected to any official compensation process.
        </div>

        <h1>Claims overview</h1>

        {stats && stats.high_risk_alerts > 0 && (
          <div className="alert-banner-admin" onClick={() => setFilter("high_risk")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B3432B" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>
              <strong>{stats.high_risk_alerts}</strong> high-risk claim{stats.high_risk_alerts != 1 ? "s" : ""} need attention — click to review
            </span>
          </div>
        )}

        {stats && (
          <div className="stat-cards">
            <div className="stat-card" onClick={() => setFilter("all")}>
              <span className="stat-value">{stats.total}</span>
              <span className="stat-label">Total claims</span>
            </div>
            <div className="stat-card" onClick={() => setFilter("pending")}>
              <span className="stat-value">{stats.pending}</span>
              <span className="stat-label">Pending review</span>
            </div>
            <div className="stat-card" onClick={() => setFilter("approved")}>
              <span className="stat-value">{stats.approved}</span>
              <span className="stat-label">Approved</span>
            </div>
            <div className="stat-card" onClick={() => setFilter("rejected")}>
              <span className="stat-value">{stats.rejected}</span>
              <span className="stat-label">Rejected</span>
            </div>
            <div className="stat-card" onClick={() => setFilter("manual_review")}>
              <span className="stat-value">{stats.manual_review}</span>
              <span className="stat-label">Manual review</span>
            </div>
          </div>
        )}

        <div className="filter-row">
          {["all", "pending", "approved", "rejected", "manual_review", "high_risk"].map((f) => (
            <button key={f} className={"filter-chip " + (filter === f ? "active" : "")} onClick={() => setFilter(f)}>
              {f === "high_risk" ? "High risk" : f.replace("_", " ")}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="muted">Loading claims...</p>
        ) : filteredClaims.length === 0 ? (
          <p className="muted">No claims match this filter.</p>
        ) : (
          <div className="claims-table">
            <div className="table-header">
              <span>Claim</span>
              <span>Farmer</span>
              <span>Land</span>
              <span>Crop</span>
              <span>Fraud risk</span>
              <span>Status</span>
              <span></span>
            </div>
            {filteredClaims.map((c) => (
              <div key={c.claim_id} className={"table-row" + (c.final_result === "HIGH_RISK" ? " high-risk-row" : "")} onClick={() => navigate("/admin/claims/" + c.claim_id)}>
                <span>#{c.claim_id}</span>
                <span>{c.farmer_name}</span>
                <span>{c.gat_number ? "Gat " + c.gat_number : "—"}</span>
                <span>{c.crop_type || "—"}</span>
                <span>
                  {c.final_result ? (
                    <span className={"risk-badge " + riskBadgeClass(c.final_result)}>{c.final_result.replace("_", " ")}</span>
                  ) : "—"}
                </span>
                <span className={"status-pill " + c.status}>{c.status.replace("_", " ")}</span>
                <span className="view-link">View ?</span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

