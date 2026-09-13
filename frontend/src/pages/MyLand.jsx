import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Polygon } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./MyLand.css";

const API_BASE = "http://localhost:5000";

export default function MyLand() {
  const navigate = useNavigate();
  const [plots, setPlots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlots();
  }, []);

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
    } finally {
      setLoading(false);
    }
  };

  const getPolygonPositions = (geojsonStr) => {
    try {
      const geo = JSON.parse(geojsonStr);
      return geo.coordinates[0].map(([lng, lat]) => [lat, lng]);
    } catch {
      return [];
    }
  };

  const getCenter = (positions) => {
    if (positions.length === 0) return [18.6298, 73.8022];
    const lats = positions.map((p) => p[0]);
    const lngs = positions.map((p) => p[1]);
    return [(Math.min(...lats) + Math.max(...lats)) / 2, (Math.min(...lngs) + Math.max(...lngs)) / 2];
  };

  return (
    <div className="myland-shell">
      <header className="myland-header">
        <button className="back-btn" onClick={() => navigate("/dashboard")}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Dashboard
        </button>
        <span className="myland-title">My land</span>
        <span style={{ width: 90 }} />
      </header>

      <div className="myland-body">
        {loading && <p className="muted">Loading your land records...</p>}

        {!loading && plots.length === 0 && (
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <path d="M24 6L6 16v24h36V16L24 6z" stroke="#5b665c" strokeWidth="1.6" fill="none" />
            </svg>
            <h3>No land records yet</h3>
            <p>Once you report a crop loss, the matched land parcel will appear here.</p>
            <button className="btn-primary" onClick={() => navigate("/claims/new")}>Report crop loss</button>
          </div>
        )}

        {plots.map((p) => {
          const positions = getPolygonPositions(p.geojson);
          return (
            <div key={p.plot_id} className="plot-card">
              <div className="plot-map-wrap">
                <MapContainer
                  center={getCenter(positions)}
                  zoom={14}
                  style={{ height: "180px", width: "100%" }}
                  scrollWheelZoom={false}
                  dragging={false}
                  zoomControl={false}
                >
                  <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {positions.length > 0 && (
                    <Polygon positions={positions} pathOptions={{ color: "#1F4D3A", fillColor: "#C89B3C", fillOpacity: 0.25 }} />
                  )}
                </MapContainer>
              </div>
              <div className="plot-info">
                <h3>Gat No. {p.gat_number}</h3>
                <div className="plot-detail-grid">
                  <div><span>Village</span><strong>{p.village}</strong></div>
                  <div><span>Taluka</span><strong>{p.taluka}</strong></div>
                  <div><span>District</span><strong>{p.district}</strong></div>
                  <div><span>Area</span><strong>{p.area_acres} acres</strong></div>
                </div>
                <div className="plot-claims-badge">{p.claim_count} claim{p.claim_count != 1 ? "s" : ""} filed on this land</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
