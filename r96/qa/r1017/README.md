# R1017 디아블로풍 조형물 (patch.gg → Poly Haven CC0)

- 고른 것(사용자 2026-11-14): 철문 large_iron_gate, 고딕 석상 gothic_statue, 보물상자 treasure_chest, 촛대 brass_candleholders, 녹슨 침대 old_bed_frame, 돌 화덕 stone_fire_pit(실내 화로 금지 규칙으로 뺌). 석상 그림 이름은 R303 바깥 물건 규칙 때문에 veiled-king.
- 라이선스: patch.gg 툴박스 페이지 License 줄 "CC0 · no credit needed" 직접 확인, API license.evidence·ai=false·generated_by 없음. 출처·해시는 저장소 루트 CREDITS.md.
- 받기: `render/dl.py` (patch.gg API 의 web 변형 GLB, sha256 대조). GLB 는 저장소에 넣지 않는다.
- 렌더: `render/render.html` + `render/render.mjs` (Three.js 0.170 GLTFLoader, 헤드리스 Chromium SwiftShader, 1024² 정사영, 카메라 방위 +x+z 대각·고도 30°, 키라이트 따뜻한 주황 #ffc890 왼쪽 위, 테두리광 푸른 #7f95ff 뒤, 약한 주황 보조광, ACES 톤매핑). 설정은 `render/jobs.json`.
- 다듬기: `render/proc.py` (잘라내기 → 긴 변 384px LANCZOS → 대비 1.08 → 언샤프, 돌 화덕만 가운데 잔불 빛). 발(pivot) = 모델 바닥 가운데의 화면 투영점.
- 배치: `client-source/props-diablo-r1017.js` 가 R449 TEMPLATES 에 묶음을 끼운다. 검사 `r1017-cpu-check.cjs`.
- 미검증: 실기기 GPU·모바일 실측, 자연 플레이 체감.
