import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ClaimDetails.css";

const API_BASE = "http://localhost:5000";

export default function ClaimDetails() {
  const navigate = useNavigate();
  const [claim, setClaim] = useState(null);
  const [cropType, setCropType] = useState("");
  const [damageDescription, setDamageDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem("confirmedClaim");
    if (!stored) {
      navigate("/claims/new");
      return;
    }
    setClaim(JSON.parse(stored));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/claims`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({
          imageDataUrl: claim.dataUrl,
          latitude: claim.gps.latitude,
          longitude: claim.gps.longitude,
          gps_accuracy: claim.gps.accuracy,
          capture_time: claim.captureTime,
          plot_id: claim.plot?.plot_id,
          crop_type: cropType,
          damage_description: damageDescription,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.claim);
        sessionStorage.removeItem("pendingClaim");
        sessionStorage.removeItem("confirmedClaim");
      } else {
        setError(data.message || "Could not submit claim");
      }
    } catch (err) {
      setError("Could not reach server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!claim) return null;

  if (result) {
    const riskClass = result.final_result === "LOW_RISK" ? "low" : result.final_result === "MEDIUM_RISK" ? "medium" : "high";
    const ai = result.ai_analysis;

    return (
      <div className="details-shell">
        <div className="success-body">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#1F4D3A" strokeWidth="1.6">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          <h2>Claim submitted</h2>
          <p>Your claim (ID #{result.claim_id}) has been recorded and sent for verification.</p>

          <div className="confidence-ring-wrap">
            <div className="confidence-ring">
              <span className="confidence-number">{result.confidence_score}%</span>
              <span className="confidence-label">Confidence</span>
            </div>
          </div>

          <div className="result-card">
            <div className="result-row">
              <span>Fraud risk</span>
              <strong className={`badge ${riskClass}`}>{result.final_result.replace("_", " ")}</strong>
            </div>
            <div className="result-row">
              <span>Duplicate check</span>
              <strong>{result.duplicate_detected ? "Flagged" : "Passed"}</strong>
            </div>
            <div className="result-row">
              <span>Status</span>
              <strong style={{ textTransform: "capitalize" }}>{result.status}</strong>
            </div>
          </div>

          {ai && (
            <div className="ai-card">
              <div className="ai-card-header">
                <span>AI crop damage estimate</span>
                <span className="ai-mode-tag">Prototype mode</span>
              </div>

              {ai.cropDetected ? (
                <>
                  <div className="ai-damage-display">
                    <span className="ai-percent">{ai.damagePercent}%</span>
                    <span className="ai-category">{ai.category}</span>
                  </div>
                  <div className="ai-bar-track">
                    <div className="ai-bar-fill" style={{ width: ai.damagePercent + "%" }} />
                  </div>
                </>
              ) : (
                <p className="ai-fallback">{ai.category}</p>
              )}
              <p className="ai-note">{ai.note}</p>
            </div>
          )}

          <button className="btn-primary" onClick={() => navigate("/dashboard")}>Back to dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="details-shell">
      <header className="details-header">
        <button className="back-btn" onClick={() => navigate("/claims/land-match")}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back
        </button>
        <span className="details-title">Crop details</span>
        <span style={{ width: 60 }} />
      </header>

      <form className="details-body" onSubmit={handleSubmit}>
        <img src={claim.dataUrl} alt="Crop" className="thumb-img" />

        <div className="field-group">
          <label>Crop type</label>
          <select value={cropType} onChange={(e) => setCropType(e.target.value)} required>
            <option value="">Select crop</option>
            <option>Cotton</option>
            <option>Sugarcane</option>
            <option>Wheat</option>
            <option>Rice (Paddy)</option>
            <option>Soybean</option>
            <option>Onion</option>
            <option>Other</option>
          </select>
        </div>

        <div className="field-group">
          <label>Describe the damage</label>
          <textarea
            rows={4}
            placeholder="E.g. Heavy rainfall flooded the field on 8th September, crop submerged for 2 days"
            value={damageDescription}
            onChange={(e) => setDamageDescription(e.target.value)}
            required
          />
        </div>

        {error && <div className="alert-error">{error}</div>}

        <button className="btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit claim"}
        </button>
      </form>
    </div>
  );
}

