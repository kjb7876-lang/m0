# R911 투사체 전수표(헤드리스 실측)

크기는 R911 measure()로 잰 값이다. 확대 전 몸통의 긴 변(px, 960×540 기준)이고, 기준은 영웅 화면 키(66×zoom=53.7px)의 절반이다.
영웅 8명은 dist00에서 10초씩, 몹은 38개 지역(맘몬의 금고 제외)에서 3초씩 기억사수로 순회했다.
보스 전용 투사체는 이 순회에서 잡히지 않았다. 보스 공격은 장판·패턴 위주였고, 보스 투사체는 미검증이다. R911은 같은 drawProjectile 사슬을 타므로 보스 투사체에도 그대로 적용된다.

| 구분 | 주인 | 그림 | 표식 | 그려진 수 | 현재 크기(px, 긴 변) | 기준(영웅 키 절반) | 판정 | 지역 |
|---|---|---|---|---|---|---|---|---|
| 영웅 | gunner | gunner-laser-bullet.webp | attackKind9+pxfSourceHero+r160Basic | 230 | 8~10 (중앙 9) | 26.8 | 작음 → R911 확대 | dist00,last301 |
| 영웅 | gunner | gunner-laser-bullet.webp | attackKind9 | 55 | 8~12 (중앙 10) | 26.8 | 작음 → R911 확대 | dist06,last303 |
| 영웅 | hunter | hunter-a.webp | attackKind9+pxfSourceHero+r160Basic | 18 | 6~7 (중앙 7) | 26.8 | 작음 → R911 확대 | dist00 |
| 영웅 | hunter | hunter-a.webp | r535+r535G | 1 | 52~55 (중앙 54) | 26.8 | 충분 | dist00 |
| 영웅 | hunter | hunter-a.webp | r535+r535V | 8 | 18~18 (중앙 18) | 26.8 | 작음 → R911 확대 | dist00 |
| 영웅 | hunter | hunter-q.webp | attackKind9+r535+r535T | 16 | 27~63 (중앙 53) | 26.8 | 충분 | dist00 |
| 영웅 | hunter | hunter-q.webp | attackKind9+r535+r535Final+r535T | 2 | 56~58 (중앙 58) | 26.8 | 충분 | dist00 |
| 영웅 | hunter | hunter-w.webp | sourceHero+sourceSlot+storyWER | 2 | 32~32 (중앙 32) | 26.8 | 충분 | dist00 |
| 영웅 | michaela | michaela-a.webp | attackKind9+pxfSourceHero+r160Basic | 10 | 8~10 (중앙 9) | 26.8 | 작음 → R911 확대 | dist00 |
| 영웅 | seoha | seoha-a.webp | attackKind9+pxfSourceHero+r160Basic | 12 | 6~7 (중앙 7) | 26.8 | 작음 → R911 확대 | dist00 |
| 영웅 | seoha | seoha-a.webp | r564Clone | 4 | 5~5 (중앙 5) | 26.8 | 작음 → R911 확대 | dist00 |
| 영웅 | seoha | seoha-q.webp | attackKind9 | 6 | 6~7 (중앙 6) | 26.8 | 작음 → R911 확대 | dist00 |
| 몹 | SUPER EGO 절개결정 | projectile-core.webp | r58Affliction+r58Release | 6 | - | 26.8 | 측정 못 함 | cult03 |
| 몹 | SUPER EGO 절개결정 우두머리 | projectile-core.webp | r58Affliction+r58Release | 3 | - | 26.8 | 측정 못 함 | cult03 |
| 몹 | SUPER EGO 절개결정 증원 | projectile-core.webp | r58Affliction+r58Release | 6 | - | 26.8 | 측정 못 함 | cult03 |
| 몹 | 강철 턱의 사이보그 개 | projectile-core.webp | r58Affliction+r58Release | 3 | 2~2 (중앙 2) | 26.8 | 작음 → R911 확대 | ep1b09 |
| 몹 | 강철 턱의 사이보그 개 우두머리 | projectile-core.webp | r58Affliction+r58Release | 3 | 2~3 (중앙 2) | 26.8 | 작음 → R911 확대 | ep1b09 |
| 몹 | 강철 턱의 사이보그 개 증원 | projectile-core.webp | r58Affliction+r58Release | 6 | 2~3 (중앙 3) | 26.8 | 작음 → R911 확대 | ep1b09 |
| 몹 | 검은기둥 주문사 | projectile-core.webp | r58Affliction+r58Release | 2 | 28~36 (중앙 36) | 26.8 | 충분 | dist06 |
| 몹 | 고슴도치 가시 사탕 | projectile-core.webp | r58Affliction+r58Release | 2 | 32~33 (중앙 33) | 26.8 | 충분 | ep1b06b |
| 몹 | 고슴도치 가시 사탕 우두머리 | projectile-core.webp | r58Affliction+r58Release | 2 | 30~35 (중앙 35) | 26.8 | 충분 | ep1b06b |
| 몹 | 고슴도치 가시 사탕 증원 | projectile-core.webp | r58Affliction+r58Release | 8 | 31~36 (중앙 36) | 26.8 | 충분 | ep1b06b |
| 몹 | 백은 없는 그림자 | projectile-core.webp | r58Affliction+r58Release | 5 | 35~36 (중앙 36) | 26.8 | 충분 | hando03 |
| 몹 | 백은 없는 그림자 우두머리 | projectile-core.webp | r58Affliction+r58Release | 1 | 10~36 (중앙 36) | 26.8 | 충분 | hando03 |
| 몹 | 불길 속의 용 | projectile-core.webp | r58Affliction+r58Release | 9 | 32~36 (중앙 36) | 26.8 | 충분 | ep1b07 |
| 몹 | 불길 속의 용 우두머리 | projectile-core.webp | r58Affliction+r58Release | 3 | 8~11 (중앙 9) | 26.8 | 작음 → R911 확대 | ep1b07 |
| 몹 | 불길 속의 용 증원 | projectile-core.webp | r58Affliction+r58Release | 3 | 8~12 (중앙 10) | 26.8 | 작음 → R911 확대 | ep1b07 |
| 몹 | 붉은 하이힐 칼날 | projectile-core.webp | r58Affliction+r58Release | 2 | 36~36 (중앙 36) | 26.8 | 충분 | ep1b05 |
| 몹 | 붉은 하이힐 칼날 우두머리 | projectile-core.webp | r58Affliction+r58Release | 1 | 36~36 (중앙 36) | 26.8 | 충분 | ep1b05 |
| 몹 | 붉은 하이힐 칼날 증원 | projectile-core.webp | r58Affliction+r58Release | 3 | 35~36 (중앙 36) | 26.8 | 충분 | ep1b05 |
| 몹 | 빗속 횡단보도의 기억 잔향 | projectile-core.webp | r58Affliction+r58Release | 8 | 34~36 (중앙 36) | 26.8 | 충분 | murder01 |
| 몹 | 빗속 횡단보도의 기억 잔향 우두머리 | projectile-core.webp | r58Affliction+r58Release | 2 | 36~36 (중앙 36) | 26.8 | 충분 | murder01 |
| 몹 | 살아 움직이는 쓰레기들 | projectile-core.webp | r58Affliction+r58Release | 6 | 8~13 (중앙 11) | 26.8 | 작음 → R911 확대 | ep1b02 |
| 몹 | 살아 있는 거대한 위장 | projectile-core.webp | r58Affliction+r58Release | 3 | 33~36 (중앙 36) | 26.8 | 충분 | ep1b04 |
| 몹 | 살아 있는 거대한 위장 우두머리 | projectile-core.webp | r58Affliction+r58Release | 1 | 36~36 (중앙 36) | 26.8 | 충분 | ep1b04 |
| 몹 | 살아 있는 거대한 위장 증원 | projectile-core.webp | r58Affliction+r58Release | 2 | 35~36 (중앙 36) | 26.8 | 충분 | ep1b04 |
| 몹 | 상위수문장 | projectile-core.webp | r58Affliction+r58Release | 2 | - | 26.8 | 측정 못 함 | kair06 |
| 몹 | 설원 잠복 보행기 | projectile-core.webp | r58Affliction+r58Release | 4 | 32~35 (중앙 34) | 26.8 | 충분 | ep1b09 |
| 몹 | 설원 잠복 보행기 우두머리 | projectile-core.webp | r58Affliction+r58Release | 1 | 13~31 (중앙 31) | 26.8 | 충분 | ep1b09 |
| 몹 | 수렁 주문사 | projectile-core.webp | r58Affliction+r58Release | 6 | 30~36 (중앙 35) | 26.8 | 충분 | dist02 |
| 몹 | 숲 고블린 | projectile-core.webp | r58Affliction+r58Release | 3 | 8~12 (중앙 10) | 26.8 | 작음 → R911 확대 | last305 |
| 몹 | 숲 고블린 우두머리 | projectile-core.webp | r58Affliction+r58Release | 3 | 8~12 (중앙 9) | 26.8 | 작음 → R911 확대 | last305 |
| 몹 | 시간수문장 | projectile-core.webp | r58Affliction+r58Release | 14 | 1~36 (중앙 10) | 26.8 | 작음 → R911 확대 | kair06,kair07,kair08 |
| 몹 | 시간수문장 우두머리 | projectile-core.webp | r58Affliction+r58Release | 5 | 9~11 (중앙 11) | 26.8 | 작음 → R911 확대 | kair06 |
| 몹 | 시간핵의 명령 파동 | projectile-core.webp | r58Affliction+r58Release | 6 | 2~3 (중앙 3) | 26.8 | 작음 → R911 확대 | kair03 |
| 몹 | 신경 케이블 포식체 우두머리 | projectile-core.webp | r58Affliction+r58Release | 1 | 36~36 (중앙 36) | 26.8 | 충분 | cult02 |
| 몹 | 아마겟돈 계산결정 | projectile-core.webp | r58Affliction+r58Release | 4 | 2~3 (중앙 3) | 26.8 | 작음 → R911 확대 | cult04 |
| 몹 | 아마겟돈 계산결정 우두머리 | projectile-core.webp | r58Affliction+r58Release | 1 | 3~3 (중앙 3) | 26.8 | 작음 → R911 확대 | cult04 |
| 몹 | 악마화 나무의 침식 근위 | projectile-core.webp | r58Affliction+r58Release | 8 | 8~36 (중앙 36) | 26.8 | 충분 | dist00 |
| 몹 | 악마화 나무의 침식 근위 우두머리 | projectile-core.webp | r58Affliction+r58Release | 6 | 11~36 (중앙 12) | 26.8 | 작음 → R911 확대 | dist00 |
| 몹 | 옥상으로 돌아온 기억 잔향 | projectile-core.webp | r58Affliction+r58Release | 5 | 1~2 (중앙 2) | 26.8 | 작음 → R911 확대 | murder03 |
| 몹 | 옥상으로 돌아온 기억 잔향 우두머리 | projectile-core.webp | r58Affliction+r58Release | 1 | 1~2 (중앙 1) | 26.8 | 작음 → R911 확대 | murder03 |
| 몹 | 유리 망령 | projectile-core.webp | r58Affliction+r58Release | 1 | 36~36 (중앙 36) | 26.8 | 충분 | ep1b05 |
| 몹 | 유리 망령 우두머리 | projectile-core.webp | r58Affliction+r58Release | 1 | 36~36 (중앙 36) | 26.8 | 충분 | ep1b05 |
| 몹 | 잠식된 약방 아낙 | projectile-core.webp | r58Affliction+r58Release | 27 | 33~36 (중앙 35) | 26.8 | 충분 | last302,last303 |
| 몹 | 잠식된 약방 아낙 우두머리 | projectile-core.webp | r58Affliction+r58Release | 6 | 35~36 (중앙 36) | 26.8 | 충분 | last302,last303 |
| 몹 | 최종문 공명기사 | projectile-core.webp | r58Affliction+r58Release | 8 | 8~13 (중앙 11) | 26.8 | 작음 → R911 확대 | u203 |
| 몹 | 최종문 공명기사 우두머리 | projectile-core.webp | r58Affliction+r58Release | 2 | 9~11 (중앙 11) | 26.8 | 작음 → R911 확대 | u203 |
| 몹 | 최초명령 훈련파동 | projectile-core.webp | r58Affliction+r58Release | 21 | 29~36 (중앙 36) | 26.8 | 충분 | kair01 |
| 몹 | 최초명령 훈련파동 우두머리 | projectile-core.webp | r58Affliction+r58Release | 6 | 31~36 (중앙 36) | 26.8 | 충분 | kair01 |
| 몹 | 피리 고블린 우두머리 | projectile-core.webp | r58Affliction+r58Release | 1 | 1~13 (중앙 4) | 26.8 | 작음 → R911 확대 | last305 |
| 몹 | 환수검 모조체 우두머리 | projectile-core.webp | r58Affliction+r58Release | 3 | 33~36 (중앙 36) | 26.8 | 충분 | hando03 |
| 몹 | 환수검 모조체 증원 | projectile-core.webp | r58Affliction+r58Release | 3 | 29~36 (중앙 36) | 26.8 | 충분 | hando03 |
| 몹 | 흑마법사의 저주창 증원 | projectile-core.webp | r58Affliction+r58Release | 2 | 35~36 (중앙 36) | 26.8 | 충분 | ep1b08 |
| 몹 | 흑마법사의 저주창 증원 | projectile-core.webp | r286Indirect+r58Affliction | 1 | 8~30 (중앙 8) | 26.8 | 작음 → R911 확대 | ep1b08 |
| 몹 | 흑장미 귀막은 신도 | projectile-core.webp | r58Affliction+r58Release | 1 | 4~4 (중앙 4) | 26.8 | 작음 → R911 확대 | cult01 |
| 몹 | 흑장미 귀막은 신도 증원 | projectile-core.webp | r58Affliction+r58Release | 2 | 4~4 (중앙 4) | 26.8 | 작음 → R911 확대 | cult01 |

종류 67개, 작음 30개
