import fs from "node:fs";
import { spawnSync } from "node:child_process";

const failures = [];

function run(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.status !== 0) {
    failures.push(`${command} failed: ${String(result.error?.message || result.stderr || result.stdout || "unknown error").trim()}`);
    return "";
  }
  return result.stdout;
}

const videoPath = "videos/siindex-public-intro.mp4";
const portraitPath = "images/siindex-public-portrait-v2.webp";
const captionsPath = "videos/siindex-public-intro.en.vtt";

for (const file of [videoPath, portraitPath, captionsPath]) {
  if (!fs.existsSync(file)) failures.push(`${file}: missing`);
}

if (fs.existsSync(videoPath)) {
  const probeText = run("ffprobe", [
    "-v", "error",
    "-show_entries", "stream=codec_name,codec_type,width,height,sample_rate,pix_fmt:format=duration,size",
    "-of", "json",
    videoPath,
  ]);
  if (probeText) {
    const probe = JSON.parse(probeText);
    const video = probe.streams.find((stream) => stream.codec_type === "video");
    const audio = probe.streams.find((stream) => stream.codec_type === "audio");
    if (video?.codec_name !== "h264") failures.push("introduction video must use H.264");
    if (video?.pix_fmt !== "yuv420p") failures.push("introduction video must use web-compatible yuv420p");
    if (video?.width !== 1280 || video?.height !== 720) failures.push("introduction master must remain uncropped 1280x720");
    if (audio?.codec_name !== "aac") failures.push("introduction audio must use AAC");
    if (Number(audio?.sample_rate) < 44100) failures.push("introduction audio sample rate must be at least 44.1kHz");
    if (Number(probe.format?.duration) < 37 || Number(probe.format?.duration) > 40) failures.push("introduction duration is outside the approved transcript window");
    if (Number(probe.format?.size) > 15_000_000) failures.push("introduction exceeds the 15MB delivery ceiling");
  }

  const loudness = spawnSync("ffmpeg", ["-hide_banner", "-i", videoPath, "-af", "ebur128=peak=true", "-f", "null", "-"], { encoding: "utf8" });
  const combined = `${loudness.stdout || ""}\n${loudness.stderr || ""}`;
  const integrated = [...combined.matchAll(/I:\s*(-?\d+(?:\.\d+)?) LUFS/g)].at(-1);
  if (!integrated) failures.push("introduction loudness could not be measured");
  else {
    const value = Number(integrated[1]);
    if (value < -18 || value > -14) failures.push(`introduction loudness ${value} LUFS is outside -18 to -14 LUFS`);
  }
}

if (fs.existsSync(portraitPath)) {
  const dimensions = run("identify", ["-format", "%w %h", portraitPath]).trim();
  if (dimensions !== "1024 1536") failures.push(`portrait dimensions are ${dimensions || "unknown"}, expected 1024 1536`);
  if (fs.statSync(portraitPath).size > 300_000) failures.push("portrait exceeds 300KB");
}

if (fs.existsSync(captionsPath)) {
  const captions = fs.readFileSync(captionsPath, "utf8");
  if (!captions.startsWith("WEBVTT")) failures.push("captions are not valid WebVTT");
  if (!/00:00:31\.000 --> 00:00:38\.200/.test(captions)) failures.push("captions do not cover the full introduction");
}

if (failures.length) {
  console.error("SIINDEX media verification failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("SIINDEX media verification passed (uncropped frame, web codecs, normalized speech, captions, and portrait quality).\n");
