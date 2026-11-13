# 지역·몹 이름 → 지금 게임이 실제로 그리는 그림 (CX-0082MV 요청표 대조)

조사: 헤드리스(소프트웨어 렌더링) 최신 빌드(main a06bd166 + R974), 지역마다 일반몹·중간보스를 모두 화면에 불러 걷게 하고 몸통 그림 명령의 경로를 셈. 비율은 걷는 동안(공격 제외) 그려진 프레임 비율.
판정: **그대로** = 요청표 원본 그림이 걷는 동안 그려짐 / **파생** = 원본에서 만든 동작 시트(r92·r109·r116·r198 M번호 등, 같은 인물)로 그려짐 → Dots 그림 적용 가능 / **다른 그림** = 이름별 새 그림(r223·r275·r290·r380·r410 등)으로 바뀜 → 원본 기준으로 그린 이동 시트는 못 씀.
파생 여부는 경로 규칙으로 추정한 것이라, 적용 전에 그림을 직접 열어 확인합니다. GPU·실기기 미검증.
표의 행은 요청표에 적힌 이름과 같은 몹만 싣는다(같은 nativeId 로 나오는 '유리 망령' 변종은 r410 m018 그림이라 뺌). 조사한 지역: ep1b05, ep1b01, ep1b02, ep1b08, ep1b07, hando01, hando03, kair01, kair03, last305, last302, last304, murder01, murder02, murder03, murder04, u201, u202, u204, u205, u206, cult01, dist05, kair02, kair04, kair05, kair06, kair07, kair08, kair09, kair10, ep1b03, ep1b04, ep1b09, cult02, cult03, cult04, cult05, cult06, hando02, u203, dist00, dist01, dist02, dist03, dist04, dist06, ep1a08, ep1a09, ep1a10, ep1a11, ep1a09b. 아직 조사 중인 지역은 다음 판에 더한다.
요약: 조사한 번호 127개 중 일부 지역이라도 쓸 수 있는 번호 89개(001, 006, 008, 009, 010, 015, 016, 017, 022, 023, 024, 026, 027, 028, 029, 031, 034, 037, 038, 040, 042, 044, 045, 047, 050, 051, 052, 054, 055, 056, 057, 062, 063, 064, 068, 069, 070, 071, 072, 073, 074, 075, 076, 077, 078, 079, 080, 081, 082, 083, 084, 086, 087, 088, 089, 090, 091, 092, 093, 094, 095, 096, 097, 098, 099, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 128), 모든 지역에서 다른 그림인 번호 38개(002, 003, 004, 005, 007, 011, 012, 013, 014, 018, 019, 020, 021, 025, 030, 032, 033, 035, 036, 039, 041, 043, 046, 048, 049, 053, 058, 059, 060, 061, 065, 066, 067, 123, 124, 125, 126, 127).


