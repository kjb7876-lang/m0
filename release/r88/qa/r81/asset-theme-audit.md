# R81 자산·환경 검사와 적용 계획

V4 문제는 자산 파일 자체보다 서로 다른 배치·지형 경로의 혼용에서 확인되었습니다. 병원 외 맵은 과거 병원 통로 생성기를 호출해 현재 병원의 B2 실내 전투 구조와 달랐고, 큰 원본 배경과 전체 범위 반복 배경을 유지했습니다. R74 범용 장식은 거미동굴에도 소나무·재나무를 넣었습니다. 신규 장식은 지역당 3개라 넓은 지도에 서사 특징을 전달하기 어려웠습니다.

원본 README, ASSET_GUIDE, scene-coverage, source PNG를 확인했습니다. dist01의 뼈 거미줄 아치와 dist02의 사람 얼굴 갈대 이미지는 투명 배경의 화면 정렬 아이소메트릭 소품입니다. 바닥으로 다시 눕히지 않습니다. 기존 R74 material/outdoor 아틀라스는 평면 소재 셀로 분리되어 있어 바닥·벽에 사용할 수 있습니다. terrainBridgeQuads는 r55PhysicalUV 자료에서 빈 결과를 반환하므로 아틀라스 전체가 원본 연결판으로 찍히는 문제는 아닙니다.

`data/story-rc51.js`의 실제 서사도 확인했습니다. kair06은 명령 영역이 겹치는 층, cult05는 성·현실·침투 기억의 귀환, cult06은 두 목표 회복과 코어 접근입니다. 이전 프로필의 오염 수로/생체 배양조/기계재판 환경을 표현 기준으로 사용하지 않습니다. 기존 서사·적·보스·ID·sourceEnvironment 메타데이터를 바꾸지 않고 별도 r81Environment만 적용합니다. 근거는 canonical-story-evidence.json에 남겼습니다.

## 적용 규칙

- 현재 병원 B2의 넓은 전투실·연결 통로를 다른 55 전투 지역의 공통 구조로 사용합니다. 병원 자체의 소품 11개는 이 환경 모듈에서 변경하지 않습니다.
- 바닥은 원본 아틀라스의 평면 소재 셀, 벽은 해당 소재의 수직 벽 셀입니다. 외부는 별도 걷는 바닥처럼 보이지 않게 벽 상단 덮개로 닫고, 전체 범위 평면 배경은 제거합니다.
- 원래 지역 소품 8개는 ID·원본 경로·물리 플래그를 유지하여 넓은 방들의 가장자리에 분산합니다. 범용 R74 장식은 해당 지역의 기존 소품 아트로 렌더 복사본만 바꿉니다.
- 신규 서사 소품은 큰 구조물 8개, 작은 소품 12개까지 제한하여 방 가장자리에 놓습니다. 출입문·목표·NPC·적 주변과 이동선을 비우고 겹침을 검사합니다.
- 바닥/벽/상단/경계의 색조는 구분합니다. 모든 지역을 병원 회색으로 통일하지 않습니다. 원본 PNG/음원/서사/저장 형식은 변경하지 않습니다.
- 이미지는 CPU 무결성과 단일 프레임만 확인된 자산입니다. 실제 브라우저/GPU·자연 플레이 합성은 별도이며 이 문서는 완료 증명이 아닙니다.

## 62개 장면별 기준

휴식 장면은 분류만 명시하며 새 전투 미로로 바꾸지 않습니다.

