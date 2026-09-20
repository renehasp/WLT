# Changelog

All notable changes to **WLT — World Leaders Tracker** are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
The in-app **V x.y** badge reads these notes.

## [1.1.0] — 2026-09-20

### Added

- Header version badge (`V 1.1`) opens in-app release notes for every ship.
- Shareable URL for clock, live mode, selected principal, and event (`?t=` `?id=` `?e=`).
- Copy-link control in the header.
- Keyboard: Space play/pause, L jump to live, N open notes.
- Principal detail From/To timers and clickable craft overlay.

### Changed

- ADS-B badge copy and About dialog focus trap.
- Map legends for trails and source confidence.

### Fixed

- At-sea principals open vessel craft, not the airframe.
- Lint/test scripts on Node 22.12+.

## [1.0.0] — 2026-09-20

### Added

- World Leaders Tracker: live map of principals for UNGA week.
- OpenStreetMap basemap (no tile key), Leaflet pins, red/green heading trails.
- Official schedules fused with ADS-B (adsb.lol / OpenSky) and modeled tracks.
- Scrubbable timeline, events wire, and clustered conference pins.
- Docker Compose image for self-hosted deploys.

[1.1.0]: https://github.com/renehasp/WLT/releases/tag/v1.1.0
[1.0.0]: https://github.com/renehasp/WLT/releases/tag/v1.0.0