| 번호 | 요청표 원본 | 지역 | nativeId | 게임 속 이름 | 판정 | 실제 그림(걷는 동안 %) |
|---|---|---|---|---|---|---|
| 001 | blue_executor.webp | murder04 | murder04-e3 | 은폐기록 연결체 | 파생 | r116/mobs/M125-idle.png 97%, episode1b/generated-v394/blue_executor.webp 3% |
| 002 | nameless_sword_trace.webp | hando02 | h102-t1 | 무명 검흔 | **다른 그림** | r380/mobs/legacy-m119-nameless-scar-v4-walk-d1.webp 100% |
| 003 | black_rose_chip_penitent.webp | cult03 | c103-e1 | EGO 구속 연결자 | **다른 그림** | r380/mobs/cult-ego-binder-walk-d1.webp 94%, cult-v3123/black_rose_chip_penitent.webp 6% |
| 004 | black_rose_demon_soldier.webp | cult05 | c105-e2 | 생체기계 악몽 | **다른 그림** | r380/mobs/legacy-m134-nightmare-v4-walk-d1.webp 100% |
| 004 | black_rose_demon_soldier.webp | cult05 | c105-e2 | 설원 아래의 기계 다리 | **다른 그림** | r380/mobs/cult-mech-legs-walk-d1.webp 100% |
| 005 | polar_cyborg_hound.webp | ep1b09 | b09-h1 | 강철 턱의 사이보그 개 | **다른 그림** | r380/mobs/ep1b-steel-jaw-hound-walk-d1.webp 100% |
| 006 | wrath_satan.webp | ep1b07 | b07-s1 | 불길 속의 용 | 그대로 | episode1b/generated-v394/wrath_satan.webp 100% |
| 006 | wrath_satan.webp | ep1b07 | b07-s1 | 분노의 사냥개 | **다른 그림** | r380/mobs/wrath-hound-v1.webp 100% |
| 007 | memory_excision_connector.webp | hando02 | h102-c1 | 기억절제 연결자 | **다른 그림** | r380/mobs/hando-memory-excision-connector-walk-d1.webp 100% |
| 008 | order_seal_officer.webp | hando02 | h102-s2 | 코어 운반 집행자 | 그대로 | hando-v3123/order_seal_officer.webp 100% |
| 009 | phantom_reclaim_blade.webp | hando03 | h103-s1 | 환수검 모조체 | 그대로 | hando-v3123/phantom_reclaim_blade.webp 100% |
| 010 | return_coordinate_devourer.webp | hando01 | h101-s2 | 의존 신호 포식자 | 그대로 | hando-v3123/return_coordinate_devourer.webp 100% |
| 011 | silverless_shadow.webp | hando03 | h103-t1 | 백은 없는 그림자 | **다른 그림** | r380/mobs/legacy-m124-silverless-shadow-v4.webp 100% |
| 012 | u2_reactor_collector.webp | u202 | u202-e1 | 가짜 자비 수집가 | **다른 그림** | r380/mobs/u2-false-mercy-collector-walk-d1.webp 100% |
| 012 | u2_reactor_collector.webp | u205 | u205-e3 | 역전기록 수집가 | **다른 그림** | r374/mobs/u205-e3-new.webp 100% |
| 013 | u2_void_wraith.webp | u204 | u204-e2 | 기계화 기억 공백 망령 | **다른 그림** | r380/mobs/u204-mech-02-v1.webp 100% |
| 013 | u2_void_wraith.webp | u205 | u204-e2 | 기계화 기억 공백 망령 | **다른 그림** | r380/mobs/u204-mech-02-v1.webp 100% |
| 013 | u2_void_wraith.webp | u205 | u205-e1 | 학대기록 공허체 | **다른 그림** | r374/mobs/u205-e1-new.webp 100% |
| 014 | black_robed_nightmare_demon.webp | cult02 | c102-e1 | 신경 케이블 포식체 | **다른 그림** | r380/mobs/cult-nerve-cable-devourer-walk-d1.webp 95%, cult-v3123/black_robed_nightmare_demon.webp 5% |
| 014 | black_robed_nightmare_demon.webp | cult06 | c106-e2 | 기계재판 연결자 | **다른 그림** | r275/mobs/superego-inquisitor.webp 100% |
| 015 | ego_corrosion_vessel.webp | ep1a11 | a11-d1 | 초자아 잠식체 | 그대로 | episode1a/generated-v392/ego_corrosion_vessel.webp 83%, r92/mobs/M017-attack.png 16%, rc137/mob-attacks-02.png 1% |
| 016 | ep1b08_pride_zombie.webp | ep1b08 | b08-h1 | 흑마법사의 저주창 | 파생 | r116/mobs/M032-idle.png 84%, r92/mobs/M032-attack.png 16%, episode1b/generated-v3102/ep1b08_pride_zombie.webp 0% |
| 017 | glutton_beelzebub.webp | ep1b04 | b04-b1 | 살아 있는 거대한 위장 | 파생 | r198/mobs/M024-idle.png 83%, r92/mobs/M024-attack.png 14%, episode1b/generated-v394/glutton_beelzebub.webp 3% |
| 018 | lust_asmodai.webp | ep1b05 | b05-a1 | 붉은 하이힐 칼날 | **다른 그림** | r380/mobs/ep1b-red-heel-blade-walk-d1.webp 100% |
| 019 | polar_chairman.webp | ep1b09 | b09-c1 | 설원 잠복 보행기 | **다른 그림** | r380/mobs/snow-lurker-walker-v1.webp 100% |
| 020 | silver_seal_sentinel.webp | hando02 | h102-s1 | 붕괴선 파수병 | **다른 그림** | r380/mobs/hando-silver-seal-sentinel-walk-d1.webp 100% |
| 021 | timeless_silver_scout.webp | hando01 | h101-t1 | 악몽 정찰체 | **다른 그림** | r380/mobs/hando-timeless-silver-scout-walk-d1.webp 100% |
| 022 | connector.png | kair01 | kair-academy-wave-5 | 최초명령 훈련파동 | **다른 그림** | r275/mobs/clockwork-sentinel.webp 100% |
| 022 | connector.png | kair03 | kair-academy-wave-5 | 최초명령 훈련파동 | **다른 그림** | r275/mobs/clockwork-sentinel.webp 100% |
| 022 | connector.png | kair03 | kair-academy-wave-2 | 시간핵의 명령 파동 | 그대로 | kair/enemies/connector.png 100% |
| 023 | resonance-slave.png | kair01 | kair-academy-wave-6 | 최초명령 훈련파동 | **다른 그림** | r275/mobs/clockwork-sentinel.webp 100% |
| 023 | resonance-slave.png | kair03 | kair-academy-wave-6 | 최초명령 훈련파동 | **다른 그림** | r275/mobs/clockwork-sentinel.webp 100% |
| 023 | resonance-slave.png | kair03 | kair-academy-wave-3 | 시간핵의 명령 파동 | 그대로 | kair/enemies/resonance-slave.png 100% |
| 024 | u2_suppression_knight.webp | u202 | u202-e3 | 감옥 공명기사 | 파생 | r116/mobs/M041-idle.png 78%, r92/mobs/M041-attack.png 18%, u2/generated-v350/u2_suppression_knight.webp 4% |
| 025 | goat_head_demon_mob_bloodied.webp | dist02 | dist02-h1 | 늪의 염소머리 악마 | **다른 그림** | r380/mobs/swamp-goat-darkgreen-v1.webp 100% |
| 025 | goat_head_demon_mob_bloodied.webp | dist02 | dist02-h1 | 늪 뿌리 추적자 | **다른 그림** | r380/mobs/swamp-root-stalker-darkgreen-v2-walk-d1.webp 100% |
| 026 | angry_green_slime.webp | cult02 | c102-e3 | 과열 시냅스 점액체 | 파생 | r92/mobs/M131-move.png 87%, r116/mobs/M131-idle.png 13%, cult-v3123/angry_green_slime.webp 0% |
| 026 | angry_green_slime.webp | cult03 | c102-e3 | 과열 시냅스 점액체 | 파생(추정) | r92/mobs/M131-move.png 75%, r116/mobs/M131-idle.png 25% |
| 026 | angry_green_slime.webp | cult03 | c103-e3 | ID 잔류 점액체 | **다른 그림** | r410/mobs/m060.webp 100% |
| 027 | pride_cyborg_cult_leader.webp | cult04 | c104-e1 | 소환좌 칩 수호체 | 파생 | r109/mobs/M137-move.png 70%, cult-v3123/pride_cyborg_cult_leader.webp 30% |
| 028 | superego_cyborg_cult_leader.webp | cult06 | c106-e1 | SUPER EGO 판결인장 | 파생 | r92/mobs/M135-move.png 94%, cult-v3123/superego_cyborg_cult_leader.webp 6% |
| 029 | brainwave_contamination.webp | ep1b01 | b01-c1 | 검은 실의 외부 신호 | 파생 | r109/mobs/M019-move.png 100%, episode1b/generated-v392/brainwave_contamination.webp 0% |
| 030 | u2_observer_spider.webp | u204 | u204-e3 | 기계화 문턱 관측거미 | **다른 그림** | r380/mobs/u204-mech-03-v1.webp 100% |
| 031 | black_rose_crystal_guardian.webp | cult02 | c102-e2 | 합일 주파수 결정 | 그대로 | cult-v3123/black_rose_crystal_guardian.webp 100% |
| 031 | black_rose_crystal_guardian.webp | cult03 | c102-e2 | 합일 주파수 결정 | 그대로 | cult-v3123/black_rose_crystal_guardian.webp 100% |
| 031 | black_rose_crystal_guardian.webp | cult03 | c103-e2 | SUPER EGO 절개결정 | **다른 그림** | r290/mobs/m059.webp 100% |
| 031 | black_rose_crystal_guardian.webp | cult04 | c103-e2 | SUPER EGO 절개결정 | **다른 그림** | r290/mobs/m059.webp 100% |
| 032 | green_enemy_slime.webp | cult01 | c101-e3 | 세뇌 신호 점액체 | **다른 그림** | r380/mobs/legacy-m130-slime-cult01-v2.webp 86%, r92/mobs/M130-move.png 11%, r116/mobs/M130-idle.png 2% |
| 032 | green_enemy_slime.webp | cult05 | c105-e1 | ID 배양 점액체 | **다른 그림** | r380/mobs/legacy-m130-slime-cult05-v2.webp 91%, r410/mobs/m056.webp 9% |
| 033 | cult_mage.png | dist02 | dist02-m1 | 수렁 주문사 | **다른 그림** | r380/mobs/swamp-mage-darkgreen-v1.webp 100% |
| 033 | cult_mage.png | dist05 | dist05-m1 | 검은기둥 주문사 | **다른 그림** | r410/mobs/m009.webp 100% |
| 033 | cult_mage.png | dist06 | dist06-m1 | 검은기둥 주문사 | **다른 그림** | r410/mobs/m009.webp 100% |
| 034 | ghoul.png | dist03 | dist03-g1 | 피냄새 추적자 | **다른 그림** | r275/mobs/ember-hound.webp 100% |
| 034 | ghoul.png | dist04 | dist03-g1 | 피냄새 추적자 | **다른 그림** | r275/mobs/ember-hound.webp 100% |
| 034 | ghoul.png | dist04 | dist04-g1 | 피로 꿰맨 전령 | **다른 그림** | r275/mobs/twin-head-corpse.webp 100% |
| 034 | ghoul.png | ep1a09b | dist03-g1 | 피냄새 추적자 | 파생 | r92/mobs/M006-move.png 96%, dist/ghoul.png 4% |
| 035 | skeleton.png | dist03 | dist03-s1 | 피냄새 추적자 | **다른 그림** | r275/mobs/ember-hound.webp 100% |
| 035 | skeleton.png | dist04 | dist03-s1 | 피냄새 추적자 | **다른 그림** | r275/mobs/ember-hound.webp 100% |
| 035 | skeleton.png | dist04 | dist04-s1 | 이름 잃은 전우 | **다른 그림** | r410/mobs/m007.webp 100% |
| 036 | corrupted_guardian.webp | dist00 | a11-c1 | 악마화 나무의 침식 근위 | **다른 그림** | r275/mobs/root-bound-ghoul.webp 100% |
| 036 | corrupted_guardian.webp | dist03 | dist03-c1 | 보라검 추격천사 | **다른 그림** | r290/mobs/m004.webp 100% |
| 036 | corrupted_guardian.webp | dist04 | dist03-c1 | 보라검 추격천사 | **다른 그림** | r290/mobs/m004.webp 100% |
| 037 | addiction_ruin_core.webp | ep1a10 | a10-v1 | 중독의 폐허핵 | 파생 | r92/mobs/M015-move.png 89%, episode1a/generated-v392/addiction_ruin_core.webp 11% |
| 038 | corridor_scream_echo.webp | ep1a08 | a08-s1 | 복도 비명잔영 | 파생 | visual-test/hospital-ranged-motion-r52.png 93%, visual-test/hospital-ranged-back-r53.png 7%, episode1a/generated-v392/corridor_scream_echo.webp 0% |
| 039 | craving_vial_core.webp | ep1a09 | a09-v1 | 갈망의 약병핵 | **다른 그림** | r275/mobs/vial-collector.webp 100% |
| 040 | denial_specter.webp | ep1a10 | a10-s1 | 부정의 잔영 | 파생 | r92/mobs/M016-move.png 90%, episode1a/generated-v392/denial_specter.webp 10% |
| 041 | hallucinated_orderly.webp | ep1a09 | a09-o1 | 주사실 감시환각 | **다른 그림** | r275/mobs/thread-nurse.webp 100%, r223/mobs/thread-nurse.webp 0% |
| 041 | hallucinated_orderly.webp | ep1a10 | a09-o1 | 주사실 감시환각 | **다른 그림** | r275/mobs/thread-nurse.webp 100% |
| 041 | hallucinated_orderly.webp | ep1a10 | a10-o1 | 암시장의 수상한 자 | **다른 그림** | r380/mobs/blackmarket-suspect-v1.webp 100% |
| 041 | hallucinated_orderly.webp | ep1a11 | a10-o1 | 암시장의 수상한 자 | **다른 그림** | r380/mobs/blackmarket-suspect-v1.webp 100% |
| 042 | horned_swamp_demon.webp | dist05 | dist05-h1 | 소환진 순례악마 | 파생 | r109/mobs/M008-move.png 94%, episode1a/horned_swamp_demon.webp 3%, r116/mobs/M008-idle.png 3% |
| 042 | horned_swamp_demon.webp | dist06 | dist06-h1 | 지옥문 파수악마 | **다른 그림** | r410/mobs/m011.webp 100% |
| 043 | nightmare_spider.webp | dist01 | dist01-sp2 | 보랏빛 알집지기 | **다른 그림** | r380/mobs/purple-eggkeeper-v1.webp 100% |
| 043 | nightmare_spider.webp | dist01 | dist01-sp1 | 보랏빛 알집지기 | **다른 그림** | r380/mobs/purple-eggkeeper-v1.webp 100% |
| 043 | nightmare_spider.webp | dist01 | dist01-sp1 | 기억 운반거미 | **다른 그림** | r290/mobs/m005.webp 100% |
| 043 | nightmare_spider.webp | dist02 | dist01-sp2 | 보랏빛 알집지기 | **다른 그림** | r380/mobs/purple-eggkeeper-v1.webp 100% |
| 043 | nightmare_spider.webp | dist02 | dist01-sp1 | 기억 운반거미 | **다른 그림** | r290/mobs/m005.webp 100% |
| 043 | nightmare_spider.webp | dist02 | dist01-sp1 | 보랏빛 알집지기 | **다른 그림** | r380/mobs/purple-eggkeeper-v1.webp 100% |
| 043 | nightmare_spider.webp | ep1a09b | dist03-sp1 | 기억 운반거미 | **다른 그림** | r290/mobs/m005.webp 100% |
| 044 | envy_glass_shard.webp | ep1b01 | b01-s1 | 이름 없던 공포 | 파생(추정) | r92/mobs/M018-move.png 100% |
| 044 | envy_glass_shard.webp | ep1b03 | b03-g1 | 질투로 얼룩진 망령 | **다른 그림** | r380/mobs/jealousy-wraith-v1.webp 100% |
| 045 | envy_leviathan.webp | ep1b03 | b03-c1 | 긴 뱀의 그림자 | 파생 | r92/mobs/M023-move.png 99%, episode1b/generated-v394/envy_leviathan.webp 1% |
| 046 | glutton_kitchen_scrap.webp | ep1b04 | b04-s1 | 끓어오르는 검은 소화액 | **다른 그림** | r290/mobs/m025.webp 100% |
| 046 | glutton_kitchen_scrap.webp | ep1b04 | b04-g1 | 버려진 최고급 식재료 | **다른 그림** | r380/mobs/discarded-delicacy-v1.webp 100% |
| 047 | lust_heart_marionette.webp | ep1b05 | b05-p2 | 공중을 가르는 립스틱 탄환 | 파생 | r92/mobs/M027-move.png 99%, episode1b/generated-v394/lust_heart_marionette.webp 1% |
| 047 | lust_heart_marionette.webp | ep1b05 | b05-p1 | 얼굴 없는 남자의 박수 | **다른 그림** | r275/mobs/curtain-mannequin.webp 100% |
| 048 | seal_residual.webp | ep1b01 | b01-r1 | 일흔두 번째 인장 잔류체 | **다른 그림** | r380/mobs/ep1b-seal-residual-float-d1.webp 100% |
| 048 | seal_residual.webp | ep1b02 | b01-r1 | 일흔두 번째 인장 잔류체 | **다른 그림** | r380/mobs/ep1b-seal-residual-float-d1.webp 100% |
| 049 | sloth_belphegor.webp | ep1b02 | b02-b1 | 살아 움직이는 쓰레기들 | **다른 그림** | r380/mobs/living-trash-v1.webp 100% |
| 050 | sloth_moldling.webp | ep1b02 | b02-m1 | 곰팡이와 오물 봉투 | 파생 | r198/mobs/M022-move.png 100%, episode1b/generated-v394/sloth_moldling.webp 0% |
| 051 | wrath_fire_beast.webp | ep1b07 | b07-f2 | 개와 늑대의 시간 | **다른 그림** | r290/mobs/m030.webp 100% |
| 051 | wrath_fire_beast.webp | ep1b07 | b07-f1 | 불길 속의 늑대 | 파생 | r198/mobs/M030-move.png 95%, episode1b/generated-v394/wrath_fire_beast.webp 4%, r198/mobs/M030-idle.png 1% |
| 052 | ego_theft_connector.webp | hando03 | h103-c1 | EGO 탈취 연결자 | 파생 | r92/mobs/M122-move.png 94%, hando-v3123/ego_theft_connector.webp 6% |
| 053 | false_signal_seal_guard.webp | hando01 | h101-s1 | 성벽 침식 봉인병 | **다른 그림** | r275/mobs/ash-mason.webp 99%, r223/mobs/ash-mason.webp 1% |
| 054 | time-collector.png | kair01 | kair-academy-wave-1 | 최초명령 훈련파동 | **다른 그림** | r275/mobs/clockwork-sentinel.webp 100%, r223/mobs/clockwork-sentinel.webp 0% |
| 054 | time-collector.png | kair01 | kair-academy-wave-4 | 최초명령 훈련파동 | **다른 그림** | r275/mobs/clockwork-sentinel.webp 100% |
| 054 | time-collector.png | kair03 | kair-academy-wave-1 | 최초명령 훈련파동 | **다른 그림** | r275/mobs/clockwork-sentinel.webp 100% |
| 054 | time-collector.png | kair03 | kair-academy-wave-4 | 최초명령 훈련파동 | **다른 그림** | r275/mobs/clockwork-sentinel.webp 100% |
| 054 | time-collector.png | kair03 | kair-academy-wave-1 | 시간핵의 명령 파동 | 파생 | r116/mobs/M054-idle.png 99%, kair/enemies/time-collector.png 1% |
| 055 | Monster_Goblin.png | last305 | l305-e2 | 피리 고블린 | **다른 그림** | r410/mobs/m044.webp 100% |
| 055 | Monster_Goblin.png | last305 | l305-e1 | 숲 고블린 | 파생 | r198/mobs/M047-move.png 86%, r198/mobs/M047-idle.png 11%, last3/Monster_Goblin.png 3% |
| 056 | Monster_Slime.png | last304 | l304-e3 | 장미이슬 슬라임 | **다른 그림** | r410/mobs/m043.webp 100% |
| 056 | Monster_Slime.png | last304 | l304-e1 | 중립초원 슬라임 | 파생 | r92/mobs/M045-move.png 96%, last3/Monster_Slime.png 3%, r198/mobs/M045-idle.png 1% |
| 057 | Monster_Wolf.png | last304 | l304-e2 | 중립초원 늑대 | 파생 | r198/mobs/M046-move.png 87%, r198/mobs/M046-idle.png 10%, last3/Monster_Wolf.png 3% |
| 058 | rooftop_echo.png | murder01 | murder04-e2 | 빗속 횡단보도의 기억 잔향 | **다른 그림** | r275/mobs/signal-golem.webp 100% |
| 058 | rooftop_echo.png | murder02 | murder04-e2 | 빗속 횡단보도의 기억 잔향 | **다른 그림** | r275/mobs/signal-golem.webp 100% |
| 058 | rooftop_echo.png | murder02 | murder04-e2 | 지워진 CCTV 기록의 잔향 | **다른 그림** | r410/mobs/m050.webp 100% |
| 058 | rooftop_echo.png | murder03 | murder04-e2 | 지워진 CCTV 기록의 잔향 | **다른 그림** | r410/mobs/m050.webp 100% |
| 059 | silent_alarm.png | murder04 | murder04-e1 | 공실 표기 잔재 | **다른 그림** | r290/mobs/m052.webp 100% |
| 060 | u2_blue_wraith.webp | u204 | u204-e1 | 기계화 첫 기억 청람잔영 | **다른 그림** | r380/mobs/u204-mech-01-v1.webp 100% |
| 060 | u2_blue_wraith.webp | u206 | u206-e3 | 입양기억 청람잔영 | **다른 그림** | r410/mobs/m039.webp 100% |
| 061 | u2_cyborg_hound.webp | u201 | u201-e2 | 전쟁기계사냥개 | **다른 그림** | r380/mobs/war-machine-hound-v1.webp 100% |
| 061 | u2_cyborg_hound.webp | u205 | u205-e2 | 관리자 추적견 | **다른 그림** | r374/mobs/u205-e2-new.webp 100% |
| 062 | u2_memory_orb.webp | u202 | u202-e2 | 복종 봉인구 | 파생 | r92/mobs/M039-move.png 96%, u2/generated-v350/u2_memory_orb.webp 4% |
| 062 | u2_memory_orb.webp | u206 | u206-e1 | 기계화 기억이주 연결자 | **다른 그림** | r380/mobs/u206-mech-01-v1.webp 100% |
| 063 | u2_resonance_knight.webp | u201 | u201-e3 | 참호 공명기사 | 파생 | r116/mobs/M037-idle.png 76%, r92/mobs/M037-attack.png 20%, u2/generated-v350/u2_resonance_knight.webp 4% |
| 063 | u2_resonance_knight.webp | u206 | u206-e2 | 기계화 공명술사 | **다른 그림** | r380/mobs/u206-mech-02-v1.webp 100% |
| 064 | mdrone_idle.png | u201 | u201-e1 | 전쟁기억 정찰드론 | 파생 | r92/mobs/M038-move.png 95%, u2/mdrone_idle.png 5% |
| 065 | zombie_guardian_knight_bloodied.webp | ep1b08 | b08-c1 | 전극기계수호기사 | **다른 그림** | r380/mobs/electrode-machine-knight-v1.webp 100% |
| 066 | earcovered_modern_cultist_bloodied.webp | cult01 | c101-e2 | 흑장미 귀막은 신도 | **다른 그림** | r275/mobs/censer-priest.webp 99%, r223/mobs/censer-priest.webp 1% |
| 066 | earcovered_modern_cultist_bloodied.webp | cult01 | c101-e2 | 기계화 복종 봉인구 | **다른 그림** | r380/mobs/cult-memory-orb-float-d1.webp 100% |
| 067 | blindfold_modern_cultist_bloodied.webp | cult01 | c101-e1 | 흑장미 눈가린 신도 | **다른 그림** | r363/mobs/L128.webp 100% |
| 067 | blindfold_modern_cultist_bloodied.webp | cult01 | c101-e1 | 기계화 복종 봉인구 | **다른 그림** | r380/mobs/cult-memory-orb-float-d1.webp 100% |
| 068 | gargoyle_mob_bloodied.webp | dist05 | dist05-c1 | 검은기둥 가고일 수호자 | 파생 | r109/mobs/M007-move.png 97%, episode1a/generated-v31342-rc39/gargoyle_mob_bloodied.webp 3% |
| 069 | guardian_02.webp | kair04 | kair-guardian-02 | 시간수문장 | 그대로 | generated-v3125/kair-guardians/guardian_02.webp 100% |
| 070 | guardian_05.webp | kair04 | kair-guardian-05 | 시간수문장 | 그대로 | generated-v3125/kair-guardians/guardian_05.webp 100% |
| 071 | guardian_13.webp | kair06 | kair-guardian-13 | 시간수문장 | 그대로 | generated-v3125/kair-guardians/guardian_13.webp 100% |
| 072 | guardian_14.webp | kair06 | kair-guardian-14 | 시간수문장 | 그대로 | generated-v3125/kair-guardians/guardian_14.webp 100% |
| 073 | guardian_19.webp | kair07 | kair-guardian-19 | 시간수문장 | 그대로 | generated-v3125/kair-guardians/guardian_19.webp 100% |
| 073 | guardian_19.webp | kair07 | kair-guardian-19 | 기계화 감옥 공명기사 | **다른 그림** | u2/generated-v350/u2_suppression_knight.webp 78%, rc137/mob-attacks-03.png 22% |
| 074 | guardian_21.webp | kair07 | kair-guardian-21 | 시간수문장 | 그대로 | generated-v3125/kair-guardians/guardian_21.webp 100% |
| 074 | guardian_21.webp | kair07 | kair-guardian-21 | 기계화 감옥 공명기사 | **다른 그림** | u2/generated-v350/u2_suppression_knight.webp 93%, rc137/mob-attacks-03.png 7% |
| 075 | guardian_22.webp | kair07 | kair-guardian-22 | 시간수문장 | 그대로 | generated-v3125/kair-guardians/guardian_22.webp 100% |
| 075 | guardian_22.webp | kair07 | kair-guardian-22 | 기계화 감옥 공명기사 | **다른 그림** | u2/generated-v350/u2_suppression_knight.webp 80%, rc137/mob-attacks-03.png 20% |
| 076 | guardian_24.webp | kair07 | kair-guardian-24 | 시간수문장 | 그대로 | generated-v3125/kair-guardians/guardian_24.webp 100% |
| 077 | guardian_31.webp | kair09 | kair-guardian-31 | 시간수문장 | 그대로 | generated-v3125/kair-guardians/guardian_31.webp 100% |
| 078 | guardian_32.webp | kair09 | kair-guardian-32 | 시간수문장 | 그대로 | generated-v3125/kair-guardians/guardian_32.webp 100% |
| 079 | guardian_33.webp | kair09 | kair-guardian-33 | 시간수문장 | 그대로 | generated-v3125/kair-guardians/guardian_33.webp 100% |
| 080 | guardian_37.webp | kair10 | kair-guardian-37 | 시간수문장 | 그대로 | generated-v3125/kair-guardians/guardian_37.webp 100% |
| 081 | guardian_38.webp | kair10 | kair-guardian-38 | 시간수문장 | 그대로 | generated-v3125/kair-guardians/guardian_38.webp 100% |
| 082 | guardian_41.webp | kair10 | kair-guardian-41 | 시간수문장 | 그대로 | generated-v3125/kair-guardians/guardian_41.webp 100% |
| 083 | guardian_42.webp | kair10 | kair-guardian-42 | 시간수문장 | 그대로 | generated-v3125/kair-guardians/guardian_42.webp 100% |
| 084 | guardian_46.webp | kair02 | kair-guardian-46 | 시간수문장 | 섞임 | r380/mobs/legacy-m110-time-guardian-v3-walk-d1.webp 50%, generated-v3125/kair-guardians/guardian_46.webp 50% |
| 085 | guardian_47.webp | kair02 | — | 시간수문장 | 화면에 안 나옴(조사 지역 기준) | |
| 086 | guardian_49.webp | kair04 | kair-elite-49 | 상위수문장 | 그대로 | generated-v3125/kair-guardians/guardian_49.webp 100% |
| 087 | guardian_54.webp | kair07 | kair-elite-54 | 상위수문장 | 그대로 | generated-v3125/kair-guardians/guardian_54.webp 100% |
| 088 | guardian_56.webp | kair09 | kair-elite-56 | 상위수문장 | 그대로 | generated-v3125/kair-guardians/guardian_56.webp 100% |
| 089 | guardian_01.webp | kair04 | kair-guardian-01 | 시간수문장 | 그대로 | generated-v3125/kair-guardians/guardian_01.webp 90%, r92/mobs/M055-attack.png 10% |
| 090 | guardian_03.webp | kair04 | kair-guardian-03 | 시간수문장 | 파생 | r116/mobs/M057-idle.png 82%, r92/mobs/M057-attack.png 15%, generated-v3125/kair-guardians/guardian_03.webp 3% |
| 091 | guardian_04.webp | kair04 | kair-guardian-04 | 시간수문장 | 그대로 | generated-v3125/kair-guardians/guardian_04.webp 86%, r92/mobs/M058-attack.png 13%, rc137/mob-attacks-04.png 1% |
| 092 | guardian_06.webp | kair04 | kair-guardian-06 | 시간수문장 | 그대로 | generated-v3125/kair-guardians/guardian_06.webp 73%, r92/mobs/M060-attack.png 27% |
| 093 | guardian_07.webp | kair05 | kair-guardian-07 | 시간수문장 | 그대로 | generated-v3125/kair-guardians/guardian_07.webp 89%, r92/mobs/M063-attack.png 11% |
| 094 | guardian_08.webp | kair05 | kair-guardian-08 | 시간수문장 | 그대로 | generated-v3125/kair-guardians/guardian_08.webp 96%, r92/mobs/M064-attack.png 4% |
| 095 | guardian_09.webp | kair05 | kair-guardian-09 | 시간수문장 | 그대로 | generated-v3125/kair-guardians/guardian_09.webp 89%, r92/mobs/M065-attack.png 10%, rc137/mob-attacks-05.png 1% |
| 096 | guardian_10.webp | kair05 | kair-guardian-10 | 시간수문장 | 그대로 | generated-v3125/kair-guardians/guardian_10.webp 86%, r92/mobs/M066-attack.png 12%, rc137/mob-attacks-05.png 2% |
| 097 | guardian_11.webp | kair05 | kair-guardian-11 | 시간수문장 | 그대로 | generated-v3125/kair-guardians/guardian_11.webp 86%, r92/mobs/M067-attack.png 14% |
| 098 | guardian_12.webp | kair05 | kair-guardian-12 | 시간수문장 | 그대로 | generated-v3125/kair-guardians/guardian_12.webp 80%, r92/mobs/M068-attack.png 20% |
| 099 | guardian_15.webp | kair06 | kair-guardian-15 | 시간수문장 | 그대로 | generated-v3125/kair-guardians/guardian_15.webp 85%, r92/mobs/M072-attack.png 15%, rc137/mob-attacks-05.png 0% |
| 100 | guardian_16.webp | kair06 | kair-guardian-16 | 시간수문장 | 그대로 | generated-v3125/kair-guardians/guardian_16.webp 75%, r92/mobs/M073-attack.png 22%, rc137/mob-attacks-05.png 3% |
| 101 | guardian_17.webp | kair06 | kair-guardian-17 | 시간수문장 | 그대로 | generated-v3125/kair-guardians/guardian_17.webp 74%, r92/mobs/M074-attack.png 26% |
| 102 | guardian_20.webp | kair07 | kair-guardian-20 | 시간수문장 | 그대로 | generated-v3125/kair-guardians/guardian_20.webp 87%, r92/mobs/M078-attack.png 13% |
| 102 | guardian_20.webp | kair07 | kair-guardian-20 | 기계화 감옥 공명기사 | **다른 그림** | u2/generated-v350/u2_suppression_knight.webp 100% |
| 103 | guardian_25.webp | kair08 | kair-guardian-25 | 시간수문장 | 그대로 | generated-v3125/kair-guardians/guardian_25.webp 81%, r92/mobs/M085-attack.png 17%, rc137/mob-attacks-06.png 2% |
| 104 | guardian_26.webp | kair08 | kair-guardian-26 | 시간수문장 | 그대로 | generated-v3125/kair-guardians/guardian_26.webp 83%, r92/mobs/M086-attack.png 16%, rc137/mob-attacks-06.png 1% |
| 105 | guardian_29.webp | kair08 | kair-guardian-29 | 시간수문장 | 그대로 | generated-v3125/kair-guardians/guardian_29.webp 75%, r92/mobs/M089-attack.png 25% |
| 106 | guardian_30.webp | kair08 | kair-guardian-30 | 시간수문장 | 그대로 | generated-v3125/kair-guardians/guardian_30.webp 76%, r92/mobs/M090-attack.png 21%, rc137/mob-attacks-06.png 4% |
| 107 | guardian_35.webp | kair09 | kair-guardian-35 | 시간수문장 | 그대로 | generated-v3125/kair-guardians/guardian_35.webp 76%, r92/mobs/M096-attack.png 24% |
| 108 | guardian_40.webp | kair10 | kair-guardian-40 | 시간수문장 | 그대로 | generated-v3125/kair-guardians/guardian_40.webp 73%, r92/mobs/M103-attack.png 27% |
| 109 | guardian_43.webp | kair02 | kair-guardian-43 | 시간수문장 | 그대로 | generated-v3125/kair-guardians/guardian_43.webp 100% |
| 110 | guardian_50.webp | kair04 | kair-elite-50 | 상위수문장 | 그대로 | generated-v3125/kair-guardians/guardian_50.webp 76%, r92/mobs/M062-attack.png 21%, rc137/mob-attacks-04.png 3% |
| 111 | guardian_51.webp | kair05 | kair-elite-51 | 상위수문장 | 그대로 | generated-v3125/kair-guardians/guardian_51.webp 88%, r92/mobs/M069-attack.png 8%, rc137/mob-attacks-05.png 4% |
| 112 | guardian_53.webp | kair07 | kair-elite-53 | 상위수문장 | 파생 | r92/mobs/M083-attack.png 54%, generated-v3125/kair-guardians/guardian_53.webp 46% |
| 113 | guardian_57.webp | kair09 | kair-elite-57 | 상위수문장 | 그대로 | generated-v3125/kair-guardians/guardian_57.webp 77%, r92/mobs/M099-attack.png 20%, rc137/mob-attacks-07.png 3% |
| 114 | guardian_28.webp | kair08 | kair-guardian-28 | 시간수문장 | 파생 | r92/mobs/M088-move.png 74%, generated-v3125/kair-guardians/guardian_28.webp 26% |
| 115 | guardian_36.webp | kair09 | kair-guardian-36 | 시간수문장 | 파생 | r92/mobs/M097-move.png 96%, generated-v3125/kair-guardians/guardian_36.webp 4% |
| 116 | guardian_52.webp | kair06 | kair-elite-52 | 상위수문장 | 파생(추정) | r92/mobs/M076-move.png 100% |
| 117 | guardian_55.webp | kair08 | kair-elite-55 | 상위수문장 | 파생 | r92/mobs/M091-move.png 96%, generated-v3125/kair-guardians/guardian_55.webp 4% |
| 118 | guardian_60.webp | kair02 | kair-elite-60 | 상위수문장 | 파생 | r92/mobs/M114-move.png 86%, generated-v3125/kair-guardians/guardian_60.webp 14% |
| 119 | guardian_18.webp | kair06 | kair-guardian-18 | 시간수문장 | 파생(추정) | r92/mobs/M075-move.png 100% |
| 120 | guardian_23.webp | kair07 | kair-guardian-23 | 시간수문장 | 파생 | r92/mobs/M081-move.png 92%, generated-v3125/kair-guardians/guardian_23.webp 8% |
| 121 | guardian_27.webp | kair08 | kair-guardian-27 | 시간수문장 | 파생 | r92/mobs/M087-move.png 87%, generated-v3125/kair-guardians/guardian_27.webp 13% |
| 122 | guardian_34.webp | kair09 | kair-guardian-34 | 시간수문장 | 파생 | r92/mobs/M095-move.png 79%, generated-v3125/kair-guardians/guardian_34.webp 21% |
| 123 | guardian_39.webp | kair10 | kair-guardian-39 | 시간수문장 | **다른 그림** | r363/mobs/L102.webp 82%, generated-v3125/kair-guardians/guardian_39.webp 18% |
| 124 | guardian_44.webp | kair02 | kair-guardian-44 | 시간수문장 | **다른 그림** | r375/mobs/kair-44.webp 100% |
| 125 | guardian_45.webp | kair02 | kair-guardian-45 | 시간수문장 | **다른 그림** | r375/mobs/kair-45.webp 100% |
| 126 | guardian_48.webp | kair02 | kair-guardian-48 | 시간수문장 | **다른 그림** | r375/mobs/kair-48.webp 100% |
| 127 | guardian_58.webp | kair10 | kair-elite-58 | 상위수문장 | **다른 그림** | r380/mobs/legacy-m106-elite-guardian-v2.webp 100% |
| 128 | guardian_59.webp | kair02 | kair-elite-59 | 상위수문장 | 파생 | r92/mobs/M113-move.png 82%, generated-v3125/kair-guardians/guardian_59.webp 18% |

## 지역별 전체 목록(요청표에 없는 몹 포함)

