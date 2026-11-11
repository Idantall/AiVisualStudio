// Renders index.html to an MP4 (1920x1080, 60fps, 5s) with the synthesized audio sting.
// Requires: playwright (chromium), ffmpeg, python3 + numpy.
// Usage: node render.cjs [outDir]
const { chromium } = require("playwright");
const { execFileSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const FPS = 60;
const outDir = path.resolve(process.argv[2] || path.join(__dirname, "out"));

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "podcast-intro-"));
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  await page.goto("file://" + path.join(__dirname, "index.html") + "?render=1");
  await page.evaluate(() => document.fonts.ready);

  const duration = await page.evaluate(() => window.INTRO_DURATION);
  const frames = Math.round(duration * FPS);
  for (let i = 0; i < frames; i++) {
    await page.evaluate((t) => window.renderAt(t), i / FPS);
    await page.screenshot({ path: path.join(tmp, `f${String(i).padStart(4, "0")}.png`) });
  }
  // Poster frame = final hold.
  await page.screenshot({ path: path.join(outDir, "poster.png") });
  await browser.close();

  const wav = path.join(tmp, "audio.wav");
  execFileSync("python3", [path.join(__dirname, "make-audio.py"), wav], { stdio: "inherit" });

  const video = ["-framerate", String(FPS), "-i", path.join(tmp, "f%04d.png")];
  const enc = ["-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p", "-movflags", "+faststart"];
  const quiet = ["-y", "-loglevel", "error"];
  execFileSync("ffmpeg", [...quiet, ...video, "-i", wav, ...enc, "-c:a", "aac", "-b:a", "256k", "-shortest",
    path.join(outDir, "podcast-intro.mp4")], { stdio: "inherit" });
  execFileSync("ffmpeg", [...quiet, ...video, ...enc, "-an",
    path.join(outDir, "podcast-intro-silent.mp4")], { stdio: "inherit" });

  fs.rmSync(tmp, { recursive: true, force: true });
  console.log("Wrote", outDir);
})();
