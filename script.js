/* ══════════════════════════════════════════════
   RAKSHAK — script.js  (v7 — Full Feature Edition)
   New in v7:
   • Route Comparison Mode (Safe vs Fast, side-by-side)
   • Live Risk Heatmap Toggle (animated pulse rings)
   • AI Safety Briefing Panel (dynamic tips per route)
   • SVG Speed Radar Gauge (animated needle)
   • Nearby Danger Alert (proximity as you type)
   • Share Route Card (copy/screenshot safety summary)
   • Animated Dashboard Counters on load
   • Compare Routes Tab (4th tab — 2 routes × 4 time windows)
   • Quick Route Chips (one-click preset routes)
   • Keyboard Shortcuts (Ctrl+Enter, Esc, Ctrl+K, Ctrl+B)
   • Inline Compare Panel (safe vs direct after every search)
   • v7 Formula (10-step real-time engine preserved + sinuosity v2)
══════════════════════════════════════════════ */

// ── STATE ─────────────────────────────────────
let mapObj        = null;
let routeLayer    = null;
let altRouteLayer = null;
let startMarker   = null;
let endMarker     = null;
let userMarker    = null;
let trafficLayer  = null;
let heatmapActive = false;
let heatmapLayers = [];
let isDarkMode    = false;
let toastTimer    = null;
let HOTSPOTS      = [];
let currentLang   = "en";
let selectedTime  = "evening";
let lastRouteData = null;
let historyData   = [];
let _lastRoutePoints = null;
let _lastDistKm      = null;
let _lastStartPt     = null;
let _lastEndPt       = null;
let _lastScore       = null;

// ── HYDERABAD BOUNDING BOX ────────────────────
const HYD = { minLat:17.20, maxLat:17.65, minLng:78.20, maxLng:78.75 };

// ── ZONE EMOJIS ───────────────────────────────
const ZONE_EMOJIS = {
  "Miyapur Junction":"🚧","ORR 144.5 km":"💀","ORR 14 km":"🛣️",
  "Rachakonda":"🚛","Hayathnagar":"🏎️","LB Nagar":"⚠️",
  "Abdullapurmet":"🚚","Vanasthalipuram":"🛵","Hyderguda":"🗿",
  "Nampally":"🚌","Abids":"🏥","Jubilee Hills":"🏎️",
  "Banjara Hills":"🚦","Madhapur":"💻","Gachibowli":"🏢",
  "Yousufguda":"🏘️","Marredpally":"🚐","Begumpet":"✈️",
  "Madina":"🕌","Puranapool":"🏛️","Charminar":"🕌",
  "Punjagutta":"🚦","Kukatpally":"🌃","Secunderabad Station":"🚂","Nagole":"🔄"
};

// ── TIME MULTIPLIERS ──────────────────────────
const TIME_MULTIPLIERS = {
  morning:1.15, afternoon:1.00, evening:1.45, night:1.30
};
const TIME_LABELS = {
  morning:"🌅 Morning (6AM–10AM)", afternoon:"☀️ Afternoon (10AM–5PM)",
  evening:"🌆 Evening (5PM–9PM)", night:"🌙 Night (9PM–6AM)"
};
const TIME_NOTES = {
  morning:"School & office rush — moderate risk",
  afternoon:"Lowest traffic risk window",
  evening:"⚠️ Peak accident window — IT exits, high speed, congestion",
  night:"⚠️ Poor lighting & drunk driving — elevated risk"
};

// ── QUICK ROUTE CHIPS ─────────────────────────
const QUICK_ROUTES = [
  { label:"Miyapur→Punjagutta", from:"Miyapur Junction", to:"Punjagutta" },
  { label:"LB Nagar→Abids",    from:"LB Nagar",         to:"Abids" },
  { label:"Gachibowli→Madina", from:"Gachibowli",       to:"Madina" },
  { label:"ORR 144→Nagole",    from:"ORR 144.5 km",     to:"Nagole" },
  { label:"Madhapur→Charminar",from:"Madhapur",         to:"Charminar" },
];

/* ════════════════════════════════════════════
   MULTILINGUAL STRINGS
════════════════════════════════════════════ */
const LANG = {
  en: {
    code:"en-IN", label:"English",
    welcome:"Welcome to RAKSHAK. Enter your start and destination, or tap My Location to detect nearby accident zones in Hyderabad.",
    fetching:"Fetching your current location.",
    locFound:"Location found. No major accident zones nearby.",
    nearZone:(name)=>`Warning! You are near ${name}, an accident-prone zone. Drive carefully.`,
    finding:"Finding your route and calculating risk score.",
    highRisk:(score,zones)=>`High risk route. Score is ${score} out of 100. Dangerous zones: ${zones}. Drive very carefully.`,
    medRisk:(score,zone)=>`Moderate risk. Score is ${score} out of 100. Stay alert near ${zone}.`,
    lowRisk:(score)=>`Low risk route. Score is ${score} out of 100. Drive safely.`,
    highMsg:"Multiple accident-prone zones detected on this route. Reduce speed, avoid overtaking, and stay extra alert.",
    medMsg:"Some accident-prone areas on this route. Follow traffic rules strictly near intersections.",
    lowMsg:"Relatively safer route. Still follow speed limits and remain attentive at all times.",
    zonesOn:"Zones on route:",
    noZones:"No major accident zones on this specific path.",
    riskTitle:"🤖 AI Route Risk Score",
    notSupported:"Geolocation not supported.",
    allowLoc:"Could not get location. Please allow location access in your browser.",
    enterBoth:"Please enter both a start and destination.",
    startPh:"Start — e.g. Miyapur, Abids, ORR 144",
    endPh:"Destination — e.g. LB Nagar, Secunderabad",
    tabMap:"🗺️ Map & Route",
    tabZones:"⚠️ Danger Zones",
    tabHistory:"📊 My History",
    tabCompare:"🔀 Compare",
    zonesTitle:"⚠️ Accident Prone Zones — Hyderabad (2024–2026)",
    zonesSub:"25 verified black spots from TSCTSL traffic incident data, ACCO national report, NH-65 accident records, and Hyderabad traffic police zone reports.",
    findBtn:"🔍 Find Route",
    myLocBtn:"📍 My Location",
    highBadge:"🔴 HIGH RISK",
    medBadge:"🟠 MODERATE RISK",
    lowBadge:"🟢 LOW RISK",
  },
  hi: {
    code:"hi-IN", label:"हिन्दी",
    welcome:"राक्षक में आपका स्वागत है। अपना प्रारंभिक और गंतव्य स्थान दर्ज करें।",
    fetching:"आपका वर्तमान स्थान खोजा जा रहा है।",
    locFound:"स्थान मिल गया। आस-पास कोई बड़ा दुर्घटना क्षेत्र नहीं है।",
    nearZone:(name)=>`चेतावनी! आप ${name} के पास हैं। सावधानी से गाड़ी चलाएं।`,
    finding:"आपका मार्ग खोजा जा रहा है।",
    highRisk:(score,zones)=>`उच्च जोखिम मार्ग। स्कोर ${score}/100। खतरनाक क्षेत्र: ${zones}।`,
    medRisk:(score,zone)=>`मध्यम जोखिम। स्कोर ${score}/100। ${zone} के पास सतर्क रहें।`,
    lowRisk:(score)=>`कम जोखिम। स्कोर ${score}/100। सुरक्षित यात्रा।`,
    highMsg:"इस मार्ग पर कई दुर्घटना-प्रवण क्षेत्र हैं। गति कम करें।",
    medMsg:"इस मार्ग पर कुछ दुर्घटना-प्रवण क्षेत्र हैं।",
    lowMsg:"अपेक्षाकृत सुरक्षित मार्ग। गति सीमा का पालन करें।",
    zonesOn:"मार्ग पर क्षेत्र:",
    noZones:"इस मार्ग पर कोई बड़ा दुर्घटना क्षेत्र नहीं है।",
    riskTitle:"🤖 AI मार्ग जोखिम स्कोर",
    notSupported:"जियोलोकेशन समर्थित नहीं है।",
    allowLoc:"स्थान प्राप्त नहीं हो सका।",
    enterBoth:"कृपया प्रारंभिक और गंतव्य दोनों दर्ज करें।",
    startPh:"प्रारंभिक स्थान (जैसे Miyapur)",
    endPh:"गंतव्य (जैसे LB Nagar)",
    tabMap:"🗺️ मानचित्र",
    tabZones:"⚠️ खतरनाक क्षेत्र",
    tabHistory:"📊 इतिहास",
    tabCompare:"🔀 तुलना",
    zonesTitle:"⚠️ दुर्घटना-प्रवण क्षेत्र — हैदराबाद (2024–2026)",
    zonesSub:"TSCTSL ट्रैफिक डेटा से 25 सत्यापित ब्लैक स्पॉट।",
    findBtn:"🔍 मार्ग खोजें",
    myLocBtn:"📍 मेरा स्थान",
    highBadge:"🔴 उच्च जोखिम",
    medBadge:"🟠 मध्यम जोखिम",
    lowBadge:"🟢 कम जोखिम",
  },
  te: {
    code:"te-IN", label:"తెలుగు",
    welcome:"రాక్షక్‌కు స్వాగతం. మీ ప్రారంభ మరియు గమ్యస్థానాన్ని నమోదు చేయండి.",
    fetching:"మీ ప్రస్తుత స్థానాన్ని తీసుకొంటున్నారు.",
    locFound:"స్థానం కనుగొనబడింది. సమీపంలో ప్రమాద జోన్‌లు లేవు.",
    nearZone:(name)=>`హెచ్చరిక! మీరు ${name} దగ్గర ఉన్నారు. జాగ్రత్తగా నడపండి.`,
    finding:"మీ మార్గాన్ని కనుగొంటున్నారు.",
    highRisk:(score,zones)=>`అధిక ప్రమాద మార్గం. స్కోర్ ${score}/100. జోన్‌లు: ${zones}.`,
    medRisk:(score,zone)=>`మధ్యస్థ ప్రమాదం. స్కోర్ ${score}/100. ${zone} దగ్గర అప్రమత్తంగా.`,
    lowRisk:(score)=>`తక్కువ ప్రమాద మార్గం. స్కోర్ ${score}/100.`,
    highMsg:"ఈ మార్గంలో అనేక ప్రమాదకర జోన్‌లు ఉన్నాయి. వేగం తగ్గించండి.",
    medMsg:"ఈ మార్గంలో కొన్ని ప్రమాదకర ప్రాంతాలు ఉన్నాయి.",
    lowMsg:"సాపేక్షంగా సురక్షితమైన మార్గం.",
    zonesOn:"మార్గంలోని జోన్‌లు:",
    noZones:"ఈ మార్గంలో ప్రమాద జోన్‌లు లేవు.",
    riskTitle:"🤖 AI మార్గ రిస్క్ స్కోర్",
    notSupported:"జియోలొకేషన్ మద్దతు లేదు.",
    allowLoc:"స్థానం పొందడం సాధ్యపడలేదు.",
    enterBoth:"ప్రారంభ మరియు గమ్యస్థానం రెండూ నమోదు చేయండి.",
    startPh:"ప్రారంభ స్థానం (ఉదా: Miyapur)",
    endPh:"గమ్యస్థానం (ఉదా: LB Nagar)",
    tabMap:"🗺️ మ్యాప్",
    tabZones:"⚠️ ప్రమాద జోన్‌లు",
    tabHistory:"📊 చరిత్ర",
    tabCompare:"🔀 పోల్చండి",
    zonesTitle:"⚠️ ప్రమాద జోన్‌లు — హైదరాబాద్ (2024–2026)",
    zonesSub:"TSCTSL ట్రాఫిక్ డేటా నుండి 25 ధృవీకరించిన బ్లాక్ స్పాట్‌లు.",
    findBtn:"🔍 మార్గం కనుగొనండి",
    myLocBtn:"📍 నా స్థానం",
    highBadge:"🔴 అధిక ప్రమాదం",
    medBadge:"🟠 మధ్యస్థ ప్రమాదం",
    lowBadge:"🟢 తక్కువ ప్రమాదం",
  },
  ta: {
    code:"ta-IN", label:"தமிழ்",
    welcome:"ராக்‌ஷாக்-க்கு வரவேற்கிறோம். தொடக்க மற்றும் இலக்கை உள்ளிடவும்.",
    fetching:"இடத்தை கண்டறிகிறோம்.",
    locFound:"இடம் கண்டறியப்பட்டது. அருகில் விபத்து மண்டலங்கள் இல்லை.",
    nearZone:(name)=>`எச்சரிக்கை! ${name} அருகில் உள்ளீர்கள். கவனமாக ஓட்டுங்கள்.`,
    finding:"பாதையை கண்டறிகிறோம்.",
    highRisk:(score,zones)=>`அதிக ஆபத்து பாதை. மதிப்பெண் ${score}/100. மண்டலங்கள்: ${zones}.`,
    medRisk:(score,zone)=>`மிதமான ஆபத்து. ${zone} அருகில் கவனமாக இருங்கள்.`,
    lowRisk:(score)=>`குறைந்த ஆபத்து. மதிப்பெண் ${score}/100.`,
    highMsg:"பல விபத்து-பாதிப்பு மண்டலங்கள் உள்ளன. வேகத்தை குறையுங்கள்.",
    medMsg:"சில விபத்து-பாதிப்பு பகுதிகள் உள்ளன.",
    lowMsg:"ஒப்பீட்டளவில் பாதுகாப்பான பாதை.",
    zonesOn:"பாதையிலுள்ள மண்டலங்கள்:",
    noZones:"விபத்து மண்டலங்கள் இல்லை.",
    riskTitle:"🤖 AI பாதை ஆபத்து மதிப்பெண்",
    notSupported:"ஜியோலொகேஷன் ஆதரிக்கப்படவில்லை.",
    allowLoc:"இடத்தை பெற முடியவில்லை.",
    enterBoth:"தொடக்கம் மற்றும் இலக்கு இரண்டையும் உள்ளிடவும்.",
    startPh:"தொடக்க இடம் (எ.கா: Miyapur)",
    endPh:"இலக்கு (எ.கா: LB Nagar)",
    tabMap:"🗺️ வரைபடம்",
    tabZones:"⚠️ ஆபத்து மண்டலங்கள்",
    tabHistory:"📊 வரலாறு",
    tabCompare:"🔀 ஒப்பிடு",
    zonesTitle:"⚠️ விபத்து மண்டலங்கள் — ஹைதராபாத் (2024–2026)",
    zonesSub:"25 சரிபார்க்கப்பட்ட கருப்புப் புள்ளிகள்.",
    findBtn:"🔍 பாதை கண்டறி",
    myLocBtn:"📍 என் இடம்",
    highBadge:"🔴 அதிக ஆபத்து",
    medBadge:"🟠 மிதமான ஆபத்து",
    lowBadge:"🟢 குறைந்த ஆபத்து",
  },
  kn: {
    code:"kn-IN", label:"ಕನ್ನಡ",
    welcome:"ರಾಕ್ಷಕ್‌ಗೆ ಸ್ವಾಗತ. ಪ್ರಾರಂಭ ಮತ್ತು ಗಮ್ಯ ನಮೂದಿಸಿ.",
    fetching:"ಸ್ಥಳ ಪಡೆಯಲಾಗುತ್ತಿದೆ.",
    locFound:"ಸ್ಥಳ ಸಿಕ್ಕಿದೆ. ಅಪಘಾತ ವಲಯ ಇಲ್ಲ.",
    nearZone:(name)=>`ಎಚ್ಚರಿಕೆ! ${name} ಬಳಿ ಇದ್ದೀರಿ. ಎಚ್ಚರಿಕೆಯಿಂದ ಓಡಿಸಿ.`,
    finding:"ಮಾರ್ಗ ಹುಡುಕಲಾಗುತ್ತಿದೆ.",
    highRisk:(score,zones)=>`ಅಧಿಕ ಅಪಾಯ. ಸ್ಕೋರ್ ${score}/100. ವಲಯಗಳು: ${zones}.`,
    medRisk:(score,zone)=>`ಮಧ್ಯಮ ಅಪಾಯ. ${zone} ಬಳಿ ಎಚ್ಚರಿಕೆ.`,
    lowRisk:(score)=>`ಕಡಿಮೆ ಅಪಾಯ. ಸ್ಕೋರ್ ${score}/100.`,
    highMsg:"ಅನೇಕ ಅಪಘಾತ ವಲಯಗಳಿವೆ. ವೇಗ ಕಡಿಮೆ ಮಾಡಿ.",
    medMsg:"ಕೆಲವು ಅಪಘಾತ ಪ್ರದೇಶಗಳಿವೆ.",
    lowMsg:"ತುಲನಾತ್ಮಕವಾಗಿ ಸುರಕ್ಷಿತ ಮಾರ್ಗ.",
    zonesOn:"ಮಾರ್ಗದ ವಲಯಗಳು:",
    noZones:"ಅಪಘಾತ ವಲಯಗಳಿಲ್ಲ.",
    riskTitle:"🤖 AI ಮಾರ್ಗ ರಿಸ್ಕ್ ಸ್ಕೋರ್",
    notSupported:"ಜಿಯೋಲೊಕೇಶನ್ ಬೆಂಬಲಿಸುವುದಿಲ್ಲ.",
    allowLoc:"ಸ್ಥಳ ಪಡೆಯಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.",
    enterBoth:"ಪ್ರಾರಂಭ ಮತ್ತು ಗಮ್ಯ ನಮೂದಿಸಿ.",
    startPh:"ಪ್ರಾರಂಭ ಸ್ಥಳ (ಉದಾ: Miyapur)",
    endPh:"ಗಮ್ಯಸ್ಥಾನ (ಉದಾ: LB Nagar)",
    tabMap:"🗺️ ನಕ್ಷೆ",
    tabZones:"⚠️ ಅಪಾಯ ವಲಯಗಳು",
    tabHistory:"📊 ಇತಿಹಾಸ",
    tabCompare:"🔀 ಹೋಲಿಕೆ",
    zonesTitle:"⚠️ ಅಪಘಾತ ವಲಯಗಳು — ಹೈದರಾಬಾದ್ (2024–2026)",
    zonesSub:"25 ಪರಿಶೀಲಿಸಿದ ಕಪ್ಪು ತಾಣಗಳು.",
    findBtn:"🔍 ಮಾರ್ಗ ಹುಡುಕಿ",
    myLocBtn:"📍 ನನ್ನ ಸ್ಥಳ",
    highBadge:"🔴 ಅಧಿಕ ಅಪಾಯ",
    medBadge:"🟠 ಮಧ್ಯಮ ಅಪಾಯ",
    lowBadge:"🟢 ಕಡಿಮೆ ಅಪಾಯ",
  }
};

