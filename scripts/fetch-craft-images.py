#!/usr/bin/env python3
"""Download CC/PD aircraft and vessel photos from Wikimedia Commons into public/craft/."""

from __future__ import annotations

import json
import urllib.parse
import urllib.request
from io import BytesIO
from pathlib import Path

from PIL import Image

UA = "WLT/1.1 (https://github.com/renehasp/WLT; craft-images@commons)"
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "craft"
MAX_W = 1400

# id -> Commons File: title (without File: prefix)
SOURCES: list[tuple[str, str]] = [
    ("vc25-9000", "92-9000 Boeing VC-25A (B747-200) United States Of America ( Air Force One ) (8414490252).jpg"),
    ("vc25-8000", "Boeing VC-25A 82-8000 USAF.jpg"),
    ("voyager", "Airbus Voyager KC.3 ‘ZZ336’ with the Red Arrows at RIAT 2022 (53489614383).jpg"),
    ("cotam", "F-RARF - A330-200 - French Airforce - EVX - Training BA105 CTM1275 - 04365.jpg"),
    ("gaf01", "Airbus A350-941ACJ (c-n 468, 10+01) 2025-03-12 Andre Gerwing Collection ID 022951.jpg"),
    ("jaf001", "JASDF B777-300ER 80-1111 (1) (cropped).jpg"),
    ("canforce", "RCAF - Airbus CC-330 330003 - Sofia.jpg"),
    ("iam9001", "Italian Air Force, MM62209, Airbus A319-115(CJ) (37176087630).jpg"),
    ("iaf01", "Air india one 34.jpg"),
    ("fab2101", "Airbus A319 VC-1 FAB 2101 (6809343052) (2).jpg"),
    ("tp01", "Fuerza Aérea Mexicana, Boeing 787-8 Dreamliner, XC-MEX (cropped).jpg"),
    ("hzhm1", "HZ-HM1 B744 Saudi Arabian Royal Flight VKO UUWW 1 (34284734933).jpg"),
    ("tur001", "TC-TUR@PEK (20190702140358).jpg"),
    ("rokaf", "10001 South Korea - Air Force (44553340355).jpg"),
    ("bbj-au", "A62-002 at Canberra Airport April 2026.jpg"),
    ("tni01", "Boeing 737-800 BBJ2 A-001 Indonesia 040226.jpg"),
    ("saf01", 'South Africa - Air Force Boeing 737-7ED BBJ ZS-RSA "Inkwazi" (22819632744).jpg'),
    ("tango01", "ARG-01@PEK (20230601132606).jpg"),
    ("t21", "Spanish Air Force, T.22-1, Airbus A310-304 (35225030493).jpg"),
    ("phgov", "PH-GOV@PEK (20230523141129).jpg"),
    ("baf01", "Dassault Falcon 7X OO-LUM Belgian Air Force.jpg"),
    ("isr01", "4X-ISR Rami Mizrahi.jpg"),
    ("rp01", "Philippine Airlines Airbus A330-300 RP-C8786 taking off from Taoyuan May 2026 1.jpg"),
    ("rsaf", "(SGP-Singapore) Singapore Airlines Airbus A350-941 9V-SMA @ WSSS 2025-10-04.jpg"),
    ("naf01", "5N-FGA Presidential Jet of Nigerian President.jpg"),
    ("fach01", "Boeing 767-3Y0ER (cn 26205, 985) 2024-06-10 Andre Gerwing Collection ID 019630.jpg"),
    ("uae01", "A6-PFE B787 PRESIDENTIAL FLIGHT (53895990023).jpg"),
    ("egypt01", "SU-GGG@PEK (20240528112703).jpg"),
    ("plf01", "Guflstream G550 0002 Polish Air Force.jpg"),
    ("azzam", "Azzam bei Lürssen.JPG"),
    ("kapitan", "Indonesian Navy ship KRI Pattimura entering Port Blair in 2014.jpg"),
]


def strip_html(s: str) -> str:
    out = []
    skip = False
    for ch in s:
        if ch == "<":
            skip = True
        elif ch == ">":
            skip = False
        elif not skip:
            out.append(ch)
    return " ".join("".join(out).split())


def api(titles: list[str]) -> dict:
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(
        {
            "action": "query",
            "titles": "|".join(f"File:{t}" for t in titles),
            "prop": "imageinfo",
            "iiprop": "url|extmetadata|mime|size",
            "iiurlwidth": str(MAX_W),
            "format": "json",
        }
    )
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=45) as resp:
        return json.load(resp)


def download(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read()


def to_webp(raw: bytes, dest: Path) -> None:
    img = Image.open(BytesIO(raw))
    img = img.convert("RGB")
    w, h = img.size
    if w > MAX_W:
        img = img.resize((MAX_W, int(h * MAX_W / w)), Image.Resampling.LANCZOS)
    dest.parent.mkdir(parents=True, exist_ok=True)
    img.save(dest, "WEBP", quality=82, method=6)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    rows = []
    # API allows ~50 titles; we have 31
    titles = [f for _, f in SOURCES]
    pages = api(titles).get("query", {}).get("pages", {})
    by_title = {p.get("title", "").replace("File:", ""): p for p in pages.values()}

    for cid, filename in SOURCES:
        page = by_title.get(filename)
        if not page or page.get("missing") is not None:
            print("MISSING", cid, filename)
            continue
        info = (page.get("imageinfo") or [None])[0]
        if not info:
            print("NOINFO", cid)
            continue
        meta = info.get("extmetadata") or {}
        artist = strip_html((meta.get("Artist") or {}).get("value", "Unknown"))
        license_name = (meta.get("LicenseShortName") or {}).get("value", "")
        license_url = (meta.get("LicenseUrl") or {}).get("value", "")
        commons = f"https://commons.wikimedia.org/wiki/File:{urllib.parse.quote(filename)}"
        src = info.get("thumburl") or info.get("url")
        dest = OUT / f"{cid}.webp"
        print("GET", cid, "←", filename[:70])
        raw = download(src)
        to_webp(raw, dest)
        print("  ", dest.stat().st_size, "bytes", license_name)
        rows.append(
            {
                "id": cid,
                "file": f"public/craft/{cid}.webp",
                "commons": commons,
                "author": artist,
                "license": license_name,
                "licenseUrl": license_url,
                "retrieved": "2026-09-20",
            }
        )

    md = ROOT / "docs" / "craft-attribution.md"
    md.parent.mkdir(parents=True, exist_ok=True)
    lines = [
        "# Craft photo attribution",
        "",
        "Photographs of the actual VIP airframes and vessels, downloaded from",
        "[Wikimedia Commons](https://commons.wikimedia.org/) on 20 Sep 2026.",
        "JetPhotos and Planespotters catalogues are not reused — their photographers",
        "retain copyright. Commons is the open-licence equivalent.",
        "",
        "| id | file | source | author | license |",
        "| --- | --- | --- | --- | --- |",
    ]
    for r in rows:
        lines.append(
            f"| `{r['id']}` | `{r['file']}` | [Commons]({r['commons']}) | {r['author']} | {r['license']} |"
        )
    lines.append("")
    md.write_text("\n".join(lines), encoding="utf-8")
    print("wrote", md, "count", len(rows))


if __name__ == "__main__":
    main()
