import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./MyClaims.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function MyClaims() {
  const navigate = useNavigate();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(API_BASE + "/claims", {
        headers: { Authorization: "Bearer " + token },
      });
      const data = await res.json();
      if (data.success) {
        setClaims(data.claims);
      } else {
        setError(data.message || "Could not load claims");
      }
    } catch (err) {
      setError("Could not reach server.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (claimId) => {
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

  const statusClass = (status) => {
    if (status === "approved") return "approved";
    if (status === "rejected") return "rejected";
    return "pending";
  };

  return (
    <div className="claims-shell">
      <header className="claims-header">
        <button className="back-btn" onClick={() => navigate("/dashboard")}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Dashboard
        </button>
        <span className="claims-title">My claims</span>
        <span style={{ width: 90 }} />
      </header>

      <div className="claims-body">
        {loading && <p className="muted">Loading your claims...</p>}
        {error && <div className="alert-error">{error}</div>}

        {!loading && !error && claims.length === 0 && (
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect x="8" y="14" width="32" height="26" rx="2" stroke="#5b665c" strokeWidth="1.6"/>
              <path d="M8 20h32" stroke="#5b665c" strokeWidth="1.6"/>
            </svg>
            <h3>No claims yet</h3>
            <p>Report a crop loss from your dashboard to see it here.</p>
            <button className="btn-primary" onClick={() => navigate("/claims/new")}>Report crop loss</button>
          </div>
        )}

        {claims.map((c) => (
          <div key={c.claim_id} className="claim-card">
            <div className="claim-card-top">
              <span className="claim-id">Claim #{c.claim_id}</span>
              <span className={"status-badge " + statusClass(c.status)}>{c.status.replace("_", " ")}</span>
            </div>
            <div className="claim-info-grid">
              <div><span>Crop</span><strong>{c.crop_type || "—"}</strong></div>
              <div><span>Gat No.</span><strong>{c.gat_number || "—"}</strong></div>
              <div><span>Village</span><strong>{c.village || "—"}</strong></div>
              <div><span>Fraud risk</span><strong>{c.final_result ? c.final_result.replace("_", " ") : "—"}</strong></div>
              <div><span>AI damage est.</span><strong>{c.ai_damage_score != null ? c.ai_damage_score + "%" : "—"}</strong></div>
            </div>
            <div className="claim-card-footer">
              <span className="claim-date">{new Date(c.created_at).toLocaleString("en-IN")}</span>
              <button className="download-link" onClick={() => handleDownload(c.claim_id)}>
                Download report
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

