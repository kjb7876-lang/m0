# R81 camera and noncombat-space review

Reviewed 2026-10-23T01:05:07.715494+00:00.

- Presentation: 65/65 CPU checks; process exit 0.
- Environment: 17/17 CPU checks; process exit 0.
- Regenerated camera-projection.json and camera-projection.png from current runtime; inspected the PNG.
- The figures are CPU geometry diagrams using the actual isometric projection, without game textures, enemy animation, GPU rendering or natural play. The before view is a centered camera at the same zoom 1.12, not a captured V4 screenshot.

## Findings

- Textured gray backing is hidden. New backing has no texture or grid and intersects no walkable floor cells. Physical floors, walls, doors and gameplay state are unchanged by this module.
- At 27 fixed location/viewport combinations, sampled visible floor increased from 55.6% to 73.4%. For 15 edge combinations, sampled exterior decreased from 47.8% to 22.3%.
- Hero input and render use one persistent projection. The live VM controller draw retained camera and zoom; project/unproject error and before/after draw pixel drift were zero.
- Environment palettes use the canonical R81 family and exact roof tint, rather than an older broad theme.
- The source review did not reproduce a new serious camera/roof defect. A separate probe used actual native boss sprite dimensions in hospital, cave, swamp and finale with 24 assisted placements; none of the admitted actors lost head clearance in the sampled 1280 x 720 framing. This is not natural combat validation.

## Remaining limits

- The same fixed map cannot fill every wide viewport at every narrow edge while also keeping the hero visible. The preserved injection exit and corner entrances still show exterior. It is dark, solid backing now, not extra passable-looking tiled ground.
- Coverage measures the ground footprint only. Wall-top roofs, sprites, effects, labels and GPU pixel occlusion are not part of those percentages.
- Roof cutaways retain the renderer budget of the hero plus up to three nearest actors. Distant or additional enemies may still be occluded by roofs/walls.
- The camera optimizer uses discrete candidate offsets, smoothed over time. Natural camera motion, texture readability, large crowds and ultrawide boss fights still need a real browser/GPU play pass.

| Hardest sampled edge | Viewport | Exterior after | Floor after |
| --- | --- | ---: | ---: |
| north-exit | 2560 × 1080 | 42.7% | 39.6% |
| right-entry | 2560 × 1080 | 40.1% | 51.8% |
| north-exit | 1920 × 1080 | 35.4% | 44.8% |
| left-entry | 1920 × 1080 | 32.6% | 54.9% |

## Runtime snapshot hashes

```json
{
  "index.html": "712a921cfd13d6202bd460a62004bb9433afdc14f35c9606f64121df52df1b76",
  "dist/phase1.js": "5438717d6a90afe60c98bb7a1f1662fb3e94b9af85d4da6dd9beace0037ec90f",
  "hospital-improvements-a5.js": "4f230549de98e78baf94f5db835ea93fc164e9e0c6a635a3f34f94833f4ea978",
  "world-assets-r80.js": "2dbaa158e1f1b5060514267c4c2d8ba1541f49f822c7a92e06dcebe2d39cbca0",
  "world-presentation-r81.js": "1dea6f541fa01dad7d839b6d8a335e6b6f793f2916e819f9e8967a9294d957f8",
  "world-environment-r81.js": "9c6222b630f806eb37b9650de784a3c1ac88e0f19781235fa12dad172b15b5d6"
}
```
