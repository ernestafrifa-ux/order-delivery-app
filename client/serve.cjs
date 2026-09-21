// Tiny production static server for the built React app.
// Railway (and similar hosts) run everything as a Node process, so instead
// of relying on a platform-specific "static site" feature, we just serve
// the Vite build output ourselves.
const path = require("path");
const express = require("express");

const app = express();
const distDir = path.join(__dirname, "dist");

app.use(express.static(distDir));

// Client-side routing (React Router): any non-file request falls back to
// index.html so refreshing on e.g. /customers/3 still works.
app.get("*", (req, res) => {
  res.sendFile(path.join(distDir, "index.html"));
});

const port = process.env.PORT || 4173;
app.listen(port, () => {
  console.log(`Client static server listening on port ${port}`);
});
