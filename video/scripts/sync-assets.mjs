/**
 * Copies the product screenshots and logos the compositions reference out of
 * the app's `public/` folder. They are the same files the app ships, so they
 * are not tracked twice: this runs before studio and before a render.
 */
import { cp, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const appPublic = join(here, "..", "..", "public");
const videoPublic = join(here, "..", "public");

await mkdir(join(videoPublic, "help"), { recursive: true });
await cp(join(appPublic, "help"), join(videoPublic, "help"), { recursive: true });

for (const file of ["logo.svg", "logo.png", "logo_name.svg", "logo_name.png"]) {
  await cp(join(appPublic, file), join(videoPublic, file));
}

console.log("Synced screenshots and logos from ../public");
