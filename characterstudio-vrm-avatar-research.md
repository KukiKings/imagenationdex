# CharacterStudio / VRM Avatar Layer — Research & Fact-Check
> Written 2026-07-24. AJ pasted an AI-generated proposal recommending CharacterStudio (an open-source VRM avatar tool) as a visual embodiment layer for SIINDEX and citizens. This doc verifies the technical claims against the real repo/docs, then separates what's solid from what's speculative before any of this becomes a roadmap commitment.

---

## Part 1 — Fact-Checking the Technical Claims

Checked directly against the live GitHub repo (github.com/M3-org/CharacterStudio), its README, and its documentation site (m3-org.github.io/characterstudio-docs).

### 1.1 What checked out — nearly everything

| Claim in the pasted doc | Verified |
|---|---|
| Open-source, web-based 3D avatar platform for VRM/glTF | **True** — repo description matches exactly |
| Maintained by M3-org ("Metaverse Makers") | **True** |
| Roots in earlier Webaverse CharacterStudio | **True** — the README itself credits "original repo by Webaverse" (github.com/webaverse/characterstudio) |
| Live demo at studio.m3org.com | **True** — fetched directly, live and responding |
| Docs at m3-org.github.io/characterstudio-docs | **True** — fetched directly, real Docusaurus site |
| MIT licensed | **True** — LICENSE file confirms MIT |
| ~300 stars | **Close** — 281 stars, 79 forks, 4 watchers, 2,662 commits as of today. Actively developed, not abandoned. |
| `CharacterManager` class, core logic refactored to not require React | **True** — stated directly in both the README and docs: "Recently refactored to NOT need React as a dependency... Logic is now all inside `CharacterManager` class" |
| Three.js + WebGL stack | **True** |
| One-click VRM optimizer (mesh merge, texture atlas, single draw call) | **True** — listed as a named feature in both README and docs |
| Batch export with randomization / metadata schemas | **True** — listed feature |
| Asset packs separated from core engine (loot-assets, community packs) | **True** — `github.com/m3-org/loot-assets` (the project's own default pack) and `github.com/memelotsqui/character-assets` (a community sample pack) are both real, linked directly from the README |
| Involvement with M3, Metaverse Standards Forum, OMI group | **True** — stated directly on the docs "About" page |
| Face auto-culling | **True** — listed feature |

### 1.2 What didn't check out

**"VRM → spritesheet generation (already researched in the project)"** — this is the one claim in the doc I could not verify, and it appears to be false. I grepped every `.md` file in this project for "VRM," "CharacterStudio," and "spritesheet" — zero matches anywhere except this new document and an unrelated file (`icp-avatar.md`, which is about Mama Noe, the customer persona — "avatar" there means something completely different, not a 3D model). CharacterStudio's docs do have a real "VRM to Spritesheet" page (confirmed it exists), so the *feature* is real — but the claim that IN\$DEX has *already researched* this is not supported by anything in the actual project files. Treat this as new territory, not a resumed thread.

**One minor imprecision, not worth flagging as wrong:** the doc says "@pixiv/three-vrm" specifically as the VRM-loading library. I couldn't independently confirm that exact package name is what CharacterStudio uses internally (didn't dig into `package.json`), but `@pixiv/three-vrm` is the de facto standard library for VRM support in Three.js projects, so this is a reasonable, low-risk assumption rather than a fabrication.

**Bottom line: this is one of the more accurate AI-generated pitches AJ has brought to a session this week.** Almost everything checks out against primary sources. The tool is real, active, and does what's claimed.

---

## Part 2 — What This Actually Is, In Plain Terms

CharacterStudio is a real, working, open-source web app where someone assembles a VRM (3D avatar) character by clicking together modular parts — body, clothes, accessories — then exports it as an optimized file that loads fast even on modest hardware. It's not a full animation studio or a voice engine; it's specifically the "build and export a lightweight 3D avatar" piece. It's designed to be forked and white-labeled (MIT license, no restrictions), and its own stated mission — open standards, interoperability, no closed-source lock-in — happens to line up well with IN$DEX's general posture on citizen-owned/self-hosted infrastructure.

---

## Part 3 — Strategic Fit, With the Speculative Parts Marked as Speculative