| 지역 | nativeId | 이름 | 원본 스프라이트 | 실제 그림(걷는 동안 %) |
|---|---|---|---|---|
| ep1b05 | b05-a1 | 붉은 하이힐 칼날 | episode1b/generated-v394/lust_asmodai.webp | r380/mobs/ep1b-red-heel-blade-walk-d1.webp 100% |
| ep1b05 | b05-a1 | 유리 망령 | episode1b/generated-v394/lust_asmodai.webp | r410/mobs/m018.webp 100% |
| ep1b05 | b05-p1 | 얼굴 없는 남자의 박수 | episode1b/generated-v394/lust_heart_marionette.webp | r275/mobs/curtain-mannequin.webp 100% |
| ep1b05 | b05-p1 | 유리 망령 | episode1b/generated-v394/lust_heart_marionette.webp | r410/mobs/m018.webp 100% |
| ep1b05 | b05-p2 | 공중을 가르는 립스틱 탄환 | episode1b/generated-v394/lust_heart_marionette.webp | r92/mobs/M027-move.png 99%, episode1b/generated-v394/lust_heart_marionette.webp 1% |
| ep1b05 | b05-p2 | 유리 망령 | episode1b/generated-v394/lust_heart_marionette.webp | r410/mobs/m018.webp 100% |
| ep1b05 | mb-ep1b05 | 심장빛 무대감독 (중간보스) | generated-v31224/actors-normalized/cd804c90bfe4_heartlight_stage_director.webp | r104/bosses/mb-ep1b05-p4.webp 68%, assets/r974/move/mb-ep1b05-side.webp 24%, r104/bosses/mb-ep1b05-p2.webp 5% |
| ep1b01 | b01-c1 | 검은 실의 외부 신호 | episode1b/generated-v392/brainwave_contamination.webp | r109/mobs/M019-move.png 100%, episode1b/generated-v392/brainwave_contamination.webp 0% |
| ep1b01 | b01-c1 | 유리 망령 | episode1b/generated-v392/brainwave_contamination.webp | r410/mobs/m018.webp 100% |
| ep1b01 | b01-r1 | 유리 망령 | episode1b/generated-v394/seal_residual.webp | r410/mobs/m018.webp 100% |
| ep1b01 | b01-r1 | 일흔두 번째 인장 잔류체 | episode1b/generated-v394/seal_residual.webp | r380/mobs/ep1b-seal-residual-float-d1.webp 100% |
| ep1b01 | b01-s1 | 유리 망령 | episode1b/envy_glass_shard.webp | r410/mobs/m018.webp 100% |
| ep1b01 | b01-s1 | 이름 없던 공포 | episode1b/envy_glass_shard.webp | r92/mobs/M018-move.png 100% |
| ep1b01 | b05-a1 | 붉은 하이힐 칼날 | episode1b/generated-v394/lust_asmodai.webp | r380/mobs/ep1b-red-heel-blade-walk-d1.webp 100% |
| ep1b01 | b05-a1 | 유리 망령 | episode1b/generated-v394/lust_asmodai.webp | r410/mobs/m018.webp 100% |
| ep1b01 | b05-p1 | 얼굴 없는 남자의 박수 | episode1b/generated-v394/lust_heart_marionette.webp | r275/mobs/curtain-mannequin.webp 100% |
| ep1b01 | b05-p1 | 유리 망령 | episode1b/generated-v394/lust_heart_marionette.webp | r410/mobs/m018.webp 100% |
| ep1b01 | b05-p2 | 공중을 가르는 립스틱 탄환 | episode1b/generated-v394/lust_heart_marionette.webp | r92/mobs/M027-move.png 100% |
| ep1b01 | b05-p2 | 유리 망령 | episode1b/generated-v394/lust_heart_marionette.webp | r410/mobs/m018.webp 100% |
| ep1b01 | mb-ep1b01 | 교만의 잔향 · 제72문 (중간보스) | generated-v31224/actors-normalized/b42dcd0ea03d_gate72_pride_echo.webp | assets/r974/move/mb-ep1b01-side.webp 49%, r104/bosses/mb-ep1b01-p4.webp 35%, assets/r974/move/mb-ep1b01-down.webp 11% |
| ep1b01 | mb-ep1b05 | 심장빛 무대감독 (중간보스) | generated-v31224/actors-normalized/cd804c90bfe4_heartlight_stage_director.webp | r104/bosses/mb-ep1b05-p4.webp 60%, assets/r974/move/mb-ep1b05-side.webp 40% |
| ep1b02 | b01-c1 | 검은 실의 외부 신호 | episode1b/generated-v392/brainwave_contamination.webp | r109/mobs/M019-move.png 100% |
| ep1b02 | b01-c1 | 유리 망령 | episode1b/generated-v392/brainwave_contamination.webp | r410/mobs/m018.webp 100% |
| ep1b02 | b01-r1 | 유리 망령 | episode1b/generated-v394/seal_residual.webp | r410/mobs/m018.webp 100% |
| ep1b02 | b01-r1 | 일흔두 번째 인장 잔류체 | episode1b/generated-v394/seal_residual.webp | r380/mobs/ep1b-seal-residual-float-d1.webp 100% |
| ep1b02 | b01-s1 | 유리 망령 | episode1b/envy_glass_shard.webp | r410/mobs/m018.webp 100% |
| ep1b02 | b01-s1 | 이름 없던 공포 | episode1b/envy_glass_shard.webp | r92/mobs/M018-move.png 100% |
| ep1b02 | b02-b1 | 살아 움직이는 쓰레기들 | episode1b/generated-v394/sloth_belphegor.webp | r380/mobs/living-trash-v1.webp 100% |
| ep1b02 | b02-b1 | 유리 망령 | episode1b/generated-v394/sloth_belphegor.webp | r410/mobs/m018.webp 100% |
| ep1b02 | b02-m1 | 곰팡이와 오물 봉투 | episode1b/generated-v394/sloth_moldling.webp | r198/mobs/M022-move.png 100%, episode1b/generated-v394/sloth_moldling.webp 0% |
| ep1b02 | b02-m1 | 유리 망령 | episode1b/generated-v394/sloth_moldling.webp | r410/mobs/m018.webp 100% |
| ep1b02 | b02-o1 | 살아 움직이는 쓰레기들 | episode1b/generated-v394/seal_residual.webp | r380/mobs/living-trash-v1.webp 100% |
| ep1b02 | b02-o1 | 유리 망령 | episode1b/generated-v394/seal_residual.webp | r410/mobs/m018.webp 100% |
| ep1b02 | mb-ep1b01 | 교만의 잔향 · 제72문 (중간보스) | generated-v31224/actors-normalized/b42dcd0ea03d_gate72_pride_echo.webp | assets/r974/move/mb-ep1b01-side.webp 70%, r104/bosses/mb-ep1b01-p4.webp 30% |
| ep1b02 | mb-ep1b02 | 나태의 껍데기 파수 (중간보스) | generated-v31224/actors-normalized/20995250d5fa_sloth_shell_sentinel.webp | assets/r974/move/mb-ep1b02-side.webp 71%, r104/bosses/mb-ep1b02-p4.webp 23%, r104/bosses/mb-ep1b02-p2.webp 5% |
| ep1b08 | b02-b1 | 살아 움직이는 쓰레기들 | episode1b/generated-v394/sloth_belphegor.webp | r380/mobs/living-trash-v1.webp 100% |
| ep1b08 | b02-b1 | 유리 망령 | episode1b/generated-v394/sloth_belphegor.webp | r410/mobs/m018.webp 100% |
| ep1b08 | b02-m1 | 곰팡이와 오물 봉투 | episode1b/generated-v394/sloth_moldling.webp | r198/mobs/M022-move.png 100% |
| ep1b08 | b02-m1 | 유리 망령 | episode1b/generated-v394/sloth_moldling.webp | r410/mobs/m018.webp 100% |
| ep1b08 | b02-o1 | 살아 움직이는 쓰레기들 | episode1b/generated-v394/seal_residual.webp | r380/mobs/living-trash-v1.webp 100% |
| ep1b08 | b02-o1 | 유리 망령 | episode1b/generated-v394/seal_residual.webp | r410/mobs/m018.webp 100% |
| ep1b08 | b08-c1 | 유리 망령 | episode1b/generated-v31342-rc39/zombie_guardian_knight_bloodied.webp | r410/mobs/m018.webp 100% |
| ep1b08 | b08-c1 | 전극기계수호기사 | episode1b/generated-v31342-rc39/zombie_guardian_knight_bloodied.webp | r380/mobs/electrode-machine-knight-v1.webp 100% |
| ep1b08 | b08-h1 | 유리 망령 | episode1b/generated-v3102/ep1b08_pride_zombie.webp | r410/mobs/m018.webp 100% |
| ep1b08 | b08-h1 | 흑마법사의 저주창 | episode1b/generated-v3102/ep1b08_pride_zombie.webp | r116/mobs/M032-idle.png 84%, r92/mobs/M032-attack.png 16%, episode1b/generated-v3102/ep1b08_pride_zombie.webp 0% |
| ep1b08 | b08-v1 | 유리 망령 | episode1b/generated-v394/seal_residual.webp | r410/mobs/m018.webp 100% |
| ep1b08 | b08-v1 | 육망성의 흑마술 실험체 | episode1b/generated-v394/seal_residual.webp | r380/mobs/hexagram-experiment-m031-v1.webp 100% |
| ep1b08 | mb-ep1b02 | 나태의 껍데기 파수 (중간보스) | generated-v31224/actors-normalized/20995250d5fa_sloth_shell_sentinel.webp | assets/r974/move/mb-ep1b02-side.webp 80%, r104/bosses/mb-ep1b02-p4.webp 20% |
| ep1b08 | mb-ep1b08 | 흑마법사의 시체경호체 (중간보스) | generated-v31224/actors-normalized/f02422d95ccb_ep1b08_pride_zombie.webp | assets/r974/move/mb-ep1b08-side.webp 64%, r104/bosses/mb-ep1b08-p4.webp 19%, assets/r974/move/mb-ep1b08-down.webp 7% |
| ep1b07 | b07-f1 | 분노의 사냥개 | episode1b/generated-v394/wrath_fire_beast.webp | r380/mobs/wrath-hound-v1.webp 100% |
| ep1b07 | b07-f1 | 불길 속의 늑대 | episode1b/generated-v394/wrath_fire_beast.webp | r198/mobs/M030-move.png 95%, episode1b/generated-v394/wrath_fire_beast.webp 4%, r198/mobs/M030-idle.png 1% |
| ep1b07 | b07-f2 | 개와 늑대의 시간 | episode1b/generated-v394/wrath_fire_beast.webp | r290/mobs/m030.webp 100% |
| ep1b07 | b07-f2 | 분노의 사냥개 | episode1b/generated-v394/wrath_fire_beast.webp | r380/mobs/wrath-hound-v1.webp 100% |
| ep1b07 | b07-s1 | 분노의 사냥개 | episode1b/generated-v394/wrath_satan.webp | r380/mobs/wrath-hound-v1.webp 100% |
| ep1b07 | b07-s1 | 불길 속의 용 | episode1b/generated-v394/wrath_satan.webp | episode1b/generated-v394/wrath_satan.webp 100% |
| ep1b07 | b08-c1 | 유리 망령 | episode1b/generated-v31342-rc39/zombie_guardian_knight_bloodied.webp | r410/mobs/m018.webp 100% |
| ep1b07 | b08-c1 | 전극기계수호기사 | episode1b/generated-v31342-rc39/zombie_guardian_knight_bloodied.webp | r380/mobs/electrode-machine-knight-v1.webp 100% |
| ep1b07 | b08-h1 | 유리 망령 | episode1b/generated-v3102/ep1b08_pride_zombie.webp | r410/mobs/m018.webp 100% |
| ep1b07 | b08-h1 | 흑마법사의 저주창 | episode1b/generated-v3102/ep1b08_pride_zombie.webp | r116/mobs/M032-idle.png 70%, r92/mobs/M032-attack.png 30% |
| ep1b07 | b08-v1 | 유리 망령 | episode1b/generated-v394/seal_residual.webp | r410/mobs/m018.webp 100% |
| ep1b07 | b08-v1 | 육망성의 흑마술 실험체 | episode1b/generated-v394/seal_residual.webp | r380/mobs/hexagram-experiment-m031-v1.webp 100% |
| ep1b07 | mb-ep1b07 | 호텔 화염기사 (중간보스) | generated-v31224/actors-normalized/b30f4a94acb6_hotel_flame_knight.webp | assets/r974/move/mb-ep1b07-side.webp 59%, assets/r974/move/mb-ep1b07-down.webp 21%, r104/bosses/mb-ep1b07-p4.webp 15% |
| ep1b07 | mb-ep1b08 | 흑마법사의 시체경호체 (중간보스) | generated-v31224/actors-normalized/f02422d95ccb_ep1b08_pride_zombie.webp | r104/bosses/mb-ep1b08-p1.webp 100% |
| hando01 | b07-f1 | 분노의 사냥개 | episode1b/generated-v394/wrath_fire_beast.webp | r380/mobs/wrath-hound-v1.webp 100% |
| hando01 | b07-f1 | 불길 속의 늑대 | episode1b/generated-v394/wrath_fire_beast.webp | r198/mobs/M030-move.png 100% |
| hando01 | b07-f2 | 개와 늑대의 시간 | episode1b/generated-v394/wrath_fire_beast.webp | r290/mobs/m030.webp 100% |
| hando01 | b07-f2 | 분노의 사냥개 | episode1b/generated-v394/wrath_fire_beast.webp | r380/mobs/wrath-hound-v1.webp 100% |
| hando01 | b07-s1 | 분노의 사냥개 | episode1b/generated-v394/wrath_satan.webp | r380/mobs/wrath-hound-v1.webp 100% |
| hando01 | b07-s1 | 불길 속의 용 | episode1b/generated-v394/wrath_satan.webp | episode1b/generated-v394/wrath_satan.webp 100% |
| hando01 | h101-s1 | 성벽 침식 봉인병 | hando-v3123/false_signal_seal_guard.webp | r275/mobs/ash-mason.webp 99%, r223/mobs/ash-mason.webp 1% |
| hando01 | h101-s1 | 이동문 청람잔영 | hando-v3123/false_signal_seal_guard.webp | r410/mobs/m040.webp 100% |
| hando01 | h101-s2 | 의존 신호 포식자 | hando-v3123/return_coordinate_devourer.webp | hando-v3123/return_coordinate_devourer.webp 100% |
| hando01 | h101-s2 | 이동문 청람잔영 | hando-v3123/return_coordinate_devourer.webp | r410/mobs/m040.webp 100% |
| hando01 | h101-t1 | 악몽 정찰체 | hando-v3123/timeless_silver_scout.webp | r380/mobs/hando-timeless-silver-scout-walk-d1.webp 100% |
| hando01 | h101-t1 | 이동문 청람잔영 | hando-v3123/timeless_silver_scout.webp | r410/mobs/m040.webp 100% |
| hando01 | mb-ep1b07 | 호텔 화염기사 (중간보스) | generated-v31224/actors-normalized/b30f4a94acb6_hotel_flame_knight.webp | assets/r974/move/mb-ep1b07-side.webp 88%, r104/bosses/mb-ep1b07-p4.webp 12% |
| hando01 | mb-hando01 | 의존 신호 포식자 (중간보스) | generated-v31224/actors-normalized/c5f90d9ed1ee_return_coordinate_devourer.webp | r104/bosses/mb-hando01-p4.webp 53%, assets/r974/move/mb-hando01-side.webp 46%, rc140/story-cycle-motions/mb-hando01.png 1% |
| hando03 | h101-s1 | 성벽 침식 봉인병 | hando-v3123/false_signal_seal_guard.webp | r275/mobs/ash-mason.webp 100% |
| hando03 | h101-s1 | 이동문 청람잔영 | hando-v3123/false_signal_seal_guard.webp | r410/mobs/m040.webp 100% |
| hando03 | h101-s2 | 의존 신호 포식자 | hando-v3123/return_coordinate_devourer.webp | hando-v3123/return_coordinate_devourer.webp 100% |
| hando03 | h101-s2 | 이동문 청람잔영 | hando-v3123/return_coordinate_devourer.webp | r410/mobs/m040.webp 100% |
| hando03 | h101-t1 | 악몽 정찰체 | hando-v3123/timeless_silver_scout.webp | r380/mobs/hando-timeless-silver-scout-walk-d1.webp 100% |
| hando03 | h101-t1 | 이동문 청람잔영 | hando-v3123/timeless_silver_scout.webp | r410/mobs/m040.webp 100% |
| hando03 | h103-c1 | EGO 탈취 연결자 | hando-v3123/ego_theft_connector.webp | r92/mobs/M122-move.png 94%, hando-v3123/ego_theft_connector.webp 6% |
| hando03 | h103-c1 | 최종문 공명기사 | hando-v3123/ego_theft_connector.webp | r374/mobs/u203-e3-mech.webp 100% |
| hando03 | h103-s1 | 최종문 공명기사 | hando-v3123/phantom_reclaim_blade.webp | r374/mobs/u203-e3-mech.webp 100% |
| hando03 | h103-s1 | 환수검 모조체 | hando-v3123/phantom_reclaim_blade.webp | hando-v3123/phantom_reclaim_blade.webp 100% |
| hando03 | h103-t1 | 백은 없는 그림자 | hando-v3123/silverless_shadow.webp | r380/mobs/legacy-m124-silverless-shadow-v4.webp 100% |
| hando03 | h103-t1 | 최종문 공명기사 | hando-v3123/silverless_shadow.webp | r374/mobs/u203-e3-mech.webp 100% |
| hando03 | mb-hando01 | 의존 신호 포식자 (중간보스) | generated-v31224/actors-normalized/c5f90d9ed1ee_return_coordinate_devourer.webp | r104/bosses/mb-hando01-p4.webp 100% |
| hando03 | mb-hando03 | 환수검 모조체 (중간보스) | generated-v31224/actors-normalized/6f957d283d31_phantom_reclaim_blade.webp | r104/bosses/mb-hando03-p4.webp 100% |
| kair01 | h103-c1 | EGO 탈취 연결자 | hando-v3123/ego_theft_connector.webp | r92/mobs/M122-move.png 71%, hando-v3123/ego_theft_connector.webp 29% |
| kair01 | h103-c1 | 최종문 공명기사 | hando-v3123/ego_theft_connector.webp | r374/mobs/u203-e3-mech.webp 100% |
| kair01 | h103-s1 | 최종문 공명기사 | hando-v3123/phantom_reclaim_blade.webp | r374/mobs/u203-e3-mech.webp 100% |
| kair01 | h103-s1 | 환수검 모조체 | hando-v3123/phantom_reclaim_blade.webp | hando-v3123/phantom_reclaim_blade.webp 100% |
| kair01 | h103-t1 | 백은 없는 그림자 | hando-v3123/silverless_shadow.webp | r380/mobs/legacy-m124-silverless-shadow-v4.webp 100% |
| kair01 | h103-t1 | 최종문 공명기사 | hando-v3123/silverless_shadow.webp | r374/mobs/u203-e3-mech.webp 100% |
| kair01 | kair-academy-wave-1 | 최초명령 훈련파동 | kair/enemies/time-collector.png | r275/mobs/clockwork-sentinel.webp 100%, r223/mobs/clockwork-sentinel.webp 0% |
| kair01 | kair-academy-wave-4 | 최초명령 훈련파동 | kair/enemies/time-collector.png | r275/mobs/clockwork-sentinel.webp 100% |
| kair01 | kair-academy-wave-5 | 최초명령 훈련파동 | kair/enemies/connector.png | r275/mobs/clockwork-sentinel.webp 100% |
| kair01 | kair-academy-wave-6 | 최초명령 훈련파동 | kair/enemies/resonance-slave.png | r275/mobs/clockwork-sentinel.webp 100% |
| kair01 | mb-hando03 | 환수검 모조체 (중간보스) | generated-v31224/actors-normalized/6f957d283d31_phantom_reclaim_blade.webp | r104/bosses/mb-hando03-p4.webp 100% |
| kair01 | mb-kair01-v31231 | 최초명령 코어 오염체 (중간보스) | kair/enemies/resonance-slave.png | rc140/story-cycle-motions/mb-kair01-v31231.png 100% |
| kair03 | kair-academy-wave-1 | 시간핵의 명령 파동 | kair/enemies/time-collector.png | r116/mobs/M054-idle.png 99%, kair/enemies/time-collector.png 1% |
| kair03 | kair-academy-wave-1 | 최초명령 훈련파동 | kair/enemies/time-collector.png | r275/mobs/clockwork-sentinel.webp 100% |
| kair03 | kair-academy-wave-2 | 시간핵의 명령 파동 | kair/enemies/connector.png | kair/enemies/connector.png 100% |
| kair03 | kair-academy-wave-3 | 시간핵의 명령 잔류 | kair/enemies/resonance-slave.png | r375/mobs/kair03-residue.webp 100% |
| kair03 | kair-academy-wave-3 | 시간핵의 명령 파동 | kair/enemies/resonance-slave.png | kair/enemies/resonance-slave.png 100% |
| kair03 | kair-academy-wave-4 | 최초명령 훈련파동 | kair/enemies/time-collector.png | r275/mobs/clockwork-sentinel.webp 100% |
| kair03 | kair-academy-wave-5 | 최초명령 훈련파동 | kair/enemies/connector.png | r275/mobs/clockwork-sentinel.webp 100% |
| kair03 | kair-academy-wave-6 | 최초명령 훈련파동 | kair/enemies/resonance-slave.png | r275/mobs/clockwork-sentinel.webp 100% |
| kair03 | mb-kair01-v31231 | 최초명령 코어 오염체 (중간보스) | kair/enemies/resonance-slave.png | rc140/story-cycle-motions/mb-kair01-v31231.png 100% |
| last305 | kair-academy-wave-1 | 시간핵의 명령 파동 | kair/enemies/time-collector.png | r116/mobs/M054-idle.png 100% |
| last305 | kair-academy-wave-2 | 시간핵의 명령 파동 | kair/enemies/connector.png | kair/enemies/connector.png 100% |
| last305 | kair-academy-wave-3 | 시간핵의 명령 잔류 | kair/enemies/resonance-slave.png | r375/mobs/kair03-residue.webp 100% |
| last305 | kair-academy-wave-3 | 시간핵의 명령 파동 | kair/enemies/resonance-slave.png | kair/enemies/resonance-slave.png 100% |
| last305 | l305-e1 | 숲 고블린 | last3/Monster_Goblin.png | r198/mobs/M047-move.png 86%, r198/mobs/M047-idle.png 11%, last3/Monster_Goblin.png 3% |
| last305 | l305-e2 | 피리 고블린 | last3/Monster_Goblin.png | r410/mobs/m044.webp 100% |
| last302 | l302-e1 | 잠식된 약방 아낙 | episode1b/generated-v394/bulmyeongwi_b.webp | r763/villagers/herbwife-walk.webp 87%, r763/villagers/herbwife-idle.webp 12%, episode1b/generated-v394/bulmyeongwi_b.webp 1% |
| last302 | l302-e3 | 잠식된 소복 처녀 | last3/Monster_Slime.png | r770/villagers/sobok-float.webp 98%, r92/mobs/M045-move.png 2%, last3/Monster_Slime.png 1% |
| last302 | l302-e3 | 잠식된 어부 | last3/Monster_Slime.png | r763/villagers/fisher-walk.webp 80%, r763/villagers/fisher-idle.webp 20% |
| last302 | l305-e1 | 숲 고블린 | last3/Monster_Goblin.png | r198/mobs/M047-move.png 93%, r198/mobs/M047-idle.png 7% |
| last302 | l305-e2 | 피리 고블린 | last3/Monster_Goblin.png | r410/mobs/m044.webp 100% |
| last302 | mb-last302-v31231 | 꼭두각시 실안개 (중간보스) | episode1b/generated-v394/bulmyeongwi_b.webp | assets/r760/mid/sheet-moveDown.webp 43%, assets/r760/mid/sheet-moveUp.webp 30%, assets/r760/mid/sheet-idle.webp 14% |
| last304 | l302-e1 | 잠식된 약방 아낙 | episode1b/generated-v394/bulmyeongwi_b.webp | r763/villagers/herbwife-walk.webp 81%, r763/villagers/herbwife-idle.webp 19% |
| last304 | l302-e3 | 잠식된 소복 처녀 | last3/Monster_Slime.png | r770/villagers/sobok-float.webp 100% |
| last304 | l302-e3 | 잠식된 어부 | last3/Monster_Slime.png | r763/villagers/fisher-walk.webp 83%, r763/villagers/fisher-idle.webp 17% |
| last304 | l304-e1 | 중립초원 슬라임 | last3/Monster_Slime.png | r92/mobs/M045-move.png 96%, last3/Monster_Slime.png 3%, r198/mobs/M045-idle.png 1% |
| last304 | l304-e2 | 중립초원 늑대 | last3/Monster_Wolf.png | r198/mobs/M046-move.png 87%, r198/mobs/M046-idle.png 10%, last3/Monster_Wolf.png 3% |
| last304 | l304-e3 | 장미이슬 슬라임 | last3/Monster_Slime.png | r410/mobs/m043.webp 100% |
| last304 | mb-last302-v31231 | 꼭두각시 실안개 (중간보스) | episode1b/generated-v394/bulmyeongwi_b.webp | assets/r760/mid/sheet-atk.webp 100% |
| murder01 | l304-e1 | 중립초원 슬라임 | last3/Monster_Slime.png | r92/mobs/M045-move.png 100% |
| murder01 | l304-e2 | 중립초원 늑대 | last3/Monster_Wolf.png | r198/mobs/M046-move.png 92%, r198/mobs/M046-idle.png 8% |
| murder01 | l304-e3 | 장미이슬 슬라임 | last3/Monster_Slime.png | r410/mobs/m043.webp 100% |
| murder01 | mb-murder01 | 파란불 역주행 목격자 (중간보스) | generated-v31224/actors-normalized/83e3f3bd00f9_rain_witness.webp | r104/bosses/mb-murder01-p4.webp 96%, r104/bosses/mb-murder01-p2.webp 4% |
| murder01 | murder04-e2 | 끊어진 통화의 인과 잔향 | murder/rooftop_echo.png | r380/mobs/murder-rooftop-echo-float-d1.webp 100% |
| murder01 | murder04-e2 | 빗속 횡단보도의 기억 잔향 | murder/rooftop_echo.png | r275/mobs/signal-golem.webp 100% |
| murder01 | murder04-e2 | 유리 망령 | murder/rooftop_echo.png | r410/mobs/m018.webp 100% |
| murder02 | mb-murder01 | 파란불 역주행 목격자 (중간보스) | generated-v31224/actors-normalized/83e3f3bd00f9_rain_witness.webp | r104/bosses/mb-murder01-p1.webp 100% |
| murder02 | mb-murder02 | 공실장부 당직감사 (중간보스) | generated-v31224/actors-normalized/2bb588948301_hotel_clerk.webp | r104/bosses/mb-murder02-p4.webp 96%, r104/bosses/mb-murder02-p2.webp 4% |
| murder02 | murder04-e2 | 끊어진 통화의 인과 잔향 | murder/rooftop_echo.png | r380/mobs/murder-rooftop-echo-float-d1.webp 100% |
| murder02 | murder04-e2 | 빗속 횡단보도의 기억 잔향 | murder/rooftop_echo.png | r275/mobs/signal-golem.webp 100% |
| murder02 | murder04-e2 | 새빛호텔 화재 기록의 잔향 | murder/rooftop_echo.png | r290/mobs/m051.webp 100% |
| murder02 | murder04-e2 | 유리 망령 | murder/rooftop_echo.png | r410/mobs/m018.webp 100% |
| murder02 | murder04-e2 | 지워진 CCTV 기록의 잔향 | murder/rooftop_echo.png | r410/mobs/m050.webp 100% |
| murder03 | mb-murder02 | 공실장부 당직감사 (중간보스) | generated-v31224/actors-normalized/2bb588948301_hotel_clerk.webp | r104/bosses/mb-murder02-p1.webp 71%, r104/bosses/mb-murder02-p4.webp 29% |
| murder03 | mb-murder03 | 옥상 인과보관인 (중간보스) | generated-v31224/actors-normalized/570df4477372_rooftop_echo.webp | r104/bosses/mb-murder03-p4.webp 96%, r104/bosses/mb-murder03-p2.webp 4% |
| murder03 | murder04-e2 | 반복된 추락의 인과 잔향 | murder/rooftop_echo.png | r290/mobs/m055.webp 100% |
| murder03 | murder04-e2 | 새빛호텔 화재 기록의 잔향 | murder/rooftop_echo.png | r290/mobs/m051.webp 100% |
| murder03 | murder04-e2 | 옥상으로 돌아온 기억 잔향 | murder/rooftop_echo.png | r410/mobs/m054.webp 100% |
| murder03 | murder04-e2 | 유리 망령 | murder/rooftop_echo.png | r410/mobs/m018.webp 100% |
| murder03 | murder04-e2 | 지워진 CCTV 기록의 잔향 | murder/rooftop_echo.png | r410/mobs/m050.webp 100% |
| murder04 | mb-murder03 | 옥상 인과보관인 (중간보스) | generated-v31224/actors-normalized/570df4477372_rooftop_echo.webp | r104/bosses/mb-murder03-p1.webp 100% |
| murder04 | murder04-e1 | 공실 표기 잔재 | murder/silent_alarm.png | r290/mobs/m052.webp 100% |
| murder04 | murder04-e1 | 유리 망령 | murder/silent_alarm.png | r410/mobs/m018.webp 100% |
| murder04 | murder04-e2 | 반복된 추락의 인과 잔향 | murder/rooftop_echo.png | r290/mobs/m055.webp 100% |
| murder04 | murder04-e2 | 옥상으로 돌아온 기억 잔향 | murder/rooftop_echo.png | r410/mobs/m054.webp 100% |
| murder04 | murder04-e2 | 유리 망령 | murder/rooftop_echo.png | r410/mobs/m018.webp 100% |
| murder04 | murder04-e2 | 제출되지 못한 문장 | murder/rooftop_echo.png | r290/mobs/m053.webp 100% |
| murder04 | murder04-e3 | 유리 망령 | episode1b/generated-v394/blue_executor.webp | r410/mobs/m018.webp 100% |
| murder04 | murder04-e3 | 은폐기록 연결체 | episode1b/generated-v394/blue_executor.webp | r116/mobs/M125-idle.png 97%, episode1b/generated-v394/blue_executor.webp 3% |
| murder04 | murder04-mid | 진술 봉쇄 인과핵 (중간보스) | generated-v31224/actors-normalized/0c66fa2bfd51_silent_alarm.webp | r104/bosses/murder04-mid-p4.webp 96%, r104/bosses/murder04-mid-p2.webp 4% |
| u201 | murder04-e1 | 공실 표기 잔재 | murder/silent_alarm.png | r290/mobs/m052.webp 100% |
| u201 | murder04-e1 | 유리 망령 | murder/silent_alarm.png | r410/mobs/m018.webp 100% |
| u201 | murder04-e2 | 유리 망령 | murder/rooftop_echo.png | r410/mobs/m018.webp 100% |
| u201 | murder04-e2 | 제출되지 못한 문장 | murder/rooftop_echo.png | r290/mobs/m053.webp 100% |
| u201 | murder04-e3 | 유리 망령 | episode1b/generated-v394/blue_executor.webp | r410/mobs/m018.webp 100% |
| u201 | murder04-e3 | 은폐기록 연결체 | episode1b/generated-v394/blue_executor.webp | r116/mobs/M125-idle.png 100% |
| u201 | murder04-mid | 진술 봉쇄 인과핵 (중간보스) | generated-v31224/actors-normalized/0c66fa2bfd51_silent_alarm.webp | r104/bosses/murder04-mid-p4.webp 100% |
| u201 | u201-e1 | 전쟁기억 정찰드론 | u2/mdrone_idle.png | r92/mobs/M038-move.png 95%, u2/mdrone_idle.png 5% |
| u201 | u201-e1 | 태엽 수집자 | u2/mdrone_idle.png | r410/mobs/m033.webp 100% |
| u201 | u201-e2 | 전쟁기계사냥개 | u2/generated-v350/u2_cyborg_hound.webp | r380/mobs/war-machine-hound-v1.webp 100% |
| u201 | u201-e2 | 태엽 수집자 | u2/generated-v350/u2_cyborg_hound.webp | r410/mobs/m033.webp 100% |
| u201 | u201-e3 | 참호 공명기사 | u2/generated-v350/u2_resonance_knight.webp | r116/mobs/M037-idle.png 76%, r92/mobs/M037-attack.png 20%, u2/generated-v350/u2_resonance_knight.webp 4% |
| u201 | u201-e3 | 태엽 수집자 | u2/generated-v350/u2_resonance_knight.webp | r410/mobs/m033.webp 100% |
| u201 | u201-mid | 제4단계 전쟁관리자 (중간보스) | generated-v31224/actors-normalized/838c3c4440d1_u2_suppression_knight.webp | assets/r974/move/u201-mid-side.webp 82%, assets/r974/move/u201-mid-up.webp 8%, r104/bosses/u201-mid-p4.webp 6% |
| u202 | u201-e1 | 전쟁기억 정찰드론 | u2/mdrone_idle.png | r92/mobs/M038-move.png 100% |
| u202 | u201-e1 | 태엽 수집자 | u2/mdrone_idle.png | r410/mobs/m033.webp 100% |
| u202 | u201-e2 | 전쟁기계사냥개 | u2/generated-v350/u2_cyborg_hound.webp | r380/mobs/war-machine-hound-v1.webp 100% |
| u202 | u201-e2 | 태엽 수집자 | u2/generated-v350/u2_cyborg_hound.webp | r410/mobs/m033.webp 100% |
| u202 | u201-e3 | 참호 공명기사 | u2/generated-v350/u2_resonance_knight.webp | r116/mobs/M037-idle.png 71%, r92/mobs/M037-attack.png 29% |
| u202 | u201-e3 | 태엽 수집자 | u2/generated-v350/u2_resonance_knight.webp | r410/mobs/m033.webp 100% |
| u202 | u201-mid | 제4단계 전쟁관리자 (중간보스) | generated-v31224/actors-normalized/838c3c4440d1_u2_suppression_knight.webp | r104/bosses/u201-mid-p4.webp 100% |
| u202 | u202-e1 | 가짜 자비 수집가 | u2/generated-v350/u2_reactor_collector.webp | r380/mobs/u2-false-mercy-collector-walk-d1.webp 100% |
| u202 | u202-e1 | 기계화 망각거미 | u2/generated-v350/u2_reactor_collector.webp | r380/mobs/mech-oblivion-spider.webp 100% |
| u202 | u202-e1 | 태엽 수집자 | u2/generated-v350/u2_reactor_collector.webp | r410/mobs/m033.webp 100% |
| u202 | u202-e2 | 복종 봉인구 | u2/generated-v350/u2_memory_orb.webp | r92/mobs/M039-move.png 96%, u2/generated-v350/u2_memory_orb.webp 4% |
| u202 | u202-e2 | 태엽 수집자 | u2/generated-v350/u2_memory_orb.webp | r410/mobs/m033.webp 100% |
| u202 | u202-e3 | 감옥 공명기사 | u2/generated-v350/u2_suppression_knight.webp | r116/mobs/M041-idle.png 78%, r92/mobs/M041-attack.png 18%, u2/generated-v350/u2_suppression_knight.webp 4% |
| u202 | u202-e3 | 태엽 수집자 | u2/generated-v350/u2_suppression_knight.webp | r410/mobs/m033.webp 100% |
| u202 | u202-mid | 제8단계 자비 교정관 (중간보스) | generated-v31224/actors-normalized/8e86a4cadfc7_u2_mirror_priest.webp | assets/r974/move/u202-mid-side.webp 80%, assets/r974/move/u202-mid-down.webp 10%, r104/bosses/u202-mid-p4.webp 6% |
| u204 | u202-e1 | 가짜 자비 수집가 | u2/generated-v350/u2_reactor_collector.webp | r380/mobs/u2-false-mercy-collector-walk-d1.webp 100% |
| u204 | u202-e1 | 기계화 망각거미 | u2/generated-v350/u2_reactor_collector.webp | r380/mobs/mech-oblivion-spider.webp 100% |
| u204 | u202-e1 | 태엽 수집자 | u2/generated-v350/u2_reactor_collector.webp | r410/mobs/m033.webp 100% |
| u204 | u202-e2 | 복종 봉인구 | u2/generated-v350/u2_memory_orb.webp | r92/mobs/M039-move.png 100% |
| u204 | u202-e2 | 태엽 수집자 | u2/generated-v350/u2_memory_orb.webp | r410/mobs/m033.webp 100% |
| u204 | u202-e3 | 감옥 공명기사 | u2/generated-v350/u2_suppression_knight.webp | r116/mobs/M041-idle.png 83%, r92/mobs/M041-attack.png 17% |
| u204 | u202-e3 | 태엽 수집자 | u2/generated-v350/u2_suppression_knight.webp | r410/mobs/m033.webp 100% |
| u204 | u202-mid | 제8단계 자비 교정관 (중간보스) | generated-v31224/actors-normalized/8e86a4cadfc7_u2_mirror_priest.webp | assets/r974/move/u202-mid-side.webp 97%, r104/bosses/u202-mid-p4.webp 3% |
| u204 | u204-e1 | 기계화 첫 기억 청람잔영 | u2/generated-v350/u2_blue_wraith.webp | r380/mobs/u204-mech-01-v1.webp 100% |
| u204 | u204-e1 | 태엽 수집자 | u2/generated-v350/u2_blue_wraith.webp | r410/mobs/m033.webp 100% |
| u204 | u204-e2 | 기계화 기억 공백 망령 | u2/generated-v350/u2_void_wraith.webp | r380/mobs/u204-mech-02-v1.webp 100% |
| u204 | u204-e2 | 태엽 수집자 | u2/generated-v350/u2_void_wraith.webp | r410/mobs/m033.webp 100% |
| u204 | u204-e3 | 기계화 문턱 관측거미 | u2/generated-v350/u2_observer_spider.webp | r380/mobs/u204-mech-03-v1.webp 100% |
| u204 | u204-e3 | 태엽 수집자 | u2/generated-v350/u2_observer_spider.webp | r410/mobs/m033.webp 100% |
| u204 | u204-mid | 기계화 제12단계 기억 검열기 (중간보스) | generated-v31224/actors-normalized/8e86a4cadfc7_u2_mirror_priest.webp | r380/mobs/u204-mech-04-v1.webp 100% |
| u205 | u204-e1 | 기계화 첫 기억 청람잔영 | u2/generated-v350/u2_blue_wraith.webp | r380/mobs/u204-mech-01-v1.webp 100% |
| u205 | u204-e1 | 태엽 수집자 | u2/generated-v350/u2_blue_wraith.webp | r410/mobs/m033.webp 100% |
| u205 | u204-e2 | 기계화 기억 공백 망령 | u2/generated-v350/u2_void_wraith.webp | r380/mobs/u204-mech-02-v1.webp 100% |
| u205 | u204-e2 | 태엽 수집자 | u2/generated-v350/u2_void_wraith.webp | r410/mobs/m033.webp 100% |
| u205 | u204-e3 | 기계화 문턱 관측거미 | u2/generated-v350/u2_observer_spider.webp | r380/mobs/u204-mech-03-v1.webp 100% |
| u205 | u204-e3 | 태엽 수집자 | u2/generated-v350/u2_observer_spider.webp | r410/mobs/m033.webp 100% |
| u205 | u204-mid | 기계화 제12단계 기억 검열기 (중간보스) | generated-v31224/actors-normalized/8e86a4cadfc7_u2_mirror_priest.webp | r380/mobs/u204-mech-04-v1.webp 100% |
| u205 | u205-e1 | 태엽 수집자 | u2/generated-v350/u2_void_wraith.webp | r410/mobs/m033.webp 100% |
| u205 | u205-e1 | 학대기록 공허체 | u2/generated-v350/u2_void_wraith.webp | r374/mobs/u205-e1-new.webp 100% |
| u205 | u205-e2 | 관리자 추적견 | u2/generated-v350/u2_cyborg_hound.webp | r374/mobs/u205-e2-new.webp 100% |
| u205 | u205-e2 | 태엽 수집자 | u2/generated-v350/u2_cyborg_hound.webp | r410/mobs/m033.webp 100% |
| u205 | u205-e3 | 역전기록 수집가 | u2/generated-v350/u2_reactor_collector.webp | r374/mobs/u205-e3-new.webp 100% |
| u205 | u205-e3 | 태엽 수집자 | u2/generated-v350/u2_reactor_collector.webp | r410/mobs/m033.webp 100% |
| u205 | u205-mid | 제14단계 역전 관리자 (중간보스) | generated-v31224/actors-normalized/838c3c4440d1_u2_suppression_knight.webp | r374/mobs/u205-mid-new.webp 100% |
| u206 | u205-e1 | 태엽 수집자 | u2/generated-v350/u2_void_wraith.webp | r410/mobs/m033.webp 100% |
| u206 | u205-e1 | 학대기록 공허체 | u2/generated-v350/u2_void_wraith.webp | r374/mobs/u205-e1-new.webp 100% |
| u206 | u205-e2 | 관리자 추적견 | u2/generated-v350/u2_cyborg_hound.webp | r374/mobs/u205-e2-new.webp 100% |
| u206 | u205-e2 | 태엽 수집자 | u2/generated-v350/u2_cyborg_hound.webp | r410/mobs/m033.webp 100% |
| u206 | u205-e3 | 역전기록 수집가 | u2/generated-v350/u2_reactor_collector.webp | r374/mobs/u205-e3-new.webp 100% |
| u206 | u205-e3 | 태엽 수집자 | u2/generated-v350/u2_reactor_collector.webp | r410/mobs/m033.webp 100% |
| u206 | u205-mid | 제14단계 역전 관리자 (중간보스) | generated-v31224/actors-normalized/838c3c4440d1_u2_suppression_knight.webp | r374/mobs/u205-mid-new.webp 100% |
| u206 | u206-e1 | 기계화 기억이주 연결자 | u2/generated-v350/u2_memory_orb.webp | r380/mobs/u206-mech-01-v1.webp 100% |
| u206 | u206-e1 | 태엽 수집자 | u2/generated-v350/u2_memory_orb.webp | r410/mobs/m033.webp 100% |
| u206 | u206-e2 | 기계화 공명술사 | u2/generated-v350/u2_resonance_knight.webp | r380/mobs/u206-mech-02-v1.webp 100% |
| u206 | u206-e2 | 태엽 수집자 | u2/generated-v350/u2_resonance_knight.webp | r410/mobs/m033.webp 100% |
| u206 | u206-e3 | 입양기억 청람잔영 | u2/generated-v350/u2_blue_wraith.webp | r410/mobs/m039.webp 100% |
| u206 | u206-e3 | 태엽 수집자 | u2/generated-v350/u2_blue_wraith.webp | r410/mobs/m033.webp 100% |
| u206 | u206-mid | 제17단계 중앙이주 코어 (중간보스) | generated-v31224/actors-normalized/4f26454d8ae2_enemy_void_core.webp | assets/r974/move/u206-mid-side.webp 83%, rc140/story-cycle-motions/u206-mid.png 10%, assets/r974/move/u206-mid-down.webp 7% |
| cult01 | c101-e1 | 기계화 복종 봉인구 | cult-v3123/generated-v31342-rc39/blindfold_modern_cultist_bloodied.webp | r380/mobs/cult-memory-orb-float-d1.webp 100% |
| cult01 | c101-e1 | 흑장미 눈가린 신도 | cult-v3123/generated-v31342-rc39/blindfold_modern_cultist_bloodied.webp | r363/mobs/L128.webp 100% |
| cult01 | c101-e2 | 기계화 복종 봉인구 | cult-v3123/generated-v31342-rc39/earcovered_modern_cultist_bloodied.webp | r380/mobs/cult-memory-orb-float-d1.webp 100% |
| cult01 | c101-e2 | 흑장미 귀막은 신도 | cult-v3123/generated-v31342-rc39/earcovered_modern_cultist_bloodied.webp | r275/mobs/censer-priest.webp 99%, r223/mobs/censer-priest.webp 1% |
| cult01 | c101-e3 | 기계화 복종 봉인구 | cult-v3123/green_enemy_slime.webp | r380/mobs/cult-memory-orb-float-d1.webp 100% |
| cult01 | c101-e3 | 세뇌 신호 점액체 | cult-v3123/green_enemy_slime.webp | r380/mobs/legacy-m130-slime-cult01-v2.webp 86%, r92/mobs/M130-move.png 11%, r116/mobs/M130-idle.png 2% |
| cult01 | c101-mid | 칩 제단 방화벽 (중간보스) | generated-v31224/actors-normalized/1fc9834a3db7_c101_rose_guardian.webp | rc140/story-cycle-motions/c101-mid.png 100% |
| cult01 | u206-e1 | 기계화 기억이주 연결자 | u2/generated-v350/u2_memory_orb.webp | r380/mobs/u206-mech-01-v1.webp 100% |
| cult01 | u206-e1 | 태엽 수집자 | u2/generated-v350/u2_memory_orb.webp | r410/mobs/m033.webp 100% |
| cult01 | u206-e2 | 기계화 공명술사 | u2/generated-v350/u2_resonance_knight.webp | r380/mobs/u206-mech-02-v1.webp 100% |
| cult01 | u206-e2 | 태엽 수집자 | u2/generated-v350/u2_resonance_knight.webp | r410/mobs/m033.webp 100% |
| cult01 | u206-e3 | 입양기억 청람잔영 | u2/generated-v350/u2_blue_wraith.webp | r410/mobs/m039.webp 100% |
| cult01 | u206-e3 | 태엽 수집자 | u2/generated-v350/u2_blue_wraith.webp | r410/mobs/m033.webp 100% |
| cult01 | u206-mid | 제17단계 중앙이주 코어 (중간보스) | generated-v31224/actors-normalized/4f26454d8ae2_enemy_void_core.webp | assets/r974/move/u206-mid-down.webp 97%, rc140/story-cycle-motions/u206-mid.png 3% |
| dist05 | c101-e1 | 기계화 복종 봉인구 | cult-v3123/generated-v31342-rc39/blindfold_modern_cultist_bloodied.webp | r380/mobs/cult-memory-orb-float-d1.webp 100% |
| dist05 | c101-e1 | 흑장미 눈가린 신도 | cult-v3123/generated-v31342-rc39/blindfold_modern_cultist_bloodied.webp | r363/mobs/L128.webp 100% |
| dist05 | c101-e2 | 기계화 복종 봉인구 | cult-v3123/generated-v31342-rc39/earcovered_modern_cultist_bloodied.webp | r380/mobs/cult-memory-orb-float-d1.webp 100% |
| dist05 | c101-e2 | 흑장미 귀막은 신도 | cult-v3123/generated-v31342-rc39/earcovered_modern_cultist_bloodied.webp | r275/mobs/censer-priest.webp 100% |
| dist05 | c101-e3 | 기계화 복종 봉인구 | cult-v3123/green_enemy_slime.webp | r380/mobs/cult-memory-orb-float-d1.webp 100% |
| dist05 | c101-e3 | 세뇌 신호 점액체 | cult-v3123/green_enemy_slime.webp | r380/mobs/legacy-m130-slime-cult01-v2.webp 86%, r92/mobs/M130-move.png 14% |
| dist05 | c101-mid | 칩 제단 방화벽 (중간보스) | generated-v31224/actors-normalized/1fc9834a3db7_c101_rose_guardian.webp | rc140/story-cycle-motions/c101-mid.png 100% |
| dist05 | dist05-c1 | 검은기둥 가고일 수호자 | episode1a/generated-v31342-rc39/gargoyle_mob_bloodied.webp | r109/mobs/M007-move.png 97%, episode1a/generated-v31342-rc39/gargoyle_mob_bloodied.webp 3% |
| dist05 | dist05-h1 | 검은 소환 기둥 | episode1a/horned_swamp_demon.webp | assets/r105/props/dist03-pillar.webp 100% |
| dist05 | dist05-h1 | 소환진 순례악마 | episode1a/horned_swamp_demon.webp | r109/mobs/M008-move.png 94%, episode1a/horned_swamp_demon.webp 3%, r116/mobs/M008-idle.png 3% |
| dist05 | dist05-m1 | 검은기둥 주문사 | dist/cult_mage.png | r410/mobs/m009.webp 100% |
| dist05 | dist05-s1 | 검은기둥 가고일 수호자 | dist/skeleton.png | r109/mobs/M007-move.png 97%, episode1a/generated-v31342-rc39/gargoyle_mob_bloodied.webp 3% |
| dist05 | mb-dist05 | 숨이 끊긴 전령의 그림자 (중간보스) | generated-v31224/actors-normalized/cfb37917e7c0_dist_dying_messenger_shadow.webp | r104/bosses/mb-dist05-p4.webp 96%, r104/bosses/mb-dist05-p2.webp 4% |
| kair02 | dist05-c1 | 검은기둥 가고일 수호자 | episode1a/generated-v31342-rc39/gargoyle_mob_bloodied.webp | r109/mobs/M007-move.png 100% |
| kair02 | dist05-h1 | 검은 소환 기둥 | episode1a/horned_swamp_demon.webp | assets/r105/props/dist03-pillar.webp 100% |
| kair02 | dist05-h1 | 소환진 순례악마 | episode1a/horned_swamp_demon.webp | r109/mobs/M008-move.png 100% |
| kair02 | dist05-m1 | 검은기둥 주문사 | dist/cult_mage.png | r410/mobs/m009.webp 100% |
| kair02 | dist05-s1 | 검은기둥 가고일 수호자 | dist/skeleton.png | r109/mobs/M007-move.png 100% |
| kair02 | kair-elite-59 | 상위수문장 | generated-v3125/kair-guardians/guardian_59.webp | r92/mobs/M113-move.png 82%, generated-v3125/kair-guardians/guardian_59.webp 18% |
| kair02 | kair-elite-60 | 상위수문장 | generated-v3125/kair-guardians/guardian_60.webp | r92/mobs/M114-move.png 86%, generated-v3125/kair-guardians/guardian_60.webp 14% |
| kair02 | kair-guardian-43 | 시간수문장 | generated-v3125/kair-guardians/guardian_43.webp | generated-v3125/kair-guardians/guardian_43.webp 100% |
| kair02 | kair-guardian-43 | 태엽 수집자 | generated-v3125/kair-guardians/guardian_43.webp | r410/mobs/m033.webp 100% |
| kair02 | kair-guardian-44 | 시간수문장 | generated-v3125/kair-guardians/guardian_44.webp | r375/mobs/kair-44.webp 100% |
| kair02 | kair-guardian-44 | 태엽 수집자 | generated-v3125/kair-guardians/guardian_44.webp | r410/mobs/m033.webp 100% |
| kair02 | kair-guardian-45 | 시간수문장 | generated-v3125/kair-guardians/guardian_45.webp | r375/mobs/kair-45.webp 100% |
| kair02 | kair-guardian-46 | 시간수문장 | generated-v3125/kair-guardians/guardian_46.webp | r380/mobs/legacy-m110-time-guardian-v3-walk-d1.webp 50%, generated-v3125/kair-guardians/guardian_46.webp 50% |
| kair02 | kair-guardian-46 | 태엽 수집자 | generated-v3125/kair-guardians/guardian_46.webp | r410/mobs/m033.webp 100% |
| kair02 | kair-guardian-48 | 시간수문장 | generated-v3125/kair-guardians/guardian_48.webp | r375/mobs/kair-48.webp 100% |
| kair02 | mb-dist05 | 숨이 끊긴 전령의 그림자 (중간보스) | generated-v31224/actors-normalized/cfb37917e7c0_dist_dying_messenger_shadow.webp | r104/bosses/mb-dist05-p4.webp 100% |
| kair04 | kair-elite-49 | 상위수문장 | generated-v3125/kair-guardians/guardian_49.webp | generated-v3125/kair-guardians/guardian_49.webp 100% |
| kair04 | kair-elite-50 | 상위수문장 | generated-v3125/kair-guardians/guardian_50.webp | generated-v3125/kair-guardians/guardian_50.webp 76%, r92/mobs/M062-attack.png 21%, rc137/mob-attacks-04.png 3% |
| kair04 | kair-elite-59 | 상위수문장 | generated-v3125/kair-guardians/guardian_59.webp | generated-v3125/kair-guardians/guardian_59.webp 100% |
| kair04 | kair-elite-60 | 상위수문장 | generated-v3125/kair-guardians/guardian_60.webp | r92/mobs/M114-move.png 100% |
| kair04 | kair-guardian-01 | 시간수문장 | generated-v3125/kair-guardians/guardian_01.webp | generated-v3125/kair-guardians/guardian_01.webp 90%, r92/mobs/M055-attack.png 10% |
| kair04 | kair-guardian-02 | 시간수문장 | generated-v3125/kair-guardians/guardian_02.webp | generated-v3125/kair-guardians/guardian_02.webp 100% |
| kair04 | kair-guardian-03 | 시간수문장 | generated-v3125/kair-guardians/guardian_03.webp | r116/mobs/M057-idle.png 82%, r92/mobs/M057-attack.png 15%, generated-v3125/kair-guardians/guardian_03.webp 3% |
| kair04 | kair-guardian-04 | 시간수문장 | generated-v3125/kair-guardians/guardian_04.webp | generated-v3125/kair-guardians/guardian_04.webp 86%, r92/mobs/M058-attack.png 13%, rc137/mob-attacks-04.png 1% |
| kair04 | kair-guardian-05 | 시간수문장 | generated-v3125/kair-guardians/guardian_05.webp | generated-v3125/kair-guardians/guardian_05.webp 100% |
| kair04 | kair-guardian-06 | 시간수문장 | generated-v3125/kair-guardians/guardian_06.webp | generated-v3125/kair-guardians/guardian_06.webp 73%, r92/mobs/M060-attack.png 27% |
| kair04 | kair-guardian-43 | 시간수문장 | generated-v3125/kair-guardians/guardian_43.webp | generated-v3125/kair-guardians/guardian_43.webp 100% |
| kair04 | kair-guardian-43 | 태엽 수집자 | generated-v3125/kair-guardians/guardian_43.webp | r410/mobs/m033.webp 100% |
| kair04 | kair-guardian-44 | 시간수문장 | generated-v3125/kair-guardians/guardian_44.webp | r375/mobs/kair-44.webp 100% |
| kair04 | kair-guardian-44 | 태엽 수집자 | generated-v3125/kair-guardians/guardian_44.webp | r410/mobs/m033.webp 100% |
| kair04 | kair-guardian-45 | 시간수문장 | generated-v3125/kair-guardians/guardian_45.webp | r375/mobs/kair-45.webp 100% |
| kair04 | kair-guardian-46 | 시간수문장 | generated-v3125/kair-guardians/guardian_46.webp | r380/mobs/legacy-m110-time-guardian-v3-walk-d1.webp 50%, generated-v3125/kair-guardians/guardian_46.webp 50% |
| kair04 | kair-guardian-46 | 태엽 수집자 | generated-v3125/kair-guardians/guardian_46.webp | r410/mobs/m033.webp 100% |
| kair04 | kair-guardian-48 | 시간수문장 | generated-v3125/kair-guardians/guardian_48.webp | r375/mobs/kair-48.webp 100% |
| kair04 | mb-kair04-v31231 | 휴식 수확관 · 과로의 수문장 (중간보스) | generated-v3125/kair-guardians/guardian_50.webp | assets/r974/move/mb-kair04-v31231-down.webp 56%, assets/r974/move/mb-kair04-v31231-side.webp 32%, assets/r974/move/mb-kair04-v31231-up.webp 8% |
| kair05 | kair-elite-49 | 상위수문장 | generated-v3125/kair-guardians/guardian_49.webp | generated-v3125/kair-guardians/guardian_49.webp 100% |
| kair05 | kair-elite-50 | 상위수문장 | generated-v3125/kair-guardians/guardian_50.webp | r92/mobs/M062-attack.png 100% |
| kair05 | kair-elite-51 | 상위수문장 | generated-v3125/kair-guardians/guardian_51.webp | generated-v3125/kair-guardians/guardian_51.webp 88%, r92/mobs/M069-attack.png 8%, rc137/mob-attacks-05.png 4% |
| kair05 | kair-guardian-01 | 시간수문장 | generated-v3125/kair-guardians/guardian_01.webp | generated-v3125/kair-guardians/guardian_01.webp 86%, r92/mobs/M055-attack.png 14% |
| kair05 | kair-guardian-02 | 시간수문장 | generated-v3125/kair-guardians/guardian_02.webp | generated-v3125/kair-guardians/guardian_02.webp 100% |
| kair05 | kair-guardian-03 | 시간수문장 | generated-v3125/kair-guardians/guardian_03.webp | r116/mobs/M057-idle.png 100% |
| kair05 | kair-guardian-04 | 시간수문장 | generated-v3125/kair-guardians/guardian_04.webp | generated-v3125/kair-guardians/guardian_04.webp 83%, rc137/mob-attacks-04.png 17% |
| kair05 | kair-guardian-05 | 시간수문장 | generated-v3125/kair-guardians/guardian_05.webp | generated-v3125/kair-guardians/guardian_05.webp 100% |
| kair05 | kair-guardian-06 | 시간수문장 | generated-v3125/kair-guardians/guardian_06.webp | r92/mobs/M060-attack.png 100% |
| kair05 | kair-guardian-07 | 시간수문장 | generated-v3125/kair-guardians/guardian_07.webp | generated-v3125/kair-guardians/guardian_07.webp 89%, r92/mobs/M063-attack.png 11% |
| kair05 | kair-guardian-08 | 시간수문장 | generated-v3125/kair-guardians/guardian_08.webp | generated-v3125/kair-guardians/guardian_08.webp 96%, r92/mobs/M064-attack.png 4% |
| kair05 | kair-guardian-09 | 시간수문장 | generated-v3125/kair-guardians/guardian_09.webp | generated-v3125/kair-guardians/guardian_09.webp 89%, r92/mobs/M065-attack.png 10%, rc137/mob-attacks-05.png 1% |
| kair05 | kair-guardian-10 | 시간수문장 | generated-v3125/kair-guardians/guardian_10.webp | generated-v3125/kair-guardians/guardian_10.webp 86%, r92/mobs/M066-attack.png 12%, rc137/mob-attacks-05.png 2% |
| kair05 | kair-guardian-11 | 시간수문장 | generated-v3125/kair-guardians/guardian_11.webp | generated-v3125/kair-guardians/guardian_11.webp 86%, r92/mobs/M067-attack.png 14% |
| kair05 | kair-guardian-12 | 시간수문장 | generated-v3125/kair-guardians/guardian_12.webp | generated-v3125/kair-guardians/guardian_12.webp 80%, r92/mobs/M068-attack.png 20% |
| kair05 | mb-kair04-v31231 | 휴식 수확관 · 과로의 수문장 (중간보스) | generated-v3125/kair-guardians/guardian_50.webp | assets/r974/move/mb-kair04-v31231-down.webp 98%, rc140/story-cycle-motions/mb-kair04-v31231.png 2% |
| kair06 | kair-elite-51 | 상위수문장 | generated-v3125/kair-guardians/guardian_51.webp | r92/mobs/M069-attack.png 100% |
| kair06 | kair-elite-52 | 상위수문장 | generated-v3125/kair-guardians/guardian_52.webp | r92/mobs/M076-move.png 100% |
| kair06 | kair-guardian-07 | 시간수문장 | generated-v3125/kair-guardians/guardian_07.webp | generated-v3125/kair-guardians/guardian_07.webp 100% |
| kair06 | kair-guardian-08 | 시간수문장 | generated-v3125/kair-guardians/guardian_08.webp | generated-v3125/kair-guardians/guardian_08.webp 100% |
| kair06 | kair-guardian-09 | 시간수문장 | generated-v3125/kair-guardians/guardian_09.webp | generated-v3125/kair-guardians/guardian_09.webp 86%, r92/mobs/M065-attack.png 14% |
| kair06 | kair-guardian-10 | 시간수문장 | generated-v3125/kair-guardians/guardian_10.webp | generated-v3125/kair-guardians/guardian_10.webp 62%, r92/mobs/M066-attack.png 38% |
| kair06 | kair-guardian-11 | 시간수문장 | generated-v3125/kair-guardians/guardian_11.webp | generated-v3125/kair-guardians/guardian_11.webp 100% |
| kair06 | kair-guardian-12 | 시간수문장 | generated-v3125/kair-guardians/guardian_12.webp | generated-v3125/kair-guardians/guardian_12.webp 100% |
| kair06 | kair-guardian-13 | 시간수문장 | generated-v3125/kair-guardians/guardian_13.webp | generated-v3125/kair-guardians/guardian_13.webp 100% |
| kair06 | kair-guardian-14 | 시간수문장 | generated-v3125/kair-guardians/guardian_14.webp | generated-v3125/kair-guardians/guardian_14.webp 100% |
| kair06 | kair-guardian-15 | 시간수문장 | generated-v3125/kair-guardians/guardian_15.webp | generated-v3125/kair-guardians/guardian_15.webp 85%, r92/mobs/M072-attack.png 15%, rc137/mob-attacks-05.png 0% |
| kair06 | kair-guardian-16 | 시간수문장 | generated-v3125/kair-guardians/guardian_16.webp | generated-v3125/kair-guardians/guardian_16.webp 75%, r92/mobs/M073-attack.png 22%, rc137/mob-attacks-05.png 3% |
| kair06 | kair-guardian-17 | 시간수문장 | generated-v3125/kair-guardians/guardian_17.webp | generated-v3125/kair-guardians/guardian_17.webp 74%, r92/mobs/M074-attack.png 26% |
| kair06 | kair-guardian-18 | 시간수문장 | generated-v3125/kair-guardians/guardian_18.webp | r92/mobs/M075-move.png 100% |
| kair07 | kair-elite-52 | 상위수문장 | generated-v3125/kair-guardians/guardian_52.webp | r92/mobs/M076-move.png 100% |
| kair07 | kair-elite-53 | 상위수문장 | generated-v3125/kair-guardians/guardian_53.webp | r92/mobs/M083-attack.png 54%, generated-v3125/kair-guardians/guardian_53.webp 46% |
| kair07 | kair-elite-54 | 상위수문장 | generated-v3125/kair-guardians/guardian_54.webp | generated-v3125/kair-guardians/guardian_54.webp 100% |
| kair07 | kair-guardian-13 | 시간수문장 | generated-v3125/kair-guardians/guardian_13.webp | generated-v3125/kair-guardians/guardian_13.webp 100% |
| kair07 | kair-guardian-14 | 시간수문장 | generated-v3125/kair-guardians/guardian_14.webp | generated-v3125/kair-guardians/guardian_14.webp 100% |
| kair07 | kair-guardian-15 | 시간수문장 | generated-v3125/kair-guardians/guardian_15.webp | generated-v3125/kair-guardians/guardian_15.webp 96%, r92/mobs/M072-attack.png 4% |
| kair07 | kair-guardian-16 | 시간수문장 | generated-v3125/kair-guardians/guardian_16.webp | generated-v3125/kair-guardians/guardian_16.webp 61%, r92/mobs/M073-attack.png 39% |
| kair07 | kair-guardian-17 | 시간수문장 | generated-v3125/kair-guardians/guardian_17.webp | generated-v3125/kair-guardians/guardian_17.webp 100% |
| kair07 | kair-guardian-18 | 시간수문장 | generated-v3125/kair-guardians/guardian_18.webp | r92/mobs/M075-attack.png 100% |
| kair07 | kair-guardian-19 | 기계화 감옥 공명기사 | generated-v3125/kair-guardians/guardian_19.webp | u2/generated-v350/u2_suppression_knight.webp 78%, rc137/mob-attacks-03.png 22% |
| kair07 | kair-guardian-19 | 시간수문장 | generated-v3125/kair-guardians/guardian_19.webp | generated-v3125/kair-guardians/guardian_19.webp 100% |
| kair07 | kair-guardian-20 | 기계화 감옥 공명기사 | generated-v3125/kair-guardians/guardian_20.webp | u2/generated-v350/u2_suppression_knight.webp 100% |
| kair07 | kair-guardian-20 | 시간수문장 | generated-v3125/kair-guardians/guardian_20.webp | generated-v3125/kair-guardians/guardian_20.webp 87%, r92/mobs/M078-attack.png 13% |
| kair07 | kair-guardian-21 | 기계화 감옥 공명기사 | generated-v3125/kair-guardians/guardian_21.webp | u2/generated-v350/u2_suppression_knight.webp 93%, rc137/mob-attacks-03.png 7% |
| kair07 | kair-guardian-21 | 시간수문장 | generated-v3125/kair-guardians/guardian_21.webp | generated-v3125/kair-guardians/guardian_21.webp 100% |
| kair07 | kair-guardian-22 | 기계화 감옥 공명기사 | generated-v3125/kair-guardians/guardian_22.webp | u2/generated-v350/u2_suppression_knight.webp 80%, rc137/mob-attacks-03.png 20% |
| kair07 | kair-guardian-22 | 시간수문장 | generated-v3125/kair-guardians/guardian_22.webp | generated-v3125/kair-guardians/guardian_22.webp 100% |
| kair07 | kair-guardian-23 | 시간수문장 | generated-v3125/kair-guardians/guardian_23.webp | r92/mobs/M081-move.png 92%, generated-v3125/kair-guardians/guardian_23.webp 8% |
| kair07 | kair-guardian-24 | 시간수문장 | generated-v3125/kair-guardians/guardian_24.webp | generated-v3125/kair-guardians/guardian_24.webp 100% |
| kair08 | kair-elite-53 | 상위수문장 | generated-v3125/kair-guardians/guardian_53.webp | r92/mobs/M083-attack.png 100% |
| kair08 | kair-elite-54 | 상위수문장 | generated-v3125/kair-guardians/guardian_54.webp | generated-v3125/kair-guardians/guardian_54.webp 100% |
| kair08 | kair-elite-55 | 상위수문장 | generated-v3125/kair-guardians/guardian_55.webp | r92/mobs/M091-move.png 96%, generated-v3125/kair-guardians/guardian_55.webp 4% |
| kair08 | kair-great-05 | 대수문장 (중간보스) | generated-v31224/actors-normalized/ba23b5fa3237_great_05.webp | assets/r974/move/kair-great-05-side.webp 44%, rc140/story-cycle-motions/kair-great-05.png 29%, assets/r974/move/kair-great-05-up.webp 27% |
| kair08 | kair-guardian-19 | 기계화 감옥 공명기사 | generated-v3125/kair-guardians/guardian_19.webp | u2/generated-v350/u2_suppression_knight.webp 100% |
| kair08 | kair-guardian-19 | 시간수문장 | generated-v3125/kair-guardians/guardian_19.webp | generated-v3125/kair-guardians/guardian_19.webp 100% |
| kair08 | kair-guardian-20 | 기계화 감옥 공명기사 | generated-v3125/kair-guardians/guardian_20.webp | u2/generated-v350/u2_suppression_knight.webp 100% |
| kair08 | kair-guardian-20 | 시간수문장 | generated-v3125/kair-guardians/guardian_20.webp | generated-v3125/kair-guardians/guardian_20.webp 50%, r92/mobs/M078-attack.png 50% |
| kair08 | kair-guardian-21 | 기계화 감옥 공명기사 | generated-v3125/kair-guardians/guardian_21.webp | u2/generated-v350/u2_suppression_knight.webp 100% |
| kair08 | kair-guardian-21 | 시간수문장 | generated-v3125/kair-guardians/guardian_21.webp | generated-v3125/kair-guardians/guardian_21.webp 100% |
| kair08 | kair-guardian-22 | 기계화 감옥 공명기사 | generated-v3125/kair-guardians/guardian_22.webp | u2/generated-v350/u2_suppression_knight.webp 100% |
| kair08 | kair-guardian-22 | 시간수문장 | generated-v3125/kair-guardians/guardian_22.webp | generated-v3125/kair-guardians/guardian_22.webp 100% |
| kair08 | kair-guardian-23 | 시간수문장 | generated-v3125/kair-guardians/guardian_23.webp | r92/mobs/M081-move.png 100% |
| kair08 | kair-guardian-24 | 시간수문장 | generated-v3125/kair-guardians/guardian_24.webp | generated-v3125/kair-guardians/guardian_24.webp 100% |
| kair08 | kair-guardian-25 | 시간수문장 | generated-v3125/kair-guardians/guardian_25.webp | generated-v3125/kair-guardians/guardian_25.webp 81%, r92/mobs/M085-attack.png 17%, rc137/mob-attacks-06.png 2% |
| kair08 | kair-guardian-25 | 태엽 수집자 | generated-v3125/kair-guardians/guardian_25.webp | r410/mobs/m033.webp 100% |
| kair08 | kair-guardian-26 | 시간수문장 | generated-v3125/kair-guardians/guardian_26.webp | generated-v3125/kair-guardians/guardian_26.webp 83%, r92/mobs/M086-attack.png 16%, rc137/mob-attacks-06.png 1% |
| kair08 | kair-guardian-26 | 태엽 수집자 | generated-v3125/kair-guardians/guardian_26.webp | r410/mobs/m033.webp 100% |
| kair08 | kair-guardian-27 | 시간수문장 | generated-v3125/kair-guardians/guardian_27.webp | r92/mobs/M087-move.png 87%, generated-v3125/kair-guardians/guardian_27.webp 13% |
| kair08 | kair-guardian-27 | 태엽 수집자 | generated-v3125/kair-guardians/guardian_27.webp | r410/mobs/m033.webp 100% |
| kair08 | kair-guardian-28 | 시간수문장 | generated-v3125/kair-guardians/guardian_28.webp | r92/mobs/M088-move.png 74%, generated-v3125/kair-guardians/guardian_28.webp 26% |
| kair08 | kair-guardian-28 | 태엽 수집자 | generated-v3125/kair-guardians/guardian_28.webp | r410/mobs/m033.webp 100% |
| kair08 | kair-guardian-29 | 시간수문장 | generated-v3125/kair-guardians/guardian_29.webp | generated-v3125/kair-guardians/guardian_29.webp 75%, r92/mobs/M089-attack.png 25% |
| kair08 | kair-guardian-30 | 시간수문장 | generated-v3125/kair-guardians/guardian_30.webp | generated-v3125/kair-guardians/guardian_30.webp 76%, r92/mobs/M090-attack.png 21%, rc137/mob-attacks-06.png 4% |
| kair09 | kair-elite-55 | 상위수문장 | generated-v3125/kair-guardians/guardian_55.webp | r92/mobs/M091-move.png 100% |
| kair09 | kair-elite-56 | 상위수문장 | generated-v3125/kair-guardians/guardian_56.webp | generated-v3125/kair-guardians/guardian_56.webp 100% |
| kair09 | kair-elite-57 | 상위수문장 | generated-v3125/kair-guardians/guardian_57.webp | generated-v3125/kair-guardians/guardian_57.webp 77%, r92/mobs/M099-attack.png 20%, rc137/mob-attacks-07.png 3% |
| kair09 | kair-great-05 | 대수문장 (중간보스) | generated-v31224/actors-normalized/ba23b5fa3237_great_05.webp | assets/r974/move/kair-great-05-up.webp 80%, assets/r974/move/kair-great-05-side.webp 18%, rc140/story-cycle-motions/kair-great-05.png 2% |
| kair09 | kair-guardian-25 | 시간수문장 | generated-v3125/kair-guardians/guardian_25.webp | generated-v3125/kair-guardians/guardian_25.webp 82%, r92/mobs/M085-attack.png 18% |
| kair09 | kair-guardian-25 | 태엽 수집자 | generated-v3125/kair-guardians/guardian_25.webp | r410/mobs/m033.webp 100% |
| kair09 | kair-guardian-26 | 시간수문장 | generated-v3125/kair-guardians/guardian_26.webp | generated-v3125/kair-guardians/guardian_26.webp 100% |
| kair09 | kair-guardian-26 | 태엽 수집자 | generated-v3125/kair-guardians/guardian_26.webp | r410/mobs/m033.webp 100% |
| kair09 | kair-guardian-27 | 시간수문장 | generated-v3125/kair-guardians/guardian_27.webp | r92/mobs/M087-move.png 100% |
| kair09 | kair-guardian-27 | 태엽 수집자 | generated-v3125/kair-guardians/guardian_27.webp | r410/mobs/m033.webp 100% |
| kair09 | kair-guardian-28 | 시간수문장 | generated-v3125/kair-guardians/guardian_28.webp | generated-v3125/kair-guardians/guardian_28.webp 55%, r92/mobs/M088-move.png 45% |
| kair09 | kair-guardian-28 | 태엽 수집자 | generated-v3125/kair-guardians/guardian_28.webp | r410/mobs/m033.webp 100% |
| kair09 | kair-guardian-29 | 시간수문장 | generated-v3125/kair-guardians/guardian_29.webp | r92/mobs/M089-attack.png 100% |
| kair09 | kair-guardian-30 | 시간수문장 | generated-v3125/kair-guardians/guardian_30.webp | r92/mobs/M090-attack.png 100% |
| kair09 | kair-guardian-31 | 시간수문장 | generated-v3125/kair-guardians/guardian_31.webp | generated-v3125/kair-guardians/guardian_31.webp 100% |
| kair09 | kair-guardian-32 | 시간수문장 | generated-v3125/kair-guardians/guardian_32.webp | generated-v3125/kair-guardians/guardian_32.webp 100% |
| kair09 | kair-guardian-33 | 시간수문장 | generated-v3125/kair-guardians/guardian_33.webp | generated-v3125/kair-guardians/guardian_33.webp 100% |
| kair09 | kair-guardian-34 | 시간수문장 | generated-v3125/kair-guardians/guardian_34.webp | r92/mobs/M095-move.png 79%, generated-v3125/kair-guardians/guardian_34.webp 21% |
| kair09 | kair-guardian-35 | 시간수문장 | generated-v3125/kair-guardians/guardian_35.webp | generated-v3125/kair-guardians/guardian_35.webp 76%, r92/mobs/M096-attack.png 24% |
| kair09 | kair-guardian-36 | 시간수문장 | generated-v3125/kair-guardians/guardian_36.webp | r92/mobs/M097-move.png 96%, generated-v3125/kair-guardians/guardian_36.webp 4% |
| kair10 | kair-elite-56 | 상위수문장 | generated-v3125/kair-guardians/guardian_56.webp | generated-v3125/kair-guardians/guardian_56.webp 100% |
| kair10 | kair-elite-57 | 상위수문장 | generated-v3125/kair-guardians/guardian_57.webp | generated-v3125/kair-guardians/guardian_57.webp 100% |
| kair10 | kair-elite-58 | 상위수문장 | generated-v3125/kair-guardians/guardian_58.webp | r380/mobs/legacy-m106-elite-guardian-v2.webp 100% |
| kair10 | kair-guardian-31 | 시간수문장 | generated-v3125/kair-guardians/guardian_31.webp | generated-v3125/kair-guardians/guardian_31.webp 100% |
| kair10 | kair-guardian-32 | 시간수문장 | generated-v3125/kair-guardians/guardian_32.webp | generated-v3125/kair-guardians/guardian_32.webp 100% |
| kair10 | kair-guardian-33 | 시간수문장 | generated-v3125/kair-guardians/guardian_33.webp | generated-v3125/kair-guardians/guardian_33.webp 100% |
| kair10 | kair-guardian-34 | 시간수문장 | generated-v3125/kair-guardians/guardian_34.webp | r92/mobs/M095-move.png 80%, generated-v3125/kair-guardians/guardian_34.webp 20% |
| kair10 | kair-guardian-35 | 시간수문장 | generated-v3125/kair-guardians/guardian_35.webp | generated-v3125/kair-guardians/guardian_35.webp 100% |
| kair10 | kair-guardian-36 | 시간수문장 | generated-v3125/kair-guardians/guardian_36.webp | r92/mobs/M097-move.png 100% |
| kair10 | kair-guardian-37 | 시간수문장 | generated-v3125/kair-guardians/guardian_37.webp | generated-v3125/kair-guardians/guardian_37.webp 100% |
| kair10 | kair-guardian-38 | 시간수문장 | generated-v3125/kair-guardians/guardian_38.webp | generated-v3125/kair-guardians/guardian_38.webp 100% |
| kair10 | kair-guardian-39 | 시간수문장 | generated-v3125/kair-guardians/guardian_39.webp | r363/mobs/L102.webp 82%, generated-v3125/kair-guardians/guardian_39.webp 18% |
| kair10 | kair-guardian-40 | 시간수문장 | generated-v3125/kair-guardians/guardian_40.webp | generated-v3125/kair-guardians/guardian_40.webp 73%, r92/mobs/M103-attack.png 27% |
| kair10 | kair-guardian-41 | 시간수문장 | generated-v3125/kair-guardians/guardian_41.webp | generated-v3125/kair-guardians/guardian_41.webp 100% |
| kair10 | kair-guardian-42 | 시간수문장 | generated-v3125/kair-guardians/guardian_42.webp | generated-v3125/kair-guardians/guardian_42.webp 100% |
| ep1b03 | b03-c1 | 긴 뱀의 그림자 | episode1b/generated-v394/envy_leviathan.webp | r92/mobs/M023-move.png 99%, episode1b/generated-v394/envy_leviathan.webp 1% |
| ep1b03 | b03-c1 | 유리 망령 | episode1b/generated-v394/envy_leviathan.webp | r410/mobs/m018.webp 100% |
| ep1b03 | b03-g1 | 유리 망령 | episode1b/envy_glass_shard.webp | r410/mobs/m018.webp 100% |
| ep1b03 | b03-g1 | 질투로 얼룩진 망령 | episode1b/envy_glass_shard.webp | r380/mobs/jealousy-wraith-v1.webp 100% |
| ep1b03 | b03-g2 | 유리 망령 | episode1b/envy_glass_shard.webp | r410/mobs/m018.webp 100% |
| ep1b03 | b03-g2 | 추녀의 한탄 | episode1b/envy_glass_shard.webp | r380/mobs/mirror-lament-v1.webp 100% |
| ep1b03 | mb-ep1b03 | 금이 간 비교잔영 (중간보스) | generated-v31224/actors-normalized/094c62d396f7_cracked_comparison_echo.webp | r104/bosses/mb-ep1b03-p4.webp 50%, assets/r974/move/mb-ep1b03-side.webp 41%, r104/bosses/mb-ep1b03-p2.webp 4% |
| ep1b04 | b03-c1 | 긴 뱀의 그림자 | episode1b/generated-v394/envy_leviathan.webp | r92/mobs/M023-move.png 100% |
| ep1b04 | b03-c1 | 유리 망령 | episode1b/generated-v394/envy_leviathan.webp | r410/mobs/m018.webp 100% |
| ep1b04 | b03-g1 | 유리 망령 | episode1b/envy_glass_shard.webp | r410/mobs/m018.webp 100% |
| ep1b04 | b03-g1 | 질투로 얼룩진 망령 | episode1b/envy_glass_shard.webp | r380/mobs/jealousy-wraith-v1.webp 100% |
| ep1b04 | b03-g2 | 유리 망령 | episode1b/envy_glass_shard.webp | r410/mobs/m018.webp 100% |
| ep1b04 | b03-g2 | 추녀의 한탄 | episode1b/envy_glass_shard.webp | r380/mobs/mirror-lament-v1.webp 100% |
| ep1b04 | b04-b1 | 살아 있는 거대한 위장 | episode1b/generated-v394/glutton_beelzebub.webp | r198/mobs/M024-idle.png 83%, r92/mobs/M024-attack.png 14%, episode1b/generated-v394/glutton_beelzebub.webp 3% |
| ep1b04 | b04-b1 | 유리 망령 | episode1b/generated-v394/glutton_beelzebub.webp | r410/mobs/m018.webp 100% |
| ep1b04 | b04-g1 | 버려진 최고급 식재료 | episode1b/generated-v394/glutton_kitchen_scrap.webp | r380/mobs/discarded-delicacy-v1.webp 100% |
| ep1b04 | b04-g1 | 유리 망령 | episode1b/generated-v394/glutton_kitchen_scrap.webp | r410/mobs/m018.webp 100% |
| ep1b04 | b04-s1 | 끓어오르는 검은 소화액 | episode1b/generated-v394/glutton_kitchen_scrap.webp | r290/mobs/m025.webp 100% |
| ep1b04 | b04-s1 | 유리 망령 | episode1b/generated-v394/glutton_kitchen_scrap.webp | r410/mobs/m018.webp 100% |
| ep1b04 | mb-ep1b03 | 금이 간 비교잔영 (중간보스) | generated-v31224/actors-normalized/094c62d396f7_cracked_comparison_echo.webp | assets/r974/move/mb-ep1b03-side.webp 60%, r104/bosses/mb-ep1b03-p4.webp 40% |
| ep1b04 | mb-ep1b04 | 폐기주방 감독 (중간보스) | generated-v31224/actors-normalized/947dfea12b7e_discarded_kitchen_overseer.webp | assets/r974/move/mb-ep1b04-side.webp 57%, r104/bosses/mb-ep1b04-p4.webp 24%, assets/r974/move/mb-ep1b04-down.webp 15% |
| ep1b09 | b04-b1 | 살아 있는 거대한 위장 | episode1b/generated-v394/glutton_beelzebub.webp | r198/mobs/M024-idle.png 91%, r92/mobs/M024-attack.png 9% |
| ep1b09 | b04-b1 | 유리 망령 | episode1b/generated-v394/glutton_beelzebub.webp | r410/mobs/m018.webp 100% |
| ep1b09 | b04-g1 | 버려진 최고급 식재료 | episode1b/generated-v394/glutton_kitchen_scrap.webp | r380/mobs/discarded-delicacy-v1.webp 100% |
| ep1b09 | b04-g1 | 유리 망령 | episode1b/generated-v394/glutton_kitchen_scrap.webp | r410/mobs/m018.webp 100% |
| ep1b09 | b04-s1 | 끓어오르는 검은 소화액 | episode1b/generated-v394/glutton_kitchen_scrap.webp | r290/mobs/m025.webp 100% |
| ep1b09 | b04-s1 | 유리 망령 | episode1b/generated-v394/glutton_kitchen_scrap.webp | r410/mobs/m018.webp 100% |
| ep1b09 | b09-c1 | 설원 잠복 보행기 | episode1b/generated-v394/polar_chairman.webp | r380/mobs/snow-lurker-walker-v1.webp 100% |
| ep1b09 | b09-c1 | 태엽 수집자 | episode1b/generated-v394/polar_chairman.webp | r410/mobs/m033.webp 100% |
| ep1b09 | b09-h1 | 강철 턱의 사이보그 개 | episode1b/generated-v394/polar_cyborg_hound.webp | r380/mobs/ep1b-steel-jaw-hound-walk-d1.webp 100% |
| ep1b09 | b09-h1 | 태엽 수집자 | episode1b/generated-v394/polar_cyborg_hound.webp | r410/mobs/m033.webp 100% |
| ep1b09 | b09-o1 | 걸어다니는 소형 로봇 | episode1b/generated-v394/seal_residual.webp | r380/mobs/small-walking-robot-v1.webp 100% |
| ep1b09 | b09-o1 | 태엽 수집자 | episode1b/generated-v394/seal_residual.webp | r410/mobs/m033.webp 100% |
| ep1b09 | mb-ep1b04 | 폐기주방 감독 (중간보스) | generated-v31224/actors-normalized/947dfea12b7e_discarded_kitchen_overseer.webp | r104/bosses/mb-ep1b04-p1.webp 100% |
| ep1b09 | mb-ep1b09 | 생체부트로더 연산핵 (중간보스) | generated-v31224/actors-normalized/81909f0b3692_ascension_calculation_orb.webp | assets/r974/move/mb-ep1b09-side.webp 78%, r104/bosses/mb-ep1b09-p4.webp 16%, r104/bosses/mb-ep1b09-p2.webp 4% |
| cult02 | b09-c1 | 설원 잠복 보행기 | episode1b/generated-v394/polar_chairman.webp | r380/mobs/snow-lurker-walker-v1.webp 100% |
| cult02 | b09-c1 | 태엽 수집자 | episode1b/generated-v394/polar_chairman.webp | r410/mobs/m033.webp 100% |
| cult02 | b09-h1 | 강철 턱의 사이보그 개 | episode1b/generated-v394/polar_cyborg_hound.webp | r380/mobs/ep1b-steel-jaw-hound-walk-d1.webp 100% |
| cult02 | b09-h1 | 태엽 수집자 | episode1b/generated-v394/polar_cyborg_hound.webp | r410/mobs/m033.webp 100% |
| cult02 | b09-o1 | 걸어다니는 소형 로봇 | episode1b/generated-v394/seal_residual.webp | r380/mobs/small-walking-robot-v1.webp 100% |
| cult02 | b09-o1 | 태엽 수집자 | episode1b/generated-v394/seal_residual.webp | r410/mobs/m033.webp 100% |
| cult02 | c102-e1 | 기계화 제8단계 자비 교정관 | cult-v3123/black_robed_nightmare_demon.webp | assets/r974/move/u202-mid-side.webp 63%, generated-v31224/actors-normalized/8e86a4cadfc7_u2_mirror_priest.webp 16%, assets/r974/move/u202-mid-down.webp 10% |
| cult02 | c102-e1 | 신경 케이블 포식체 | cult-v3123/black_robed_nightmare_demon.webp | r380/mobs/cult-nerve-cable-devourer-walk-d1.webp 95%, cult-v3123/black_robed_nightmare_demon.webp 5% |
| cult02 | c102-e2 | 기계화 제8단계 자비 교정관 | cult-v3123/black_rose_crystal_guardian.webp | assets/r974/move/u202-mid-side.webp 62%, r104/bosses/u202-mid-p4.webp 17%, generated-v31224/actors-normalized/8e86a4cadfc7_u2_mirror_priest.webp 11% |
| cult02 | c102-e2 | 합일 주파수 결정 | cult-v3123/black_rose_crystal_guardian.webp | cult-v3123/black_rose_crystal_guardian.webp 100% |
| cult02 | c102-e3 | 과열 시냅스 점액체 | cult-v3123/angry_green_slime.webp | r92/mobs/M131-move.png 87%, r116/mobs/M131-idle.png 13%, cult-v3123/angry_green_slime.webp 0% |
| cult02 | c102-e3 | 기계화 제8단계 자비 교정관 | cult-v3123/angry_green_slime.webp | assets/r974/move/u202-mid-side.webp 72%, generated-v31224/actors-normalized/8e86a4cadfc7_u2_mirror_priest.webp 14%, assets/r974/move/u202-mid-up.webp 7% |
| cult02 | mb-ep1b09 | 생체부트로더 연산핵 (중간보스) | generated-v31224/actors-normalized/81909f0b3692_ascension_calculation_orb.webp | assets/r974/move/mb-ep1b09-down.webp 87%, r104/bosses/mb-ep1b09-p4.webp 13% |
| cult03 | c102-e1 | 기계화 제8단계 자비 교정관 | cult-v3123/black_robed_nightmare_demon.webp | assets/r974/move/u202-mid-side.webp 100% |
| cult03 | c102-e1 | 신경 케이블 포식체 | cult-v3123/black_robed_nightmare_demon.webp | r380/mobs/cult-nerve-cable-devourer-walk-d1.webp 92%, cult-v3123/black_robed_nightmare_demon.webp 8% |
| cult03 | c102-e2 | 기계화 제8단계 자비 교정관 | cult-v3123/black_rose_crystal_guardian.webp | generated-v31224/actors-normalized/8e86a4cadfc7_u2_mirror_priest.webp 100% |
| cult03 | c102-e2 | 합일 주파수 결정 | cult-v3123/black_rose_crystal_guardian.webp | cult-v3123/black_rose_crystal_guardian.webp 100% |
| cult03 | c102-e3 | 과열 시냅스 점액체 | cult-v3123/angry_green_slime.webp | r92/mobs/M131-move.png 75%, r116/mobs/M131-idle.png 25% |
| cult03 | c102-e3 | 기계화 제8단계 자비 교정관 | cult-v3123/angry_green_slime.webp | generated-v31224/actors-normalized/8e86a4cadfc7_u2_mirror_priest.webp 100% |
| cult03 | c103-e1 | EGO 구속 연결자 | cult-v3123/black_rose_chip_penitent.webp | r380/mobs/cult-ego-binder-walk-d1.webp 94%, cult-v3123/black_rose_chip_penitent.webp 6% |
| cult03 | c103-e1 | 이동문 청람잔영 | cult-v3123/black_rose_chip_penitent.webp | r410/mobs/m040.webp 100% |
| cult03 | c103-e1 | 최종문 공명기사 | cult-v3123/black_rose_chip_penitent.webp | r374/mobs/u203-e3-mech.webp 100% |
| cult03 | c103-e2 | SUPER EGO 절개결정 | cult-v3123/black_rose_crystal_guardian.webp | r290/mobs/m059.webp 100% |
| cult03 | c103-e2 | 이동문 공허잔영 | cult-v3123/black_rose_crystal_guardian.webp | r374/mobs/u203-e2-mech.webp 100% |
| cult03 | c103-e3 | ID 잔류 점액체 | cult-v3123/angry_green_slime.webp | r410/mobs/m060.webp 100% |
| cult03 | c103-e3 | 최종문 공명기사 | cult-v3123/angry_green_slime.webp | r374/mobs/u203-e3-mech.webp 100% |
| cult04 | c103-e1 | EGO 구속 연결자 | cult-v3123/black_rose_chip_penitent.webp | r380/mobs/cult-ego-binder-walk-d1.webp 100% |
| cult04 | c103-e1 | 이동문 청람잔영 | cult-v3123/black_rose_chip_penitent.webp | r410/mobs/m040.webp 100% |
| cult04 | c103-e1 | 최종문 공명기사 | cult-v3123/black_rose_chip_penitent.webp | r374/mobs/u203-e3-mech.webp 100% |
| cult04 | c103-e2 | SUPER EGO 절개결정 | cult-v3123/black_rose_crystal_guardian.webp | r290/mobs/m059.webp 100% |
| cult04 | c103-e2 | 이동문 공허잔영 | cult-v3123/black_rose_crystal_guardian.webp | r374/mobs/u203-e2-mech.webp 100% |
| cult04 | c103-e3 | ID 잔류 점액체 | cult-v3123/angry_green_slime.webp | r410/mobs/m060.webp 100% |
| cult04 | c103-e3 | 최종문 공명기사 | cult-v3123/angry_green_slime.webp | r374/mobs/u203-e3-mech.webp 100% |
| cult04 | c104-e1 | 소환좌 칩 수호체 | cult-v3123/pride_cyborg_cult_leader.webp | r109/mobs/M137-move.png 70%, cult-v3123/pride_cyborg_cult_leader.webp 30% |
| cult04 | c104-e1 | 태엽 수집자 | cult-v3123/pride_cyborg_cult_leader.webp | r410/mobs/m033.webp 100% |
| cult04 | c104-e2 | 아마겟돈 계산결정 | cult-v3123/black_rose_crystal_guardian.webp | r290/mobs/m061.webp 100% |
| cult04 | c104-e2 | 태엽 수집자 | cult-v3123/black_rose_crystal_guardian.webp | r410/mobs/m033.webp 100% |
| cult04 | c104-mid | 적그리스도 배양좌 (중간보스) | generated-v31224/actors-normalized/b78f35cef818_six_legged_cyborg_lord_final.webp | rc140/story-cycle-motions/c104-mid.png 100% |
| cult05 | c104-e1 | 소환좌 칩 수호체 | cult-v3123/pride_cyborg_cult_leader.webp | r109/mobs/M137-move.png 70%, cult-v3123/pride_cyborg_cult_leader.webp 30% |
| cult05 | c104-e1 | 태엽 수집자 | cult-v3123/pride_cyborg_cult_leader.webp | r410/mobs/m033.webp 100% |
| cult05 | c104-e2 | 아마겟돈 계산결정 | cult-v3123/black_rose_crystal_guardian.webp | r290/mobs/m061.webp 100% |
| cult05 | c104-e2 | 태엽 수집자 | cult-v3123/black_rose_crystal_guardian.webp | r410/mobs/m033.webp 100% |
| cult05 | c104-mid | 적그리스도 배양좌 (중간보스) | generated-v31224/actors-normalized/b78f35cef818_six_legged_cyborg_lord_final.webp | rc140/story-cycle-motions/c104-mid.png 100% |
| cult05 | c105-e1 | ID 배양 점액체 | cult-v3123/green_enemy_slime.webp | r380/mobs/legacy-m130-slime-cult05-v2.webp 91%, r410/mobs/m056.webp 9% |
| cult05 | c105-e1 | 설원 아래의 기계 다리 | cult-v3123/green_enemy_slime.webp | r380/mobs/cult-mech-legs-walk-d1.webp 100% |
| cult05 | c105-e2 | 생체기계 악몽 | cult-v3123/black_rose_demon_soldier.webp | r380/mobs/legacy-m134-nightmare-v4-walk-d1.webp 100% |
| cult05 | c105-e2 | 설원 아래의 기계 다리 | cult-v3123/black_rose_demon_soldier.webp | r380/mobs/cult-mech-legs-walk-d1.webp 100% |
| cult05 | c105-e3 | 본능 추출 결정 | cult-v3123/black_rose_crystal_guardian.webp | r290/mobs/m057.webp 100% |
| cult05 | c105-e3 | 설원 아래의 기계 다리 | cult-v3123/black_rose_crystal_guardian.webp | r380/mobs/cult-mech-legs-walk-d1.webp 100% |
| cult05 | c105-mid | ID 생체조 관리자 (중간보스) | generated-v31224/actors-normalized/57967d1070df_black_ritual_cyborg_boss.webp | rc140/story-cycle-motions/c105-mid.png 100% |
| cult06 | c105-e1 | ID 배양 점액체 | cult-v3123/green_enemy_slime.webp | r380/mobs/legacy-m130-slime-cult05-v2.webp 90%, r410/mobs/m056.webp 10% |
| cult06 | c105-e1 | 설원 아래의 기계 다리 | cult-v3123/green_enemy_slime.webp | r380/mobs/cult-mech-legs-walk-d1.webp 100% |
| cult06 | c105-e2 | 생체기계 악몽 | cult-v3123/black_rose_demon_soldier.webp | r380/mobs/legacy-m134-nightmare-v4-walk-d1.webp 100% |
| cult06 | c105-e2 | 설원 아래의 기계 다리 | cult-v3123/black_rose_demon_soldier.webp | r380/mobs/cult-mech-legs-walk-d1.webp 100% |
| cult06 | c105-e3 | 본능 추출 결정 | cult-v3123/black_rose_crystal_guardian.webp | r290/mobs/m057.webp 100% |
| cult06 | c105-e3 | 설원 아래의 기계 다리 | cult-v3123/black_rose_crystal_guardian.webp | r380/mobs/cult-mech-legs-walk-d1.webp 100% |
| cult06 | c105-mid | ID 생체조 관리자 (중간보스) | generated-v31224/actors-normalized/57967d1070df_black_ritual_cyborg_boss.webp | rc140/story-cycle-motions/c105-mid.png 100% |
| cult06 | c106-e1 | SUPER EGO 판결인장 | cult-v3123/superego_cyborg_cult_leader.webp | r92/mobs/M135-move.png 94%, cult-v3123/superego_cyborg_cult_leader.webp 6% |
| cult06 | c106-e1 | 태엽 수집자 | cult-v3123/superego_cyborg_cult_leader.webp | r410/mobs/m033.webp 100% |
| cult06 | c106-e2 | 기계재판 연결자 | cult-v3123/black_robed_nightmare_demon.webp | r275/mobs/superego-inquisitor.webp 100% |
| cult06 | c106-e2 | 태엽 수집자 | cult-v3123/black_robed_nightmare_demon.webp | r410/mobs/m033.webp 100% |
| cult06 | c106-e3 | 죄책감 압축결정 | cult-v3123/black_rose_crystal_guardian.webp | r290/mobs/m058.webp 100% |
| cult06 | c106-e3 | 태엽 수집자 | cult-v3123/black_rose_crystal_guardian.webp | r410/mobs/m033.webp 100% |
| cult06 | c106-mid | 기계재판 집행핵 (중간보스) | generated-v31224/actors-normalized/a000c91070d3_final_pride_cyborg_lord.webp | rc140/story-cycle-motions/c106-mid.png 100% |
| hando02 | c106-e1 | SUPER EGO 판결인장 | cult-v3123/superego_cyborg_cult_leader.webp | r92/mobs/M135-move.png 100% |
| hando02 | c106-e1 | 태엽 수집자 | cult-v3123/superego_cyborg_cult_leader.webp | r410/mobs/m033.webp 100% |
| hando02 | c106-e2 | 기계재판 연결자 | cult-v3123/black_robed_nightmare_demon.webp | r275/mobs/superego-inquisitor.webp 100% |
| hando02 | c106-e2 | 태엽 수집자 | cult-v3123/black_robed_nightmare_demon.webp | r410/mobs/m033.webp 100% |
| hando02 | c106-e3 | 죄책감 압축결정 | cult-v3123/black_rose_crystal_guardian.webp | r290/mobs/m058.webp 100% |
| hando02 | c106-e3 | 태엽 수집자 | cult-v3123/black_rose_crystal_guardian.webp | r410/mobs/m033.webp 100% |
| hando02 | c106-mid | 기계재판 집행핵 (중간보스) | generated-v31224/actors-normalized/a000c91070d3_final_pride_cyborg_lord.webp | rc140/story-cycle-motions/c106-mid.png 100% |
| hando02 | h102-c1 | 기억절제 연결자 | hando-v3123/memory_excision_connector.webp | r380/mobs/hando-memory-excision-connector-walk-d1.webp 100% |
| hando02 | h102-c1 | 이동문 공허잔영 | hando-v3123/memory_excision_connector.webp | r374/mobs/u203-e2-mech.webp 100% |
| hando02 | h102-s1 | 붕괴선 파수병 | hando-v3123/silver_seal_sentinel.webp | r380/mobs/hando-silver-seal-sentinel-walk-d1.webp 100% |
| hando02 | h102-s1 | 이동문 공허잔영 | hando-v3123/silver_seal_sentinel.webp | r374/mobs/u203-e2-mech.webp 100% |
| hando02 | h102-s2 | 코어 운반 집행자 | hando-v3123/order_seal_officer.webp | hando-v3123/order_seal_officer.webp 100% |
| hando02 | h102-t1 | 무명 검흔 | hando-v3123/nameless_sword_trace.webp | r380/mobs/legacy-m119-nameless-scar-v4-walk-d1.webp 100% |
| hando02 | mb-hando02 | 코어 운반 집행자 (중간보스) | generated-v31224/actors-normalized/458e99f2058e_order_seal_officer.webp | assets/r974/move/mb-hando02-side.webp 94%, r104/bosses/mb-hando02-p4.webp 5%, rc140/story-cycle-motions/mb-hando02.png 1% |
| u203 | h102-c1 | 기억절제 연결자 | hando-v3123/memory_excision_connector.webp | r380/mobs/hando-memory-excision-connector-walk-d1.webp 100% |
| u203 | h102-c1 | 이동문 공허잔영 | hando-v3123/memory_excision_connector.webp | r374/mobs/u203-e2-mech.webp 100% |
| u203 | h102-s1 | 붕괴선 파수병 | hando-v3123/silver_seal_sentinel.webp | r380/mobs/hando-silver-seal-sentinel-walk-d1.webp 100% |
| u203 | h102-s1 | 이동문 공허잔영 | hando-v3123/silver_seal_sentinel.webp | r374/mobs/u203-e2-mech.webp 100% |
| u203 | h102-s2 | 코어 운반 집행자 | hando-v3123/order_seal_officer.webp | hando-v3123/order_seal_officer.webp 100% |
| u203 | h102-t1 | 무명 검흔 | hando-v3123/nameless_sword_trace.webp | r380/mobs/legacy-m119-nameless-scar-v4-walk-d1.webp 100% |
| u203 | mb-hando02 | 코어 운반 집행자 (중간보스) | generated-v31224/actors-normalized/458e99f2058e_order_seal_officer.webp | assets/r974/move/mb-hando02-down.webp 96%, r104/bosses/mb-hando02-p4.webp 4% |
| u203 | u203-e1 | 이동문 청람잔영 | u2/generated-v350/u2_blue_wraith.webp | r410/mobs/m040.webp 100% |
| u203 | u203-e1 | 태엽 수집자 | u2/generated-v350/u2_blue_wraith.webp | r410/mobs/m033.webp 100% |
| u203 | u203-e2 | 이동문 공허잔영 | u2/generated-v350/u2_void_wraith.webp | r374/mobs/u203-e2-mech.webp 100% |
| u203 | u203-e2 | 태엽 수집자 | u2/generated-v350/u2_void_wraith.webp | r410/mobs/m033.webp 100% |
| u203 | u203-e3 | 최종문 공명기사 | u2/generated-v350/u2_resonance_knight.webp | r374/mobs/u203-e3-mech.webp 100% |
| u203 | u203-e3 | 태엽 수집자 | u2/generated-v350/u2_resonance_knight.webp | r410/mobs/m033.webp 100% |
| u203 | u203-mid | 기억의 문 수호 프레임 (중간보스) | generated-v31224/actors-normalized/85f150dbf0f7_controller_guardian.webp | assets/r974/move/u203-mid-side.webp 82%, rc140/story-cycle-motions/u203-mid.png 10%, assets/r974/move/u203-mid-down.webp 8% |
| dist00 | a11-c1 | 뿌리 추적자 | episode1a/corrupted_guardian.webp | r74/monsters.png 100% |
| dist00 | a11-c1 | 뿌리에 묶인 근위의 기억 | episode1a/corrupted_guardian.webp | r290/mobs/m001.webp 100% |
| dist00 | a11-c1 | 악마화 나무의 침식 근위 | episode1a/corrupted_guardian.webp | r275/mobs/root-bound-ghoul.webp 100% |
| dist00 | dist02-g1 | 뿌리 추적자 | episode1a/corrupted_guardian.webp | r380/mobs/root-stalker-r74-plain-walk-d1.webp 100% |
| dist00 | u203-e1 | 이동문 청람잔영 | u2/generated-v350/u2_blue_wraith.webp | r410/mobs/m040.webp 100% |
| dist00 | u203-e1 | 태엽 수집자 | u2/generated-v350/u2_blue_wraith.webp | r410/mobs/m033.webp 100% |
| dist00 | u203-e2 | 이동문 공허잔영 | u2/generated-v350/u2_void_wraith.webp | r374/mobs/u203-e2-mech.webp 100% |
| dist00 | u203-e2 | 태엽 수집자 | u2/generated-v350/u2_void_wraith.webp | r410/mobs/m033.webp 100% |
| dist00 | u203-e3 | 최종문 공명기사 | u2/generated-v350/u2_resonance_knight.webp | r374/mobs/u203-e3-mech.webp 100% |
| dist00 | u203-e3 | 태엽 수집자 | u2/generated-v350/u2_resonance_knight.webp | r410/mobs/m033.webp 100% |
| dist00 | u203-mid | 기억의 문 수호 프레임 (중간보스) | generated-v31224/actors-normalized/85f150dbf0f7_controller_guardian.webp | rc140/story-cycle-motions/u203-mid.png 100% |
| dist01 | a11-c1 | 뿌리 추적자 | episode1a/corrupted_guardian.webp | r74/monsters.png 100% |
| dist01 | a11-c1 | 뿌리에 묶인 근위의 기억 | episode1a/corrupted_guardian.webp | r290/mobs/m001.webp 100% |
| dist01 | a11-c1 | 악마화 나무의 침식 근위 | episode1a/corrupted_guardian.webp | r275/mobs/root-bound-ghoul.webp 100% |
| dist01 | dist01-s1 | 거미줄에 묶인 수호병 | dist/skeleton.png | r380/mobs/web-bound-guardian-v4.webp 100% |
| dist01 | dist01-s1 | 재 나방 | dist/skeleton.png | r74/monsters.png 100% |
| dist01 | dist01-sp1 | 거미줄에 묶인 수호병 | episode1a/nightmare_spider.webp | r380/mobs/web-bound-guardian-v4.webp 100% |
| dist01 | dist01-sp1 | 기억 운반거미 | episode1a/nightmare_spider.webp | r290/mobs/m005.webp 100% |
| dist01 | dist01-sp1 | 보랏빛 알집지기 | episode1a/nightmare_spider.webp | r380/mobs/purple-eggkeeper-v1.webp 100% |
| dist01 | dist01-sp1 | 재 나방 | episode1a/nightmare_spider.webp | r74/monsters.png 68%, r380/mobs/ash-moth-v2.webp 32% |
| dist01 | dist01-sp1 | 진흙등 거미 | episode1a/nightmare_spider.webp | r290/mobs/m003.webp 100% |
| dist01 | dist01-sp2 | 보랏빛 알집지기 | episode1a/nightmare_spider.webp | r380/mobs/purple-eggkeeper-v1.webp 100% |
| dist01 | dist01-sp2 | 재 나방 | episode1a/nightmare_spider.webp | r74/monsters.png 100% |
| dist01 | dist02-g1 | 뿌리 추적자 | episode1a/corrupted_guardian.webp | r380/mobs/root-stalker-r74-plain-walk-d1.webp 100% |
| dist01 | mb-dist01 | 보라검천사 (중간보스) | generated-v31224/actors-normalized/6998402eb8e7_purple_sword_spider_angel.webp | assets/r974/move/mb-dist01-side.webp 83%, r104/bosses/mb-dist01-p4.webp 6%, r104/bosses/mb-dist01-p2.webp 4% |
| dist02 | dist01-s1 | 거미줄에 묶인 수호병 | dist/skeleton.png | r380/mobs/web-bound-guardian-v4.webp 100% |
| dist02 | dist01-s1 | 재 나방 | dist/skeleton.png | r74/monsters.png 100% |
| dist02 | dist01-sp1 | 거미줄에 묶인 수호병 | episode1a/nightmare_spider.webp | r380/mobs/web-bound-guardian-v4.webp 100% |
| dist02 | dist01-sp1 | 기억 운반거미 | episode1a/nightmare_spider.webp | r290/mobs/m005.webp 100% |
| dist02 | dist01-sp1 | 보랏빛 알집지기 | episode1a/nightmare_spider.webp | r380/mobs/purple-eggkeeper-v1.webp 100% |
| dist02 | dist01-sp1 | 재 나방 | episode1a/nightmare_spider.webp | r74/monsters.png 75%, r380/mobs/ash-moth-v2.webp 25% |
| dist02 | dist01-sp1 | 진흙등 거미 | episode1a/nightmare_spider.webp | r290/mobs/m003.webp 100% |
| dist02 | dist01-sp2 | 보랏빛 알집지기 | episode1a/nightmare_spider.webp | r380/mobs/purple-eggkeeper-v1.webp 100% |
| dist02 | dist01-sp2 | 재 나방 | episode1a/nightmare_spider.webp | r74/monsters.png 100% |
| dist02 | dist02-g1 | 늪 뿌리 추적자 | episode1a/corrupted_guardian.webp | r380/mobs/swamp-root-stalker-darkgreen-v2-walk-d1.webp 100% |
| dist02 | dist02-g1 | 늪에서 되살아난 혼령체 | episode1a/corrupted_guardian.webp | r380/mobs/swamp-spirit-v1.webp 100% |
| dist02 | dist02-h1 | 늪 뿌리 추적자 | episode1a/generated-v31342-rc39/goat_head_demon_mob_bloodied.webp | r380/mobs/swamp-root-stalker-darkgreen-v2-walk-d1.webp 100% |
| dist02 | dist02-h1 | 늪의 염소머리 악마 | episode1a/generated-v31342-rc39/goat_head_demon_mob_bloodied.webp | r380/mobs/swamp-goat-darkgreen-v1.webp 100% |
| dist02 | dist02-m1 | 늪 뿌리 추적자 | dist/cult_mage.png | r380/mobs/swamp-root-stalker-darkgreen-v2-walk-d1.webp 100% |
| dist02 | dist02-m1 | 수렁 주문사 | dist/cult_mage.png | r380/mobs/swamp-mage-darkgreen-v1.webp 100% |
| dist02 | dist02-sp1 | 늪 뿌리 추적자 | episode1a/nightmare_spider.webp | r380/mobs/swamp-root-stalker-darkgreen-v2-walk-d1.webp 100% |
| dist02 | dist02-sp1 | 늪에서 되살아난 혼령체 | episode1a/nightmare_spider.webp | r380/mobs/swamp-spirit-v1.webp 100% |
| dist02 | mb-dist01 | 보라검천사 (중간보스) | generated-v31224/actors-normalized/6998402eb8e7_purple_sword_spider_angel.webp | r104/bosses/mb-dist01-p4.webp 100% |
| dist02 | mb-dist02 | 늪의 뿔악마 군주 (중간보스) | generated-v31224/actors-normalized/5168d3dce2f0_horned_swamp_demon.webp | r104/bosses/mb-dist02-p4.webp 94%, r104/bosses/mb-dist02-p2.webp 6% |
| dist03 | dist02-g1 | 늪 뿌리 추적자 | episode1a/corrupted_guardian.webp | r380/mobs/swamp-root-stalker-darkgreen-v2-walk-d1.webp 100% |
| dist03 | dist02-g1 | 늪에서 되살아난 혼령체 | episode1a/corrupted_guardian.webp | r380/mobs/swamp-spirit-v1.webp 100% |
| dist03 | dist02-h1 | 늪 뿌리 추적자 | episode1a/generated-v31342-rc39/goat_head_demon_mob_bloodied.webp | r380/mobs/swamp-root-stalker-darkgreen-v2-walk-d1.webp 100% |
| dist03 | dist02-h1 | 늪의 염소머리 악마 | episode1a/generated-v31342-rc39/goat_head_demon_mob_bloodied.webp | r380/mobs/swamp-goat-darkgreen-v1.webp 100% |
| dist03 | dist02-m1 | 늪 뿌리 추적자 | dist/cult_mage.png | r380/mobs/swamp-root-stalker-darkgreen-v2-walk-d1.webp 100% |
| dist03 | dist02-m1 | 수렁 주문사 | dist/cult_mage.png | r380/mobs/swamp-mage-darkgreen-v1.webp 100% |
| dist03 | dist02-sp1 | 늪 뿌리 추적자 | episode1a/nightmare_spider.webp | r380/mobs/swamp-root-stalker-darkgreen-v2-walk-d1.webp 100% |
| dist03 | dist02-sp1 | 늪에서 되살아난 혼령체 | episode1a/nightmare_spider.webp | r380/mobs/swamp-spirit-v1.webp 100% |
| dist03 | dist03-c1 | 보라검 추격천사 | episode1a/corrupted_guardian.webp | r290/mobs/m004.webp 100% |
| dist03 | dist03-g1 | 피냄새 추적자 | dist/ghoul.png | r275/mobs/ember-hound.webp 100% |
| dist03 | dist03-s1 | 피냄새 추적자 | dist/skeleton.png | r275/mobs/ember-hound.webp 100% |
| dist03 | dist03-sp1 | 피냄새 추적자 | episode1a/nightmare_spider.webp | r275/mobs/ember-hound.webp 100% |
| dist03 | mb-dist02 | 늪의 뿔악마 군주 (중간보스) | generated-v31224/actors-normalized/5168d3dce2f0_horned_swamp_demon.webp | r104/bosses/mb-dist02-p4.webp 100% |
| dist03 | mb-dist03 | 핏빛 수호로 추격자 (중간보스) | generated-v31224/actors-normalized/693a5923c4c1_dist_blood_guardian_pursuer.webp | r104/bosses/mb-dist03-p4.webp 96%, r104/bosses/mb-dist03-p2.webp 4% |
| dist04 | dist03-c1 | 보라검 추격천사 | episode1a/corrupted_guardian.webp | r290/mobs/m004.webp 100% |
| dist04 | dist03-g1 | 피냄새 추적자 | dist/ghoul.png | r275/mobs/ember-hound.webp 100% |
| dist04 | dist03-s1 | 피냄새 추적자 | dist/skeleton.png | r275/mobs/ember-hound.webp 100% |
| dist04 | dist03-sp1 | 피냄새 추적자 | episode1a/nightmare_spider.webp | r275/mobs/ember-hound.webp 100% |
| dist04 | dist04-c1 | 되살아난 방패동료 | episode1a/corrupted_guardian.webp | r380/mobs/reborn-shieldmate-v4.webp 100% |
| dist04 | dist04-c2 | 되살아난 수호기사 | episode1a/corrupted_guardian.webp | episode1b/generated-v31342-rc39/zombie_guardian_knight_bloodied.webp 96%, rc137/mob-attacks-03.png 4% |
| dist04 | dist04-g1 | 피로 꿰맨 전령 | dist/ghoul.png | r275/mobs/twin-head-corpse.webp 100% |
| dist04 | dist04-s1 | 이름 잃은 전우 | dist/skeleton.png | r410/mobs/m007.webp 100% |
| dist04 | mb-dist03 | 핏빛 수호로 추격자 (중간보스) | generated-v31224/actors-normalized/693a5923c4c1_dist_blood_guardian_pursuer.webp | r104/bosses/mb-dist03-p4.webp 100% |
| dist04 | mb-dist04 | 첫 동료의 악마잔영 (중간보스) | generated-v31224/actors-normalized/42daad5a3557_dist_fallen_comrade_demon_echo.webp | assets/r974/move/mb-dist04-side.webp 69%, r104/bosses/mb-dist04-p4.webp 17%, assets/r974/move/mb-dist04-down.webp 5% |
| dist06 | dist04-c1 | 되살아난 방패동료 | episode1a/corrupted_guardian.webp | r380/mobs/reborn-shieldmate-v4.webp 100% |
| dist06 | dist04-c2 | 되살아난 수호기사 | episode1a/corrupted_guardian.webp | episode1b/generated-v31342-rc39/zombie_guardian_knight_bloodied.webp 97%, rc137/mob-attacks-03.png 3% |
| dist06 | dist04-g1 | 피로 꿰맨 전령 | dist/ghoul.png | r275/mobs/twin-head-corpse.webp 100% |
| dist06 | dist04-s1 | 이름 잃은 전우 | dist/skeleton.png | r410/mobs/m007.webp 100% |
| dist06 | dist06-c1 | 소환진 타락천사 | episode1a/corrupted_guardian.webp | r410/mobs/m013.webp 100% |
| dist06 | dist06-h1 | 지옥문 파수악마 | episode1a/horned_swamp_demon.webp | r410/mobs/m011.webp 100% |
| dist06 | dist06-m1 | 검은기둥 주문사 | dist/cult_mage.png | r410/mobs/m009.webp 100% |
| dist06 | mb-dist04 | 첫 동료의 악마잔영 (중간보스) | generated-v31224/actors-normalized/42daad5a3557_dist_fallen_comrade_demon_echo.webp | assets/r974/move/mb-dist04-side.webp 97%, r104/bosses/mb-dist04-p4.webp 3% |
| dist06 | mb-dist06 | 소환진 검은기둥 (중간보스) | generated-v31224/actors-normalized/be8d2dfe3789_dist_summoning_black_pillar.webp | r104/bosses/mb-dist06-p4.webp 96%, r104/bosses/mb-dist06-p2.webp 4% |
| ep1a08 | a08-c1 | 격리실 감염 의료인 | episode1a/corrupted_guardian.webp | r290/mobs/m014.webp 100% |
| ep1a08 | a08-c1 | 소독등 타락천사 | episode1a/corrupted_guardian.webp | r410/mobs/m016.webp 100% |
| ep1a08 | a08-o1 | 백의 구속자 | episode1a/hallucinated_orderly.webp | visual-test/hospital-orderly-motion-r51-v2.png 96%, episode1a/hallucinated_orderly.webp 4% |
| ep1a08 | a08-o2 | 안정화 집행체 | episode1a/hallucinated_orderly.webp | r410/mobs/m015.webp 100% |
| ep1a08 | a08-s1 | 복도 비명잔영 | episode1a/generated-v392/corridor_scream_echo.webp | visual-test/hospital-ranged-motion-r52.png 93%, visual-test/hospital-ranged-back-r53.png 7%, episode1a/generated-v392/corridor_scream_echo.webp 0% |
| ep1a08 | dist06-c1 | 소환진 타락천사 | episode1a/corrupted_guardian.webp | r410/mobs/m013.webp 100% |
| ep1a08 | dist06-h1 | 지옥문 파수악마 | episode1a/horned_swamp_demon.webp | r410/mobs/m011.webp 100% |
| ep1a08 | dist06-m1 | 검은기둥 주문사 | dist/cult_mage.png | r410/mobs/m009.webp 100% |
| ep1a08 | mb-dist06 | 소환진 검은기둥 (중간보스) | generated-v31224/actors-normalized/be8d2dfe3789_dist_summoning_black_pillar.webp | r104/bosses/mb-dist06-p4.webp 100% |
| ep1a08 | mb-ep1a08 | 백의 안정화 감독 (중간보스) | generated-v31224/actors-normalized/c386e08b76cf_ep1a_stabilization_supervisor.webp | visual-test/hospital-boss-motion-r53.png 100% |
| ep1a09 | a08-c1 | 격리실 감염 의료인 | episode1a/corrupted_guardian.webp | r290/mobs/m014.webp 100% |
| ep1a09 | a08-c1 | 소독등 타락천사 | episode1a/corrupted_guardian.webp | r410/mobs/m016.webp 100% |
| ep1a09 | a08-o1 | 백의 구속자 | episode1a/hallucinated_orderly.webp | visual-test/hospital-orderly-motion-r51-v2.png 100% |
| ep1a09 | a08-o2 | 안정화 집행체 | episode1a/hallucinated_orderly.webp | r410/mobs/m015.webp 100% |
| ep1a09 | a08-s1 | 복도 비명잔영 | episode1a/generated-v392/corridor_scream_echo.webp | visual-test/hospital-ranged-motion-r52.png 89%, visual-test/hospital-ranged-back-r53.png 11% |
| ep1a09 | a09-o1 | 오만의 흰 가면 | episode1a/hallucinated_orderly.webp | r92/mobs/M012-move.png 100% |
| ep1a09 | a09-o1 | 주사실 감시환각 | episode1a/hallucinated_orderly.webp | r275/mobs/thread-nurse.webp 100%, r223/mobs/thread-nurse.webp 0% |
| ep1a09 | a09-v1 | 갈망의 약병핵 | episode1a/generated-v392/craving_vial_core.webp | r275/mobs/vial-collector.webp 100% |
| ep1a09 | a09-v1 | 유리 망령 | episode1a/generated-v392/craving_vial_core.webp | r380/mobs/glass-wraith-v1.webp 100% |
| ep1a09 | mb-ep1a08 | 백의 안정화 감독 (중간보스) | generated-v31224/actors-normalized/c386e08b76cf_ep1a_stabilization_supervisor.webp | visual-test/hospital-boss-motion-r53.png 100% |
| ep1a09 | mb-ep1a10 | 중독을 부르는 주사기 환영체 (중간보스) | generated-v31224/actors-normalized/df4a6534a6d4_ep1a_pride_ruin_core.webp | r380/mobs/syringe-phantom-boss-v1.webp 100% |
| ep1a10 | a09-o1 | 오만의 흰 가면 | episode1a/hallucinated_orderly.webp | r92/mobs/M012-move.png 100% |
| ep1a10 | a09-o1 | 주사실 감시환각 | episode1a/hallucinated_orderly.webp | r275/mobs/thread-nurse.webp 100% |
| ep1a10 | a09-v1 | 갈망의 약병핵 | episode1a/generated-v392/craving_vial_core.webp | r275/mobs/vial-collector.webp 100% |
| ep1a10 | a09-v1 | 유리 망령 | episode1a/generated-v392/craving_vial_core.webp | r380/mobs/glass-wraith-v1.webp 100% |
| ep1a10 | a10-h1 | 약을 갈망하는 자 | episode1a/horned_swamp_demon.webp | r380/mobs/drug-craver-v1.webp 100% |
| ep1a10 | a10-h1 | 유리 망령 | episode1a/horned_swamp_demon.webp | r410/mobs/m018.webp 100% |
| ep1a10 | a10-o1 | 암시장의 수상한 자 | episode1a/hallucinated_orderly.webp | r380/mobs/blackmarket-suspect-v1.webp 100% |
| ep1a10 | a10-o1 | 유리 망령 | episode1a/hallucinated_orderly.webp | r410/mobs/m018.webp 100% |
| ep1a10 | a10-s1 | 부정의 잔영 | episode1a/generated-v392/denial_specter.webp | r92/mobs/M016-move.png 90%, episode1a/generated-v392/denial_specter.webp 10% |
| ep1a10 | a10-s1 | 유리 망령 | episode1a/generated-v392/denial_specter.webp | r410/mobs/m018.webp 100% |
| ep1a10 | a10-v1 | 유리 망령 | episode1a/generated-v392/addiction_ruin_core.webp | r410/mobs/m018.webp 100% |
| ep1a10 | a10-v1 | 중독의 폐허핵 | episode1a/generated-v392/addiction_ruin_core.webp | r92/mobs/M015-move.png 89%, episode1a/generated-v392/addiction_ruin_core.webp 11% |
| ep1a10 | mb-ep1a10 | 오만의 폐허핵 (중간보스) | generated-v31224/actors-normalized/df4a6534a6d4_ep1a_pride_ruin_core.webp | generated-story10-cycle-20261005/ep1a10/mb-ep1a10-pride-ruin-core-atlas.png 100% |
| ep1a10 | mb-ep1a10 | 중독을 부르는 주사기 환영체 (중간보스) | generated-v31224/actors-normalized/df4a6534a6d4_ep1a_pride_ruin_core.webp | r380/mobs/syringe-phantom-boss-v1.webp 100% |
| ep1a11 | a10-h1 | 약을 갈망하는 자 | episode1a/horned_swamp_demon.webp | r380/mobs/drug-craver-v1.webp 100% |
| ep1a11 | a10-h1 | 유리 망령 | episode1a/horned_swamp_demon.webp | r410/mobs/m018.webp 100% |
| ep1a11 | a10-o1 | 암시장의 수상한 자 | episode1a/hallucinated_orderly.webp | r380/mobs/blackmarket-suspect-v1.webp 100% |
| ep1a11 | a10-o1 | 유리 망령 | episode1a/hallucinated_orderly.webp | r410/mobs/m018.webp 100% |
| ep1a11 | a10-s1 | 부정의 잔영 | episode1a/generated-v392/denial_specter.webp | r92/mobs/M016-move.png 100% |
| ep1a11 | a10-s1 | 유리 망령 | episode1a/generated-v392/denial_specter.webp | r410/mobs/m018.webp 100% |
| ep1a11 | a10-v1 | 유리 망령 | episode1a/generated-v392/addiction_ruin_core.webp | r410/mobs/m018.webp 100% |
| ep1a11 | a10-v1 | 중독의 폐허핵 | episode1a/generated-v392/addiction_ruin_core.webp | r92/mobs/M015-move.png 83%, episode1a/generated-v392/addiction_ruin_core.webp 17% |
| ep1a11 | a11-c1 | 거짓천국 근위천사 | episode1a/corrupted_guardian.webp | r380/mobs/false-heaven-guard-v1.webp 100% |
| ep1a11 | a11-c1 | 유리 망령 | episode1a/corrupted_guardian.webp | r410/mobs/m018.webp 100% |
| ep1a11 | a11-d1 | 유리 망령 | episode1a/generated-v392/ego_corrosion_vessel.webp | r410/mobs/m018.webp 100% |
| ep1a11 | a11-d1 | 초자아 잠식체 | episode1a/generated-v392/ego_corrosion_vessel.webp | episode1a/generated-v392/ego_corrosion_vessel.webp 83%, r92/mobs/M017-attack.png 16%, rc137/mob-attacks-02.png 1% |
| ep1a11 | a11-o1 | 유리 망령 | episode1a/hallucinated_orderly.webp | r410/mobs/m018.webp 100% |
| ep1a11 | a11-o1 | 치료거부의 가면 | episode1a/hallucinated_orderly.webp | r380/mobs/treatment-refusal-mask-v1.webp 100% |
| ep1a11 | mb-ep1a10 | 오만의 폐허핵 (중간보스) | generated-v31224/actors-normalized/df4a6534a6d4_ep1a_pride_ruin_core.webp | generated-story10-cycle-20261005/ep1a10/mb-ep1a10-pride-ruin-core-atlas.png 100% |
| ep1a11 | mb-ep1a11 | 초천사의 웃는 가면 (중간보스) | generated-v31224/actors-normalized/a6f6c2767d0f_ep1a_false_archangel_smiling_mask.webp | r104/bosses/mb-ep1a11-p4.webp 96%, r104/bosses/mb-ep1a11-p2.webp 4% |
| ep1a09b | a11-c1 | 거짓천국 근위천사 | episode1a/corrupted_guardian.webp | r380/mobs/false-heaven-guard-v1.webp 100% |
| ep1a09b | a11-c1 | 유리 망령 | episode1a/corrupted_guardian.webp | r410/mobs/m018.webp 100% |
| ep1a09b | a11-d1 | 유리 망령 | episode1a/generated-v392/ego_corrosion_vessel.webp | r410/mobs/m018.webp 100% |
| ep1a09b | a11-d1 | 초자아 잠식체 | episode1a/generated-v392/ego_corrosion_vessel.webp | episode1a/generated-v392/ego_corrosion_vessel.webp 60%, r92/mobs/M017-attack.png 40% |
| ep1a09b | a11-o1 | 유리 망령 | episode1a/hallucinated_orderly.webp | r410/mobs/m018.webp 100% |
| ep1a09b | a11-o1 | 치료거부의 가면 | episode1a/hallucinated_orderly.webp | r380/mobs/treatment-refusal-mask-v1.webp 100% |
| ep1a09b | dist03-c1 | 보라검 추격천사 | episode1a/corrupted_guardian.webp | r290/mobs/m004.webp 100% |
| ep1a09b | dist03-g1 | 피냄새 추적자 | dist/ghoul.png | r92/mobs/M006-move.png 96%, dist/ghoul.png 4% |
| ep1a09b | dist03-s1 | 쓰러진 수호병 | dist/skeleton.png | r92/mobs/M001-move.png 95%, dist/skeleton.png 4%, r116/mobs/M001-idle.png 0% |
| ep1a09b | dist03-sp1 | 기억 운반거미 | episode1a/nightmare_spider.webp | r290/mobs/m005.webp 100% |
| ep1a09b | mb-ep1a11 | 초천사의 웃는 가면 (중간보스) | generated-v31224/actors-normalized/a6f6c2767d0f_ep1a_false_archangel_smiling_mask.webp | r104/bosses/mb-ep1a11-p4.webp 100% |
