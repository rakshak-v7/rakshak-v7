# 🛡️ RAKSHAK v7 — Hyderabad Road Safety Intelligence Platform

## Quick Start

```bash
npm install
npm start
# Open http://localhost:5000
```

## Features (v7)
- 🗺️ Interactive Leaflet Map with 25 accident hotspot markers
- 🤖 v7 AI Risk Score Formula (10 steps, real-time)
- 🔥 Live Heatmap Toggle — animated concentric risk rings
- 📊 SVG Speed Radar Gauge — animated needle on every search
- 🔀 Route Comparison Mode — 4th tab, 2 routes × 4 time windows
- 🤖 AI Safety Briefing Panel — dynamic per score band
- 📤 Share Route Card — copy safety summary
- 🚨 Proximity Alert — real-time typing detection
- ⚡ Quick Route Chips — one-click preset routes
- ⌨️ Keyboard Shortcuts — Ctrl+Enter / Esc / Ctrl+K / Ctrl+B
- 🌐 5-Language Support — English, Hindi, Telugu, Tamil, Kannada
- 📥 Export to XLS (CSV)
- 🚨 SOS Emergency Button → 112

## Files
| File | Description |
|------|-------------|
| `index.html` | Main UI — all tabs, map, risk card |
| `style.css` | CSS variables, dark mode, responsive layout |
| `script.js` | Full v7 JavaScript — all features |
| `server.js` | Express backend — serves hotspots API |
| `hotspots.json` | 25 verified accident black spots |

## Formula v7
Proximity scan → Density normalise → Gaussian time mult → Zone bonus
→ Congestion bonus → Day factor → Holiday factor → Sinuosity v2
→ Live weather (Open-Meteo) → Clamp [15, 100]

## Data Sources
- TSCTSL Traffic Incident Database
- ACCO National Report 2024
- NH-65 Accident Records
- The Hindu ORR Safety Audit 2025
- Times of India IT Corridor Report 2024–2026