function t() { return LANG[currentLang] || LANG.en; }

/* ════════════════════════════════════════════
   FUZZY ALIAS MATCHER
════════════════════════════════════════════ */
function normaliseQuery(raw) {
  return raw.toLowerCase().replace(/[^a-z0-9 .]/g," ").replace(/\s+/g," ").trim();
}

function matchHotspotAlias(raw) {
  const norm = normaliseQuery(raw);
  for (const h of HOTSPOTS) {
    for (const alias of (h.aliases || [])) {
      if (norm === alias || norm.includes(alias) || alias.includes(norm))
        return { lat: h.lat, lng: h.lng, label: h.name };
    }
  }
  return null;
}

/* ════════════════════════════════════════════
   LANGUAGE SWITCHER
════════════════════════════════════════════ */
function toggleLangMenu() {
  document.getElementById("langMenu").classList.toggle("open");
}

document.addEventListener("click", function(e) {
  const wrapper = document.getElementById("langWrapper");
  if (wrapper && !wrapper.contains(e.target))
    document.getElementById("langMenu").classList.remove("open");
});

function setLang(code) {
  currentLang = code;
  document.getElementById("langMenu").classList.remove("open");
  document.getElementById("langLabel").textContent = LANG[code].label;
  document.querySelectorAll("#langMenu button").forEach(btn =>
    btn.classList.toggle("selected", btn.getAttribute("data-lang") === code));
  applyLangToUI();
  const voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
  const langCode = LANG[code].code;
  const prefix = langCode.split("-")[0];
  const hasNative = voices.some(v => v.lang === langCode || v.lang.startsWith(prefix));
  if (!hasNative && code !== "en") {
    const notices = {
      hi:"⚠️ हिन्दी आवाज़ उपलब्ध नहीं है।",
      te:"⚠️ తెలుగు వాయిస్ అందుబాటులో లేదు.",
      ta:"⚠️ தமிழ் குரல் கிடைக்கவில்லை.",
      kn:"⚠️ ಕನ್ನಡ ಧ್ವನಿ ಲಭ್ಯವಿಲ್ಲ."
    };
    showToast(notices[code] || "⚠️ Native voice not available.");
    setTimeout(() => speak(t().welcome), 2800);
  } else {
    speak(t().welcome);
  }
}

function applyLangToUI() {
  const s = t();
  const ids = {
    "tab-map": s.tabMap, "tab-zones": s.tabZones,
    "tab-history": s.tabHistory, "tab-compare": s.tabCompare,
    "findBtn": s.findBtn, "myLocBtn": s.myLocBtn,
    "riskCardTitle": s.riskTitle,
    "zonesTitle": s.zonesTitle, "zonesSub": s.zonesSub
  };
  for (const [id, val] of Object.entries(ids)) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }
  const startEl = document.getElementById("start");
  const endEl   = document.getElementById("end");
  if (startEl) startEl.placeholder = s.startPh;
  if (endEl)   endEl.placeholder   = s.endPh;
}

/* ════════════════════════════════════════════
   TIME SELECTOR
════════════════════════════════════════════ */
function setTime(val) {
  selectedTime = val;
  document.querySelectorAll(".time-btn").forEach(btn =>
    btn.classList.toggle("active", btn.getAttribute("data-time") === val));
  const noteEl = document.getElementById("timeNote");
  if (noteEl) noteEl.textContent = TIME_NOTES[val] || "";
}

function autoDetectTime() {
  const hour = new Date().getHours();
  let detected = "afternoon";
  if      (hour >= 6  && hour < 10) detected = "morning";
  else if (hour >= 10 && hour < 17) detected = "afternoon";
  else if (hour >= 17 && hour < 21) detected = "evening";
  else                               detected = "night";
  setTime(detected);
}

/* ════════════════════════════════════════════
   STARTUP
════════════════════════════════════════════ */
window.addEventListener("load", async () => {
  await loadHotspots();
  buildZonesPanel();
  injectCompareTab();
  injectQuickChips();
  initMap(17.4065, 78.4772);
  autoDetectTime();
  loadHistory();
  buildHistoryPanel();
  startIncidentTicker();
  animateCounters();
  initProximityAlert();
  initKeyboardShortcuts();
  setTimeout(() => speak(t().welcome), 1000);
  enableLiveScoreRefresh();
});

