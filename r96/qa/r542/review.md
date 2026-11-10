# R542 사용자가 준 효과음 검토·적용 — 검사 기록

사용자 2026-11-10 05:07Z "검토후 개선하여 쓸만한것들 적절히 사용", 05:09Z "이것도 검토후 쓸만한거 개선해서 사용".
받은 것: 업로드 mp3 23개, 라이브러리 mp3 10개·wav 1개, 오디오2.zip(47개). 귀로 듣지 못하고 길이·구간·음량·대역·깨짐(클리핑) 수치로 골랐다.

## 적용(4개, 합계 약 34KB) — 자산 적용표
| 게임 음원 | 원본 | 자른 구간 | 다듬기 | 쓰임 | 연결 |
|---|---|---|---|---|---|
| assets/r542/sfx/bow-1.ogg | bow_attack_2 | 2.04~2.25초(깨짐 없는 마지막 한 발) | 90Hz 아래·6kHz 위 걸러냄, 페이드, 피크 -9dB | 헌터 평타 | sound() 감싸기: 헌터의 attack 만 r542Bow (전에는 악마 기운 소리 swRanged) |
| assets/r542/sfx/heal-1.ogg | magic_attack-_healin_#2 | 1.25~2.25초(천천히 차오르는 부분) | 120Hz~5kHz, 느린 페이드, -10dB | 회복 | soundProfiles.swHeal 교체(전에는 강화음 돌려쓰기) |
| assets/r542/sfx/crush-1.ogg | short_anything_crush_#3 | 0.17~0.59초(가장 또렷한 한 번) | 150Hz~4.5kHz, -9dB | 상자 부수기 | crates-r108 이 r542Crush 를 부름(없으면 원래 attack) |
| assets/r542/sfx/roar-1.ogg | devil_roar_1 | 0~0.85초(깨짐 3% 인 앞 포효) | 70Hz~3.5kHz, -9dB | 보스 포효 변주 | soundProfiles.boss 뒤에 1개 추가(3→4개 돌아가며) |

원본 sha256·크기는 assets/r542/sfx/index.json, 원본 사본은 프로젝트 파일 sfx-sources-r542/.

## 보류·미사용(이유)
| 파일 | 판단 |
|---|---|
| devil_roar_2·3·4 | 음량이 꽉 차 심하게 깨짐(rms -1~-5dB, 깨진 표본 25% 안팎) → 거슬릴 위험, 미사용 |
| devil_may_cry_1·2 | 내용(비명·울음 추정)을 듣지 못해 용도 불명 → 보류 |
| Create_a_boss_hit_re_2, Create_a_warning_sou_1 | 쓸 만해 보이나 보스 피격·패턴 예고 훅이 엔진 안쪽이라 이번엔 보류(다음 후보) |
| Create_a_powerful_ul_4, Create_a_short_bulle_2 | 80Hz 아래가 70~75% 인 웅웅거림 → 휴대폰 스피커에서 안 들리고 PC 에선 부담, 보류 |
| Create_a_spacetime_d_4, Create_a_short_"perf_#1, Very_short_and_sharp_2, short_anything_crush_#1 | 2.5kHz 위 에너지가 60~80% 로 날카로움, 같은 자리에 기존 소리 있음 → 미사용 |
| Create_a_player_dama_4 | 작고 얇음(rms -26dB, 고역 42%) → 기존 피격음 유지 |
| Create_a_time_accele_4(11초)·time_accelation_cloc_#3·blood_attack #1·#3·boss_laser_attack_#3·Create_a_projectile_#3·magic_attack-_healin_#4·Isolated_foley_clea_1 | 같은 자리에 기존 소리가 있거나(시계·투사체·레이저) 깨짐·용도 불명 → 보류 |
| thunder_and_raining_1·2 | 정본에 천둥·번개 문장이 없음(검색 0건). R450 날씨는 정본 근거가 있는 것만 쓰는 규칙이라 넣지 않음 → 사용자 판단 필요 |
| Wolf_growl_low_and_3, Goblin_vocalizations_1 | 몹 목소리 후보. 어느 몹에 붙일지 정해야 하고 게임이 목소리 계열을 효과음에서 빼는 규칙이 있어 보류 |
| Epic_soul_arrival_wi_1 | 150Hz 아래 97% → 보류. Short_high-pitched_2, A_2-second_calm_low_1(거의 무음) → 미사용 |
| 오디오2.zip | 47개 중 40개는 이미 게임에 든 rc133 효과음의 원본. 긴 mp3 7개는 음악(BGM) 계열이라 효과음 대상 아님. Rapid_demonic_projec·Sinister_demonic_dec·ups_sound 는 보류 |
| "모든 눈들이 한곳을…" wav(12.6초) | 서사 낭독 음성. 효과음이 아니며 본편 녹음 스레드 몫이라 손대지 않음 |

## 검사
- `node r96/qa/r542/r542-cpu-check.cjs` — 연결 전 13개 실패 확인 → 77/77. R541 93/93 유지.
- `r542-browser.mjs`(헤드리스) 7/7: 헌터 평타 bow-1, 회복 heal-1, 보스 포효 4개째 roar-1, ep1a09 에서 실제 상자를 부숴 crush-1, 재생 음량 0.089~0.134. `SW_OFF=1` 2/2.
- 기존 r108 24, r378 49, r176 22 통과.

## 7분야 심사(소리 분야, 임시 — 헤드리스·수치 기준이며 귀로 들은 평가가 아님)
| 분야 | 점수 | 근거 | 고칠 점 |
|---|---|---|---|
| 1 사운드 디자인(음색) | 7.6 | 사용자가 고른 실제 효과음에서 깨짐 없는 구간만 사용 | 청취 뒤 어색하면 다른 구간·다른 파일로 |
| 2 연출(정본 분위기) | 7.8 | 활·치유·부서짐·포효 모두 쓰임이 이름과 맞음. 근거 없는 천둥은 넣지 않음 | 없음 |
| 3 믹싱·음량 | 8.5 | 재생 음량 0.089~0.134, 고역·저역 정리, 깨진 표본 0 | 없음 |
| 4 게임필·타이밍 | 8.0 | 활은 소리 정점이 0.1초 안에 오게 자름, 상자·회복은 즉시 | 없음 |
| 5 반복 피로도 | 7.6 | 활·회복·부수기는 변주 1개 | 헌터 평타가 잦으면 변주 추가 |
| 6 기술·성능·용량 | 9.0 | 4개 34KB, 영웅 파일 무수정, 끄기 스위치, 검사 77+7 | 없음 |
| 7 UX·접근성 | 7.6 | 효과음 설정·음량을 따름 | 설정 창 항목은 요청 시 |

평균 **8.01** > 7.77 → 통과(임시).
