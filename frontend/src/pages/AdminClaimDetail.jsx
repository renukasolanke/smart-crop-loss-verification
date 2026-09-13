import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "./AdminClaimDetail.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const API_BASE = "http://localhost:5000";

export default function AdminClaimDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [claim, setClaim] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchClaim();
  }, [id]);

  const fetchClaim = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/claims/${id}`, { headers });
      const data = await res.json();
      if (data.success) setClaim(data.claim);
      else setError(data.message);
    } catch (err) {
      setError("Could not load claim.");
    }
  };

  const handleAction = async (status) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/claims/${id}/status`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ status, remarks }),
      });
      const data = await res.json();
      if (data.success) {
        navigate("/admin");
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Action failed. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  if (error) return <div className="admin-detail-shell"><p className="muted">{error}</p></div>;
  if (!claim) return <div className="admin-detail-shell"><p className="muted">Loading...</p></div>;

  const riskClass = claim.final_result === "LOW_RISK" ? "low" : claim.final_result === "MEDIUM_RISK" ? "medium" : claim.final_result === "HIGH_RISK" ? "high" : "";

  return (
    <div className="admin-detail-shell">
      <header className="admin-detail-header">
        <button className="back-btn" onClick={() => navigate("/admin")}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          All claims
        </button>
        <span className="detail-title">Claim #{claim.claim_id}</span>
        <span style={{ width: 80 }} />
      </header>

      <div className="detail-body">
        {claim.image_data && (
          <div className="detail-section">
            <h3>Crop photo</h3>
            <img src={claim.image_data} alt="Submitted crop" className="claim-photo" />
          </div>
        )}

        <div className="detail-section">
          <h3>Location map</h3>
          <div className="admin-map-wrap">
            <MapContainer
              center={[Number(claim.latitude), Number(claim.longitude)]}
              zoom={15}
              style={{ height: "220px", width: "100%", borderRadius: "6px" }}
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[Number(claim.latitude), Number(claim.longitude)]} />
            </MapContainer>
          </div>
        </div>

        <div className="detail-grid-2col">
          <div className="detail-section">
            <h3>Farmer</h3>
            <div className="detail-row"><span>Name</span><strong>{claim.farmer_name}</strong></div>
            <div className="detail-row"><span>Mobile</span><strong>{claim.farmer_mobile}</strong></div>
          </div>

          <div className="detail-section">
            <h3>Land</h3>
            <div className="detail-row"><span>Gat No.</span><strong>{claim.gat_number || "—"}</strong></div>
            <div className="detail-row"><span>Village</span><strong>{claim.village || "—"}</strong></div>
            <div className="detail-row"><span>District</span><strong>{claim.district || "—"}</strong></div>
            <div className="detail-row"><span>Area</span><strong>{claim.area_acres ? `${claim.area_acres} acres` : "—"}</strong></div>
          </div>
        </div>

        <div className="detail-section">
          <h3>Claim details</h3>
          <div className="detail-row"><span>Crop type</span><strong>{claim.crop_type || "—"}</strong></div>
          <div className="detail-row"><span>Damage description</span><strong>{claim.damage_description || "—"}</strong></div>
          <div className="detail-row"><span>GPS</span><strong>{Number(claim.latitude).toFixed(6)}, {Number(claim.longitude).toFixed(6)}</strong></div>
          <div className="detail-row"><span>GPS accuracy</span><strong>{claim.gps_accuracy ? `${claim.gps_accuracy}m` : "—"}</strong></div>
          <div className="detail-row"><span>Submitted</span><strong>{new Date(claim.created_at).toLocaleString("en-IN")}</strong></div>
        </div>

        {claim.weather && (
          <div className="detail-section">
            <h3>Weather correlation</h3>
            <div className="detail-row"><span>Date</span><strong>{claim.weather.date}</strong></div>
            <div className="detail-row"><span>Rainfall</span><strong>{claim.weather.rainfall_mm} mm</strong></div>
            <div className="detail-row"><span>Temperature range</span><strong>{claim.weather.temp_min_c}°C – {claim.weather.temp_max_c}°C</strong></div>
            <div className="detail-row"><span>Max wind speed</span><strong>{claim.weather.wind_max_kmh} km/h</strong></div>
            <div className="detail-row"><span>Source</span><strong style={{ fontSize: "11px", fontWeight: 400, color: "#8f9286" }}>{claim.weather.source}</strong></div>
          </div>
        )}


        <div className="detail-section">
          <h3>Verification</h3>
          <div className="detail-row"><span>GIS match</span><strong>{claim.gis_result || "—"}</strong></div>
          <div className="detail-row"><span>GPS quality</span><strong>{claim.gps_result || "—"}</strong></div>
          <div className="detail-row"><span>Duplicate check</span><strong>{claim.duplicate_result || "—"}</strong></div>
          <div className="detail-row">
            <span>Fraud risk</span>
            <strong className={`risk-badge ${riskClass}`}>{claim.final_result ? claim.final_result.replace("_", " ") : "—"} ({claim.fraud_score ?? 0} pts)</strong>
          </div>
          <div className="detail-row">
            <span>Overall confidence score</span>
            <strong>{claim.confidence_score != null ? claim.confidence_score + "%" : "—"}</strong>
          </div>
          <div className="detail-row">
            <span>AI damage estimate</span>
            <strong>{claim.ai_damage_score != null ? claim.ai_damage_score + "% (prototype mode)" : "Not available"}</strong>
          </div>
        </div>

        <div className="detail-section">
          <h3>Report</h3>
          <button
            className="btn-download-report"
            onClick={() => {
              fetch(`${API_BASE}/claims/${id}/report`, { headers })
                .then((res) => res.blob())
                .then((blob) => {
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `claim-${id}-report.pdf`;
                  a.click();
                  window.URL.revokeObjectURL(url);
                });
            }}
          >
            Download PDF report
          </button>
        </div>

        <div className="detail-section">
          <h3>Decision</h3>
          <textarea
            placeholder="Add remarks (optional)"
            rows={3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
          <div className="action-row">
            <button className="btn-approve" disabled={actionLoading} onClick={() => handleAction("approved")}>Approve</button>
            <button className="btn-review" disabled={actionLoading} onClick={() => handleAction("manual_review")}>Manual review</button>
            <button className="btn-reject" disabled={actionLoading} onClick={() => handleAction("rejected")}>Reject</button>
          </div>
        </div>
      </div>
    </div>
  );
}









