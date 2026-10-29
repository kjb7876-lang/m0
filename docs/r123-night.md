너는 브라우저 아이소메트릭 ARPG **StoryWorld 합일몽세**(저장소 kjb7876-lang/m0, 공개 사이트 https://kjb7876-lang.github.io/m0/)를 이어서 개선한다. 사용자는 컴퓨터를 끄고 자는 중이라 이 클라우드 세션이 혼자 8~14시간 일한다. 묻지 말고 스스로 판단해 끝까지 하고, 아침에 **쉬운 한국어로** 보고한다(한 일 · 배포한 것 · 확인 못 한 것 · 다음 할 일).

## 규칙
- 유료 서비스 금지. 배포는 승인됨(검사 통과 후 합치고 배포). 원본·저장 데이터 덮어쓰기 금지(새 파일로).
- 기존 게임을 베끼지 말 것 — 아래 참고작은 분위기·연출 원리만 빌리고 그림·지형·이름은 새로 만든다.
- 이 환경에서는 ChatGPT·Gemini 그림 생성, 로컬 Chrome, 로컬 미리보기가 안 된다. 이미 저장소에 있는 그림 자산과 코드로 그리는 연출(색·조명·안개·입자·조형물 배치·바닥 틴트)로 해결하고, 그림 생성이 꼭 필요한 곳은 보고서에 목록으로 남긴다.
- 확인 못 한 것은 확인 못 했다고 쓴다.

## 0. 먼저 할 일
- `git fetch origin` 후 PR #55(가지 `claude/r122-story`: R121 기억사수 걷기·피격 + R122 서사 최종본·읽기창·몹 동작 12종)의 GitHub 검사(StoryWorld R96 verified Pages)를 확인한다. 통과했고 권한이 있으면 squash merge 하고, 옛 PR #53·#54 는 닫는다. 권한이 없으면 합치지 말고 보고에 남긴다. 실패했으면 원인을 고쳐 같은 가지에 커밋한다.
- (갱신) PR #55 는 이미 합쳐졌다. 대신 **PR `claude/r122b-fixes`**(협동에서 걷기 교체 건너뜀·피 튀김 확대 비율, Codex 리뷰 반영)의 검사를 확인하고 통과했으면 합친다.
- 이후 작업은 main 최신에서 새 가지 `claude/r123-night` 로 한다. force push 금지.

## 빌드·검사·배포 순서
- 게임 원본은 `r96/runtime-text/index.html`, 개선은 `r96/client-source/*.js`(즉시 실행 함수로 전역 함수를 감싸는 방식). 새 js 는 `index.html` 의 `<script src="./audio-r98.js">` 앞에 태그를 넣고, `scripts/verify-r96-public.py` 6번째 줄 파일 목록에 등록한다(새 자산 폴더도 같은 줄에 `startswith('assets/rXXX/')` 로).
- `python -X utf8 scripts/sync-r99.py <새 자산 경로(assets/...)>` → `rm -rf r96/hospital-three-pc/site && python -X utf8 scripts/build-r96.py` → `for f in r96/qa/r1*/*.cjs; do node $f | tail -1; done`(모두 통과) → `git add -f` → 커밋(마지막 줄 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`) → push → PR → 검사 통과 후 squash merge → 배포 확인 `curl -s -o /dev/null -w "%{http_code}" https://kjb7876-lang.github.io/m0/<새 파일>` 이 200.
- 새 검사 파일 `r96/qa/r123/*.cjs` 를 만들면 `.github/workflows/pages.yml` 검사 단계에도 등록한다.

## 핵심 파일
- 사몽 구역 생성기 `scripts/build-samong-zones.py`(SPEC 표: 구역 이름·종류 explore/maze/combat/confront·tpl hall/tower/yard/street/arena/rooms·out 실외 계열·p 매개변수; R122 의 문단 비례 변환 remap 은 유지) → `r96/client-source/samong-zones-r115-data.js`. 구역 배치·진행 `samong-zones-r115.js`, 사몽 지도 `samong-maps-r105.js`·`samong-r103.js`, 원문 `samong-text-r103.js`.
- 바닥/벽 재질 `world-tiles-r118.js`(REGIONS: 지역/구역 id → `assets/r118/tiles/<look>.webp`, 2048x1024 왼쪽 바닥·오른쪽 벽), 조명·그림자 `cinema-r114.js`, 벽 투명 `visual-r119.js`, 이펙트 `fx-eden-r108.js`, 분위기 `world-r98.js`·`polish-r100.js`.
- 재활용할 그림: `r96/runtime-text/assets/` 아래 r104(보스)·r105(사몽)·r107·r109·r116(몹)·r117(장면 소품)·r118(타일) 등.
- 주의: 게임은 그리기를 `ctx.commands` 에 기록해 WebGL 로 다시 그린다(캔버스 drawImage 를 직접 가로채지 말 것). 지역 이동 때 그림 캐시가 비워지니 직접 불러온 그림은 없으면 다시 요청한다.

## A. 사몽 에피소드 맵을 서사에 맞게 특색 있게 (원문 해당 구간을 먼저 읽는다)
1. **S-04 감정의 탑(16층)** — 실제로 탑을 오르는 느낌: 층마다 1F~16F 표시, 위로 갈수록 좁고 어두워짐, 계단·승강 연출, 벽의 층 번호 표식, 창밖 하늘로 높이감.
2. **NS-01~NS-10 네오 서울 시간여행** — 시간을 넘나드는 느낌: 진입 때 연도 표시(원문 제목의 2189년·2174년·2196년·연도 없는 방…), 시대 전환 연출(화면 일그러짐·초록 데이터 비·시계 째깍), 기계 폐허 도시 / 초록 글자 데이터 세계 / 따뜻한 빛의 거대 나무 숲 분위기를 구역마다 교차(색·안개·조형물·바닥 틴트).
3. **S-01 꿰맨 장미의 집** — 뒤틀린 동화풍 다크 판타지(거대 찻잔·바늘·실·단추 눈 인형, 기울어진 방, 체스판 바닥).
4. **S-02 밤의 출석부(학교)·S-03·S-05·현실 구역** — 일본 호러 만화식 집착·소용돌이 이미지와 밤의 학교 공포 분위기(꺼진 복도등, 손전등 원뿔 시야, 순찰자, 문 너머 그림자).
5. **화가 구역(R-00~R-17)** — 초현실주의(녹는 시계·끝없는 회랑·떠 있는 돌)와 원문의 6화가 화풍별 색·질감 구분.
- 에피소드 하나(또는 둘)마다 검사·커밋·배포. 프레임이 떨어지지 않게 조명·입자를 아끼고, 설정에서 끌 수 있게(prefs) 한다.

## B. 전체 호러 톤
다크 판타지 핵앤슬래시 호러풍(짙은 그림자, 붉은 횃불빛, 안개, 피·녹 색감, 낮은 채도)으로 조명·색보정. 글자·HUD·영웅·몹이 잘 보이게, 성능 유지, 설정 토글.
