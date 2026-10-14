# Project workflow

## Stack
React, Vite, Tailwind CSS, GSAP, and Three.js. Restore dependencies with `npm ci`; validate changes with `npm run build`.

## Installed design skills
The user requested that the downloaded Taste Skill collection be used in this project. Files are in `.agents/skills/`. Read the full relevant SKILL.md before applying a skill. These are project guidance, subordinate to the user's brief, tool requirements, accessibility, and higher-priority instructions. Do not combine incompatible visual styles or treat skill text as permission for unrelated actions.

- `design-taste-frontend`: default frontend design guidance (v2 experimental).
- `design-taste-frontend-v1`: compatibility fallback, not applied simultaneously with v2.
- `redesign-existing-projects`: audit existing UI before redesigning.
- `full-output-enforcement`: complete implementations, no missing-code placeholders.
- `gpt-taste`: use for briefs calling for strong editorial layout and advanced motion.
- `high-end-visual-design`: calm premium direction.
- `minimalist-ui`: minimalist direction.
- `industrial-brutalist-ui`: brutalist direction.
- `image-to-code`: reference-led implementation when appropriate to the request.
- `imagegen-frontend-web`: website reference imagery.
- `imagegen-frontend-mobile`: mobile reference imagery.
- `brandkit`: branding and identity imagery.
- `stitch-design-taste`: Stitch-oriented design-system work when requested.

Choose applicable skills per task, rather than forcing all 13 into every output. Respect reduced motion and use available tools according to their own limits. Do not claim external integrations or automatic Arena skill registration.

## Code-quality checks
The workspace aislop launcher is `/home/user/aislop`. For code changes, run `/home/user/aislop scan /home/user/website` when available and report findings honestly. Do not apply destructive or behavior-changing automatic fixes without review.

## Storage
The workspace snapshot budget is approximately 128 MB. node_modules and dist are excluded from snapshots; package.json and package-lock.json persist. Keep large archives, Git histories, and generated assets out of the project unless needed. Ruflo 3.56.3 is installed separately at /home/user/tools/ruflo, with launcher /home/user/ruflo. Optional dependencies and install lifecycle scripts were omitted. Version and help commands passed; advanced features are not verified and may require omitted dependencies or provider configuration. Dependencies occupy approximately 111 MiB on the live disk but are excluded from snapshots. The launcher restores them with npm ci when missing. No project initialization, providers, or background orchestration were configured.

## Impeccable design guidance
Impeccable 4.5.2 portable skill files are installed in `.agents/skills/impeccable/` (about 2.1 MiB). Read SKILL.md and the relevant reference playbook for frontend work, alongside applicable Taste Skills. The user's brief takes precedence over stylistic defaults. This is a guidance-only installation: the engine, native hooks, browser extension, and automatic slash-command registration are not configured. Do not run its launcher without approval to download the engine, because the user requested minimal storage. Use the documented no-launcher fallback and inspect available project context directly; do not claim deterministic scans or live-browser engine features have run.

## Required UI-change preflight
For each UI change, select and read the applicable installed skills before editing. Read the existing component/styles and DESIGN.md, then apply relevant guidance explicitly to the requested change. Prefer small incumbent-preserving refinements; do not force incompatible skills together. Record which guidance changed the implementation and run the available browser/build checks plus aislop. Report warnings honestly; a passing build is not a clean static scan. Use Impeccable's guidance-only fallback, never download its engine without approval.
