# R108 NARR — 사몽·사몽역행 서사 대조 및 몹 자산 명세 (읽기 전용 감사)

정본: `story-source/hapil-canon-r107-merged.txt (R107 merged canon, 3066 lines)`. 코드: `r96/client-source/samong-r103.js`(EP, 7-50행), `samong-maps-r105.js`(BP, 23-124행), `art-drive-r105.js`(ACTORS 18행, PLAN 31행). 기계판: `spec.json`.

## 0. 두 가지 코드 원인 (몹 담당자·리드용)

### 0-1. 빌린 몹이 하늘색 투사체를 던지는 이유 (소유자 피드백 S-01 미로)
When samong-r103.js spawn() borrows a donor through actor3(d,id,x,y,false,'DREAM',hostRegion), the actor's ai comes out 'hybrid' for every donor whose weapon profile is blade / heavy / caster / polearm, and 'melee' only for weapon 'claw' (plus the 5 native 'ranged' ids). Probe: 186 non-boss donors -> 160 hybrid, 21 melee, 5 ranged. 'hybrid' enemies call ranged3() -> enemyShot() -> makeShot(asset VFX.bolt) whenever clearLine(e,player): the light-blue bolt the owner saw. tickSurvival's swarm() (samong-r103.js:227) overwrites ai='melee', so survival is safe; tickMaze (:238) and the ascent guards (:239-240) do NOT, so melee-looking sprites throw bolts in the maze and on the climb.

**수정 제안**: samong-r103.js spawn() (line 207): after actor3, apply a per-row override, e.g. EP rows become ['dist00','a11-c1',{ai:'melee'}] or the row's donor profile .ai when it is 'melee'; set e.ai='melee', e.rangedWindup=0 so maze/ascent copies never shoot. Allowed throwers keep 'hybrid' but should get a projectile asset/tint per episode (fx-boss-r105.js PAL already keys colours by nativeId; add a mob entry so VFX.bolt is tinted with EP.tint[1] instead of light blue). This is a presentation-level fix: hit shapes and damage numbers are unchanged, only the melee/ranged decision for borrowed copies, which the lead must confirm as fair.

빌려도 근접을 유지하는 id(weapon 'claw'): `dist01-sp1`, `dist01-sp2`, `dist02-sp1`, `dist03-sp1`, `dist02-g1`, `dist03-g1`, `dist04-g1`, `b02-m1`, `b04-g1`, `b04-s1`, `b06-f1`, `b06-f2`, `b06b-f1`, `b07-f1`, `l304-e1`, `l304-e2`, `l304-e3`, `l302-e3`, `c101-e3`, `c105-e1`, `c103-e3`. 원래 원거리 id: `dist02-m1`, `dist05-m1`, `dist06-m1`, `u201-e1`, `u204-e3`.

현재 근접처럼 보이는 역할에 빌려 쓰이는 hybrid 투척자:

| id | 그림 | 쓰이는 곳 | 원 지역 ai | 빌렸을 때 ai |
|---|---|---|---|---|
| a11-c1 | episode1a/corrupted_guardian.webp (winged purple-sword skeletal knight) | S-01 mob, M guard | melee | hybrid |
| dist04-c1 | corrupted_guardian.webp | S-03 mob, S-03 guard | melee | hybrid |
| dist04-s1 | dist/skeleton.png | S-03 mob | melee | hybrid |
| l302-e1 | bulmyeongwi_b.webp (black mist) | S-01 mob | hybrid | hybrid |
| a08-s1 | corridor_scream_echo.webp -> drawn as drive mob-student.webp | S-02 mob | hybrid | hybrid |
| u204-e2 | u2_void_wraith.webp -> drawn as mob-student.webp in S-02 | S-02 mob, S-02 guard | hybrid | hybrid |
| a10-o1 | hallucinated_orderly.webp | S-04 mob, S-04 guard | hybrid | hybrid |
| murder04-e2 | murder/rooftop_echo.png -> drawn as mob-paper-figure.webp in RF | S-05 mob, RF mob, RF guard | hybrid | hybrid |
| u201-e2 | u2_cyborg_hound.webp | S-06 mob | hybrid | hybrid |
| b09-h1 | polar_cyborg_hound.webp | S-06 guard | hybrid | hybrid |
| h103-t1 | silverless_shadow.webp | S-07 mob, S-07 guard | hybrid | hybrid |
| h102-t1 | nameless_sword_trace.webp | S-07 mob | hybrid | hybrid |
| c106-e1 | superego_cyborg_cult_leader.webp (pink winged angel) | RA mob | hybrid | hybrid |
| murder04-e1 | murder/silent_alarm.png | RA mob, RA guard | hybrid | hybrid |
| kair-academy-wave-1 | kair/enemies/time-collector.png | RB mob | hybrid | hybrid |
| kair-guardian-01 | kair-guardians/guardian_01.webp | RB mob, M mob | melee | hybrid |
| b05-p1 | lust_heart_marionette.webp | S-01 guard, RC mob | hybrid | hybrid |
| b03-g1 | envy_glass_shard.webp | RC mob, RC guard | hybrid | hybrid |
| b03-g2 | envy_glass_shard.webp | RF mob | hybrid | hybrid |
| c102-e1 | black_robed_nightmare_demon.webp | RD mob, RD guard | hybrid | hybrid |
| c105-e2 | black_rose_demon_soldier.webp | RD mob | hybrid | hybrid |
| u202-e2 | u2_memory_orb.webp | RE mob, RE guard | hybrid | hybrid |
| c104-e1 | pride_cyborg_cult_leader.webp (white suit, spider legs) | RG mob, RG guard | hybrid | hybrid |
| c103-e1 | black_rose_chip_penitent.webp (kneeling chained man) | RG mob | hybrid | hybrid |
| u201-e3 | u2_resonance_knight.webp | M mob | hybrid | hybrid |

### 0-2. 두 몹 줄 중 하나만 나오는 버그
`samong-r103.js:225 (survival batch) and :238 (maze): ep.mobs[(S.serial+n)%ep.mobs.length]`

spawn() does ++S.serial once per spawn while the loop index n also rises by one, so (S.serial+n) keeps the same parity across a batch, and a 6-spawn batch leaves S.serial's parity unchanged: only ONE of the two mob rows ever appears in a run (observed test-aid: S-03 survival 56/56 dist04-c1, 0 skeleton; S-01 maze 18/18 a11-c1; S-04 only a10-o1; S-05 only b07-f1; S-06 only drones; RA only c106-e1).

**수정 제안**: index by a spawn counter that does not advance with n, e.g. ep.mobs[(x.spawnCount++)%ep.mobs.length], or ep.mobs[n%ep.mobs.length] per batch. Spawn counts and caps are unchanged (same number of enemies), only the row choice.

## 1. 판정표 (FITS 5, MISMATCH 21, PARTIAL 20)

| EP | 단계 | 판정 | 이유 |
|---|---|---|---|
| P | ascent | FITS | root-seraph boss = 검은 뿌리; key poses exist |
| S-01 | survival | MISMATCH | the text's 666 '잔영/형상' are shapes pressed flat under black roots; a purple-sword fallen-angel knight is chapter-1 demon-tree art and reads as a different world |
| S-01 | maze | MISMATCH | stalkers 'born behind you' should be faceless root-shades; a knight sprite that lobs cyan bolts contradicts both text and sprite |
| S-01 | ascent | PARTIAL | 봉합부인 art and teapot/gardener props fit; the guards are a lust-chapter marionette with a red heart and they cast bolts |
| S-02 | survival | PARTIAL | look is right (faceless student in dark uniform) but it is one static frame (no walk/hit/attack) and the donor is a caster that throws cyan bolts in maze/ascent |
| S-02 | maze | PARTIAL | same as survival; a maze stalker should be the student (melee) — good — but it currently casts |
| S-02 | ascent | FITS | patroller art and key projectiles match 1006/1010/2040 |
| S-03 | survival | MISMATCH | the text's fighters are humans in white dobok turning black; demon knights/skeletons belong to the castle chapter |
| S-03 | maze | MISMATCH | same actor problem; the alley should hold 조직원 silhouettes / dobok challengers |
| S-03 | ascent | MISMATCH | boss should be a faceless mechanism of black rings and chains, not a cyborg lord |
| S-04 | survival | PARTIAL | white humanoid is close but a hospital orderly with a syringe is chapter-1 art; the text's mob is a jointed mannequin with plate and spoon |
| S-04 | maze | PARTIAL | same |
| S-04 | ascent | PARTIAL | a man in a suit is right; the specific white-suit hotel chairman is another chapter's villain — acceptable if renamed (already named 강재헌) |
| S-05 | survival | MISMATCH | flaming wolves on a snowing street have no basis; the mob is named '찢긴 호외의 잔향' (torn newspaper remnants) |
| S-05 | maze | MISMATCH | same |
| S-05 | ascent | PARTIAL | seal-ring boss reads as '교주의 인장' acceptably; fire-beast guards are tolerable here only because the house burns — a burning uniformed figure fits better |
| S-06 | survival | FITS | machine legion = drones + cyborg hounds; the drone is a visible shooter so projectiles are legitimate (recolour bolt to teal 0x4b5866) |
| S-06 | maze | FITS | drones/gun barrels aiming match 1630 |
| S-06 | ascent | MISMATCH (boss) | reusing the story's Lucifer for 미명천사 confuses two beings; text gives a precise different design |
| S-07 | survival | PARTIAL | text has no swarm here except the hero's own shadow; hooded shades are an acceptable minimal reading of '여섯 물건의 그림자' but they cast cyan bolts |
| S-07 | maze | PARTIAL | as above |
| S-07 | ascent | MISMATCH | Persona must be 환도's double in 환도's clothes with a plain mask (keyed mask props already crack with boss hp) |
| RA | survival | MISMATCH | '붉은 교정 표시' are hundreds of insect-like red proofreading marks; a pink angel is the cult finale's art |
| RA | maze | MISMATCH | maze stalkers should be weightless patient-gown shapes with heavy name tags |
| RA | ascent | PARTIAL | patroller boss fits; guards wrong; outdoor family is 'ash' though the text keeps us on the snowfield |
| RB | survival | PARTIAL | time-themed hooded collector is an acceptable reading of '도착하지 못한 발자국', but the text's marching enemies are the Controller's fallen legion (u2 knights) |
| RB | maze | MISMATCH | kitchen guests in uniform + apron are specific |
| RB | ascent | PARTIAL | 총지배인 appears only in a mirror; the active antagonist of R-04 is the 백색의 손님 — keep GM (he is canon) but add the white guest as the climb's elite |
| RC | survival | PARTIAL | abstract crystal orbs for '관람석의 시선' are tolerable; the judged crowd should be the S-03 dobok challengers (white = innocent, black = guilty) |
| RC | maze | PARTIAL | paper blades flying are the text's attack |
| RC | ascent | MISMATCH | the judge wears 환도's face; and this ascent is R-06 whose antagonist is the 종이 왕 (paper king prop exists but is static) |
| RD | survival | MISMATCH | red-robed cult demons are the finale's art; the text's attackers are watching lotuses that spit eyelid shards and roots |
| RD | maze | MISMATCH | ward stalkers: sleepless villagers are victims, so use the eye-lotus and root only |
| RD | ascent | MISMATCH | the first trumpet is an unseen sound that becomes a sleeve-shaped horn; the pink angel is the cult boss |
| RE | survival | PARTIAL | drones as leftover war machines are plausible in a Neo-Seoul train, but the text's crowd is uniformed medal dolls |
| RE | maze | PARTIAL | as above |
| RE | ascent | MISMATCH | 백색 사수 is 기억사수's double in a white coat with a rifle |
| RF | survival | PARTIAL | look matches 2595 exactly; but one static frame and a caster donor (bolts) |
| RF | maze | PARTIAL | as above |
| RF | ascent | FITS (art) / PARTIAL (static) | storyteller art matches 2555; needs key poses |
| RG | survival | MISMATCH | white-suit spider cyborgs are the cult finale; '막힌 이름들' are names trapped in the trumpets |
| RG | maze | MISMATCH | as above |
| RG | ascent | MISMATCH | the seventh trumpet = a giant empty-sleeve horn with name tags, bound to the ring pillar |
| M | survival | PARTIAL | '성벽과 시곗바늘의 잔해' = clock guardians + steel legion + black roots; the mix is right but only the clock guardian ever spawns |
| M | maze | PARTIAL | as above |
| M | ascent | MISMATCH | 미카엘라 is the psychiatrist in a white coat (hero art exists: assets/heroes/normalized/directions/michaela-*.webp); Arvelia is another character. Text: the hero cuts the knot/barrier, not her |

## 2. 에피소드별 상세

### 0 · P 주인 없는 자장가 (host dist05, tint #2b2630/#4a3d4f)

보스: **코어 아래의 검은 뿌리** — 현재 `dist00/dist00-boss` → FITS

**ascent · 코어 아래의 뿌리길** — 판정 **FITS**: root-seraph boss = 검은 뿌리; key poses exist

- 원문: 「코어 아래로 검은 뿌리가 내려가 있었다」(930행) / 「뿌리를 무너뜨리자 그 아래 눌려 있던 형상들이 쏟아졌다」(932행)
- 장소·빛·날씨: beneath the core; black roots (underground) · none (core glow); text silent · text silent (underground)
- 현재 스폰: [dist00,dist00-boss] 뿌리의 문지기 / demon_tree_root_seraph.png + R104 key poses dist00-boss-p1..p4
- 몹 계획: [dist00,dist00-boss] → **keep** (no change)
- 맵 보정: keep indoor forge; darken wall cap toward 0x2b2630 and add a few root props (ash-tree/stump already in BP) — text silent on weather

### 1 · S-01 꿰맨 장미의 집 (host ep1b05, tint #3a2c30/#6b4b52)

> First worked example (owner feedback): the '해골 보라검 천사' is a11-c1 corrupted_guardian borrowed from dist00; in the maze its ai is 'hybrid' (see hybrid audit) so it throws VFX.bolt. Fix = (1) replace the actor with s01-root-shade, (2) force ai 'melee' for melee-looking borrowed copies, (3) parity bug makes it the only mob that ever appears.

보스: **봉합부인** — 현재 `ep1a11/mb-ep1a11 drawn as assets/r105/drive/boss-hostess.webp (static)` → FITS (art) / PARTIAL (no key poses)

**survival · 뿌리 밑동의 광장** — 판정 **MISMATCH**: the text's 666 '잔영/형상' are shapes pressed flat under black roots; a purple-sword fallen-angel knight is chapter-1 demon-tree art and reads as a different world

- 원문: 「뿌리를 무너뜨리자 그 아래 눌려 있던 형상들이 쏟아졌다」(932행) / 「육백예순여섯 번째 잔영을 쓰러뜨린 뒤에야 바닥에 문이」(932행)
- 장소·빛·날씨: plaza at the root stump below the core · none / text silent · text silent (underground)
- 현재 스폰: [dist00,a11-c1] 악마화 나무의 침식 근위 1 / corrupted_guardian.webp = winged skeletal knight with purple sword (R7 group V569a6e24f595); [last302,l302-e1] 포구 검은 안개 / bulmyeongwi_b.webp black mist, caster — parity bug: only a11-c1 appears (test-aid 24/24)
- 몹 계획: [dist00,a11-c1] → **GENERATE s01-root-shade** (replace, 새 몹 s01-root-shade, 공격 melee)
- 몹 계획: [last302,l302-e1] → **keep as 1-in-4 ranged minority only if its bolt is recoloured to the rose/black tint; otherwise replace with s01-root-shade** (augment, 공격 hybrid (visible mist caster, bolt tint 0x6b4b52))
- 맵 보정: survival ring: keep forge style but tint floor toward dark rose-brown 0x3a2c30, roots (stump/obelisk) ok / no weather (underground)

**maze · 빛이 닿는 만큼 생기는 복도** — 판정 **MISMATCH**: stalkers 'born behind you' should be faceless root-shades; a knight sprite that lobs cyan bolts contradicts both text and sprite

