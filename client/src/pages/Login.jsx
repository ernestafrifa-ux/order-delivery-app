import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "../api/client";
import logo from "../assets/bengazy-logo.jpg";

export default function Login({ onSignedIn }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.login(username, password, rememberMe);
      onSignedIn();
      const dest = location.state?.from || "/";
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(180deg, #0a2a5e 0%, #0d3b7a 45%, #0a2a5e 100%)",
        padding: 16,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: "#fff",
          borderRadius: 20,
          padding: "36px 32px",
          width: 380,
          boxShadow: "0 1px 3px rgba(0,0,0,0.15), 0 12px 32px rgba(0,0,0,0.3)",
          textAlign: "center",
        }}
      >
        <img
          src={logo}
          alt="Bengazy Shipping"
          style={{
            width: 96,
            height: 96,
            objectFit: "contain",
            margin: "0 auto 14px",
            display: "block",
          }}
        />
        <h1 style={{ margin: 0, fontSize: 24, fontFamily: "Georgia, serif", color: "#0a2a5e", letterSpacing: 0.3 }}>
          Bengazy Shipping
        </h1>
        <p style={{ color: "#c9a227", marginTop: 4, marginBottom: 4, fontSize: 13, fontWeight: 700, letterSpacing: 0.4 }}>
          YOUR GOODS, OUR RESPONSIBILITY
        </p>
        <p style={{ color: "#78716c", marginTop: 10, marginBottom: 26, fontSize: 14 }}>
          Sign in to manage orders &amp; deliveries
        </p>

        {error && (
          <div
            style={{
              background: "#fef2f2",
              color: "#b91c1c",
              borderRadius: 10,
              padding: "8px 12px",
              fontSize: 13,
              marginBottom: 16,
              textAlign: "left",
            }}
          >
            {error}
          </div>
        )}

        <input
          type="text"
          placeholder="Enter your Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
          style={inputStyle}
        />

        <div style={{ position: "relative", marginTop: 12 }}>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter your Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            style={{ ...inputStyle, marginTop: 0, paddingRight: 40 }}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            style={{
              position: "absolute",
              right: 4,
              top: "50%",
              transform: "translateY(-50%)",
              border: "none",
              background: "none",
              cursor: "pointer",
              fontSize: 16,
              padding: "4px 8px",
              color: "#78716c",
            }}
          >
            {showPassword ? "🙈" : "👁"}
          </button>
        </div>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            color: "#44403c",
            marginTop: 16,
            marginBottom: 24,
            justifyContent: "flex-start",
          }}
        >
          <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
          Keep me signed in
        </label>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px 0",
            borderRadius: 999,
            border: "none",
            background: "#0a2a5e",
            color: "#fff",
            fontWeight: 600,
            fontSize: 15,
            cursor: "pointer",
          }}
        >
          {loading ? "Signing in…" : "Log in"}
        </button>
      </form>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 999,
  border: "1px solid #e7e2d8",
  background: "#faf8f3",
  fontSize: 14,
  marginTop: 0,
};
