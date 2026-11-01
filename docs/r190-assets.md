# R190 무료 자산·스킬 도입 기록 (2026-11-01)

원본은 스크래치패드 스테이징(저장소 밖)에서 받고, 게임에는 변환본만 넣었다. 받은 파일은 실행하지 않았다(`python3 -I` 로 이미지만 읽음, zip 경로 검사).

## 자산

| 자산 | 출처 · 저작자 | 라이선스(원본 페이지에서 확인한 문구) | 다운로드 | SHA-256 · 크기 | 적용 |
|---|---|---|---|---|---|
| Animated particle effects #2 | https://opengameart.org/content/animated-particle-effects-2 · para | "License(s): CC0" | 성공 `para_CC0_particlefx-2.zip` | 469676f3fc08509e4ec824147d179a51a9a71c380a3d0fd142cf8e30355f50f8 · 5,927,098 B | **적용**: blood_hit_01/04/08 → `r96/runtime-text/assets/r190/blood/blood-{splash,burst,death}.webp`(512² 4×4 칸 그대로, webp q92, 개별 sha256 은 `index.json`). 몹 피격·쓰러짐 피 튐(`fx-blood-r190.js`). fire_*(만화풍 밝은 주황)·teleporter_*(청백 픽셀풍)·air_bubbles·나머지 blood_hit(역할 중복)는 **제외** |
| Poly Haven mossy_cobblestone (Sơn Nguyễn) | https://polyhaven.com/a/mossy_cobblestone | polyhaven.com/license: "Our assets are all licensed as CC0" | 성공 diff/nor_gl 1k | diff 105d6209…b7d7 · 1,089,617 B / nor 32a128c9…4cc0 · 980,112 B | **미적용**: 밝은 연두 이끼 사진 질감 — 손으로 칠한 어두운 화풍과 맞지 않음 |
| Poly Haven dirty_tiles (Matterfield) | https://polyhaven.com/a/dirty_tiles | 위와 같음 | 성공 | diff 33b9caea…4958 · 585,084 B / nor 1074a89e…1d84 · 543,981 B | **미적용**: 사진 질감, 기존 병원 바닥(r74 칠한 재질)과 화풍 차이 |
| Poly Haven rusty_metal_02 (Rob Tuytel) | https://polyhaven.com/a/rusty_metal_02 | 위와 같음 | 성공 | diff adaf0943…d3d9 · 564,932 B / nor 995197a6…d97b · 403,156 B | **미적용**: 밝은 흰 바탕 주황 녹 — 너무 밝음 |
| Kenney Particle Pack / Smoke Particles / RPG Audio / Impact Sounds | kenney.nl/assets/… · Kenney | 페이지 문구 "Creative Commons CC0" | **실패**: kenney.nl 가 이 환경에서 모든 요청에 HTTP 403(자동 요청 차단). 받지 못했다 | — | 미적용(효과음 보강은 다음으로) |
| Quaternius Ultimate Monsters | https://quaternius.com/packs/ultimatemonsters.html | "License CC0" | **실패**: 내려받기가 구글 드라이브 폴더·itch 위젯뿐(직접 파일 링크 없음) | — | 3D→2D 실험 미실행(Blender 도 이 환경에 없음) |

## 스킬(.claude/skills, 원문 그대로 + LICENSE.upstream)
- awesome-gamedev-agent-skills @ 19d93f9 (Apache-2.0): performance-optimization, game-feel, game-ai, level-design, save-systems, rpg, threejs-scene-setup, create-game-assets
- threejs-game-skills @ 8286774 (MIT): threejs-debug-profiler
- 넣지 않음: threejs-qa-release(Vite·npm 설치·배포 전제), 저장소의 AGENTS.md·install.sh·threejs-gameplay-systems
- 덮어 쓰는 규칙은 `.claude/skills/README-SOURCES.md`.

## 사용자가 하면 되는 일(선택)
- Kenney 효과음·연기 묶음을 브라우저로 받아 드라이브에 올려 주면(zip 그대로) 같은 절차로 검사·변환해 넣는다.
