import { useEffect, useState } from "react";
import { api } from "../api/client";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ username: "", password: "" });
  const [saving, setSaving] = useState(false);

  function load() {
    api.getUsers().then(setUsers).catch((e) => setError(e.message));
  }

  useEffect(load, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    if (!form.username.trim() || !form.password) return;
    setSaving(true);
    try {
      const updated = await api.createUser({ username: form.username.trim(), password: form.password });
      setUsers(updated);
      setForm({ username: "", password: "" });
      setShowForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(u) {
    if (!confirm(`Remove "${u.username}"'s access to this app?`)) return;
    setError("");
    try {
      const updated = await api.deleteUser(u.id);
      setUsers(updated);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0 }}>Users</h1>
          <p style={{ color: "#64748b", marginTop: 4 }}>Everyone who can sign in to this app.</p>
        </div>
        <button onClick={() => setShowForm((v) => !v)}>{showForm ? "Cancel" : "+ New User"}</button>
      </div>

      {error && <p style={{ color: "#b91c1c" }}>{error}</p>}

      {showForm && (
        <form
          onSubmit={handleCreate}
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 10,
          }}
        >
          <input
            placeholder="Username *"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
            autoComplete="off"
          />
          <input
            type="password"
            placeholder="Password (min 6 characters) *"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            minLength={6}
            autoComplete="new-password"
          />
          <button type="submit" disabled={saving} style={{ gridColumn: "1 / -1", justifySelf: "start" }}>
            {saving ? "Creating…" : "Create User"}
          </button>
        </form>
      )}

      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", textAlign: "left" }}>
              <th style={th}>Username</th>
              <th style={th}>Created</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderTop: "1px solid #eef2f7" }}>
                <td style={td}>{u.username}</td>
                <td style={td}>{u.created_at}</td>
                <td style={{ ...td, whiteSpace: "nowrap", textAlign: "right" }}>
                  <button
                    onClick={() => handleDelete(u)}
                    disabled={users.length <= 1}
                    title={users.length <= 1 ? "Can't remove the last remaining account" : ""}
                    style={{ ...btnSm, color: users.length <= 1 ? "#94a3b8" : "#b91c1c" }}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td style={td} colSpan={3}>
                  No users yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const th = { padding: "10px 14px", fontSize: 13, color: "#475569" };
const td = { padding: "10px 14px", fontSize: 14 };
const btnSm = { fontSize: 12, padding: "3px 8px" };
