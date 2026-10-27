# R108 인수인계 (2026-10-27 23:35 기준)

다른 Claude 세션이 이 브랜치를 이어받아 **통합 → 검증 → PR → CI → 스쿼시 머지 → Pages 배포 → 공개 검증**까지 진행하기 위한 문서.
소유자(사용자)는 이미 "받으면 배포"로 **GitHub Pages 배포를 승인**했다. 유료 서비스·새 권한·원본 삭제는 금지. 컴퓨터 종료는 소유자가 "모든 작업 완료 시"라고 했으나 요청이 계속 추가되고 있으므로 **확인 없이 종료하지 말 것**.

## 1. 작업 위치
- 작업 트리: `C:\Users\죠죠\AppData\Local\Temp\claude\C--Users----Desktop----\25edf4f9-da27-4f18-8f37-31a2d76ef99a\scratchpad\m0` (sparse clone, `core.autocrlf=false` 필수). 이하 `M`.
- 브랜치 `claude/r108-dark-fantasy` (main 03d80ce = R107 PR #38 머지본에서 분기). 원격 https://github.com/kjb7876-lang/m0 , 공개 https://kjb7876-lang.github.io/m0/
- 커밋하지 말 것: `r96/hospital-three-pc/site/`(빌드 산출물), `r96/hospital-three-pc/portable-node|source-patch|LOCAL-SERVER.cjs|START.cmd`, `r96/handoff/`, `r96/scripts/`, `r96/build-result.json`.
- 개발 도구 사본: `scripts/dev-r108/` (dev-server.cjs, helpers.js = window.QA, proc_fx.py, proc_portrait.py, hero-refs/). 원본은 scratchpad `tools/`.

## 2. 소유자 요청(R108) 체크리스트
| 요청 | 담당 파일 | 상태 |
|---|---|---|
| 손전등 미로 구역 넓히기(미로 너무 촘촘) | samong-r103.js, samong-maps-r105.js, polish-r100.js (MAZE 작업자) | 작업자 진행 중, 트리에 수정본 있음 |
| 사몽/역행 맵·몹 서사 적합성 문서→자산 | `scratchpad/narr/spec.json, spec.md` (NARR) → 2차 작업 | 문서 작성 중. **S-01 '꿰맨 장미의 집'에 해골 보라검 천사 기사(l302-e1, 하늘색 투사체 던짐)가 나옴 → 서사 불일치 + 액션 부적합. 교체 필요** |
| 조형물/나무가 벽과 겹치지 않게 | placement-r108.js (PLACEMENT) | 진행 중 |
| 몹 움직임·생동감 | mobs-r108.js, polish-r101.js 하단 motion 블록 (MOBS) | 진행 중. **소유자: "꿀렁인다" → 스프라이트 sx/sy 호흡·좌우 흔들림 제거, 비행몹은 느린 상하 호버 ≤1.5%만, 피격 변형 ≤4%/0.2s** (분기된 작업자에게 전달됨) |
| 디아2 벤치마킹(전투 피드백) | d2-r108.js (D2) | 진행 중 |
| 설정 UI 간결화 + 세부조정 항목 분리, 전체 UI 깔끔 | ui-r108.js (UI, 마지막 로드) | 진행 중(36 KB) |
| 비/폭풍/눈/우박/물 생동감 | weather-r108.js **또는** weather-r108-alt.js (두 작업자) | 둘 중 **하나만** 로드(설정 id `retroSettingsR108Weather` 공유). 품질 비교 후 선택 |
| 진짜 다크판타지 + 다크에덴식 스킬 이펙트 | fx-eden-r108.js, fx-eden-data-r108.js, fx-d2s-r106.js, fx-sprites-r106.js, hero-fx-r102.js(영웅측) / fx-boss-r105.js, vfx-r98.js(적측), 자산 `r96/runtime-text/assets/r108/eden/` 12장 | 진행 중. **기본공격·스킬은 처음엔 수수하고 R102 성장 티어(0–7)에 따라 단계적으로 화려해져야 함** |
| 배경음 들리다 멈춤 | **audio-r108.js (완료, 검증됨)** + `r96/qa/r108/audio-cpu-check.cjs` | 완료 |
| 영웅 선택창 이미지 개선 | **heroes-r108.js (완료)** + `r96/runtime-text/assets/r108/heroes/<hero>.webp` | 오버레이 완료, 초상화 **hwando, seoha만 생성**(나머지 6명은 스프라이트로 자동 대체). §5 참고 |
| 사용 안 하는 창 닫아 메모리 확보 | — | 통합 시 작업자 서버(49411–49419, 49429, 49433, 49436, 49452–49454, 49517, 49585/6)와 패널 탭 정리 |
| R7 네 자세 몹 스프라이트 적용 | mobs-r7-r108.js, mobs-r7-data-r108.js (R7) | 진행 중 |

## 3. 작업자(Workflow) 상태와 주의
- 1차 워크플로 8명(maze, placement, ui, weather, mobs, d2, r7, narr) + 2차 EDEN 1명이 이 세션(원래 창)의 백그라운드로 실행 중. 창을 닫으면 작업자는 죽지만 **파일은 트리에 남는다**. 각 작업자의 보고서는 트랜스크립트 `C:\Users\죠죠\.claude\projects\C--Users----Desktop----\25edf4f9-da27-4f18-8f37-31a2d76ef99a\subagents\workflows\wf_b3f1aab5-686\agent-*.jsonl`(1차), `wf_b2f512a5-799\`(EDEN) 마지막 assistant 텍스트에서 읽을 수 있다.
- **교훈: 실행 중인 Workflow 작업자에게 SendMessage를 보내면 같은 id의 복제본이 생겨 같은 파일을 두 명이 쓴다.** weather(→ -alt 파일로 분리), mobs(원본은 검증만), narr, eden(원본은 적측만) 모두 이 상태. 통합자는 두 결과물 중 더 완성도 높은 것을 고르고, 중복 파일(weather-r108 vs -alt)은 하나만 index.html에 넣는다.
- 작업자 완료 신호: 각 파일 상단 주석에 stub 표기가 사라지고 `r96/qa/r108/<name>-cpu-check.cjs`가 생기면 끝난 것. stub(수십 바이트)인 파일은 로드하지 말 것.

## 4. 통합 절차(순서대로)
1. `cd M && git status` 로 새 js/자산 확인. stub 제거, weather 택1.
2. `python -X utf8 scripts/sync-r99.py <새 js 이름들...> <새 자산 경로(runtime-text 기준)...>` — 예: `audio-r108.js heroes-r108.js ... assets/r108/heroes/hwando.webp ...` (assets/r108/ 아래 전부; eden/, heroes/, weather/, mazes/ 등).
3. `r96/runtime-text/index.html` 스크립트 태그 추가: 모두 `<script src="./audio-r98.js">` **앞**에, 순서는 데이터 파일 → 본체, `heroes-r108.js`·`audio-r108.js`는 play-r106.js 뒤, **ui-r108.js는 맨 마지막(audio-r98.js 바로 앞)**. 그 뒤 sync 재실행.
4. `rm -rf r96/hospital-three-pc/site && python -X utf8 scripts/build-r96.py`
5. CPU 점검: `node r96/qa/r103/*.cjs r96/qa/r104/*.cjs r96/qa/r105/*.cjs r96/qa/r106/*.cjs r96/qa/r108/*.cjs` (각각 실행). r105 samong-maps LOOKS/r106 fx 테이블 핀은 새 자산 추가 시 갱신 필요할 수 있음.
6. `scripts/verify-r96-public.py` 오버레이 목록에 새 js 추가 + `assets/r108/` 접두사; `.github/workflows/pages.yml`에 r108 qa 단계 추가.
7. 시각 검증: `node scripts/dev-r108/dev-server.cjs --port 49400 --base M/r96/hospital-three-pc/site --src M/r96/client-source --assets M/r96/runtime-text` 로 띄우고 브라우저 패널에서 helpers.js를 콘솔에 넣은 뒤 `QA.start()`, `QA.zone('dist00')`, `QA.stage('S-01','maze')`, `QA.fps(6)`. 사몽 생존전 떼 장면 fps(R107 기준 ≈17fps)도 비교.
8. `git add -f r96/qa/r108/*` + 구체 경로만 add → 커밋 → push → draft PR → CI(약 25분) → 스쿼시 머지 → Pages → `python -X utf8 scripts/verify-r96-public.py`.

## 5. 영웅 초상화 마저 만들기(ChatGPT, 무료)
- 참조 PNG: `scripts/dev-r108/hero-refs/<hero>.png` (게임 내 일러스트). chatgpt.com 새 대화 → '파일 첨부' input에 업로드 → 프롬프트 → 생성 이미지(blob)를 anchor download로 받기 → `python -I scripts/dev-r108/proc_portrait.py <png> <hero> r96/runtime-text/assets/r108/heroes` (384×512 webp + meta.json 갱신).
- 프롬프트(영웅별 묘사만 교체): `Use the attached character as the reference: keep the same face, hair, costume, colors and weapon (<묘사>). Paint a dark-fantasy CHARACTER SELECT PORTRAIT: waist-up bust, 3:4 vertical, the figure facing slightly left of the viewer, dramatic low-key lighting with a faint <색> rim light, painterly textured oil-sketch style like the class selection screens of early-2000s isometric dark fantasy RPGs, muted moody palette, very dark smoky void background. Realistic proportions, not chibi, not anime-flat. No text, no frame, no logo, no watermark. Single image 1024x1536.`
- 남은 영웅: neon(검은 머리, 녹색 회로 빛 갑옷, 긴 창/장총), michaela(흰·분홍 성기사 장갑복), lauren(보라 로브, 보라 창), hunter(진홍 가죽 사수, 활/권총), slayer(검붉은 중갑, 대검), gunner(기억사수: 흰 후드 소년, 청색 펄스 라이플 — 참조는 치비 스타일이므로 "same realistic painterly style as a real person" 명시).
- 이후 `r96/qa/r108/heroes-cpu-check.cjs` 작성(8장 존재·크기 384×512·sha 일치·오버레이 가드/폴백 문자열 확인).

## 6. 검증 메모
- audio-r108: 패널 탭에서 5곡 14.47 MB 메모리 적재 확인, 지역 전환 덱이 blob에서 즉시 시작, 루프 오버랩 무음 구간 0, `audioContext.suspend()` 후 ~5초 안에 rearm→resume(실제 클릭 활성화 필요). 휴대폰 실기 검증은 안 됨.
- heroes-r108: 카드 8장 패치, 초상화 없는 영웅은 onerror 폴백으로 기존 스프라이트 표시.
- 미해결: 사몽 생존전 떼 fps(≈17), Fabric 참조 불명(사용자에게 질문 필요), r104 보스 미변경.
