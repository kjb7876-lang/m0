# SW-0005 / R375 — 지도 확대 커널과 공격 방향 후보

Issue: https://github.com/kjb7876-lang/m0/issues/270 · 계약 revision 3 · 기준 `54bbdf1c3e2b94d95063d36e783cfa96c45ab381`

**전체 사용자 요청은 아직 미완료다.** 이 변경은 독립 방향 수정 소스와 확대 지형 계산 커널을 검토용으로 제공한다. 기본 게임에는 새 스크립트를 등록하지 않았으며, 맵 확대는 자동 활성화되지 않는다. 병합·공개 배포·유료 API·원본 자산 변경은 실행하지 않았다.

## 구현한 범위

- `enemy-facing-r375.js`: R208/R200 교체 시트와 R109의 검토된 방향표에 속한 프레임이 확정된 근접·원거리 공격각을 따른다. R54의 발사/회복 시계도 사용한다. 평상시에는 플레이어 방향을 사용하며, 수직 부근은 이전 방향을 유지한다. 임시 렌더링 공격 `storyWorldPose5`는 조준 근거에서 제외한다.
- R248 직접 몸체 그리기에 선택적 `uniqueFace` 훅을 추가했다. 이 경로는 R51.flip을 거치지 않으므로 별도 연결이 필요하다. 죽은 몹·고정 타워는 기존 처리를 유지한다.
- R109에는 기존 `STRIP_FACE` 표의 방향 조회 API만 추가했다. 확인된 82개 표 항목을 재사용하며 새로운 자산 방향을 추정하지 않는다.
- 기존 R53 병원, R54, Persona 및 명시적 8방향 프레임의 소유권을 보존한다. 공격 원점·범위·발사체·부채꼴/방사형 패턴·공격각은 바꾸지 않는다. 공격 중 플레이어가 넘어가도 이미 표시한 공격을 재조준하지 않는다.
- `world-scale-r375.js`: 기존 지형을 새 객체로 변환한다. 가로·세로·통로·방·배치 메타데이터는 2배, 정수 바닥 한 칸은 네 칸으로 바뀐다. 원본 객체 및 WeakMap 충돌 캐시를 변형하지 않는다. 원본을 펼쳐 새 객체를 만드는 후속 생성기를 잘못 건너뛰지 않도록 변환 여부를 외부 WeakMap/WeakSet에 보관한다.
- 문 중심만 확대하고 폭·두께·상호작용 거리·ID·개폐 상태는 유지한다. 넓어진 개구부 양옆에는 벽을 추가한다. 사몽은 공개 layout에 문 폭이 없으므로 `Z.carve(canonicalZone).doors`를 명시적으로 전달해야 한다. 폭을 모르면 오류를 내며 추측해서 확장하지 않는다.
- `scaleZone`는 확대된 dress/tick/navGoal 좌표 정의를 만든다. 지형 생성은 원래 정의에서 수행해야 carve의 최소 통로 폭·패딩·원형 방 래스터 계산 때문에 정확한 2배에서 벗어나지 않는다.
- 후속 `R375-geometry-2`는 새 layout의 rects와 각 벽의 두께를 읽는 `hospitalPhysics`를 제공한다. 점·이동 선분·벽 끝 충돌을 계산하며 문을 연 새 layout은 별도 캐시를 쓴다. 확대된 양옆 벽이 실제 문 통과 폭을 줄이는 문제를 찾아 문 주변 두께도 원래 규격으로 유지했다.
- `encodeSaveCoordinates`는 명시적으로 선택한 방/좌표 집합만 원래 단위로 저장한다. `restoreCoordinatePlan`은 기존 검증기를 통과한 좌표를 적용할 별도 계획을 만든다. 일반 적·홈 위치·챔피언·소환수·포인트 드롭·사몽 checkpoint·EGO 방문을 구분한다. 저장 형식은 바꾸지 않으며 실제 저장/복원 함수를 감싸거나 배우를 이동시키지 않는다.

## 아직 연결할 수 없는 부분

[`AGENTS.md`](../../AGENTS.md)의 “같은 파일을 다른 에이전트가 고치는 중이면(열린 PR 확인) 손대지 않는다” 규칙에 따라, 열린 PR #217/#205 등이 변경하는 runtime index/manifest/inputs/검증 목록/Pages workflow는 수정하지 않았다. 승인 요청을 반복하지 않았고, 독립 소스·검증·draft PR까지 진행했다. 통합 담당자가 파일 소유권을 조정한 다음 아래 작업을 이어가야 한다.

