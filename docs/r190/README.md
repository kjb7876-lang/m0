# R190 — 병원 이펙트 처리 개선 및 무료 자산 검증

작업 기준: `main`의 `4473f2a5f48b8abf175119dd924f3ba0859d6327`(R189). 브랜치: `claude/r190-fx-performance`.

## 실행본에 연결한 변경

`ep1a08`에서 기존 pixelfx를 사용한다. 신규 이미지·음원을 런타임에 추가하거나 원본을 교체하지 않았다.

- 완전히 화면 밖인 효과는 큰 시트의 색상 처리와 그리기를 건너뛴다. 효과의 시간·목록은 그대로 유지하므로 다시 화면에 들어오면 현재 프레임을 그린다. 부모 변환, 뒤집힌 기준점, 화면 가장자리 필터 여유를 반영한다. 그림자·필터·마스킹 합성은 보수적으로 기존 경로를 유지한다.
- 동시 64개 상한에서 기존 효과를 `shift()`로 지우던 경로를 바꿨다. 이미 재생 중인 효과를 유지하고 새 장식 효과 요청을 `null`로 거절한다. 키가 같은 코어/문 갱신은 계속 허용한다. 피해·보스 예고·투사체 배열을 변경하지 않는다. 포화 상태에서는 새 장식 효과가 생략되는 절충이 있다.
- 유효기한이 있는 반복 효과만 마지막 120ms 동안 서서히 흐려진다. 일반 일회성 애니메이션의 시간과 그림은 유지한다.
- 다른 맵은 기존 재생 정책을 유지한다. GPU 장면 검증을 완료하지 못했으므로 확대 적용하지 않았다.

| 파일 | 역할 |
|---|---|
| `r96/client-source/fx-performance-r190.js` | 병원 한정 가시성·입장 상한·종료 페이드 정책, 세션 중 되돌리기 API |
| `r96/client-source/pixelfx-r163.js` | 정책 연결을 위한 작은 수정; 기존 재생·팔레트·시트 유지 |
| `r96/runtime-text/`의 동일 JS·`index.html` | 실제 실행 로더에 정책을 pixelfx보다 먼저 연결 |
| `r96/runtime-inputs.json`, `r96/runtime-manifest.json` | sync-r99로 등록·해시 갱신 |
| `scripts/verify-r96-public.py` | 공개본 검사 대상 목록 등록; 실제 공개 배포는 하지 않음 |
| `.github/workflows/pages.yml` | 기존 검사 유지 + 의존성 없는 R190 CPU 검사 추가 |
| `r96/qa/r190/` | 실행 연결·수명·합성·실제 시트 픽셀 비교 및 비용 재현 |

기존 `scripts/build-r96.py`는 매니페스트 기반이므로 수정 없이 신규 오버레이를 포함한 빌드를 검증했다. 디버그 UI는 런타임 매니페스트에 넣지 않았다. 콘솔에서 `__STORYWORLD_FX_R190__.setEnabled(false)`를 호출하면 이 정책만 그 세션에서 끌 수 있다. 저장 데이터는 쓰지 않는다.

## 스킬·무료 자산

[스킬 감사](skills-audit.md): 요청한 10종을 검토하고 `performance-optimization`(Apache-2.0)과 `threejs-debug-profiler`(MIT)만 프로젝트에 설치했다. 두 문서는 측정 우선·Three.js 오류 진단에 사용했다. 기존 아트·디버깅·검증 스킬은 보존했다. 외부 설치기·생성 API·새 게임 스캐폴드는 실행하지 않았다.

[자산 감사](assets-audit.md): 7개 원본 배포처, CC0·상업 이용·다운로드 결과·중복 여부·검증 한계를 기록했다. 개별 파일의 출처·저작자·SHA-256·원본 크기·변환·적용 경로는 `asset-staging/r190/*manifest.json`에 있다.

