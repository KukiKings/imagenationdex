import fs from "node:fs";

const failures = [];
const read = (file) => fs.readFileSync(file, "utf8");
const requireText = (file, pattern, label) => {
  if (!pattern.test(read(file))) failures.push(`${file}: ${label}`);
};
const forbidText = (file, pattern, label) => {
  if (pattern.test(read(file))) failures.push(`${file}: ${label}`);
};

// NOTE (2026-09-05, god mode Item 7): this script existed but was never wired
// into CI and had drifted badly from reality — running it cold surfaced 10
// failures, all but one of which were the script itself checking for an
// older, superseded homepage/routing architecture (a blanket "quarantine
// every .html behind /planned.html" routing strategy, an older intro video
// filename, a literal "50 INDX recognition" string that belongs on an
// onboarding screen rather than the marketing homepage, etc.) rather than
// real bugs in the live site. Rewritten below to check the CURRENT
// architecture instead of a frozen snapshot of an earlier one. See
// memory.md Session 104/105 for the full investigation.

const config = JSON.parse(read("vercel.json"));
const routes = config.routes || [];
const root = routes.find((route) => route.src === "^/$");
if (root?.dest !== "/public-home.html") failures.push("vercel.json: root is not the approved public homepage");

// Current routing strategy (since the old blanket /planned.html quarantine
// was replaced) is an explicit denylist of internal/founder-only screens
// that must 404 before the generic "serve any .html" catch-all below it.
// This list must stay in sync with robots.txt's own Disallow intent — a
// page robots.txt says should not be crawled but vercel.json does not
// actually block is reachable by anyone with the URL regardless of crawler
// behavior. siindex-command-center.html is deliberately NOT in this list:
// unlike these, it has a real, live founder sign-in flow (Supabase Auth +
// AAL2) and degrades safely to a harmless unauthenticated preview when not
// signed in, so blocking it at the routing layer would lock AJ out of his
// own working access path rather than close a real gap.
const mustBlock = [
  "index", "founder-command-center", "founder-pipeline", "founder-voice",
  "siindex-civilization-admin-console", "siindex-os", "founders-pool",
  "siindex-agent-skills", "siindex-dev-portal", "siindex-dev",
  "siindex-sovereign-developer", "siindex-team-portal",
];
// A route "blocks" a name if it 404s that exact path AND appears before the
// generic ".html catch-all" that would otherwise serve it directly (route
// order matters — first match wins).
const catchAllIdx = routes.findIndex((route) => route.src === "^/(.+[.]html)$");
if (catchAllIdx === -1) failures.push("vercel.json: generic .html catch-all route is missing");
for (const name of mustBlock) {
  const path = `/${name}.html`;
  const blockingIdx = routes.findIndex((route) =>
    route.status === 404 && new RegExp(route.src).test(path)
  );
  if (blockingIdx === -1 || (catchAllIdx !== -1 && blockingIdx > catchAllIdx)) {
    failures.push(`vercel.json: internal/founder-only screen "${name}.html" is not blocked at the routing layer`);
  }
}

const publicFiles = ["public-home.html", "privacy-policy.html", "terms-of-service.html", "planned.html"];
for (const file of publicFiles) {
  forbidText(file, /Sighn-dex|24 January 2027|24 Jan 2027|\$2\.50|22\.4% APY|spots remaining|registration has not yet been filed/i, "retired or unsupported public claim remains");
}

requireText("public-home.html", /24 February 2027/, "controlled public-pilot date is missing");
requireText("public-home.html", /founder-selected launch and genesis reference|genesis reference only/, "genesis-reference-only USD $0.24 framing is missing");
forbidText("public-home.html", /\$0\.36\b/, "retired USD $0.36 launch figure remains");
requireText("public-home.html", /registration is in progress/i, "founder-locked registration wording (in progress, per 9 Aug 2026 jurisdiction lock) is missing");
requireText("public-home.html", /SIINDEX Visitor Mode|Visitor Mode/, "SIINDEX authority boundary is missing");
requireText("public-home.html", /videos\/siindex-01-name-intro\.mp4/, "the live SIINDEX introduction video is missing");
requireText("public-home.html", /<details class="transcript"[^>]*>\s*<summary>Introduction transcript<\/summary>/, "accessible introduction transcript disclosure is missing");
requireText("public-home.html", /images\/siindex-public-portrait\.webp/, "optimized public portrait is missing");
requireText("vercel.json", /jpeg\|webp\|gif/, "WebP assets are not publicly routed");
for (const file of ["images/siindex-public-portrait.webp", "images/siindex-public-video-poster.webp"]) {
  if (!fs.existsSync(file)) failures.push(`${file}: optimized public asset is missing`);
  else if (fs.statSync(file).size > 300_000) failures.push(`${file}: optimized public asset exceeds 300 KB`);
}

forbidText("supabase/functions/siindex-website-runtime/index.ts", /Sighn-dex|24 January 2027|focused public pilot|registration has not yet been filed/i, "runtime Canon is stale");
requireText("supabase/functions/siindex-website-runtime/index.ts", /24 February 2027/, "runtime public-pilot date is missing");
requireText("supabase/functions/siindex-website-runtime/index.ts", /No face scan is required at Tier 0/, "runtime Tier 0 rule is missing");
requireText("supabase/functions/siindex-website-runtime/index.ts", /Website Visitor Mode has no phone-call channel/, "runtime phone-call prohibition is missing");
requireText("supabase/functions/siindex-website-runtime/index.ts", /registration is in progress/i, "runtime founder-locked registration wording is missing");

forbidText("sw.js", /home-v2\.html|receive\.html|send\.html|withdraw-fiat\.html/, "service worker still publishes transactional prototypes");
requireText("sw.js", /const VERSION = 'indx-v\d+/, "service worker cache version constant is missing or malformed");
requireText("robots.txt", /Disallow: \/siindex-command-center\.html/, "internal command-center crawler rule is missing");
requireText("robots.txt", /Sitemap: https:\/\/imagenationdex\.com\/sitemap\.xml/, "sitemap reference is missing from robots.txt");
requireText("sitemap.xml", /https:\/\/imagenationdex\.com\/status/, "status URL is missing from sitemap");

if (failures.length) {
  console.error("IN$DEX public-surface verification failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("IN$DEX public-surface verification passed (approved routes, Canon copy, voice boundaries, crawler controls, and cache surface).");
