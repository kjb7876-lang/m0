# R1020 부분 쿼터뷰 3D 조형물 (patch.gg → Poly Haven CC0)

- 사용자 2026-11-14 00:25Z "서사 시대상과 테마보고 … 보는각도따라 부분쿼터뷰 적용 … 3d 자산들만", 00:26Z "조형물부터", 00:39Z 추천 6개(고딕 침대·장식장·괘종시계·흔들의자·물레·휠체어).
- 그림: 렌더 도구는 `../r1017/render/`(같은 카메라·조명). 모델마다 r0(북벽용 face n)·r90(서벽용 face w) 두 방향 → 밝기 올림(감마 .55·×1.1, 침대는 이불 밝기만 낮춤) → `runtime-text/assets/r1020/x1020-<모델>-<n|w>.webp`. 출처·해시는 CREDITS.md.
- 부분 쿼터뷰: R523 그림 표의 `pair`(두 방향 그림이 있으면 벽에 맞는 쪽) 를 쓴다 — 그림 표는 `qa/r523/tools/spec9.json` → mkart.py → art9.json → apply-art.py.
- 배치: `rooms-r523.js` 에 환도 성(hando01~03) 방 이름 표 HANDO 와 묶음(ward3·consult3·spinroom·chamber·hall3), 휠체어 묶음 chair3g 를 처치 대기실 옆 벽 줄에. 성은 R224 방이 없어 worldR74 방 사각형(가운데 ± 반폭·반깊이)으로 읽는다(RECT_REGIONS). 성의 큰 풍경 조형물 둘레는 1.75칸 비운다.
- 지도 고정본: `fixtures/hando0[1-3].json`(헤드리스 게임에서 뽑음). 검사 `r1020-cpu-check.cjs`. R523 검사의 '맡은 지역' 목록·병원 그림 목록에 이번 것을 더했다(사용자 지시 동작 변경). 심사 `review.md`(평균 8.00).
- 미검증: 실기기 GPU·아이폰 실측, 자연 플레이 체감.