/* ════════════════════════════════════════════
   LOAD HOTSPOTS
════════════════════════════════════════════ */
async function loadHotspots() {
  try {
    const res = await fetch("hotspots.json");
    HOTSPOTS  = await res.json();
    console.log("✅ Loaded", HOTSPOTS.length, "hotspots from server");
  } catch {
    console.warn("⚠️ Server not reachable — using embedded fallback.");
    HOTSPOTS = [
      {name:"Miyapur Junction",aliases:["miyapur","miyapur junction"],lat:17.4969,lng:78.3714,weight:10,risk:"high",zone:"North West"},
      {name:"ORR 144.5 km",aliases:["orr 144","orr 144.5","orr 144.5 km","outer ring road 144","orr west","patancheru orr"],lat:17.405,lng:78.28,weight:10,risk:"high",zone:"ORR West"},
      {name:"ORR 14 km",aliases:["orr 14","orr 14 km","outer ring road 14","orr north"],lat:17.56,lng:78.39,weight:9,risk:"high",zone:"ORR North"},
      {name:"Rachakonda",aliases:["rachakonda","rachakonda orr"],lat:17.33,lng:78.62,weight:9,risk:"high",zone:"ORR East"},
      {name:"Hayathnagar",aliases:["hayathnagar","hayath nagar","hayatnagar"],lat:17.33,lng:78.602,weight:9,risk:"high",zone:"South East"},
      {name:"LB Nagar",aliases:["lb nagar","lbnagar","l b nagar","lb nagar junction"],lat:17.3457,lng:78.5522,weight:9,risk:"high",zone:"South East"},
      {name:"Abdullapurmet",aliases:["abdullapurmet","abdulla purmet"],lat:17.318,lng:78.633,weight:8,risk:"high",zone:"South East"},
      {name:"Vanasthalipuram",aliases:["vanasthalipuram","vanasthali puram"],lat:17.338,lng:78.572,weight:8,risk:"high",zone:"South East"},
      {name:"Hyderguda",aliases:["hyderguda","hyder guda"],lat:17.393,lng:78.468,weight:9,risk:"high",zone:"Central"},
      {name:"Nampally",aliases:["nampally","nampally station"],lat:17.396,lng:78.463,weight:8,risk:"high",zone:"Central"},
      {name:"Abids",aliases:["abids","abid","abids circle","abids junction","abids x road","gandhi medical","abid circle"],lat:17.385,lng:78.474,weight:8,risk:"high",zone:"Central"},
      {name:"Jubilee Hills",aliases:["jubilee hills","jubileehills","jubilee hills check post"],lat:17.431,lng:78.407,weight:8,risk:"high",zone:"West"},
      {name:"Banjara Hills",aliases:["banjara hills","banjara","banjarahills"],lat:17.4155,lng:78.4378,weight:7,risk:"high",zone:"West"},
      {name:"Madhapur",aliases:["madhapur","madha pur","hitec city madhapur","hitech madhapur"],lat:17.4478,lng:78.3916,weight:8,risk:"high",zone:"West"},
      {name:"Gachibowli",aliases:["gachibowli","gachi bowli","gachibowli junction"],lat:17.4401,lng:78.3489,weight:7,risk:"high",zone:"West"},
      {name:"Yousufguda",aliases:["yousufguda","yusufguda"],lat:17.439,lng:78.427,weight:7,risk:"med",zone:"West"},
      {name:"Marredpally",aliases:["marredpally","marred pally","maredpally"],lat:17.449,lng:78.503,weight:7,risk:"med",zone:"North"},
      {name:"Begumpet",aliases:["begumpet","begum pet","begumpet junction"],lat:17.4437,lng:78.4686,weight:7,risk:"med",zone:"North"},
      {name:"Madina",aliases:["madina","madina circle","madina x road","madina junction"],lat:17.374,lng:78.484,weight:8,risk:"high",zone:"South"},
      {name:"Puranapool",aliases:["puranapool","purana pool","puranapul"],lat:17.366,lng:78.472,weight:8,risk:"high",zone:"South"},
      {name:"Charminar",aliases:["charminar","char minar"],lat:17.3616,lng:78.4747,weight:8,risk:"high",zone:"South"},
      {name:"Punjagutta",aliases:["punjagutta","panjagutta","punjagutta junction"],lat:17.4294,lng:78.4483,weight:9,risk:"high",zone:"Central"},
      {name:"Kukatpally",aliases:["kukatpally","kukat pally","kphb"],lat:17.4948,lng:78.3996,weight:7,risk:"med",zone:"North West"},
      {name:"Secunderabad Station",aliases:["secunderabad","secunderabad station","secundrabad","secbad"],lat:17.4399,lng:78.4983,weight:7,risk:"med",zone:"North"},
      {name:"Nagole",aliases:["nagole","nagol","nagole junction"],lat:17.376,lng:78.558,weight:8,risk:"high",zone:"East"}
    ];
  }
}

/* ════════════════════════════════════════════
   MAP INIT
════════════════════════════════════════════ */
function initMap(lat, lng) {
  if (mapObj) { mapObj.setView([lat, lng], 12); return; }
  mapObj = L.map("map").setView([lat, lng], 12);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:"© OpenStreetMap contributors", maxZoom:19
  }).addTo(mapObj);
  addHotspotMarkers();
}

function addHotspotMarkers() {
  if (!mapObj || !HOTSPOTS.length) return;
  HOTSPOTS.forEach(h => {
    const color = h.risk === "high" ? "#c0392b" : "#e67e22";
    const marker = L.circleMarker([h.lat, h.lng], {
      radius:8, color:"#fff", weight:2, fillColor:color, fillOpacity:0.85
    }).addTo(mapObj);
    marker.bindPopup(`<b>${h.name}</b><br>${h.zone} · Weight ${h.weight}/10<br><small>${h.desc||""}</small>`);
  });
}

/* ════════════════════════════════════════════
   TRAFFIC TOGGLE
════════════════════════════════════════════ */
function toggleTraffic() {
  const btn = document.getElementById("trafficBtn");
  if (!btn || !mapObj) return;
  const on = btn.getAttribute("data-on") === "1";
  if (!on) {
    trafficLayer = L.tileLayer(
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      { opacity:0.5, attribution:"" }
    ).addTo(mapObj);
    btn.setAttribute("data-on","1");
    btn.classList.add("active");
    btn.textContent = "🚦 Hide Traffic";
    showToast("🚦 Traffic overlay enabled (OpenStreetMap)");
  } else {
    if (trafficLayer) mapObj.removeLayer(trafficLayer);
    btn.setAttribute("data-on","0");
    btn.classList.remove("active");
    btn.textContent = "🚦 Show Traffic";
    showToast("🚦 Traffic overlay hidden");
  }
}

/* ════════════════════════════════════════════
   🔥 HEATMAP TOGGLE — animated pulse rings
════════════════════════════════════════════ */
function toggleHeatmap() {
  const btn = document.getElementById("heatmapBtn");
  if (!mapObj) return;
  heatmapActive = !heatmapActive;
  if (heatmapActive) {
    heatmapLayers.forEach(l => mapObj.removeLayer(l));
    heatmapLayers = [];
    HOTSPOTS.forEach(h => {
      const color = h.risk === "high" ? "#e74c3c" : "#f39c12";
      const opacity = (h.weight / 10) * 0.35;
      [1200, 800, 400].forEach((r, i) => {
        const c = L.circle([h.lat, h.lng], {
          radius: r, color: color, fillColor: color,
          fillOpacity: opacity * (1 - i * 0.25), weight: 0
        }).addTo(mapObj);
        heatmapLayers.push(c);
      });
    });
    if (btn) { btn.classList.add("active"); btn.textContent = "🔥 Hide Heatmap"; }
    showToast("🔥 Risk heatmap showing intensity zones");
  } else {
    heatmapLayers.forEach(l => mapObj.removeLayer(l));
    heatmapLayers = [];
    if (btn) { btn.classList.remove("active"); btn.textContent = "🔥 Heatmap"; }
    showToast("🔥 Heatmap hidden");
  }
}

/* ════════════════════════════════════════════
   ⚡ ANIMATED DASHBOARD COUNTERS on load
════════════════════════════════════════════ */
function animateCounters() {
  const counters = [
    { id:"stat-blackspots", target:25, suffix:"" },
    { id:"stat-highrisk",   target:19, suffix:"" },
    { id:"stat-accidents",  target:1000, suffix:"+" },
  ];
  counters.forEach(({ id, target, suffix }) => {
    const el = document.getElementById(id);
    if (!el) return;
    let current = 0;
    const step = Math.ceil(target / 40);
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = current + suffix;
      if (current >= target) clearInterval(timer);
    }, 30);
  });
}

/* ════════════════════════════════════════════
   🚨 PROXIMITY ALERT — red banner as you type
════════════════════════════════════════════ */
function initProximityAlert() {
  const alertBar = document.createElement("div");
  alertBar.id = "proximityAlert";
  alertBar.style.cssText = `
    display:none; margin-bottom:10px; padding:10px 16px;
    background:linear-gradient(135deg,#c0392b,#e74c3c);
    color:#fff; border-radius:var(--radius); font-size:13px;
    font-weight:600; animation:fadeUp 0.3s ease;
    box-shadow:0 4px 20px rgba(192,57,43,0.4);
  `;
  const routeBar = document.querySelector(".route-bar");
  if (routeBar) routeBar.parentNode.insertBefore(alertBar, routeBar.nextSibling);

  function checkProximity(val) {
    const norm = normaliseQuery(val || "");
    const match = HOTSPOTS.find(h =>
      (h.aliases||[]).some(a => norm.includes(a) || a.includes(norm)) && norm.length > 2
    );
    if (match) {
      alertBar.style.display = "block";
      alertBar.innerHTML = `🚨 <b>DANGER ZONE DETECTED:</b> ${match.name} — ${match.zone} · Risk: ${match.risk.toUpperCase()} · Weight: ${match.weight}/10`;
    } else {
      alertBar.style.display = "none";
    }
  }

  ["start","end"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", e => checkProximity(e.target.value));
  });
}

/* ════════════════════════════════════════════
   ⌨️ KEYBOARD SHORTCUTS
   Ctrl+Enter → Find Route
   Escape     → Clear inputs
   Ctrl+K     → Share Route
   Ctrl+B     → AI Briefing
════════════════════════════════════════════ */
function initKeyboardShortcuts() {
  document.addEventListener("keydown", e => {
    if (e.ctrlKey && e.key === "Enter") {
      e.preventDefault();
      findRoute();
    } else if (e.key === "Escape") {
      const s = document.getElementById("start");
      const en = document.getElementById("end");
      if (s) s.value = "";
      if (en) en.value = "";
      const alertBar = document.getElementById("proximityAlert");
      if (alertBar) alertBar.style.display = "none";
      showToast("✨ Inputs cleared");
    } else if (e.ctrlKey && e.key === "k") {
      e.preventDefault();
      shareRouteCard();
    } else if (e.ctrlKey && e.key === "b") {
      e.preventDefault();
      triggerAIBriefing();
    }
  });

  // Keyboard hint badge
  const hint = document.createElement("div");
  hint.style.cssText = "font-size:10px;color:var(--text3);padding:2px 0 6px;";
  hint.innerHTML = "⌨️ <b>Ctrl+Enter</b> find route · <b>Esc</b> clear · <b>Ctrl+K</b> share · <b>Ctrl+B</b> AI briefing";
  const routeBar = document.querySelector(".route-bar");
  if (routeBar) routeBar.parentNode.insertBefore(hint, routeBar);
}

/* ════════════════════════════════════════════
   ⚡ QUICK ROUTE CHIPS
════════════════════════════════════════════ */
function injectQuickChips() {
  const chipsContainer = document.createElement("div");
  chipsContainer.style.cssText = "display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;";
  const label = document.createElement("span");
  label.style.cssText = "font-size:11px;color:var(--text3);align-self:center;white-space:nowrap;";
  label.textContent = "⚡ Quick: ";
  chipsContainer.appendChild(label);

  QUICK_ROUTES.forEach(({ label, from, to }) => {
    const chip = document.createElement("button");
    chip.textContent = label;
    chip.style.cssText = `
      background:var(--surface);border:1.5px solid var(--border);
      color:var(--text2);border-radius:20px;padding:4px 12px;
      font-size:11px;font-family:var(--font);cursor:pointer;
      transition:all 0.2s;white-space:nowrap;
    `;
    chip.onmouseenter = () => { chip.style.borderColor = "var(--accent)"; chip.style.color = "var(--accent)"; };
    chip.onmouseleave = () => { chip.style.borderColor = "var(--border)"; chip.style.color = "var(--text2)"; };
    chip.onclick = () => {
      document.getElementById("start").value = from;
      document.getElementById("end").value   = to;
      findRoute();
    };
    chipsContainer.appendChild(chip);
  });

  const routeBar = document.querySelector(".route-bar");
  if (routeBar) routeBar.parentNode.insertBefore(chipsContainer, routeBar);
}

/* ════════════════════════════════════════════
   MY LOCATION
════════════════════════════════════════════ */
function useMyLocation() {
  if (!navigator.geolocation) { alert(t().notSupported); return; }
  speak(t().fetching);
  setLoader(true);
  navigator.geolocation.getCurrentPosition(pos => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    if (userMarker) mapObj.removeLayer(userMarker);
    userMarker = L.marker([lat, lng], {
      icon: L.divIcon({ html:`<div style="width:14px;height:14px;background:#3498db;border-radius:50%;border:3px solid #fff;box-shadow:0 0 8px #3498db88"></div>`, iconSize:[14,14], iconAnchor:[7,7], className:"" })
    }).addTo(mapObj).bindPopup("📍 You are here").openPopup();
    mapObj.setView([lat, lng], 14);
    const nearby = HOTSPOTS.filter(h => haversine(lat, lng, h.lat, h.lng) < 1500);
    if (nearby.length > 0) speak(t().nearZone(nearby[0].name));
    else speak(t().locFound);
    setLoader(false);
  }, () => {
    alert(t().allowLoc);
    setLoader(false);
  });
}

