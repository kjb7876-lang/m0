# SW-0006 r2 — Slayer 남향 보행4·일반공격6

공식 계약: https://github.com/kjb7876-lang/m0/issues/273 . 기준 커밋 `54bbdf1c3e2b94d95063d36e783cfa96c45ab381`.

사용자 승인 원화의 남향 보행4·공격6을 기존 R351 안에서 선택한다. 남향 일반공격은 준비2포즈 후 실제 타격하도록 사용자가 선택했다. 기존 W/E 클립과 북향 fallback, 대기·기술·대시·회오리·각성·협동 및 원본 시트는 유지한다. 병합·배포는 이 작업의 완료 범위가 아니다.

## 자산·크기

| 자산 | 규격 | 바이트 | SHA-256 |
|---|---|---:|---|
| slayer-walk-s-persona.webp | 4×1, 셀192×256 | 71498 | 7669aa19012a316387d64a798627dcf4ab90b55cd7be1c862b0b6e4e67f0339f |
| slayer-attack-s-persona.webp | 6×1, 셀192×256 | 112794 | 8e3347ff22b5cefcb36b3ade4461282a78bc0b90b1ba51e4cb5c7f6d9dc56d27 |

두 WEBP는 승인 파일을 바이트 변경 없이 복사했다. 원본 ZIP SHA-256은 `da300b1efc75223e99772df6b2e743e0158b0b2d750d22825da87d9161e4ac34`. 비공개 Drive 식별자는 공개 자료에 넣지 않는다.

발 기준점은 `(96,226)`, 실제 보행 몸 높이는158~159px이므로 보행·공격에 공통 body158을 쓴다. 시트 제작 계약의180을 그대로 쓰면 남향이 작게 보인다. 자세마다 body를 바꾸어 공격 중 몸 크기가 펌핑되지 않게 했다. 보폭은 W8의 화면상 한 사이클 거리와 일치시키는39.9388889px/frame을 초기값으로 삼는다. 실제 발 미끄러짐과 화면 크기 검토는 별도 필요하다.

## 방향·타격 정책

- 화면벡터 `(dx-dy,(dx+dy)/2)`의 아래 ±30도에서만 S를 고른다. W/E 기억과 R336 전역 sticky 상태는 유지한다.
- 준비 시간은 원본140+180=320ms. 준비 중에는 player/CD/combo/counter/피해/효과를 변경하지 않는다. 상태는 모듈 메모리에만 둔다.
- 첫 simulation tick이320ms에 도달하면 global `basicAttack` 경로 전체를 한 번 실행한다. 앞뒤에 설치된 기존 observer/proc도 이 실제 승인 시점에 실행한다. hitEnemy만 따로 미루지 않는다.
- native 피해·slash와 새0-based2번 베기 그림이 같은 gameTime에 시작한다. 늦은 tick이면 실제 실행 시각부터 베기·회수를 재생하며 draw에서 피해를 실행하지 않는다. wall-clock timer는 쓰지 않는다.
- native 쿨다운 값은 유지하되 실제 타격부터 시작한다. **남향 실효 공격 간격에는320ms 준비가 추가된다.** 취소된 준비는 native 쿨다운과 콤보를 소비하지 않는다. DPS·전체 공격 주기가 불변이라는 뜻은 아니다.
- 같은 표적·선택 상태·거리·벽·남향 sector를 다시 확인한다. 같은 표적이 남향 안에서 움직이면 최종 native 각도로 타격한다. 최초 정확 각도를 고정하는 방식은 아니다. 표적이 바뀌거나 남향을 벗어나면 취소한다. 취소를 유발한 호출에서 다른 적을 즉시 공격하지 않는다.
- 이동0.12칸 초과·피격/HP감소·기술/대시/가드/각성/회오리·협동·방/레이어/플레이어 교체·시간 역행·기능 해제로 취소한다. 짧은 기술이 끝나도 기존 pose 시작 시각/CD 증가 기록으로 취소를 유지한다. 저장 필드를 추가하지 않는다.
- 새 metadata/이미지가 아직 없거나 로딩에 실패하면 기존 R351 경로를 유지한다.

## 검사 상태

- `node r96/qa/r377/slayer-south-cpu-check.cjs`: **77/77 PASS**. 엔진의 실제 native basicAttack 함수를 읽어 사용한다. 자산/방향/6포즈/타격/observer1회/취소/기존 즉시공격을 확인했다.
- `node r96/qa/r351/slayer-cpu-check.cjs`: **54/54 PASS** (기존 자산·기능).
- `node r96/qa/r336/facing-cpu-check.cjs`: **6/6 PASS**.
- `node r96/qa/r366/r366-cpu-check.cjs`: **31/31 PASS**.
- `python -I scripts/collab/test_validate.py`: **25 tests PASS**. 기존 파일 핸들 ResourceWarning은 남는다.
- `python -I scripts/collab/validate.py all`: PASS (저장소의 기존 시험 계약/manifest).
- `git diff --check`: PASS.

신규 CPU와 기존 CPU를 합산해 새 그래픽·실기기·전체 묶음 검증으로 보고하지 않는다. 브라우저 fixture, 독립 코드/시각 검수와 미검증은 후속 기록으로 추가한다.

## 공통 파일 인계·빌드 차단

R351 소스/runtime와 R377 자산·QA 경로는 조사한 다른 열린 PR에 직접 겹치지 않았다. 최신 main `dabdf908c491ea90ccfb1bb66c41b8ed9a6f22aa`에서도 R351 두 파일은 같은 blob `76c3f2134b3657166a8b067e601eadc2295d9306`이다. 로컬 main fetch는503으로 실패했으며 계약 기준 커밋을 유지한다.

공통 `r96/runtime-inputs.json`, `r96/runtime-manifest.json`, index/verify/workflow는 다른 PR이 수정 중이다. 이 작업에서는 손대지 않는다. 따라서 최종 manifest 동기화·정식 빌드/CI와 배포는 완료되지 않았다. 동기화 담당은 소유권을 조정한 뒤 다음을 실행하고 결과를 검증해야 한다.

```sh
python3 scripts/sync-r99.py slayer-r351.js assets/r377/slayer-south/index.json assets/r377/slayer-south/slayer-walk-s-persona.webp assets/r377/slayer-south/slayer-attack-s-persona.webp
```

변경된 기존 스크립트의 hash와 새 자산3개 모두 등록해야 한다. 새 script tag는 필요하지 않다. QA 등록도 공통 workflow 담당이 `node r96/qa/r377/slayer-south-cpu-check.cjs`를 추가해야 한다. 등록이 끝나기 전 로컬 조합 fixture의 성공을 정식 빌드 통과 또는 실제 공개 게임 반영이라고 보고하지 않는다.

미실행/미검증: 전체 약25분 묶음, 정식 동기화/빌드/CI, GPU·실기기 모바일·자연 플레이, 통합 후 기존 스킬·저장 왕복, 최종7분야 화면 심사. 커밋·PR·배포 기록은 최종 상태에 맞춰 갱신한다.
