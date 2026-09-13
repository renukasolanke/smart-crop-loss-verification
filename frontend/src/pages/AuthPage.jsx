import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import "./AuthPage.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function AuthPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("login");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const [loginData, setLoginData] = useState({ mobile: "", password: "" });
  const [regData, setRegData] = useState({
    name: "", mobile: "", village: "", district: "", password: "",
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setMessage({ type: "success", text: "Login successful! Redirecting..." });
        setTimeout(() => navigate(data.user.role === "admin" ? "/admin" : "/dashboard"), 800);
      } else {
        setMessage({ type: "error", text: data.message || "Login failed" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Could not reach server. Is the backend running?" });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...regData, role: "farmer" }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: "Account created! You can sign in now." });
        setTab("login");
      } else {
        setMessage({ type: "error", text: data.message || "Registration failed" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Could not reach server. Is the backend running?" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shell">
      <div className="panel-left">
        <div className="brand">
          <img src={logo} alt="Bhoomi Raksha logo" className="brand-logo" />
          Bhoomi Raksha
        </div>

        <div className="hero-copy">
          <h1>Your field, your proof, your claim — verified in one place.</h1>
          <p>Capture your damaged crop with your phone. We match your location to your land record and build the evidence your claim needs.</p>
        </div>

        <div className="field-note">
          <div><strong>2.4 acre</strong>Average plot verified</div>
          <div><strong>Gat 145</strong>Matched in seconds</div>
          <div><strong>91%</strong>Verification confidence</div>
        </div>
      </div>

      <div className="panel-right">
        <div className="form-card">
          <div className="eyebrow">Smart Crop Loss Verification</div>

          <div className="tabs">
            <button className={`tab ${tab === "login" ? "active" : ""}`} onClick={() => { setTab("login"); setMessage(null); }}>
              Sign in
            </button>
            <button className={`tab ${tab === "register" ? "active" : ""}`} onClick={() => { setTab("register"); setMessage(null); }}>
              Create account
            </button>
          </div>

          {message && <div className={`alert ${message.type}`}>{message.text}</div>}

          {tab === "login" ? (
            <form onSubmit={handleLogin}>
              <h2>Welcome back</h2>
              <div className="field-group">
                <label htmlFor="login-mobile">Mobile number</label>
                <input id="login-mobile" type="tel" maxLength={10} placeholder="98765 43210"
                  value={loginData.mobile}
                  onChange={(e) => setLoginData({ ...loginData, mobile: e.target.value })}
                  required />
              </div>
              <div className="field-group">
                <label htmlFor="login-password">Password</label>
                <input id="login-password" type="password" placeholder="Enter your password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required />
              </div>
              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </button>
              <div className="switch-line">
                New to Bhoomi Raksha? <button type="button" onClick={() => setTab("register")}>Create an account</button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <h2>Register your account</h2>
              <div className="field-group">
                <label htmlFor="reg-name">Full name</label>
                <input id="reg-name" type="text" placeholder="As on your land record"
                  value={regData.name}
                  onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                  required />
              </div>
              <div className="field-group">
                <label htmlFor="reg-mobile">Mobile number</label>
                <input id="reg-mobile" type="tel" maxLength={10} placeholder="98765 43210"
                  value={regData.mobile}
                  onChange={(e) => setRegData({ ...regData, mobile: e.target.value })}
                  required />
              </div>
              <div className="field-row">
                <div className="field-group">
                  <label htmlFor="reg-village">Village</label>
                  <input id="reg-village" type="text" placeholder="Village name"
                    value={regData.village}
                    onChange={(e) => setRegData({ ...regData, village: e.target.value })} />
                </div>
                <div className="field-group">
                  <label htmlFor="reg-district">District</label>
                  <input id="reg-district" type="text" placeholder="District name"
                    value={regData.district}
                    onChange={(e) => setRegData({ ...regData, district: e.target.value })} />
                </div>
              </div>
              <div className="field-group">
                <label htmlFor="reg-password">Password</label>
                <input id="reg-password" type="password" placeholder="At least 8 characters"
                  value={regData.password}
                  onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                  required minLength={8} />
              </div>
              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? "Creating account..." : "Create account"}
              </button>
              <div className="switch-line">
                Already registered? <button type="button" onClick={() => setTab("login")}>Sign in instead</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}


