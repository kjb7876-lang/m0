# R109 잡몹 동작 그림 현황과 앞으로 만들 그림 명세

작성 2026-10-27. 근거: 브라우저 실측(이야기 전 지역 + 사몽 16×3단계, 잡몹 2,656회 등장·고유 ID 186개, 그림 그룹 131개),
Drive 감사 스냅샷 `StoryWorld-monster-action-audit-snapshot-20261027.zip`(sha256 150fe033…, 137그룹/197 ID), R92 스트립 색인(94그룹), R109 Drive 4키 5종.

> 이 문서는 **그림을 새로 만들어 적용하기 위한 명세**입니다. 보스·중간보스·페르소나는 R104 키포즈를 쓰므로 제외했습니다.
> "칸 1"은 그림이 한 장뿐이라는 뜻입니다(감사 스냅샷 규칙: walk/idle/hit/attack 각 1장은 4키가 아님).

## 1. 요약

| 분류 | 그룹 수 | 게임에서 보이는 모습 (R109 이후) |
|---|---|---|
| A 이동·공격 모두 여러 장 | 29 | 걷기·공격 모두 그림을 갈아 끼워 움직임 |
| B 공격만 여러 장 (이동 그림 필요) | 51 | 공격은 교차 동작, 이동은 그림 한 장이 미끄러짐(꿀렁임 없음) |
| C 이동만 여러 장 (공격 그림 필요) | 12 | 이동은 교차 동작, 공격은 한 장 + 짧은 전진 |
| D 둘 다 한 장뿐 (가장 시급) | 39 | 그림 한 장이 미끄러지고 공격 때 짧게 전진만 |

- R109에서 새로 A/C로 올라간 그룹: M002 거미(이동), M003 주문사(이동→A), M007 가고일(날갯짓→A), M008 늪 악마(이동→A), M019 뇌 장치(호버).
- Drive HOLD(품질 문제로 보류, 이번에 쓰지 않음): M004·M005·M017·M022·M027·M133, 준비 HOLD M020.
- 사몽 S-02 `a08-s1`과 RF `b03-g2`는 R105에서 서사에 맞춘 Drive 정적 그림(학생·종이 형상)으로 덮어 그리므로, 원래 그림의 R92 스트립이 있어도 **한 장**으로 보입니다. 이 두 그림의 4키가 생기면 바로 교차 동작이 됩니다.

## 2. 먼저 만들 그림 (사몽에 나오는 몹 우선)

사몽 생존전은 같은 몹이 수십 마리씩 한 화면에 나오므로 효과가 가장 큽니다. 등장 수가 많은 순서입니다.

| 그룹 | 대표 이름 | ID 수 | 등장 수(실측) | 사몽 | 이동 칸 | 공격 칸 | 기준 그림 | 지역 | 비고 |
|---|---|---|---|---|---|---|---|---|---|
| M126 | 찢긴 호외의 잔향 | 1 | 176 | 예 | 1 | 1 | `rooftop_echo.png` | murder01, murder02, murder03, murder04 외 |  |
| M137 | 막힌 이름들 | 1 | 58 | 예 | 1 | 1 | `pride_cyborg_cult_leader.webp` | cult04, samong:14 |  |
| M044 | 기억 공백 망령 | 3 | 49 | 예 | 1 | 1 | `u2_void_wraith.webp` | samong:2, u203, u204, u205 |  |
| M134 | 생체기계 악몽 | 1 | 47 | 예 | 1 | 1 | `black_rose_demon_soldier.webp` | cult05, samong:11 |  |
| M119 | 무명 검흔 | 1 | 38 | 예 | 1 | 1 | `nameless_sword_trace.webp` | hando02, samong:7 |  |
| M035 | 강철 턱의 사이보그 개 | 1 | 25 | 예 | 1 | 1 | `polar_cyborg_hound.webp` | ep1b09, samong:6 |  |
| M124 | 백은 없는 그림자 | 1 | 11 | 예 | 1 | 1 | `silverless_shadow.webp` | hando03, samong:7 |  |
| M004 | 보라검 부활자 | 7 | 134 | 예 | 1 | 4 | `corrupted_guardian.webp` | dist00, dist02, dist03, dist04 외 | Drive HOLD |
| M037 | 태엽 수집자 | 3 | 63 | 예 | 1 | 4 | `u2_resonance_knight.webp` | samong:15, u201, u203, u206 |  |
| M028 | 태엽 수집자 | 3 | 48 | 예 | 1 | 4 | `greed_fox_hound.webp` | ep1b06, ep1b06b, samong:9 |  |
| M055 | 시간수문장 01 | 1 | 41 | 예 | 1 | 4 | `guardian_01.webp` | kair04, samong:9 |  |
| M132 | 기계재판 연결자 | 2 | 34 | 예 | 1 | 4 | `black_robed_nightmare_demon.webp` | cult02, cult06, samong:11 |  |
| M030 | 불길 속의 곰 | 2 | 27 | 예 | 1 | 4 | `wrath_fire_beast.webp` | ep1b07, samong:5 |  |
| M135 | 붉은 교정 표시 | 1 | 53 | 예 | 4 | 1 | `superego_cyborg_cult_leader.webp` | cult06, samong:8 |  |
| M027 | 얼굴 없는 남자의 박수 | 2 | 33 | 예 | 6 | 1 | `lust_heart_marionette.webp` | ep1b05, samong:1 | Drive HOLD |

