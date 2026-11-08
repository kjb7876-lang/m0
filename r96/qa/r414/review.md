# R414 구글 드라이브 건물·소품 배치 (7분야 심사)

사용자 2026-11-08 "구글드라이브자산 적절히 크기조절해서 배치 특히 건물자산의 경우 최소영웅2배높이이상".

- drive-buildings-r414.js: 드라이브 건물 후보 23채를 야외 사몽 지역 뒤쪽 바닥 끝 너머에 세운다. 높이 136~300px로 영웅(66px)의 2.06~4.5배다. 그림만 바꾸며 충돌·길찾기·전투는 그대로 둔다. 문(worldR74.doors) 반지름 2칸, 큰 조형물 앞뒤, 길잡이 경로는 피한다. 끄기는 `storyworld.r414.buildings`.
- scripts/r414-drive-buildings.py: 원본(읽기 전용)에서 파생본을 만든다. 테두리를 다듬고 사몽 팔레트로 맞춘다(채도 ×.45, 명도 ×.52, #321B27 쪽으로 28%, 아래 절반 어둡게, 하단 16% 투명 페이드). 원본·파생 해시는 index.json 에 남긴다. Drive 파일 ID는 넣지 않는다.
- 작은 소품 3개는 R406 줄 형식으로 넣는다(props-place-r406.js 가 읽음).
- 보류 19건은 이유를 함께 남긴다(아래 표).
- 건물을 세운 방에서는 R123 코드 그림 자리표시(원화 없는 승강기 문·액자)를 main 처럼 그리지 않는다. main 에서 이것이 안 보이는 원인은 확인하지 못했다.
- 화면: `r414-ba-pc-1.jpg`, `r414-ba-pc-2.jpg`, `r414-ba-pc-3.jpg`(S04-1·RD-6, R414-2 뒤), `r414-ba-mobile-1.jpg`. 왼쪽이 전(R413), 오른쪽이 후다. 헤드리스 SwiftShader 임시 캡처라 GPU·실기기는 미검증이다.

## 심사

1차 6.81(건물이 밝고 떠 보임) → 등급 맞춤·하단 페이드. 2차 7.60(표식 위 소품 3개, 회색 문·금빛 액자) → 소품 보류, 자리표시 생략. 3차 결과는 다음과 같다.

| 분야 | 점수 | 메모 |
|---|---|---|
| 미술 | 7.9 | 2차 지적(회색 승강기 문·금빛 액자) 해소. 건물이 배경 실루엣으로 녹아듦, RA-4 원무동이 조금 차가움(측정 결과 벽돌보다 어두움) |
| 연출 | 7.8 | 목표 표식 위 소품이 빠지고 건물이 뒤쪽 공간을 넓힘. S05-4 입구 문틀이 표식 옆 → R414-3 에서 보류 |
| 카메라구도 | 7.8 | 건물 모두 뒤쪽 바닥 끝 너머, 영웅·적·길·표식을 가리지 않음 |
| 공간인테리어 | 7.8 | S05-4 입구 문틀·RD-1 물 없는 다리 지적 → R414-3 에서 둘 다 보류 |
| 조명색채 | 7.9 | 액센트 하나 원칙 회복, 건물 L* 9~18 배경 띠 안 |
| 애니메이션VFX | 7.7 | RD-6·RG-1 에서 고목이 더 보이는 현상(원인 미검증, 1분야 지적) |
| UX레벨 | 7.9 | 동선·표식 가림 없음. RG-1 성문 건물이 출구처럼 읽힐 여지(1분야 지적, 미조치) |
| **평균** | **7.83** | 7.77 초과, 통과 |

3차 뒤 R414-3 에서 다섯 분야가 확인한 S05-4 입구 문틀과 두 분야가 지적한 RD-1 다리를 보류로 돌렸다. 둘 다 빼기만 한 변경이다.

## 건물 (23채)

| 이름 | 지역 | 높이(px) | 영웅 대비 |
|---|---|---|---|
| gray-school | sz115-RA-4 | 190 | 2.88배 |
| hospital-admissions | sz115-RA-4 | 200 | 3.03배 |
| waterside-house | sz115-RD-1 | 165 | 2.50배 |
| black-workshop-ruin | sz115-RD-6 | 175 | 2.65배 |
| gallery-cathedral-ruin | sz115-RD-6 | 250 | 3.79배 |
| inner-keep-ruin | sz115-RG-1 | 230 | 3.48배 |
| twin-gatehouse-ruin | sz115-RG-1 | 220 | 3.33배 |
| palace-colonnade | sz115-RG-10 | 140 | 2.12배 |
| hotel-kitchen-annex | sz115-RG-8 | 140 | 2.12배 |
| saebit-hotel | sz115-RG-8 | 260 | 3.94배 |
| teacup-rose-house | sz115-S01-2 | 170 | 2.58배 |
| training-gym | sz115-S03-5 | 140 | 2.12배 |
| training-gym-ruin | sz115-S03-6 | 140 | 2.12배 |
| emotion-tower | sz115-S04-1 | 300 | 4.55배 |
| research-block | sz115-S04-1 | 210 | 3.18배 |
| corner-tavern | sz115-S05-2 | 175 | 2.65배 |
| dressmaker-shop | sz115-S05-2 | 170 | 2.58배 |
| officer-residence | sz115-S05-4 | 180 | 2.73배 |
| officer-residence-ruin | sz115-S05-6 | 180 | 2.73배 |
| broadcast-station | sz115-S06-10 | 190 | 2.88배 |
| polar-access | sz115-S06-17 | 145 | 2.20배 |
| polar-access-ruin | sz115-S06-18 | 145 | 2.20배 |
| shelter-headhouse | sz115-S06-3 | 140 | 2.12배 |

## 소품 (3개)

| 이름 | 지역 | 방식 | 높이(px) |
|---|---|---|---|
| fallen-rafters | sz115-RD-1 | inner | 52 |
| residence-lamppost | sz115-S05-4 | inner | 140 |
| departure-bag | sz115-S05-4 | inner | 24 |

## 보류 (19건)

| 후보 | 이유 |
|---|---|
| S05-residence-entrance-eave-candidate | 처마 부품(단독 건물·소품 아님) |
| teacup-room-floral-porcelain-wall | R406 벽 자리가 목표 표식(기억의 전투) 바로 뒤라 영웅·표식 글자를 가림(7분야 심사 R414-2) |
| twin-castle-mixed-masonry-wall | 이음벽 부품(단독 건물·소품 아님) |
| R07-red-garden-arched-bridge | 건널 물·틈 없이 공허 위에 홀로 선 다리(7분야 심사 R414-3) — 물가 지역이 생기면 다시 검토 |
| R00-damaged-platform-pa-speaker | R406 벽 자리가 목표 표식(기억 표식)·길잡이 화살표 시작점과 겹침(7분야 심사 R414-2) |
| S04-steel-elevator-entrance | S04 출구 표식 곁에 문이 둘로 보이고 벽 없이 바닥에 홀로 섬(7분야 심사 R414-2) |
| S05-residence-heavy-entry-door | R406 벽 자리가 목표 표식(C 기억 표식) 바로 뒤라 둘째 출입문처럼 보임(7분야 심사 R414-3) |
| R11-gallery-cathedral-building | 원문 장면(RD-7 성당 제단)이 실내형 — 같은 장소의 피해 변형을 야외 RD-6 에 배치 |
| KAIR-black-workshop-building | 원문 장면(kair07 검은 공방)이 실내 — 같은 장소의 피해 변형을 야외 RD-6(포격 거리)에 배치 |
| EP-recovery-pavilion-building | 원문 장면(종장 병실 M-4)이 실내형 |
| R14-voluntary-atelier-building | 원문 장면(RG-4 도겸의 작업실)이 실내형 |
| R03-inner-citadel-keep | 원문 장면(RB-2·RG-6)이 실내형 — 같은 장소의 피해 변형을 야외 RG-1 전장에 배치 |
| M04-cheongrok-villa | 원문 장면(murder04 청록빌라)이 실내 이야기 지도 |
| R01-orphanage-courtyard-building | 원문 장면(RA-3)이 실내형, RA-4 에는 원문 건물 둘(학교·원무동)이 이미 있음 |
| S06-undersea-laboratory-module | 바다 밑 시설 — 맞는 야외 꿈 지역이 없음 |
| R15-corridor-archive-wing | 원문 장면(RG-7 카이로 회랑)이 실내형 |
| R00-station-concourse-shell | 속이 보이는 단면 구조(Dots HOLD_PROJECTION_MISMATCH)라 바깥 배치에 안 맞음 |
| TWIN-mixed-masonry-gatehouse | 원문 장면(hando01·02)이 벽으로 둘린 이야기 지도라 뒤쪽 빈 땅이 없음 — 피해 변형을 야외 RG-1 전장에 배치 |
| S06-undersea-lab-attack-damaged | 바다 밑 시설 — 맞는 야외 꿈 지역이 없음 |

## 미검증

- GPU·실기기 모바일·자연 플레이 화면
- R123 자리표시가 main 에서 안 보이는 원인, RD-6·RG-1 고목이 더 보이는 현상의 원인
