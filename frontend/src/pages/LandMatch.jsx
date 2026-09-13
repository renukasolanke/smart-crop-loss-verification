import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Polygon, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "./LandMatch.css";

// Fix default marker icon paths (Leaflet + bundlers issue)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const API_BASE = "http://localhost:5000";

export default function LandMatch() {
  const navigate = useNavigate();
  const [claim, setClaim] = useState(null);
  const [status, setStatus] = useState("loading");
  const [matchData, setMatchData] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("pendingClaim");
    if (!stored) {
      navigate("/claims/new");
      return;
    }
    const parsed = JSON.parse(stored);
    setClaim(parsed);

    if (!parsed.gps) {
      setStatus("error");
      setErrorMsg("No GPS location was captured with this photo. Please retake with location enabled.");
      return;
    }

    fetchMatch(parsed.gps.latitude, parsed.gps.longitude);
  }, []);

  const fetchMatch = async (latitude, longitude) => {
    setStatus("loading");
    try {
      const res = await fetch(API_BASE + "/plots/match?latitude=" + latitude + "&longitude=" + longitude);
      const data = await res.json();
      if (data.success) {
        setMatchData(data);
        setStatus("found");
      } else {
        setStatus("error");
        setErrorMsg(data.message || "No matching land record found.");
      }
    } catch (err) {
      setStatus("error");
      setErrorMsg("Could not reach the server. Please check your connection and try again.");
    }
  };

  const handleConfirmAndSubmit = () => {
    const fullClaim = {
      ...claim,
      plot: matchData.plot,
      matchType: matchData.matchType,
    };
    sessionStorage.setItem("confirmedClaim", JSON.stringify(fullClaim));
    navigate("/claims/details");
  };

  // Convert GeoJSON polygon coords [lng, lat] to Leaflet [lat, lng]
  const getPolygonPositions = () => {
    if (!matchData?.plot?.geojson) return [];
    try {
      const geo = JSON.parse(matchData.plot.geojson);
      return geo.coordinates[0].map(([lng, lat]) => [lat, lng]);
    } catch {
      return [];
    }
  };

  return (
    <div className="match-shell">
      <header className="match-header">
        <button className="back-btn" onClick={() => navigate("/claims/new")}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back
        </button>
        <span className="match-title">Land verification</span>
        <span style={{ width: 60 }} />
      </header>

      <div className="match-body">
        {status === "loading" && (
          <div className="state-card">
            <div className="spinner" />
            <h3>Matching your location...</h3>
            <p>Checking your GPS coordinates against land records in our system.</p>
          </div>
        )}

        {status === "error" && (
          <div className="state-card error">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#B3432B" strokeWidth="1.6">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v5M12 16v.01" />
            </svg>
            <h3>Could not verify land</h3>
            <p>{errorMsg}</p>
            <button className="btn-secondary" onClick={() => navigate("/claims/new")}>Retake photo</button>
          </div>
        )}

        {status === "found" && matchData && claim.gps && (
          <>
            {matchData.matchType === "nearest" && (
              <div className="notice-banner">
                Exact plot match not found — showing the nearest registered land record for review.
              </div>
            )}

            <div className="map-wrap">
              <MapContainer
                center={[claim.gps.latitude, claim.gps.longitude]}
                zoom={15}
                style={{ height: "220px", width: "100%", borderRadius: "8px" }}
                scrollWheelZoom={false}
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[claim.gps.latitude, claim.gps.longitude]}>
                  <Popup>Your captured location</Popup>
                </Marker>
                {getPolygonPositions().length > 0 && (
                  <Polygon
                    positions={getPolygonPositions()}
                    pathOptions={{ color: "#1F4D3A", fillColor: "#C89B3C", fillOpacity: 0.2 }}
                  />
                )}
              </MapContainer>
            </div>

            <div className="match-card">
              <div className="match-card-header">
                <span className={"match-badge " + matchData.matchType}>
                  {matchData.matchType === "exact" ? "Match found" : "Nearest match"}
                </span>
              </div>

              <h2>Gat No. {matchData.plot.gat_number}</h2>

              <div className="detail-grid">
                <div className="detail-row">
                  <span>Village</span>
                  <strong>{matchData.plot.village}</strong>
                </div>
                <div className="detail-row">
                  <span>Taluka</span>
                  <strong>{matchData.plot.taluka}</strong>
                </div>
                <div className="detail-row">
                  <span>District</span>
                  <strong>{matchData.plot.district}</strong>
                </div>
                <div className="detail-row">
                  <span>Area</span>
                  <strong>{matchData.plot.area_acres} acres</strong>
                </div>
                {matchData.matchType === "nearest" && (
                  <div className="detail-row">
                    <span>Distance from your location</span>
                    <strong>{(matchData.plot.distance_m / 1000).toFixed(2)} km</strong>
                  </div>
                )}
              </div>
            </div>

            <label className="confirm-check">
              <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
              Yes, this is my land
            </label>

            <button className="btn-primary" disabled={!confirmed} onClick={handleConfirmAndSubmit}>
              Continue
            </button>
          </>
        )}
      </div>
    </div>
  );
}
