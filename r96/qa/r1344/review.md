# R1344 탐식의 주방 "Three.js 실행 실패 (이유: Maximum call stack size exceeded)"

사용자 2026-11-26 13:47Z, ep1b04·기억사수 Lv.26·EGO. 오류 기록(R1288):
`[3D render] … at before (michaela-flashguard-r1267.js) / ThreeRenderer.w (hit-translucent-r1271.js) / ThreeRenderer.w (r1267) … (위 2줄 ×29 반복)`, 그 앞 `[3D init]` 같은 오류.

## 원인
3D render 감싸기 핑퐁 두 쌍(qa/wrap-once·R1290 과 같은 종류). 각자 '바깥 함수에 내 표식(또는 내 WeakSet)이 없으면 다시 감싼다'로 상대 감싸개를 덮어 번갈아 끝없이 감쌌다.
- prototype: R1267 미카엘라 섬광 제한(tick 마다·0.5초) ↔ R1271 피격 반투명(0.5초). 새 지역·3D 재시작 때 새 렌더러가 깊은 prototype render 를 받아 넘침(사용자 스택과 일치).
- 인스턴스: R1103 경고 도형(0.7초) ↔ sin-room-art(0.4초). 헤드리스 실측 40초에 각 77겹, 계속 증가.
영웅·지역과 무관하게 플레이 시간이 길수록 깊어진다(지역 무관). 탐식의 주방은 그 시점에 지역 이동/3D 재시작이 일어난 곳.

## 고침(동작 그대로, 감싸기만)
네 파일의 감싸개가 안쪽 감싸개의 표식(`/^_*(r\d|sinRoom)/`)을 옮겨 담고, WeakSet 만 보던 두 곳(R1103·sin-room-art)은 속성 표식(`__r1103Shapes`·`__sinRoomArt`)도 본다.

## 검사
- 실패 먼저: `fail-first-cpu.txt`(6/16 실패, prototype 26→1626, 인스턴스 →3225, 전체 52개 오버레이 300바퀴 52→652·63→663).
- 고친 뒤: `final-cpu.txt` 16/16. 관련 기존 검사(R1103·R1267·R1271·R1297·R176·R266·R287·R292·R302·R378·R406·R420·R438·R449·R838·sin-room-art 둘·wrap-once·R1290) 통과.
- 헤드리스 브라우저(SwiftShader, 그래픽 검증 아님) `depth.mjs`: 고치기 전 렌더 스택 133→245줄(40초), 고친 뒤 93→93줄, prototype 깊이 그대로(`final-browser-depth.txt`).
- 미검증: 실제 PC 장시간 플레이(GPU), 모바일.

## 시각 변화
없음(그리기 결과·명령 손질은 그대로, 감싸기 겹수만). 7분야 심사 대상 아님.
