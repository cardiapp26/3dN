#!/usr/bin/env node
/**
 * Decode ASCII base64 atlas plates into JPEG files for Vite/public.
 * Source of truth in git is `public/atlas/*.jpg.b64` (+ `public/og.jpg.b64`).
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const atlasDir = join(root, "public", "atlas");
const ogB64 = join(root, "public", "og.jpg.b64");
const ogJpg = join(root, "public", "og.jpg");

mkdirSync(atlasDir, { recursive: true });

let count = 0;
for (const name of readdirSync(atlasDir)) {
  if (!name.endsWith(".jpg.b64")) continue;
  const dest = join(atlasDir, name.slice(0, -4));
  writeFileSync(dest, Buffer.from(readFileSync(join(atlasDir, name), "utf8"), "base64"));
  count += 1;
}

if (readdirSync(atlasDir).some((n) => n.endsWith(".jpg.b64") === false && n.endsWith(".b64"))) {
  // ignore other encodings
}

try {
  writeFileSync(ogJpg, Buffer.from(readFileSync(ogB64, "utf8"), "base64"));
  count += 1;
} catch {
  // og plate optional
}

console.log(`[atlas] materialized ${count} image(s)`);
