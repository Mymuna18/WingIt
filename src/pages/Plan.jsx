import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

// ── constants ──────────────────────────────────────────────────────────────


const GEO_KEY    = "f8317d9cf1004875bae728292249835a";

const categoryEmoji = {
  catering: "🍜", entertainment: "🎨", leisure: "🌿",
  activity: "🏃", tourism: "🏯", unknown: "📍",
};
const categoryLabel = {
  "catering.restaurant": "Restaurant", entertainment: "Entertainment",
  "leisure.park": "Park", activity: "Activity", tourism: "Tourism", unknown: "Place",
};
const categoryColors = {
  catering:      { bg: "#FAEEDA", color: "#854F0B" },
  entertainment: { bg: "#EEEDFE", color: "#3C3489" },
  leisure:       { bg: "#EAF3DE", color: "#3B6D11" },
  activity:      { bg: "#FAECE7", color: "#993C1D" },
  tourism:       { bg: "#E6F1FB", color: "#0C447C" },
  unknown:       { bg: "#F1EFE8", color: "#5F5E5A" },
};

const weatherIcon = (code) => {
  if (code == null) return "—";
  if (code === 0) return "☀️";
  if (code === 1 || code === 2) return "⛅";
  if (code === 3) return "☁️";
  if (code === 45 || code === 48) return "🌫️";
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67].includes(code)) return "🌧️";
  if ([71, 73, 75, 77].includes(code)) return "❄️";
  if ([80, 81, 82].includes(code)) return "🌦️";
  if ([95, 96, 99].includes(code)) return "⛈️";
  return "❓";
};
const weatherLabel = (code) => {
  if (code == null) return "Unknown";
  if (code === 0) return "Sunny";
  if (code === 1 || code === 2) return "Partly cloudy";
  if (code === 3) return "Cloudy";
  if (code === 45 || code === 48) return "Foggy";
  if ([51, 53, 55].includes(code)) return "Drizzle";
  if ([56, 57, 66, 67].includes(code)) return "Freezing rain";
  if ([61, 63, 65].includes(code)) return "Rainy";
  if ([71, 73, 75, 77].includes(code)) return "Snowy";
  if ([80, 81, 82].includes(code)) return "Showers";
  if ([95, 96, 99].includes(code)) return "Stormy";
  return "Unknown";
};

const categoryMap = {
  food: "catering.restaurant", art: "entertainment",
  adventure: "leisure.park", activities: "activity", tourist: "tourism",
};

// ── helpers ────────────────────────────────────────────────────────────────

const getCategoryKey = (raw) => {
  if (!raw) return "unknown";
  const parts = raw.split(".");
  for (let i = parts.length; i > 0; i--) {
    const key = parts.slice(0, i).join(".");
    if (categoryEmoji[key]) return key;
    if (categoryEmoji[parts[0]]) return parts[0];
  }
  return "unknown";
};
const getEmoji  = (raw) => categoryEmoji[getCategoryKey(raw)] || "📍";
const getColors = (raw) => categoryColors[getCategoryKey(raw)] || categoryColors.unknown;

const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
};

const parseOpeningHours = (str) => {
  if (!str) return null;
  if (str === "24/7") return { isOpen: true, label: "Open 24/7" };
  try {
    const now = new Date();
    const dayNames = ["Su","Mo","Tu","We","Th","Fr","Sa"];
    const today = dayNames[now.getDay()];
    const cur   = now.getHours() * 60 + now.getMinutes();
    for (const seg of str.split(";").map(s => s.trim())) {
      const m = seg.match(/([A-Za-z]{2})(?:-([A-Za-z]{2}))?\s+(\d{2}:\d{2})-(\d{2}:\d{2})/);
      if (!m) continue;
      const [, sd, ed, open, close] = m;
      const order = ["Mo","Tu","We","Th","Fr","Sa","Su"];
      const si = order.indexOf(sd), ei = ed ? order.indexOf(ed) : si, ti = order.indexOf(today);
      if (si <= ei ? ti >= si && ti <= ei : ti >= si || ti <= ei) {
        const [oh, om] = open.split(":").map(Number);
        const [ch, cm] = close.split(":").map(Number);
        const isOpen = cur >= oh * 60 + om && cur < ch * 60 + cm;
        return { isOpen, label: isOpen ? `Open · closes ${close}` : `Closed · opens ${open}` };
      }
    }
  } catch (_) {}
  return { isOpen: null, label: str.slice(0, 30) };
};

