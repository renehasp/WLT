#!/usr/bin/env node
import { readFileSync, mkdirSync, existsSync, readdirSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dest = join(root, "public/craft");
const sentinel = join(dest, "voyager.svg");
const single = join(dest, "pack.b64");

if (existsSync(sentinel) && !process.env.CRAFT_FORCE_UNPACK) {
  console.log("craft images present; skip unpack");
  process.exit(0);
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
    process.exit(0);
  }
  b64 = parts.map((n) => readFileSync(join(dest, n), "utf8").trim()).join("");
}

const tarPath = "/tmp/wlt-craft.tar.gz";
writeFileSync(tarPath, Buffer.from(b64, "base64"));
execSync(`tar -xzf "${tarPath}" -C "${dest}"`, { stdio: "inherit" });
console.log("unpacked craft images into public/craft/");
