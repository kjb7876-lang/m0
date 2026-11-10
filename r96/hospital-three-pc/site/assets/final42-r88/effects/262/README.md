# StoryWorld swamp horn-demon: reed-hand projectile

16 runtime frames = 16 painted nonempty. Frame256², atlas1024², one-shot800ms (50ms/frame), loop=false. Source motifs and boss/scene association preserved: dist02 scene03 늪지대의 뿔악마. Exact attack design/timing is new proposed artwork, NOT an existing validated gameplay rule.

Role-specific integration: Projectile flight: wrist on left, claw tips face right. Move the entire instance along game trajectory; the frames animate finger/reed deformation rather than substitute for travel. Run this bounded800ms articulation once; no seamless-flight loop claimed. Despawn on impact and use261 if appropriate.

Keep fixed normalized pivot(0.5,0.5); target/local map tuning remains necessary. Do not individually re-center silhouettes. Normal straight alpha, sRGB, linear clamp, no mipmaps. Render remnant/warning under actors, impact/projectile on appropriate effect layer. No automatic front/back occlusion masks supplied. No target, actor, floor tile or UI baked in.

Shared visual family: olive-brown wet swamp material, amber gold edge light, restrained green/teal energy. Warning has paired horns/open lane; projectile has articulated reeds; impact has broken liquid crests; remnant has three muddy grooves. Distinct role silhouettes preserve readability.

Performance proposal:4MiB RGBA8 atlas, one quad per instance,128–256px screen size. Start with8 concurrent instances and profile target device, not a measured FPS guarantee. Pool instances; avoid per-frame decode.

Source:batch01/dist02_reed_hand_projectile.png; catalog hash in provenance. No originals changed, no game/main/deploy changes, no live runtime test. Full-alpha APNG and light/dark contacts supplied; GIF is low-fidelity review only and repeats for convenience despite loop=false runtime metadata. Crop boundaries selected from transparent gaps with fixed-origin compensation. Native source cell approx384×256; no false512px detail claim.
