import fs from "node:fs";

const failures = [];
const read = (file) => fs.readFileSync(file, "utf8");
const requireText = (file, pattern, label) => {
  if (!pattern.test(read(file))) failures.push(`${file}: ${label}`);
};
const forbidText = (file, pattern, label) => {
  if (pattern.test(read(file))) failures.push(`${file}: ${label}`);
};

requireText("public-home.html", /data-si-presence-card/, "presence card is missing");
requireText("public-home.html", /data-si-presence-label/, "visible presence label is missing");
requireText("public-home.html", /Live lip-sync is still in private development/, "lip-sync boundary is missing");
requireText("public-home.html", /siindex-public-portrait-v2\.webp/, "identity portrait is missing");
requireText("public-home.html", /siindex-public-intro\.en\.vtt/, "caption track is missing");
requireText("siindex-presence-core.js", /listening: "Listening to you"/, "listening presence state is missing");
requireText("siindex-presence-core.js", /thinking: "Thinking with you"/, "thinking presence state is missing");
requireText("siindex-presence-core.js", /speaking: "Speaking with you"/, "speaking presence state is missing");
requireText("siindex-presence-core.js", /history\.slice\(-8\)/, "bounded continuity restore is missing");
requireText("siindex-presence-core.js", /remembered only on this device/, "local-only continuity disclosure is missing");
requireText("supabase/functions/siindex-website-runtime/index.ts", /NATURAL CONVERSATION:/, "natural-dialogue contract is missing");
requireText("supabase/functions/siindex-website-runtime/index.ts", /quote-ready answer/, "interview response contract is missing");
requireText("supabase/functions/siindex-website-runtime/index.ts", /Never pretend to be human/, "human-identity boundary is missing");
forbidText("public-home.html", /object-fit:cover[^}]*\.video-card video/, "video crop rule remains");

for (const file of [
  "images/siindex-public-portrait-v2.webp",
  "images/siindex-public-video-poster.webp",
  "videos/siindex-public-intro.mp4",
  "videos/siindex-public-intro.en.vtt",
]) {
  if (!fs.existsSync(file)) failures.push(`${file}: required presence asset is missing`);
}

if (failures.length) {
  console.error("SIINDEX presence verification failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("SIINDEX presence verification passed (framing, captions, visible states, bounded continuity, and dialogue contract).\n");