- 원문: 「손전등을 켜고 내려가자 빛이 닿는 만큼 복도가 생겨났다」(932행) / 「뒤에서는 새로운 발소리가 거듭 태어났다」(932행) / 「입이 꿰매진 인형, 젖은 출석부, 검게 물든 도복 조각」(936행)
- 장소·빛·날씨: corridors that exist only where the light falls; stairs with six objects at the end · flashlight only · text silent
- 현재 스폰: [dist00,a11-c1] same purple-sword knight, spawnAi=hybrid -> throws light-blue VFX.bolt (owner complaint); [last302,l302-e1] black mist caster — only a11-c1 (test-aid 18/18)
- 몹 계획: [dist00,a11-c1] → **GENERATE s01-root-shade (stalker variant: same sheet, slower, spawns behind the player)** (replace, 새 몹 s01-root-shade, 공격 melee)
- 몹 계획: [last302,l302-e1] → **drop from the maze (ranged attacks through flashlight darkness are unreadable)** (remove)
- 맵 보정: keep R107 flashlight; six-object stair markers already exist (objects list in BP) / corridor walls: forge -> domestic wall texture with rose-stitch tint 0x6b4b52 so it reads as the house's underside

**ascent · 찻잔 속의 집 · 정원과 긴 식탁** — 판정 **PARTIAL**: 봉합부인 art and teapot/gardener props fit; the guards are a lust-chapter marionette with a red heart and they cast bolts

- 원문: 「집은 찻잔 안에 들어 있었다」(947행) / 「둥근 벽을 따라 금이 간 꽃무늬가 이어졌고… 발밑의 흑백 타일은 따뜻했다」(949행) / 「정원사는 얼굴이 없는 인형이었다」(951행) / 「작은 구두를 신은 주민들이 양손을 무릎에 얹고 앉아 있었다」(953행) / 「옷에 장식처럼 달린 리본이 벽 속까지 이어져 있었다」(957행) / 「수백 개의 앞치마를 이어 만든 치마… 목 위에는… 장미 다발」(965행)
- 장소·빛·날씨: a house inside a teacup: round cracked floral walls, warm black-and-white tiles, garden, long table, teapot with the knot · warm interior, shadow of the cup handle across the sky · none (indoor)
- 현재 스폰: [ep1b05,b05-p1] guard: 얼굴 없는 남자의 박수 / lust_heart_marionette.webp (red heart marionette, caster); [ep1a11,mb-ep1a11] boss drawn as drive boss-hostess.webp (봉합부인) static; teapot 3-key prop; gardener prop
- 몹 계획: [ep1b05,b05-p1] guard → **GENERATE s01-ribbon-resident** (replace, 새 몹 s01-ribbon-resident, 공격 melee (slow grab; never throws))
- 몹 계획: boss mb-ep1a11 -> boss-hostess.webp → **keep art; GENERATE 4 key poses for 봉합부인 (scissors open / snip toward screen bottom / aprons flare / recover) so the static image animates** (augment, 새 몹 s01-hostess-keyposes)
- 맵 보정: floor: checkerboard black/white tile texture (BP style 'domestic' -> add r105 palette floor 0xe8e2d8/0x2a2224 checker if the lead has a tile asset; else tint) / walls: cracked floral porcelain (round) — reuse domestic wall with tint 0x6b4b52 / props: keep ferns (roses), workbench row as the long table, well=teapot stand, cabinet=반짇고리; add 2-3 small chairs (gothic-chair drive prop) along the table

스크린샷(test-aid): `S/shots/narr/ep01-S01-survival-baseline.jpg`, `S/shots/narr/ep01-S01-maze-purple-knight-hybrid.jpg`

### 2 · S-02 밤의 출석부 (host ep1a09, tint #283036/#46535a)

보스: **순찰자** — 현재 `ep1a08/mb-ep1a08 drawn as assets/r105/drive/boss-patroller.webp` → FITS

**survival · 자정 1분 전의 운동장** — 판정 **PARTIAL**: look is right (faceless student in dark uniform) but it is one static frame (no walk/hit/attack) and the donor is a caster that throws cyan bolts in maze/ascent

- 원문: 「학교 시계는 자정에서 일 분이 모자랐다」(1000행) / 「어둠 속에서 학생들이 일어섰다. 얼굴은 없었고, 교복 안에는 구겨진 확인서만」(1032행)
- 장소·빛·날씨: school yard / gate at 23:59 · night, fluorescent lights going out one by one (1032) · text silent; wet indoor shoes (1000) -> damp night
- 현재 스폰: [ep1a08,a08-s1] corridor_scream_echo -> drawn as drive mob-student.webp (static single image); [u204,u204-e2] void wraith -> also drawn as mob-student.webp (그림 교체: assets/r105/drive/mob-student.webp) — only a08-s1 row (parity)
- 몹 계획: [ep1a08,a08-s1] + [u204,u204-e2] → **GENERATE s02-faceless-student 2x2 sheet (reuse mob-student.webp as the design reference) and drive it as a 4-state actor** (augment, 새 몹 s02-faceless-student, 공격 melee (shove / paper slap))
- 맵 보정: outdoor stone + dead trees ok; night palette darker (floor 0x46535a is fine), add wet sheen if the weather worker has puddles / statue props -> keep; add 2 goal-post / gate obelisks near entry (text: 교문)

**maze · 자정 1분 전의 학교 복도** — 판정 **PARTIAL**: same as survival; a maze stalker should be the student (melee) — good — but it currently casts

- 원문: 「모퉁이에서 나온 순찰자의 그림자가 벽을 가득 메웠다. 불빛이 닿으면 그가 가까워졌고」(1006행) / 「모든 칠판에 내가 쓴 문장이 동시에 적히고」(1022행)
- 장소·빛·날씨: school corridors: 교무실, 음악실, 자료실, 보건실 · flashlight; patroller drawn to light · none (indoor)
- 현재 스폰: [ep1a08,a08-s1] student (static)
- 몹 계획: [ep1a08,a08-s1] → **s02-faceless-student sheet, melee** (augment, 새 몹 s02-faceless-student, 공격 melee)
- 맵 보정: clinical corridor ok; record markers already cover 교무실/음악실/자료실/보건실 / optional: chalk-line decals on walls (text 1022) if a decal path exists

**ascent · 방송실로 오르는 계단** — 판정 **FITS**: patroller art and key projectiles match 1006/1010/2040

- 원문: 「마지막 계단에 이르자 순찰자가 앞을 막았다」(1042행) / 「순찰자의 얼굴에 처음으로 금이 갔다」(1050행)
- 장소·빛·날씨: stairs to the broadcast room · dim · none
- 현재 스폰: [u204,u204-e2] guards drawn as student; [ep1a08,mb-ep1a08] boss drawn as drive boss-patroller.webp (flat face, keys); key fx fx-keys-*
- 몹 계획: boss → **keep; GENERATE 4 key poses for 순찰자 (key-ring swing) optional** (augment, 새 몹 s02-patroller-keyposes)
- 맵 보정: keep

스크린샷(test-aid): `S/shots/narr/ep02-S02-survival.jpg`

### 3 · S-03 흑과 백 — 끝나지 않는 시험 (host dist04, tint #2f2f2f/#6a6a6a)

보스: **검은 고리** — 현재 `cult06/c106-mid (final_pride_cyborg_lord)` → MISMATCH

**survival · 대련장과 관람석** — 판정 **MISMATCH**: the text's fighters are humans in white dobok turning black; demon knights/skeletons belong to the castle chapter

- 원문: 「문 너머에서 흰 도복들이 쓰러지고 있었다」(1073행) / 「어깨에서 시작된 검정이 가슴과 팔다리로 번졌다」(1075행) / 「기절한 도전자를 다시 일으켜 세우고, 멎은 싸움의 다음 동작을 재촉하는 장치」(1217행)
- 장소·빛·날씨: octagonal sparring hall with stands, healers at the edge · hall lights, 'more than half the ceiling lights out' (1171) · none (indoor); rain only in the 23-years-ago memory
- 현재 스폰: [dist04,dist04-c1] 되살아난 방패동료 / corrupted_guardian.webp winged purple knight; [dist04,dist04-s1] 이름 잃은 전우 / dist/skeleton.png — only dist04-c1 (test-aid 54-56/56)
- 몹 계획: [dist04,dist04-c1] → **GENERATE s03-dobok-challenger (variant A: chest black)** (replace, 새 몹 s03-dobok-challenger, 공격 melee (fist/kick))
- 몹 계획: [dist04,dist04-s1] → **GENERATE s03-dobok-challenger (variant B: nearly all black, dragged by a black ring at the neck)** (replace, 새 몹 s03-dobok-challenger-b, 공격 melee)
- 맵 보정: octagon ok; palette strictly black/white/grey (tint ok); statues -> referee stand; crates -> stacked mats; half the braziers unlit (text 1171)

**maze · 시험장 천막 뒤편 · 23년 전 빗속 골목** — 판정 **MISMATCH**: same actor problem; the alley should hold 조직원 silhouettes / dobok challengers

- 원문: 「초토화 작전이 벌어진 밤, 우리는 빗속에서 마주쳤다」(1189행) / 「내가 젖은 아스팔트 위에 한쪽 무릎을 꿇었을 때」(1191행)
- 장소·빛·날씨: behind the tents, then the rainy alley of 23 years ago · night, rain · RAIN (text explicit)
- 현재 스폰: [dist04,dist04-c1] purple knight, hybrid -> bolts
- 몹 계획: [dist04,dist04-c1] → **s03-dobok-challenger + optional s03-gang-silhouette** (replace, 새 몹 s03-dobok-challenger, 공격 melee)
- 맵 보정: weather: RAIN in this maze (currently none) — outdoor stone, no trees, wet paving / add a broken-glasses marker (text 1209) near the exit

**ascent · 검은 고리 장치가 있는 천막 뒤** — 판정 **MISMATCH**: boss should be a faceless mechanism of black rings and chains, not a cyborg lord

- 원문: 「천막 안쪽에 검은 고리가 숨어 있었다」(1217행) / 「환도의 칼날이 고리 사이로 들어갔다」(1225행)
- 장소·빛·날씨: behind the tent; a device of black rings · dim tent light · rain fading (1213)
- 현재 스폰: [dist04,dist04-c1] guards; [cult06,c106-mid] boss 기계재판 집행핵 / final_pride_cyborg_lord.webp (armoured cyborg lord, pink glow)
- 몹 계획: boss [cult06,c106-mid] → **GENERATE s03-black-ring-device (large, 4 key poses)** (replace, 새 몹 s03-black-ring-device, 공격 boss patterns ground/sky unchanged)
- 몹 계획: guards → **s03-dobok-challenger-b** (replace, 새 몹 s03-dobok-challenger-b, 공격 melee)
- 맵 보정: zigzag ascent ok; add tent-cloth banners if a cloth prop exists (text 천막) — else statues

스크린샷(test-aid): `S/shots/narr/ep03-S03-survival.jpg`, `S/shots/narr/ep03-S03-maze.jpg`

### 4 · S-04 감정의 탑 — 아직 따뜻한 배달 (host ep1b08, tint #2a2f3a/#515a6e)

보스: **강재헌** — 현재 `ep1b08/b08-boss` → PARTIAL (acceptable)

**survival · 감정의 탑 로비** — 판정 **PARTIAL**: white humanoid is close but a hospital orderly with a syringe is chapter-1 art; the text's mob is a jointed mannequin with plate and spoon

- 원문: 「비가 내리고 있었다」(1240행) / 「창문 없는 탑이 서 있었다. 열여섯 층짜리」(1240행) / 「규칙을 어기지 않는 마네킹들이 앉아 있었다. 그들은 빈 접시에 수저를 움직였고」(1254행)
- 장소·빛·날씨: windowless 16-storey tower lobby · indoor lamps · rain outside (1240); indoor
- 현재 스폰: [ep1a10,a10-o1] 오만의 흰 가면 / hallucinated_orderly.webp (white-masked orderly with syringe); [ep1b06,b06-f1] greed fox hound (그림 교체: drive mannequin-eating-1.webp static props placed) — only a10-o1 (parity)
- 몹 계획: [ep1a10,a10-o1] → **GENERATE s04-rule-mannequin (design ref: assets/r106/drive/mannequin-eating-1.webp)** (replace, 새 몹 s04-rule-mannequin, 공격 melee (plate/spoon swing))
- 몹 계획: [ep1b06,b06-f1] → **remove (fox hound has no textual basis)** (remove)
- 맵 보정: clinical lobby ok; add rain audio/ambience only at entry (indoor otherwise)

**maze · 열여섯 층의 복도** — 판정 **PARTIAL**: same

- 원문: 「지연이 지키는 식당에는… 마네킹들이」(1254행) / 「무너지는 복도를 누구보다 빠르게 달렸다」(1266행) / 「검은 빗물이 맑아졌다」(1272행)
- 장소·빛·날씨: floor-by-floor rooms (식당, 경비실, 서고, 갤러리, 기록실) · indoor · black rainwater on the 8th floor (1272)
- 현재 스폰: [ep1a10,a10-o1] orderly caster
- 몹 계획: [ep1a10,a10-o1] → **s04-rule-mannequin** (replace, 새 몹 s04-rule-mannequin, 공격 melee)
- 맵 보정: keep room markers; optional dark-water puddle decal in the 8층 room

**ascent · 13층에서 16층으로** — 판정 **PARTIAL**: a man in a suit is right; the specific white-suit hotel chairman is another chapter's villain — acceptable if renamed (already named 강재헌)

- 원문: 「13층에서 강재헌을 만났다」(1284행) / 「그는 내가 오래 들여다보던 결혼 사진 속 남자였다. 탑의 후원자」(1286행) / 「16층에는 열여섯 개의 의자가」(1308행)
- 장소·빛·날씨: 13F to 16F, sixteen chairs, mirror · indoor; 15F fire burning emotions (1298) · none
- 현재 스폰: [ep1a10,a10-o1] guards; [ep1b08,b08-boss] 백색 정장의 호텔 그룹 회장 / boss_pride_human + R104 key poses
- 몹 계획: boss → **keep (acceptable); optional recolour to a dark grey suit via tint if the renderer allows** (keep)
- 몹 계획: guards → **s04-rule-mannequin** (replace, 새 몹 s04-rule-mannequin, 공격 melee)
- 맵 보정: spiral ok; 16 crates = chairs (gothic-chair drive prop would read better); add a mirror prop (manet mirror) at the dais

스크린샷(test-aid): `S/shots/narr/ep04-S04-survival.jpg`, `S/shots/narr/ep04-S04-maze.jpg`

### 5 · S-05 경성의 밤 (host last302, tint #2c2a2a/#5e5552)

보스: **교주의 인장** — 현재 `ep1b01/mb-ep1b01 (gate72 pride echo)` → PARTIAL (acceptable)

**survival · 눈 내리는 돌길 사거리** — 판정 **MISMATCH**: flaming wolves on a snowing street have no basis; the mob is named '찢긴 호외의 잔향' (torn newspaper remnants)

- 원문: 「눈이 내리고 있었다」(1401행) / 「눈은 계속 내렸다」(1413행) / 「머리 위를 날리는 것은 눈이 아니라 잘게 찢긴 호외였다」(1465행) / 「술집에는 일본 장교들이 드나들었다」(1351행)
- 장소·빛·날씨: 1930s-40s 경성 stone crossroads outside the bar, tram lights · gas/tram lights, bar window · SNOW (explicit)
- 현재 스폰: [ep1b07,b07-f1] 불길 속의 늑대 / wrath_fire_beast.webp (flaming wolf); [murder04,murder04-e2] rooftop_echo — only b07-f1 (parity)
- 몹 계획: [ep1b07,b07-f1] → **GENERATE s05-newsprint-wraith** (replace, 새 몹 s05-newsprint-wraith, 공격 melee (paper-edge swipe))
- 몹 계획: [murder04,murder04-e2] → **GENERATE s05-officer-shade (Japanese-army junior officer silhouette, 1940s)** (replace, 새 몹 s05-officer-shade, 공격 melee (sabre))
- 맵 보정: snow family ok (R107); add falling snow (weather worker) and warm window glow from the bar; dead trees -> none (text: tram line, street lamps) keep braziers as lamps

**maze · 눈 내리는 골목** — 판정 **MISMATCH**: same

- 원문: 「구두굽 소리가 나면 달려갔다」(1411행) / 「그녀가 서 있던 자리의 발자국은 눈에 덮이고」(1415행)
- 장소·빛·날씨: snowy alleys near the office · dark, snow · SNOW
- 현재 스폰: [ep1b07,b07-f1] flaming wolf
- 몹 계획: [ep1b07,b07-f1] → **s05-officer-shade (stalker) + s05-newsprint-wraith** (replace, 새 몹 s05-officer-shade, 공격 melee)
- 맵 보정: snow + high walls ok; footprint decals fading (optional)