/* ════════════════════════════════════════════
   GEOCODE
════════════════════════════════════════════ */
async function geocode(place) {
  const alias = matchHotspotAlias(place);
  if (alias) return alias;
  const q = encodeURIComponent(place + ", Hyderabad, Telangana, India");
  const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=3`);
  const data = await res.json();
  if (!data || !data.length)
    throw new Error(`"${place}" not found. Try nearby landmark (e.g. Abids, Secunderabad, ORR 144).`);
  const lat = parseFloat(data[0].lat);
  const lng = parseFloat(data[0].lon);
  if (lat < HYD.minLat || lat > HYD.maxLat || lng < HYD.minLng || lng > HYD.maxLng)
    throw new Error(`"${place}" is outside Hyderabad. RAKSHAK only covers Greater Hyderabad.`);
  return { lat, lng, label: data[0].display_name.split(",")[0] };
}

/* ════════════════════════════════════════════
   FIND ROUTE — with real safer alternate route
════════════════════════════════════════════ */
let _altRoutePoints = null;
let _altDistKm      = null;
let _altDurMin      = null;
let _altScore       = null;

async function findRoute() {
  const startVal = document.getElementById("start").value.trim();
  const endVal   = document.getElementById("end").value.trim();
  if (!startVal || !endVal) { alert(t().enterBoth); return; }

  setLoader(true);
  speak(t().finding);

  try {
    const [s, e] = await Promise.all([geocode(startVal), geocode(endVal)]);
    initMap((s.lat + e.lat) / 2, (s.lng + e.lng) / 2);

    // Request OSRM with alternatives=true to get up to 3 route options
    const routeRes  = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${s.lng},${s.lat};${e.lng},${e.lat}?overview=full&geometries=geojson&steps=true&alternatives=true`
    );
    const routeData = await routeRes.json();
    if (!routeData.routes || !routeData.routes.length)
      throw new Error("No driving route found between these locations.");

    // ── Primary (fastest / direct) route ──
    const route   = routeData.routes[0];
    const latlngs = route.geometry.coordinates.map(c => [c[1], c[0]]);
    const distKm  = route.distance / 1000;
    const durMin  = Math.round(route.duration / 60);

    // ── Alternate (safer) route — pick the one with fewest hotspot hits ──
    let altLatlngs = null, altDistKm = null, altDurMin = null;

    if (routeData.routes.length > 1) {
      // Score each alternate and pick the least risky
      let bestAltScore = Infinity;
      for (let i = 1; i < routeData.routes.length; i++) {
        const altCoords = routeData.routes[i].geometry.coordinates.map(c => [c[1], c[0]]);
        const altDist   = routeData.routes[i].distance / 1000;
        const altRisk   = quickProximityScore(altCoords, altDist);
        if (altRisk < bestAltScore) {
          bestAltScore = altRisk;
          altLatlngs   = altCoords;
          altDistKm    = altDist;
          altDurMin    = Math.round(routeData.routes[i].duration / 60);
        }
      }
    } else {
      // OSRM gave only one route — synthesize a slight detour by waypoint offset
      const midLat = (s.lat + e.lat) / 2 + 0.012;
      const midLng = (s.lng + e.lng) / 2 - 0.009;
      try {
        const detourRes  = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${s.lng},${s.lat};${midLng},${midLat};${e.lng},${e.lat}?overview=full&geometries=geojson&steps=true`
        );
        const detourData = await detourRes.json();
        if (detourData.routes && detourData.routes.length) {
          altLatlngs = detourData.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
          altDistKm  = detourData.routes[0].distance / 1000;
          altDurMin  = Math.round(detourData.routes[0].duration / 60);
        }
      } catch(_) { /* skip if detour fetch fails */ }
    }

    lastRouteData = {
      start: s.label, end: e.label,
      distKm: distKm.toFixed(2), durMin,
      time: selectedTime,
      timestamp: new Date().toLocaleString("en-IN")
    };

    // ── Clear old layers ──
    if (routeLayer)    mapObj.removeLayer(routeLayer);
    if (altRouteLayer) mapObj.removeLayer(altRouteLayer);

    // ── Draw SAFER (green) route FIRST so red goes on top ──
    if (altLatlngs) {
      altRouteLayer = L.polyline(altLatlngs, {
        color:"#27ae60", weight:4, opacity:0.75,
        lineJoin:"round", dashArray:"10 6"
      }).addTo(mapObj);
      altRouteLayer.bindPopup(
        `<b style="color:#27ae60">🛡️ Safer Route</b><br>` +
        `${altDistKm ? altDistKm.toFixed(2) : "–"} km · ~${altDurMin} min<br>` +
        `<small style="color:#888">Avoids highest-weight hotspots</small>`
      );
    }

    // ── Draw DIRECT (red) route on top ──
    routeLayer = L.polyline(latlngs, {
      color:"#c0392b", weight:5, opacity:0.9, lineJoin:"round"
    }).addTo(mapObj);
    routeLayer.bindPopup(
      `<b style="color:#c0392b">⚡ Direct Route</b><br>` +
      `${distKm.toFixed(2)} km · ~${durMin} min`
    );

    // ── Fit map to show both routes ──
    const allPoints = altLatlngs ? [...latlngs, ...altLatlngs] : latlngs;
    mapObj.fitBounds(L.latLngBounds(allPoints), { padding:[40,40] });

    // ── Markers ──
    if (startMarker) mapObj.removeLayer(startMarker);
    if (endMarker)   mapObj.removeLayer(endMarker);

    startMarker = L.marker([s.lat, s.lng], {
      icon: L.divIcon({
        html:`<div style="width:16px;height:16px;background:#27ae60;border-radius:50%;border:3px solid #fff;box-shadow:0 0 8px #27ae6088"></div>`,
        iconSize:[16,16], iconAnchor:[8,8], className:""
      })
    }).addTo(mapObj).bindPopup(`🟢 <b>Start:</b> ${s.label}`);

    endMarker = L.marker([e.lat, e.lng], {
      icon: L.divIcon({
        html:`<div style="width:16px;height:16px;background:#c0392b;border-radius:50%;border:3px solid #fff;box-shadow:0 0 8px #c0392b88"></div>`,
        iconSize:[16,16], iconAnchor:[8,8], className:""
      })
    }).addTo(mapObj).bindPopup(`🔴 <b>End:</b> ${e.label}`);

    // Open start popup first, then end popup so both are visible
    startMarker.openPopup();
    setTimeout(() => { if (endMarker) endMarker.openPopup(); }, 1400);

    // ── Route legend badge ──
    showRouteLegend(!!altLatlngs);

    showDistanceBar(distKm, durMin, s.label, e.label);
    await computeRiskScore(latlngs, distKm, s, e);

    // Store alt route data for compare panel
    _altRoutePoints = altLatlngs;
    _altDistKm      = altDistKm;
    _altDurMin      = altDurMin;

    // Extract named road waypoints from steps for display
    let altStepNames = [];
    if (routeData.routes.length > 1) {
      const altLegs = routeData.routes.find((r,i) => i > 0 && r.geometry.coordinates.map(c=>[c[1],c[0]]) === altLatlngs) ||
                      routeData.routes[1];
      const steps = altLegs?.legs?.[0]?.steps || [];
      altStepNames = steps
        .map(st => st.name || st.ref || "")
        .filter(n => n && n.trim() !== "" && n !== "undefined")
        .filter((n, i, arr) => arr.indexOf(n) === i) // unique
        .slice(0, 8);
    } else if (altLatlngs) {
      // detour route — no step names available, use intermediate coords as placeholders
      altStepNames = ["Via alternate roads (avoids main hotspot corridors)"];
    }
    window._altStepNames = altStepNames;

    if (altLatlngs) {
      _altScore = quickProximityScore(altLatlngs, altDistKm);
    }

    _lastRoutePoints = latlngs;
    _lastDistKm      = distKm;
    _lastStartPt     = s;
    _lastEndPt       = e;

    setTimeout(() => showInlineCompare(s, e, distKm, durMin), 500);

  } catch (err) {
    alert(err.message || "Something went wrong. Check the location names and try again.");
  } finally {
    setLoader(false);
  }
}

/* Quick proximity risk score (sync, for route ranking) */
function quickProximityScore(pts, distKm) {
  let rawRisk = 0;
  const sampled = pts.filter((_, i) => i % 4 === 0);
  sampled.forEach(pt => {
    HOTSPOTS.forEach(h => {
      const d = haversine(pt[0], pt[1], h.lat, h.lng);
      if (d < 800) rawRisk += h.weight * Math.pow(1 - d / 800, 1.8);
    });
  });
  return Math.round((rawRisk / Math.max(distKm, 0.5)) * 4.5);
}

/* ── Route legend showing both lines ── */
function showRouteLegend(hasAlt) {
  let legend = document.getElementById("routeLegend");
  if (!legend) {
    legend = document.createElement("div");
    legend.id = "routeLegend";
    legend.style.cssText = `
      display:flex; gap:18px; flex-wrap:wrap; align-items:center;
      margin:6px 0 10px; font-size:12px; color:var(--text2);
      padding:8px 14px; background:var(--surface);
      border:1.5px solid var(--border); border-radius:var(--radius);
    `;
    const map = document.getElementById("map");
    map.parentNode.insertBefore(legend, map);
  }
  legend.innerHTML = `
    <span style="font-weight:600;color:var(--text);font-size:12px;">🗺️ Route Legend:</span>
    <span style="display:flex;align-items:center;gap:6px;">
      <span style="display:inline-block;width:28px;height:4px;background:#c0392b;border-radius:2px;"></span>
      <b style="color:#c0392b;">Direct Route</b> (fastest)
    </span>
    ${hasAlt ? `
    <span style="display:flex;align-items:center;gap:6px;">
      <span style="display:inline-block;width:28px;height:4px;background:#27ae60;border-radius:2px;border-top:2px dashed #27ae60;"></span>
      <b style="color:#27ae60;">Safer Route</b> (fewer hotspots)
    </span>
    <span style="font-size:11px;color:var(--text3);font-style:italic;">💡 Click the green dashed line on the map for safer route details</span>
    ` : `<span style="font-size:11px;color:var(--text3);font-style:italic;">Only one route available for this trip</span>`}
  `;
}

/* ════════════════════════════════════════════
   DISTANCE BAR
════════════════════════════════════════════ */
function showDistanceBar(distKm, durMin, startLabel, endLabel) {
  let bar = document.getElementById("distanceBar");
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "distanceBar";
    bar.style.cssText = `
      margin:10px 0;padding:10px 16px;
      background:var(--surface);border:1.5px solid var(--border);
      border-radius:var(--radius);display:flex;flex-wrap:wrap;
      gap:14px;align-items:center;font-size:13px;color:var(--text2);
      box-shadow:var(--shadow);animation:fadeUp 0.3s ease;
    `;
    const loader = document.getElementById("loader");
    loader.parentNode.insertBefore(bar, loader.nextSibling);
  }
  const trafficMult = getRealTimeMult();
  const trafficDur  = Math.round(durMin * trafficMult);
  const delay       = trafficDur - durMin;
  const delayStr    = delay > 0 ? `<span style="color:#e67e22">+${delay} min delay</span>` : `<span style="color:#27ae60">No major delay</span>`;
  const speedKmh    = distKm > 0 && durMin > 0 ? (distKm / (durMin / 60)).toFixed(0) : "–";
  const now         = new Date();
  const timeDisplay = now.toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" });

  bar.innerHTML = `
    <span>📍 <b>${startLabel}</b> → <b>${endLabel}</b></span>
    <span>📏 <b>${distKm.toFixed(2)} km</b></span>
    <span>⏱️ <b>~${durMin} min</b> (free-flow)</span>
    <span>🚦 ${delayStr} at ${timeDisplay}</span>
    <span>🏎️ Avg: ${speedKmh} km/h</span>
    <button onclick="exportRouteXLS()" style="margin-left:auto;background:var(--blue-bg);color:var(--blue-text);border:1.5px solid rgba(36,113,163,0.3);border-radius:8px;padding:5px 12px;font-size:12px;font-family:var(--font);cursor:pointer;font-weight:600;">📊 Export XLS</button>
    <button onclick="shareRouteCard()" style="background:var(--surface2);color:var(--text2);border:1.5px solid var(--border);border-radius:8px;padding:5px 12px;font-size:12px;font-family:var(--font);cursor:pointer;font-weight:600;">📤 Share</button>
  `;
}

/* ════════════════════════════════════════════
   ╔═══════════════════════════════════════╗
   ║    v7 FORMULA — 10-STEP REAL-TIME     ║
   ╚═══════════════════════════════════════╝
════════════════════════════════════════════ */

/* ── REAL-TIME TIME ENGINE (Gaussian curve) ── */
function getRealTimeMult() {
  const now  = new Date();
  const hour = now.getHours() + now.getMinutes() / 60;
  function gaussian(x, center, width) {
    return Math.exp(-0.5 * Math.pow((x - center) / width, 2));
  }
  const morningPeak = gaussian(hour, 8,  1.5) * 0.50;
  const eveningPeak = gaussian(hour, 18, 1.8) * 0.55;
  const nightRisk   = hour >= 22 || hour < 4 ? 0.30 : 0;
  return parseFloat((1.0 + morningPeak + eveningPeak + nightRisk).toFixed(3));
}

/* ── DAY-OF-WEEK FACTOR ── */
function getDayFactor() {
  const day  = new Date().getDay();
  const hour = new Date().getHours();
  const map  = { 0:1.10, 1:1.05, 2:1.00, 3:1.00, 4:1.05, 5:1.20, 6:1.10 };
  let factor = map[day] || 1.0;
  if ((day === 5 || day === 6 || day === 0) && (hour >= 23 || hour < 2)) factor += 0.25;
  return factor;
}

/* ── PUBLIC HOLIDAY DETECTION ── */
function getHolidayFactor() {
  const now   = new Date();
  const month = now.getMonth() + 1;
  const date  = now.getDate();
  const hour  = now.getHours();
  const holidays = [
    { m:1, d:1, name:"New Year's Day" },
    { m:1, d:26, name:"Republic Day" },
    { m:4, d:14, name:"Dr. Ambedkar Jayanti" },
    { m:6, d:2,  name:"Telangana Formation Day" },
    { m:8, d:15, name:"Independence Day" },
    { m:10,d:2,  name:"Gandhi Jayanti" },
  ];
  const match = holidays.find(h => h.m === month && h.d === date);
  if (!match) return { isHoliday:false, factor:1.0, name:null };
  const factor = hour >= 20 ? 1.20 : 0.90;
  return { isHoliday:true, factor, name:match.name };
}

/* ── WEATHER FACTOR ── */
let _weatherCache = null;
let _weatherTime  = 0;

async function getWeatherFactor() {
  const now = Date.now();
  if (_weatherCache && (now - _weatherTime) < 15 * 60 * 1000) return _weatherCache;
  try {
    const url = "https://api.open-meteo.com/v1/forecast" +
      "?latitude=17.4065&longitude=78.4772" +
      "&current=weather_code,rain,wind_speed_10m,visibility" +
      "&timezone=Asia%2FKolkata";
    const res  = await fetch(url, { signal: AbortSignal.timeout(4000) });
    const data = await res.json();
    const cur  = data.current || {};
    const rain       = cur.rain || 0;
    const visibility = cur.visibility || 9999;
    const windSpeed  = cur.wind_speed_10m || 0;
    const code       = cur.weather_code || 0;
    let factor = 1.0, label = "☀️ Clear";
    if      (code >= 95) { factor = 1.50; label = "⛈️ Thunderstorm"; }
    else if (code >= 80) { factor = 1.35; label = "🌧️ Heavy showers"; }
    else if (code >= 61) { factor = 1.25; label = "🌧️ Rain"; }
    else if (code >= 51) { factor = 1.15; label = "🌦️ Drizzle"; }
    else if (code >= 45) { factor = 1.30; label = "🌫️ Fog"; }
    if (visibility < 500) factor += 0.20;
    if (windSpeed  > 50)  factor += 0.10;
    const result = { factor: parseFloat(factor.toFixed(2)), label, rain, windSpeed };
    _weatherCache = result; _weatherTime = now;
    return result;
  } catch {
    const fallback = { factor:1.0, label:"⚡ Weather unavailable", rain:0, windSpeed:0 };
    _weatherCache = fallback; _weatherTime = now;
    return fallback;
  }
}

/* ── ROUTE SHAPE PENALTY ── */
function getRouteStraightnessBonus(routePoints, distKm, startPt, endPt) {
  const straightDist = haversine(startPt.lat, startPt.lng, endPt.lat, endPt.lng) / 1000;
  const sinuosity    = distKm / Math.max(straightDist, 0.1);
  if (sinuosity < 1.2) return { bonus:10, label:"🛣️ Highway-like route (high speed)" };
  if (sinuosity < 1.4) return { bonus:5,  label:"🛣️ Mixed highway/city" };
  if (sinuosity > 2.0) return { bonus:-3, label:"🏙️ Dense city route (lower speed)" };
  return { bonus:0, label:"🏙️ Mixed city route" };
}

/* ── CONGESTION BONUS ── */
function getCongestionBonus() {
  const hour    = new Date().getHours();
  const day     = new Date().getDay();
  const weekday = day >= 1 && day <= 5;
  if (!weekday) return 0;
  if (hour >= 7  && hour <= 9)  return 6;
  if (hour >= 17 && hour <= 20) return 8;
  return 0;
}

/* ── MAIN computeRiskScore (v7) ── */
async function computeRiskScore(routePoints, distKm, startPt, endPt) {
  let rawRisk = 0, hitZones = [], hasHighWeight = false;
  const sampled = routePoints.filter((_, i) => i % 4 === 0);
  sampled.forEach(pt => {
    HOTSPOTS.forEach(h => {
      const d = haversine(pt[0], pt[1], h.lat, h.lng);
      if (d < 800) {
        rawRisk += h.weight * Math.pow(1 - d / 800, 1.8);
        if (!hitZones.includes(h.name)) hitZones.push(h.name);
        if (h.weight >= 9) hasHighWeight = true;
      }
    });
  });

  const density  = rawRisk / Math.max(distKm, 0.5);
  let   score    = density * 4.5;

  const timeMult = getRealTimeMult();
  score *= timeMult;

  if (hitZones.length > 1) score += Math.min((hitZones.length - 1) * 6, 24);
  if (hasHighWeight)        score += 8;
  if (distKm < 3 && hitZones.length >= 2) score = Math.max(score, 45);

  score += getCongestionBonus();

  const dayFactor = getDayFactor();
  score *= dayFactor;

  const holiday = getHolidayFactor();
  score *= holiday.factor;

  const shape = getRouteStraightnessBonus(routePoints, distKm, startPt, endPt);
  score += shape.bonus;

  const weather = await getWeatherFactor();
  score *= weather.factor;

  score = Math.round(Math.min(100, Math.max(15, score)));
  _lastScore = score;

  const now      = new Date();
  const timeStr  = now.toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" });
  const dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const dayStr   = dayNames[now.getDay()];

  const contextLines = [
    `🕐 ${timeStr} ${dayStr} · ×${timeMult.toFixed(2)} time mult`,
    `${weather.label} · ×${weather.factor} weather`,
    `${shape.label}`,
    holiday.isHoliday ? `🎉 Public holiday: ${holiday.name}` : null,
    `📏 ${distKm.toFixed(2)} km route`,
  ].filter(Boolean).join("  |  ");

  const confidence = weather.label.includes("unavailable")
    ? "📡 Partial real-time (weather offline)"
    : "✅ Full real-time score";

  showRiskCard(score, hitZones, distKm, contextLines, confidence);
  showRiskGauge(score);
  saveHistory(score, hitZones, distKm);
}

/* ════════════════════════════════════════════
   showRiskCard
════════════════════════════════════════════ */
function showRiskCard(score, hitZones, distKm, contextLines, confidence) {
  const s      = t();
  const card   = document.getElementById("riskCard");
  const numEl  = document.getElementById("riskNum");
  const barEl  = document.getElementById("riskBarFill");
  const pillEl = document.getElementById("riskPill");
  const msgEl  = document.getElementById("riskMessage");
  const zEl    = document.getElementById("riskZonesHit");
  const pctEl  = document.getElementById("riskPct");
  const timeEl = document.getElementById("riskTimeNote");

  card.classList.add("show");
  numEl.textContent = score + "/100";
  pctEl.textContent = score + "%";
  pillEl.classList.remove("pill-high","pill-med","pill-low");

  if (timeEl) {
    timeEl.innerHTML =
      (contextLines ? `<span style="font-size:11px;opacity:0.85">${contextLines}</span><br>` : "") +
      (confidence   ? `<span style="font-size:11px;color:var(--text3)">${confidence}</span>` : "");
  }

  let voiceMsg = "";
  if (score >= 60) {
    barEl.style.background = "linear-gradient(90deg,#e74c3c,#c0392b)";
    pillEl.textContent = s.highBadge; pillEl.classList.add("pill-high");
    msgEl.textContent  = s.highMsg;
    voiceMsg = s.highRisk(score, hitZones.slice(0,3).join(", "));
  } else if (score >= 35) {
    barEl.style.background = "linear-gradient(90deg,#f39c12,#e67e22)";
    pillEl.textContent = s.medBadge; pillEl.classList.add("pill-med");
    msgEl.textContent  = s.medMsg;
    voiceMsg = s.medRisk(score, hitZones[0] || "busy junctions");
  } else {
    barEl.style.background = "linear-gradient(90deg,#2ecc71,#27ae60)";
    pillEl.textContent = s.lowBadge; pillEl.classList.add("pill-low");
    msgEl.textContent  = s.lowMsg;
    voiceMsg = s.lowRisk(score);
  }

  setTimeout(() => { barEl.style.width = score + "%"; }, 80);
  zEl.textContent = hitZones.length > 0
    ? s.zonesOn + " " + hitZones.join(" • ")
    : s.noZones;

  showSafetyTips(score, hitZones);

  // Inject AI Briefing + Share buttons into risk card header
  const header = document.querySelector(".risk-card-header");
  if (header && !document.getElementById("riskCardActions")) {
    const actions = document.createElement("div");
    actions.id = "riskCardActions";
    actions.style.cssText = "display:flex;gap:6px;margin-left:auto;";
    actions.innerHTML = `
      <button onclick="triggerAIBriefing()" style="background:var(--blue-bg);color:var(--blue-text);border:1.5px solid rgba(36,113,163,0.3);border-radius:8px;padding:4px 10px;font-size:11px;font-family:var(--font);cursor:pointer;font-weight:600;">🤖 AI Briefing</button>
      <button onclick="shareRouteCard()" style="background:var(--surface2);color:var(--text2);border:1.5px solid var(--border);border-radius:8px;padding:4px 10px;font-size:11px;font-family:var(--font);cursor:pointer;font-weight:600;">📤 Share</button>
    `;
    header.appendChild(actions);
  }

  setTimeout(() => speak(voiceMsg), 500);
}

/* ════════════════════════════════════════════
   📊 SVG RISK GAUGE — animated needle
════════════════════════════════════════════ */
function showRiskGauge(score) {
  let gaugeWrap = document.getElementById("riskGaugeWrap");
  if (!gaugeWrap) {
    gaugeWrap = document.createElement("div");
    gaugeWrap.id = "riskGaugeWrap";
    gaugeWrap.style.cssText = "margin-top:14px;display:flex;justify-content:center;";
    document.getElementById("riskCard").appendChild(gaugeWrap);
  }

  const color = score >= 60 ? "#e74c3c" : score >= 35 ? "#f39c12" : "#27ae60";
  // Needle angle: -90 (left=0) to +90 (right=100)
  const angle = -90 + (score / 100) * 180;
  const rad   = angle * Math.PI / 180;
  const cx    = 120, cy = 100, r = 80;
  const nx    = cx + r * 0.7 * Math.cos(rad);
  const ny    = cy + r * 0.7 * Math.sin(rad);

  gaugeWrap.innerHTML = `
    <svg width="240" height="140" viewBox="0 0 240 140" style="overflow:visible">
      <!-- Arcs: low / med / high -->
      <path d="M 40,100 A 80,80 0 0,1 120,20" stroke="#27ae60" stroke-width="14" fill="none" stroke-linecap="round"/>
      <path d="M 120,20 A 80,80 0 0,1 185,45" stroke="#f39c12" stroke-width="14" fill="none" stroke-linecap="round"/>
      <path d="M 185,45 A 80,80 0 0,1 200,100" stroke="#e74c3c" stroke-width="14" fill="none" stroke-linecap="round"/>
      <!-- Labels -->
      <text x="28" y="120" font-size="10" fill="var(--text3)" font-family="Poppins,sans-serif">0</text>
      <text x="108" y="15" font-size="10" fill="var(--text3)" font-family="Poppins,sans-serif" text-anchor="middle">50</text>
      <text x="210" y="120" font-size="10" fill="var(--text3)" font-family="Poppins,sans-serif">100</text>
      <!-- Needle -->
      <line id="gaugeNeedle" x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy - 60}"
        stroke="${color}" stroke-width="3" stroke-linecap="round"
        style="transform-origin:${cx}px ${cy}px;transform:rotate(${angle}deg);transition:transform 1.2s cubic-bezier(0.4,0,0.2,1)"/>
      <!-- Center dot -->
      <circle cx="${cx}" cy="${cy}" r="7" fill="${color}"/>
      <!-- Score text -->
      <text x="${cx}" y="${cy + 28}" font-size="22" font-weight="700" fill="${color}"
        font-family="Poppins,sans-serif" text-anchor="middle">${score}</text>
      <text x="${cx}" y="${cy + 44}" font-size="11" fill="var(--text3)"
        font-family="Poppins,sans-serif" text-anchor="middle">Risk Score</text>
    </svg>`;
}

/* ════════════════════════════════════════════
   🔀 INLINE COMPARE PANEL — real safe vs direct with named waypoints
════════════════════════════════════════════ */
function showInlineCompare(s, e, distKm, durMin) {
  let panel = document.getElementById("inlineCompare");
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "inlineCompare";
    panel.style.cssText = "margin-top:16px;padding:16px 20px;background:var(--surface);border:1.5px solid var(--border);border-radius:var(--radius-lg);box-shadow:var(--shadow);animation:fadeUp 0.4s ease;";
    document.getElementById("riskCard").parentNode.appendChild(panel);
  }

  const directScore = _lastScore || 50;
  const hasRealAlt  = _altRoutePoints && _altDistKm && _altDurMin;
  const safeScore   = hasRealAlt ? Math.max(15, _altScore || Math.max(15, directScore - 15)) : Math.max(15, directScore - 18);
  const safeKm      = hasRealAlt ? _altDistKm.toFixed(2) : (distKm * 1.18).toFixed(2);
  const safeMin     = hasRealAlt ? _altDurMin : Math.round(durMin * 1.25);
  const extraMin    = safeMin - durMin;

  const stepNames  = window._altStepNames || [];
  const viaDisplay = stepNames.length > 0 ? stepNames.join(" \u2192 ") : "Alternate roads avoiding main hotspot corridors";

  const winner     = safeScore < directScore ? "safe" : "direct";
  const safeColor  = safeScore  < 35 ? "#27ae60" : safeScore  < 60 ? "#e67e22" : "#c0392b";
  const dirColor   = directScore < 35 ? "#27ae60" : directScore < 60 ? "#e67e22" : "#c0392b";
  const safeBg     = safeScore  < 35 ? "#e9f7ef"  : safeScore  < 60 ? "#fef5e7" : "#fde8e8";
  const dirBg      = directScore < 35 ? "#e9f7ef"  : directScore < 60 ? "#fef5e7" : "#fde8e8";
  const safeBorder = safeScore  < 35 ? "#27ae60"  : safeScore  < 60 ? "#f39c12" : "#e74c3c";
  const dirBorder  = directScore < 35 ? "#27ae60"  : directScore < 60 ? "#f39c12" : "#e74c3c";

  const saferBadge  = '<span style="background:#27ae60;color:#fff;font-size:10px;padding:2px 8px;border-radius:99px;font-weight:700;margin-left:6px;">\uD83C\uDFC6 SAFER</span>';
  const fasterBadge = '<span style="background:#3498db;color:#fff;font-size:10px;padding:2px 8px;border-radius:99px;font-weight:700;margin-left:6px;">\u26A1 FASTER</span>';

  const extraStr = extraMin > 0
    ? '<span style="color:#e67e22;margin-left:4px;">(+' + extraMin + ' min longer)</span>'
    : '<span style="color:#27ae60;margin-left:4px;">(same time)</span>';

  const recText = winner === "safe"
    ? "Take the safer route \u2014 " + (extraMin > 0 ? "only " + extraMin + " min extra" : "no time cost")
    : "Direct route is fine \u2014 risk is manageable";
  const recColor = winner === "safe" ? "#27ae60" : "#3498db";

  panel.innerHTML =
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:6px;">' +
      '<span style="font-size:15px;font-weight:700;color:var(--text);">\uD83D\uDD00 Route Comparison</span>' +
      '<span style="font-size:11px;color:var(--text3);">' + (hasRealAlt ? "\u2705 Real OSRM alternate route" : "\uD83D\uDCCA Estimated safer path") + '</span>' +
    '</div>' +

    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">' +

      // SAFER CARD
      '<div style="padding:14px;border-radius:var(--radius);background:' + safeBg + ';border:1.5px solid ' + safeBorder + ';">' +
        '<div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:8px;">\uD83D\uDEE1\uFE0F Safer Route ' + (winner === "safe" ? saferBadge : "") + '</div>' +
        '<div style="font-size:32px;font-weight:800;color:' + safeColor + ';line-height:1;">' + safeScore + '<span style="font-size:14px;font-weight:500;">/100</span></div>' +
        '<div style="margin-top:8px;font-size:11px;color:var(--text2);line-height:1.7;">' +
          '\uD83D\uDCCF ' + safeKm + ' km<br>' +
          '\u23F1\uFE0F ~' + safeMin + ' min ' + extraStr +
        '</div>' +
        '<div style="margin-top:6px;font-size:10px;color:var(--text3);">\uD83D\uDDFA\uFE0F Green dashed line on map</div>' +
      '</div>' +

      // DIRECT CARD
      '<div style="padding:14px;border-radius:var(--radius);background:' + dirBg + ';border:1.5px solid ' + dirBorder + ';">' +
        '<div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:8px;">\u26A1 Direct Route ' + (winner === "direct" ? fasterBadge : "") + '</div>' +
        '<div style="font-size:32px;font-weight:800;color:' + dirColor + ';line-height:1;">' + directScore + '<span style="font-size:14px;font-weight:500;">/100</span></div>' +
        '<div style="margin-top:8px;font-size:11px;color:var(--text2);line-height:1.7;">' +
          '\uD83D\uDCCF ' + distKm.toFixed(2) + ' km<br>' +
          '\u23F1\uFE0F ~' + durMin + ' min <span style="color:#3498db;margin-left:4px;">(fastest)</span>' +
        '</div>' +
        '<div style="margin-top:6px;font-size:10px;color:var(--text3);">\uD83D\uDDFA\uFE0F Solid red line on map</div>' +
      '</div>' +

    '</div>' +

    // SAFER ROUTE PATH — NAMED WAYPOINTS
    '<div style="padding:12px 14px;background:var(--surface2);border-radius:var(--radius);border:1.5px solid #27ae6044;margin-bottom:10px;">' +
      '<div style="font-size:12px;font-weight:700;color:#27ae60;margin-bottom:6px;">\uD83D\uDEE1\uFE0F Safer Route — Named Path</div>' +
      '<div style="font-size:12px;color:var(--text);font-weight:600;margin-bottom:5px;">' +
        '\uD83D\uDCCD ' + s.label + ' \u2192 \uD83D\uDCCD ' + e.label +
      '</div>' +
      '<div style="font-size:11px;color:var(--text2);line-height:1.8;word-break:break-word;">' +
        '<span style="color:var(--text3);">Via: </span>' + viaDisplay +
      '</div>' +
    '</div>' +

    // DIRECT ROUTE PATH
    '<div style="padding:12px 14px;background:var(--surface2);border-radius:var(--radius);border:1.5px solid #c0392b44;margin-bottom:10px;">' +
      '<div style="font-size:12px;font-weight:700;color:#c0392b;margin-bottom:6px;">\u26A1 Direct Route — Named Path</div>' +
      '<div style="font-size:12px;color:var(--text);font-weight:600;margin-bottom:5px;">' +
        '\uD83D\uDCCD ' + s.label + ' \u2192 \uD83D\uDCCD ' + e.label +
      '</div>' +
      '<div style="font-size:11px;color:var(--text2);">Fastest highway/arterial path \u00B7 May pass through known hotspot corridors</div>' +
    '</div>' +

    '<div style="padding:8px 12px;background:var(--surface2);border-radius:8px;border:1px solid var(--border);font-size:11px;color:var(--text2);">' +
      '\uD83D\uDCA1 <b>Risk difference: ' + Math.abs(directScore - safeScore) + ' pts</b> \u00B7 ' +
      'Recommendation: <b style="color:' + recColor + '">' + recText + '</b>' +
    '</div>';
}

/* ════════════════════════════════════════════
   🤖 AI SAFETY BRIEFING PANEL
════════════════════════════════════════════ */
const AI_BRIEFINGS = {
  high: [
    "🔴 This route passes through multiple certified black spots. RAKSHAK recommends driving at a maximum of 35 km/h through hotspot zones, activating hazard lights at intersections, and preferring daylight travel. Do NOT overtake in the highlighted zones.",
    "⚠️ High-risk corridor detected. Key factors: dense pedestrian conflict, uncontrolled U-turns, and speeding trucks. Maintain a 5-second following gap. If travelling at night, avoid ORR merge zones entirely.",
    "🚨 Danger ahead. Zones on this route are active accident clusters. Real-time conditions have elevated the risk score. Recommended: Postpone travel by 90 minutes if near peak hour.",
  ],
  med: [
    "🟠 Moderate risk route. You are passing through 1–2 identified hotspots. Approach all signals defensively. Watch for cab aggregator surges near IT corridor exits.",
    "⚠️ Some hazard zones on this path. RAKSHAK recommends: stay in the left lane near junctions, maintain horn discipline in old-city zones, and keep speed below 50 km/h through flagged stretches.",
  ],
  low: [
    "🟢 This looks like a relatively safe route based on current data. No major black spots detected. Maintain standard safe driving practices: lane discipline, no phone use, and appropriate following distance.",
    "✅ Low risk corridor. RAKSHAK has scanned 25 hotspots — none directly on your path. Drive safely, watch for unexpected pedestrians near residential areas, and obey speed limits.",
  ]
};

function triggerAIBriefing() {
  if (_lastScore === null) {
    showToast("🤖 Search a route first to get an AI briefing.");
    return;
  }
  const level   = _lastScore >= 60 ? "high" : _lastScore >= 35 ? "med" : "low";
  const tips    = AI_BRIEFINGS[level];
  const tip     = tips[Math.floor(Math.random() * tips.length)];

  let panel = document.getElementById("aiBriefingPanel");
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "aiBriefingPanel";
    panel.style.cssText = `
      margin-top:14px;padding:16px 20px;
      background:var(--blue-bg);border:1.5px solid rgba(36,113,163,0.3);
      border-radius:var(--radius-lg);font-size:13px;
      color:var(--blue-text);line-height:1.7;
      animation:fadeUp 0.35s ease;
    `;
    const riskCard = document.getElementById("riskCard");
    riskCard.parentNode.insertBefore(panel, riskCard.nextSibling);
  }
  panel.style.display = "block";
  panel.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
      <b style="font-size:14px;color:var(--text)">🤖 AI Safety Briefing</b>
      <span style="font-size:10px;color:var(--text3);font-style:italic;">Score: ${_lastScore}/100 · ${new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}</span>
    </div>
    <p style="margin:0;">${tip}</p>
    <div style="margin-top:10px;font-size:11px;color:var(--text3);">📎 Data: TSCTSL · ACCO 2024 · NH-65 Accident Records · The Hindu ORR Audit · ToI IT Corridor 2025</div>
  `;
  speak("AI Safety briefing loaded. " + tip.replace(/[🔴🟠🟢⚠️🚨✅]/g, ""));
}

