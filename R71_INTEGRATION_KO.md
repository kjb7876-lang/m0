# R71 빌드·CI 통합 메모

## 빌드 경계

`scripts/apply-r71.py`는 배포된 R70 HTML과 렌더러의 SHA-256을 고정해 확인한 뒤, 헬스/출혈 → 난이도/보상 → 맵 소재 렌더러 HTML 캐시 키 → 렌더러 코드 순으로 메모리에서 변환을 조합합니다. R71은 기존 파일 집합과 미디어 바이트를 유지하고 `index.html`, `dist/phase1.js`, `web-manifest-r62.json`만 갱신합니다. 반복 적용, 기준본 이탈, 매니페스트 해시 불일치, 불균형한 `<script>` 태그는 빌드를 중단합니다.

기준 R70 HTML SHA-256은 `76791c87cf6b3f70d99f35aafc7dacaf3adb389f4be10081c024f8802a9aa5f5`, 렌더러 SHA-256은 `b87e0feb34c321d19e557b7d08e63b9f0744f1e28b9e7d6e2ee7ea9ca0a6ebf4`입니다. `_r70/docs`는 CI에서 동일한 오버레이 순서로 재생성하고 `scripts/r71.audit.mjs`에서 최종 매니페스트의 변경 집합과 원본 에셋을 비교합니다.

## 검증 순서

`.github/workflows/pages.yml`은 기존 R66–R70 CPU, WebGL, 매니페스트, 브라우저 회귀 검증과 R66 EGO/thread queue 회귀 단계를 R70 기준에서 그대로 실행합니다. 이 단계가 끝난 뒤 R70 기준 이동/EGO 프로파일을 먼저 수집하고, R71을 적용해 렌더러·진행도·헬스 CPU 테스트, R71 소스/매니페스트 감사, 무결성 검사를 실행합니다. 같은 Pages 실행에서 짝지은 전체 R70/R71 ABBA 성능 측정을 브라우저·native 회귀 전에 수행해, 뒤 단계의 실패가 있어도 성능 증거를 보존합니다. 이어서 R71 브라우저와 native 검증, 해시 승인 단계를 실행합니다. 모든 검증과 승인 해시 단계가 성공해야 Pages 배포가 시작됩니다.

`scripts/r71-native.browser.test.mjs`는 원본 R66 native `openGame`, `damageCase`, `hudCase`, `lifecycleCase` 및 호출부를 SHA-256으로 고정해 재사용합니다. R71/R70 간 플레이어 공격력과 실검무 타격의 비율이 각각 1.0인지 확인하고, 3개 고유 이벤트 ID·20초/EGO 4초 쿨다운을 유지합니다. R66의 R62 대비 2배 공격력·4배 타격 배수는 변경 없이 실행되는 기존 R70 게이트가 보장합니다. 보스 HUD fixture는 333/666을 검사하며, 6회 세이브/복원 수명주기는 원본대로 검사합니다. R71 QA는 HP·협동 저장/복원·R61 분신 계약을 검사하고, 구 `runLegacy()` 호출만 정확한 소스 가드 뒤 명시적으로 제외합니다. native 로그/증거는 `out/r71/native/`에 업로드합니다.

`.github/workflows/r71-validation.yml`의 push preflight는 정확한 R70 재구성/핀 뒤 R71 CPU·감사·무결성·브라우저·native 검증을 빠르게 실행합니다. 별도의 push-only `paired-profile` job은 동일한 R70 재구성과 R71 CPU·감사·무결성 검증 뒤 짝지은 전체 R70/R71 ABBA 측정을 독립적으로 실행하며 배포하지 않습니다. 자동 push에서는 기준 전용 프로파일과 Pages ABBA를 중복 실행하지 않습니다. `workflow_dispatch`의 `baseline`은 R70 기준 프로파일만 실행하고, `candidate`는 기준 및 짝지은 전체 R71 프로파일을 수행합니다. PR 트리거는 Pages workflow와 중복 실행되지 않도록 제거했습니다. 각 preflight 실행은 고유 concurrency group을 사용하며 실행 취소는 하지 않습니다. Pages workflow의 모든 기존 게이트, 성능 측정 및 배포 조건은 유지합니다. CI는 Ubuntu 22.04와 Playwright 1.56 Chromium의 샌드박스를 사용하며 샌드박스 플래그를 낮추지 않습니다.

## 배포 해시 승인

