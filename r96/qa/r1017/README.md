# R1017 디아블로풍 조형물 (patch.gg → Poly Haven CC0)

- 고른 것(사용자 2026-11-14): 철문 large_iron_gate, 고딕 석상 gothic_statue, 보물상자 treasure_chest, 촛대 brass_candleholders, 녹슨 침대 old_bed_frame, 돌 화덕 stone_fire_pit.
- **최종(2026-11-14 02:03Z 사용자 지시 "각도·테마·시대 하나라도 안 맞으면 억지로 넣지 말고 제외" 뒤 재심사): 촛대 1점만 남김.**

| 조형물 | 결정 | 이유 |
|---|---|---|
| 돌 화덕 | 뺌(첫 판) | 상시 규칙 실내 화로 금지 |
| 보물상자 | 뺌(첫 판) | 시대: 놓을 보관실이 현대 호텔·빌라뿐 |
| 철문(cult 긴 회랑) | 뺌 | 시대·테마: 19세기 연철 문 vs 현대·기계 교단 회랑, 어두운 벽 앞에서 잘 안 보임 |
| 너울 쓴 왕 석상(cult03 코어 전실) | 뺌 | 시대·테마: 중세 석상 vs SF·몽환 코어 방 |
| 녹슨 쇠침대(ep1a09 관찰실, 같은 observe 묶음이라 사몽 병동·병실에도 들어갔음) | 뺌 | 시대: 현대 병원에 앤티크 쇠침대 |
| 촛대(cult03 앞방·입구) | 남김 | 의식 소품이라 시대 무관, 교단 입구 테마와 맞음, 좌우 대칭 기둥 그림이라 어느 각도에서도 맞음 |

- 라이선스: patch.gg 툴박스 페이지 License 줄 "CC0 · no credit needed" 직접 확인, API license.evidence·ai=false·generated_by 없음. 출처·해시는 저장소 루트 CREDITS.md.
- 받기 `render/dl.py`, 렌더 `render/render.html`·`render.mjs`(Three.js 0.170, 헤드리스 SwiftShader, 정사영 쿼터뷰), 다듬기 `render/proc.py`. 설정 `render/jobs.json`(뺀 조형물 설정도 기록으로 남김). GLB 는 저장소에 넣지 않는다.
- 배치: `rooms-r523.js` 방 묶음 candle1(cult03 앞방·입구 narthex). 그림 표는 `qa/r523/tools/spec8.json` → mkart.py → art8.json → apply-art.py. R449 덧씌우기(props-diablo-r1017.js)는 철문과 함께 지웠다.
- 검사 `r1017-cpu-check.cjs`(뺀 파일이 없는지 + 촛대 배치, 실제 지도 고정본 + 엔진 벽 판정). R523 검사의 '이 계열 그림만' 목록에는 candles 만 남겼다(사용자 지시 동작 변경). 심사 `review.md`.
- 브라우저(헤드리스): cult03 앞방에서 Three.js 프레임 명령에 x1017-candles 본 그림 + 그림자 3이 2벌 들어감, ep1a09·cult01 에는 R1017 그림 0.
- 미검증: 실기기 GPU·모바일 실측, 자연 플레이 체감. 옛 스크린샷(*.jpg)은 뺀 조형물이 함께 찍힌 첫 판 기록이다.