추가로 사몽 정적 그림 2종: `assets/r105/drive/mob-student.webp`(S-02 얼굴 없는 학생), `assets/r105/drive/mob-paper-figure.webp`(RF 종이 형상) — 각각 이동 4키·공격 4키.

## 3. 그림 제작 명세 (이 규격이면 바로 적용됩니다)

**공통**
- 기존 기준 그림(표의 `기준 그림`)과 **같은 개체·같은 옷/무기·같은 바라보는 방향·같은 카메라(약간 위에서 본 3/4)**. 새 몬스터를 만들지 않습니다.
- 1254×1254 RGBA PNG, 투명 배경, 2×2 고정 칸(627×627) 왼쪽 위→오른쪽 위→왼쪽 아래→오른쪽 아래 순서.
  칸 경계를 넘는 날개 등은 가변 사각형을 써도 되며, 그때는 `[x,y,w,h]` 4개를 안내 문서에 적습니다(M002·M007처럼).
- 네 칸 모두 **같은 몸 크기(같은 배율)**, 발이 닿는 선을 같은 높이에, 몸통 중심을 같은 가로 위치에. 몸이 칸 높이의 70~85%.
- 각 변 여백 15% 이상(알파 16 이상 픽셀이 칸 경계에 닿지 않게). 그림자·바닥 원·글자·효과 테두리는 넣지 않습니다(게임이 그림).
- 4번 칸에서 1번 칸으로 자연스럽게 이어져야 합니다(반복 재생).
- 외부 게임(디아블로 등)의 스프라이트를 따거나 베끼지 않습니다.

**걷는 몹 — 이동 4키**: ① 왼발 앞 접지 ② 지나가기(몸 살짝 높음) ③ 오른발 앞 접지 ④ 지나가기. 다리가 많은 몹은 좌우 다리 묶음이 번갈아.
**나는 몹 — 날갯짓/호버 4키**: ① 날개 위 ② 내려치는 중 ③ 날개 아래 ④ 올라가는 중(호버형은 작은 기울기·장식 흔들림).
**공격 4키(R104 보스와 같은 규칙)**: ① 예비 동작(뒤로 당김) ② 타격 순간 ③ 휘두른 뒤 ④ 회복. 발사형은 ②에서 손/총구에 작은 발광만(투사체는 게임이 그림).

**전달 방법**: Drive 폴더에 PNG + 안내 md(ZIP·PNG SHA-256, 칸 사각형, 기준 그림 경로·SHA, 그룹/등록 ID) — 지금까지와 같은 방식.

## 4. 적용 절차 (그림이 오면)

1. ZIP SHA 확인 → 빈 폴더에 풀기 → PNG SHA 확인.
2. `scripts/r109-mob-frames.py`의 `GROUPS`에 한 줄 추가(그룹, PNG 경로, 칸 사각형, 몸통 템플릿 범위, `walk`/`fly`/`hover`, Drive id, ZIP SHA), `IDS`에 등록 ID 추가.
   공격 4키는 같은 스크립트로 `track:'attack'`을 만들면 됩니다(현재 스크립트는 이동만 만듭니다 → 공격 그림이 처음 올 때 `track` 인자를 추가).