**ascent · 관사 · 불빛이 다시 켜지는 집** — 판정 **PARTIAL**: seal-ring boss reads as '교주의 인장' acceptably; fire-beast guards are tolerable here only because the house burns — a burning uniformed figure fits better

- 원문: 「그날 밤, 나는 일본군 관사에 불을 놓았다」(1445행) / 「관사 안에서 다시 불빛이 피어났다」(1467행) / 「나는 그 약속에 찍힌 교주의 인장을 지웠다」(1469행)
- 장소·빛·날씨: burnt officers' quarters, lights re-igniting · fire glow from windows (keyed window prop exists) · ash/paper flakes instead of snow (1465)
- 현재 스폰: [ep1b07,b07-f1] guards (fire wolves); [ep1b01,mb-ep1b01] 교만의 잔향·제72문 / gate72_pride_echo (seal rings) + R104 key poses
- 몹 계획: guards [ep1b07,b07-f1] → **GENERATE s05-burning-officer (or reuse b07-f1 as a 1-in-3 ember beast)** (replace, 새 몹 s05-burning-officer, 공격 melee)
- 몹 계획: boss → **keep** (keep)
- 맵 보정: straight ascent ok; switch flakes to grey ash/paper; window keyed prop stays

스크린샷(test-aid): `S/shots/narr/ep05-S05-survival.jpg`

### 6 · S-06 네오 서울 — 아직 오지 않은 종말 (host u201, tint #262c33/#4b5866)

보스: **미명천사** — 현재 `ep1a11/a11-boss (Lucifer)` → MISMATCH

**survival · 만조 요새의 끊어진 다리** — 판정 **FITS**: machine legion = drones + cyborg hounds; the drone is a visible shooter so projectiles are legitimate (recolour bolt to teal 0x4b5866)

- 원문: 「한강에는 물보다 많은 전선이 흘렀다. 교각을 타고 올라온 기계들」(1490행) / 「여의도 상공에는 뒤집힌 전함들이 떠 있었다. 전함의 탐조등이」(1490행) / 「뒤집힌 전함 아래로 포문들이 꽃처럼 벌어졌다」(1508행)
- 장소·빛·날씨: 2189 Seoul, broken bridge over black water, inverted warships above · searchlights sweeping, teal memory-bullet glow · rain (1523 '서울의 빗물'); black water
- 현재 스폰: [u201,u201-e1] 전쟁기억 정찰드론 / mdrone_idle.png (gun drone, native ranged); [u201,u201-e2] 폭격기억 사이보그 사냥개 / u2_cyborg_hound.webp — only drones (parity)
- 몹 계획: [u201,u201-e1]+[u201,u201-e2] → **keep both; fix parity so hounds appear** (keep, 공격 drone ranged / hound melee)
- 맵 보정: coast + sea water ok; add RAIN + searchlight sweeps (weather worker); braziers -> obelisk lamps; red warning ripple decal before volleys (text 1508) optional

**maze · 도시의 밑면 · 작은 방** — 판정 **FITS**: drones/gun barrels aiming match 1630

- 원문: 「방 안에서는 미래의 무기 냄새가 나지 않았다. 젖은 흙과 먼지」(1626행) / 「아이가 손으로 귀를 가리는 각도에 맞추어 모든 포신이 나를 겨누었다」(1630행)
- 장소·빛·날씨: underside of the city, hideout hospital, the child's small room with three calendars · flashlight; flashes through the window · indoor; wet earth
- 현재 스폰: [u201,u201-e1] drones
- 몹 계획: rows → **keep; add s06-delay-warden as rare elite (optional)** (augment, 새 몹 s06-delay-warden, 공격 melee (clock-hand blade))
- 맵 보정: forge ok; the small-room marker exists (workbench/cabinets)

**ascent · 통제실 · 열일곱 개의 고리** — 판정 **MISMATCH (boss)**: reusing the story's Lucifer for 미명천사 confuses two beings; text gives a precise different design

- 원문: 「그녀의 등 뒤로 열일곱 개의 고리가 돌고 있었다」(1601행) / 「한쪽 날개에는 서울의 창문들이, 다른 쪽에는 바다 위의 가로등들이 달려 있었다… 얼굴이 있어야 할 자리에는 잠든 사람의 눈꺼풀」(1741행) / 「두 번째 날갯짓에 달이 갈라졌다… 거대한 눈」(1749행)
- 장소·빛·날씨: control room above the city; seventeen rotating rings · suspended raindrops reflecting cities (1595); split moon eye · rain stopped, drops hanging in the air (1593-1595)
- 현재 스폰: [ep1b09,b09-h1] guard 강철 턱의 사이보그 개 / polar_cyborg_hound; [ep1a11,a11-boss] 루시퍼 · 가면 벗은 초천사 / lucifer_unmasked + R104 lucifer key poses
- 몹 계획: boss [ep1a11,a11-boss] → **GENERATE s06-dawn-angel (4 key poses)** (replace, 새 몹 s06-dawn-angel)
- 몹 계획: guards → **keep hounds** (keep, 공격 melee)
- 맵 보정: spiral ok; weather: suspended droplets (particles that do not fall) + searchlight; 17 ring obelisks already in BP

스크린샷(test-aid): `S/shots/narr/ep06-S06-survival.jpg`

### 7 · S-07 페르소나 — 내 얼굴을 쓴 자 (host cult03, tint #2d2430/#5c4a63)

보스: **페르소나** — 현재 `hando03/h103-boss` → MISMATCH

**survival · 손님 자리 하나뿐인 식탁** — 판정 **PARTIAL**: text has no swarm here except the hero's own shadow; hooded shades are an acceptable minimal reading of '여섯 물건의 그림자' but they cast cyan bolts

- 원문: 「식탁이 놓여 있었다… 손님 자리가 하나뿐이었다」(1846행) / 「그는 내 옷을 입고 내 칼을 옆에 놓은 채」(1848행) / 「탁자 위에 여섯 물건이 놓여 있었다」(1854행)
- 장소·빛·날씨: a table with one guest seat; six objects · dim domestic · none
- 현재 스폰: [hando03,h103-t1] 백은 없는 그림자 / silverless_shadow.webp (hooded shade with lantern); [hando02,h102-t1] 무명 검흔 (그림 교체: drive prop-table + six objects + keyed mask) — only h103-t1 (parity)
- 몹 계획: [hando03,h103-t1] → **keep as melee shade (force ai melee) or GENERATE s07-object-shadow (six silhouettes: doll/ledger/dobok/receipt/glass/casing shadows)** (augment, 새 몹 s07-object-shadow, 공격 melee)
- 몹 계획: [hando02,h102-t1] → **remove (grey robed judge with scales has no basis)** (remove)
- 맵 보정: domestic ring ok; one candle light at the table; purple tint fine

**maze · 식탁 뒤의 복도** — 판정 **PARTIAL**: as above

- 원문: 「가면이 갈라지자 아래에서 더 깨끗한 가면이 드러났다」(1872행)
- 장소·빛·날씨: corridor behind the table · flashlight · none
- 현재 스폰: [hando03,h103-t1] shade
- 몹 계획: [hando03,h103-t1] → **melee shade** (augment, 공격 melee)
- 맵 보정: keep

**ascent · 거울상 앞의 단** — 판정 **MISMATCH**: Persona must be 환도's double in 환도's clothes with a plain mask (keyed mask props already crack with boss hp)

- 원문: 「나는 페르소나를 베었다」(1870행) / 「페르소나는 내 얼굴로 울고 있었다」(1888행) / 「그때 EGO가 각성했다」(1898행)
- 장소·빛·날씨: dais before the mirror image · dim · none
- 현재 스폰: [hando03,h103-boss] EGO 강탈 악몽왕 / hando_idle (skeletal spider-limbed king) + R104 key poses
- 몹 계획: boss [hando03,h103-boss] → **GENERATE s07-persona-hwando (4 key poses; base on assets/heroes/normalized/hwando directions)** (replace, 새 몹 s07-persona-hwando)
- 맵 보정: straight ok; mirror statue -> manet-mirror prop; keep keyed mask on table

스크린샷(test-aid): `S/shots/narr/ep07-S07-survival.jpg`

### 8 · RA 어제가 도착하는 미술관 (host ep1a10, tint #26302c/#4d6158)

보스: **순찰자** — 현재 `murder02/mb-murder02 drawn as boss-patroller.webp` → FITS

**survival · 어제가 도착하는 승강장** — 판정 **MISMATCH**: '붉은 교정 표시' are hundreds of insect-like red proofreading marks; a pink angel is the cult finale's art

- 원문: 「승강장에는 이미 내린 사람들의 젖은 발자국이 남아 있었다」(1918행) / 「철로가 물감으로 그려져 있었다… 아직 마르지 않은 청록색 선」(1934행) / 「깨진 종 안에서 붉은 교정 표시들이 벌레처럼 기어 나왔다. 수백 개의 표시」(1956행)
- 장소·빛·날씨: station platform / gallery, teal painted rails, blind painter 도겸 · gallery light · wet footprints; indoor
- 현재 스폰: [cult06,c106-e1] SUPER EGO 판결인장 / superego_cyborg_cult_leader.webp (pink glowing winged angel); [murder04,murder04-e1] 공실 표기 잔재 / silent_alarm.png (그림 교체: teal-rail + gogh chair + sunflower gurney props) — only c106-e1 (parity)
- 몹 계획: [cult06,c106-e1] → **GENERATE ra-proofmark-bug (small swarm)** (replace, 새 몹 ra-proofmark-bug, 공격 melee (bite))
- 몹 계획: [murder04,murder04-e1] → **remove** (remove)
- 맵 보정: clinical platform ok; floor tint toward gallery grey-green; obelisks = platform pillars fine

**maze · 검은 태양 아래 설원 · 침대 고랑** — 판정 **MISMATCH**: maze stalkers should be weightless patient-gown shapes with heavy name tags

- 원문: 「검은 태양 아래에 학교가 서 있었다」(2024행) / 「눈밭에는 병원의 침대가 밭이랑처럼 늘어서 있었다. 침상마다… 해바라기」(2026행) / 「환자복을 입힌 형상들은… 흰 천 아래의 몸은 점점 가벼워졌고, 명찰만 무거워졌다」(2034행) / 「열쇠들이 눈발을 가르며 날아왔다」(2040행)
- 장소·빛·날씨: snowfield under a black sun, rows of hospital beds with sunflowers · black sun, stars turning in windows · SNOW (눈발 2040)
- 현재 스폰: [cult06,c106-e1] pink angel
- 몹 계획: [cult06,c106-e1] → **GENERATE ra-nameless-patient** (replace, 새 몹 ra-nameless-patient, 공격 melee (grab))
- 맵 보정: snow family + dead trees + empty beds ok; add snowfall and a black-sun sky disc (weather/sky worker); sunflower gurney prop exists — place 3-4 more

**ascent · 학교와 병원 사이의 이송로** — 판정 **PARTIAL**: patroller boss fits; guards wrong; outdoor family is 'ash' though the text keeps us on the snowfield

- 원문: 「나는 순찰자의 길을 막았다」(2040행) / 「검은 태양의 가장자리에서 작은 금이 났다. 그 틈으로 노란 물감이」(2072행)
- 장소·빛·날씨: transfer road between school and hospital across the snowfield · black sun with yellow crack · SNOW
- 현재 스폰: [murder04,murder04-e1] guards silent_alarm; [murder02,mb-murder02] boss drawn as boss-patroller.webp
- 몹 계획: guards → **ra-nameless-patient** (replace, 새 몹 ra-nameless-patient, 공격 melee)
- 몹 계획: boss → **keep** (keep)
- 맵 보정: BP RA.ascent.outdoor.family 'ash' -> 'snow' (samong-maps-r105.js RA ascent); snowfall; yellow crack glow near the dais

스크린샷(test-aid): `S/shots/narr/ep08-RA-survival.jpg`

### 9 · RB 두 개의 의자와 세 잔의 물 (host ep1b06, tint #30292a/#6a5552)

보스: **총지배인** — 현재 `ep1b06/b06-boss` → PARTIAL (canon character; acceptable)

**survival · 대기실 · 두 의자와 세 잔** — 판정 **PARTIAL**: time-themed hooded collector is an acceptable reading of '도착하지 못한 발자국', but the text's marching enemies are the Controller's fallen legion (u2 knights)

- 원문: 「초침은 철로에 매달린 혀가 되었고, 분침 끝에서는 사람의 발자국이 떨어졌다」(2083행) / 「다른 컵을 건드리자 통제자의 군단이 성벽 밖을 행진했다… 이미 쓰러진 방어의 형상들」(2089행)
- 장소·빛·날씨: waiting room with two chairs and three cups, melted clock · dim · none
- 현재 스폰: [kair01,kair-academy-wave-1] 최초명령 훈련파동 1 / time-collector.png (hooded man, lantern, sickle); [kair04,kair-guardian-01] 시간수문장 01 / guardian_01.webp — only kair-academy-wave-1 (parity)
- 몹 계획: [kair04,kair-guardian-01] → **swap to [u202,u202-e3] 감옥 공명기사 (u2_suppression_knight) or [u201,u201-e3] 참호 공명기사 — melee override required** (replace, 공격 melee)
- 몹 계획: [kair01,kair-academy-wave-1] → **keep (visible caster; tint bolt 0x6a5552)** (keep, 공격 hybrid ok)
- 맵 보정: domestic square ok; three cups = well props; two chairs (gothic-chair drive prop) at centre; melted-clock decal optional

**maze · 녹아내린 승강장 · 호텔 주방** — 판정 **MISMATCH**: kitchen guests in uniform + apron are specific

- 원문: 「손님들은 군복 위에 식사용 앞치마를 두르고 있었다」(2146행) / 「총주방장이 쓰던 칼이 천장에서 떨어졌다」(2148행) / 「잔 위에 쌓인 눈은 이미 불타고 있었다」(2139행)
- 장소·빛·날씨: outside 경성 bar, inside the hotel kitchen · kitchen fire, burning snow · burning snowflakes (embers)
- 현재 스폰: [kair01,kair-academy-wave-1] time collector
- 몹 계획: [kair01,kair-academy-wave-1] → **GENERATE rb-apron-officer** (replace, 새 몹 rb-apron-officer, 공격 melee (plate / cleaver))
- 맵 보정: workbench = kitchen counters ok; ember particles (orange) instead of snow; add falling-knife hazard decal optional

**ascent · 호텔 계단 · 7층 방화문** — 판정 **PARTIAL**: 총지배인 appears only in a mirror; the active antagonist of R-04 is the 백색의 손님 — keep GM (he is canon) but add the white guest as the climb's elite

- 원문: 「식탁 끝에서 백색의 손님이 일어났다. 얼굴 대신 특진을 알리는 신문이 붙어 있었다」(2180행) / 「다른 거울에서는 총지배인이 서윤의 등을 붙들었고」(2176행)
- 장소·빛·날씨: hotel stairs, 7F fire door, mirrors · fire behind the door · none
- 현재 스폰: [ep1b06,b06-f1] guards greed fox hound; [ep1b06,b06-boss] 총지배인 · 맘몬 / boss_greed_human + R104 key poses
- 몹 계획: guards [ep1b06,b06-f1] → **GENERATE rb-white-guest as elite guard + rb-apron-officer** (replace, 새 몹 rb-white-guest, 공격 melee (medal volley optional, visible thrower))
- 몹 계획: boss → **keep** (keep)
- 맵 보정: spiral ok; fire-door glow at the top landing; mirror props (manet) x2

스크린샷(test-aid): `S/shots/narr/ep09-RB-survival.jpg`

### 10 · RC 흑백의 청색재판 (host ep1b03, tint #262a33/#51586b)

보스: **재판관** — 현재 `ep1b03/mb-ep1b03` → MISMATCH

**survival · 여섯 번 접힌 대련장** — 판정 **PARTIAL**: abstract crystal orbs for '관람석의 시선' are tolerable; the judged crowd should be the S-03 dobok challengers (white = innocent, black = guilty)

