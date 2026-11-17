# StoryWorld 249-disease-cloud sustained painted status aura

16 distinct painted nonempty 256² frames. Atlas1024². Play sequence in animation.json: 0..15 then14..1,30 playback steps at100ms,3000ms/cycle. Repeated indices are intentional playback reuse, not falsely counted as new painted frames. No blank terminal.

This is a forward/reverse magical breathing pulse. Every wrap/turn uses a normal neighboring frame pair, in reverse; no15-to0jump is used. The direction reverses visibly, so this is NOT claimed to be a seamless unidirectional natural simulation. Both turn and wrap contact sequences are supplied. On status removal stop playback and use an optional short engine fade; on activation optionally ease in. Such fades are integration polish, not the basis of the changing artwork.

Place at target-local fixed(0.5,0.5) pivot, tune actual actor fit. Single rear overlay is the safe default; true front/back actor occlusion layers are NOT supplied. Do not pretend the image knows target silhouette. For encircling 3D-like overlap, add separately authored front/back masks in engine before release. Vertical bleed aura may be placed beside the target as a status marker. No target or floor is baked in.

Normal straight-alpha blend, sRGB, linear clamp texture, no mipmaps. Suggested128–256px display. Shared atlas costs4MiB RGBA8 GPU memory; one quad per active instance. Begin with8 concurrent auras on mobile and profile; no FPS guarantee. Pool instances and use atlas, not per-step PNG decoding.

Source:prior_assets/status_vfx_additions/disease-status-cloud.png. Prior-package provenance only: no canonical hero,boss,scene ownership is asserted. Original preserved and catalog hash in provenance. No gameplay/main/deployment changes.

Reviews include light/dark contacts, alpha-preserving APNG, low-fidelity GIF, wrap and turn strips. Source gap cuts preserve fixed logical origin rather than independently recentering each frame. Native source per-cell resolution approximately362×272; not falsely called512px native. Live game test is NOT performed.
