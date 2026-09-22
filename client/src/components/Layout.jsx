import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import logo from "../assets/bengazy-logo.jpg";

const linkStyle = ({ isActive }) => ({
  padding: "8px 14px",
  borderRadius: 8,
  textDecoration: "none",
  fontWeight: 600,
  color: isActive ? "#fff" : "#e2e8f0",
  background: isActive ? "#c9a227" : "transparent",
});

export default function Layout({ onSignOut }) {
  const navigate = useNavigate();

  function handleSignOut() {
    api.logout();
    onSignOut?.();
    navigate("/login", { replace: true });
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          borderBottom: "3px solid #c9a227",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          gap: 24,
          background: "#0a2a5e",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={logo} alt="Bengazy Shipping" style={{ width: 36, height: 36, objectFit: "contain" }} />
          <div style={{ lineHeight: 1.15 }}>
            <strong style={{ fontSize: 16, color: "#fff", fontFamily: "Georgia, serif" }}>Bengazy Shipping</strong>
            <div style={{ fontSize: 10, color: "#c9a227", fontWeight: 700, letterSpacing: 0.4 }}>
              YOUR GOODS, OUR RESPONSIBILITY
            </div>
          </div>
        </div>
        <nav style={{ display: "flex", gap: 6 }}>
          <NavLink to="/" end style={linkStyle}>
            Dashboard
          </NavLink>
          <NavLink to="/customers" style={linkStyle}>
            Customers
          </NavLink>
          <NavLink to="/orders" style={linkStyle}>
            Orders &amp; Delivery
          </NavLink>
          <NavLink to="/users" style={linkStyle}>
            Users
          </NavLink>
        </nav>
        <button
          onClick={handleSignOut}
          style={{
            marginLeft: "auto",
            fontSize: 13,
            color: "#fff",
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.35)",
            borderRadius: 8,
            padding: "6px 12px",
            cursor: "pointer",
          }}
        >
          Sign out
        </button>
      </header>
      <main style={{ flex: 1, padding: 24, background: "#f8fafc" }}>
        <Outlet />
      </main>
    </div>
  );
}