- 원문: 「대련장은 여섯 방향으로 접혀 있었다」(2201행) / 「흰옷을 입은 사람들은… 무죄였다. 옷이 검게 물든 사람들은… 유죄였다」(2205행) / 「푸른 빛이 공간의 틈을 채웠다」(2209행)
- 장소·빛·날씨: the sparring hall folded six ways; verdict papers growing · blue light in the seams · none (rain enters in the maze)
- 현재 스폰: [ep1b03,b03-g1] 찢어진 사진의 망령 / envy_glass_shard.webp (spiky crystal orb); [ep1b05,b05-p1] heart marionette (그림 교체: picasso paper + paper-king props) — only b03-g1 (parity)
- 몹 계획: [ep1b03,b03-g1] → **keep as the 'gaze' (visible caster, tint bolt blue 0x51586b)** (keep, 공격 hybrid ok)
- 몹 계획: [ep1b05,b05-p1] → **s03-dobok-challenger A/B (reuse)** (replace, 새 몹 s03-dobok-challenger, 공격 melee)
- 맵 보정: octagon ok; blue tint stronger (text 청색); statues = fold lines fine

**maze · 접히는 재판정** — 판정 **PARTIAL**: paper blades flying are the text's attack

- 원문: 「스물세 해 전의 비가 대련장으로 들어왔다」(2227행) / 「나는 한시우가 보지 못하는 왼쪽으로 날아드는 종이칼을 막았다」(2241행)
- 장소·빛·날씨: folding courtroom · blue · RAIN (text explicit, inside the hall)
- 현재 스폰: [ep1b03,b03-g1] crystal orb
- 몹 계획: [ep1b03,b03-g1] → **GENERATE rc-verdict-paperblade (ranged, visible paper-dart projectile) — or keep orb** (augment, 새 몹 rc-verdict-paperblade, 공격 ranged with its own projectile sprite)
- 맵 보정: RAIN indoors (weather worker: allow indoor rain flag for this stage)

**ascent · 지하에 매달린 꼭대기 층** — 판정 **MISMATCH**: the judge wears 환도's face; and this ascent is R-06 whose antagonist is the 종이 왕 (paper king prop exists but is static)

- 원문: 「재판관이 몸을 일으켰다. 그 얼굴은 나를 닮아 있었다」(2235행) / 「금고 안쪽에서 종이 왕이 일어났다. 왕관에는 능력의 이름들이」(2294행) / 「밀랍 속에는 박수를 치다 멈춘 손들이 갇혀 있었다」(2262행)
- 장소·빛·날씨: the tower's top floor hanging underground; wax chandeliers; sixteen gilded chairs; Mammon's vault · candle wax, gold leaf · none
- 현재 스폰: [ep1b03,b03-g1] guards; [ep1b03,mb-ep1b03] 재판관 / cracked_comparison_echo (cracked crystal woman) + R104 key poses
- 몹 계획: boss [ep1b03,mb-ep1b03] → **GENERATE rc-judge-mirrorface (4 key poses, gavel = hammer-1/2 drive prop) OR move the judge to the maze record and make rc-paper-king the ascent boss** (replace, 새 몹 rc-judge-mirrorface)
- 몹 계획: guards → **s03-dobok-challenger-b** (replace, 새 몹 s03-dobok-challenger-b, 공격 melee)
- 맵 보정: forge spiral -> gold/wax palette (tint 0x6b5a3a cap); 16 crates -> gilded chairs; chandelier braziers; paper-king prop near the vault obelisk (exists)

스크린샷(test-aid): `S/shots/narr/ep10-RC-survival.jpg`

### 11 · RD 첫 번째 나팔 — 서로의 결말을 먹는 도시 (host cult02, tint #2a2a35/#55556e)

보스: **첫 번째 나팔** — 현재 `cult02/c102-boss` → MISMATCH

**survival · 늪의 다리 · 붉은 교각** — 판정 **MISMATCH**: red-robed cult demons are the finale's art; the text's attackers are watching lotuses that spit eyelid shards and roots

- 원문: 「늪 위에 다리가 놓여 있었다. 처음 발을 디뎠을 때에는 붉은 교각이었지만」(2317행) / 「난간에 매달린 수련은 속에서부터 빛을 냈다」(2319행) / 「감시의 연꽃들이 일제히 벌어졌다. 꽃 속에서 눈꺼풀 모양의 창들이 쏟아졌다」(2355행) / 「다리 밑에서 뿌리가 솟았다」(2361행)
- 장소·빛·날씨: red bridge over the swamp, glowing lotuses, sleepless village · lotus glow from within; night · swamp water; text silent on rain
- 현재 스폰: [cult02,c102-e1] 신경 케이블 포식체 / black_robed_nightmare_demon.webp (red-robed demon mage); [cult05,c105-e2] black rose demon soldier (그림 교체: lotus props (static)) — only c102-e1 (parity); test-aid showed 0 enemies alive at capture time (spawn ring found no floor on the narrow bridge for a few seconds)
- 몹 계획: [cult02,c102-e1] → **GENERATE rd-watch-lotus (ranged, visible petal-shard projectile)** (replace, 새 몹 rd-watch-lotus, 공격 ranged (own projectile sprite))
- 몹 계획: [cult05,c105-e2] → **GENERATE rd-swamp-root (melee, rises from the water edge)** (replace, 새 몹 rd-swamp-root, 공격 melee)
- 맵 보정: swamp + water ok; bridge railing tint red (0x6a2f2f) for the 붉은 교각; lotus glow lights (point lights or sprite glow) — weather: mist over water

**maze · 수련 아래의 불면병동** — 판정 **MISMATCH**: ward stalkers: sleepless villagers are victims, so use the eye-lotus and root only

- 원문: 「물 아래의 학교 보건실이 드러났다」(2365행) / 「책상에는 여섯 권의 책이 놓여 있었다」(2384행)
- 장소·빛·날씨: sleepless ward under the lilies, then the locked classroom · flashlight; water light · wet
- 현재 스폰: [cult02,c102-e1] demon mage
- 몹 계획: [cult02,c102-e1] → **rd-watch-lotus (stationary turret variant) + rd-swamp-root** (replace, 새 몹 rd-watch-lotus, 공격 ranged/melee)
- 맵 보정: clinical ok; wet-floor sheen; lotus props along the path

**ascent · 일곱 기둥의 대성당** — 판정 **MISMATCH**: the first trumpet is an unseen sound that becomes a sleeve-shaped horn; the pink angel is the cult boss

- 원문: 「하늘에서 나팔 소리가 났다. 악기는 보이지 않았다」(2443행) / 「발록의 일곱 기둥이 솟아올라 열여섯 층을 떠받쳤다. 기둥마다 서른한 개의 이름표」(2467행) / 「제단 위에는 신의 형상 대신 빈 원고지가」(2469행)
- 장소·빛·날씨: cathedral-like gallery with seven pillars, blank manuscript altar · high windows · none
- 현재 스폰: [cult02,c102-e1] guards; [cult02,c102-boss] 네트워크 합창체 / superego cyborg cult leader (pink winged angel)
- 몹 계획: boss [cult02,c102-boss] → **GENERATE rd-first-trumpet (4 key poses; design from assets/r106/drive/trumpet.webp)** (replace, 새 몹 rd-first-trumpet)
- 몹 계획: guards → **rd-swamp-root** (replace, 새 몹 rd-swamp-root, 공격 melee)
- 맵 보정: straight forge ok; 7 obelisks = pillars exist; altar cabinet -> blank paper on a table (table-drawing prop)

스크린샷(test-aid): `S/shots/narr/ep11-RD-survival.jpg`

### 12 · RE 네 번째 나팔 — 백색 사수의 승전식 (host u202, tint #2e3236/#6a737b)

보스: **백색 사수** — 현재 `u201/u201-mid` → MISMATCH

**survival · 천장을 뚫고 온 열차** — 판정 **PARTIAL**: drones as leftover war machines are plausible in a Neo-Seoul train, but the text's crowd is uniformed medal dolls

- 원문: 「열차가 천장을 뚫고 들어왔다. 객차마다 다른 밤이 실려 있었다」(2492행) / 「그는 흰 외투를 입고 플랫폼 위에 서 있었다… 승리한 날짜만 금실로」(2498행) / 「제복을 입은 인형들이 훈장을 꺼냈다」(2510행)
- 장소·빛·날씨: train through the ceiling; platform; victory ceremony · chandeliers (2532) · none; wet hotel stairs in a carriage
- 현재 스폰: [u201,u201-e1] drone; [u202,u202-e2] 복종 봉인구 / u2_memory_orb — only drones (parity)
- 몹 계획: [u202,u202-e2] → **GENERATE re-medal-doll** (replace, 새 몹 re-medal-doll, 공격 melee (medal pin jab))
- 몹 계획: [u201,u201-e1] → **keep drones as 1-in-3 ranged** (keep, 공격 ranged)
- 맵 보정: platform ok; chandelier light props at the ceiling line; crates = luggage ok; statues = medal dolls (static) fine

**maze · 관람석이 붙은 탈출로** — 판정 **PARTIAL**: as above

- 원문: 「빠른 사람은 느린 사람에게 걸음을 맞췄다」(2526행) / 「천장에는 관람석이 붙어 있었다」(2530행)
- 장소·빛·날씨: escape route with stands on the ceiling · chandelier · none
- 현재 스폰: [u201,u201-e1] drones
- 몹 계획: rows → **re-medal-doll + drones** (augment, 새 몹 re-medal-doll, 공격 melee)
- 맵 보정: keep

**ascent · 마지막 객차 · 두 사람의 의자** — 판정 **MISMATCH**: 백색 사수 is 기억사수's double in a white coat with a rifle

- 원문: 「조준경 안에서 나와 같은 얼굴을 한 사수가 먼저 방아쇠를 당겼다」(2498행) / 「나는 샹들리에를 쏘았다」(2532행) / 「빈 외투가 바닥으로 무너졌다」(2538행)
- 장소·빛·날씨: last carriage, bench with two unpainted faces, house plan · chandelier falls -> shadow · none
- 현재 스폰: [u202,u202-e2] guards memory orb; [u201,u201-mid] 제4단계 전쟁관리자 / u2_suppression_knight (dark armoured knight) + R104 key poses
- 몹 계획: boss [u201,u201-mid] → **GENERATE re-white-marksman (4 key poses; base on assets/heroes/normalized/gunner)** (replace, 새 몹 re-white-marksman)
- 몹 계획: guards → **re-medal-doll** (replace, 새 몹 re-medal-doll, 공격 melee)
- 맵 보정: straight ok; bench + table-drawing prop at the dais; chandelier prop that darkens after boss hp<50% (keyed like window)

스크린샷(test-aid): `S/shots/narr/ep12-RE-survival.jpg`

### 13 · RF 다섯 번째 나팔 — 선생님의 빈 얼굴 (host cult05, tint #2d2a26/#655d50)

보스: **스토리텔러** — 현재 `cult03/c103-boss drawn as boss-storyteller.webp` → FITS (art), no key poses

**survival · 표지가 쌓인 미술관 홀** — 판정 **PARTIAL**: look matches 2595 exactly; but one static frame and a caster donor (bolts)

- 원문: 「팔을 지탱한 몸에는 표지가 겹겹이 매달려 있었고, 얼굴이 있어야 할 자리에서는 종이 한 장이 펄럭였다」(2555행) / 「글자마다 낚싯바늘이 달려 있었다」(2569행) / 「이름을 끝까지 쓰지 못한 아이들이 쏟아졌다. 머리와 팔이 따로 움직이는 종이 형상들이었다」(2595행)
- 장소·빛·날씨: gallery hall stacked with book covers · lamp light · none
- 현재 스폰: [murder04,murder04-e2] rooftop_echo -> drawn as drive mob-paper-figure.webp (static); [ep1b03,b03-g2] glass shard -> also drawn as paper figure (그림 교체: assets/r105/drive/mob-paper-figure.webp) — only murder04-e2 (parity)
- 몹 계획: [murder04,murder04-e2]+[ep1b03,b03-g2] → **GENERATE rf-paper-child 2x2 sheet (design = mob-paper-figure.webp) with detached head/arm offsets in HIT** (augment, 새 몹 rf-paper-child, 공격 melee (paper-edge cut, 2596))
- 맵 보정: domestic square ok; cabinets = book stacks ok; gothic chairs/walls exist

**maze · 책의 등 안쪽** — 판정 **PARTIAL**: as above

- 원문: 「그때 다섯 번째 나팔이 울렸다. 책등이 입처럼 벌어지며」(2595행)
- 장소·빛·날씨: inside the book spine · dim · none
- 현재 스폰: [murder04,murder04-e2] paper figure
- 몹 계획: row → **rf-paper-child** (augment, 새 몹 rf-paper-child, 공격 melee)
- 맵 보정: keep; gothic-wall props

**ascent · 작은 탁자가 있는 자리** — 판정 **FITS (art) / PARTIAL (static)**: storyteller art matches 2555; needs key poses

- 원문: 「스토리텔러는 그렇게 자기 얼굴을 만들고 있었다」(2561행) / 「도겸이 바닥에 앉았다. 작은 식탁 그림을 두 무릎 위에」(2601행)
- 장소·빛·날씨: the small table · lamp · none
- 현재 스폰: [murder04,murder04-e2] guards; [cult03,c103-boss] 이단의목사 백이온 -> drawn as drive boss-storyteller.webp (book-spine body) static
- 몹 계획: boss → **keep art; GENERATE rf-storyteller-keyposes (needle rain / page-face)** (augment, 새 몹 rf-storyteller-keyposes)
- 몹 계획: guards → **rf-paper-child** (augment, 새 몹 rf-paper-child, 공격 melee)
- 맵 보정: spiral ok; table-drawing prop exists; add 'chair with cushion' trap marker (2591) optional

스크린샷(test-aid): `S/shots/narr/ep13-RF-survival.jpg`

### 14 · RG 일곱 번째 나팔 — 여백의 전쟁 (host cult06, tint #2a2430/#5a4a66)

보스: **일곱 번째 나팔** — 현재 `cult04/c104-mid` → MISMATCH

**survival · 무너진 미술관 벽 · 일곱 기둥** — 판정 **MISMATCH**: white-suit spider cyborgs are the cult finale; '막힌 이름들' are names trapped in the trumpets

- 원문: 「거미동굴의 뼈가 철로를 받쳤고, 경성의 전깃줄에는 카이로의 초침이 매달렸다. 검은 태양 아래에서는 장미로 이루어진 건물들」(2661행) / 「하늘에는 일곱 개의 나팔이 떠 있었다. 나팔의 몸통은 빈 소매를 닮았다」(2663행) / 「스토리텔러의 바늘들이 흰 여백을 향해 떨어졌다」(2669행)
- 장소·빛·날씨: collapsed gallery wall; overlapping worlds under a black sun; seven trumpets in the sky · black sun · falling needles / paper; text silent on rain
- 현재 스폰: [cult04,c104-e1] 소환좌 칩 수호체 / pride_cyborg_cult_leader.webp (white suit, spider legs, pink); [cult03,c103-e1] EGO 구속 연결자 (kneeling chained man) (그림 교체: trumpet + link-pillar props) — only c104-e1 (parity)
- 몹 계획: [cult04,c104-e1] → **GENERATE rg-blocked-name** (replace, 새 몹 rg-blocked-name, 공격 melee)
- 몹 계획: [cult03,c103-e1] → **ra-proofmark-bug swarm (reuse) ** (replace, 새 몹 ra-proofmark-bug, 공격 melee)
- 맵 보정: ash field + dead trees ok; black-sun sky; falling paper/needle flakes; trumpet props exist (3) — hang 7 if the sky layer allows

**maze · 여백의 전쟁터** — 판정 **MISMATCH**: as above

- 원문: 「거미줄 같은 선들이 장부와 문, 잔과 도복을 한데 묶고 있었다」(2675행)
- 장소·빛·날씨: the white margin battlefield · black sun · paper flakes
- 현재 스폰: [cult04,c104-e1] spider cyborg
- 몹 계획: row → **rg-blocked-name + ra-proofmark-bug** (replace, 새 몹 rg-blocked-name, 공격 melee)
- 맵 보정: ash ok; thread-door prop exists; whiten the floor tint toward 0x8a8488 (여백)

**ascent · 회전 고리가 있는 기둥** — 판정 **MISMATCH**: the seventh trumpet = a giant empty-sleeve horn with name tags, bound to the ring pillar

