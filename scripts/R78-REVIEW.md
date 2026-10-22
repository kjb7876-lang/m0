# R78 review branch

This change adds an opt-in build overlay to the R77 site pipeline. Apply in order:

```sh
python scripts/apply-r76.py --site _pages/docs
python scripts/apply-r77.py --site _pages/docs
python scripts/apply-r78.py --site _pages/docs
```

R78 restructures the 55 profiled solo combat regions into the connected wide-room maze grammar while retaining authored exits, region art, enemy identity, health, damage, and campaign progression. It places native ordinary packs along the route, native midbosses in the gathering room, and canonical bosses in the central arena. The 54 ordinary-pack maps keep their native packs; `last301` retains its native boss-only encounter. The hospital presentation patch tightens the fine-pointer camera and adds Three.js floor markings around the surgeon.

CPU review commands, after the build, are:

```sh
STORYWORLD_SITE=_pages/docs node scripts/r78-world-maze.cpu.test.cjs
STORYWORLD_SITE=_pages/docs node scripts/r78-story-spawn.cpu.test.cjs
STORYWORLD_SITE=_pages/docs node scripts/r78-visual.cpu.test.cjs
```

The branch does not change Pages output, main, PRs, HAPIL, pin/gate, workflow/security configuration, source saves, or the original release assets. Browser/WebGL/GPU and natural-play checks remain outstanding.