`scripts/r71-approved-runtime.json`은 [preflight 39112456285](https://github.com/kjb7876-lang/m0/actions/runs/39112456285)의 전체 통과 결과를 검토한 뒤 `approved`로 갱신했습니다. `main` Pages 배포는 고정된 HTML/렌더러 두 해시와 실제 빌드 결과가 일치해야 통과합니다. 배포 뒤에는 공개 HTML과 `dist/phase1.js`의 실제 응답 해시도 빌드 결과와 비교합니다.

## 통합 체크포인트

최근 로컬 composition은 R61 분신의 저장/복원·같은 맵 난이도 재선택 HP 보정과 포인트 아이템의 DrawCommands 호환성 수정을 포함하며 HTML SHA-256 `de6536bca2f3860c7195b39e4f7d1397ff8db7acb1558015f14a95c1b4e16646`, 렌더러 SHA-256 `54dfe20af282d237511ef6f4bb6be3fe54880ad61d82928b0114d15f58df725c`입니다. 이 값은 d58ffc8 전체 통과 후 위 승인 JSON에 고정했으며 공개 배포는 별도 확인합니다. `cc7aa6…` 중간 후보의 8개 독립 브라우저 검사는 6개가 통과했습니다. 실제 captureVisual에서 포인트 테두리의 `strokeRect` 호출이 지원되지 않아 기존 렌더러로 되돌아갈 수 있는 문제를 확인했고, 같은 테두리를 지원되는 `beginPath/rect/stroke`로 변경했습니다. 실제 DrawCommands를 사용하는 CPU 회귀 검사를 추가했습니다. 다른 실패는 클리어 후 협동 검사 장면에서 살아 있는 원본 적을 찾던 조건이었습니다. 중간 증거는 `qa-r71/intermediate-58c979b-browser.json`에 보존합니다.

`0cd0167…` 하네스의 CI 실행 [39111040632](https://github.com/kjb7876-lang/m0/actions/runs/39111040632)는 동일한 `de6536…`/`54dfe…` 런타임에서 CPU 26/26, 소스/매니페스트 감사, 1,906개 파일 hash/HEAD·276개 오디오 range·총 2,187개 요청 무결성 검사를 통과했습니다. 브라우저는 8개 중 7개를 통과했으며, 남은 협동 검사는 실제 API에 없는 검사 코드의 `c.tick` 호출에서 중단됐습니다. 실제 전역 `tick`과 호스트 상호작용 입력을 사용하도록 검사만 보완했고, 병원 전환도 native epoch/완료 기록까지 기다립니다. 첫/두 번째 협동 저장 import의 전체 6개 적 행은 같고 입력 변형은 없었지만, 마지막 hard 비교와 부활 이후 병원 검사는 그 실행에서 완료되지 않았습니다.

같은 실행의 R71 native 검사는 브라우저 실패와 독립적으로 실행되어 통과했습니다. 원본으로 고정한 실검무 타격·EGO 쿨다운, 데스크톱/모바일 보스 HUD, 6회 저장/복원 회귀 결과를 `qa-r71/intermediate-0cd0167-browser-native.json`에 보존합니다. 두 검사를 순차 실행한 뒤 상태를 합산하므로 어느 하나라도 실패하면 전체 단계가 실패합니다. 이 중간 결과는 출시 승인이 아닙니다.

하네스 후보 `d58ffc8691822cfc5bbec9913fb99c32d38a626b`의 [preflight](https://github.com/kjb7876-lang/m0/actions/runs/39112456285)는 CPU 26/26, 브라우저 8/8, 실제 native 4그룹, 감사/무결성 및 독립 성능 측정 모두 통과했습니다. 협동의 실제 피격·사망·부활과 저장/게스트 혈흔, 병원 확장 구역 아이템 전달 및 중복 방지까지 실행됐으며 전체 적 체력 재가져오기 비교 실패는 0입니다. [전체 Pages PR 게이트](https://github.com/kjb7876-lang/m0/actions/runs/39112460418)는 별도 실행으로 추적하고, main에서 모든 기존/신규 게이트와 정확한 승인 해시를 재확인한 뒤 배포합니다. 남은 출시 순서는 main 병합·Pages 배포·공개 HTML/renderer HTTP 응답 검증입니다. 로컬 Chromium 샌드박스 실행은 호스트 SUID helper 설정 때문에 막혀 있으며, 샌드박스 플래그를 낮추지 않았습니다. 기존 R66 브라우저 회귀 게이트는 후보 적용 전 R70 단계에서 그대로 유지됩니다.
