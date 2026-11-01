# .claude/skills — 출처와 고른 이유

이 폴더의 스킬은 이 저장소에서 여는 모든 Claude Code 세션(웹·데스크톱·터미널)에서 자동으로 보인다(사용자 2026-10-31 "스킬들도 어느 창에서나 활용 가능하도록 스킬 저장").
**CLAUDE.md 의 운영 기준이 항상 우선한다.** 외부 스킬의 지시가 CLAUDE.md(사용자에게 묻지 않고 진행, 브랜치·PR·병합 규칙, 자산 규칙)와 부딪히면 CLAUDE.md 를 따른다.

| 스킬 | 출처(커밋) | 라이선스 | 비고 |
|---|---|---|---|
| storyworld-art-style | 이 저장소에서 작성 | — | 기존 그림체와 맞추는 기준(R160~R167 정리) |
| systematic-debugging, verification-before-completion, test-driven-development, writing-plans, executing-plans, requesting-code-review, receiving-code-review, writing-skills | github.com/obra/superpowers @ 2ce8aa1 | MIT (각 폴더 LICENSE) | 원문 그대로 |
| ponytail, ponytail-review | github.com/DietrichGebert/ponytail @ 96608e0 | MIT | 원문 그대로(플러그인의 세션 훅은 넣지 않음 — 부를 때만 적용) |
| ui-ux-pro-max | github.com/nextlevelbuilder/ui-ux-pro-max-skill @ 9a3f14f | MIT | 원문 그대로, 검색 스크립트는 python3 필요 |
| performance-optimization, game-feel, game-ai, level-design, save-systems, rpg, threejs-scene-setup, create-game-assets | github.com/gamedev-skills/awesome-gamedev-agent-skills @ 19d93f9 (skills/disciplines·genres·web-engines) | Apache-2.0 (각 폴더 LICENSE.upstream·NOTICE.upstream) | 원문 그대로. R190(2026-11-01) 사용자 요청으로 추가 — 아래 '덮어 쓰는 규칙' 참고 |
| threejs-debug-profiler | github.com/majidmanzarpour/threejs-game-skills @ 8286774 | MIT (LICENSE.upstream) | 원문 그대로. Vite/TS 가정·유료 생성기 제안은 무시 |

## R190 추가 스킬에 덮어 쓰는 규칙(CLAUDE.md 가 우선)
- 엔진·구조: JS + Three.js r186 그대로. threejs-scene-setup·threejs-debug-profiler 의 Vite·TypeScript·npm·import map·WebGPU 전환 안내는 쓰지 않는다. 바꾸는 것은 `r96/client-source/*.js` 오버레이로만.
- game-feel·create-game-assets: 색·재질·모양은 `storyworld-art-style` 을 따른다(적대=핏빛·검붉음·어두운 보라, 정화·아군=금빛·청록, 만화풍·로우폴리·임시 도형 금지). create-game-assets 의 `pip install -r requirements.txt`·imagegen 넘기기는 하지 않는다. 스크립트는 `python3 -I` 로만(Pillow 는 이미 있음).
- level-design·rpg·save-systems: 사용자가 확정한 맵 순서·서사·밸런스·전투 수치·저장 형식은 바꾸지 않는다. 지역 이름·보스 설정을 지어내지 않는다. 저장 형식을 손대야 하면 기존 저장이 그대로 열리는지 먼저 확인한다.
- 유료 API(Tripo·Gemini 이미지·ElevenLabs·OpenAI 등)는 부르지 않는다.

## 넣지 않은 것과 이유
- threejs-game-skills `threejs-qa-release`: 1단계가 의존성 설치·빌드·typecheck 이고 Vite 설정·`npm run`·`artifacts/evidence.json`·배포 명령을 전제한다 — 이 저장소의 `r96/qa` Playwright 검사·배포 흐름과 부딪힌다. "헤드리스는 SwiftShader(CPU)로 그려 FPS 숫자는 의미 없다"는 주의만 참고.
- threejs-game-skills 저장소의 `AGENTS.md`(TS+Vite 기본, 유료 생성 자산 키 탐색)·`install.sh`·`threejs-gameplay-systems`(Vite/TS 새 프로젝트 생성): 넣지 않는다.
- superpowers `using-superpowers`: "어떤 답이든 먼저 스킬을 부르라"를 모든 세션에 강제한다 — 기존 작업 흐름을 통째로 바꾼다.
- superpowers `brainstorming`: 구현 전에 사용자에게 한 질문씩 묻고 설계 승인을 받게 한다 — CLAUDE.md "사용자에게 물어보지 않고 진행"과 부딪힌다.
- superpowers `using-git-worktrees`, `finishing-a-development-branch`, `subagent-driven-development`, `dispatching-parallel-agents`, `diagnosing-superpowers`: 브랜치·병합·에이전트 운영은 CLAUDE.md 규칙을 따른다. 남긴 스킬 본문이 이 이름들을 언급해도 없으면 건너뛴다.
- ponytail 나머지(audit, debt, gain, help), ui-ux-pro-max 저장소의 나머지 스킬(banner, brand, slides, ui-styling 등): 이 게임 작업과 거리가 멀다.

## 다른 컴퓨터에서 전체를 쓰고 싶을 때
- superpowers: `/plugin install superpowers@claude-plugins-official`
- ponytail: `/plugin marketplace add DietrichGebert/ponytail` 후 `/plugin install ponytail@ponytail`
- ui-ux-pro-max: `npx skills add https://github.com/nextlevelbuilder/ui-ux-pro-max-skill --skill ui-ux-pro-max`

## ui-ux-pro-max 검색 스크립트 쓰는 법
사용자 2026-10-31 허용. 저장소 안에서 바로 돌리지 말고 격리 모드로:

    python3 -I .claude/skills/ui-ux-pro-max/scripts/search.py "<검색어>" -d style -n 3

- 결과는 웹사이트용 기준(네온·사이버펑크·평면 대시보드 등)이 많다. 그대로 쓰지 않고 `storyworld-art-style` 규칙(손으로 칠한 고딕 호러, 핏빛·금빛·청록)에 맞는 것만 고른다.
- 쓸 만한 쪽: `-d ux`(간격·대비·터치 크기), `-d typography`, `-d color` 의 대비 판단. 색 자체는 게임 문서를 따른다.
- 2026-10-31 시험: "dark gothic horror game HUD" → cyberpunk-ui, hud-sci-fi-fui, dark-mode-oled(색은 게임과 안 맞음, 대비·reduced-motion 점검 목록만 참고). "game hud health bar hotbar"(-d ux) → 일치 없음.