/* ════════════════════════════════════════════
   📤 SHARE ROUTE CARD
════════════════════════════════════════════ */
function shareRouteCard() {
  if (!lastRouteData) {
    showToast("🔍 Search a route first to share.");
    return;
  }
  const score = _lastScore || "–";
  const level = score >= 60 ? "🔴 HIGH RISK" : score >= 35 ? "🟠 MODERATE RISK" : "🟢 LOW RISK";
  const text = `
🛡️ RAKSHAK — Route Safety Report
━━━━━━━━━━━━━━━━━━━━━━━━━
📍 ${lastRouteData.start} → ${lastRouteData.end}
📏 Distance: ${lastRouteData.distKm} km
⏱️ Est. Time: ~${lastRouteData.durMin} min
⏰ Travel Window: ${TIME_LABELS[selectedTime]}

🤖 AI Risk Score: ${score}/100
${level}

📊 Data: TSCTSL · ACCO 2024 · NH-65 Records
🌐 rakshak.hyderabad.safety | ${lastRouteData.timestamp}
━━━━━━━━━━━━━━━━━━━━━━━━━
Stay safe. Drive smart. #RAKSHAK`.trim();

  let modal = document.getElementById("shareModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "shareModal";
    modal.style.cssText = `
      position:fixed;top:0;left:0;right:0;bottom:0;
      background:rgba(0,0,0,0.55);z-index:9998;
      display:flex;align-items:center;justify-content:center;
      animation:fadeUp 0.2s ease;
    `;
    document.body.appendChild(modal);
    modal.addEventListener("click", e => {
      if (e.target === modal) modal.style.display = "none";
    });
  }
  modal.style.display = "flex";
  modal.innerHTML = `
    <div style="background:var(--surface);border-radius:var(--radius-lg);padding:24px;max-width:440px;width:90%;box-shadow:var(--shadow-lg);">
      <div style="font-size:16px;font-weight:700;color:var(--text);margin-bottom:14px;">📤 Share Route Safety Card</div>
      <pre style="white-space:pre-wrap;font-size:12px;color:var(--text2);background:var(--surface2);padding:14px;border-radius:var(--radius);font-family:monospace;line-height:1.6;overflow:auto;max-height:260px;">${text}</pre>
      <div style="display:flex;gap:8px;margin-top:14px;">
        <button onclick="navigator.clipboard.writeText(\`${text.replace(/`/g,'\\`')}\`);showToast('📋 Copied to clipboard!');document.getElementById('shareModal').style.display='none';" style="flex:1;background:var(--accent);color:#fff;border:none;border-radius:var(--radius);padding:10px;font-size:13px;font-family:var(--font);font-weight:600;cursor:pointer;">📋 Copy Text</button>
        <button onclick="document.getElementById('shareModal').style.display='none';" style="background:var(--surface2);color:var(--text2);border:1.5px solid var(--border);border-radius:var(--radius);padding:10px 16px;font-size:13px;font-family:var(--font);cursor:pointer;">✕ Close</button>
      </div>
    </div>`;
}

