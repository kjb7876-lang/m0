# R1041 7-field review: first Dots CX-0099FX sheets (M1·A5·C2·C4·H6)

Scope: the code-built R106 single-frame images are swapped for cells of the hand-painted Dots frame sheets, inside the draw recorder.

| ID | Effect | Old code-built image | New sheet |
|---|---|---|---|
| M1 | Michaela halo | R106 `halo` | 8-frame loop |
| A5 | Slayer blood flame | R106 `flame`, two layers | 8-frame loop at the feet; the overlay flame layer is removed |
| C4 | Growth ground ring | R106 `glow` under the feet, 2:1 | 8-frame loop |
| H6 | Hwando iai draw-cut | R106 `iai-cut` (`slashline` overlay also removed) | 8-frame one-shot, timed per cut direction |
| C2 | Hero hurt | R101 painted sig-hit plus code stroke lines | 6-frame one-shot |

The original call's position, size, alpha and blend are kept. If a sheet has not loaded, the original image is drawn.

M6 (medicine box) and H2 (lauren vortex) were also received. Neither is applied here: the game already draws painted sheets for those spots (the R988 music-box tower and the r561 lauren gravity sheets), and their code drawings are only fallbacks.

Evidence:
- `screens/michaela-slayer-before-after.jpg`: headless 1280×720 render, zoomed around the hero, off vs on. Top row is Michaela (idle, then hurt); bottom row is Slayer (idle, then hurt).
- `screens/<hero>-before/after.jpg`: 640×360.
- `screens/sheets.jpg`: the sheets themselves.
- Not verified on a real device or a GPU.

| Field | Score | Basis |
|---|---|---|
| Art | 8.0 | The halo now reads as a painted gold-pink light ring with sparkles. Hurt is a ring of red cracked shards instead of code lines, so the "line" feel is gone. |
| Direction | 7.8 | Hurt is a one-shot burst then fade. The iai cut runs as an 8-frame one-shot per cut direction, so each cut in a combo has its own timing. |
| Camera framing | 8.0 | Halo stays over the head and the ground ring under the feet (2:1). Neither covers the silhouette. |
| Space / interior | 7.8 | The ground ring is a flat 2:1 ellipse that matches the quarter-view floor. On bright floors it reads faintly (alpha ×1.6). |
| Lighting / colour | 7.8 | Gold-pink halo, blood-red flame and shards, silver-gold iai. On the bright floor the halo is a little paler than the old white glow, which was raised with alpha ×1.15. |
| Animation / VFX | 8.2 | Headless count of distinct frames: M1 8/8, A5 8/8, C4 8/8, C2 3–5 frames (one-shot), H6 7/8. One single image became a frame animation. |
| UX / level | 7.8 | Hurt reads clearly, with less line noise. Off switch: `storyworld.r1041.dotsfx=off`. Gameplay rules, damage and timings are unchanged. |

Average **7.91** (> 7.77, pass).

Remaining issues (probability):
- On a real device, the Slayer A5 flame is only visible while heat is up, so it is hard to see at idle. Chance it reads weaker than expected: about 35%. It shows clearly during EGO once R1039 has merged; this shot is unverified until then.
- The ground ring is drawn under the feet of all 8 heroes, so some people may find it busy: about 15%. The off switch can turn it off.
- The C2 hurt check judges "hurt started near the hero". If an enemy hit lands right next to the hero at the same moment, it could be misread as a hurt: about 5%.

---

# R1041 r2 additions (11-15): four Michaela sheets that passed Dots review (M3, M4, M5, M7)

| ID | Effect | Old drawing | New sheet |
|---|---|---|---|
| M3 | EGO aura | R1039 hero-colour sig-aura (3 layers) + sig-gather swirl + front layer | Activation 6 frames (0.5 s), then a 10-frame loop |
| M4 | Skill hit | R101 heroHit sig-hit (overlay layer removed) | 8-frame one-shot of a heart and feathers |
| M5 | Ground heart (Love's Prescription passive) | Code fill and outline of the heart in R948 groundHeart | Ground heart sheet: 4 frames drawing in, then a pulse on frames 4·5·6·5 |
| M7 | Sky light pillar after R | Code pillar in R563: three gradient fill layers plus particles | 12-frame one-shot; the cell bottom at 0.98 sits on the pillar's foot |

H3 (Neon electric spear) is held as a spare. The game already draws a hand-painted spear sheet there (r951 neon-lance), and the code only runs as a fallback.

Evidence:
- `screens/michaela-ego-m3-before-after.jpg`: headless 1280×720, zoomed around the hero. Left is R1041 off, which shows the R1039 magenta aura; right is on. Top row is the activation, bottom row is the loop.
- In the headless run, M4, M5 and M7 did not appear: skill hits didn't land, Love's Prescription didn't trigger, and the R key is not yet learned. They are checked only by the CPU test (sheet position, frames, layer removal). Natural play, real device and GPU are unverified.

| Field | Score | Basis |
|---|---|---|
| Art | 8.1 | M3 changes the magenta blob into rose-gold "heavenly flames" that wrap the body, with heart embers. M5 changes the code heart outline into a hand-painted heart pattern. |
| Direction | 8.0 | EGO activation is a big burst (6 frames) followed by a loop. The hit is a heart-and-feather burst; the pillar comes down from the sky and fades. |
| Camera framing | 7.8 | The EGO flame reaches about 2.4× the hero's height and covers part of the screen above the head. The halo and silhouette still read. |
| Space / interior | 7.8 | The ground heart and the pillar's ground ring are flat ellipses that match the quarter-view floor. |
| Lighting / colour | 7.8 | Rose-pink and gold, one palette with Michaela's halo, wings and heart shot. On bright floors the EGO flame looks somewhat translucent (the hero-visibility veil also applies). |
| Animation / VFX | 8.2 | M3 shows 4 of 6 activation frames and 10 of 10 loop frames in headless. M4, M5 and M7 cycle through every frame in the CPU check. |
| UX / level | 7.8 | EGO now reads at a glance as Michaela's own. Off switch is shared (`storyworld.r1041.dotsfx=off`). Gameplay, damage and timing are unchanged. |

r2 average **7.93** (> 7.77, pass).

Remaining issues (probability):
- M4 has its ground-ring centre shifting ±4px per frame (Dots review note). I didn't add a per-frame correction; chance it looks noticeably shaky in game: about 15%.
- M7 is drawn wider than the old code pillar (cell aspect 1:2). Chance it reads too wide on screen: about 20%.
- M5 holds the full heart in its pulse and does not show the scatter frame, so the end of the effect is cut by the code timing: about 10% that this feels awkward.