3. `python3 -I scripts/r109-mob-frames.py <풀린 폴더> r96/runtime-text/assets/r109/mobs`
4. `python3 scripts/sync-r99.py assets/r109/mobs/<새 파일>…` → 빌드 → `node r96/qa/r109/mobs-cpu-check.cjs`.
   `mobs-r109.js`는 색인(index.json)만 읽으므로 코드 수정은 필요 없습니다.

## 5. 전체 표 (게임에 실제로 나오는 131그룹)

| 그룹 | 대표 이름 | ID 수 | 등장 수(실측) | 사몽 | 이동 칸 | 공격 칸 | 기준 그림 | 지역 | 비고 |
|---|---|---|---|---|---|---|---|---|---|
| M126 | 찢긴 호외의 잔향 | 1 | 176 | 예 | 1 | 1 | `rooftop_echo.png` | murder01, murder02, murder03, murder04 외 |  |
| M137 | 막힌 이름들 | 1 | 58 | 예 | 1 | 1 | `pride_cyborg_cult_leader.webp` | cult04, samong:14 |  |
| M044 | 기억 공백 망령 | 3 | 49 | 예 | 1 | 1 | `u2_void_wraith.webp` | samong:2, u203, u204, u205 |  |
| M134 | 생체기계 악몽 | 1 | 47 | 예 | 1 | 1 | `black_rose_demon_soldier.webp` | cult05, samong:11 |  |
| M119 | 무명 검흔 | 1 | 38 | 예 | 1 | 1 | `nameless_sword_trace.webp` | hando02, samong:7 |  |
| M035 | 강철 턱의 사이보그 개 | 1 | 25 | 예 | 1 | 1 | `polar_cyborg_hound.webp` | ep1b09, samong:6 |  |
| M124 | 백은 없는 그림자 | 1 | 11 | 예 | 1 | 1 | `silverless_shadow.webp` | hando03, samong:7 |  |
| M133 | 태엽 수집자 | 5 | 57 |  | 1 | 1 | `black_rose_crystal_guardian.webp` | cult02, cult03, cult04, cult05 외 | Drive HOLD |
| M029 | 태엽 수집자 | 2 | 30 |  | 1 | 1 | `greed_mammon.webp` | ep1b06, ep1b06b |  |
| M036 | 관리자 추적견 | 2 | 30 |  | 1 | 1 | `u2_cyborg_hound.webp` | u201, u205 |  |
| M040 | 역전기록 수집가 | 2 | 23 |  | 1 | 1 | `u2_reactor_collector.webp` | u202, u205 |  |
| M031 | 불길 속의 용 | 1 | 15 |  | 1 | 1 | `wrath_satan.webp` | ep1b07 |  |
| M136 | 태엽 수집자 | 1 | 15 |  | 1 | 1 | `black_rose_chip_penitent.webp` | cult03 |  |
| M115 | 성벽 침식 봉인병 | 1 | 14 |  | 1 | 1 | `false_signal_seal_guard.webp` | hando01 |  |
| M123 | 환수검 모조체 | 1 | 14 |  | 1 | 1 | `phantom_reclaim_blade.webp` | hando03 |  |
| M118 | 기억절제 연결자 | 1 | 12 |  | 1 | 1 | `memory_excision_connector.webp` | hando02 |  |
| M056 | 시간수문장 02 | 1 | 9 |  | 1 | 1 | `guardian_02.webp` | kair04 |  |
| M070 | 시간수문장 13 | 1 | 9 |  | 1 | 1 | `guardian_13.webp` | kair06 |  |
| M071 | 시간수문장 14 | 1 | 9 |  | 1 | 1 | `guardian_14.webp` | kair06 |  |
| M077 | 태엽 수집자 | 1 | 9 |  | 1 | 1 | `guardian_19.webp` | kair07 |  |
| M092 | 시간수문장 31 | 1 | 9 |  | 1 | 1 | `guardian_31.webp` | kair09 |  |
| M093 | 시간수문장 32 | 1 | 9 |  | 1 | 1 | `guardian_32.webp` | kair09 |  |
| M100 | 시간수문장 37 | 1 | 9 |  | 1 | 1 | `guardian_37.webp` | kair10 |  |
| M101 | 시간수문장 38 | 1 | 9 |  | 1 | 1 | `guardian_38.webp` | kair10 |  |
| M079 | 태엽 수집자 | 1 | 8 |  | 1 | 1 | `guardian_21.webp` | kair07 |  |
| M080 | 태엽 수집자 | 1 | 8 |  | 1 | 1 | `guardian_22.webp` | kair07 |  |
| M094 | 시간수문장 33 | 1 | 8 |  | 1 | 1 | `guardian_33.webp` | kair09 |  |
| M125 | 은폐기록 연결체 | 1 | 8 |  | 1 | 1 | `blue_executor.webp` | murder04 |  |
| M110 | 태엽 수집자 | 1 | 7 |  | 1 | 1 | `guardian_46.webp` | kair02 |  |
| M116 | 의존 신호 포식자 | 1 | 7 |  | 1 | 1 | `return_coordinate_devourer.webp` | hando01 |  |
| M120 | 코어 운반 집행자 | 1 | 6 |  | 1 | 1 | `order_seal_officer.webp` | hando02 |  |
| M059 | 시간수문장 05 | 1 | 1 |  | 1 | 1 | `guardian_05.webp` | kair04 |  |
| M061 | 상위수문장 49 | 1 | 1 |  | 1 | 1 | `guardian_49.webp` | kair04 |  |
| M082 | 시간수문장 24 | 1 | 1 |  | 1 | 1 | `guardian_24.webp` | kair07 |  |
| M084 | 상위수문장 54 | 1 | 1 |  | 1 | 1 | `guardian_54.webp` | kair07 |  |
| M098 | 상위수문장 56 | 1 | 1 |  | 1 | 1 | `guardian_56.webp` | kair09 |  |
| M104 | 시간수문장 41 | 1 | 1 |  | 1 | 1 | `guardian_41.webp` | kair10 |  |
| M105 | 시간수문장 42 | 1 | 1 |  | 1 | 1 | `guardian_42.webp` | kair10 |  |
| M111 | 시간수문장 47 | 1 | 1 |  | 1 | 1 | `guardian_47.webp` | kair02 |  |
| M004 | 보라검 부활자 | 7 | 134 | 예 | 1 | 4 | `corrupted_guardian.webp` | dist00, dist02, dist03, dist04 외 | Drive HOLD |
| M037 | 태엽 수집자 | 3 | 63 | 예 | 1 | 4 | `u2_resonance_knight.webp` | samong:15, u201, u203, u206 |  |
| M028 | 태엽 수집자 | 3 | 48 | 예 | 1 | 4 | `greed_fox_hound.webp` | ep1b06, ep1b06b, samong:9 |  |
| M055 | 시간수문장 01 | 1 | 41 | 예 | 1 | 4 | `guardian_01.webp` | kair04, samong:9 |  |
| M132 | 기계재판 연결자 | 2 | 34 | 예 | 1 | 4 | `black_robed_nightmare_demon.webp` | cult02, cult06, samong:11 |  |
| M030 | 불길 속의 곰 | 2 | 27 | 예 | 1 | 4 | `wrath_fire_beast.webp` | ep1b07, samong:5 |  |
| M020 | 낡은 장난감 요요 | 5 | 54 |  | 1 | 4 | `seal_residual.webp` | ep1b01, ep1b02, ep1b06b, ep1b08 외 | Drive HOLD |
| M054 | 최초명령 훈련파동 1 | 2 | 43 |  | 1 | 4 | `time-collector.png` | kair01, kair03 |  |
| M047 | 숲 고블린 | 2 | 35 |  | 1 | 4 | `Monster_Goblin.png` | last305 |  |
| M022 | 곰팡이와 오물 봉투 | 1 | 15 |  | 1 | 4 | `sloth_moldling.webp` | ep1b02 | Drive HOLD |
| M024 | 살아 있는 거대한 위장 | 1 | 15 |  | 1 | 4 | `glutton_beelzebub.webp` | ep1b04 |  |
| M026 | 붉은 하이힐 칼날 | 1 | 15 |  | 1 | 4 | `lust_asmodai.webp` | ep1b05 |  |
| M033 | 전극을 두른 좀비 수호기사 | 1 | 15 |  | 1 | 4 | `zombie_guardian_knight_bloodied.webp` | ep1b08 |  |
| M032 | 창처럼 날아오는 역십자가 | 1 | 15 |  | 1 | 4 | `ep1b08_pride_zombie.webp` | ep1b08 |  |
| M046 | 중립초원 늑대 | 1 | 15 |  | 1 | 4 | `Monster_Wolf.png` | last304 |  |
| M117 | 악몽 정찰체 | 1 | 14 |  | 1 | 4 | `timeless_silver_scout.webp` | hando01 |  |
| M005 | 늪의 염소머리 악마 | 1 | 13 |  | 1 | 4 | `goat_head_demon_mob_bloodied.webp` | dist02 | Drive HOLD |
| M052 | 최초명령 훈련파동 5 | 2 | 13 |  | 1 | 4 | `connector.png` | kair01, kair03 |  |
| M053 | 최초명령 훈련파동 6 | 2 | 13 |  | 1 | 4 | `resonance-slave.png` | kair01, kair03 |  |
| M121 | 붕괴선 파수병 | 1 | 12 |  | 1 | 4 | `silver_seal_sentinel.webp` | hando02 |  |
| M063 | 시간수문장 07 | 1 | 9 |  | 1 | 4 | `guardian_07.webp` | kair05 |  |
| M064 | 시간수문장 08 | 1 | 9 |  | 1 | 4 | `guardian_08.webp` | kair05 |  |
| M078 | 태엽 수집자 | 1 | 9 |  | 1 | 4 | `guardian_20.webp` | kair07 |  |
| M085 | 시간수문장 25 | 1 | 9 |  | 1 | 4 | `guardian_25.webp` | kair08 |  |
| M086 | 시간수문장 26 | 1 | 9 |  | 1 | 4 | `guardian_26.webp` | kair08 |  |
| M017 | 초자아 잠식체 | 1 | 8 |  | 1 | 4 | `ego_corrosion_vessel.webp` | ep1a11 | Drive HOLD |
| M034 | 설원 아래의 기계 다리 | 1 | 8 |  | 1 | 4 | `polar_chairman.webp` | ep1b09 |  |
| M041 | 감옥 공명기사 | 1 | 8 |  | 1 | 4 | `u2_suppression_knight.webp` | u202 |  |
| M057 | 시간수문장 03 | 1 | 8 |  | 1 | 4 | `guardian_03.webp` | kair04 |  |
| M058 | 시간수문장 04 | 1 | 8 |  | 1 | 4 | `guardian_04.webp` | kair04 |  |
| M065 | 시간수문장 09 | 1 | 8 |  | 1 | 4 | `guardian_09.webp` | kair05 |  |
| M066 | 시간수문장 10 | 1 | 8 |  | 1 | 4 | `guardian_10.webp` | kair05 |  |
| M072 | 시간수문장 15 | 1 | 8 |  | 1 | 4 | `guardian_15.webp` | kair06 |  |
| M073 | 시간수문장 16 | 1 | 8 |  | 1 | 4 | `guardian_16.webp` | kair06 |  |
| M102 | 시간수문장 39 | 1 | 8 |  | 1 | 4 | `guardian_39.webp` | kair10 |  |
| M103 | 시간수문장 40 | 1 | 8 |  | 1 | 4 | `guardian_40.webp` | kair10 |  |
| M107 | 태엽 수집자 | 1 | 8 |  | 1 | 4 | `guardian_43.webp` | kair02 |  |
| M108 | 태엽 수집자 | 1 | 8 |  | 1 | 4 | `guardian_44.webp` | kair02 |  |
| M109 | 태엽 수집자 | 1 | 7 |  | 1 | 4 | `guardian_45.webp` | kair02 |  |
| M060 | 시간수문장 06 | 1 | 1 |  | 1 | 4 | `guardian_06.webp` | kair04 |  |
| M062 | 상위수문장 50 | 1 | 1 |  | 1 | 4 | `guardian_50.webp` | kair04 |  |
| M067 | 시간수문장 11 | 1 | 1 |  | 1 | 4 | `guardian_11.webp` | kair05 |  |
| M068 | 시간수문장 12 | 1 | 1 |  | 1 | 4 | `guardian_12.webp` | kair05 |  |
| M069 | 상위수문장 51 | 1 | 1 |  | 1 | 4 | `guardian_51.webp` | kair05 |  |
| M074 | 시간수문장 17 | 1 | 1 |  | 1 | 4 | `guardian_17.webp` | kair06 |  |
| M083 | 상위수문장 53 | 1 | 1 |  | 1 | 4 | `guardian_53.webp` | kair07 |  |
| M089 | 시간수문장 29 | 1 | 1 |  | 1 | 4 | `guardian_29.webp` | kair08 |  |
| M090 | 시간수문장 30 | 1 | 1 |  | 1 | 4 | `guardian_30.webp` | kair08 |  |
| M096 | 시간수문장 35 | 1 | 1 |  | 1 | 4 | `guardian_35.webp` | kair09 |  |
| M099 | 상위수문장 57 | 1 | 1 |  | 1 | 4 | `guardian_57.webp` | kair09 |  |
| M112 | 시간수문장 48 | 1 | 1 |  | 1 | 4 | `guardian_48.webp` | kair02 |  |
| M135 | 붉은 교정 표시 | 1 | 53 | 예 | 4 | 1 | `superego_cyborg_cult_leader.webp` | cult06, samong:8 |  |
| M027 | 얼굴 없는 남자의 박수 | 2 | 33 | 예 | 6 | 1 | `lust_heart_marionette.webp` | ep1b05, samong:1 | Drive HOLD |
| M002 | 진흙등 거미 | 4 | 51 |  | 4 | 1 | `nightmare_spider.webp` | dist01, dist02, dist03, ep1a09b | R109 Drive 4키 적용 |
| M131 | 태엽 수집자 | 2 | 16 |  | 4 | 1 | `angry_green_slime.webp` | cult02, cult03 |  |
| M019 | 검은 실의 외부 신호 | 1 | 15 |  | 4 | 1 | `brainwave_contamination.webp` | ep1b01 | R109 Drive 4키 적용 |
| M129 | 흑장미 귀막은 신도 | 1 | 15 |  | 8 | 1 | `earcovered_modern_cultist_bloodied.webp` | cult01 |  |
| M043 | 문턱 관측거미 | 1 | 8 |  | 4 | 1 | `u2_observer_spider.webp` | u204 |  |
| M088 | 시간수문장 28 | 1 | 8 |  | 4 | 1 | `guardian_28.webp` | kair08 |  |
| M076 | 상위수문장 52 | 1 | 1 |  | 4 | 1 | `guardian_52.webp` | kair06 |  |
| M091 | 상위수문장 55 | 1 | 1 |  | 4 | 1 | `guardian_55.webp` | kair08 |  |
| M097 | 시간수문장 36 | 1 | 1 |  | 4 | 1 | `guardian_36.webp` | kair09 |  |
| M114 | 상위수문장 60 | 1 | 1 |  | 4 | 1 | `guardian_60.webp` | kair02 |  |
| M018 | 종이 형상 | 3 | 111 | 예 | 4 | 4 | `envy_glass_shard.webp` | ep1b01, ep1b03, samong:10, samong:13 | RF (Drive 종이 형상 그림으로 덮어 씀) |
| M012 | 백의 구속자 | 5 | 102 | 예 | 8 | 4 | `hallucinated_orderly.webp` | ep1a08, ep1a09, ep1a10, ep1a11 외 |  |
| M038 | 기계군단 | 1 | 91 | 예 | 4 | 4 | `mdrone_idle.png` | samong:12, samong:6, u201 |  |
| M051 | 포구 검은 안개 | 1 | 87 | 예 | 4 | 4 | `bulmyeongwi_b.webp` | last302, last303, samong:1 |  |
| M001 | 쓰러진 수호병 | 4 | 86 | 예 | 8 | 4 | `skeleton.png` | dist01, dist03, dist04, dist05 외 |  |
| M011 | 복도 비명잔영 | 1 | 41 | 예 | 4 | 4 | `corridor_scream_echo.webp` | ep1a08, samong:2 | S-02 (Drive 학생 그림으로 덮어 씀) |
| M039 | 태엽 수집자 | 2 | 34 | 예 | 4 | 4 | `u2_memory_orb.webp` | samong:12, u202, u206 |  |
| M127 | 공실 표기 잔재 | 1 | 19 | 예 | 8 | 4 | `silent_alarm.png` | murder04, samong:8 |  |
| M042 | 태엽 수집자 | 3 | 38 |  | 4 | 4 | `u2_blue_wraith.webp` | u203, u204, u206 |  |
| M003 | 수렁 주문사 | 3 | 35 |  | 4 | 4 | `cult_mage.png` | dist02, dist05, dist06 | R109 Drive 4키 적용 |
| M008 | 지옥문 파수악마 | 3 | 35 |  | 4 | 4 | `horned_swamp_demon.webp` | dist05, dist06, ep1a10 | R109 Drive 4키 적용 |
| M045 | 장미이슬 슬라임 | 3 | 35 |  | 4 | 4 | `Monster_Slime.png` | last302, last304 |  |
| M025 | 버려진 최고급 식재료 | 2 | 23 |  | 4 | 4 | `glutton_kitchen_scrap.webp` | ep1b04 |  |
| M130 | 세뇌 신호 점액체 | 2 | 23 |  | 4 | 4 | `green_enemy_slime.webp` | cult01, cult05 |  |
| M006 | 피냄새 추적자 | 2 | 21 |  | 8 | 4 | `ghoul.png` | dist03, dist04, ep1a09b |  |
| M013 | 갈망의 약병핵 | 1 | 18 |  | 4 | 4 | `craving_vial_core.webp` | ep1a09 |  |
| M021 | 등에 붙은 쓰레기더미 | 1 | 15 |  | 4 | 4 | `sloth_belphegor.webp` | ep1b02 |  |
| M023 | 긴 뱀의 그림자 | 1 | 15 |  | 4 | 4 | `envy_leviathan.webp` | ep1b03 |  |
| M128 | 흑장미 눈가린 신도 | 1 | 15 |  | 8 | 4 | `blindfold_modern_cultist_bloodied.webp` | cult01 |  |
| M122 | EGO 탈취 연결자 | 1 | 14 |  | 4 | 4 | `ego_theft_connector.webp` | hando03 |  |
| M016 | 부정의 잔영 | 1 | 13 |  | 4 | 4 | `denial_specter.webp` | ep1a10 |  |
| M087 | 시간수문장 27 | 1 | 8 |  | 4 | 4 | `guardian_27.webp` | kair08 |  |
| M095 | 시간수문장 34 | 1 | 8 |  | 4 | 4 | `guardian_34.webp` | kair09 |  |
| M007 | 검은기둥 가고일 수호자 | 1 | 7 |  | 4 | 4 | `gargoyle_mob_bloodied.webp` | dist05 | R109 Drive 4키 적용 |
| M015 | 중독의 폐허핵 | 1 | 7 |  | 4 | 4 | `addiction_ruin_core.webp` | ep1a10 |  |
| M075 | 시간수문장 18 | 1 | 1 |  | 4 | 4 | `guardian_18.webp` | kair06 |  |
| M081 | 시간수문장 23 | 1 | 1 |  | 4 | 4 | `guardian_23.webp` | kair07 |  |
| M106 | 상위수문장 58 | 1 | 1 |  | 4 | 4 | `guardian_58.webp` | kair10 |  |
| M113 | 상위수문장 59 | 1 | 1 |  | 4 | 4 | `guardian_59.webp` | kair02 |  |

## 6. 한계

- 실측은 헤드리스 브라우저에서 지역을 불러 등장 목록을 모은 것입니다. 증원·추격대처럼 시간이 지나야 나오는 몹 일부는 빠졌을 수 있습니다(실측 186 ID는 모두 감사 스냅샷 197 ID 안에 있음. 실측에 안 나온 11 ID: a07-c1·a07-s1·a07-v1·a09-c1·a09-d1·l301-clone1~5·l302-e2 — 조건부 등장 또는 미사용으로 보이며 미검증).
- R74 세계 괴물(뿌리 추적자·재 나방·유리 망령 등, 같은 ID를 빌려 씀)은 자체 4자세 아틀라스가 있어 표에서 따로 세지 않았습니다.
- 이 문서의 칸 수는 "서로 다른 그림 장 수"이며 자연스러운 걷기 루프가 검증됐다는 뜻이 아닙니다.
