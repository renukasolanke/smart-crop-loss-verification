import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import "./About.css";

export default function About() {
  const navigate = useNavigate();

  const workflowSteps = [
    { label: "Capture", icon: "camera" },
    { label: "GPS + Time", icon: "pin" },
    { label: "GIS Match", icon: "map" },
    { label: "Fraud Check", icon: "shield" },
    { label: "AI Analysis", icon: "cpu" },
    { label: "Admin Review", icon: "check" },
  ];

  const stepIcons = {
    camera: <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />,
    pin: <path d="M12 2C8 2 5 5 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-4-3-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />,
    map: <path d="M9 3L3 6v15l6-3 6 3 6-3V3l-6 3-6-3z" />,
    shield: <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" />,
    cpu: <path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3M7 7h10v10H7z" />,
    check: <path d="M20 6L9 17l-5-5" />,
  };

  return (
    <div className="about-shell">
      <header className="about-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back
        </button>
        <span className="about-title">About</span>
        <span style={{ width: 60 }} />
      </header>

      <div className="about-body">
        <div className="about-hero">
          <img src={logo} alt="Bhoomi Raksha logo" className="about-logo" />
          <h1>Bhoomi Raksha</h1>
          <p className="about-tagline">Smart Crop Loss Verification System</p>
        </div>

        <div className="workflow-card">
          <div className="workflow-title">Verification workflow</div>
          <div className="workflow-track">
            {workflowSteps.map((step, i) => (
              <div className="workflow-step" key={step.label}>
                <div className="workflow-icon-wrap">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1F4D3A" strokeWidth="1.8">
                    {stepIcons[step.icon]}
                  </svg>
                </div>
                <span className="workflow-label">{step.label}</span>
                {i < workflowSteps.length - 1 && <span className="workflow-arrow">→</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="about-grid">
          <div className="about-section">
            <div className="section-icon-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1F4D3A" strokeWidth="1.8">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <h3>What this system does</h3>
            </div>
            <p>
              Bhoomi Raksha helps farmers report crop damage using geotagged photos.
              The system automatically captures GPS location and timestamp, matches
              it against land records, checks for image tampering or duplication,
              estimates crop damage, and generates a verification report for
              insurance or government review.
            </p>
          </div>

          <div className="about-section">
            <div className="section-icon-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B6E8F" strokeWidth="1.8">
                <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" />
              </svg>
              <h3>How verification works</h3>
            </div>
            <ul className="check-list">
              <li>GPS location is matched against registered land parcels (GIS)</li>
              <li>Each photo is checked with SHA-256 hashing to detect duplicates</li>
              <li>A rule-based fraud score evaluates location, GPS accuracy, and timing</li>
              <li>Crop damage is estimated using an image-analysis prototype</li>
              <li>Weather data for the claim date and location is cross-checked</li>
              <li>An admin reviews all evidence before approving or rejecting a claim</li>
            </ul>
          </div>

          <div className="about-section disclaimer-section">
            <div className="section-icon-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8a6c1f" strokeWidth="1.8">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <h3>Important — this is a prototype</h3>
            </div>
            <ul className="check-list warn-list">
              <li>Land parcel data used is synthetic/demo data, not official government cadastral records</li>
              <li>AI crop damage and crop-type suggestions use basic color-analysis heuristics, not a trained machine learning model</li>
              <li>This system is built for academic demonstration and is not connected to any real insurance or government process</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