- 원문: 「탄환이 기둥의 회전 고리를 멈춰 세웠다」(2675행) / 「일곱 번째 나팔은 끝까지 울리지 못했다」(2715행) / 「스토리텔러의 얼굴에서 종이가 떨어졌다」(2717행)
- 장소·빛·날씨: pillar with rotating rings · forge · none
- 현재 스폰: [cult04,c104-e1] guards; [cult04,c104-mid] 적그리스도 배양좌 / six_legged_cyborg_lord_final.webp (white suit cyborg)
- 몹 계획: boss [cult04,c104-mid] → **GENERATE rg-seventh-trumpet (4 key poses)** (replace, 새 몹 rg-seventh-trumpet)
- 몹 계획: guards → **rg-blocked-name** (replace, 새 몹 rg-blocked-name, 공격 melee)
- 맵 보정: straight forge ok; link-pillar prop at the dais (exists) + rotating ring fx (fx-boss worker)

스크린샷(test-aid): `S/shots/narr/ep14-RG-survival.jpg`

### 15 · M 마지막에 남은 사람 (host kair05, tint #2c2c30/#67646e)

보스: **미카엘라** — 현재 `kair02/kair-great-03 (Arvelia)` → MISMATCH

**survival · 궁전 정원 · 쓰러진 악마 나무** — 판정 **PARTIAL**: '성벽과 시곗바늘의 잔해' = clock guardians + steel legion + black roots; the mix is right but only the clock guardian ever spawns

- 원문: 「악마화 나무는 베어진 채 남아 있었다. 가지가 사라진 자리에는 별이 걸려 있었고」(2869행) / 「성벽이 상담실 안으로 밀려왔고, 시곗바늘이 문틈을 가로질렀다. 검은 뿌리와 강철 군단의 잔해」(2912행)
- 장소·빛·날씨: palace garden, felled demon tree, stars in the branches; then the counselling room · starlight; night · clear night (stars); text silent on rain
- 현재 스폰: [kair04,kair-guardian-01] 시간수문장 01 / guardian_01.webp (blue crystal clock guardian); [u201,u201-e3] 참호 공명기사 / u2_resonance_knight — only kair-guardian-01 (parity)
- 몹 계획: [kair04,kair-guardian-01] → **keep (clock hands)** (keep, 공격 melee (override))
- 몹 계획: [u201,u201-e3] → **keep (steel legion) + add [dist00,a11-c1] as root remnant (fix parity so all three rotate)** (augment, 공격 melee)
- 맵 보정: garden + living trees ok; night sky with stars; stump = felled demon tree (exists); six-object markers exist

**maze · 상담실로 밀려온 성벽** — 판정 **PARTIAL**: as above

- 원문: 「그녀를 향해 다가갈수록 길은 좁아졌다」(2914행) / 「방벽이 무너질 때마다 미카엘라는 나보다 등 뒤의 세계들을 먼저 돌아보았다」(2916행)
- 장소·빛·날씨: counselling room invaded by castle walls · lamp · none
- 현재 스폰: [kair04,kair-guardian-01] clock guardian
- 몹 계획: rows → **clock guardian + resonance knight + root remnant (rotation)** (augment, 공격 melee)
- 맵 보정: domestic ok; obelisks = wall fragments; clock-hand decals optional

**ascent · 상담실** — 판정 **MISMATCH**: 미카엘라 is the psychiatrist in a white coat (hero art exists: assets/heroes/normalized/directions/michaela-*.webp); Arvelia is another character. Text: the hero cuts the knot/barrier, not her

- 원문: 「방 한가운데 미카엘라가 서 있었다. 그녀는 기억 속의 흰 가운을 입고 있었다」(2891행) / 「마지막 연결이 드러나자… 문에서 손을 떼지 못하도록 손목까지 묶어 놓은 매듭이었다」(2940행) / 「나는 그 매듭을 베었다」(2942행)
- 장소·빛·날씨: old counselling room with empty frames · white light through the last door · none
- 현재 스폰: [dist00,a11-c1] guards purple knight; [kair02,kair-great-03] 아르벨리아를 묶은 변조 명령 / arvelia_delay_archon (white-haired blue archon) + key poses
- 몹 계획: boss [kair02,kair-great-03] → **GENERATE m-michaela-knot (4 key poses: Michaela in white coat with hands spread toward doors; the hittable 'body' is the wall/clock/root barrier knot in front of her — presentation only)** (replace, 새 몹 m-michaela-knot)
- 몹 계획: guards [dist00,a11-c1] → **root remnant is fine here (2912 '검은 뿌리') but melee override** (keep, 공격 melee)
- 맵 보정: straight ok; empty-frame props (cabinet -> picture frames if a frame asset exists); white light at the far door

스크린샷(test-aid): `S/shots/narr/ep15-M-survival.jpg`

## 3. 새 몹 명세 (31종 · 보스 키포즈 포함)

공통 화풍: dark-fantasy painted character art, matching the StoryWorld R7 pose pack (r7-out/poses): full body, 3/4 view facing screen-left, isometric ARPG scale, soft rim light, muted desaturated palette with one accent colour, transparent background, no text, no logos, no watermark, feet on a flat ground contact point

