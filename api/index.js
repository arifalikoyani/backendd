const express = require("express");
const cors = require("cors");
const htmlToPdfHandler = require("./htmltopdf");
const urlToPdfHandler = require("./urltopdf");

const app = express();

app.use(cors({ origin: "*", exposedHeaders: ["Content-Disposition"] }));
app.use(express.json({ limit: "20mb" }));

// Health endpoints
app.get("/", (req, res) => res.json({ status: "ok", message: "PDF Generator API is running!" }));
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// Route handlers for local Express server
app.all("/api/htmltopdf", htmlToPdfHandler);
app.all("/htmltopdf", htmlToPdfHandler);

app.all("/api/urltopdf", urlToPdfHandler);
app.all("/urltopdf", urlToPdfHandler);

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => console.log(`Backend server running on http://localhost:${PORT}`));
}

module.exports = app;
