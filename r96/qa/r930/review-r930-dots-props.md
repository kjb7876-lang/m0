# R930 2차 — Dots CX-0081KC 조형물 r1 적용 (2026-11-13)

조정자 전달: "Dots가 카이로노미콘 CX-0081KC 조형물 후보 2D'~2L을 보냈어요. 검토하고, 쓸 만하면 적용해 주세요."
원 요청(사용자 2026-11-12 08:52Z): 카이로노미콘 벽·맵타일·조형물을 Dots 에게 만들게 해 사이버펑크×마법공학 느낌으로 적용.

## 검수 (13종, 각 a/b 두 방향, 512x512 RGBA, 발끝 y=486)
- 공통: 흑철+황동+시안 관이라는 요청 팔레트와 맞고, 글자·육각별·기운 십자가·불꽃·바닥 그림자 없음. 알파 경계 깨끗(작은 가장자리 번짐은 게임 크기에서 안 보임).
- 사용 11종: 2A 터미널 기둥, 2B 명령 콘솔, 2C 시계 발전기, 2D 네온 가로등(a 만 — Dots 가 a/b 가 같은 방향이라 보류로 표시, 낱개로는 문제없음), 2E 케이블 덕트(이어 붙이기 미검증이라 낱개로만), 2F 황동 매니폴드, 2G 데이터 묘비, 2H 검은 모래 잔해, 2I 시냅스 아치, 2J 배수 펌프, 2L 주형·국자.
- 보류 2종: 2D' 실내 벽등(벽 부착 자리 없음), 2K 명령단(밟는 단 — 충돌을 바꾸지 않는 한 발이 뚫고 지나감).
- 타일(1B 회랑 r2, 1E 실외 벽, 1F 뉴런)은 이번 범위 밖(조형물만). 타일은 아직 코드로 그린 임시본.

## 적용 (그림만 — 자리·충돌·길찾기·문·서사 그대로)
- 봉인 기둥 → 터미널 기둥(kair09 는 데이터 묘비), 이끼 바위 장식 자리 → 지역별 Dots 조형물, 시간 엔진 → 시계 발전기+검은 모래 잔해(kair03·10)/주형·국자(kair07), kair08 룬 포탈 → 시냅스 아치.
- 시간의 숲 kair05·쉼터·사몽·카이로 밖은 그대로. solid·상호작용·목표 조형물은 건드리지 않음.
- Dots 그림이 아직 안 불러와졌으면 앞 단계 그림을 유지(빈 자리 없음), 불러온 뒤 교체.
- 길쭉한 그림은 그리는 높이만 올림(기둥 1.6·가로등 3·아치 1.45·묘비 1.35·콘솔 1.2배, 헤드리스 근접 사진으로 영웅 키 대비 맞춤).

## 검사
- `node r96/qa/r930/r930-cpu-check.cjs` 56/56 (실패하는 검사를 먼저 쓰고 코드 수정). 이전 검사 중 "kair03·09·10 조형물 그대로" 3줄은 이번 지시(그 지역 봉인 기둥도 Dots 그림으로)로 기대값이 바뀌어 새 기대값으로 고쳤다.
- 관련: r272 27/27, r830 60/60, r303 20, r329 22, r176 22, r222 22, r225 13 통과.
- 헤드리스 브라우저(Chromium 소프트웨어 렌더링, 1280x720): kair01~10·쉼터 순회, 지역마다 바뀐 조형물 옆에 서서 근접 사진. 페이지 오류 0, r930 errors 0, dotsWaiting 0. 전후 비교 `kairo-r930-dots-props-before-after.jpg`(전 = 같은 빌드에서 Dots 그림 요청을 막은 상태 = 폴백 동작 확인 겸용).
- 미검증: GPU 실기기, 실제 모바일, 자연 플레이, 사람 눈으로 본 색감.

## 7분야 심사 (헤드리스 사진 기준, 10점)
| 분야 | 점수 | 메모 |
|---|---|---|
| 미술 | 8.3 | 흑철·황동·시안 관이 한 벌로 읽힘. 이전 은빛 기둥·청록 엔진보다 카이로 타일과 재질이 맞음 |
| 연출 | 7.9 | 지역 서사별 배치(수로 펌프, 공방 주형, 묘지 묘비, 뉴런 아치) |
| 카메라 구도 | 7.8 | 등각 각도 일치, 기둥·가로등이 세로 리듬을 줌. 가로등은 가늘어 멀리서는 약함 |
| 공간 인테리어 | 8.0 | 실내(kair02·07)에 덕트·매니폴드·주형이 방 용도를 설명 |
| 조명 색채 | 7.8 | 어두운 장면에서 황동이 가라앉음. 시안 관이 주변을 밝히지는 않음(빛 효과 없음) |
| 애니메이션 VFX | 7.3 | 정지 그림. 깜박임 시트 미제작 |
| UX 레벨 | 8.0 | 충돌·길 그대로, 지나갈 수 있는 장식만 교체, 폴백으로 빈 자리 없음 |
| **평균** | **7.87** | 7.77 초과 → 통과 |