시트 형식: Deliver as a 2x2 pose sheet on one transparent PNG (each cell 512x512, same scale and same ground line in every cell): top-left WALK (mid-stride), top-right IDLE (weight on both feet, slight sway), bottom-left HIT (recoil, head back, limbs loosened), bottom-right ATTACK (the strike described below, aimed toward the screen-bottom/front). Same character, same costume and colours in all four cells. Bosses: 4 key poses instead (anticipation, strike toward screen bottom, follow-through, recovery) like assets/r104/bosses/*-p1..p4.

### s01-root-shade — 뿌리 밑 잔영 (mob, human (slightly shorter, 0.9x), 우선순위 1)

- 근거: 「뿌리를 무너뜨리자 그 아래 눌려 있던 형상들이 쏟아졌다」(932행) / 「뒤에서는 새로운 발소리가 거듭 태어났다」(932행)
- 역할: swarm filler (survival) / maze stalker · 단계: S-01 survival, S-01 maze · 대체/보강: replaces [dist00,a11-c1] and [last302,l302-e1] · 공격: melee
- 이미지 프롬프트(영문): A faceless human-shaped shade that was pressed flat under black tree roots and is only now peeling up from the floor: smooth featureless head with a single horizontal stitched seam where the mouth would be, body of compacted dark soot and dried rose petals, thin black root fibres trailing from the ankles and wrists back toward the ground, shoulders slightly folded as if still crushed, dull rose-brown (#6b4b52) and charcoal (#2a2024) palette with one faint dusty-pink petal accent, no weapon, bare hands with long soot fingers dark-fantasy painted character art, matching the StoryWorld R7 pose pack (r7-out/poses): full body, 3/4 view facing screen-left, isometric ARPG scale, soft rim light, muted desaturated palette with one accent colour, transparent background, no text, no logos, no watermark, feet on a flat ground contact point. Deliver as a 2x2 pose sheet on one transparent PNG (each cell 512x512, same scale and same ground line in every cell): top-left WALK (mid-stride), top-right IDLE (weight on both feet, slight sway), bottom-left HIT (recoil, head back, limbs loosened), bottom-right ATTACK (the strike described below, aimed toward the screen-bottom/front). Same character, same costume and colours in all four cells. Bosses: 4 key poses instead (anticipation, strike toward screen bottom, follow-through, recovery) like assets/r104/bosses/*-p1..p4.
- 포즈: walk = shuffling forward dragging root fibres, torso leaning; idle = stands slightly caved in, head tilted listening; hit = flattens sideways like paper, fibres whip; attack = lunges both hands forward in a short clawing grab toward the screen bottom

### s01-ribbon-resident — 리본에 묶인 주민 (mob, human, 우선순위 2)

- 근거: 「작은 구두를 신은 주민들이 양손을 무릎에 얹고 앉아 있었다」(953행) / 「옷깃에는 이름 대신 착함과 감사와 순종을 뜻하는 말들이 수놓여」(953행) / 「옷에 장식처럼 달린 리본이 벽 속까지 이어져 있었다」(957행)
- 역할: ascent escort/guard (slow) · 단계: S-01 ascent · 대체/보강: replaces guard [ep1b05,b05-p1] · 공격: melee
- 이미지 프롬프트(영문): A porcelain-faced house resident in an old-fashioned high-collared dress with a wide embroidered collar (abstract embroidery, no readable letters), tiny lacquered shoes, hands held stiffly at the knees, a long satin ribbon bow on the back whose tails stretch away behind the figure as if tied into a wall, fixed sewn-on smile, holding an empty teacup; palette cream, dusty rose, dark brown with a deep red ribbon accent dark-fantasy painted character art, matching the StoryWorld R7 pose pack (r7-out/poses): full body, 3/4 view facing screen-left, isometric ARPG scale, soft rim light, muted desaturated palette with one accent colour, transparent background, no text, no logos, no watermark, feet on a flat ground contact point. Deliver as a 2x2 pose sheet on one transparent PNG (each cell 512x512, same scale and same ground line in every cell): top-left WALK (mid-stride), top-right IDLE (weight on both feet, slight sway), bottom-left HIT (recoil, head back, limbs loosened), bottom-right ATTACK (the strike described below, aimed toward the screen-bottom/front). Same character, same costume and colours in all four cells. Bosses: 4 key poses instead (anticipation, strike toward screen bottom, follow-through, recovery) like assets/r104/bosses/*-p1..p4.
- 포즈: walk = small mincing steps, ribbon tails taut behind; idle = sits-then-stands posture, cup raised in a drinking mime; hit = head snaps, smile seam splits; attack = swings the empty cup and saucer in a short arc toward the screen bottom

### s01-hostess-keyposes — 봉합부인 (키포즈 4장) (boss, large, 우선순위 2)

- 근거: 「수백 개의 앞치마를 이어 만든 치마… 허리에는 가위와 찻숟가락이 매달렸고… 장미 다발」(965행) / 「봉합부인이 가위를 벌렸다」(975행)
- 역할: boss key poses · 단계: S-01 ascent · 대체/보강: augments assets/r105/drive/boss-hostess.webp (static) · 공격: melee
- 이미지 프롬프트(영문): Use the existing boss-hostess design exactly (rose-bouquet head with many tiny smiles, skirt of hundreds of stitched aprons, scissors and tea spoons at the waist). Four key poses: scissors raised and opening, scissors snipping downward toward the screen bottom, aprons flaring outward in follow-through, settling with scissors lowered dark-fantasy painted character art, matching the StoryWorld R7 pose pack (r7-out/poses): full body, 3/4 view facing screen-left, isometric ARPG scale, soft rim light, muted desaturated palette with one accent colour, transparent background, no text, no logos, no watermark, feet on a flat ground contact point. Deliver as a 2x2 pose sheet on one transparent PNG (each cell 512x512, same scale and same ground line in every cell): top-left WALK (mid-stride), top-right IDLE (weight on both feet, slight sway), bottom-left HIT (recoil, head back, limbs loosened), bottom-right ATTACK (the strike described below, aimed toward the screen-bottom/front). Same character, same costume and colours in all four cells. Bosses: 4 key poses instead (anticipation, strike toward screen bottom, follow-through, recovery) like assets/r104/bosses/*-p1..p4.
- 포즈: keyposes = anticipation / strike-down / follow-through / recovery, pivot at the hem centre like assets/r104/bosses

### s02-faceless-student — 얼굴 없는 학생 (mob, human, 우선순위 1)

- 근거: 「어둠 속에서 학생들이 일어섰다. 얼굴은 없었고, 교복 안에는 구겨진 확인서만 들어 있었다」(1032행)
- 역할: swarm filler / maze stalker / ascent guard · 단계: S-02 survival, S-02 maze, S-02 ascent · 대체/보강: augments assets/r105/drive/mob-student.webp (same design, now 4 poses); replaces [ep1a08,a08-s1] and [u204,u204-e2] · 공격: melee
- 이미지 프롬프트(영문): The existing faceless student exactly: dark navy school uniform, blank smooth face, crumpled paper stuffed inside the open collar and sleeves, wet indoor slippers; slight translucency at the hem dark-fantasy painted character art, matching the StoryWorld R7 pose pack (r7-out/poses): full body, 3/4 view facing screen-left, isometric ARPG scale, soft rim light, muted desaturated palette with one accent colour, transparent background, no text, no logos, no watermark, feet on a flat ground contact point. Deliver as a 2x2 pose sheet on one transparent PNG (each cell 512x512, same scale and same ground line in every cell): top-left WALK (mid-stride), top-right IDLE (weight on both feet, slight sway), bottom-left HIT (recoil, head back, limbs loosened), bottom-right ATTACK (the strike described below, aimed toward the screen-bottom/front). Same character, same costume and colours in all four cells. Bosses: 4 key poses instead (anticipation, strike toward screen bottom, follow-through, recovery) like assets/r104/bosses/*-p1..p4.
- 포즈: walk = slow determined walk, arms straight down; idle = stands facing slightly away, paper rustling; hit = folds at the waist, paper bursts from the collar; attack = two-handed shove / paper slap toward the screen bottom

### s03-dobok-challenger — 검게 물든 도전자 (A) (mob, human, 우선순위 1)

- 근거: 「데미지 컨트롤 슈트는 처음에는 흰색이었다… 치명상에 가까워질수록 검게 변하는 도복」(1091행) / 「낡은 운동화에 여러 번 기운 도복을 입고, 허리에는 흰 띠를」(1093행) / 「기절한 도전자를 다시 일으켜 세우고」(1217행)
- 역할: swarm filler / maze stalker · 단계: S-03 survival, S-03 maze, RC survival (white = innocent) · 대체/보강: replaces [dist04,dist04-c1]; reused in RC for [ep1b05,b05-p1] · 공격: melee
- 이미지 프롬프트(영문): A young martial-arts examinee in a white dobok whose chest and one shoulder have turned ink-black as if soaked from inside, white belt, worn canvas sneakers, bandaged knuckles, face downcast and shadowed (no visible features), posture of someone being pulled upright by invisible strings, thin black ring faintly visible at the back of the neck; palette white, grey, ink black, no colour accent except a faint grey-blue dark-fantasy painted character art, matching the StoryWorld R7 pose pack (r7-out/poses): full body, 3/4 view facing screen-left, isometric ARPG scale, soft rim light, muted desaturated palette with one accent colour, transparent background, no text, no logos, no watermark, feet on a flat ground contact point. Deliver as a 2x2 pose sheet on one transparent PNG (each cell 512x512, same scale and same ground line in every cell): top-left WALK (mid-stride), top-right IDLE (weight on both feet, slight sway), bottom-left HIT (recoil, head back, limbs loosened), bottom-right ATTACK (the strike described below, aimed toward the screen-bottom/front). Same character, same costume and colours in all four cells. Bosses: 4 key poses instead (anticipation, strike toward screen bottom, follow-through, recovery) like assets/r104/bosses/*-p1..p4.
- 포즈: walk = stiff marionette walk, heels dragging; idle = fighting stance held too long, slight tremble; hit = black spreads down one arm, knees buckle; attack = straight punch then front kick toward the screen bottom

### s03-dobok-challenger-b — 검게 물든 도전자 (B · 치명) (mob, human, 우선순위 2)

- 근거: 「온몸이 검게 변했다면 실제 전투에서는 죽음에 이르렀을 가능성이」(1091행) / 「쓰러진 사람은 또 맞아야 했다. 도복이 흰색으로 돌아올 때마다 상처도 처음부터」(1221행)
- 역할: elite / ascent guard · 단계: S-03 ascent, S-03 survival (elite), RC ascent guard · 대체/보강: replaces [dist04,dist04-s1] and S-03 guards · 공격: melee
- 이미지 프롬프트(영문): Same examinee design but the dobok is black from neck to ankles with only the white belt bright, head hanging, a heavier black iron ring clamped around the neck with a short chain rising upward out of frame, feet barely touching the ground dark-fantasy painted character art, matching the StoryWorld R7 pose pack (r7-out/poses): full body, 3/4 view facing screen-left, isometric ARPG scale, soft rim light, muted desaturated palette with one accent colour, transparent background, no text, no logos, no watermark, feet on a flat ground contact point. Deliver as a 2x2 pose sheet on one transparent PNG (each cell 512x512, same scale and same ground line in every cell): top-left WALK (mid-stride), top-right IDLE (weight on both feet, slight sway), bottom-left HIT (recoil, head back, limbs loosened), bottom-right ATTACK (the strike described below, aimed toward the screen-bottom/front). Same character, same costume and colours in all four cells. Bosses: 4 key poses instead (anticipation, strike toward screen bottom, follow-through, recovery) like assets/r104/bosses/*-p1..p4.
- 포즈: walk = dragged forward by the chain, toes scraping; idle = hangs slack, swaying; hit = chain yanks the body back upright; attack = wide hooking punch with the whole body swung by the chain, toward the screen bottom

### s03-black-ring-device — 검은 고리 (boss, large, 우선순위 1)

- 근거: 「천막 안쪽에 검은 고리가 숨어 있었다. 기절한 도전자를 다시 일으켜 세우고, 멎은 싸움의 다음 동작을 재촉하는 장치」(1217행) / 「환도의 칼날이 고리 사이로 들어갔다」(1225행)
- 역할: boss · 단계: S-03 ascent · 대체/보강: replaces boss [cult06,c106-mid] · 공격: melee
- 이미지 프롬프트(영문): A faceless mechanism: three to five concentric black iron rings of different sizes standing upright like a gyroscope, each ring hung with short chains ending in neck collars and torn strips of white and black dobok cloth, a tent-canvas shroud draped over the top, oily black metal with dull brass pivots, a faint white glow at the centre where the rings cross; no eyes, no mouth dark-fantasy painted character art, matching the StoryWorld R7 pose pack (r7-out/poses): full body, 3/4 view facing screen-left, isometric ARPG scale, soft rim light, muted desaturated palette with one accent colour, transparent background, no text, no logos, no watermark, feet on a flat ground contact point. Deliver as a 2x2 pose sheet on one transparent PNG (each cell 512x512, same scale and same ground line in every cell): top-left WALK (mid-stride), top-right IDLE (weight on both feet, slight sway), bottom-left HIT (recoil, head back, limbs loosened), bottom-right ATTACK (the strike described below, aimed toward the screen-bottom/front). Same character, same costume and colours in all four cells. Bosses: 4 key poses instead (anticipation, strike toward screen bottom, follow-through, recovery) like assets/r104/bosses/*-p1..p4.
- 포즈: keyposes = rings tilt back and chains lift (anticipation) / rings slam forward toward the screen bottom (strike) / chains lash outward (follow-through) / rings settle and resume slow spin (recovery)

### s04-rule-mannequin — 규칙을 어기지 않는 마네킹 (mob, human, 우선순위 1)

- 근거: 「지연이 지키는 식당에는 규칙을 어기지 않는 마네킹들이 앉아 있었다. 그들은 빈 접시에 수저를 움직였고」(1254행)
- 역할: swarm filler / maze stalker / ascent guard · 단계: S-04 survival, S-04 maze, S-04 ascent · 대체/보강: replaces [ep1a10,a10-o1]; design ref assets/r106/drive/mannequin-eating-1.webp · 공격: melee
- 이미지 프롬프트(영문): A jointed artist's mannequin of pale varnished wood standing upright, ball joints visible, blank egg head, holding an empty white porcelain plate in one hand and a spoon in the other, a napkin tucked at the neck, slightly chipped and dusty; palette warm beige wood, white plate, dark grey joints dark-fantasy painted character art, matching the StoryWorld R7 pose pack (r7-out/poses): full body, 3/4 view facing screen-left, isometric ARPG scale, soft rim light, muted desaturated palette with one accent colour, transparent background, no text, no logos, no watermark, feet on a flat ground contact point. Deliver as a 2x2 pose sheet on one transparent PNG (each cell 512x512, same scale and same ground line in every cell): top-left WALK (mid-stride), top-right IDLE (weight on both feet, slight sway), bottom-left HIT (recoil, head back, limbs loosened), bottom-right ATTACK (the strike described below, aimed toward the screen-bottom/front). Same character, same costume and colours in all four cells. Bosses: 4 key poses instead (anticipation, strike toward screen bottom, follow-through, recovery) like assets/r104/bosses/*-p1..p4.
- 포즈: walk = stiff knee-locked walk, plate kept level; idle = spoon lifts to the mouth-less face and returns to the empty plate, repeating; hit = a joint pops, head tilts 90 degrees; attack = backhand swing with the plate edge toward the screen bottom

### s05-newsprint-wraith — 찢긴 호외의 잔향 (mob, human (light, 0.95x), 우선순위 1)

- 근거: 「머리 위를 날리는 것은 눈이 아니라 잘게 찢긴 호외였다. 종이마다 지현의 사진이 반복되어 있었다」(1465행)
- 역할: swarm filler · 단계: S-05 survival, S-05 maze · 대체/보강: replaces [ep1b07,b07-f1] · 공격: melee
- 이미지 프롬프트(영문): A hollow human silhouette formed by hundreds of torn newspaper strips swirling in a snow wind, vaguely a figure in a long coat, no face, the strips show only abstract halftone grey (no readable text, no recognisable portrait), one strip carries a single red lipstick-mark accent; palette newsprint grey, ash black, snow white, red accent dark-fantasy painted character art, matching the StoryWorld R7 pose pack (r7-out/poses): full body, 3/4 view facing screen-left, isometric ARPG scale, soft rim light, muted desaturated palette with one accent colour, transparent background, no text, no logos, no watermark, feet on a flat ground contact point. Deliver as a 2x2 pose sheet on one transparent PNG (each cell 512x512, same scale and same ground line in every cell): top-left WALK (mid-stride), top-right IDLE (weight on both feet, slight sway), bottom-left HIT (recoil, head back, limbs loosened), bottom-right ATTACK (the strike described below, aimed toward the screen-bottom/front). Same character, same costume and colours in all four cells. Bosses: 4 key poses instead (anticipation, strike toward screen bottom, follow-through, recovery) like assets/r104/bosses/*-p1..p4.
- 포즈: walk = drifts forward, strips trailing like a scarf; idle = strips slowly circulate; hit = bursts apart then reforms smaller; attack = whips a sheaf of paper edges forward like a blade toward the screen bottom

### s05-officer-shade — 군복의 그림자 (mob, human, 우선순위 2)

- 근거: 「나는 창씨개명한 조선인이었고 일본군의 말단 장교였다」(1355행) / 「상관이 들어왔다… 군복의 천이 신문에 스쳐 바스락거렸다」(1423행) / 「축하받는 사람과 시체가 된 사람 사이에서 종이 한 장이」(1441행)
- 역할: maze stalker / swarm minority · 단계: S-05 maze, S-05 survival (1-in-3) · 대체/보강: replaces [murder04,murder04-e2] · 공격: melee
- 이미지 프롬프트(영문): A 1940s junior army officer rendered as a dark silhouette: long greatcoat, peaked cap pulled low so no face shows, sabre at the hip, snow on the shoulders, the whole figure half dissolved into drifting snow at the edges; insignia blurred into plain dark patches (no real emblems), palette slate grey, black, snow white, no bright colour dark-fantasy painted character art, matching the StoryWorld R7 pose pack (r7-out/poses): full body, 3/4 view facing screen-left, isometric ARPG scale, soft rim light, muted desaturated palette with one accent colour, transparent background, no text, no logos, no watermark, feet on a flat ground contact point. Deliver as a 2x2 pose sheet on one transparent PNG (each cell 512x512, same scale and same ground line in every cell): top-left WALK (mid-stride), top-right IDLE (weight on both feet, slight sway), bottom-left HIT (recoil, head back, limbs loosened), bottom-right ATTACK (the strike described below, aimed toward the screen-bottom/front). Same character, same costume and colours in all four cells. Bosses: 4 key poses instead (anticipation, strike toward screen bottom, follow-through, recovery) like assets/r104/bosses/*-p1..p4.
- 포즈: walk = measured march, one hand on the sabre; idle = stands at ease, snow gathering; hit = cap flies off revealing only darkness, staggers; attack = draws and cuts diagonally downward toward the screen bottom

### s05-burning-officer — 불 속의 군복 (mob, human, 우선순위 3)

- 근거: 「그날 밤, 나는 일본군 관사에 불을 놓았다. 그리고 나오지 않았다」(1445행) / 「관사 안에서 다시 불빛이 피어났다」(1467행)
- 역할: ascent guard · 단계: S-05 ascent · 대체/보강: replaces guards [ep1b07,b07-f1] (keep b07-f1 optionally as 1-in-3) · 공격: melee
- 이미지 프롬프트(영문): The same officer silhouette engulfed from the knees up in slow orange embers and black smoke, coat edges curling, no visible face, carrying nothing, arms slightly out; palette charcoal with ember orange accent only dark-fantasy painted character art, matching the StoryWorld R7 pose pack (r7-out/poses): full body, 3/4 view facing screen-left, isometric ARPG scale, soft rim light, muted desaturated palette with one accent colour, transparent background, no text, no logos, no watermark, feet on a flat ground contact point. Deliver as a 2x2 pose sheet on one transparent PNG (each cell 512x512, same scale and same ground line in every cell): top-left WALK (mid-stride), top-right IDLE (weight on both feet, slight sway), bottom-left HIT (recoil, head back, limbs loosened), bottom-right ATTACK (the strike described below, aimed toward the screen-bottom/front). Same character, same costume and colours in all four cells. Bosses: 4 key poses instead (anticipation, strike toward screen bottom, follow-through, recovery) like assets/r104/bosses/*-p1..p4.
- 포즈: walk = slow heavy walk trailing smoke; idle = stands in the fire, embers rising; hit = flares bright then slumps; attack = embraces forward with both burning arms toward the screen bottom

### s06-dawn-angel — 미명천사 (boss, large (2x boss), 우선순위 1)

- 근거: 「한쪽 날개에는 서울의 창문들이, 다른 쪽에는 바다 위의 가로등들이 달려 있었다. 몸의 아래로 철로가 길게 풀렸고, 얼굴이 있어야 할 자리에는 잠든 사람의 눈꺼풀이 겹쳐 있었다」(1741행) / 「그 안에는 검은 우주 대신 거대한 눈이 있었다」(1751행)
- 역할: boss · 단계: S-06 ascent · 대체/보강: replaces boss [ep1a11,a11-boss] · 공격: melee
- 이미지 프롬프트(영문): A towering angelic silhouette made of city debris: the left wing is a fan of lit apartment windows and concrete slabs, the right wing a fan of curved harbour street-lamps on thin poles, from the hips down a tangle of railway rails and overhead cables trails to the ground, the head is a smooth oval covered in overlapping closed human eyelids, two human hands are the only intact flesh; palette black steel, teal (#2fb3a8) window light, pale lamp white, no gold dark-fantasy painted character art, matching the StoryWorld R7 pose pack (r7-out/poses): full body, 3/4 view facing screen-left, isometric ARPG scale, soft rim light, muted desaturated palette with one accent colour, transparent background, no text, no logos, no watermark, feet on a flat ground contact point. Deliver as a 2x2 pose sheet on one transparent PNG (each cell 512x512, same scale and same ground line in every cell): top-left WALK (mid-stride), top-right IDLE (weight on both feet, slight sway), bottom-left HIT (recoil, head back, limbs loosened), bottom-right ATTACK (the strike described below, aimed toward the screen-bottom/front). Same character, same costume and colours in all four cells. Bosses: 4 key poses instead (anticipation, strike toward screen bottom, follow-through, recovery) like assets/r104/bosses/*-p1..p4.
- 포즈: keyposes = wings draw back and lamps brighten (anticipation) / both wings sweep down toward the screen bottom (strike) / windows shatter outward in a ring (follow-through) / wings half-fold, eyelids twitch (recovery)

### s06-delay-warden — 유예관 (mob, human, 우선순위 4)

- 근거: 「검은 외투를 두른 인간형 병기가 나타났다… 외투 안에는 수많은 시계가 거꾸로 달려 있었다」(1568행)
- 역할: rare elite (maze) · 단계: S-06 maze (optional) · 대체/보강: augments S-06 maze roster · 공격: melee
- 이미지 프롬프트(영문): A man in a long black coat lined inside with dozens of small clock faces that run backwards, left wrist in a worn leather brace, a mechanic's tool satchel, face shadowed under a hood; palette black, brass clock faces, one purple gleam dark-fantasy painted character art, matching the StoryWorld R7 pose pack (r7-out/poses): full body, 3/4 view facing screen-left, isometric ARPG scale, soft rim light, muted desaturated palette with one accent colour, transparent background, no text, no logos, no watermark, feet on a flat ground contact point. Deliver as a 2x2 pose sheet on one transparent PNG (each cell 512x512, same scale and same ground line in every cell): top-left WALK (mid-stride), top-right IDLE (weight on both feet, slight sway), bottom-left HIT (recoil, head back, limbs loosened), bottom-right ATTACK (the strike described below, aimed toward the screen-bottom/front). Same character, same costume and colours in all four cells. Bosses: 4 key poses instead (anticipation, strike toward screen bottom, follow-through, recovery) like assets/r104/bosses/*-p1..p4.
- 포즈: walk = calm stride, coat open showing clocks; idle = adjusts the left wrist brace; hit = clocks spill from the coat; attack = flings the coat open and sweeps a clock-hand blade toward the screen bottom

### s07-object-shadow — 여섯 물건의 그림자 (mob, human (flat, 0.9x), 우선순위 3)

- 근거: 「탁자 위에 여섯 물건이 놓여 있었다. 인형, 출석부, 도복 조각, 영수증, 술잔, 날짜가 없는 탄피」(1854행) / 「그림자가 발밑으로 돌아왔다」(1890행)
- 역할: swarm filler / maze stalker · 단계: S-07 survival, S-07 maze · 대체/보강: augments/replaces [hando03,h103-t1]; remove [hando02,h102-t1] · 공격: melee
- 이미지 프롬프트(영문): A standing shadow of a person made of layered dark purple-grey smoke, carrying one oversized shadow-object fused into its chest (six variants may be one sheet with the doll variant; the others are optional): a rag doll, a wet ledger, a torn dobok strip, a receipt, a glass with a red lip mark, a bullet casing; no face; palette deep violet (#5c4a63) and black with the single object in muted grey dark-fantasy painted character art, matching the StoryWorld R7 pose pack (r7-out/poses): full body, 3/4 view facing screen-left, isometric ARPG scale, soft rim light, muted desaturated palette with one accent colour, transparent background, no text, no logos, no watermark, feet on a flat ground contact point. Deliver as a 2x2 pose sheet on one transparent PNG (each cell 512x512, same scale and same ground line in every cell): top-left WALK (mid-stride), top-right IDLE (weight on both feet, slight sway), bottom-left HIT (recoil, head back, limbs loosened), bottom-right ATTACK (the strike described below, aimed toward the screen-bottom/front). Same character, same costume and colours in all four cells. Bosses: 4 key poses instead (anticipation, strike toward screen bottom, follow-through, recovery) like assets/r104/bosses/*-p1..p4.
- 포즈: walk = glides, feet dissolving; idle = holds the object out as an offering; hit = tears open at the chest; attack = swings the object downward toward the screen bottom

### s07-persona-hwando — 페르소나 (boss, human (boss scale 1.65x), 우선순위 1)

- 근거: 「그는 내 옷을 입고 내 칼을 옆에 놓은 채, 내가 걸어오기를 기다리고 있었다」(1848행) / 「가면은 너무 평범해서 처음에는 알아보지 못했다」(1850행) / 「가면이 갈라지자 아래에서 더 깨끗한 가면이 드러났다」(1872행)
- 역할: boss · 단계: S-07 ascent · 대체/보강: replaces boss [hando03,h103-boss]; base body on the 환도 hero sprites (assets/heroes/normalized/hwando/*) · 공격: melee
- 이미지 프롬프트(영문): An exact double of the hero 환도 (same coat, same curved sword 환도, same hair) wearing a plain smooth white porcelain mask with a neutral kind expression (match assets/r105/drive/prop-mask-1.webp), standing too still; palette identical to the hero but 10% desaturated, a thin white halo-line around the mask dark-fantasy painted character art, matching the StoryWorld R7 pose pack (r7-out/poses): full body, 3/4 view facing screen-left, isometric ARPG scale, soft rim light, muted desaturated palette with one accent colour, transparent background, no text, no logos, no watermark, feet on a flat ground contact point. Deliver as a 2x2 pose sheet on one transparent PNG (each cell 512x512, same scale and same ground line in every cell): top-left WALK (mid-stride), top-right IDLE (weight on both feet, slight sway), bottom-left HIT (recoil, head back, limbs loosened), bottom-right ATTACK (the strike described below, aimed toward the screen-bottom/front). Same character, same costume and colours in all four cells. Bosses: 4 key poses instead (anticipation, strike toward screen bottom, follow-through, recovery) like assets/r104/bosses/*-p1..p4.
- 포즈: keyposes = mask tilts and sword drawn low (anticipation) / mirrored iai cut toward the screen bottom (strike) / mask cracks, second cleaner mask beneath (follow-through, reuse prop-mask-2 look) / lowers the sword, face weeping behind the mask (recovery)

### ra-proofmark-bug — 붉은 교정 표시 (mob, small (0.5x, ground-hugging), 우선순위 1)

- 근거: 「깨진 종 안에서 붉은 교정 표시들이 벌레처럼 기어 나왔다. 수백 개의 표시가 그림 가장자리에 들러붙더니」(1956행) / 「금박 안쪽에서 교정 표시가 발견되었다」(2306행)
- 역할: small swarm filler · 단계: RA survival, RG survival, RG maze, RF (optional) · 대체/보강: replaces [cult06,c106-e1] (RA) and [cult03,c103-e1] (RG) · 공격: melee
- 이미지 프롬프트(영문): A palm-sized insect whose body is a tangle of red proofreading marks: a strike-through line as the spine, a circled loop as the abdomen, caret and bracket shapes as six ink legs, no eyes, wet red ink dripping from the tips; palette red ink (#b4232a) on nothing else, slight paper-white underside dark-fantasy painted character art, matching the StoryWorld R7 pose pack (r7-out/poses): full body, 3/4 view facing screen-left, isometric ARPG scale, soft rim light, muted desaturated palette with one accent colour, transparent background, no text, no logos, no watermark, feet on a flat ground contact point. Deliver as a 2x2 pose sheet on one transparent PNG (each cell 512x512, same scale and same ground line in every cell): top-left WALK (mid-stride), top-right IDLE (weight on both feet, slight sway), bottom-left HIT (recoil, head back, limbs loosened), bottom-right ATTACK (the strike described below, aimed toward the screen-bottom/front). Same character, same costume and colours in all four cells. Bosses: 4 key poses instead (anticipation, strike toward screen bottom, follow-through, recovery) like assets/r104/bosses/*-p1..p4.
- 포즈: walk = scuttles fast, legs scratching; idle = legs twitch, ink pools; hit = smears into a red streak; attack = leaps a short hop and bites toward the screen bottom

### ra-nameless-patient — 이름 없는 환자복 형상 (mob, human (light), 우선순위 2)

- 근거: 「환자복을 입힌 형상들은 입원 기록에 이름이 없다는 이유로 치료를 받지 못했다… 흰 천 아래의 몸은 점점 가벼워졌고, 명찰만 무거워졌다」(2034행)
- 역할: maze stalker / ascent guard · 단계: RA maze, RA ascent · 대체/보강: replaces [cult06,c106-e1] (maze) and [murder04,murder04-e1] (guards) · 공격: melee
- 이미지 프롬프트(영문): A hospital patient shape under a thin white sheet-gown that floats as if almost empty, bare feet not touching the snow, a single huge blank metal name tag hanging from the neck on a cord and dragging it forward, no face under the hood of the sheet; snow dust on the shoulders; palette hospital white, pale blue shadows, iron-grey tag dark-fantasy painted character art, matching the StoryWorld R7 pose pack (r7-out/poses): full body, 3/4 view facing screen-left, isometric ARPG scale, soft rim light, muted desaturated palette with one accent colour, transparent background, no text, no logos, no watermark, feet on a flat ground contact point. Deliver as a 2x2 pose sheet on one transparent PNG (each cell 512x512, same scale and same ground line in every cell): top-left WALK (mid-stride), top-right IDLE (weight on both feet, slight sway), bottom-left HIT (recoil, head back, limbs loosened), bottom-right ATTACK (the strike described below, aimed toward the screen-bottom/front). Same character, same costume and colours in all four cells. Bosses: 4 key poses instead (anticipation, strike toward screen bottom, follow-through, recovery) like assets/r104/bosses/*-p1..p4.
- 포즈: walk = pulled forward by the heavy tag, leaning; idle = sways, tag swinging; hit = sheet collapses inward, tag clangs; attack = swings the heavy name tag like a flail toward the screen bottom

### rb-apron-officer — 앞치마를 두른 군복 손님 (mob, human, 우선순위 2)

- 근거: 「손님들은 군복 위에 식사용 앞치마를 두르고 있었다… 빈 접시 바닥에는 저마다 다른 사람의 주소가 새겨져」(2146행)
- 역할: maze stalker / ascent guard · 단계: RB maze, RB ascent · 대체/보강: replaces [kair01,kair-academy-wave-1] in the maze; shares base with s05-officer-shade · 공격: melee
- 이미지 프롬프트(영문): The 1940s officer silhouette (see s05-officer-shade) seated-then-standing with a white dining apron tied over the greatcoat, a satin ribbon on the back like the S-01 residents, holding an empty plate up with both hands as if showing its underside, a kitchen cleaver tucked in the apron string; palette slate grey, apron white, dark red ribbon dark-fantasy painted character art, matching the StoryWorld R7 pose pack (r7-out/poses): full body, 3/4 view facing screen-left, isometric ARPG scale, soft rim light, muted desaturated palette with one accent colour, transparent background, no text, no logos, no watermark, feet on a flat ground contact point. Deliver as a 2x2 pose sheet on one transparent PNG (each cell 512x512, same scale and same ground line in every cell): top-left WALK (mid-stride), top-right IDLE (weight on both feet, slight sway), bottom-left HIT (recoil, head back, limbs loosened), bottom-right ATTACK (the strike described below, aimed toward the screen-bottom/front). Same character, same costume and colours in all four cells. Bosses: 4 key poses instead (anticipation, strike toward screen bottom, follow-through, recovery) like assets/r104/bosses/*-p1..p4.
- 포즈: walk = formal steps, plate held out; idle = turns the plate over; hit = plate drops and shatters; attack = draws the cleaver and chops downward toward the screen bottom

### rb-white-guest — 백색의 손님 (mob, human (1.2x), 우선순위 3)

- 근거: 「식탁 끝에서 백색의 손님이 일어났다. 얼굴 대신 특진을 알리는 신문이 붙어 있었다. 그가 박수를 치자 여러 계급장이 접시 위에서 튀었다」(2180행)
- 역할: elite guard (ascent) · 단계: RB ascent · 대체/보강: replaces guards [ep1b06,b06-f1] · 공격: ranged (투사체: gold badge sparks (small, warm), only if the lead wants a thrower; otherwise melee clap)
- 이미지 프롬프트(영문): A tall figure in an all-white dress uniform with a white apron, a folded newspaper page pasted flat where the face should be (blank halftone grey, no readable text), white gloves held apart mid-clap, several rank badges floating around the hands; palette white, cream, newsprint grey, one gold badge accent dark-fantasy painted character art, matching the StoryWorld R7 pose pack (r7-out/poses): full body, 3/4 view facing screen-left, isometric ARPG scale, soft rim light, muted desaturated palette with one accent colour, transparent background, no text, no logos, no watermark, feet on a flat ground contact point. Deliver as a 2x2 pose sheet on one transparent PNG (each cell 512x512, same scale and same ground line in every cell): top-left WALK (mid-stride), top-right IDLE (weight on both feet, slight sway), bottom-left HIT (recoil, head back, limbs loosened), bottom-right ATTACK (the strike described below, aimed toward the screen-bottom/front). Same character, same costume and colours in all four cells. Bosses: 4 key poses instead (anticipation, strike toward screen bottom, follow-through, recovery) like assets/r104/bosses/*-p1..p4.
- 포즈: walk = parade step; idle = slow clapping; hit = newspaper face tears at a corner; attack = claps hard and a fan of rank badges bursts toward the screen bottom (visible small gold projectiles if ranged, else the clap shockwave)

### rc-verdict-paperblade — 판결문 종이칼 (mob, small (floating), 우선순위 3)

- 근거: 「판결문이 돋아났다」(2203행) / 「나는 한시우가 보지 못하는 왼쪽으로 날아드는 종이칼을 막았다」(2241행)
- 역할: ranged minority (maze) · 단계: RC maze, RC survival (minority) · 대체/보강: augments [ep1b03,b03-g1] · 공격: ranged (투사체: paper dart, white with blue edge, radius .2, no light-blue bolt)
- 이미지 프롬프트(영문): A single sheet of judgement paper folded into a long blade, hovering edge-on at chest height, faint blue light along the edge, ink-black seal mark in one corner (abstract), paper trembling; palette white paper, blue (#51586b) glow, black seal dark-fantasy painted character art, matching the StoryWorld R7 pose pack (r7-out/poses): full body, 3/4 view facing screen-left, isometric ARPG scale, soft rim light, muted desaturated palette with one accent colour, transparent background, no text, no logos, no watermark, feet on a flat ground contact point. Deliver as a 2x2 pose sheet on one transparent PNG (each cell 512x512, same scale and same ground line in every cell): top-left WALK (mid-stride), top-right IDLE (weight on both feet, slight sway), bottom-left HIT (recoil, head back, limbs loosened), bottom-right ATTACK (the strike described below, aimed toward the screen-bottom/front). Same character, same costume and colours in all four cells. Bosses: 4 key poses instead (anticipation, strike toward screen bottom, follow-through, recovery) like assets/r104/bosses/*-p1..p4.
- 포즈: walk = hovers forward in short darts; idle = rotates slowly edge-on; hit = crumples; attack = snaps flat and launches itself as a paper dart toward the screen bottom (projectile sprite = the same sheet, blue edge)

### rc-judge-mirrorface — 재판관 (boss, large, 우선순위 2)

- 근거: 「재판관이 몸을 일으켰다. 그 얼굴은 나를 닮아 있었다… 관람석의 거울이 내가 품은 확신을 비추어 재판관의 얼굴로 빚고」(2235행) / 「손잡이에는 고통을 선악으로 환산하는 눈금이 새겨져 있었다」(2245행)
- 역할: boss · 단계: RC ascent (or move to RC maze end; see map notes) · 대체/보강: replaces boss [ep1b03,mb-ep1b03]; gavel = assets/r106/drive/hammer-1/2.webp · 공격: melee
- 이미지 프롬프트(영문): A judge in heavy black and white robes with a tall collar, the face is a flat oval mirror that reflects the viewer (render as a polished silver oval with a faint hero-like silhouette, no detailed face), one hand holds the graduated wooden gavel (match hammer-1.webp), the other a scale-plate; behind the shoulders a half-ring of small spectator mirrors; palette black robe, white trim, blue (#51586b) rim light, silver face dark-fantasy painted character art, matching the StoryWorld R7 pose pack (r7-out/poses): full body, 3/4 view facing screen-left, isometric ARPG scale, soft rim light, muted desaturated palette with one accent colour, transparent background, no text, no logos, no watermark, feet on a flat ground contact point. Deliver as a 2x2 pose sheet on one transparent PNG (each cell 512x512, same scale and same ground line in every cell): top-left WALK (mid-stride), top-right IDLE (weight on both feet, slight sway), bottom-left HIT (recoil, head back, limbs loosened), bottom-right ATTACK (the strike described below, aimed toward the screen-bottom/front). Same character, same costume and colours in all four cells. Bosses: 4 key poses instead (anticipation, strike toward screen bottom, follow-through, recovery) like assets/r104/bosses/*-p1..p4.
- 포즈: keyposes = gavel raised high (anticipation) / gavel slams toward the screen bottom, floor fold-lines flash (strike) / mirrors behind rotate (follow-through) / gavel rests, scale plate tips (recovery)

### rd-watch-lotus — 감시의 연꽃 (mob, small-medium (0.8x), 우선순위 1)

- 근거: 「감시의 연꽃들이 일제히 벌어졌다. 꽃 속에서 눈꺼풀 모양의 창들이 쏟아졌다」(2355행) / 「난간에 매달린 수련은 속에서부터 빛을 냈다」(2319행)
- 역할: ranged swarm (visible caster) · 단계: RD survival, RD maze · 대체/보강: replaces [cult02,c102-e1]; design ref assets/r106/drive/lotus.webp · 공격: ranged (투사체: eyelid-shaped pale shard, pink-teal, radius .18)
- 이미지 프롬프트(영문): A water lily the size of a child, glowing from inside pale pink-white, standing on a knot of wet brown roots that act as legs, the inner petals part to show a single closed human eyelid that opens when it attacks; palette lotus white-pink with teal glow, dark swamp-brown roots dark-fantasy painted character art, matching the StoryWorld R7 pose pack (r7-out/poses): full body, 3/4 view facing screen-left, isometric ARPG scale, soft rim light, muted desaturated palette with one accent colour, transparent background, no text, no logos, no watermark, feet on a flat ground contact point. Deliver as a 2x2 pose sheet on one transparent PNG (each cell 512x512, same scale and same ground line in every cell): top-left WALK (mid-stride), top-right IDLE (weight on both feet, slight sway), bottom-left HIT (recoil, head back, limbs loosened), bottom-right ATTACK (the strike described below, aimed toward the screen-bottom/front). Same character, same costume and colours in all four cells. Bosses: 4 key poses instead (anticipation, strike toward screen bottom, follow-through, recovery) like assets/r104/bosses/*-p1..p4.
- 포즈: walk = roots crawl, petals closed; idle = glows and breathes, eyelid closed; hit = petals wilt, glow dims; attack = petals snap open, eyelid opens and spits three thin eyelid-shaped shards toward the screen bottom (projectile sprite = pale pink eyelid shard, NOT the cyan bolt)

### rd-swamp-root — 다리 밑의 뿌리 (mob, human (1.1x), 우선순위 2)

- 근거: 「다리 밑에서 뿌리가 솟았다」(2361행) / 「수련… 그 끝이 닿은 방에는」(2361행)
- 역할: melee filler / ascent guard · 단계: RD survival, RD maze, RD ascent · 대체/보강: replaces [cult05,c105-e2] and RD guards · 공격: melee
- 이미지 프롬프트(영문): A column of wet black swamp roots that has pulled itself into a rough humanoid, dripping, a lily pad stuck to one shoulder, no head only a split in the root bundle, long root-arms; palette swamp black-brown, wet highlights, one teal glint of lotus light dark-fantasy painted character art, matching the StoryWorld R7 pose pack (r7-out/poses): full body, 3/4 view facing screen-left, isometric ARPG scale, soft rim light, muted desaturated palette with one accent colour, transparent background, no text, no logos, no watermark, feet on a flat ground contact point. Deliver as a 2x2 pose sheet on one transparent PNG (each cell 512x512, same scale and same ground line in every cell): top-left WALK (mid-stride), top-right IDLE (weight on both feet, slight sway), bottom-left HIT (recoil, head back, limbs loosened), bottom-right ATTACK (the strike described below, aimed toward the screen-bottom/front). Same character, same costume and colours in all four cells. Bosses: 4 key poses instead (anticipation, strike toward screen bottom, follow-through, recovery) like assets/r104/bosses/*-p1..p4.
- 포즈: walk = lurches, roots re-knitting each step; idle = drips, sways; hit = splits apart, water sprays; attack = both root arms slam down toward the screen bottom

### rd-first-trumpet — 첫 번째 나팔 (boss, large (hovering), 우선순위 2)

- 근거: 「하늘에서 나팔 소리가 났다. 악기는 보이지 않았다. 학교 종과 병원 경보, 열차 안내음과 호텔 화재벨이 한 소리로」(2443행) / 「나팔의 몸통은 빈 소매를 닮았다. 입술을 대는 자리마다 사람의 이름이 걸려 있었다」(2665행)
- 역할: boss · 단계: RD ascent · 대체/보강: replaces boss [cult02,c102-boss]; design ref assets/r106/drive/trumpet.webp · 공격: melee
- 이미지 프롬프트(영문): A huge horn whose body is a hollow grey cloth sleeve, bell made of a cracked school bell fused with a hospital alarm dome, mouthpiece ringed with blank hanging name tags on threads, hovering upright with no player, faint shockwave rings at the bell; palette grey cloth, tarnished brass, red alarm glass accent dark-fantasy painted character art, matching the StoryWorld R7 pose pack (r7-out/poses): full body, 3/4 view facing screen-left, isometric ARPG scale, soft rim light, muted desaturated palette with one accent colour, transparent background, no text, no logos, no watermark, feet on a flat ground contact point. Deliver as a 2x2 pose sheet on one transparent PNG (each cell 512x512, same scale and same ground line in every cell): top-left WALK (mid-stride), top-right IDLE (weight on both feet, slight sway), bottom-left HIT (recoil, head back, limbs loosened), bottom-right ATTACK (the strike described below, aimed toward the screen-bottom/front). Same character, same costume and colours in all four cells. Bosses: 4 key poses instead (anticipation, strike toward screen bottom, follow-through, recovery) like assets/r104/bosses/*-p1..p4.
- 포즈: keyposes = sleeve inflates and tags rise (anticipation) / bell tilts down and blasts a visible sound ring toward the screen bottom (strike) / sleeve whips (follow-through) / deflates (recovery)

### re-medal-doll — 제복을 입은 인형 (mob, human, 우선순위 2)

- 근거: 「제복을 입은 인형들이 훈장을 꺼냈다. 사람의 이름을 눌러 얇은 금속으로 만든 훈장」(2510행)
- 역할: swarm filler / maze / ascent guard · 단계: RE survival, RE maze, RE ascent · 대체/보강: replaces [u202,u202-e2]; same jointed body as s04-rule-mannequin · 공격: melee
- 이미지 프롬프트(영문): The pale wooden jointed mannequin (see s04-rule-mannequin) dressed in a white parade uniform with gold braid, a tray of blank thin metal medals in one hand, pinning one to its own chest with the other, blank egg head; palette white uniform, gold braid, beige wood joints dark-fantasy painted character art, matching the StoryWorld R7 pose pack (r7-out/poses): full body, 3/4 view facing screen-left, isometric ARPG scale, soft rim light, muted desaturated palette with one accent colour, transparent background, no text, no logos, no watermark, feet on a flat ground contact point. Deliver as a 2x2 pose sheet on one transparent PNG (each cell 512x512, same scale and same ground line in every cell): top-left WALK (mid-stride), top-right IDLE (weight on both feet, slight sway), bottom-left HIT (recoil, head back, limbs loosened), bottom-right ATTACK (the strike described below, aimed toward the screen-bottom/front). Same character, same costume and colours in all four cells. Bosses: 4 key poses instead (anticipation, strike toward screen bottom, follow-through, recovery) like assets/r104/bosses/*-p1..p4.
- 포즈: walk = parade step, tray level; idle = pins a medal, salutes; hit = medals scatter; attack = jabs the long medal pin forward toward the screen bottom

### re-white-marksman — 백색 사수 (boss, human (boss scale), 우선순위 1)

- 근거: 「조준경 안에서 나와 같은 얼굴을 한 사수가 먼저 방아쇠를 당겼다. 그는 흰 외투를 입고… 승리한 날짜만 금실로 수놓아져」(2498행) / 「나는 그가 가진 빈 약실을 보았다」(2514행)
- 역할: boss · 단계: RE ascent · 대체/보강: replaces boss [u201,u201-mid]; base body on the hero gunner sprites (assets/heroes/normalized/gunner/*) · 공격: melee
- 이미지 프롬프트(영문): An exact double of the hero 기억사수/gunner in a long white military greatcoat, sleeves embroidered with gold thread patterns (abstract, no digits), a long rifle with a teal scope glow, face identical to the hero but expressionless, standing on a platform edge; palette white coat, gold thread, dark rifle, teal scope accent dark-fantasy painted character art, matching the StoryWorld R7 pose pack (r7-out/poses): full body, 3/4 view facing screen-left, isometric ARPG scale, soft rim light, muted desaturated palette with one accent colour, transparent background, no text, no logos, no watermark, feet on a flat ground contact point. Deliver as a 2x2 pose sheet on one transparent PNG (each cell 512x512, same scale and same ground line in every cell): top-left WALK (mid-stride), top-right IDLE (weight on both feet, slight sway), bottom-left HIT (recoil, head back, limbs loosened), bottom-right ATTACK (the strike described below, aimed toward the screen-bottom/front). Same character, same costume and colours in all four cells. Bosses: 4 key poses instead (anticipation, strike toward screen bottom, follow-through, recovery) like assets/r104/bosses/*-p1..p4.
- 포즈: keyposes = rifle raised to the eye (anticipation) / muzzle flash toward the screen bottom, coat flaring (strike) / bolt cycles, spent casing ejects (follow-through) / lowers the rifle, dates on the sleeve peel off (recovery)

### rf-paper-child — 종이 형상 (mob, small-human (0.8x), 우선순위 1)

- 근거: 「이름을 끝까지 쓰지 못한 아이들이 쏟아졌다. 머리와 팔이 따로 움직이는 종이 형상들이었다」(2595행) / 「종이 모서리가 내 발목을 스쳤다」(2596행)
- 역할: swarm filler / maze stalker / ascent guard · 단계: RF survival, RF maze, RF ascent · 대체/보강: augments assets/r105/drive/mob-paper-figure.webp (same design, 4 poses); replaces [murder04,murder04-e2] and [ep1b03,b03-g2] · 공격: melee
- 이미지 프롬프트(영문): The existing folded-paper child figure exactly (cream paper, origami-like limbs, blank torn face), but with the head and one arm attached by a visible gap so they can move separately dark-fantasy painted character art, matching the StoryWorld R7 pose pack (r7-out/poses): full body, 3/4 view facing screen-left, isometric ARPG scale, soft rim light, muted desaturated palette with one accent colour, transparent background, no text, no logos, no watermark, feet on a flat ground contact point. Deliver as a 2x2 pose sheet on one transparent PNG (each cell 512x512, same scale and same ground line in every cell): top-left WALK (mid-stride), top-right IDLE (weight on both feet, slight sway), bottom-left HIT (recoil, head back, limbs loosened), bottom-right ATTACK (the strike described below, aimed toward the screen-bottom/front). Same character, same costume and colours in all four cells. Bosses: 4 key poses instead (anticipation, strike toward screen bottom, follow-through, recovery) like assets/r104/bosses/*-p1..p4.
- 포즈: walk = hops, head lagging behind the body; idle = head turns independently; hit = head and arm fly apart then snap back; attack = arm swings a sharp paper edge low toward the screen bottom (ankle height)

### rf-storyteller-keyposes — 스토리텔러 (키포즈 4장) (boss, large, 우선순위 2)

- 근거: 「표지가 겹겹이 매달려 있었고, 얼굴이 있어야 할 자리에서는 종이 한 장이 펄럭였다」(2555행) / 「글자마다 낚싯바늘이 달려 있었다」(2569행)
- 역할: boss key poses · 단계: RF ascent · 대체/보강: augments assets/r105/drive/boss-storyteller.webp · 공격: melee
- 이미지 프롬프트(영문): Use the existing boss-storyteller design exactly (book-spine body, blank page face). Four key poses: raises an arm trailing ink hooks, slams the arm down toward the screen bottom with hooks fanning, pages burst from the body, settles with the page face folding dark-fantasy painted character art, matching the StoryWorld R7 pose pack (r7-out/poses): full body, 3/4 view facing screen-left, isometric ARPG scale, soft rim light, muted desaturated palette with one accent colour, transparent background, no text, no logos, no watermark, feet on a flat ground contact point. Deliver as a 2x2 pose sheet on one transparent PNG (each cell 512x512, same scale and same ground line in every cell): top-left WALK (mid-stride), top-right IDLE (weight on both feet, slight sway), bottom-left HIT (recoil, head back, limbs loosened), bottom-right ATTACK (the strike described below, aimed toward the screen-bottom/front). Same character, same costume and colours in all four cells. Bosses: 4 key poses instead (anticipation, strike toward screen bottom, follow-through, recovery) like assets/r104/bosses/*-p1..p4.
- 포즈: keyposes = anticipation / strike-down / follow-through / recovery

### rg-blocked-name — 막힌 이름 (mob, human, 우선순위 1)

- 근거: 「마지막 나팔이 울리면 그 이름들은 하나의 긴 문장으로 불려 나갈 터였다. 누구도 제 이름이 불리는 곳에서 멈추거나 대답할 수 없는」(2665행) / 「거미줄 같은 선들이 장부와 문, 잔과 도복을 한데 묶고 있었다」(2675행)
- 역할: swarm filler / maze stalker / ascent guard · 단계: RG survival, RG maze, RG ascent · 대체/보강: replaces [cult04,c104-e1] · 공격: melee
- 이미지 프롬프트(영문): A human figure built entirely from overlapping blank paper name tags and strips bound tightly with red thread, the mouth area wrapped shut with thread, one arm reaching out with a tag held like an offering, thread lines trailing off the back toward the sky; palette paper cream, red thread (#b4232a), ink grey dark-fantasy painted character art, matching the StoryWorld R7 pose pack (r7-out/poses): full body, 3/4 view facing screen-left, isometric ARPG scale, soft rim light, muted desaturated palette with one accent colour, transparent background, no text, no logos, no watermark, feet on a flat ground contact point. Deliver as a 2x2 pose sheet on one transparent PNG (each cell 512x512, same scale and same ground line in every cell): top-left WALK (mid-stride), top-right IDLE (weight on both feet, slight sway), bottom-left HIT (recoil, head back, limbs loosened), bottom-right ATTACK (the strike described below, aimed toward the screen-bottom/front). Same character, same costume and colours in all four cells. Bosses: 4 key poses instead (anticipation, strike toward screen bottom, follow-through, recovery) like assets/r104/bosses/*-p1..p4.
- 포즈: walk = strains forward against the trailing threads; idle = tags flutter, mouth-thread tightens; hit = tags scatter, threads snap; attack = swings the bound arm as a club toward the screen bottom

### rg-seventh-trumpet — 일곱 번째 나팔 (boss, large, 우선순위 2)

- 근거: 「하늘에는 일곱 개의 나팔이 떠 있었다. 나팔의 몸통은 빈 소매를 닮았다」(2663행) / 「탄환이 기둥의 회전 고리를 멈춰 세웠다」(2675행) / 「일곱 번째 나팔은 끝까지 울리지 못했다」(2715행)
- 역할: boss · 단계: RG ascent · 대체/보강: replaces boss [cult04,c104-mid]; pillar = assets/r106/drive/link-pillar.webp · 공격: melee
- 이미지 프롬프트(영문): The largest sleeve-horn (see rd-first-trumpet) lashed by red threads to a stone pillar with a rotating iron ring, the bell pointing down at the ground, hundreds of blank name tags hanging from the mouthpiece and threads, pages of six different 'worlds' (a doll, a ledger, a dobok strip, a receipt, a glass, a casing — tiny, in silhouette) caught in the threads; palette grey cloth, iron, red thread, parchment dark-fantasy painted character art, matching the StoryWorld R7 pose pack (r7-out/poses): full body, 3/4 view facing screen-left, isometric ARPG scale, soft rim light, muted desaturated palette with one accent colour, transparent background, no text, no logos, no watermark, feet on a flat ground contact point. Deliver as a 2x2 pose sheet on one transparent PNG (each cell 512x512, same scale and same ground line in every cell): top-left WALK (mid-stride), top-right IDLE (weight on both feet, slight sway), bottom-left HIT (recoil, head back, limbs loosened), bottom-right ATTACK (the strike described below, aimed toward the screen-bottom/front). Same character, same costume and colours in all four cells. Bosses: 4 key poses instead (anticipation, strike toward screen bottom, follow-through, recovery) like assets/r104/bosses/*-p1..p4.
- 포즈: keyposes = ring spins up and threads tighten (anticipation) / bell drops and blasts a ring toward the screen bottom (strike) / tags whirl outward (follow-through) / ring slows, horn sags (recovery)

### m-michaela-knot — 미카엘라 (방벽의 매듭) (boss, large, 우선순위 1)

- 근거: 「방 한가운데 미카엘라가 서 있었다. 그녀는 기억 속의 흰 가운을 입고 있었다」(2891행) / 「검은 뿌리와 강철 군단의 잔해가 그녀의 몸을 감싸며 방벽을 이루었다」(2912행) / 「문에서 손을 떼지 못하도록 손목까지 묶어 놓은 매듭이었다」(2940행)
- 역할: final boss (presentation: the hittable form is the barrier knot in front of her) · 단계: M ascent · 대체/보강: replaces boss [kair02,kair-great-03]; base face/hair on assets/heroes/normalized/directions/michaela-*.webp but in a plain white doctor's coat, not armour · 공격: melee
- 이미지 프롬프트(영문): A psychiatrist in a plain white doctor's coat (dark hair tied back, matching the michaela hero face), standing with both arms spread wide toward doors behind her, wrists bound by a black knotted cord that runs to the doors; in front of her a swirling barrier made of castle-wall stones, giant clock hands, black tree roots and broken steel-legion armour forms the actual 'boss body'; palette white coat, warm skin, black cord, stone grey, brass clock hands, no weapon dark-fantasy painted character art, matching the StoryWorld R7 pose pack (r7-out/poses): full body, 3/4 view facing screen-left, isometric ARPG scale, soft rim light, muted desaturated palette with one accent colour, transparent background, no text, no logos, no watermark, feet on a flat ground contact point. Deliver as a 2x2 pose sheet on one transparent PNG (each cell 512x512, same scale and same ground line in every cell): top-left WALK (mid-stride), top-right IDLE (weight on both feet, slight sway), bottom-left HIT (recoil, head back, limbs loosened), bottom-right ATTACK (the strike described below, aimed toward the screen-bottom/front). Same character, same costume and colours in all four cells. Bosses: 4 key poses instead (anticipation, strike toward screen bottom, follow-through, recovery) like assets/r104/bosses/*-p1..p4.
- 포즈: keyposes = barrier gathers and clock hands rise (anticipation) / stones and roots crash toward the screen bottom while she turns to look back at the doors (strike) / barrier scatters (follow-through) / she lowers her arms slightly, knot visible (recovery). She never strikes with her own body.

## 4. 맵·날씨 보정 요약 (samong-maps-r105.js BP / art-drive-r105.js PLAN)

- **S-01** (`samong-maps-r105.js BP['S-01']`): ascent: checker black/white floor tint, porcelain-crack wall tint 0x6b4b52, 2-3 gothic chairs along the workbench table / maze: domestic wall texture instead of forge
- **S-02** (`BP['S-02']`): survival: wet-night sheen; keep stone/dead trees / maze: chalk-line decals optional
- **S-03** (`BP['S-03']`): maze: weather RAIN (outdoor stone, 23-years-ago alley) / survival: half the braziers unlit; strict grey palette / ascent: tent cloth props if available
- **S-04** (`BP['S-04']`): indoor; rain ambience at entry only / ascent: 16 crates -> gothic chairs, mirror prop at the dais
- **S-05** (`BP['S-05']`): survival+maze: SNOWFALL (snow family exists since R107) / ascent: grey ash/paper flakes + window fire glow (keyed window prop exists)
- **S-06** (`BP['S-06']`): survival: RAIN + searchlight sweeps over the coast/sea / ascent: suspended raindrops (non-falling sparkle), 17 ring obelisks
- **S-07** (`BP['S-07']`): single candle light at the table; purple tint ok; manet-mirror as the 거울상
- **RA** (`BP['RA']`): ascent outdoor.family 'ash' -> 'snow' (text stays on the snowfield) / maze+ascent: SNOWFALL + black-sun disc; 3-4 more sunflower gurneys
- **RB** (`BP['RB']`): maze+ascent: burning-snow ember particles (orange) instead of plain snow; fire-door glow at top landing / survival: two gothic chairs + three cups (well) at centre
- **RC** (`BP['RC']`): maze: RAIN indoors (text explicit) / ascent: gold/wax palette, gilded chairs, chandelier braziers; consider 종이 왕 as the ascent antagonist
- **RD** (`BP['RD']`): survival: red-tinted bridge railing, lotus glow, water mist / maze: wet floor sheen
- **RE** (`BP['RE']`): chandelier light props; keyed chandelier that darkens at boss hp<50%
- **RF** (`BP['RF']`): keep; chair-with-cushion trap marker optional
- **RG** (`BP['RG']`): survival+maze: black-sun sky, falling paper/needle flakes; maze floor whitened toward 0x8a8488 (여백) / ascent: rotating ring fx at the link-pillar
- **M** (`BP['M']`): survival: starry night sky over the garden / ascent: empty picture frames, white light at the far door

## 5. 미검증
- GPU/phone/natural play not verified (headless-free but background tab, test-aid only)
- the light-blue bolt was inferred from ai='hybrid' + ranged3/enemyShot(VFX.bolt); no shot was captured in the 9 s window because the maze walls blocked clearLine — the owner's report confirms it in play
- boss key-pose pivots must be measured after generation