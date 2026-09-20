# WLT — World Leaders Tracker

Live map of world principals for UNGA week — official schedules, ADS-B (adsb.lol / OpenSky), AIS-style vessels, and modeled great-circle tracks when transponders are dark.

Scrub the timeline, follow red-behind / green-ahead tracks, and open event pins for public conferences, closed bilaterals, and unscheduled holds.

**This is not GPS and not an official source.** Live contacts are labeled ADS-B. Everything else is fused from public calendars and modeled routes.

## Stack

- TanStack Start (React 19 + Vite)
- Leaflet + OpenStreetMap (no map API key)
- Zustand, Tailwind v4

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:8080](http://localhost:8080).

```bash
npm run build
npm run preview
```

## Layers

| Layer | What you see |
| --- | --- |
| Leaders | Flag pins, airborne / at-sea badges |
| Aircraft | Known VIP tails when the transponder is up |
| Vessels | Modeled ship tracks |
| Tracks | Full trip polylines |
| Events | Conference / bilateral / off-book pins — click to open the wire |
| Grid | Latitude and longitude lines |

## Attribution

Map data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors. ADS-B via [adsb.lol](https://adsb.lol) with OpenSky as fallback.
