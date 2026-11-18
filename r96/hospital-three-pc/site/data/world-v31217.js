/* MONGSE v3.12.17 — source-aligned world, environment, and boss profiles.
 * This file contains gameplay metadata only.  Narrative prose is owned solely
 * by the uploaded byte-exact source and is never reconstructed here.
 */
(() => {
  "use strict";

  const source = "MONGSE_v31211_간결_흥미강화_통합서사.txt";
  const sourceSha256 = "23ba9381011e3e97f23e19356fb3c9f32b1cd338b991c309c77a7abfaecee2d4";
  const generatedAssets = Object.freeze({
    demonTreePalaceMap: "./assets/maps/generated-v31217/ep1a_demon_tree_palace_ruin.webp",
    demonTreeGardenPrologue: "./assets/maps/ep1a_00_demon_tree_garden.png",
    demonTreeRootSeraph: "./assets/episode1a/demon_tree_root_seraph.png",
    fusedNightmareCoreMap: "./assets/maps/generated-v31217/fused_nightmare_core.webp",
    purpleSwordSpiderAngel: "./assets/episode1a/generated-v31217/purple_sword_spider_angel.webp",
    arveliaDelayArchon: "./assets/kair/generated-v31217/arvelia_delay_archon.webp",
    prideHierophant: "./assets/generated-v31217/boss-actions/pride_hierophant_idle.webp",
  });
  const generatedAssetBindings = Object.freeze({
    maps: Object.freeze({
      hub: generatedAssets.demonTreePalaceMap,
      dist00: generatedAssets.demonTreeGardenPrologue,
      cult04: generatedAssets.fusedNightmareCoreMap,
    }),
    actors: Object.freeze({
      "dist00-boss": Object.freeze({
        zoneId: "dist00",
        name: "뿌리의 문지기",
        asset: generatedAssets.demonTreeRootSeraph,
        phaseCount: 2,
      }),
      "mb-dist01": Object.freeze({
        zoneId: "dist01",
        name: "보라검천사",
        asset: generatedAssets.purpleSwordSpiderAngel,
        phaseCount: 1,
      }),
      "kair-great-03": Object.freeze({
        zoneId: "kair02",
        name: "아르벨리아, 유예의 수문장",
        asset: generatedAssets.arveliaDelayArchon,
        phaseCount: 3,
        canonicalAlly: true,
      }),
      "c104-boss": Object.freeze({
        zoneId: "cult04",
        name: "교만의 사이보그 교주",
        asset: generatedAssets.prideHierophant,
        phaseCount: 4,
      }),
    }),
  });
  const zone = (
    id,
    order,
    sourceRefs,
    environmentKey,
    topology,
    weather,
    lighting,
    hazard,
    prop,
    tempo,
    tier,
    assetOverride = null,
  ) => Object.freeze({
    id,
    order: id === "dist00" ? 1 : order >= 1 ? order + 1 : order,
    sourceRefs: Object.freeze([...sourceRefs]),
    environmentKey,
    topology,
    weather,
    lighting,
    hazards: Object.freeze([hazard]),
    props: Object.freeze([prop]),
    tempo,
    tier,
    assetOverride,
    projectileOcclusion: "none",
    attackTerrainPolicy: "pierce",
    projectileRetirePolicy: "target-or-world-egress",
  });

  const zones = Object.freeze([
    zone("hub", 0, ["P1.S1"], "demon-tree-palace-ruin", "radial-garden", "ash-drift", "crimson-root-pulse", "root-surge", "corrupted-palace-tree", "ominous-slow", 0, generatedAssets.demonTreePalaceMap),
    zone("dist00", 1, ["P1.S1"], "demon-tree-palace-garden", "ruined-palace-garden", "black-ash", "root-pulse", "memory-root-sweep", "fallen-seraph-roots", "root-lane-pressure", 1, generatedAssets.demonTreeGardenPrologue),
    zone("dist01", 1, ["P1.S2"], "bone-web-cavern", "webbed-bridges", "spore-fall", "violet-slash", "ceiling-web-drop", "bone-web-pillars", "staccato-duel", 1),
    zone("dist02", 2, ["P1.S3"], "face-reed-black-swamp", "sinking-islets", "poison-mist", "sickly-moon", "grasping-water-hands", "horn-skull-reeds", "drag-and-burst", 1),
    zone("dist03", 3, ["P1.S4.a"], "summoning-city-approach", "broken-boulevard", "ember-gust", "seven-pillar-backlight", "road-fissure", "fallen-guardian-banners", "forward-pressure", 1),
    zone("dist04", 4, ["P1.S4.b"], "fallen-guardian-crossing", "grave-switchbacks", "blood-rain", "low-red-rim", "revival-rift", "companion-weapon-markers", "counter-rhythm", 1),
    zone("dist05", 5, ["P1.S4.c"], "seven-pillar-pilgrimage", "converging-lanes", "cinder-stream", "black-column-strobe", "pillar-fire-line", "summoning-seal-fragments", "lane-escalation", 1),
    zone("dist06", 6, ["P1.S4.d"], "balrog-gate-circle", "circular-duel", "firestorm", "inferno-eclipse", "whip-fissure", "seven-black-columns", "three-act-crescendo", 1),
    zone("ep1a07", 7, ["P1.S5"], "void-fall-corridor", "collapsing-spiral", "debris-vortex", "cold-void-flash", "floor-shear", "falling-city-blocks", "fall-and-release", 1),
    zone("ep1a08", 8, ["P1.S6"], "blood-hospital", "ward-corridors", "fluorescent-flicker", "white-to-red-cycle", "door-slam-wave", "beds-and-help-wall", "claustrophobic-pulse", 1),
    zone("ep1a09", 9, ["P1.S7", "P1.S8"], "injection-memory-theatre", "radial-treatment-bays", "glass-dust", "sterile-blue-memory-red", "syringe-lane", "labelled-vial-cabinet", "hallucination-surge", 1),
    zone("ep1a10", 10, ["P1.S9", "P1.S10"], "patient-addiction-city", "ruin-grid", "chemical-rain", "neon-withdrawal", "craving-zone", "patient-chart-monoliths", "collapse-and-recover", 1),
    zone("ep1a11", 11, ["P1.S11", "P1.S12"], "false-heaven-clinic", "halo-arena", "white-feather-ash", "gold-to-666-red", "false-light-column", "cracked-angel-mask", "mask-break-finale", 1),
    zone("dreamRest", 12, [], "clinical-transition-rest", "safe-room", "none", "soft-cyan", "none", "treatment-console", "rest", 0),
    zone("ep1b01", 13, ["P2.S1"], "solomon-seal-chapel", "seventy-two-node-ring", "incense-haze", "amber-seal", "seal-closure", "brass-exorcism-terminals", "ritual-measure", 2),
    zone("ep1b02", 14, ["P2.S2"], "sloth-house", "compressed-rooms", "mold-spores", "stale-green", "furniture-fall", "rotting-bed-shell", "slow-heavy-release", 2),
    zone("ep1b03", 15, ["P2.S3"], "cracked-glasses-suite", "mirror-corridors", "glass-rain", "cold-violet", "comparison-echo", "split-portrait-frames", "alternating-barrage", 2),
    zone("ep1b04", 16, ["P2.S4"], "glutton-kitchen", "counter-maze", "grease-steam", "toxic-green", "boiling-floor", "industrial-stoves", "inhale-and-expel", 2),
    zone("ep1b05", 17, ["P2.S5"], "red-heel-stage", "spotlight-runways", "rose-petal-storm", "scarlet-heartbeat", "marionette-thread", "red-heels-and-curtains", "dance-tempo", 2),
    zone("ep1b06", 18, ["P2.S6.a"], "mammon-vault", "vault-spokes", "gold-dust", "coin-glare", "ledger-laser", "price-tag-lockers", "compound-interest", 2),
    zone("ep1b06b", 19, ["P2.S6.b"], "mammon-winter-memory", "frozen-switchbacks", "whiteout", "blue-gold-memory", "ice-debt-ring", "childhood-vault-door", "freeze-and-burst", 2),
    zone("ep1b07", 20, ["P2.S7"], "hotel-fire", "burning-stairwell", "smoke-plume", "orange-black", "flashover-wall", "service-carts-and-alarms", "rage-overheat", 2),
    zone("ep1b08", 21, ["P2.S8"], "pride-cathedral", "vertical-cross-lanes", "black-snow", "polar-white-black-sun", "gravity-cross", "white-suit-throne", "ascension-steps", 2),
    zone("ep1b09", 22, ["P2.S9"], "bio-bootloader-core", "neural-concentric", "data-ash", "black-sun-cyan", "boot-sequence-grid", "cyborg-chairman-cradle", "four-phase-upload", 2),
    zone("restEp1b", 22.5, ["P2.S10"], "missing-return-refuge", "safe-observation-bay", "silent-static", "dim-black-sun", "none", "empty-return-pod", "rest", 0),
    zone("u201", 23, ["P3.S1.01-04"], "controller-war-loop", "marching-grid", "bombardment-dust", "steel-orange", "drone-bombing-loop", "defense-legion-fabricators", "recursive-march", 3),
    zone("u202", 24, ["P3.S1.05-08"], "cruel-salvation-prison", "rising-walls", "cold-rain", "blue-white", "compassion-pressure", "maintenance-cells", "wall-growth", 3),
    zone("u204", 25, ["P3.S1.09-12"], "first-memory-threshold", "segmented-gates", "memory-noise", "amber-steel", "system-veto", "legacy-human-frames", "gate-negotiation", 3),
    zone("u205", 26, ["P3.S1.13-14"], "admin-abuse-room", "authority-chambers", "signal-tear", "red-terminal", "resource-absorption", "administrator-console", "authority-inversion", 3),
    zone("u206", 27, ["P3.S1.15-17"], "central-migration-core", "core-concentric", "coolant-fog", "cyan-black", "choice-command-lanes", "machine-body-cradle", "migration-countdown", 3),
    zone("u203", 28, ["P4.S1"], "controller-memory-gate", "memory-nexus", "fragment-replay", "white-cyan-red", "gate-armor-collapse", "memory-door-frame", "structure-break-finale", 3),
    zone("restU2", 28.5, ["P4.S2", "P4.S3"], "fusion-rift-outpost", "three-world-junction", "cross-era-wind", "rose-rift", "none", "hwando-and-rose-seal", "rest", 0),
    zone("last304", 29, ["P4.S4"], "fusion-neutral-meadow", "open-meadow-ruins", "wet-grass-wind", "overcast-green", "rift-pulse", "ruined-castle-stones", "reawakening", 4),
    zone("last305", 30, ["P4.S5"], "goblin-flute-forest", "forest-clearings", "leaf-spiral", "moon-green", "wolf-command-wave", "rose-seal-stump", "flute-call-response", 4),
    zone("last301", 31, ["P4.S6"], "fallen-angel-black-sea", "storm-castle-rampart", "black-sea-rain", "violet-lightning", "six-sword-cross", "broken-castle-battlements", "learn-split-pierce", 4),
    zone("last302", 32, ["P4.S7"], "sleepless-port-village", "tile-roof-lanes", "coastal-fog", "talisman-red", "thread-pulled-crowd", "jangseung-and-red-charms", "crowd-pressure", 4),
    zone("last303", 33, ["P4.S8"], "insomnia-black-fog-duel", "sealed-duel-circle", "black-fog", "dawn-edge", "gaze-afterimage", "herbal-bowl-and-torn-wall", "one-on-one", 4),
    zone("restLast3", 33.5, [], "post-portal-observation", "safe-rift-platform", "low-fog", "pre-dawn", "none", "portal-instrument", "rest", 0),
    zone("kair01", 34, ["P5.S1", "P5.S2", "P5.S3", "P5.S4"], "first-command-academy", "core-defense-ring", "dead-time-sand", "academy-gold-black", "six-wave-core-siege", "turrets-and-command-core", "six-wave-defense", 5),
    zone("kair04", 35, ["P5.S5.a"], "guardian-ruins", "broken-plaza", "chronos-dust", "rust-gold", "fatigue-clock", "harvest-beacons", "expedition-start", 5),
    zone("kair05", 36, ["P5.S5.b"], "guardian-time-forest", "branching-timepaths", "reverse-leaves", "emerald-gold", "memory-hourglass", "time-root-altars", "branching-cadence", 5),
    zone("kair06", 37, ["P5.S5.c"], "guardian-polluted-waterway", "canal-lanes", "data-rain", "teal-black", "binding-current", "neuron-pumps", "current-shift", 5),
    zone("kair07", 38, ["P5.S5.d"], "guardian-black-workshop", "forge-switchbacks", "spark-rain", "orange-violet", "repetition-forge", "command-anvils", "industrial-syncopation", 5),
    zone("kair08", 39, ["P5.S5.e"], "guardian-neuron-gate", "synapse-bridges", "thought-static", "electric-blue", "choice-lock", "brain-archon-connectors", "neural-gate", 5),
    zone("kair09", 40, ["P5.S5.f"], "guardian-oblivion-cemetery", "clock-graves", "black-sandfall", "moon-silver", "memory-erasure-sweep", "broken-hourglass-graves", "silence-then-surge", 5),
    zone("kair10", 41, ["P5.S5.g"], "guardian-collapsed-ritual", "fractured-dial", "time-lightning", "red-gold", "optimization-delete-zone", "command-script-obelisks", "deletion-crescendo", 5),
    zone("kair02", 42, ["P5.S6"], "arvelia-sealed-corridor", "stopped-clock-hall", "suspended-dust", "silver-gold", "deletion-thread", "unwritten-letters", "defer-and-cut", 5),
    zone("kair03", 43, ["P5.S7", "P5.S8", "P5.S9", "P5.S10"], "siren-command-time-core", "clockwork-arena", "dead-time-storm", "black-gold-cyan", "imperative-command-beat", "neuron-cables-and-production-lines", "four-act-free-will", 5),
    zone("restKairo", 43.5, ["P5.S11"], "rewritten-first-command-garden", "asymmetric-time-garden", "gold-sand", "multi-speed-dawn", "none", "independent-clocks", "rest", 0),
    zone("hando01", 44, ["P6.S1"], "summoned-castle-defense", "castle-wall-front", "demon-ash", "silver-red", "siege-wave", "silver-seal-battlements", "defense-escalation", 6),
    zone("hando02", 45, ["P6.S2.a"], "castle-collapse-ego-theft", "breached-ramparts", "stone-rain", "silver-black", "core-theft-line", "collapsed-wall-segments", "failure-to-awakening", 6),
    zone("hando03", 46, ["P6.S2.b"], "owner-authority-ego-reclaim", "mirror-throne", "silver-shards", "restored-white", "reclaim-return-path", "ego-core-and-owner-seal", "authority-reversal", 6),
    zone("restHando", 46.5, ["P6.S3"], "blocked-time-wormhole", "causal-junction", "static-rain", "blue-silver", "none", "looping-clock-portal", "rest", 0),
    zone("murder01", 47, ["P7.S1"], "rain-crosswalk", "traffic-lanes", "wet-road-rain", "blue-signal", "vehicle-path", "crosswalk-phone-shadow", "traffic-countdown", 7),
    zone("murder02", 48, ["P7.S2"], "saebit-hotel-stair", "narrow-stairwell", "leaking-water", "emergency-red", "gravity-fall-line", "security-room-and-fire-door", "vertical-chase", 7),
    zone("murder04", 49, ["P7.S3", "P7.S4"], "teal-villa-testimony", "apartment-stairs", "window-rain", "teal-grey", "statement-lock", "unsubmitted-report-drawer", "evidence-convergence", 7),
    zone("murder03", 50, ["P7.S5"], "rooftop-mobius-cycle", "rooftop-loop", "rain-bend", "blue-signal-black", "causal-fall-vector", "curved-road-and-headlights", "loop-restart", 7),
    zone("cult01", 51, ["P7.S6.a"], "black-rose-chip-altar", "implant-aisles", "rose-static", "black-crimson", "chip-injection-grid", "electronic-forehead-needles", "infiltration", 7),
    zone("cult02", 52, ["P7.S6.b"], "fusion-neural-network", "choir-halves", "signal-fog", "magenta-cyan", "antiphonal-neural-wave", "network-choir-pylons", "left-right-chorus", 7),
    zone("cult05", 53, ["P7.S6.c"], "id-biotech-vat", "organic-vat-maze", "amniotic-mist", "acid-green", "impulse-spawn-pool", "biotech-limbs", "biological-surge", 7),
    zone("cult06", 54, ["P7.S6.d"], "superego-machine-court", "judgment-grid", "metal-dust", "white-red", "verdict-lane", "mechanical-bench-and-scales", "sentence-and-release", 7),
    zone("cult03", 55, ["P7.S6.e"], "triune-ego-core-prison", "three-ring-vault", "crystal-fall", "rose-violet", "three-layer-extraction", "ego-superego-id-cradles", "triune-convergence", 7),
    zone("cult04", 56, ["P7.S6.f"], "antichrist-summoning-throne", "six-limbed-throne", "armageddon-ash", "black-rose-white", "moving-command-safe-zone", "biotech-machine-throne", "final-summoning", 7, generatedAssets.fusedNightmareCoreMap),
    zone("village", 57, [], "noncanonical-safe-endpoint", "safe-square", "none", "neutral-dawn", "none", "release-console", "rest", 0),
  ]);

  const boss = (
    id,
    zoneId,
    sourceRef,
    sourceIdentity,
    arenaRule,
    grammar,
    phasePresentation,
    hazard,
    accent,
  ) => Object.freeze({
    id,
    zoneId,
    sourceRef,
    sourceIdentity,
    arenaRule,
    grammar,
    phasePresentation: Object.freeze([...phasePresentation]),
    hazard,
    accent,
    reflectable: false,
    forcedHeroRelocation: false,
    attackTerrainPolicy: "pierce",
    projectileRetirePolicy: "target-or-world-egress",
    minimumProjectileDwellSeconds: 5.8,
  });

  const bosses = Object.freeze([
    boss("dist00-boss", "dist00", "P1.S1", "뿌리의 문지기", "demon-tree-root-seal", "root-lane", ["root-bound-seraph", "black-root-overgrowth"], "memory-root-sweep", "#574051"),
    boss("dist06-boss", "dist06", "P1.S4", "발록", "seven-pillar-inferno", "gate", ["whip-fissure", "fire-sky", "gate-collapse"], "inferno-corridor", "#ff5a1f"),
    boss("a11-boss", "ep1a11", "P1.S11", "루시퍼", "false-heaven-mask-break", "mirror", ["angel-mask", "mark-reveal", "false-light-collapse"], "halo-judgment", "#f5df8b"),
    boss("b02-boss", "ep1b02", "P2.S2", "벨페고르", "sloth-room-collapse", "inhale", ["human", "shell", "sloth-form"], "falling-furniture", "#66745d"),
    boss("b03-boss", "ep1b03", "P2.S3", "레비아탄", "envy-glass-echo", "ricochet", ["human", "glass-echo", "serpent-form"], "glass-rain", "#7b65b8"),
    boss("b04-boss", "ep1b04", "P2.S4", "베엘제붑", "glutton-kitchen-ingestion", "inhale", ["human", "kitchen-maw", "glutton-form"], "boiling-vat", "#77bd44"),
    boss("b05-boss", "ep1b05", "P2.S5", "아스모데우스", "lust-marionette-stage", "rhythm", ["human", "thread-stage", "lust-form"], "heart-thread", "#ed3d70"),
    boss("b06-boss", "ep1b06", "P2.S6", "맘몬", "greed-vault-ledger", "track", ["human", "price-grid", "greed-form"], "debt-laser", "#d9ad32"),
    boss("b06b-boss", "ep1b06b", "P2.S6", "맘몬", "greed-winter-origin", "return", ["child", "frozen-memory", "greed-core"], "ice-debt-ring", "#9fd4e9"),
    boss("b07-boss", "ep1b07", "P2.S7", "사탄", "wrath-hotel-flashover", "cone", ["human", "fire-beast", "wrath-form"], "flashover-wall", "#ff3d24"),
    boss("b08-boss", "ep1b08", "P2.S8", "회장", "pride-black-sun-ascent", "formation", ["human", "white-throne", "black-sun", "pride-form"], "gravity-cross", "#f1f3f4"),
    boss("b09-boss", "ep1b09", "P2.S9", "사이보그 회장", "bio-bootloader-upload", "thread", ["human", "cyborg", "bootloader", "singularity"], "boot-grid", "#39d4d4"),
    boss("u203-boss", "u203", "P4.S1", "통제자(The Controller)", "memory-gate-structure", "replay", ["door-armor", "controller-core"], "memory-replay", "#7ee8ff"),
    boss("l305-boss", "last305", "P4.S5", "고블린 두목", "flute-wolf-command", "rhythm", ["flute-call", "wolf-ring", "rose-rift"], "wolf-convergence", "#76a84e"),
    boss("l301-boss", "last301", "P4.S6", "타락천사 기사", "six-form-sword-learning", "duel", ["observe", "learn", "six-forms"], "six-sword-cross", "#8a68c7"),
    boss("l303-boss", "last303", "P4.S8", "불면귀", "sleepless-gaze-duel", "orbit", ["gaze", "afterimage", "black-fog-core"], "gaze-afterimage", "#36304f"),
    boss("kair-great-01", "kair05", "P5.S5", "대수문장", "guardian-fatigue-clock", "orbit", ["measure", "overwork", "time-tax"], "fatigue-dial", "#a9c76a"),
    boss("kair-great-02", "kair06", "P5.S5", "대수문장", "guardian-binding-current", "track", ["channel", "bind", "floodgate"], "binding-current", "#42b6a6"),
    boss("kair-great-03", "kair02", "P5.S6", "아르벨리아, 유예의 수문장", "guardian-deferred-deletion", "chrono", ["pause", "mark", "delete-window"], "deletion-thread", "#d7d2a4"),
    boss("kair-great-04", "kair07", "P5.S5", "대수문장", "guardian-addiction-forge", "return", ["bait", "repeat", "overheat"], "repetition-forge", "#d77a42"),
    boss("kair-great-05", "kair08", "P5.S5", "대수문장", "guardian-comparison-echo", "mirror", ["sample", "compare", "overwrite"], "comparison-echo", "#6d8fd4"),
    boss("kair-great-06", "kair10", "P5.S5", "대수문장", "guardian-optimization-prune", "cone", ["scan", "prune", "single-path"], "delete-sector", "#dfb144"),
    boss("k103-boss", "kair03", "P5.S7-10", "세이렌 모르", "imperative-clock-core", "chrono", ["time-harvest", "optimized-fate", "free-will-time"], "command-beat", "#d3b550"),
    boss("h103-boss", "hando03", "P6.S1-2", "악몽의 우두머리", "ego-theft-and-reclaim", "return", ["siege", "ego-theft", "authority-reclaim"], "core-return-path", "#c9d6df"),
    boss("blue-executor", "murder03", "P7.S5", "파란불", "mobius-causal-rooftop", "replay", ["crosswalk", "falling-vector", "loop-restart"], "causal-fall-line", "#2e7fff"),
    boss("c102-boss", "cult02", "P7.S6", "흑장미단", "collective-neural-choir", "formation", ["left-choir", "right-choir", "network-unison"], "antiphonal-wave", "#da4fd7"),
    boss("c103-boss", "cult03", "P7.S6", "집단 자아", "triune-ego-extraction", "thread", ["ego", "super-ego", "id"], "three-layer-drain", "#9a58cf"),
    boss("c104-boss", "cult04", "P7.S6", "교만의 사이보그 교주", "antichrist-command-throne", "gate", ["cult-leader", "ego-capture", "triune-union", "summoning-throne"], "moving-safe-zone", "#f1e5db"),
  ]);

  /* Line intervals are half-open and rejoin the uploaded source in order.
   * Five combat-only route nodes share the P5.S5 expedition and intentionally
   * do not split or duplicate source prose. */
  const storyRangeSpecs = Object.freeze([
    ["hub", 1, 36], ["dist01", 36, 88], ["dist02", 88, 150],
    ["dist03", 150, 158], ["dist04", 158, 170], ["dist05", 170, 182],
    ["dist06", 182, 200], ["ep1a07", 200, 230], ["ep1a08", 230, 272],
    ["ep1a09", 272, 352], ["ep1a10", 352, 440], ["ep1a11", 440, 561],
    ["dreamRest", 561, 564], ["ep1b01", 564, 614], ["ep1b02", 614, 666],
    ["ep1b03", 666, 706], ["ep1b04", 706, 744], ["ep1b05", 744, 786],
    ["ep1b06", 786, 802], ["ep1b06b", 802, 828], ["ep1b07", 828, 866],
    ["ep1b08", 866, 904], ["ep1b09", 904, 966], ["restEp1b", 966, 988],
    ["u201", 988, 1022], ["u202", 1022, 1046], ["u204", 1046, 1070],
    ["u205", 1070, 1082], ["u206", 1082, 1105], ["u203", 1105, 1120],
    ["restU2", 1120, 1144], ["last304", 1144, 1156],
    ["last305", 1156, 1170], ["last301", 1170, 1182],
    ["last302", 1182, 1192], ["last303", 1192, 1211],
    ["restLast3", 1211, 1214], ["kair01", 1214, 1294],
    ["kair04", 1294, 1298], ["kair05", 1298, 1302],
    ["kair06", 1302, 1306], ["kair02", 1306, 1340],
    ["kair03", 1340, 1426], ["restKairo", 1426, 1460],
    ["hando01", 1460, 1472], ["hando02", 1472, 1478],
    ["hando03", 1478, 1486], ["restHando", 1486, 1502],
    ["murder01", 1502, 1538], ["murder02", 1538, 1588],
    ["murder04", 1588, 1690], ["murder03", 1690, 1724],
    ["cult01", 1724, 1736], ["cult02", 1736, 1744],
    ["cult05", 1744, 1750], ["cult06", 1750, 1756],
    ["cult03", 1756, 1771], ["cult04", 1771, 1783],
  ].map((entry) => Object.freeze(entry)));

  const zoneById = Object.freeze(Object.fromEntries(zones.map((entry) => [entry.id, entry])));
  const bossById = Object.freeze(Object.fromEntries(bosses.map((entry) => [entry.id, entry])));
  const storyAttachmentZoneIds = Object.freeze(
    storyRangeSpecs.map((entry) => entry[0]),
  );
  const sourceParts = new Set(zones.flatMap((entry) => entry.sourceRefs.map((ref) => ref.split(".")[0])));
  const environmentKeys = new Set(zones.map((entry) => entry.environmentKey));
  const arenaRules = new Set(bosses.map((entry) => entry.arenaRule));
  const probe = () => Object.freeze({
    zoneCount: zones.length,
    combatZoneCount: zones.filter((entry) => entry.tier > 0).length,
    restZoneCount: zones.filter((entry) => entry.tempo === "rest").length - 1,
    bossCount: bosses.length,
    generatedAssetCount: Object.keys(generatedAssets).length,
    generatedAssetBindingCount:
      Object.keys(generatedAssetBindings.maps).length +
      Object.keys(generatedAssetBindings.actors).length,
    sourcePartCount: sourceParts.size,
    sourceSectionCount: 51,
    storyAttachmentCount: storyAttachmentZoneIds.length,
    storyRangeContiguous:
      storyRangeSpecs[0]?.[1] === 1 &&
      storyRangeSpecs.at(-1)?.[2] === 1783 &&
      storyRangeSpecs.every(
        (entry, index) => index === 0 || storyRangeSpecs[index - 1][2] === entry[1],
      ),
    uniqueEnvironmentCount: environmentKeys.size,
    uniqueBossArenaRuleCount: arenaRules.size,
    zoneIdsUnique: zoneById && Object.keys(zoneById).length === zones.length,
    bossIdsUnique: bossById && Object.keys(bossById).length === bosses.length,
    everyZoneDetailed: zones.every((entry) => entry.hazards.length && entry.props.length && entry.topology && entry.lighting),
    everyBossDetailed: bosses.every((entry) => entry.phasePresentation.length >= 2 && entry.hazard && entry.grammar),
    everyBossHasSourceIdentity: bosses.every((entry) => entry.sourceIdentity),
    everyBossNonReflectable: bosses.every((entry) => entry.reflectable === false),
    everyAttackPiercesTerrain: zones.every((entry) => entry.attackTerrainPolicy === "pierce") && bosses.every((entry) => entry.attackTerrainPolicy === "pierce"),
    everyProjectilePersists: zones.every((entry) => entry.projectileRetirePolicy === "target-or-world-egress") && bosses.every((entry) => entry.projectileRetirePolicy === "target-or-world-egress"),
    allPass:
      zones.length === 64 &&
      zones.filter((entry) => entry.tier > 0).length === 56 &&
      zones.filter((entry) => entry.tempo === "rest").length - 1 === 6 &&
      bosses.length === 28 &&
      Object.keys(generatedAssets).length === 7 &&
      Object.keys(generatedAssetBindings.maps).length +
        Object.keys(generatedAssetBindings.actors).length === 7 &&
      sourceParts.size === 7 &&
      storyAttachmentZoneIds.length === 58 &&
      storyRangeSpecs[0]?.[1] === 1 &&
      storyRangeSpecs.at(-1)?.[2] === 1783 &&
      storyRangeSpecs.every(
        (entry, index) => index === 0 || storyRangeSpecs[index - 1][2] === entry[1],
      ) &&
      environmentKeys.size === 64 &&
      arenaRules.size === 28 &&
      bosses.every((entry) => entry.sourceIdentity),
  });

  window.__MONGSE_WORLD_V31217__ = Object.freeze({
    version: "3.12.17",
    source,
    sourceSha256,
    sourcePartCount: 7,
    sourceSectionCount: 51,
    storyAttachmentCount: 58,
    zoneCount: 64,
    combatZoneCount: 56,
    restZoneCount: 6,
    bossCount: 28,
    generatedAssetCount: 7,
    generatedAssetBindingCount: 7,
    exactZoneCoverage: 64,
    exactBossCoverage: 28,
    mapDetailCount: 64,
    bossDetailCount: 28,
    legacyCombatPreserved: true,
    zones,
    bosses,
    generatedAssets,
    generatedAssetBindings,
    zoneById,
    bossById,
    storyAttachmentZoneIds,
    storyRangeSpecs,
    probe,
  });
})();
