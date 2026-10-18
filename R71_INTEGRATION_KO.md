# R71 빌드·CI 통합 메모

## 빌드 경계

`scripts/apply-r71.py`는 배포된 R70 HTML과 렌더러의 SHA-256을 고정해 확인한 뒤, 헬스/출혈 → 난이도/보상 → 맵 소재 렌더러 HTML 캐시 키 → 렌더러 코드 순으로 메모리에서 변환을 조합합니다. R71은 기존 파일 집합과 미디어 바이트를 유지하고 `index.html`, `dist/phase1.js`, `web-manifest-r62.json`만 갱신합니다. 반복 적용, 기준본 이탈, 매니페스트 해시 불일치, 불균형한 `<script>` 태그는 빌드를 중단합니다.

기준 R70 HTML SHA-256은 `76791c87cf6b3f70d99f35aafc7dacaf3adb389f4be10081c024f8802a9aa5f5`, 렌더러 SHA-256은 `b87e0feb34c321d19e557b7d08e63b9f0744f1e28b9e7d6e2ee7ea9ca0a6ebf4`입니다. `_r70/docs`는 CI에서 동일한 오버레이 순서로 재생성하고 `scripts/r71.audit.mjs`에서 최종 매니페스트의 변경 집합과 원본 에셋을 비교합니다.

## 검증 순서

`.github/workflows/pages.yml`은 기존 R66–R70 CPU, WebGL, 매니페스트, 브라우저 회귀 검증과 R66 EGO/thread queue 회귀 단계를 R70 기준에서 그대로 실행합니다. 이 단계가 끝난 뒤 R70 기준 이동/EGO 프로파일을 먼저 수집하고, R71을 적용해 렌더러·진행도·헬스 CPU 테스트, R71 소스/매니페스트 감사, 무결성 검사를 실행합니다. 같은 Pages 실행에서 짝지은 전체 R70/R71 ABBA 성능 측정을 브라우저·native 회귀 전에 수행해, 뒤 단계의 실패가 있어도 성능 증거를 보존합니다. 이어서 R71 브라우저와 native 검증, 해시 승인 단계를 실행합니다. 모든 검증과 승인 해시 단계가 성공해야 Pages 배포가 시작됩니다.

`scripts/r71-native.browser.test.mjs`는 원본 R66 native `openGame`, `damageCase`, `hudCase`, `lifecycleCase` 및 호출부를 SHA-256으로 고정해 재사용합니다. R71/R70 간 플레이어 공격력과 실검무 타격의 비율이 각각 1.0인지 확인하고, 3개 고유 이벤트 ID·20초/EGO 4초 쿨다운을 유지합니다. R66의 R62 대비 2배 공격력·4배 타격 배수는 변경 없이 실행되는 기존 R70 게이트가 보장합니다. 보스 HUD fixture는 333/666을 검사하며, 6회 세이브/복원 수명주기는 원본대로 검사합니다. R71 QA는 HP·협동 저장/복원·R61 분신 계약을 검사하고, 구 `runLegacy()` 호출만 정확한 소스 가드 뒤 명시적으로 제외합니다. native 로그/증거는 `out/r71/native/`에 업로드합니다.

`.github/workflows/r71-validation.yml`의 push preflight는 정확한 R70 재구성/핀 뒤 R71 CPU·감사·무결성·브라우저·native 검증을 빠르게 실행합니다. 별도의 push-only `paired-profile` job은 동일한 R70 재구성과 R71 CPU·감사·무결성 검증 뒤 짝지은 전체 R70/R71 ABBA 측정을 독립적으로 실행하며 배포하지 않습니다. 자동 push에서는 기준 전용 프로파일과 Pages ABBA를 중복 실행하지 않습니다. `workflow_dispatch`의 `baseline`은 R70 기준 프로파일만 실행하고, `candidate`는 기준 및 짝지은 전체 R71 프로파일을 수행합니다. PR 트리거는 Pages workflow와 중복 실행되지 않도록 제거했습니다. 각 preflight 실행은 고유 concurrency group을 사용하며 실행 취소는 하지 않습니다. Pages workflow의 모든 기존 게이트, 성능 측정 및 배포 조건은 유지합니다. CI는 Ubuntu 22.04와 Playwright 1.56 Chromium의 샌드박스를 사용하며 샌드박스 플래그를 낮추지 않습니다.

## 배포 해시 승인

`scripts/r71-approved-runtime.json`은 아직 `pending-review`입니다. PR 검증은 후보 HTML/렌더러 해시를 기록해 측정할 수 있지만, `main` Pages 배포는 이 파일에 최종 검토된 두 해시가 `approved` 상태로 입력되어야 통과합니다. 배포 뒤에는 공개 HTML과 `dist/phase1.js`의 실제 응답 해시도 빌드 결과와 비교합니다.

## 통합 체크포인트

최근 로컬 composition은 R61 분신의 저장/복원 및 같은 맵 난이도 재선택 HP를 보정한 상태에서 HTML SHA-256 `cc7aa60090dc3b309242be00e2f473dcb5a3f03ea33920a281b5efd6436a14ad`, 렌더러 SHA-256 `54dfe20af282d237511ef6f4bb6be3fe54880ad61d82928b0114d15f58df725c`입니다. 이 값은 미배포 로컬 후보 해시이며 승인 핀이 아닙니다. 현재 PR 브랜치에는 아직 이 체크포인트의 최종 검증 결과가 없습니다. 앞선 `b6241524…` 후보는 보스 HP 비교까지 통과했지만 실제 room-enemy 타격 assertion에서 실패했으므로 그 프로파일은 중간 증거로만 보존하고 최종 승인에 사용하지 않습니다.

최근 health 수정의 로컬 CPU 회귀 모음은 25/25 통과했고, 소스/매니페스트 감사와 76개 executable inline JavaScript 구문 검사가 통과했습니다. `verify-pages-r62`의 이전 후보 결과는 1,906개 파일 hash/HEAD 검사, 276개 오디오 range 검사, 총 2,187개 요청에서 실패 0건을 보고했습니다. 해당 integrity 결과는 현재 `cc7aa6…` composition의 재검증을 대신하지 않습니다.

남은 검증은 새 `cc7aa6…` 후보를 push한 뒤의 R70/R71 전체 Pages 게이트, R71 브라우저 및 native 회귀, paired-profile/Pages ABBA 측정, 정확한 최종 해시 확인과 승인 JSON 갱신, 승인된 Pages 배포, 공개 HTML/renderer 응답 해시 검증입니다. 현재 별도 browser/native CI 증거는 없습니다. 로컬 Chromium 샌드박스 실행은 호스트 SUID helper 설정 때문에 막혀 있으며, 샌드박스 플래그를 낮추지 않았습니다. 기존 R66 브라우저 회귀 게이트는 후보 적용 전 R70 단계에서 그대로 유지됩니다.