The pasted doc's use-case list is well-reasoned and worth keeping largely as-is, but it's important to be clear about what's a verified technical fact (Part 1 above) versus what's a product idea that hasn't been validated yet. None of the following has been prototyped, tested on real devices, or costed — these are proposals, not commitments.

**Most concrete, lowest-risk idea:** a single canonical SIINDEX VRM avatar — one asset, designed once, optimized once, reused everywhere (voice terminal, chat, live-stream pages). This is a bounded, one-time asset-creation task, not an ongoing system. Low technical risk since it's just static VRM files being loaded via a standard viewer library.

**Higher-effort, higher-risk idea:** a citizen-facing "create your own avatar" flow built on CharacterStudio's UI. This is a real feature build — a new interaction, new asset-storage decisions (IPFS vs. CDN vs. on-chain reference), and new UX to design and test on the low-end Android devices the Mama Noe test is built around. This is not a quick add-on; it's roadmap-scale work if pursued.

**Speculative / needs its own decision:** using avatars as a "sovereign identity layer" tied to the Grid Account or Wisdom Score. This touches identity architecture directly — worth a deliberate design pass, not something to bolt on.

---

## Part 4 — Practical Risks and Open Questions Before Any of This Gets Built

1. **Cultural asset sourcing is the real constraint, not the technology.** The default `loot-assets` pack is generic — using it as-is for a "Pacific/Mana" themed avatar would be the same kind of shallow, ungrounded aesthetic choice this project has been actively correcting elsewhere this session (see the fabrication-sweep work on corridor pages, liquidity screens, etc.). A real Pacific-authored trait pack would need actual cultural consultation and artist commissioning — a real cost and timeline, not a checkbox. The pasted doc's own risk note on this is correct and should be taken seriously, not treated as boilerplate.
2. **Performance validation is unverified, not just unproven.** The "single draw call" optimizer claim is real (confirmed in Part 1), but "runs smoothly on low-bandwidth Pacific mobile connections" is an assumption, not a tested result. Before this goes anywhere near a citizen-facing screen, it needs an actual load-time test on a representative low/mid-end Android device — the same bar CLAUDE.md already holds every screen to.
3. **Hosting/ownership model is an open decision**, not a detail: IPFS with content-addressed hashes (as suggested) is one real option; a project-controlled CDN is another, simpler one. This should be decided deliberately, not defaulted into.
4. **License chain:** CharacterStudio itself is MIT (permissive, no issue). If any Webaverse-derived code or third-party asset packs carry different terms, that's worth a quick check before shipping anything derived from them — not urgent, but a five-minute diligence step before launch, not after.
5. **This is new scope, not a resumed project thread** — per Part 1.2, don't treat this as picking up prior VRM work. It would be starting fresh.

---

## Part 5 — Recommended Next Steps (Proposal Only — Nothing Here Has Been Started)

If AJ wants to pursue this, the lowest-risk entry point is a small, contained prototype — not a full citizen-facing feature:

1. Fork the repo, run it locally with the default `loot-assets` pack, confirm it actually runs and exports a VRM (a 30-minute sanity check, not a commitment).
2. Build one placeholder SIINDEX avatar with the default/generic assets (not the real cultural design yet) purely to test load time and rendering in a real browser on a real low-end device.
3. Only after that works: have the cultural-asset-sourcing conversation (Tayla Jayne Beddoes / Pacific Group AI is a reasonable first conversation for this, given the existing relationship documented in `cook-islands-establishment-reality-ledger.md`) before committing to a specific visual direction.
4. Decide hosting/ownership model before anything public-facing ships.
5. Treat the citizen-facing "create your own avatar" flow as a separate, later decision — not bundled into step 1-4.

This doc is research and fact-checking only. No code has been written, no screen has been built, and nothing here should be treated as scheduled work until AJ decides to greenlight it.

## Sources (2026-07-24)
- CharacterStudio repo — https://github.com/M3-org/CharacterStudio
- CharacterStudio docs — https://m3-org.github.io/characterstudio-docs/
- CharacterStudio docs, About page — https://m3-org.github.io/characterstudio-docs/docs/about
- Live demo — https://studio.m3org.com/
- Original Webaverse repo (credited in README) — https://github.com/webaverse/characterstudio
- Default asset pack — https://github.com/m3-org/loot-assets
- Community sample asset pack — https://github.com/memelotsqui/character-assets
