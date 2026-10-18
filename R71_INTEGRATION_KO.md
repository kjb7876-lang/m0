# R71 빌드·CI 통합 메모

## 빌드 경계

`scripts/apply-r71.py`는 배포된 R70 HTML과 렌더러의 SHA-256을 고정해 확인한 뒤, 헬스/출혈 → 난이도/보상 → 맵 소재 렌더러 HTML 캐시 키 → 렌더러 코드 순으로 메모리에서 변환을 조합합니다. R71은 기존 파일 집합과 미디어 바이트를 유지하고 `index.html`, `dist/phase1.js`, `web-manifest-r62.json`만 갱신합니다. 반복 적용, 기준본 이탈, 매니페스트 해시 불일치, 불균형한 `<script>` 태그는 빌드를 중단합니다.

기준 R70 HTML SHA-256은 `76791c87cf6b3f70d99f35aafc7dacaf3adb389f4be10081c024f8802a9aa5f5`, 렌더러 SHA-256은 `b87e0feb34c321d19e557b7d08e63b9f0744f1e28b9e7d6e2ee7ea9ca0a6ebf4`입니다. `_r70/docs`는 CI에서 동일한 오버레이 순서로 재생성하고 `scripts/r71.audit.mjs`에서 최종 매니페스트의 변경 집합과 원본 에셋을 비교합니다.

## 검증 순서

`.github/workflows/pages.yml`은 기존 R66–R70 CPU, WebGL, 매니페스트, 브라우저 회귀 검증과 R66 EGO/thread queue 회귀 단계를 R70 기준에서 그대로 실행합니다. 이 단계가 끝난 뒤 R70 기준으로 이동/EGO 프로파일을 먼저 수집하고, 그 다음에만 R71을 적용합니다. 후보 적용 뒤 렌더러·진행도·헬스 CPU 테스트, R71 소스/매니페스트 감사, 무결성 검사, R71 브라우저 테스트를 실행합니다. `scripts/r71-native.browser.test.mjs`는 원본 R66 native `openGame`, `damageCase`, `hudCase`, `lifecycleCase` 및 호출부를 SHA-256으로 고정해 재사용합니다. R71/R70 간 플레이어 공격력과 실검무 타격의 비율이 각각 1.0인지 확인하고, 3개 고유 이벤트 ID·20초/EGO 4초 쿨다운을 유지합니다. R66의 R62 대비 2배 공격력·4배 타격 배수는 변경 없이 실행되는 기존 R70 게이트가 보장합니다. 보스 HUD fixture는 333/666을 검사하며, 6회 세이브/복원 수명주기는 원본대로 검사합니다. 변경된 R71 HP/세이브 계약은 R71 QA가 맡으므로 구 `runLegacy()` 호출만 정확한 소스 가드 뒤 명시적으로 제외합니다. 그 뒤 같은 조건의 짝지은 R70/R71 성능 측정을 수행합니다. native 로그/증거는 `out/r71/native/`에 업로드합니다. 모든 검증과 해시 승인 단계가 성공해야 Pages 배포가 시작됩니다.

`.github/workflows/r71-validation.yml`의 브랜치 push 및 `workflow_dispatch` 기본 모드는 기준 R70만 만들고, `R71_PERF_BASELINE_ONLY=1` 프로파일을 먼저 실행합니다. 후보 비교 프로파일은 별도의 Pages 검증에서 실행합니다. CI는 Ubuntu 22.04와 Playwright 1.56 Chromium의 샌드박스를 사용하며 샌드박스 플래그를 낮추지 않습니다.

## 배포 해시 승인

`scripts/r71-approved-runtime.json`은 아직 `pending-review`입니다. PR 검증은 후보 HTML/렌더러 해시를 기록해 측정할 수 있지만, `main` Pages 배포는 이 파일에 최종 검토된 두 해시가 `approved` 상태로 입력되어야 통과합니다. 배포 뒤에는 공개 HTML과 `dist/phase1.js`의 실제 응답 해시도 빌드 결과와 비교합니다.

## 통합 체크포인트

Health R61 clone 및 협동 혈흔 원점 보정이 포함된 fresh compose에서 HTML SHA-256 `b18b7eb03f8bdef72c4e50ea4ad3fbc98ace3b666a944ca5002a1d1bb26a956b`, 렌더러 SHA-256 `54dfe20af282d237511ef6f4bb6be3fe54880ad61d82928b0114d15f58df725c`를 측정했습니다. 이 값은 로컬 후보 체크포인트이며 배포 승인 핀이 아닙니다. CI에서 다시 만든 최종 산출물의 해시를 검토한 뒤 승인 JSON에 반영해야 합니다.

통과한 로컬 검증: R71 CPU 회귀 19/19, 76개 inline JavaScript 구문 검사, Python 변환기 컴파일, 후보 렌더러와 R71 Node 스크립트 및 health/progression helper 구문 검사, 두 workflow YAML 구문 검사, `git diff --check`, R71 소스/매니페스트 감사. `verify-pages-r62`는 1,906개 파일의 hash/HEAD 검사, 276개 오디오 range 검사, 총 2,187개 요청에서 실패 0건을 보고했습니다. HTML과 렌더러 외 패키지 파일 및 미디어 바이트는 변경되지 않았습니다.

브라우저 검증, 실협동 혈흔 캡처 회귀, native 회귀 runner, R70→R71 짝지은 성능 측정은 샌드박스가 활성화된 Ubuntu 22.04 CI에서 실행해야 합니다. 로컬 Chromium 샌드박스 실행은 호스트 SUID helper 설정 때문에 막혀 있으며, 샌드박스 플래그를 낮추지 않았습니다. 기존 R66 브라우저 회귀 게이트는 후보 적용 전 R70 단계에서 유지됩니다. CI 산출물, 최종 해시 검토, 승인된 Pages 배포 및 공개 응답 검증이 남아 있습니다.
