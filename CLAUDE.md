# StoryWorld (m0) — 작업 운영 기준

이 저장소는 HAPIL StoryWorld 게임 클라이언트(`r96/`)다. `main` 병합 시 GitHub Pages(https://kjb7876-lang.github.io/m0/)가 자동 배포된다.
아래 기준은 사용자(죠죠)가 2026-10-27 작업 지시에서 정한 운영 기준을 요약한 것이다. 사용자가 스레드에서 달리 말하면 그 말이 우선한다.

## 시작 전
- 환경·사용 가능한 스킬·저장소 상태를 먼저 확인한다. 브랜치는 `claude/<라운드>-<주제>`로 `main`에서 새로 만든다.
- 단계마다 쓰는 스킬·도구를 1~3개 밝히되 사용자에게 물어보지 않고 진행한다.
- 원본 소스·세이브·음원·자산·백업을 보존한다. 기존 자산을 지우거나 덮어쓰지 않고 오버레이(`r96/client-source/*.js`)로 덧붙인다.

## 빌드 파이프라인
1. `r96/client-source/*.js` 수정.
2. `python3 scripts/sync-r99.py <새 js 이름…> <새 자산 경로…>` — 새 파일(js·이미지)은 반드시 인자로 넘겨야 `runtime-inputs.json`/`runtime-manifest.json`에 들어간다.
3. `rm -rf /tmp/site-old && mv r96/hospital-three-pc/site /tmp/site-old && python3 scripts/build-r96.py`
4. 새 스크립트는 `r96/runtime-text/index.html`의 스크립트 태그와 `scripts/verify-r96-public.py`의 기대 목록에도 추가한다.

## 디버깅 원칙
재현 → 증거 수집(로그·스크린샷·상태값) → 가설 → 최소 수정 → 재검증. 파일 수정 성공, 빌드 성공, 실행 성공, 배포 성공을 구분해 보고한다.

## 검증
- CPU/정적: `node r96/qa/r103/samong-cpu-check.cjs`, `node r96/qa/r104/bosses-cpu-check.cjs`, `node r96/qa/r105/samong-maps-cpu-check.cjs`, 전체 `python3 scripts/prepare-r96-ci.py; python3 r96/scripts/prepare-handoff-baselines.py; node r96/qa/r95/run-full-suite.cjs`(약 25분).
- 브라우저: 정적 서버(`python3 -m http.server 4396`)에 빌드 결과를 올리고 Playwright로 순회·스크린샷. 헤드리스 결과를 "그래픽 검증 완료"라고 쓰지 않는다. GPU·실기기 모바일·자연 플레이는 별도 항목으로 보고한다.
- 검증하지 못한 항목은 "미검증"으로 남긴다. 테스트를 건너뛰거나 비활성화해 통과시키지 않는다.

## 서사·자산 규칙
- 정본 텍스트는 R106부터 개선본(합일몽세_여섯빛깔의묵시록_1인칭독백_문장개선본, sha256 369c6a25…, `story-source/hapil-canon-r106-improved.txt`)이 기준이다(이전: 고딕호러 최종통합본 7347b521…). 새 개선본이 오면 `scripts/build-story-canon.py`·`scripts/build-samong-text.py`로 다시 만든다. 편집메모는 해석 참고용이며 게임 안 사건·엔딩 후 해설로 넣지 않는다.
- 사용자가 확정한 서사·밸런스·맵 순서를 임의로 바꾸지 않는다. 지역 이름·보스 설정을 지어내지 않는다.
- 드라이브·HAPIL 자산은 읽기 전용 재사용 원천이다. 자산은 원본·경로·해시·크기·용도·적용 여부를 표로 남기고, 임시 그림을 최종 아트라고 보고하지 않는다. 다운로드가 실패했으면 받았다고 쓰지 않는다. 관련 없는 개인 드라이브 자료는 쓰지 않는다.
- 디아블로 등 외부 게임의 원본 스프라이트·음원·UI·코드를 추출·재배포하지 않는다. 엔진을 바꾸지 않는다.

## GitHub·배포
- 드래프트 PR → CI 통과 → 사용자 승인 → `main` 스쿼시 병합 → Pages 배포 SHA와 공개 URL(`scripts/verify-r96-public.py`) 확인. 병합·공개 배포·공유 범위 변경은 사용자 승인이 있을 때만 한다.
- 커밋·PR 본문에 모델 식별자를 넣지 않는다.

## 전달·보고
- 전달 ZIP은 개당 3,000,000바이트 이하로 나누고 SHA-256 목록·파일 목록·README·자산 적용표·미검증 목록을 함께 둔다. ChatGPT Library에 새 파일을 올리거나 기존 파일을 삭제·공유 확대하지 않는다.
- 최종 보고에는 완료한 작업과 동작 변화, 사용한 스킬·도구, 실행한 검사와 결과, 커밋 SHA·PR·CI·배포 링크, 남은 문제와 미검증 항목(예정/진행 중/완료/실패/미실행), 사용자가 할 정확한 단계를 적는다.
- 권한·보안·샌드박스 거부, 유료 API·새 비용·인증정보 생성이 필요하면 그 단계만 멈추고 정확한 필요 사항을 보고한다. 유료 결제는 하지 않는다.

## 작업 학습 메모(세션에서 확인한 함정·요령 — 사용자 2026-11-01 "유용한 건 따로 기억해서 저장")
- **빌드 연결**: 새 오버레이는 `runtime-text/index.html` 스크립트 태그(combat-r118·world-tiles-r118 가 맨 끝), `qa/r176` 순서 정규식, `scripts/verify-r96-public.py` 기대 목록, `.github/workflows/pages.yml` CPU 검사 줄, `sync-r99.py <새 파일>` 다섯 곳 모두에 넣는다. `r96/qa` 는 gitignore 라 `git add -f`. sync 후 `runtime-manifest.json`·`runtime-inputs.json` 충돌은 손으로 고치지 말고 `--ours` 로 고른 뒤 **main 에 새로 들어온 파일(js·자산)을 sync 인자로 함께 넘겨** 다시 돌린다(인자 없이 돌리면 main 쪽 새 파일이 목록에서 빠진다 — R195 병합 때 R196 파생본이 빠졌던 일). pages.yml 충돌은 양쪽 검사 줄을 모두 남긴다.
- **Three.js 기록기 CSS filter**: brightness·contrast·saturate·grayscale·hue-rotate 만 된다. `drop-shadow`·`blur` 를 게임 ctx.filter 에 쓰면 Three.js 가 Legacy 로 떨어져 화면이 검게 된다(오프스크린 캔버스에는 써도 됨).
- **렌더러 render 감싸기**: perf-r97 이 렌더러 인스턴스에 render 를 복사해 두므로 prototype 만 감싸면 스크립트 순서에 따라 안 탄다 → 인스턴스 render 도 같이 감싼다(R186·R188 wrapInst).
- **몹 그림 사슬**: 엔진 drawEnemy 는 `__STORYWORLD_STORY_COMBAT_R54__.frameFor(e,fallback)` 로 그림을 고른다. R92·R109·R116 덧씌우기는 hp>0 일 때만 바꾼다(R188 이 죽음까지 이어 줌).
- **R163 pixelfx `hit-flash` 시트는 섬광이 아니라 작은 인형(치비) 그림** — 쓰지 않는다. 시트는 쓰기 전에 반드시 이미지로 열어 본다.
- **문자열 검사 함정**: 'outdoor' 안에 'door' 가 있다 — 낱말 경계 정규식을 쓴다.
- **길잡이 난이도**: R77 `takeNextNormal` 은 원래 늘 'normal'(R189 가 지금 지역 난이도·설정값으로 바꿈). 지금 지역 난이도는 `room.difficultyR63`. `mapMode`·`setMapMode` 는 클로저 안이라 전역이 아니다.
- **진행 구조**: 이 캠페인은 `room.exits` 포탈이 아니라 제단(`room.altar`)·R81 문(door-0 보스 구역·door-1 앞방·door-2 다음 구역, `worldR74.doors`, 닫히면 `blocked()` 가 막음)으로 넘어간다.
- **탐색용 헤드리스 도구**: 스크래치패드 `lag/lib2.mjs`(boot → 777 → go(zone)), 포트 4410 정적 서버(`srv/m0` → site 심볼릭 링크). 서버가 컨테이너 재시작으로 죽으면 다시 띄운다. `window.tick=undefined` 같은 전역 덮어쓰기는 게임을 망가뜨린다.
- **병합 API**: 드래프트 PR 은 ready 로 바꾼 뒤 병합, expectedHeadSha 는 40자 전체.
- **Drive 정기 확인**: HAPIL-* 는 다른 게임이라 건너뛰고, review·WIP·COMPARISON·PRIVATE·INCOMPLETE 묶음은 보류한다.
- **지형 메시 숨기기**: 엔진(벽 가림·R188)이 spatialRoot 메시의 `visible` 을 매 프레임 다시 켠다 → 숨길 땐 `layers.mask=0`(원래 값 기억). 프레임 명령은 render 감싸기에서 `frame.commands` 를 걸러 뺀다(R204).
- **충돌 데이터**: `explorationBlocked` 는 `floorCells`+벽 AABB 만 보고 색인을 레이아웃 객체 WeakMap 에 캐시한다 → 바닥을 바꾸려면 새 레이아웃 객체로 바꿔 끼운다. `findPath` 는 칸 중심만 반지름 .29 로 묻고 대각선 모서리 깎기를 안 본다(칸 경계가 아닌 장애물을 넣으면 .29 질의에 여유를 더 줘야 길잡이가 안 걸린다, R204).
- **레이아웃 손질 위치**: 엔진 바닥·벽 덩어리(index.html loadDescriptor)는 `__STORYWORLD_EXPLORATION__.layout(id)` = R171 `layoutFor` 결과의 `floorRects`·`walls` 를 그린다. room.exploration 만 바꾸면 판정과 그림이 어긋난다 → 손질은 `layoutFor` 안(R204 훅)에서 한 번만, floorCells·floorRects·walls 를 함께 바꾼다(R219). 실내 지붕 덮개는 hospital-improvements-a5 `plan(L)` 이 floorCells 여집합으로 만든다.
