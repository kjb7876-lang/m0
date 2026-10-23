# V3 / R78 + R79 병원 PC 후보 검사

이 ZIP 최종 후보의 CPU 기반 재현 명령입니다. 테스트 사이에 같은 HTTP 포트 서버를 두 개 띄우지 말고 아래 순서로 실행하세요.

```sh
node qa/world-r78-layout.cjs
node qa/world-r78-combat-input.cjs
node qa/world-r78-visual.cjs
node qa/world-r78-story-spawn.cjs
node qa/run-final.cjs
node qa/package-check.cjs
```

앞의 네 검사는 55개 지도 연결·출구·지형, 원본 적 생성 위치, A/J/1 입력, 수술실 Three r186 BufferGeometry를 확인합니다. `run-final.cjs`는 기존 병원 진행·저장·문·투사체·피격·지속 피해·독립 Node 복원 회귀 묶음을 실행합니다. `ego-regression.cjs`는 활성 EGO 저장을 복원한 뒤 첫 틱의 일반 적·보스 HP와 연속 복원 HP를 확인합니다. 마지막 `package-check.cjs`는 manifest 해시, HTML 스크립트 구문, loopback HTTP 응답과 음원 범위 응답을 검사합니다.

검사는 Node CPU VM과 CPU Three 기하 구성입니다. 브라우저, GPU/WebGL 렌더링, 음원 재생, 실제 키보드, 자연 플레이, Windows 런처를 검증하지 않습니다. `*-save.json` 파일은 합성 테스트 데이터입니다. EGO 저장 복원 직후 첫 네이티브 프레임의 HP 보존을 CPU VM으로 검사합니다. V2 검사는 `V2-README.md`와 `V2-CPU-RESULTS.md`에 보존했습니다.