const datesBetween = (start, end) => {
  const dates = [], cur = new Date(start + "T12:00:00"), last = new Date(end + "T12:00:00");
  while (cur <= last) { dates.push(cur.toISOString().slice(0, 10)); cur.setDate(cur.getDate() + 1); }
  return dates;
};

const fmt = (iso) =>
  new Date(iso + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

const today = new Date().toISOString().slice(0, 10);

const FORECAST_LIMIT_DAYS = 16;

const daysDiff = (a, b) =>
  Math.round((new Date(b + "T12:00:00") - new Date(a + "T12:00:00")) / 86400000);

// ── component ──────────────────────────────────────────────────────────────

export default function Plan() {
  const [city, setCity]                       = useState("");
  const [preferences, setPreferences]         = useState([]);
  const [places, setPlaces]                   = useState([]);
  const [selectedPlaces, setSelectedPlaces]   = useState([]);
  const [startDate, setStartDate]             = useState("");
  const [endDate, setEndDate]                 = useState("");
  const [cityCoords, setCityCoords]           = useState(null);
  const [schedule, setSchedule]               = useState(null);
  const [loading, setLoading]                 = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleStatus, setScheduleStatus]   = useState("");
  const [error, setError]                     = useState("");
  const [activeDay, setActiveDay]             = useState(0);
  const [legDistances, setLegDistances]       = useState({});

  const location = useLocation();

  useEffect(() => {
    if (location.state?.loadedTrip) {
      const trip = location.state.loadedTrip;
      setCity(trip.city || "");
      setPreferences(trip.preferences || []);
      setStartDate(trip.startDate || "");
      setEndDate(trip.endDate || "");
      setSelectedPlaces(trip.selectedPlaces?.map(p => p.id) || []);
      setPlaces(trip.selectedPlaces || []);
      setCityCoords(trip.cityCoords || null);
      setSchedule(trip.schedule || null);
      setLegDistances(trip.legDistances || {});
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const togglePreference = (p) =>
    setPreferences(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  const togglePlace = (id) =>
    setSelectedPlaces(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  // ── fetch places ──────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setError("");
    if (!city.trim())        { setError("Enter a city."); return; }
    if (!preferences.length) { setError("Pick at least one preference."); return; }
    setLoading(true); setPlaces([]); setSelectedPlaces([]); setSchedule(null);

    try {
      const nomRes  = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}`);
      const nomData = await nomRes.json();
      if (!nomData[0]) { setError("City not found."); setLoading(false); return; }

      const { lat, lon } = nomData[0];
      setCityCoords({ lat: parseFloat(lat), lon: parseFloat(lon) });

      const cats   = preferences.map(p => categoryMap[p]).join(",");
      const geoRes = await fetch(
        `https://api.geoapify.com/v2/places?categories=${cats}&filter=circle:${lon},${lat},5000&limit=12&apiKey=${GEO_KEY}`
      );
      const geoData = await geoRes.json();
      if (!geoData.features || !Array.isArray(geoData.features)) {
        setError("No places found for that city or preferences.");
        setLoading(false);
        return;
      }

      const clean = geoData.features.map(f => ({
        id:           f.properties.place_id,
        name:         f.properties.name,
        address:      f.properties.address_line1,
        website:      f.properties.website || null,
        category:     f.properties.categories?.[0] || "unknown",
        lat:          f.geometry.coordinates[1],
        lon:          f.geometry.coordinates[0],
        distance:     getDistance(lat, lon, f.geometry.coordinates[1], f.geometry.coordinates[0]),
        openingHours: null,
      })).filter(p => p.name);

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const filters = clean.map(p =>
          `node["name"="${p.name.replace(/"/g, '\\"')}"](around:5000,${lat},${lon});`
        ).join("\n");
        const ovRes  = await fetch("https://overpass-api.de/api/interpreter", {
          method: "POST",
          body: `[out:json][timeout:8];\n(\n${filters}\n);\nout body;`,
          signal: controller.signal,
        });
        clearTimeout(timeout);
        const ovData = await ovRes.json();
        const hMap = {};
        for (const el of ovData.elements)
          if (el.tags?.name && el.tags?.opening_hours) hMap[el.tags.name] = el.tags.opening_hours;
        clean.forEach(p => { p.openingHours = hMap[p.name] || null; });
      } catch (_) {}

      if (clean.length === 0) {
        setError("No places found for those preferences. Try a different city or filters.");
        setLoading(false);
        return;
      }

      setPlaces(clean);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch places.");
    }
    setLoading(false);
  };

  // ── fetch weather ─────────────────────────────────────────────────────────
  const fetchWeather = async (lat, lon, dates) => {
    const daysFromToday = daysDiff(today, dates[0]);

    try {
      if (daysFromToday <= FORECAST_LIMIT_DAYS) {
        const res  = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
          `&daily=weathercode,temperature_2m_max,temperature_2m_min` +
          `&start_date=${dates[0]}&end_date=${dates[dates.length - 1]}&timezone=auto`
        );
        const data = await res.json();
        if (data.error) throw new Error(data.reason);
        return dates.map((date, i) => ({
          date,
          code: data.daily.weathercode[i] ?? null,
          max:  data.daily.temperature_2m_max[i]  != null ? Math.round(data.daily.temperature_2m_max[i])  : null,
          min:  data.daily.temperature_2m_min[i]  != null ? Math.round(data.daily.temperature_2m_min[i])  : null,
          isForecast: true,
        }));
      } else {
        const res   = await fetch(
          `https://climate-api.open-meteo.com/v1/climate?latitude=${lat}&longitude=${lon}` +
          `&start_date=${dates[0].slice(0,4)}-01-01&end_date=${dates[dates.length-1].slice(0,4)}-12-31` +
          `&models=EC_Earth3P_HR&daily=temperature_2m_max,temperature_2m_min`
        );
        const data = await res.json();
        const climateMap = {};
        if (data.daily?.time) {
          data.daily.time.forEach((t, i) => {
            climateMap[t] = {
              max: data.daily.temperature_2m_max[i] != null ? Math.round(data.daily.temperature_2m_max[i]) : null,
              min: data.daily.temperature_2m_min[i] != null ? Math.round(data.daily.temperature_2m_min[i]) : null,
            };
          });
        }
        return dates.map(date => ({
          date,
          code: null,
          max:  climateMap[date]?.max ?? null,
          min:  climateMap[date]?.min ?? null,
          isForecast: false,
        }));
      }
    } catch (_) {
      return dates.map(date => ({ date, code: null, max: null, min: null, isForecast: false }));
    }
  };

  // ── fetch walking distances ───────────────────────────────────────────────
  const fetchLegDistances = async (days) => {
    const profile = "foot";
    const newLegs = {};
    for (let di = 0; di < days.length; di++) {
      const ps = days[di].places;
      for (let pi = 0; pi < ps.length - 1; pi++) {
        const from = ps[pi], to = ps[pi + 1];
        if (!from.lat || !to.lat) continue;
        const key = `${di}-${pi}`;
        try {
          const res = await fetch(
            `https://router.project-osrm.org/route/v1/${profile}/${from.lon},${from.lat};${to.lon},${to.lat}?overview=false`
          );
          const data = await res.json();
          const leg = data.routes?.[0];
          if (leg) {
            const km = (leg.distance / 1000).toFixed(1);
            newLegs[key] = { km };
          }
        } catch (_) {}
      }
    }
    return newLegs;
  };

  // ── schedule builder ──────────────────────────────────────────────────────
  const buildSchedule = (selectedFull, weatherDays) => {
    const numDays = weatherDays.length;

    const isOutdoor = (p) => ["leisure", "tourism", "activity"].includes(getCategoryKey(p.category));
    const isIndoor  = (p) => ["catering", "entertainment"].includes(getCategoryKey(p.category));

    const bestTime = (p) => {
      const k = getCategoryKey(p.category);
      if (k === "catering")      return "Evening";
      if (k === "entertainment") return "Afternoon";
      if (k === "leisure")       return "Morning";
      if (k === "tourism")       return "Morning";
      if (k === "activity")      return "Afternoon";
      return "Anytime";
    };

    const bestHours = (p) => {
      const k = getCategoryKey(p.category);
      if (k === "catering")      return "1–2 hours";
      if (k === "entertainment") return "2–3 hours";
      if (k === "leisure")       return "1–2 hours";
      if (k === "tourism")       return "1–3 hours";
      if (k === "activity")      return "2–4 hours";
      return "1–2 hours";
    };

    const isBadWeather = (code) => code != null && code >= 51;

    let outdoorPool = [...selectedFull.filter(isOutdoor)];
    let indoorPool  = [...selectedFull.filter(isIndoor)];
    let mixedPool   = [...selectedFull.filter(p => !isOutdoor(p) && !isIndoor(p))];

    const dayAssignments = Array.from({ length: numDays }, () => []);
    const allPools = [...outdoorPool, ...indoorPool, ...mixedPool];

    const assigned = new Set();
    weatherDays.forEach((w, di) => {
      const bad = isBadWeather(w.code);
      const preferred = bad
        ? [...indoorPool, ...mixedPool, ...outdoorPool]
        : [...outdoorPool, ...mixedPool, ...indoorPool];
      const pick = preferred.find(p => !assigned.has(p.id));
      if (pick) { dayAssignments[di].push(pick); assigned.add(pick.id); }
    });

    const remaining = allPools.filter(p => !assigned.has(p.id));
    remaining.forEach((p, i) => {
      dayAssignments[i % numDays].push(p);
    });

    return weatherDays.map((w, di) => ({
      ...w,
      places: dayAssignments[di]
        .sort((a, b) => {
          const order = { Morning: 0, Afternoon: 1, Evening: 2, Anytime: 3 };
          return (order[bestTime(a)] ?? 3) - (order[bestTime(b)] ?? 3);
        })
        .map(p => ({
          ...p,
          best_time:       bestTime(p),
          estimated_hours: bestHours(p),
        })),
    }));
  };

  // ── WingIt handler ────────────────────────────────────────────────────────
  const handleWingIt = async () => {
    setError("");
    if (!startDate || !endDate)                  { setError("Pick your travel dates."); return; }
    if (new Date(endDate) < new Date(startDate)) { setError("End date must be after start date."); return; }
    if (!selectedPlaces.length)                  { setError("Select at least one place."); return; }

    setScheduleLoading(true); setSchedule(null);
    setScheduleStatus("Getting weather forecast...");

    const dates        = datesBetween(startDate, endDate);
    const selectedFull = places.filter(p => selectedPlaces.includes(p.id));
    const weatherDays  = await fetchWeather(cityCoords.lat, cityCoords.lon, dates);

    setScheduleStatus("Building your schedule...");
    const mergedDays = buildSchedule(selectedFull, weatherDays);

    setSchedule({ days: mergedDays, hasForecast: weatherDays[0]?.isForecast });
    fetchLegDistances(mergedDays).then(setLegDistances);
    setActiveDay(0);
    setScheduleStatus("");
    setScheduleLoading(false);
  };

  // ── shared styles ─────────────────────────────────────────────────────────
  const badgeStyle = (colors) => ({
    display: "inline-flex", alignItems: "center", fontSize: "11px", fontWeight: 600,
    padding: "3px 9px", borderRadius: "20px", background: colors.bg, color: colors.color,
  });
  const dotStyle = (isOpen) => ({
    width: "7px", height: "7px", borderRadius: "50%", flexShrink: 0,
    background: isOpen === true ? "#639922" : isOpen === false ? "#E24B4A" : "#ccc",
  });
  const cardStyle = (selected) => ({
    borderRadius: "14px", border: selected ? "2px solid #378ADD" : "1px solid #e0e0e0",
    background: "#fff", cursor: "pointer", padding: "16px",
    display: "flex", flexDirection: "column", gap: "10px",
  });

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: "20px", maxWidth: "1000px", width: "100%", margin: "auto", fontFamily: "sans-serif" }}>
      <h1 style={{ textAlign: "center", marginBottom: "14px", color: "#000" }}>
        <img src="/logo.png" alt="WingIt" style={{width: '48px', height: '48px', verticalAlign: 'middle', marginRight: '12px'}} />
        WingIt
      </h1>

      {error && (
        <p style={{ color: "#d32f2f", background: "#ffebee", padding: "10px", borderRadius: "8px" }}>
          {error}
        </p>
      )}

      {/* SEARCH */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "stretch" }}>
        <input value={city} onChange={e => setCity(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          placeholder="Enter a city..."
          style={{ flex: 1, minWidth: "220px", padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }} />
        <button onClick={handleSubmit}
          style={{ padding: "10px 20px", borderRadius: "8px", background: "#2f3236", color: "#fff", border: "none", cursor: "pointer", flexShrink: 0, width: "min(140px, 100%)" }}>
          Go
        </button>
      </div>

      {/* PREFS */}
      <div style={{ marginTop: "14px", display: "flex", gap: "8px" }}>
        {Object.keys(categoryMap).map(pref => (
          <button key={pref} onClick={() => togglePreference(pref)} style={{
            padding: "8px 16px", borderRadius: "20px", border: "none", cursor: "pointer",
            background: preferences.includes(pref) ? "#2f3236" : "#eee",
            color:      preferences.includes(pref) ? "#fff"    : "#333",
          }}>{pref}</button>
        ))}
      </div>

      {loading && (
        <div style={{
          position: 'fixed', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)', zIndex: 1000,
        }}>
          <img src="/loading.gif" alt="Loading places..." style={{ width: '150px', height: '150px' }} />
        </div>
      )}

      {/* PLACES GRID */}
      {places.length > 0 && (
        <>
          <div style={{
            minHeight: "320px", maxHeight: "560px", overflowY: "auto", border: "1px solid #ddd", borderRadius: "14px",
            padding: "14px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px",
            background: "#fafafa", marginTop: "20px",
          }}>
            {places.map(place => {
              const selected = selectedPlaces.includes(place.id);
              const colors   = getColors(place.category);
              const hours    = parseOpeningHours(place.openingHours);
              return (
                <div key={place.id} onClick={() => togglePlace(place.id)} style={cardStyle(selected)}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                    <div style={{ width: "52px", height: "52px", borderRadius: "12px", background: colors.bg,
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", flexShrink: 0 }}>
                      {getEmoji(place.category)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: "15px", lineHeight: 1.3 }}>{place.name}</p>
                      <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#888", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {place.address}
                      </p>
                    </div>
                    <div style={{ width: "20px", height: "20px", borderRadius: "50%", flexShrink: 0,
                      border: selected ? "none" : "1.5px solid #ccc", background: selected ? "#378ADD" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {selected && <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>}
                    </div>
                  </div>

                  <div style={{ height: "0.5px", background: "#ebebeb" }} />

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div><span style={badgeStyle(colors)}>{categoryLabel[place.category] || "Place"}</span></div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#666" }}>
                      <span>📍</span><span>{place.distance} km from city center</span>
                    </div>
                    {hours ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#666" }}>
                        <span style={dotStyle(hours.isOpen)} /><span>{hours.label}</span>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#bbb" }}>
                        <span style={dotStyle(null)} /><span>Hours not available</span>
                      </div>
                    )}
                    {place.website ? (
                      <a href={place.website} target="_blank" rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        style={{ color: "#2f3236", fontSize: "12px", fontWeight: 600, textDecoration: "none" }}>
                        Visit website →
                      </a>
                    ) : (
                      <span style={{ fontSize: "12px", color: "#bbb" }}>Website not available</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* DATE RANGE + WINGIT */}
          <div style={{ marginTop: "20px", background: "#fff", border: "1px solid #e0e0e0", borderRadius: "14px", padding: "18px" }}>
            <p style={{ margin: "0 0 12px", fontWeight: 600, fontSize: "14px", color: "#333" }}>
              When are you travelling?
            </p>
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap", width: "100%" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "11px", color: "#888", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>From</label>
                <input type="date" value={startDate} min={today}
                  onChange={e => { setStartDate(e.target.value); if (endDate && e.target.value > endDate) setEndDate(""); }}
                  style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "14px", cursor: "pointer" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "11px", color: "#888", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>To</label>
                <input type="date" value={endDate} min={startDate || today}
                  onChange={e => setEndDate(e.target.value)}
                  style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "14px", cursor: "pointer" }} />
              </div>
              {startDate && endDate && (
                <p style={{ fontSize: "13px", color: "#888", margin: "0 0 10px" }}>
                  {datesBetween(startDate, endDate).length} day{datesBetween(startDate, endDate).length !== 1 ? "s" : ""}
                  {selectedPlaces.length > 0 && ` · ${selectedPlaces.length} place${selectedPlaces.length !== 1 ? "s" : ""} selected`}
                </p>
              )}
              <button onClick={handleWingIt} disabled={scheduleLoading} style={{
                padding: "10px 24px", borderRadius: "8px",
                background: scheduleLoading ? "#ccc" : "#ff6b35",
                color: "#fff", border: "none", fontWeight: 700,
                cursor: scheduleLoading ? "not-allowed" : "pointer",
                fontSize: "14px", marginBottom: "1px",
              }}>
                {scheduleLoading ? "✨ Planning..." : "✨ WingIt!"}
              </button>
            </div>
            {scheduleLoading && scheduleStatus && (
              <p style={{ margin: "12px 0 0", fontSize: "13px", color: "#888" }}>{scheduleStatus}</p>
            )}
          </div>
        </>
      )}

      {/* SCHEDULE */}
      {schedule && (
        <div style={{
            marginTop: "36px", background: "#fff",
            border: "1px solid #e0e0e0", borderRadius: "16px", padding: "20px",
          }}>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700 }}>Your Trip Schedule</h2>
              {!schedule.hasForecast && (
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#aaa" }}>
                  📊 Historical averages shown — too far ahead for live forecast
                </p>
              )}
            </div>
            <button onClick={() => {
              const tripData = {
                id: Date.now(),
                city, startDate, endDate, preferences,
                selectedPlaces: selectedPlaces.map(id => places.find(p => p.id === id)).filter(Boolean),
                schedule, legDistances,
                savedAt: new Date().toISOString(),
              };
              const existingTrips = JSON.parse(localStorage.getItem("trips")) || [];
              localStorage.setItem("trips", JSON.stringify([...existingTrips, tripData]));
              alert("Trip saved successfully! You can view it in the Saved section.");
            }} style={{
              padding: "8px 16px", borderRadius: "8px", border: "none", cursor: "pointer",
              background: "#4CAF50", color: "#fff", fontSize: "14px", fontWeight: 600,
              display: "flex", alignItems: "center", gap: "6px",
            }}>
              💾 Save Trip
            </button>
          </div>

          {/* Day tabs */}
          <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "8px", marginBottom: "16px" }}>
            {schedule.days.map((day, i) => {
              const active = activeDay === i;
              const d = new Date(day.date + "T12:00:00");
              return (
                <button key={day.date} onClick={() => setActiveDay(i)} style={{
                  flexShrink: 0, padding: "10px 14px", borderRadius: "12px", cursor: "pointer",
                  border: active ? "none" : "1px solid #e8e8e8",
                  background: active ? "#2f3236" : "#fff",
                  color: active ? "#fff" : "#555",
                  fontWeight: active ? 700 : 400, transition: "all 0.15s",
                  minWidth: "64px", textAlign: "center",
                }}>
                  <div style={{ fontSize: "10px", opacity: 0.75, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {d.toLocaleDateString("en-US", { weekday: "short" })}
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: 700, lineHeight: 1.2, margin: "2px 0" }}>
                    {d.getDate()}
                  </div>
                  <div style={{ fontSize: "13px" }}>{weatherIcon(day.code)}</div>
                </button>
              );
            })}
          </div>

          {(() => {
            const day = schedule.days[activeDay];
            const isBadWeather = day.code != null && day.code >= 51;
            return (
              <div>
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "14px 18px", marginBottom: "12px", borderRadius: "12px",
                  border: `1px solid ${isBadWeather ? "#fde68a" : "#e0ecff"}`,
                  background: isBadWeather ? "#fffdf5" : "#f5f9ff",
                }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: "15px", color: "#1a1a1a" }}>{fmt(day.date)}</p>
                    <p style={{ margin: "3px 0 0", fontSize: "12px", color: "#777" }}>
                      {day.code != null
                        ? <>{weatherIcon(day.code)} {weatherLabel(day.code)}{day.max != null && ` · ${day.min}–${day.max}°C`}</>
                        : day.max != null ? <>📊 Avg {day.min}–{day.max}°C</> : "Weather data unavailable"}
                      {isBadWeather && <span style={{ color: "#b45309", fontWeight: 600 }}> · Indoor spots prioritised</span>}
                    </p>
                  </div>
                  <span style={{ fontSize: "11px", color: "#999", background: "#fff", padding: "3px 10px", borderRadius: "20px", border: "1px solid #e8e8e8" }}>
                    {day.places.length} stop{day.places.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {day.places.length === 0 ? (
                  <div style={{ padding: "48px", textAlign: "center", color: "#ccc", fontSize: "14px", border: "1px dashed #e8e8e8", borderRadius: "12px" }}>
                    No places scheduled for this day.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {day.places.map((p, i) => {
                      const colors = getColors(p.category);
                      const isLast = i === day.places.length - 1;
                      const leg = legDistances[`${activeDay}-${i}`];
                      return (
                        <div key={p.id || p.name + i}>
                          <div style={{ display: "flex", gap: "14px" }}>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "34px", flexShrink: 0 }}>
                              <div style={{
                                width: "34px", height: "34px", borderRadius: "50%", flexShrink: 0,
                                background: colors.bg, border: `2px solid ${colors.color}`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "16px", marginTop: "12px",
                              }}>
                                {getEmoji(p.category)}
                              </div>
                              {(!isLast) && <div style={{ width: "2px", flex: 1, background: "#e8e8e8", margin: "6px 0" }} />}
                            </div>
                            <div style={{
                              flex: 1, borderRadius: "12px", padding: "14px 16px",
                              background: "transparent", border: "1px solid #ebebeb",
                            }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
                                <span style={{ fontWeight: 700, fontSize: "14px", color: "#1a1a1a" }}>{p.name}</span>
                                <span style={badgeStyle(colors)}>{categoryLabel[p.category] || "Place"}</span>
                              </div>
                              <div style={{ display: "flex", gap: "14px", fontSize: "12px", color: "#999", flexWrap: "wrap", marginBottom: p.tip ? "10px" : "0" }}>
                                {p.best_time       && <span>🕐 {p.best_time}</span>}
                                {p.estimated_hours && <span>⏱ {p.estimated_hours}</span>}
                                {p.distance        && <span>📍 {p.distance} km from city center</span>}
                              </div>
                              {p.tip && (
                                <div style={{
                                  background: "#fffbf0", border: "1px solid #fde68a",
                                  borderRadius: "8px", padding: "8px 12px",
                                  fontSize: "12px", color: "#78350f", lineHeight: 1.5,
                                }}>
                                  💡 {p.tip}
                                </div>
                              )}
                            </div>
                          </div>
                          {!isLast && (
                            <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                              <div style={{ width: "28px", flexShrink: 0 }} />
                              <div style={{
                                flex: 1, margin: "4px 0", padding: "5px 12px",
                                borderRadius: "6px", background: "#f7f7f7",
                                fontSize: "11px", color: "#555", display: "flex", alignItems: "center", gap: "6px",
                              }}>
                                {leg
                                  ? <span>📏 {leg.km} km</span>
                                  : <span style={{ fontStyle: "italic", color: "#999" }}>Calculating distance...</span>}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}