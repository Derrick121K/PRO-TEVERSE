/**
 * Optional postinstall: build nkosi kit when zip exists and kit is missing.
 */
const fs = require("fs")
const path = require("path")
const { spawnSync } = require("child_process")

const root = path.resolve(__dirname, "..")
const zipPath = path.join(root, "nkosi.zip")
const kickPath = path.join(root, "public", "sounds", "nkosi", "kick.wav")
const py = process.platform === "win32" ? "python" : "python3"

if (!fs.existsSync(zipPath)) {
  if (!fs.existsSync(kickPath)) {
    spawnSync(py, ["scripts/generate-fallback-drums.py"], { cwd: root, stdio: "inherit" })
  }
  process.exit(0)
}
if (fs.existsSync(kickPath)) {
  process.exit(0)
}

console.log("[postinstall] Building system drum kit from nkosi.zip…")
const result = spawnSync(py, ["engine/system_engine.py", "--zip", "nkosi.zip", "--out", "public/sounds/nkosi", "--manifest", "lib/system-engine-manifest.json", "--project-manifest", "lib/system-engine-project.json"], {
  cwd: root,
  stdio: "inherit",
})
if (result.status !== 0) {
  console.warn("[postinstall] engine:build-kit failed — running sounds:generate fallback.")
  const gen = spawnSync(py, ["scripts/generate-fallback-drums.py"], { cwd: root, stdio: "inherit" })
  if (gen.status !== 0) {
    console.warn("[postinstall] Run `npm run sounds:generate` or `npm run engine:build-kit` manually.")
  }
}
// Copy fallbacks for /sounds/*.wav
const fallbackDir = path.join(root, "public", "sounds")
fs.mkdirSync(fallbackDir, { recursive: true })
for (const role of ["kick", "snare", "hihat", "clap"]) {
  const src = path.join(root, "public", "sounds", "nkosi", `${role}.wav`)
  const dst = path.join(fallbackDir, `${role}.wav`)
  if (fs.existsSync(src) && !fs.existsSync(dst)) {
    fs.copyFileSync(src, dst)
  }
}
