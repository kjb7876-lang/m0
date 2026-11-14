# R1017 디아블로풍 조형물 (patch.gg → Poly Haven CC0)

- 고른 것(사용자 2026-11-14): 철문 large_iron_gate, 고딕 석상 gothic_statue, 보물상자 treasure_chest, 촛대 brass_candleholders, 녹슨 침대 old_bed_frame, 돌 화덕 stone_fire_pit(실내 화로 금지 규칙으로 뺌). 석상 그림 이름은 R303 바깥 물건 규칙 때문에 veiled-king.
- 라이선스: patch.gg 툴박스 페이지 License 줄 "CC0 · no credit needed" 직접 확인, API license.evidence·ai=false·generated_by 없음. 출처·해시는 저장소 루트 CREDITS.md.
- 받기: `render/dl.py` (patch.gg API 의 web 변형 GLB, sha256 대조). GLB 는 저장소에 넣지 않는다.
- 렌더: `render/render.html` + `render/render.mjs` (Three.js 0.170 GLTFLoader, 헤드리스 Chromium SwiftShader, 1024² 정사영, 카메라 방위 +x+z 대각·고도 30°, 키라이트 따뜻한 주황 #ffc890 왼쪽 위, 테두리광 푸른 #7f95ff 뒤, 약한 주황 보조광, ACES 톤매핑). 설정은 `render/jobs.json`.
- 다듬기: `render/proc.py` (잘라내기 → 긴 변 384px LANCZOS → 대비 1.08 → 언샤프, 돌 화덕만 가운데 잔불 빛). 발(pivot) = 모델 바닥 가운데의 화면 투영점. 철문만 그 뒤 감마 .5·×1.12(평균 밝기 13 → 50/255, 어두운 벽 앞에서 안 보였음).
- 배치: 철문은 `client-source/props-diablo-r1017.js` 가 R449 TEMPLATES(예배 계열 긴 회랑, 지역당 1점)에 끼운다. 석상·촛대·녹슨 침대는 `rooms-r523.js` 방 묶음(cult03 코어 전실 = 석상 + 촛대, 앞방·입구 = 촛대, ep1a09 관찰실 = 녹슨 침대 + 수액대)에 넣었다 — 그림 표는 `qa/r523/tools/spec8.json` → mkart.py → art8.json → apply-art.py. 브라우저 그리기 명령 실측에서 R523 이 맡은 방은 R449 가구를 그리는 동안 빼서 처음 배치(예배실·처치실)는 화면에 0점이었다.
- 검사 `r1017-cpu-check.cjs`(R523 쪽은 실제 지도 고정본 + 엔진 벽 판정). R523 검사의 '이 계열 그림만' 목록에 새 그림 3개를 더했다(사용자 지시 동작 변경). 심사 `review.md`(평균 7.97).
- 미검증: 실기기 GPU·모바일 실측, 자연 플레이 체감.
