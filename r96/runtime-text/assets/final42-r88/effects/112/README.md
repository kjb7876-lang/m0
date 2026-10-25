# 검은 재 돌풍 · StoryWorld 통합 후보

16개의 서로 다른 그림 프레임을 생성했습니다. 원본을 보존했고 게임·배포를 수정하지 않았습니다. 그림은384px 캔버스에 원본 크기(약313px셀)를 유지해 배치했습니다.

## 사용
atlas.png는4×4,1536×1536 RGBA입니다. animation.json의 rect를 사용하거나 frames의 PNG를 재생하세요. 각80ms, 전체1.28초의 일회성 이펙트입니다. 고정 피벗은 좌상단 기준[192, 192]이며 목표/맵에 맞게 한 번 튜닝한 후 동일 배율을 유지하세요. 프레임별 자동 트림·스케일은 끄세요. 일반 알파 블렌딩, bilinear/clamp, 초기 테스트에서는 mipmaps off를 사용하세요. 첫 프레임0→1, 마지막 프레임1→0 알파 후 제거합니다. 미리보기는 이 페이드와 반복 재생을 보여줄 뿐 무봉제 루프를 보장하지 않습니다.

## 서사
[{"zone": "dist03", "scene": "04", "title": "무너진성", "objective": "핏빛 추격자 돌파", "narrator": "〈EGO의 기억〉", "lore_pointer": "/records/3"}]
Loose black ash flakes curl into a directional gust then disperse; independent flakes and evolving eddy silhouette, not a rotating static cloud.
장면·목표는 원본 자료의 근거입니다. 구체적 색/모양/타이밍은 새로운 시각 해석이며 정사로 단정하지 않습니다.

## 한계/검증
진짜 알파/서로 다른16프레임/캔버스 가장자리와 ZIP 무결성을 CPU로 검사합니다. 생성 기반이라 세부 형태와 위치가 프레임 사이 조금 흔들릴 수 있습니다. 단일 레이어여서 정확한 앞/뒤 가림이 필요한 장면은 추가 마스크/레이어가 필요합니다. 실제 게임·GPU·모바일 성능을 검증한 완성품은 아니며 통합 후보입니다. 대상별 피벗과 배율/가림을 반드시 테스트하세요. source_original.png는 원본 보존본입니다.
