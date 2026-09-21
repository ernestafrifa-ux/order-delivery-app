const express = require("express");
const db = require("../db");
const { hashPassword } = require("../passwords");

const router = express.Router();

// Never return password_hash to the client.
function loadUsers() {
  return db.prepare("SELECT id, username, created_at FROM users ORDER BY username COLLATE NOCASE").all();
}

router.get("/", (req, res) => {
  res.json(loadUsers());
});

router.post("/", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !username.trim()) return res.status(400).json({ error: "Username is required" });
  if (!password || password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }
  const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(username.trim());
  if (existing) return res.status(409).json({ error: "That username is already taken" });

  db.prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)").run(
    username.trim(),
    hashPassword(password)
  );
  res.status(201).json(loadUsers());
});

router.delete("/:id", (req, res) => {
  const { count } = db.prepare("SELECT COUNT(*) AS count FROM users").get();
  if (count <= 1) {
    return res.status(400).json({ error: "Can't delete the last remaining account" });
  }
  const existing = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "User not found" });
  db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
  res.json(loadUsers());
});

module.exports = router;
