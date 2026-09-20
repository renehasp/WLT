import { APP_VERSION } from "./version";

export type ChangeKind = "added" | "changed" | "fixed";

export type Release = {
  version: string;
  date: string;
  title: string;
  changes: { kind: ChangeKind; items: string[] }[];
};

export const RELEASES: Release[] = [
  {
    version: "1.2.0",
    date: "2026-09-20",
    title: "Real VIP airframe and vessel photos",
    changes: [
      {
        kind: "added",
        items: [
          "Every aircraft and both vessels now show a real photograph in the detail card and craft overlay.",
          "Photos sourced from Wikimedia Commons (CC BY / CC BY-SA / CC0 / public domain / GODL-India) — not JetPhotos or Planespotters, whose catalogues are not free to reuse.",
          "Attribution table in docs/craft-attribution.md.",
        ],
      },
    ],
  },
  {
    version: "1.1.0",
    date: "2026-09-20",
    title: "Notes, permalinks, and the detail card",
    changes: [
      {
        kind: "added",
        items: [
          "Header version badge opens in-app release notes for every ship.",
          "Shareable URL: clock, live mode, selected principal, and event (`?t=` `?id=` `?e=`).",
          "Copy-link control in the header.",
          "Keyboard: Space play/pause, L jump to live, N open notes.",
          "Principal detail From/To timers and clickable craft overlay.",
        ],
      },
      {
        kind: "changed",
        items: [
          "ADS-B badge copy and About dialog focus trap.",
          "Map legends for trails and source confidence.",
        ],
      },
      {
        kind: "fixed",
        items: [
          "At-sea principals open vessel craft, not the airframe.",
          "Lint/test scripts on Node 22.12+.",
        ],
      },
    ],
  },
  {
    version: "1.0.0",
    date: "2026-09-20",
    title: "WLT public launch",
    changes: [
      {
        kind: "added",
        items: [
          "World Leaders Tracker: live map of principals for UNGA week.",
          "OpenStreetMap basemap (no tile key), Leaflet pins, red/green heading trails.",
          "Official schedules fused with ADS-B (adsb.lol / OpenSky) and modeled tracks.",
          "Scrubbable timeline, events wire, and clustered conference pins.",
          "Docker Compose image for self-hosted deploys.",
        ],
      },
    ],
  },
];

export function currentRelease(version = APP_VERSION): Release | undefined {
  return RELEASES.find((r) => r.version === version) ?? RELEASES[0];
}

export const CHANGE_KIND_LABEL: Record<ChangeKind, string> = {
  added: "Added",
  changed: "Changed",
  fixed: "Fixed",
};
