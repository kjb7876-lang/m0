# R1296 Three.js 실행 실패(호출 스택 초과) · 오류 기록 누락 (2026-11-21)

사용자 12:27Z 캡처: 윤서하 Lv.88·검은 공방(kair07), 화면이 비고 "Three.js 실행 실패 · PC 테스트를 중단합니다. (이유: Maximum call stack size exceeded)". 설정 '오류 기록'은 "저장된 오류 없음".

## 오류 기록에 안 남은 이유 (확정)
- phase1 `createController.draw()` 가 장면 캡처(captureVisual)·3D 렌더·브리지 캡처 예외를 try/catch 로 삼키고 메시지만 `fallback()`→`notice()` 로 넘긴다.
- R1228 은 그 메시지로 3D 재시작(1분 3번)·포기 문구만 하고, R1288 기록기는 엔진 logError·window error·Promise 거절만 듣는다 → 스택이 어디에도 안 남음.
- 고침(three-recover-r1228.js 안, 새 파일 없음): 세 자리를 한 번씩만 감싸 던진 오류 객체를 잡아 두고(다시 던짐) 실패 알림 때 R1288 에 `[3D 단계] 메시지` + 스택(되풀이 고리는 '×N 반복'으로 접음) 기록. 복구된 실패도 기록. Error.stackTraceLimit 10→60.
- 검사: `r1296-cpu-check.cjs` 고치기 전 6/18 → 뒤 18/18 (CI). `r1296-browser.mjs`(실제 게임에서 drawHero 한 프레임 재귀 주입) 고치기 전 0/6(`fail-first-browser.txt`, 사용자 증상 그대로 "저장된 오류 없음") → 뒤 6/6(`final-browser.txt`).

## 스택 초과의 원인 (유력, 미확정 — 사용자 기기 스택은 못 받음)
- 03:25Z(R1286 배포)~08:39Z(R1290 #962 배포) 공개판에는 그리기 push 감싸기 핑퐁(R1286 1초·R1041 2초)이 있어 시간이 갈수록 push 사슬이 깊어졌다. push 는 장면 캡처 안에서 그리기 명령마다 불린다.
- `old-pingpong-overflow.cjs`(가상 시계, R1290 검사 stage 재사용): 옛 코드는 가상 2.17시간에 push 한 번이 'Maximum call stack size exceeded', 지금 코드는 12시간까지 안 터짐(`old-pingpong-overflow.txt`).
- 그 사이에 연 탭으로 몇 시간 플레이했다면 이 문구가 그대로 나온다 → 새로고침하면 고친 판.
- 지금 코드 헤드리스: 윤서하·kair07 자동전투 4~5분, 평행세계 소집(환도·라우렌·네온 등 4묶음) 강제 발동 — 재현 안 됨, 캡처 스택 여유 약 1만~1.35만 칸으로 일정(`long-head.mjs`·`epoch-probe.mjs`).

## 미검증
- 사용자 기기의 실제 스택(다음에 생기면 이제 오류 기록에 남음). GPU·실기기·자연 플레이 미검증.
