import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ClaimCamera.css";

export default function ClaimCamera() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [capturedImage, setCapturedImage] = useState(null);
  const [gps, setGps] = useState(null);
  const [gpsError, setGpsError] = useState(null);

  // Start GPS watch as soon as screen opens
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by this browser.");
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setGps({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setGpsError(null);
      },
      () => setGpsError("Unable to fetch GPS location. Please allow location permission."),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCapturedImage({
        dataUrl: reader.result,
        captureTime: new Date().toISOString(),
        gps,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleContinue = () => {
    sessionStorage.setItem("pendingClaim", JSON.stringify(capturedImage));
    navigate("/claims/land-match");
  };

  const accuracyLabel = (acc) => {
    if (acc == null) return { text: "—", cls: "" };
    if (acc <= 10) return { text: "Good", cls: "good" };
    if (acc <= 30) return { text: "Moderate", cls: "moderate" };
    return { text: "Poor", cls: "poor" };
  };

  const accInfo = accuracyLabel(gps?.accuracy);

  return (
    <div className="camera-shell">
      <header className="camera-header">
        <button className="back-btn" onClick={() => navigate("/dashboard")}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Cancel
        </button>
        <span className="camera-title">Report crop loss</span>
        <span style={{ width: 70 }} />
      </header>

      <div className="camera-body">
        {!capturedImage ? (
          <>
            <div className="gps-status-card">
              <div className="overlay-row">
                <span className={`gps-dot ${gps ? "active" : ""}`} />
                GPS: {gps ? "Active" : gpsError ? "Unavailable" : "Locating..."}
              </div>
              {gps && (
                <>
                  <div className={`overlay-row accuracy-${accInfo.cls}`}>
                    Accuracy: {gps.accuracy.toFixed(1)}m ({accInfo.text})
                  </div>
                  <div className="overlay-row">Lat: {gps.latitude.toFixed(6)}</div>
                  <div className="overlay-row">Lng: {gps.longitude.toFixed(6)}</div>
                </>
              )}
            </div>

            {gpsError && <div className="alert-banner">{gpsError}</div>}

            <div className="upload-zone" onClick={() => fileInputRef.current?.click()}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <p>Tap to capture crop photo</p>
              <span>On a phone, this opens your camera directly</span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />

            {!gps && <p className="capture-hint">Waiting for GPS lock — you can still capture, but confirm location before submitting.</p>}
          </>
        ) : (
          <div className="preview-wrap">
            <img src={capturedImage.dataUrl} alt="Captured crop" className="preview-img" />

            <div className="preview-meta">
              <div className="meta-row">
                <span>Captured at</span>
                <strong>{new Date(capturedImage.captureTime).toLocaleString("en-IN")}</strong>
              </div>
              {capturedImage.gps ? (
                <>
                  <div className="meta-row">
                    <span>Coordinates</span>
                    <strong>{capturedImage.gps.latitude.toFixed(6)}, {capturedImage.gps.longitude.toFixed(6)}</strong>
                  </div>
                  <div className="meta-row">
                    <span>GPS accuracy</span>
                    <strong>{capturedImage.gps.accuracy.toFixed(1)}m</strong>
                  </div>
                </>
              ) : (
                <div className="meta-row">
                  <span>Location</span>
                  <strong style={{ color: "#e08064" }}>Not available</strong>
                </div>
              )}
            </div>

            <div className="preview-actions">
              <button className="btn-secondary" onClick={handleRetake}>Retake</button>
              <button className="btn-primary" onClick={handleContinue}>Continue</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