남은 개선: 시안 관 깜박임 시트(Dots 선택 항목), 벽등·명령단 자리, 가로등 b 방향 재작업, 타일 1B/1E/1F 검토·교체.

## 자산 적용표
| 게임 파일 (assets/r930/props/) | Dots 원본 | 원본 SHA-256 | 원본 크기 | 게임 파일 SHA-256 | 크기 | 쓰는 곳 | 적용 |
|---|---|---|---|---|---|---|---|
| kc-black-sand-wreck-a.webp | CX-0081KC_2H_black-sand-wreck_a_r1.png | 15d9672e3ce14be1317ce774c540a8137482c2f8facb253d42765cff9c10c40c | 156421 | 042e6769c2c4f9f440032ed09aa74840c585a2babd4e6a1f59660e2b65b9ae44 | 41308 | 시간 엔진 자리(kair03·10 검은 모래) | 적용 |
| kc-black-sand-wreck-b.webp | CX-0081KC_2H_black-sand-wreck_b_r1.png | 0c925c62d7a2f4a8a3e92f897a40ea0d73f22e5733b7185fc2cb7ea77845148b | 157785 | 284a98ce588867930f83108e208f7eb7936a667c4c95534faef01bf6fa2e8fc4 | 41564 | 시간 엔진 자리(kair03·10 검은 모래) | 적용 |
| kc-brass-manifold-a.webp | CX-0081KC_2F_brass-manifold_a_r1.png | ab4b27bb299b78c301d1230826ad7d78a4086076c1aac70f225007c5265f26dc | 265002 | dcf741945ef944f0015ab330714ceec7351569b592bd067f4d4d21c17d658d5c | 62694 | 이끼 바위 자리(kair01·02·04·06), 엔진 자리(kair07) | 적용 |
| kc-brass-manifold-b.webp | CX-0081KC_2F_brass-manifold_b_r1.png | 26c886e003ddc516ea35628daa5177569be3fd4f3795a8f0619290c7e9bcae8b | 236598 | 699b30c81b766217cde077c9ef0acc00fd18915fe208f1030f66cc77984c4d62 | 64640 | 이끼 바위 자리(kair01·02·04·06), 엔진 자리(kair07) | 적용 |
| kc-cable-duct-a.webp | CX-0081KC_2E_cable-duct_a_r1.png | 5dee87c2d7014fdf92f84af78f7ac8e2d30789a29f25b6ca96edda484b25f18c | 142552 | b5b8e87cbfa78a259080d7cd71b51488ac5dd972f6db0e526f063db450adf245 | 31982 | 이끼 바위 자리(kair02·04·06), 낱개로만 | 적용 |
| kc-cable-duct-b.webp | CX-0081KC_2E_cable-duct_b_r1.png | e6ff97c180dc0c29b569def358f42211fc3394fbc3d301edeff9234cc847ba1b | 144921 | b54f15ec3ed9caace19dbba9784deeb53ebf4d28d7a3d6d19288368e0ed87a67 | 31200 | 이끼 바위 자리(kair02·04·06), 낱개로만 | 적용 |
| kc-clock-generator-a.webp | CX-0081KC_2C_clock-generator_a_r1.png | b05a00cc76b95f940b8765e55f35e3ca7c4c58e1c317f9bdf83002fa9c2de554 | 226170 | 51f9ff8b39615420a04583a14b46f8ddc22a721e83c62a935b5aea316c171236 | 57846 | 시간 엔진 자리(kair03·07·10) | 적용 |
| kc-clock-generator-b.webp | CX-0081KC_2C_clock-generator_b_r1.png | c304355bec7cef9e34da84453d42c3a2eec71d757ea6ad9748b0dee856087e90 | 214779 | 32b7dbb420f93ca6a7153c3d6bfd744f2ddc6e33fe925445a50692e57821306e | 55696 | 시간 엔진 자리(kair03·07·10) | 적용 |
| kc-command-console-a.webp | CX-0081KC_2B_command-console_a_r1.png | 94f4b3c6d22508b0604ce263460230be7a5bd2529964b6fdc945218da3f62587 | 225067 | cc6f7bf451ea8894deff22a87931523c6b0f8c167ef7f1466bca90a3f8306f23 | 42808 | 이끼 바위 자리(kair01·02·04·06) | 적용 |
| kc-command-console-b.webp | CX-0081KC_2B_command-console_b_r1.png | d1b3c05976bd2682743d394267ed6d7eba8ffc9ce5d11b9da61f5535145eb646 | 189074 | e47d0b8d3a53a123989205157cdc164405d1cda3c95e12a351714df23d8c5b10 | 35600 | 이끼 바위 자리(kair01·02·04·06) | 적용 |
| kc-data-gravestone-a.webp | CX-0081KC_2G_data-gravestone_a_r1.png | 263b30d17ac8e1fe2c24d9af7fa77ee46e92847e887782c12625da5d74a93f81 | 201824 | 0928b52324468a29180158d122dafbcdd45b6612e916ce441af0799efaf43e87 | 33768 | 봉인 기둥 자리(kair09 망각의 묘지) | 적용 |
| kc-data-gravestone-b.webp | CX-0081KC_2G_data-gravestone_b_r1.png | b42dc7e1a9e95494ddda3aba7753e0730ecb41a686658b0bb9964057292df9a6 | 191784 | 19c253e76fddb3ef1d5e8815dd176acd15e12c01846e65a3da5aa2999b7bcf8f | 31204 | 봉인 기둥 자리(kair09 망각의 묘지) | 적용 |
| kc-drainage-pump-a.webp | CX-0081KC_2J_drainage-pump_a_r1.png | e5457db3c7b04e2bcc199e7c4ac9fc76d62a016718b5b82afdcab65f369a34b5 | 235648 | f826b8158a2cd06eda788e22849150e076f645eba5fdbe2229432589408e69bb | 48452 | 이끼 바위 자리(kair06 수로) | 적용 |
| kc-drainage-pump-b.webp | CX-0081KC_2J_drainage-pump_b_r1.png | 6b78a0efeeea02eea1a33e22ccdb0ab8beaad8434b603ce09579978a741d4e14 | 230199 | 4beb99854c6b09d40b318979d682786b64f004db29bd9aee05404c5cac95002c | 50494 | 이끼 바위 자리(kair06 수로) | 적용 |
| kc-mold-ladle-a.webp | CX-0081KC_2L_mold-ladle_a_r1.png | 0e77f41c2cbccc3120e780f9c6c39319fb614722d12a6aa33660d6babcb28c2f | 188057 | cb67fd7359935c4595471bf35ebfdf49ce2e5a2b12acfd56339added0d46de45 | 34752 | 시간 엔진 자리(kair07 검은 공방) | 적용 |
| kc-mold-ladle-b.webp | CX-0081KC_2L_mold-ladle_b_r1.png | 34028a8eb6a0de22497b2fc139e521212ecb65eb29203ca95c6a5d84fcf39e34 | 183462 | ea5df411243958ad811c3d64a7a62bb61798129e6029fcf1442fb1cc24424617 | 43080 | 시간 엔진 자리(kair07 검은 공방) | 적용 |
| kc-neon-streetlamp-a.webp | CX-0081KC_2D_neon-streetlamp_a_r1.png | defa0b810579dda60a59a8443217475c12088925be6394f2ce89c55cf53af5a9 | 47928 | 65d3c6adb7e9c42212972e02dc7820102f2acb5ad439ce7f6dca36281a15d09a | 15066 | 이끼 바위 자리(kair01·04·06), a 방향만 | 적용 |
| kc-synapse-arch-a.webp | CX-0081KC_2I_synapse-arch_a_r1.png | 6494812cfebc81a13fe3a3b834a96fccc26f0fc3ab36f61dd2b75fcdb5c2f027 | 154427 | 8a3b7a2a5321ef8df36a2da46e8bee6427fdbb73c5126fca0c1897ee5204fdf1 | 43868 | 룬 포탈 자리(kair08 뉴런 게이트) | 적용 |
| kc-synapse-arch-b.webp | CX-0081KC_2I_synapse-arch_b_r1.png | 108392fbc076a110b7588353161451d03bd59cac16a34d11fc8501df4d25d631 | 150683 | dcde66c7e8ef8f9420f126659e730bd821032e446df1fef9afded8d63ed0490d | 41396 | 룬 포탈 자리(kair08 뉴런 게이트) | 적용 |
| kc-terminal-pillar-a.webp | CX-0081KC_2A_terminal-pillar_a_r1.png | 285df7d43339715271de6474fbcfa405e39be0443450e0272e40cfae441a6c3b | 168859 | 1d703a28f9c92cb07becaba4cab26ee56eb9e53f8d5e62e1d436502ff4a64380 | 40336 | 봉인 기둥 자리(kair01~04·06~08·10) | 적용 |
| kc-terminal-pillar-b.webp | CX-0081KC_2A_terminal-pillar_b_r1.png | 8559cd08a801e1364c8064aac4bed32ddd6c1397e83cf1c3b7712ff1e96512fb | 158443 | dfec1fe5286c76b7e09e7c57f8ced79bebba37ff8da509c8aef2908de41310f8 | 37602 | 봉인 기둥 자리(kair01~04·06~08·10) | 적용 |
| (없음) | CX-0081KC_2Dprime_indoor-wall-lamp_a/b_r1.png | 드라이브 원본 | | | | 벽에 다는 등, 바닥 자리뿐이라 보류 | 미적용 |
| (없음) | CX-0081KC_2K_command-dais_a/b_r1.png | 드라이브 원본 | | | | 밟는 단, 지나가는 장식 자리에 두면 발이 뚫고 지나가 보류 | 미적용 |
