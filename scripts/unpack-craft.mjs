#!/usr/bin/env node
import { readFileSync, mkdirSync, existsSync, readdirSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dest = join(root, "public/craft");
const sentinel = join(dest, "voyager.svg");
const single = join(dest, "pack.b64");

function unpackImages() {
  if (existsSync(sentinel) && !process.env.CRAFT_FORCE_UNPACK) {
    console.log("craft images present; skip unpack");
    return;
  }

  mkdirSync(dest, { recursive: true });

  let b64 = "";
  if (existsSync(single)) {
    b64 = readFileSync(single, "utf8").trim();
  } else {
    const parts = readdirSync(dest)
      .filter((n) => /^pack\.b64\.\d+$/.test(n))
      .sort();
    if (!parts.length) {
      console.warn("no public/craft/pack.b64(.NN); skip unpack");
      return;
    }
    b64 = parts.map((n) => readFileSync(join(dest, n), "utf8").trim()).join("");
  }

  const tarPath = "/tmp/wlt-craft.tar.gz";
  writeFileSync(tarPath, Buffer.from(b64, "base64"));
  execSync(`tar -xzf "${tarPath}" -C "${dest}"`, { stdio: "inherit" });
  console.log("unpacked craft images into public/craft/");
}

const CRAFT_URLS = {
  "vc25-9000": "/craft/vc25-9000.svg",
  "vc25-8000": "/craft/vc25-8000.svg",
  voyager: "/craft/voyager.svg",
  cotam: "/craft/cotam.svg",
  gaf01: "/craft/gaf01.svg",
  jaf001: "/craft/jaf001.svg",
  canforce: "/craft/canforce.svg",
  iam9001: "/craft/iam9001.svg",
  iaf01: "/craft/iaf01.svg",
  fab2101: "/craft/fab2101.svg",
  tp01: "/craft/tp01.svg",
  hzhm1: "/craft/hzhm1.svg",
  tur001: "/craft/tur001.svg",
  rokaf: "/craft/rokaf.svg",
  "bbj-au": "/craft/bbj-au.svg",
  tni01: "/craft/tni01.svg",
  saf01: "/craft/saf01.svg",
  tango01: "/craft/tango01.svg",
  t21: "/craft/t21.svg",
  phgov: "/craft/phgov.svg",
  baf01: "/craft/baf01.svg",
  isr01: "/craft/isr01.svg",
  naf01: "/craft/naf01.svg",
  fach01: "/craft/fach01.svg",
  uae01: "/craft/uae01.svg",
  egypt01: "/craft/egypt01.svg",
  plf01: "/craft/plf01.svg",
  azzam: "/craft/azzam.svg",
  kapitan: "/craft/kapitan.svg",
};

function wireImageUrls() {
  const dataPath = join(root, "src/lib/meridian/data.ts");
  if (!existsSync(dataPath)) return;
  let text = readFileSync(dataPath, "utf8");
  let changed = false;
  for (const [cid, url] of Object.entries(CRAFT_URLS)) {
    if (text.includes(`imageUrl: "${url}"`)) continue;
    const needle = `id: "${cid}",`;
    const idx = text.indexOf(needle);
    if (idx < 0) continue;
    const brace = text.lastIndexOf("{", idx);
    let depth = 0;
    let end = -1;
    for (let i = brace; i < text.length; i++) {
      if (text[i] === "{") depth++;
      else if (text[i] === "}") {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end < 0) continue;
    let inner = text.slice(brace, end).replace(/\s+$/, "");
    if (!inner.endsWith(",")) inner += ",";
    text = `${text.slice(0, brace)}${inner}\n    imageUrl: "${url}",\n  ${text.slice(end)}`;
    changed = true;
  }
  if (changed) {
    writeFileSync(dataPath, text);
    console.log("wired craft imageUrl fields in data.ts");
  }
}

unpackImages();
wireImageUrls();
