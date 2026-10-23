# R78 / R79 review branch

This change adds an opt-in build overlay to the R77 site pipeline. Apply in order:

```sh
python scripts/apply-r76.py --site _pages/docs
python scripts/apply-r77.py --site _pages/docs
python scripts/apply-r78.py --site _pages/docs  # installs the R78 layouts and R79 EGO restore fix
```

R78 restructures the 55 profiled solo combat regions into the connected wide-room maze grammar while retaining authored exits, region art, enemy identity, health, damage, and campaign progression. It places native ordinary packs along the route, native midbosses in the gathering room, and canonical bosses in the central arena. The 54 ordinary-pack maps keep their native packs; `last301` retains its native boss-only encounter. The hospital presentation patch tightens the fine-pointer camera and adds Three.js floor markings around the surgeon. R79 restores R61 health-preservation metadata for active EGO rooms, which are hydrated outside the normal world-room save table; this prevents the first frame after restore from resetting enemy and boss HP.

CPU review commands, after the build, are:

```sh
STORYWORLD_SITE=_pages/docs node scripts/r78-world-maze.cpu.test.cjs
STORYWORLD_SITE=_pages/docs node scripts/r78-story-spawn.cpu.test.cjs
STORYWORLD_SITE=_pages/docs node scripts/r78-visual.cpu.test.cjs
STORYWORLD_SITE=_pages/docs node scripts/r79-ego-restore.cpu.test.cjs
```

R79 adds a first-native-frame HP regression to the CPU review. The branch does not change Pages output, main, PRs, HAPIL, pin/gate, workflow/security configuration, source saves, or the original release assets. Browser/WebGL/GPU and natural-play checks remain outstanding.
