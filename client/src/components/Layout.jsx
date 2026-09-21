import { NavLink, Outlet } from "react-router-dom";

const linkStyle = ({ isActive }) => ({
  padding: "8px 14px",
  borderRadius: 8,
  textDecoration: "none",
  fontWeight: 600,
  color: isActive ? "#fff" : "#334155",
  background: isActive ? "#2563eb" : "transparent",
});

export default function Layout() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          borderBottom: "1px solid #e2e8f0",
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          gap: 24,
          background: "#fff",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <strong style={{ fontSize: 18 }}>📦 Order &amp; Delivery Tracker</strong>
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
        </nav>
      </header>
      <main style={{ flex: 1, padding: 24, background: "#f8fafc" }}>
        <Outlet />
      </main>
    </div>
  );
}