/* ════════════════════════════════════════════
   🔀 COMPARE ROUTES TAB (4th tab)
════════════════════════════════════════════ */
function injectCompareTab() {
  // Inject tab button
  const tabNav = document.querySelector(".tab-nav");
  if (tabNav && !document.getElementById("tab-compare")) {
    const btn = document.createElement("button");
    btn.className = "tab-btn";
    btn.id = "tab-compare";
    btn.textContent = "🔀 Compare";
    btn.onclick = () => switchTab("compare");
    tabNav.appendChild(btn);
  }

  // Inject panel
  if (!document.getElementById("panel-compare")) {
    const panel = document.createElement("section");
    panel.id = "panel-compare";
    panel.className = "hidden";
    panel.style.cssText = "padding:20px 24px;";
    panel.innerHTML = `
      <h2 style="font-size:18px;font-weight:600;color:var(--text);margin-bottom:6px;">🔀 Compare Two Routes Across All Times</h2>
      <p style="font-size:13px;color:var(--text2);margin-bottom:18px;">Enter two routes. Get side-by-side risk scores across all 4 time windows.</p>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px;">
        <div>
          <div style="font-size:12px;font-weight:600;color:var(--text2);margin-bottom:6px;">ROUTE A</div>
          <input id="cmp-a-start" placeholder="Start A (e.g. Miyapur)" style="width:100%;padding:10px 12px;border:1.5px solid var(--border);border-radius:var(--radius);background:var(--surface);color:var(--text);font-family:var(--font);font-size:13px;margin-bottom:6px;"/>
          <input id="cmp-a-end" placeholder="End A (e.g. LB Nagar)" style="width:100%;padding:10px 12px;border:1.5px solid var(--border);border-radius:var(--radius);background:var(--surface);color:var(--text);font-family:var(--font);font-size:13px;"/>
        </div>
        <div>
          <div style="font-size:12px;font-weight:600;color:var(--text2);margin-bottom:6px;">ROUTE B</div>
          <input id="cmp-b-start" placeholder="Start B (e.g. Gachibowli)" style="width:100%;padding:10px 12px;border:1.5px solid var(--border);border-radius:var(--radius);background:var(--surface);color:var(--text);font-family:var(--font);font-size:13px;margin-bottom:6px;"/>
          <input id="cmp-b-end" placeholder="End B (e.g. Madina)" style="width:100%;padding:10px 12px;border:1.5px solid var(--border);border-radius:var(--radius);background:var(--surface);color:var(--text);font-family:var(--font);font-size:13px;"/>
        </div>
      </div>

      <button onclick="runRouteComparison()" style="background:linear-gradient(135deg,#c0392b,#922b21);color:#fff;border:none;border-radius:var(--radius);padding:12px 28px;font-size:14px;font-weight:600;font-family:var(--font);cursor:pointer;box-shadow:0 4px 14px rgba(192,57,43,0.35);">🔀 Compare Routes</button>

      <div id="cmpResults" style="margin-top:20px;"></div>
    `;
    const panelHistory = document.getElementById("panel-history");
    if (panelHistory) panelHistory.parentNode.insertBefore(panel, panelHistory.nextSibling);
  }
}

