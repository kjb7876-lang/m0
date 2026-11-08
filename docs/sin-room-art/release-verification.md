# SW-0009 release integration

This record supersedes the old remote-access limitations in `verification.md` for this integration attempt. Issue #297 records the user-approved public Issue/PR and deployment scope. The earlier local candidate and its historical evidence are retained unchanged.

## Exact integration

- Latest fetched main: `5b1b04cd3bffc39a47cfca3aed051bbc2a05f73f` (R404).
- Integrated local candidate: `4cf72ca24c9d8016ab5b19bc31e444f9c053b85e`.
- Runtime manifest: `3bc723bdbadc3113a3d58f3a512878532baf560cf4bc6693d15f2b838a3f9849`.
- Build: 6,701 files / 1,058,039,904 bytes. Built before the integration commit; its sourceCommit field therefore identifies the main base. Runtime bytes are pinned by the manifest and source hashes.

All 6,691 previous main manifest entries remain. Ten new entries add three overlays, six unique generated PNGs and their index. The only changed preexisting runtime entries are `index.html` and the intentional `cave-r204.js` furniture exclusion. All 233 preexisting canonical JS files were compared: only that cave file differs. Main's V16, R389/R390/R404 sources and assets are byte-identical. See `release-main-preservation.json`.

The existing V16 handles Mammon's architectural finish. Our boss-room overlay yields its own cladding and brass jambs when V16 is production-registered and enabled; our safe, five cash bundles and four office props remain. V16's twelve planned furniture items are outside native boss node 0 (`보스 전투실`). Its source and original assets are untouched. The ownership flag is part of our scene cache so enabling/disabling V16 restores the appropriate finish and disposes only our old resources.

Open PRs #276/#271/#269/#228/#217/#205/#187/#108/#26/#25/#24/#16 were checked before integration. No existing PR head was modified. Old shared-file overlaps are limited to registration, manifest, workflow and exact load-order files; integration starts from current main, preserves its checks and regenerates the complete manifest union. Main will be checked again before merging.

## Validation so far

- New art CPU and actual compiled native VM checks: PASS for all six changed rooms, including original image rectangles, projection, solid furniture, open center, door/progression/HP/save preservation and repeated-frame uniqueness.
- Seven-room CPU/native VM checks: PASS. Mammon CPU/native VM and V16's existing CPU checks: PASS.
- New ownership regression: unregistered, enabled, disabled and same-generation toggles; safe/cash retention, native resources, old group disposal and stable-frame caching: PASS.
- R176: 22/22 PASS. Source/runtime copies and manifest union match. Shared workflow retains every main step and adds the new checks.
- Fresh full-build browser captures: seven PC, seven portrait mobile, one Mammon mobile-detail. All 15 have no game/page/resource errors and pass the native recorded-image crop/plane/position assertions. Mammon reports inherited finish active, zero duplicated own architecture, one safe and five cash stacks.
- Full inherited local suite: running at the time this initial record is committed. Do not infer completion from the targeted results. Remote CI and public Pages verification are not yet complete.

The browser fixture uses Chromium headless, 777-assisted normal STORY entry, fixed paused camera and a temporary test save. V16's historical `pendingAssets` W01–W05 are retained metadata, and painted-detail shader status is not independently established by screenshots alone. Physical GPU/mobile, natural boss completion, motion and sustained frame rate remain unverified. Static flames and minor legacy lamp overlap remain as previously documented.

Fresh release review addenda identify exact examined PNGs separately from historical candidate reviews. Seven independent field scores are art 8.23, interior 8.3, camera 8.0, light 8.1, staging 8.3, UX 8.0 and VFX 8.2. Their mean is **8.16/10**, above the project's 7.77 threshold. No new blocking visual finding remains in those examined still frames; this is provisional headless evidence, not device or natural-combat approval.

An initial registration attempt was blocked by automatic approval review; the user then explicitly approved public Issue/PR content and deployment, after which Issue #297 was created. No security control was disabled.
