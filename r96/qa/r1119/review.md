# R1119 페르소나 보스 — 드라이브 11-16·11-17 Dots 검토본 적용

## 자산 적용표 (원본 = 사용자 비공개 Drive, 해시는 asset-table.json)
| 게임 자산 | 원본 | 용도 | 적용 |
|---|---|---|---|
| persona-hit-{base,awake}-front.webp | 01_피격_기본형-각성형_정면4프레임 | 정면 피격 4칸 | 적용(1칸째 아래 사각 띠 결함 → 2칸째로 대신) |
| persona-hit-{base,awake}-side.webp | PersonaBoss_BASE_AWAKE_side-backstep-hit6 (사용자 확정 11-17 04:56Z) | 옆 피격 한 발 후퇴 6칸, 끝 오프셋 0.15초 되돌림 | 적용(이전 옆 4칸은 Drive 보관만) |
| persona-hit-{base,awake}-rear.webp | PersonaBoss_BASE_AWAKE_rear-hit4 | 뒤 피격 4칸 | 적용 |
| persona-death-{base,awake}.webp | PersonaBoss_orbCast_lightDeath | 결전 끝 빛 소멸 16칸(정면) | 적용 |
| fx-clock / diamond / star / lance / shield / vortex -flight·-contact.webp | PB_clock·PB_diamond·Persona_BOSS_slot5_branch·CX-0106PB_lance·PB_shield·PersonaBoss_innerVortex | 탄 비행 8칸 + 접촉·소멸 6칸 | 적용 |
| well-orb.webp · well-floor.webp | CX-0118PM_r2_PM-2_separate_layers | 검은 우물별 구·바닥 원반 | 적용(장면 확인은 미검증) |
| (코드) 각성 걷기 구슬·망토 가장자리 발광, 시전 구슬 발광 | 01_먼저읽기 지시 | 국소 lighter 발광 | 적용 |
| EGO_rear_PersonaHeroOrb 3묶음 | — | EGO 뒷모습(페르소나 영웅 아님) | 범위 밖, 미적용 |
| 각성 걷기 새 그림·각성 시전 A1/A2·작은 구체·시선·일식 | — | 지시상 보류·원본 미확보 | 미적용 |

## 7분야 심사 (자체, 헤드리스 소프트웨어 렌더 캡처 기준 — GPU·실기기 아님)
| 분야 | 점수 | 메모 |
|---|---|---|
| 미술 | 7.9 | 탄 6종이 정지 그림에서 움직이는 언주 시트로, 원화 중심 보존 |
| 연출 | 7.8 | 피격 방향 반응·사망 빛 소멸로 결전 끝이 읽힘. 소멸은 정면 그림 하나라 옆을 보던 경우 방향이 바뀜 |
| 카메라구도 | 7.6 | 보스가 화면에서 작아(약 85px) 피격 세부는 약하게 보임 |
| 공간인테리어 | 7.7 | 우물별 바닥 원반이 끌림 범위에 맞음(장면 캡처 미확보) |
| 조명색채 | 7.9 | 발광은 언주 명암만, 전신 필터 없음 |
| 애니메이션VFX | 8.0 | 비행 루프·접촉 6칸, 옆 후퇴 피격 발 고정 |
| UX레벨 | 7.9 | 시전 중 피격 그림 안 끼움, 판정·속도·넉백 그대로 |
| 평균 | **7.83** | 통과(> 7.77) |
