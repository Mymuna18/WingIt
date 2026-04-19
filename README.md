# ✈️ WingIt

A spontaneous trip planner that builds a smart, weather-aware day-by-day itinerary for any city — in seconds.

## What It Does

Enter a city, pick what you're into (food, art, adventure, etc.), choose your travel dates, and hit **WingIt**. The app finds real places near you, checks the weather forecast, and builds a personalized schedule — putting indoor spots on rainy days and outdoor ones on sunny days.

## Features

- 🗺️ **Place Discovery** — Fetches real places via the Geoapify API based on your preferences, within 5km of the city center
- ⛅ **Weather-Aware Scheduling** — Uses live forecasts (up to 16 days) or historical climate averages for further-out trips
- 🧠 **Smart Itinerary Builder** — Distributes places across your trip days, prioritizing indoor venues on bad weather days
- 🕐 **Opening Hours** — Pulls live opening hours from OpenStreetMap via the Overpass API
- 🚶 **Walking Distances** — Shows real walking distances between stops using the OSRM routing engine
- 💾 **Save & Reload Trips** — Save any itinerary and reload it later from the Saved Trips page

## Tech Stack

- **React** + **Vite**
- **React Router** for navigation
- **Geoapify** — place search
- **Nominatim (OpenStreetMap)** — city geocoding
- **Open-Meteo** — weather forecasts & climate data
- **Overpass API** — opening hours from OpenStreetMap
- **OSRM** — walking distance routing
- **localStorage** — saving trips

## Getting Started

```bash
# Install dependencies
npm install

# Run the dev server
npm run dev
```

## Usage

1. Type a city name and select your preferences (food, art, adventure, activities, tourist)
2. Click **Go** to fetch nearby places
3. Select the places you want to visit
4. Pick your travel dates
5. Hit **✨ WingIt!** to generate your schedule
6. Click **💾 Save Trip** to save it for later.

## Project Structure

```
src/
├── pages/
│   ├── Home.jsx      # Animated landing page
│   ├── Plan.jsx      # Main trip planning page
│   └── Saved.jsx     # Saved trips viewer
└── App.jsx           # Router setup
```

## APIs Used

| API | Purpose | Cost |
|-----|---------|------|
| Geoapify | Place search | Free tier |
| Nominatim | Geocoding | Free |
| Open-Meteo | Weather | Free |
| Overpass | Opening hours | Free |
| OSRM | Walking routes | Free |

## License

MIT