- Kenney 이펙트/효과음과 Poly Haven 재질은 기존 기능 대비 개선 근거가 부족해 도입하지 않았다. 기존 30개 pixelfx와 294개 오디오 파일을 확인했다. 개수로 품질을 주장하지 않는다.
- para의 피격 시트는 실제 다운로드했으나 평평한 실루엣·계단 가장자리가 기존 칠한 그림체에 맞지 않아 미적용이다.
- Quaternius Demon은 독립 Blender 실험용이다. 공식 Blender 4.5.15를 검증해 192×256 RGBA, 4방향×Idle 4프레임을 만들었다. 검사 6개 통과, 투명 모서리 1개 실패(잔류 알파 5–12/255). 둥근 모델 형태도 아트 기준에 맞지 않아 독립 시범으로만 남겼다. 원본·Atlas·도구·변환 해시는 자산 감사에 기록했다. 기존 몬스터를 교체하지 않는다.
- 런타임 신규 자산: **0개**. 추가 시트·음원으로 로딩이나 텍스처 예산을 늘리지 않았다.

## 측정과 화면 증거

`baseline.json`, `benchmark.json`은 실제 게임 WebP를 디코딩하여 native Canvas에서 동일한 48개 폭발을 그린 **CPU 재현 검사**다. 첫 그리기와 120회 반복을 5세트 측정했다. 전체 게임 FPS나 GPU 성능 수치가 아니다. 실제 FPS·GPU 드로우콜·텍스처 메모리·브라우저 GC·대표 맵 로딩 시간은 미검증이다.


최종 5세트 중앙값(전체 gate와 Blender 렌더 종료 후 동일 CPU 환경 재측정):

| 장면 | 첫 그리기 전 → 후 | 반복 p50 전 → 후 | 반복 p95 전 → 후 |
|---|---:|---:|---:|
| 화면 안 48개 | 94.819 → 87.190 ms | 0.653 → 0.781 ms | 1.381 → 1.378 ms |
| 화면 밖 48개 | 71.721 → 1.105 ms | 0.724 → 0.476 ms | 1.420 → 0.992 ms |

정확히 확인한 작업량 변화: 화면 밖 48개 효과에서 121회 동안 `drawImage` **5,808 → 0**, 첫 색상 처리 **3,888,640픽셀 → 0**. 화면 안 효과의 그리기 횟수와 색상 처리량은 동일하다. 시야 판정 비용이 생기므로 모든 장면의 속도 향상을 주장하지 않는다. 시간 측정은 CPU 부하의 영향을 받으며 raw 반복값을 보존한다.

- [기존 상한 동작](overflow-before.png) / [수정 후 동작](overflow-after.png): 실제 기존 코어 시트를 그린 독립 재현 이미지. **병원 전체 화면 스크린샷이 아니다.**
- `raster-parity.json`: 390×844 / 960×640 CPU 버퍼에서 위치·회전·스케일·뒤집기·프레임을 바꾼 120개 RGBA 동일성 비교. 모바일 브라우저·실기기 검증이 아니다.
- [브라우저 차단 증거](browser-webgl-blocked.jpg), `browser-check.json`: 클라우드 브라우저에서 `WebGL2 context unavailable`. 병원 복원 시험도 잠긴 장 진행 조건 때문에 hub로 복귀했으므로 병원 진입 성공으로 보고하지 않는다.
- Playwright 기본 브라우저가 없고 자동 다운로드는 유효한 ZIP을 받지 못했다. 별도로 공식 Chrome for Testing 156.0.8078.80은 정상 확보했지만 root의 sandboxed 실행이 거부되었고 non-root 전환도 `cannot set groups: Operation not permitted`였다. 샌드박스를 끄지 않았다.

따라서 요청한 **병원 장면 전후 스크린샷, 실제 WebGL 오류 없는 플레이, 자연 조작·실기기 모바일 30FPS/데스크톱 60FPS는 완료되지 않았다**. 가짜 장면이나 CPU 프레임 시간을 대신 제시하지 않는다.

## 보존·자동 검사

`preservation.json`: 보호 대상 tracked 파일 1,350개 변경 없음. 기존 실행본 4,191개 중 4,189개는 바이트 동일; 변경된 기존 경로는 로더 `index.html`과 `pixelfx-r163.js`뿐이다. 신규 실행 경로는 `fx-performance-r190.js` 하나다. 실행본 4,192개 전부 해시·크기 검증 통과, 제거 파일 없음.

