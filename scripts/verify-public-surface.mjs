import fs from "node:fs";

const failures = [];
const read = (file) => fs.readFileSync(file, "utf8");
const requireText = (file, pattern, label) => {
  if (!pattern.test(read(file))) failures.push(`${file}: ${label}`);
};
const forbidText = (file, pattern, label) => {
  if (pattern.test(read(file))) failures.push(`${file}: ${label}`);
};

const config = JSON.parse(read("vercel.json"));
const routes = config.routes || [];
const root = routes.find((route) => route.src === "^/$");
if (root?.dest !== "/public-home.html") failures.push("vercel.json: root is not the approved public homepage");
const legacy = routes.find((route) => route.src === "^/(.+\\.html)$");
if (legacy?.dest !== "/planned.html") failures.push("vercel.json: legacy HTML prototypes are not quarantined");

const publicFiles = ["public-home.html", "privacy-policy.html", "terms-of-service.html", "planned.html"];
for (const file of publicFiles) {
  forbidText(file, /Sighn-dex|24 January 2027|24 Jan 2027|\$2\.50|22\.4% APY|spots remaining/i, "retired or unsupported public claim remains");
}

requireText("public-home.html", /24 February 2027/, "controlled public-pilot date is missing");
requireText("public-home.html", /1\.3B/, "current Global Findex figure is missing");
requireText("public-home.html", /No face scan at Tier 0/i, "Tier 0 face-scan prohibition is missing");
requireText("public-home.html", /50 INDX recognition – pending review\. Not yet spendable\./, "approved recognition wording is missing");
requireText("public-home.html", /founder-selected launch and genesis reference/, "founder-selected USD $0.24 launch reference is missing");
forbidText("public-home.html", /\$0\.36\b/, "retired USD $0.36 launch figure remains");
requireText("public-home.html", /registration has not yet been filed/i, "approved legal-status wording is missing");
requireText("public-home.html", /SIINDEX Visitor Mode/, "SIINDEX authority boundary is missing");
requireText("public-home.html", /videos\/siindex-public-intro\.mp4/, "remastered SIINDEX introduction video is missing");
requireText("public-home.html", /Read the introduction transcript/, "accessible introduction transcript is missing");
requireText("public-home.html", /images\/siindex-public-portrait\.webp/, "optimized public portrait is missing");
requireText("vercel.json", /jpeg\|webp\|gif/, "WebP assets are not publicly routed");
for (const file of ["images/siindex-public-portrait.webp", "images/siindex-public-video-poster.webp"]) {
  if (!fs.existsSync(file)) failures.push(`${file}: optimized public asset is missing`);
  else if (fs.statSync(file).size > 300_000) failures.push(`${file}: optimized public asset exceeds 300 KB`);
}

forbidText("supabase/functions/siindex-website-runtime/index.ts", /Sighn-dex|24 January 2027|focused public pilot/i, "runtime Canon is stale");
requireText("supabase/functions/siindex-website-runtime/index.ts", /24 February 2027/, "runtime public-pilot date is missing");
requireText("supabase/functions/siindex-website-runtime/index.ts", /No face scan is required at Tier 0/, "runtime Tier 0 rule is missing");
requireText("supabase/functions/siindex-website-runtime/index.ts", /Website Visitor Mode has no phone-call channel/, "runtime phone-call prohibition is missing");

forbidText("sw.js", /home-v2\.html|receive\.html|send\.html|withdraw-fiat\.html/, "service worker still publishes transactional prototypes");
requireText("sw.js", /indx-v4/, "public cache version was not advanced");
requireText("robots.txt", /Disallow: \/\*\.html\$/, "legacy prototype crawler rule is missing");
requireText("sitemap.xml", /https:\/\/imagenationdex\.com\/status/, "status URL is missing from sitemap");

if (failures.length) {
  console.error("IN$DEX public-surface verification failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("IN$DEX public-surface verification passed (approved routes, verified-status copy, voice boundaries, crawler controls, and cache surface).");