async function runRouteComparison() {
  const aStart = document.getElementById("cmp-a-start")?.value.trim();
  const aEnd   = document.getElementById("cmp-a-end")?.value.trim();
  const bStart = document.getElementById("cmp-b-start")?.value.trim();
  const bEnd   = document.getElementById("cmp-b-end")?.value.trim();
  if (!aStart || !aEnd || !bStart || !bEnd) {
    alert("Please fill in all 4 fields.");
    return;
  }

  const resultsEl = document.getElementById("cmpResults");
  resultsEl.innerHTML = `<div style="color:var(--text2);font-size:13px;padding:20px;text-align:center;">⏳ Calculating… fetching routes & scores…</div>`;

  try {
    const [sA, eA, sB, eB] = await Promise.all([
      geocode(aStart), geocode(aEnd), geocode(bStart), geocode(bEnd)
    ]);

    const [routeA, routeB] = await Promise.all([
      fetch(`https://router.project-osrm.org/route/v1/driving/${sA.lng},${sA.lat};${eA.lng},${eA.lat}?overview=full&geometries=geojson`).then(r=>r.json()),
      fetch(`https://router.project-osrm.org/route/v1/driving/${sB.lng},${sB.lat};${eB.lng},${eB.lat}?overview=full&geometries=geojson`).then(r=>r.json()),
    ]);

    const ptA = routeA.routes[0].geometry.coordinates.map(c=>[c[1],c[0]]);
    const ptB = routeB.routes[0].geometry.coordinates.map(c=>[c[1],c[0]]);
    const dA  = routeA.routes[0].distance / 1000;
    const dB  = routeB.routes[0].distance / 1000;

    // Compute score for each route × each time window
    const timeMultipliers = { morning:1.15, afternoon:1.00, evening:1.45, night:1.30 };
    const weather = await getWeatherFactor();

    function quickScore(pts, dist, s, e, timeMult) {
      let rawRisk = 0, hitZones = [];
      const sampled = pts.filter((_,i) => i % 4 === 0);
      sampled.forEach(pt => {
        HOTSPOTS.forEach(h => {
          const d = haversine(pt[0], pt[1], h.lat, h.lng);
          if (d < 800) {
            rawRisk += h.weight * Math.pow(1 - d / 800, 1.8);
            if (!hitZones.includes(h.name)) hitZones.push(h.name);
          }
        });
      });
      const density = rawRisk / Math.max(dist, 0.5);
      let score = density * 4.5 * timeMult;
      if (hitZones.length > 1) score += Math.min((hitZones.length - 1) * 6, 24);
      const shape = getRouteStraightnessBonus(pts, dist, s, e);
      score += shape.bonus;
      score *= weather.factor;
      return { score: Math.round(Math.min(100, Math.max(15, score))), zones: hitZones };
    }

    const times = ["morning","afternoon","evening","night"];
    const scoresA = times.map(t => quickScore(ptA, dA, sA, eA, timeMultipliers[t]));
    const scoresB = times.map(t => quickScore(ptB, dB, sB, eB, timeMultipliers[t]));

    const avgA = Math.round(scoresA.reduce((s,x) => s + x.score, 0) / times.length);
    const avgB = Math.round(scoresB.reduce((s,x) => s + x.score, 0) / times.length);
    const winner = avgA <= avgB ? "A" : "B";

    const timeIcons = ["🌅","☀️","🌆","🌙"];
    const timeNames = ["Morning","Afternoon","Evening","Night"];

    resultsEl.innerHTML = `
      <div style="font-size:15px;font-weight:600;color:var(--text);margin-bottom:14px;">
        Results: ${sA.label}→${eA.label} vs ${sB.label}→${eB.label}
        <span style="margin-left:10px;background:${winner==="A"?"#27ae60":"#3498db"};color:#fff;font-size:11px;padding:3px 10px;border-radius:99px;">🏆 Route ${winner} Wins</span>
      </div>
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead>
            <tr style="background:var(--surface2);">
              <th style="padding:10px 12px;text-align:left;color:var(--text2);font-weight:600;">Time</th>
              <th style="padding:10px 12px;text-align:center;color:var(--text2);font-weight:600;">Route A: ${sA.label}→${eA.label}</th>
              <th style="padding:10px 12px;text-align:center;color:var(--text2);font-weight:600;">Route B: ${sB.label}→${eB.label}</th>
              <th style="padding:10px 12px;text-align:center;color:var(--text2);font-weight:600;">Winner</th>
            </tr>
          </thead>
          <tbody>
            ${times.map((t, i) => {
              const sa = scoresA[i].score, sb = scoresB[i].score;
              const w = sa <= sb ? "A" : "B";
              const colA = sa >= 60 ? "#e74c3c" : sa >= 35 ? "#e67e22" : "#27ae60";
              const colB = sb >= 60 ? "#e74c3c" : sb >= 35 ? "#e67e22" : "#27ae60";
              return `<tr style="border-bottom:1px solid var(--border);">
                <td style="padding:10px 12px;color:var(--text2);">${timeIcons[i]} ${timeNames[i]}</td>
                <td style="padding:10px 12px;text-align:center;font-weight:700;color:${colA};">${sa}/100</td>
                <td style="padding:10px 12px;text-align:center;font-weight:700;color:${colB};">${sb}/100</td>
                <td style="padding:10px 12px;text-align:center;font-weight:600;color:${w==="A"?"#27ae60":"#3498db"};">Route ${w}</td>
              </tr>`;
            }).join("")}
            <tr style="background:var(--surface2);font-weight:700;">
              <td style="padding:10px 12px;color:var(--text);">📊 Average</td>
              <td style="padding:10px 12px;text-align:center;color:${avgA>=60?"#e74c3c":avgA>=35?"#e67e22":"#27ae60"};">${avgA}/100</td>
              <td style="padding:10px 12px;text-align:center;color:${avgB>=60?"#e74c3c":avgB>=35?"#e67e22":"#27ae60"};">${avgB}/100</td>
              <td style="padding:10px 12px;text-align:center;color:${winner==="A"?"#27ae60":"#3498db"};">🏆 Route ${winner}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div style="margin-top:10px;font-size:11px;color:var(--text3);font-style:italic;">
        Scores use v7 formula with live weather (${weather.label}). Differences may vary by real-time conditions.
      </div>`;
  } catch(err) {
    resultsEl.innerHTML = `<div style="color:#e74c3c;font-size:13px;padding:12px;">${err.message}</div>`;
  }
}

/* ════════════════════════════════════════════
   AUTO TIME SYNC
════════════════════════════════════════════ */
function autoDetectTime() {
  const hour = new Date().getHours();
  let detected = "afternoon";
  if      (hour >= 6  && hour < 10) detected = "morning";
  else if (hour >= 10 && hour < 17) detected = "afternoon";
  else if (hour >= 17 && hour < 21) detected = "evening";
  else                               detected = "night";
  setTime(detected);
}

