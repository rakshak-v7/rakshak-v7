const express = require("express");
const cors    = require("cors");
const fs      = require("fs");
const path    = require("path");
 
const app = express();
 
app.use(cors());
 
// Serves index.html, style.css, script.js automatically
app.use(express.static(path.join(__dirname)));
 
// Load hotspot data (25 verified accident zones — 2024–2026)
const hotspots = JSON.parse(
  fs.readFileSync(path.join(__dirname, "hotspots.json"), "utf8")
);
 
// API — frontend fetches this
app.get("/hotspots", (req, res) => {
  res.json(hotspots);
});
 
const PORT = 5000;
app.listen(PORT, () => {
  console.log("✅ RAKSHAK v2 running at http://localhost:" + PORT);
  console.log("   📍 " + hotspots.length + " verified accident hotspots loaded.");
});
 