1. 기본 `StoryPhase1` 생성, R171 최종 지형, 사몽 내부 캐시의 세 경계에 확대 처리를 함께 연결한다. 기본 배우/소품 좌표는 native 안전 배치 이전에 변환하되, 이미 확대된 anchor에서 생성된 배우를 다시 곱하지 않는다.
2. 병원 `dist/phase1.js` 내부 `hospitalCoreContainsB2`는 closure의 원래 rects를 참조한다. 독립 `hospitalPhysics`로 확대 입구 `(86,218)` 및 문/벽 판정은 검사했지만, 실제 이동·발사체·내비게이션의 캡처된 함수 참조에는 아직 연결하지 않았다. 뒤늦게 전역 API만 바꿔도 기존 closure와 `safeMove`가 계속 옛 판정을 쓴다. 현재 커널 출력만 기본 엔진에 넣으면 여전히 병원 판정이 맞지 않는다.
3. 병원 경로 전역·`player.y<104` 분기, V4 보스 고정 배치, 보스 장판 `3..27` clamp를 같은 좌표계로 맞춘다. 사몽 163개 구역의 정의 참조와 내부 캐시도 같이 연결한다.
4. 원래 단위로 저장하는 함수와 별도 복원 계획은 구현·단위 검사했다. 실제 복원 트랜잭션에는 기존 검증 → 해당 방/비동기 사몽 stage 준비 → ID/group/방문 일치 → 충돌 확인 → 계획 적용 순서가 필요하다. 내부 복원 wrapper가 중간에 저장하는 경계도 조정해야 한다. 단순히 저장 전체를 2배 하면 기존 clamp와 챔피언 ±200 검증에 걸린다. 예전 문 옆 저장 위치는 새 문틀에 겹칠 수 있어 자동으로 반대편에 옮기지 않는다. **확대 맵의 실제 이전/신규 저장 왕복은 미통합·미검증이다.**
5. 새 소스 등록·sync·전체 빌드·전체 회귀·독립 통합 검토·실제 확대 맵 플레이를 완료한다. 공통 파일에 적용할 patch를 자동으로 실행하거나 소유권 규칙을 우회하지 않았다.

자세한 생성/저장/문 경계는 [통합 조사](../../r96/qa/r375/evidence/map-integration-audit.md)에 기록했다. 이 조사 문서는 초기 커널 검토도 포함하며, 지적한 polygon·출구·거점·branches·edges·수직 병원문 표현은 최종 커널 및 합성 회귀 검사에 반영했다.

### 기존 PR 후속 점검

열린 PR을 다시 조회했다. `runtime-inputs.json`·`runtime-manifest.json`은 #228/#217/#205/#108, runtime `index.html`과 공개 검증 목록은 #217/#205/#108과 겹친다. `sync-r99.py`는 모든 소스 복사 후 두 manifest를 함께 쓴다. runtime 복사만 하면 해시 검사가 실패하며, 파일을 우회 등록해 정상 빌드를 만들 수 없다. 해당 공통 파일은 변경하지 않았다. [소유권 조회](../../r96/qa/r375/evidence/followup/open-pr-ownership.json), [읽기 전용 동기화 진단](../../r96/qa/r375/evidence/followup/sync-plan.json).

후속 검사 `node r96/qa/r375/hospital-save-cpu-check.cjs`는 **40/40 PASS**다. 실제 병원 8가지 문 상태, 원본 판정과 40,110개 지점 대조, 5개 충돌 반지름으로 문 통과 폭 6,615개 대조, 닫힌 문/문틀 접합, 고속 이동·벽 끝·접선·반개구간 경계, 좌표 왕복 및 잘못된 방문 ID를 포함한다. 이 검사는 독립 helper에 대한 것이며 native 저장 복원 성공을 뜻하지 않는다. [결과](../../r96/qa/r375/evidence/followup/hospital-save-result.json), [저장 형식 조사](../../r96/qa/r375/evidence/followup/save-coordinate-schema.md), [병원 검토](../../r96/qa/r375/evidence/followup/hospital-review.md), [저장 검토](../../r96/qa/r375/evidence/followup/save-review.md).

지형 657/657, 방향 16/16, R109·R355·R267·R103·R104·R105 및 계약 검사를 재실행해 모두 통과했다. [후속 명령·종료 코드](../../r96/qa/r375/evidence/followup/regression-results.json). R248/runtime 불일치와 전체 빌드 실패 원인은 남아 있다. 동기화 파일을 바꾸지 않았으므로 같은 대용량 로컬 빌드는 반복하지 않았다.

