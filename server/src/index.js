const express = require("express");
const cors = require("cors");
require("./db"); // ensures schema is created on boot

const { requireAuth } = require("./auth");
const authRouter = require("./routes/auth");
const customersRouter = require("./routes/customers");
const ordersRouter = require("./routes/orders");
const dashboardRouter = require("./routes/dashboard");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true }));
app.use("/api/auth", authRouter);

// Everything below this line requires a signed-in session.
app.use("/api/customers", requireAuth, customersRouter);
app.use("/api/orders", requireAuth, ordersRouter);
app.use("/api/dashboard", requireAuth, dashboardRouter);

// Basic error handler so a bad request doesn't crash the server.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Order & delivery API listening on http://localhost:${PORT}`);
});
