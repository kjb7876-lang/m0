# R6 신규 중독·화상 유지 효과 검사 후보

새 builtin imagegen 원화 2장과 수동 분리 12개 component를 사용해 생성한 2종 hybrid rigging 애니메이션이다. 프레임마다 새로 그린 40장의 원화라는 뜻이 아니다. 20프레임씩 출현 4, 유지 12, 해제 4. 전체 이미지 상하 이동이 아니라 각 방울의 낙하·소멸, 안개의 국소 방향/너비 변화, 불씨의 상승·회전·소멸, 불꽃의 독립 변형을 합성했다. 원본 게임 자산은 덮어쓰지 않았다.

## 실제 비교한 원본
R90 final42: F213 독 충돌, F214 독주사기 비행, CONTACT94 화염 충돌, ailments fire/pollution. final42-hooks-r88.js AURA는 shock/frost/chill/bleed/charm/disease/weakness이며 pollution/poison과 fire/burn 유지 항목은 없다. 신규 후보는 이 시각적 빈칸만 대상으로 한다. 기존 충돌·폭발·질병 구름은 재제작하지 않는다. R94는 이 작업에서 접근하지 않았다.

## 좌표/합성
원래 canvas 256×256, 발 anchor (128,216). 무기/얼굴을 위한 위쪽 128px은 완전 투명하고 중심 x108..147,y0..189도 완전 투명하다. 발 좌우의 낮고 성긴 장식이다. 정상 straight-alpha source-over 전용, additive 금지. 위치/충돌/피해/이동 판정 변경 없음.
Atlas는 공통 crop (48,128)-(208,224), 160×96 셀 4열×5행, 640×480 PNG/WebP lossless. 프레임 rect에서 추출한 뒤 sourceOffset=(48,128)로 원래 canvas에 놓으면 모든 원본 프레임과 RGBA byte-identical. trim pivot=(80,88). 프레임별 정규화/가변 pivot 없음. 가장자리 픽셀은 투명. 구현 시 clamp-to-edge, mipmaps 비활성 후보로 시작하되 실제 renderer 알파/색공간은 미검증.
각 atlas RGBA8 1,228,800 bytes = 1.171875MiB. 두 atlas 2.34375MiB, 이는 mipmap/복제/드라이버/임시 decode 제외 이론치다. 기존 64MiB/8atlas/16instance 한도를 늘리지 않는다. 두 PNG와 WebP를 동시에 적재하지 않는다.

## 시간/수명 계약 (아직 게임 연결 없음)
- native status만 진실의 원천. poison/pollution 및 fire/burn alias를 각각 한 시각 인스턴스로 정규화한다. 상태명이 있다고 새 DOT나 피해를 만들지 않는다.
- 시작 판정 즉시 적용, 시각 onset 240ms (60ms×4). 이후 hold 960ms (80ms×12) 반복. 재적용은 native until만 갱신하며 onset/particle instance를 중복 생성하지 않는다.
- until 도달 시 release 240ms. canonical release atlas는 hold 마지막 프레임 다음 경계에서 사용할 때만 의도된 연결이다.
- 임의 프레임 조기 해독/취소/상태 만료는 canonical release 첫 프레임으로 점프하지 않는다. 현재 atlas frame의 pose를 고정하고 opacity를 현재값부터 0까지 240ms 단조 감소시켜 제거한다. 이 fallback은 새 입자나 피해를 만들지 않으며 저장하지 않는다. 잔류 표식이 오해를 부르면 즉시 제거 우선.
- 사망/맵 이탈/주체 소실/scene reset은 즉시 제거. pause/modal은 native clock에 맞춰 정지한다. resume에 만료됐으면 바로 제거, 과거 onset 재생 없음.
- 저장에는 시각 인스턴스/particle를 쓰지 않는다. native 유효 status가 복원되면 hold 진입, 이미 만료된 상태는 복원하지 않는다. 상태가 곧 끝나면 시각이 판정 수명을 늘려서는 안 된다.
- 회복/해제 중 재적용은 기존 한 instance를 hold로 복귀시키고 until 갱신. native 상태 종류 변경은 이전 instance 즉시 제거.
- 화면 밖은 시각 갱신 생략 가능하되 native until은 정상 경과. 돌아오면 유효 상태만 hold. 벽 뒤/지붕 가림은 기존 actor depth 정책을 따라야 하며 새 관통 표현 금지.
- HUD 상태 이름/아이콘을 대체하지 않는 장식. lowFX에서 생략 가능. 경고/보스 telegraph보다 우선하지 않는다.

## 검증 경계
cpu-report는 프레임 유일성(종료 투명 포함 제외 19장), 정확 주기 t0=t1, 루프 경계 변화량, sourceOffset 복원, 투명 RGB 0, 가장자리/얼굴 영역 검사다. state-contract-tests는 독립 시뮬레이션이지 게임 실행 검사가 아니다. APNG/정지 contact는 CPU 합성 미리보기다. 실제 브라우저/GPU/실기기/10분전투/저장 왕복/실제 벽 가림 및 성능은 미검증. game integration/main/배포 없음. 실제 화면에서 가독성 부족이나 지나친 시야 가림을 확인하면 크기/opacity 재조정 필요.