별도 수직문 열림/닫힘 fixture의 점·선분 대조 4,410건도 통과했다. [재현 스크립트](../../r96/qa/r375/vertical-door-review.cjs), [결과](../../r96/qa/r375/evidence/followup/vertical-door-review-result.json). 이번 보조 검토는 공식 통합 담당자의 최종 승인과 별개다.

CPU profile에서 벽 후보 목록을 매번 모으는 비용이 커서 layout별 최대 1,024개의 작은 bucket 질의만 캐시했다. 같은 최종 지형·native A*의 단일 비교에서 모든 문 닫힘은 1,679→1,380ms, 모두 열림은 588→409ms였다. 두 경우 모두 경로와 콜백 호출 수가 동일했다. **아직 실시간 길찾기에 긴 지연이며 성능 통과가 아니다.** 도달 불가 영역 판별·경로 재사용/탐색 예산 등 내비게이션 통합 검토가 더 필요하다. 브라우저 FPS·실기기 측정은 미실행이다. [재현 가능한 CPU 비교](../../r96/qa/r375/hospital-profile.cjs), [측정](../../r96/qa/r375/evidence/followup/hospital-profile.json).

## 보스 자산 한계

R104 교체 45세트는 정면/화면 아래 공격 키포즈이며 방향별 메타데이터와 뒤쪽 그림이 없다. 좌우 반전만으로 모든 방향을 만들 수 없다. `dist00-boss`, `mb-ep1a07`에는 기존 옆방향 공격 그림이 있지만, 상태별 교체 검증 없이 일괄 fallback하지 않았다. 병원 `mb-ep1a08`의 실제 R53 앞/뒤 시트는 보존한다. 보스를 모두 블링크시키거나 전체 몸을 회전시키지 않았다.

[45세트 목록](../../r96/qa/r375/evidence/r104-direction-inventory.json), [기존 자산 검토](../../r96/qa/r375/evidence/r104-direction-support.md). **모든 보스의 모든 방향 개선 완료라고 볼 수 없다.** 필요한 방향 그림은 기존 협업 자산 절차로 보완해야 한다.

## 실행한 검사

| 명령 / 범위 | 실제 결과 |
|---|---|
| `node r96/qa/r375/enemy-facing-cpu-check.cjs` | 16/16 PASS. 고정각·좌향 자산·수직 deadband·임시 pose·R248 실제 draw 경로·저장 필드 불변 |
| `OUT=... node r96/qa/r375/world-scale-cpu-check.cjs` | 657/657 PASS. 실제 R115/R355 생성기와 phase1 충돌 사용. 16장·163구역, 2배 bounds/4배 바닥, 목표·단서·문 통과, 합성 잠긴 문/수직 병원문/메타데이터 |
| `OUT=... node r96/qa/r375/enemy-facing-browser.cjs` 및 `MOBILE=1 ...` | PC·모바일 에뮬레이션 각각 7/7 PASS. 실제 R208 ember-hound 시트의 최종 flip·동일 좌표/프레임/각도·기존 저장 복원 대조·pageerror 0 |
| 브라우저 내 64 native 지역 ID × STORY/DREAM | 각 128개 지형을 오프라인 변환하여 bounds 2배/바닥 4배 확인. 순차 캠페인 플레이 검사가 아님 |
| `python3 -I scripts/collab/test_validate.py` / `validate.py all` / `validate.py task ...task-contract.json` | 25개 단위 검사 및 계약 검사 PASS |
| R109 / R355 / R267 / R103 / R104 / R105 CPU | 각각 54/54, 1022/1022, 21/21, 42/42, 10/10, 26/26 PASS |
| `node r96/qa/r248/r248-cpu-check.cjs` | **FAIL**. 앞의 기능 검사 13개 PASS 후 runtime copy 일치 검사 실패. 실패 출력기가 undefined detail에 `.slice()`를 호출해 TypeError도 발생. 검사를 수정·비활성화하지 않음 |
| `python3 scripts/build-r96.py` — 기준 커밋 | PASS. 4,906파일, 949,664,614 bytes, manifest `e6db128c…` |
| 같은 빌드 — 변경 후보 | **FAIL**. `scripts/build-r96.py:43`, `AssertionError: mobs-r109.js`. 공통 runtime sync/등록 미완료 |
| 전체 R95 약 25분 회귀 / 물리 GPU / 실기기 / 자연 플레이 | 미실행. 후보 전체 빌드가 미통합 상태이므로 통과로 기재하지 않음 |