전투·AI·보스 페이즈·피해·쿨타임·맵·서사·세이브 코드 및 기존 이미지·음원을 편집하지 않았다. 저장·충돌·맵 전환의 동작 검증은 아래 전체 CPU gate와 실제 브라우저 검증 한계를 구분한다.

검사 결과는 `required-tests.json`, `ci-focused.json`, `regression.json`, `raster-parity.json`, `full-suite-final.log`, 최종 전체 gate 요약을 따른다. 개발 중 후보 변경 전에 시작한 두 전체 검사 시도는 중단했고 성공으로 계산하지 않는다. 원본 QA 입력을 다시 복원한 뒤 최종 고정 실행본으로 전체 gate를 재시작했다. 어떤 테스트도 삭제·완화·비활성화하지 않았다.

## 최종 검사 결과

| 검사 | 결과 |
|---|---|
| R95 전체 gate | **58/58 그룹, 740/740 항목 통과**, 검사 중 소스/실행본 변경 없음 |
| R103 / R104 / R105 | **42 / 10 / 26 항목 통과** |
| R163 기존 pixelfx 검사 | **12 항목 통과** |
| R190 의존성 없는 CI 검사 | **19 항목 통과** |
| R190 실제 시트 재생 회귀 | **19 항목 통과** |
| 변환·프레임 RGBA 비교 | **120개 비교 통과** |
| 원본·런타임 보존 | 보호 1,350개 변경 없음, 실행본 4,192개 해시 일치 |
| 몬스터 실험 | 6개 통과 / 투명 모서리 1개 실패 → 런타임 미적용 |
| 실제 병원 WebGL 화면·전후 캡처·브라우저 저장/이동 | 환경 제약으로 미검증; CPU 저장/충돌/이동 검사는 전체 gate에 포함 |
| 실기기 모바일 FPS·GPU 메모리·브라우저 GC·오디오 청취 | 미검증 |

전체 gate 상세는 [full-suite-summary.json](full-suite-summary.json), 원본 58그룹 로그/JSON/해시 목록은 [full-suite-evidence.zip](full-suite-evidence.zip)과 [SHA-256](full-suite-evidence.sha256)에 있다. 이 ZIP은 3,000,000바이트 이하이다. CI에는 신규 R190 gate를 추가했지만 원격 CI 결과는 별도로 확인해야 한다.

## 재현

```sh
python3 scripts/sync-r99.py fx-performance-r190.js
# build-r96는 빈 출력 경로를 요구한다. 기존 site가 있으면 별도 보존 경로로 이동한다.
python3 scripts/build-r96.py
python3 scripts/prepare-r96-ci.py
python3 r96/scripts/prepare-handoff-baselines.py
node r96/qa/r103/samong-cpu-check.cjs
node r96/qa/r104/bosses-cpu-check.cjs
node r96/qa/r105/samong-maps-cpu-check.cjs
node r96/qa/r163/pixelfx-cpu-check.cjs
node r96/qa/r190/r190-cpu-check.cjs
STORYWORLD_QA_LABEL=r190-review node r96/qa/r95/run-full-suite.cjs
```

확장 픽셀/비용 검사는 `@napi-rs/canvas` 0.1.100이 있는 Node 환경과 기준 커밋 객체가 필요하다. 이번 실행 환경에 이미 설치된 모듈을 사용했다. `node r96/qa/r190/regression.cjs`, `node r96/qa/r190/raster-parity.cjs`, `node r96/qa/r190/benchmark.cjs`, `node r96/qa/r190/render-evidence.cjs`로 실행한다. 의존성 없는 `r190-cpu-check.cjs`만 기존 CI에 추가했다.

## 병합 전 남은 확인

GPU가 지원되는 환경에서 `ep1a08`에 정상 진입한 저장/테스트 장면으로 전후 화면, 실제 프레임타임·드로우콜·텍스처 메모리·로딩·GC, 모바일 터치와 30FPS 지속성을 확인해야 한다. 이번 변경은 드래프트 PR로 제공하며 `main` 병합·공개 배포는 하지 않는다. CI와 커밋·PR 식별자는 전달 메시지 및 드래프트 PR에서 확인한다.