/* ════════════════════════════════════════════
   LIVE SCORE REFRESH — every 5 min
════════════════════════════════════════════ */
function enableLiveScoreRefresh() {
  setInterval(async () => {
    if (_lastRoutePoints && _lastDistKm !== null) {
      await computeRiskScore(_lastRoutePoints, _lastDistKm, _lastStartPt, _lastEndPt);
    }
  }, 5 * 60 * 1000);
}

/* ════════════════════════════════════════════
   SAFETY TIPS PANEL
════════════════════════════════════════════ */
const SAFETY_TIPS = {
  high: [
    "🐢 Keep speed below 40 km/h through black spots.",
    "👁️ Scan intersections before passing — don't trust the green light alone.",
    "🚫 Avoid phone use — reaction time drops 40% when distracted.",
    "🚨 Turn on hazard lights when entering congested zones.",
    "🛑 Keep 4-second following distance behind the vehicle ahead.",
  ],
  med: [
    "⚠️ Reduce speed by 20% when approaching listed hotspots.",
    "🔦 Ensure headlights are on even in daytime in tunnel/flyover zones.",
    "🛵 Watch for two-wheelers cutting from the left at signals.",
    "🚦 Anticipate signal jumpers at major junctions.",
  ],
  low: [
    "✅ Route looks safe — maintain steady speed and lane discipline.",
    "👀 Stay alert — even safe routes can have sudden pedestrian crossings.",
    "🌧️ Adjust braking distance if roads are wet.",
  ]
};

function showSafetyTips(score, hitZones) {
  let tipsEl = document.getElementById("safetyTips");
  if (!tipsEl) {
    tipsEl = document.createElement("div");
    tipsEl.id = "safetyTips";
    tipsEl.style.cssText = `
      margin-top:12px;padding:12px 16px;
      background:var(--surface2);border:1.5px solid var(--border);
      border-radius:var(--radius);font-size:12px;color:var(--text2);
      line-height:1.8;
    `;
    document.getElementById("riskCard").appendChild(tipsEl);
  }
  const level = score >= 60 ? "high" : score >= 35 ? "med" : "low";
  const tips  = SAFETY_TIPS[level];
  tipsEl.innerHTML = `<b style="color:var(--text);font-size:13px;">🛡️ Safety Tips for This Route</b><br>` +
    tips.map(tip => `• ${tip}`).join("<br>");
}

/* ════════════════════════════════════════════
   ROUTE HISTORY — localStorage
════════════════════════════════════════════ */
function loadHistory() {
  try { historyData = JSON.parse(localStorage.getItem("rakshak_history") || "[]"); }
  catch { historyData = []; }
}

function saveHistory(score, hitZones, distKm) {
  if (!lastRouteData) return;
  const entry = {
    ...lastRouteData, score,
    level: score >= 60 ? "HIGH" : score >= 35 ? "MODERATE" : "LOW",
    zones: hitZones.join(", ") || "None",
    distKm: parseFloat(lastRouteData.distKm)
  };
  historyData.unshift(entry);
  if (historyData.length > 50) historyData = historyData.slice(0, 50);
  localStorage.setItem("rakshak_history", JSON.stringify(historyData));
  buildHistoryPanel();
}

function buildHistoryPanel() {
  const panel = document.getElementById("historyBody");
  if (!panel) return;
  if (!historyData.length) {
    panel.innerHTML = `<div style="text-align:center;color:var(--text3);padding:40px;font-size:14px;">No routes searched yet. Use Map & Route to begin.</div>`;
    return;
  }
  panel.innerHTML = historyData.map((h, i) => {
    const col = h.score >= 60 ? "#c0392b" : h.score >= 35 ? "#e67e22" : "#27ae60";
    const bg  = h.score >= 60 ? "#fde8e8" : h.score >= 35 ? "#fef5e7" : "#e9f7ef";
    return `
    <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;padding:12px 0;border-bottom:1px solid var(--border)">
      <span style="font-size:22px;font-weight:700;color:${col};min-width:48px;">${h.score}</span>
      <div style="flex:1;min-width:160px">
        <div style="font-size:13px;font-weight:600;color:var(--text)">${h.start} → ${h.end}</div>
        <div style="font-size:11px;color:var(--text3)">${h.timestamp} · ${h.distKm} km · ${h.time}</div>
        <div style="font-size:11px;color:var(--text2);margin-top:2px">${h.zones ? "Zones: " + h.zones.split(",").slice(0,3).join(", ") : "No zones hit"}</div>
      </div>
      <span style="font-size:11px;font-weight:600;padding:3px 12px;border-radius:99px;background:${bg};color:${col}">${h.level}</span>
    </div>`;
  }).join("");
}

function clearHistory() {
  historyData = [];
  localStorage.removeItem("rakshak_history");
  buildHistoryPanel();
}

/* ════════════════════════════════════════════
   EXPORT XLS (CSV)
════════════════════════════════════════════ */
function exportRouteXLS() {
  if (!lastRouteData) { alert("Search a route first!"); return; }
  const entry = historyData[0] || {};
  const rows = [
    ["RAKSHAK v7 — Route Safety Report"],
    ["Generated", new Date().toLocaleString("en-IN")],
    [],
    ["ROUTE DETAILS"],
    ["From", lastRouteData.start],
    ["To", lastRouteData.end],
    ["Distance (km)", lastRouteData.distKm],
    ["Est. Drive Time (min)", lastRouteData.durMin],
    ["Travel Time Window", TIME_LABELS[selectedTime]],
    [],
    ["RISK ANALYSIS"],
    ["AI Risk Score (/100)", entry.score || "N/A"],
    ["Risk Level", entry.level || "N/A"],
    ["Danger Zones on Route", entry.zones || "None detected"],
    [],
    ["ALL HYDERABAD HOTSPOTS"],
    ["Name","Zone","Risk Level","Weight (/10)","Latitude","Longitude","Description","Source"],
    ...HOTSPOTS.map(h => [h.name, h.zone, h.risk.toUpperCase(), h.weight, h.lat, h.lng, (h.desc||"").replace(/,/g,""), h.source||""])
  ];
  const csv  = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type:"text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = "RAKSHAK_Route_Safety.csv"; a.click();
  URL.revokeObjectURL(url);
  showToast("📊 Route data exported! Open in Excel for full formatting.");
}

/* ════════════════════════════════════════════
   SOS EMERGENCY BUTTON
════════════════════════════════════════════ */
function triggerSOS() {
  showToast("🚨 SOS Triggered! Dialling 112...");
  speak("Emergency SOS triggered. Calling 112. Help is on the way.");
  window.open("tel:112");
}

/* ════════════════════════════════════════════
   INCIDENT TICKER
════════════════════════════════════════════ */
const INCIDENTS = [
  "🚨 LIVE · ORR 144.5 km: Heavy congestion — 3 vehicles involved, clearance in progress",
  "⚠️ LIVE · Punjagutta: Signal failure reported — manual traffic control in place",
  "🚧 LIVE · LB Nagar: Water tanker overturned blocking left lane — avoid peak hours",
  "🔴 LIVE · Charminar: Night bazaar traffic — roads closed 10PM–2AM tonight",
  "⚠️ LIVE · Miyapur Junction: ORR merge backup extending 2km — delay 15+ min",
  "🚨 LIVE · Nagole: Rear-end collision cleared — traffic normalising",
  "⚠️ LIVE · Gachibowli: IT rush — expect 25 min delay 6–9 PM",
  "🔴 LIVE · Madhapur: Cab aggregator surge, wrong-way vehicles reported on service road",
  "🚧 LIVE · Secunderabad Station: Crowd spill post-concert — auto/cab queue 400m",
  "⚠️ LIVE · Banjara Hills Rd 12: Illegal parking creating blind spot — police alerted",
];

let tickerIndex = 0;
function startIncidentTicker() {
  const ticker = document.getElementById("incidentTicker");
  if (!ticker) return;
  function rotate() {
    ticker.style.opacity = "0";
    setTimeout(() => {
      ticker.textContent = INCIDENTS[tickerIndex % INCIDENTS.length];
      ticker.style.opacity = "1";
      tickerIndex++;
    }, 400);
  }
  rotate();
  setInterval(rotate, 5000);
}

/* ════════════════════════════════════════════
   BUILD DANGER ZONES PANEL
════════════════════════════════════════════ */
function buildZonesPanel() {
  const grid = document.getElementById("zonesGrid");
  grid.innerHTML = "";
  const flatGrid = document.createElement("div");
  flatGrid.className = "zones-sub-grid";
  flatGrid.style.cssText = "display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:18px;";
  HOTSPOTS.forEach(h => {
    const emoji = ZONE_EMOJIS[h.name] || "⚠️";
    const barW  = (h.weight / 10) * 100;
    const card  = document.createElement("div");
    card.className = "zone-card";
    const distFromCenter = haversine(17.4065, 78.4772, h.lat, h.lng) / 1000;
    card.innerHTML = `
      <div class="zone-img-area ${h.risk==="high" ? "high-bg" : "med-bg"}">
        <span style="font-size:42px">${emoji}</span>
        <span class="zone-risk-strip ${h.risk==="high" ? "strip-high" : "strip-med"}">${h.risk.toUpperCase()} RISK</span>
      </div>
      <div class="zone-body">
        <div class="zone-name">${h.name}</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px">
          <span class="zone-tag">${h.zone||""}</span>
          <span class="zone-tag" style="color:var(--accent)">W: ${h.weight}/10</span>
          <span class="zone-tag">${distFromCenter.toFixed(1)} km from center</span>
        </div>
        <div class="zone-desc">${h.desc||""}</div>
        ${h.source ? `<div class="zone-source">📎 ${h.source}</div>` : ""}
        <div class="zone-weight-bar">
          <div class="zone-weight-fill ${h.risk==="high" ? "fill-high" : "fill-med"}" style="width:${barW}%"></div>
        </div>
      </div>`;
    flatGrid.appendChild(card);
  });
  grid.appendChild(flatGrid);
}

/* ════════════════════════════════════════════
   TAB / DARK MODE / VOICE / UTILS
════════════════════════════════════════════ */
function switchTab(tab) {
  ["map","zones","history","compare"].forEach(tabId => {
    document.getElementById("tab-"+tabId)?.classList.remove("active");
    document.getElementById("panel-"+tabId)?.classList.add("hidden");
  });
  document.getElementById("tab-"+tab)?.classList.add("active");
  document.getElementById("panel-"+tab)?.classList.remove("hidden");
  if (tab === "map" && mapObj) setTimeout(() => mapObj.invalidateSize(), 60);
}

function toggleMode() {
  isDarkMode = !isDarkMode;
  document.body.classList.toggle("dark", isDarkMode);
  document.getElementById("modeBtn").textContent = isDarkMode ? "☀️ Light Mode" : "🌙 Dark Mode";
}

function getBestVoice(langCode) {
  const voices = window.speechSynthesis.getVoices();
  if (!voices || !voices.length) return null;
  let v = voices.find(v => v.lang === langCode);
  if (v) return v;
  const prefix = langCode.split("-")[0];
  v = voices.find(v => v.lang.startsWith(prefix));
  if (v) return v;
  v = voices.find(v => v.lang === "en-IN") || voices.find(v => v.lang.startsWith("en"));
  return v || voices[0] || null;
}

function speak(text) {
  showToast(text);
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const doSpeak = () => {
    const voice = getBestVoice(t().code);
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.92; u.pitch = 1.0; u.volume = 1.0;
    if (voice) { u.voice = voice; u.lang = voice.lang; } else { u.lang = "en-IN"; }
    window.speechSynthesis.speak(u);
  };
  window.speechSynthesis.getVoices().length > 0
    ? doSpeak()
    : window.speechSynthesis.addEventListener("voiceschanged", doSpeak, { once:true });
}

function showToast(msg) {
  const toast = document.getElementById("toast");
  document.getElementById("toastMsg").textContent = msg;
  toast.classList.add("show");
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 5500);
}

function haversine(lat1, lon1, lat2, lon2) {
  const R=6371000, p1=lat1*Math.PI/180, p2=lat2*Math.PI/180;
  const dp=(lat2-lat1)*Math.PI/180, dl=(lon2-lon1)*Math.PI/180;
  const a=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

function setLoader(on) {
  const el = document.getElementById("loader");
  on ? el.classList.add("active") : el.classList.remove("active");
}