후속 사몽 커널 실행은 최대 15,568 바닥 칸, 163구역 변환 합계 약 578ms였다. 단일 실행 CPU 측정이며 렌더 FPS나 모바일 성능 보장이 아니다. 실제 병원 표본은 8,022→32,088 바닥 칸이다.

방향 후보 저장 복원은 기능을 끈 대조군과 같았다. PC는 원래 위치도 복원했다. 모바일은 후보와 대조군 모두 `(55.5789,49.4904)`에서 입구 `(57.5,57.5)`로 이동했다. 기존 복원 동작과 같다는 검사이며 위치 복원 문제가 해결됐다는 뜻이 아니다. 확대 맵 저장 검사는 별개로 남는다.

브라우저는 정상 기준 빌드에 변경 소스를 route로 주입했다. API·화면을 실제로 실행한 증거이나, 기본 배포 런타임 등록 또는 CI 통과를 대신하지 않는다. 같은 위치/시간에서 기능 off/on을 비교한 배치 fixture이며 화면의 맵은 원래 크기다.

## 7분야 시각 검토

각 검토자가 PC·모바일 전후 네 장을 직접 확인했다. 단일 ember-hound 공격 표본의 임시 점수이며 전체 작업 승인과 다르다.

아래 스크린샷과 시각 점수는 이전 커밋 `7d945a3`의 방향 표본이다. 후속 변경은 해당 방향 소스에 손대지 않았으나, 새 병원 문 주변 지형 및 전체 확대 맵의 시각 통과 근거로 재사용하지 않는다.

| 미술 | 연출 | 카메라·구도 | 공간·환경 | 조명·색채 | 애니메이션·VFX | UX·레벨 | 평균 |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 8.1 | 7.8 | 7.5 | 8.0 | 8.2 | 7.95 | 8.0 | **7.936** |

UX 8.1 / 레벨 7.9를 해당 분야 평균 8.0으로 집계했다. 표본 평균은 7.77 초과다. 공통 지적은 모바일에서 왼쪽 머리·앞발이 전경 윤곽·석재와 겹친다는 점이다. 정지 화면에는 최초 조준→플레이어 횡단→타격/회복 과정이 없어 연속 전투 검증이 필요하다. 색상·자산을 바꾸라는 필수 요구는 없었다. 맵 확대·전 보스·실기기는 검토 통과 대상에서 제외했다.

| PC 전 | PC 후 | 모바일 전 | 모바일 후 |
|---|---|---|---|
| [before](../../r96/qa/r375/evidence/pc-before.webp) | [after](../../r96/qa/r375/evidence/pc-after.webp) | [before](../../r96/qa/r375/evidence/mobile-before.webp) | [after](../../r96/qa/r375/evidence/mobile-after.webp) |

이미지는 PNG→무손실 WebP로 변환한 뒤 RGBA 픽셀 일치를 검증했다. 크기 조정·보정은 하지 않았다. 원본/전달 파일 SHA는 [스크린샷 목록](../../r96/qa/r375/evidence/screenshots.json), 실제 사용 자산 해시는 [재사용 목록](../../r96/qa/r375/evidence/asset-reuse.json)에 있다.

## 검토·인계

- 독립 방향 코드 검토에서 발견한 임시 pose 우선순위와 초기 수직 deadband 두 문제를 수정하고 재검토했다. [기록](../../r96/qa/r375/evidence/enemy-facing-code-review.md).
- 사용한 기준: [`game-ai`](../../.claude/skills/game-ai/SKILL.md), [`storyworld-art-style`](../../.claude/skills/storyworld-art-style/SKILL.md), [`ecc-e2e-testing`](../../.claude/skills/ecc-e2e-testing/SKILL.md), [`threejs-debug-profiler`](../../.claude/skills/threejs-debug-profiler/SKILL.md), 관리 환경 runtime 점검. 도구: 로컬 JS/VM, Python, Chromium/Playwright, GitHub 연결. 새 결제나 키는 없다.
- 다음 실행 주체는 통합 담당자다. 공통 파일 소유권 조정 → 생성/충돌/저장 경계 구현 → sync/등록 → 빌드/회귀 → 확대 맵/연속 전투 검증 순서로 진행해야 한다. 이 draft를 그대로 병합하거나 배포하면 안 된다. 사용자에게 같은 이슈 생성 승인을 다시 요구할 필요는 없다.