| 지역 | 정사 장면 | 소재 계열 | 벽 상단 색 | 선별 신규/기존 소품 |
|---|---|---|---|---|
| dist00 | 01 악마화 나무의 정원 | garden | #26322b | p01_root_wrapped_palace_arcade |
| dist01 | 02 거미동굴 | cave | #222630 | p02_bone_web_cave_arch |
| dist02 | 03 늪지대의 뿔악마 | swamp | #202b23 | p03_black_swamp_face_reed_knot |
| dist03 | 04 무너진성 | ash | #2b2326 | p04_broken_seal_chain_anchor / p05_scorched_castle_merlon |
| dist04 | 05 시체들이 되살아난 밤 | ash | #2b2326 | p06_leaning_grave_marker / p07_empty_broken_coffin |
| dist05 | 06 일곱 기둥 | ash | #2b2326 | p08_ember_chain_pillar / p09_extinguished_chain_pillar |
| dist06 | 07 추락 | ash | #2b2326 | p10_summoning_ring_keystone / p11_collapsed_palace_column / p12_ritual_fire_brazier |
| ep1a08 | 08 피로 물든 병원 | clinical | #293637 | hospital-bed-isometric / patient-monitor-isometric / hospital_medicine_cabinet / hospital_wheelchair / hospital_iv_pole / hospital_bedside_locker / hospital_consultation_table / hospital_instrument_tray |
| ep1a09 | 09-1 주사실 | clinical | #293637 | hospital_medicine_cabinet / hospital_instrument_tray |
| ep1a09b | 09-2 결전의 날 | stone | #292e36 | 01-past-seal-reliquary |
| ep1a10 | 10 환자와 중독의 도시 | stone | #292e36 | 02-closed-city-storefront |
| ep1a11 | 11 천사의 가면과 의목사 후보생 | stone | #292e36 | 03-detached-angelic-mask |
| dreamRest | 12 기억해 내지 못하는 사람 〔쉼터〕 | clinical | #293637 | hospital_consultation_table / hospital_consultation_chair / hospital_water_tray |
| ep1b01 | 13 솔로몬의 봉인식 | stone | #292e36 | ep1b01-seal-pedestal |
| ep1b02 | 14 나태의 집 | domestic | #332e30 | ep1b02-refuse-heap / ep1b02-decayed-sofa |
| ep1b03 | 15 금이 간 안경 | domestic | #332e30 | ep1b03-fractured-mirror |
| ep1b04 | 16 탐식의 주방 | domestic | #332e30 | ep1b04-warped-kitchen-stove |
| ep1b05 | 17 붉은 하이힐 | stone | #292e36 | ep1b05-control-crossbar-stand |
| ep1b06 | 18 맘몬의 금고 | forge | #272d35 | ep1b06-vault-door |
| ep1b06b | 19 눈보라 속의 소년 | snow | #2e3d48 | ep1b06b-snow-heavy-fir |
| ep1b07 | 20 불을 지른 남자 | ash | #2b2326 | ep1b07-scorched-stair-landing / ep1b07-burned-firedoor |
| ep1b08 | 21 하늘에 서려는 자 | stone | #292e36 | ep1b08-electrode-altar |
| ep1b09 | 22 생체 부트로더 | snow | #2e3d48 | ep1b09-black-sun-dish |
| restEp1b | 23 사라진 귀환자 〔쉼터〕 | clinical | #293637 | empty_neural_connection_capsule / dual_waveform_neural_monitor |
| u201 | 24 방어의 군단 | neural | #24333a | controller_drone_control_tower |
| u202 | 25 잔인한 구원 | neural | #24333a | controller_rising_machine_wall |
| u204 | 26 시스템의 거부권 | memory | #302b3a | controller_external_command_relay |
| u205 | 27 관리자 권한 | memory | #302b3a | 04-empty-authority-console |
| u206 | 28 중앙 코어 이주실 | neural | #24333a | controller_migration_support_cradle |
| u203 | 29 기억의 문 | memory | #302b3a | controller_preserved_memory_gate |
| restU2 | 30 환도 자아의 탄생 〔쉼터〕 | memory | #302b3a | 05-three-water-cups-tray |
| last304 | 31 중립 지역의 재각성 | garden | #26322b | fusion_field_ruin_arch |
| last305 | 32 고블린 두목과 장미 인장 | garden | #26322b | 06-goblin-flute-rose-seal |
| last301 | 33 타락천사 기사 | coast | #25353e | fusion_storm_rampart |
| last302 | 34 잠들지 못하는 마을 | coast | #25353e | harbor_broken_giwa_cluster / harbor_jangseung_post / harbor_tiled_house |
| last303 | 35 한약과 불면귀 | coast | #25353e | harbor_herbal_cup |
| restLast3 | 36 끼어든 시간 〔쉼터〕 | memory | #302b3a | 07-displaced-doorway-frame |
| kair01 | 37 최초명령의 세계 | stone | #292e36 | 01-academy-command-core |
| kair04 | 38 예순여섯 수문장 | stone | #292e36 | 02-layered-guardian-gate-isometric-v2 |
| kair05 | 39 빼앗긴 시간 | garden | #26322b | 03-clock-root-tree |
| kair06 | 40 닫힌 층의 명령 | forge | #272d35 | 04-overlapping-command-threshold |
| kair07 | 41 검은 공방 | forge | #272d35 | 05-black-sand-furnace / 06-possibility-reservoir |
| kair08 | 42 뉴런 게이트 · 노이론 게이트 | memory | #302b3a | 07-neuron-noiron-gate |
| kair09 | 43 망각의 묘지 | stone | #292e36 | 08-clock-fragment-memorial |
| kair10 | 44 붕괴 의식장 | memory | #302b3a | 09-six-command-ring-pedestal |
| kair02 | 45 아르벨리아, 유예의 수문장 | forge | #272d35 | 10-stopped-pendulum-clock |
| kair03 | 46 세이렌 모르 | memory | #302b3a | 11-production-line-time-press |
| restKairo | 47 최초명령 재작성 〔쉼터〕 | garden | #26322b | 12-asynchronous-clock-pair |
| hando01 | 48 성 안에 소환된 의목사 | stone | #292e36 | 01-fused-castle-gate-v2 |
| hando02 | 49 두 주인의 각성 | stone | #292e36 | 13-independent-bronze-seal / 14-independent-silver-seal / 02-independent-seal-pedestals |
| hando03 | 50 함께 되찾은 코어 | memory | #302b3a | 03-shared-core-cradle / 04-severed-restraint-anchor |
| restHando | 51 잘못 이어진 기록 〔쉼터〕 | memory | #302b3a | 05-redacted-enrollment-ledger |
| murder01 | 52 윤하람 | coast | #25353e | 06-blue-green-traffic-signal / 07-wet-crossing-curb |
| murder02 | 53 장민재와 새빛호텔 | domestic | #332e30 | 08-hotel-access-console / 09-wet-hotel-stair-module |
| murder04 | 54 고서진과 청록빌라 | domestic | #332e30 | 10-hotel-memory-alarm-box / 11-jammed-hotel-fire-door |
| murder03 | 55 옥상의 순환 | coast | #25353e | 12-rooftop-vent |
| cult01 | 56 하나로 묶인 악몽 | neural | #24333a | cult01-black-rose-chip-altar / cult01-electronic-chip-reliquary |
| cult02 | 57 교주가 기다리는 전쟁 | neural | #24333a | cult02-collective-ego-connector / cult02-individual-memory-vessels |
| cult05 | 58 돌아오는 현실의 기억 | stone | #292e36 | cult05-fractured-castle-memory-frame / cult05-layered-reality-record-slab |
| cult06 | 59 처음 세웠던 목표 | memory | #302b3a | cult06-dual-objective-waymarker / cult06-separated-self-memory-holders |
| cult03 | 60 사몽의 문턱 | memory | #302b3a | cult03-order-barrier-projector |
| cult04 | 61 교주의 사몽 | memory | #302b3a | cult04-disconnected-puppet-line-anchor / cult04-preservable-core-pedestal |
