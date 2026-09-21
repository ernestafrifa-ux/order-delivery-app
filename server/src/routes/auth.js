const express = require("express");
const { issueToken, checkCredentials, requireAuth } = require("../auth");

const router = express.Router();

router.post("/login", (req, res) => {
  const { username, password, rememberMe } = req.body || {};
  if (!checkCredentials(username, password)) {
    return res.status(401).json({ error: "Incorrect username or password" });
  }
  const token = issueToken(username, !!rememberMe);
  res.json({ token });
});

// Lets the frontend check on load whether a stored token is still valid.
router.get("/me", requireAuth, (req, res) => {
  res.json({ username: req.user.username });
});

module.exports = router;
