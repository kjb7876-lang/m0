# R109 자산 적용표

Drive 원본은 읽기 전용으로 받아 SHA-256을 안내 문서와 대조했고(5/5 일치), 원본 PNG는 바꾸지 않았습니다. 게임에는 `scripts/r109-mob-frames.py`로 만든 가공 사본(4칸 가로 스트립)만 넣었습니다.

| 그룹 | Drive ZIP (id) | ZIP 크기 | ZIP SHA-256 | 원본 PNG SHA-256 | 게임 파일 | 크기 | SHA-256 | 용도 | 적용 |
|---|---|---|---|---|---|---|---|---|---|
| M002 | StoryWorld-M002-spider-move4-conditional-art.zip (`1GLrbTk7hDH_Hdb798p2aVXyzaSoAehhO`) | 1,834,215 | `e228a01476befa12…` | `48a975caf7bddaaa…` | `r96/runtime-text/assets/r109/mobs/M002-move.png` (191×156×4칸) | 178,490 | `5d117398b0037fff…` | 망각의 거미 계열 · 8다리 보행 4키 — ID dist01-sp1, dist01-sp2, dist02-sp1, dist03-sp1 | 적용(이동/걷기) |
| M003 | StoryWorld-M003-cult-mage-move4-conditional-art.zip (`1rcN4claKUkumE-lA3ENJBT5Dq9JtKvZI`) | 1,746,197 | `d6261f05b748d017…` | `af7be19b8b9272a9…` | `r96/runtime-text/assets/r109/mobs/M003-move.png` (118×156×4칸) | 114,325 | `c8bcefbd5fee9eae…` | 수렁/검은기둥 주문사 · 걷기 4키 — ID dist02-m1, dist05-m1, dist06-m1 | 적용(이동/걷기) |
| M007 | StoryWorld-M007-gargoyle-wingbeat4-variable-atlas-candidate.zip (`1SPNxbo45gjE70ssKcgNu1G7wBilB1IHc`) | 1,949,410 | `4a19bd920b9c0800…` | `c8c35898cfd82686…` | `r96/runtime-text/assets/r109/mobs/M007-move.png` (227×182×4칸) | 168,734 | `0868a9cc990c86e8…` | 검은기둥 가고일 수호자 · 날갯짓 4키 — ID dist05-c1 | 적용(이동/날갯짓) |
| M008 | StoryWorld-M008-horned-swamp-demon-move4-conditional-art.zip (`1Phl1xW8SfNgoxDMKTKxKDf6zgBsoJ7_V`) | 2,180,259 | `02032f227430eff1…` | `73c9f82c0bd3539f…` | `r96/runtime-text/assets/r109/mobs/M008-move.png` (148×158×4칸) | 156,399 | `fa4654af1921aec9…` | 뿔 달린 늪 악마 계열 · 걷기 4키 — ID dist05-h1, dist06-h1, a10-h1 | 적용(이동/걷기) |
| M019 | StoryWorld-M019-brain-device-hover4-conditional-art.zip (`1PN_rwxrv97r6VdeUQyG1PUjttojX9mGm`) | 1,817,446 | `1c09afcefc4ce3b7…` | `1ccec6cbfeef17e3…` | `r96/runtime-text/assets/r109/mobs/M019-move.png` (132×153×4칸) | 157,279 | `3eb8f0968bb8fd3f…` | 검은 실의 외부 신호(뇌 장치) · 호버 4키 — ID b01-c1 | 적용(이동/호버) |

감사 스냅샷 `StoryWorld-monster-action-audit-snapshot-20261027.zip` (id `19ZU4OsOvwmxcQ2F83S5xDw8rVYVYa8oY`, 56,382 B, sha256 `150fe033a48331688ab717b32807d556ed6d157a8657a61f71431fe1e191c3b6`): 문서 전용, 게임에 넣지 않음. `docs/r109-mob-frames-needed.md`의 그룹 대조에 사용.

정렬 방법: 키 1의 몸통(걷는 몹은 위쪽 55~60%, 나는 몹은 가운데) 템플릿과 나머지 키를 상호상관으로 맞춤(키별 확대·축소 없음, 한 배율), 걷는 몹은 발 하단을 중앙값 선에 ±14px 안에서 맞춤, 가시 높이 중앙값 150px(R92 규약). 키별 이동량·상관값은 `assets/r109/mobs/index.json`의 `registration`.

## 쓰지 않은 Drive 자산

| 자산 | 이유 |
|---|---|
| M004·M005·M017·M022·M027·M133 이동 후보, M020 | Drive 감사에서 HOLD(다리 교대·해부학 문제). 보존만 함 |
| StoryWorld-r7-checkpoint-09-FOUR-STATE-SOURCE-POSES (6 ZIP, 약 127MB) | walk/idle/hit/attack 각 1장(4키 아님, 감사 규칙). R108 브랜치 로컬 작업자가 다루는 중이라 겹치지 않게 미적용 |
| StoryWorld-R7-final-regular-xxx-of288 | 위와 같은 R7 계열, 미적용 |
| Chapter5/6/7·source6·First8 키포즈 후보 | 보스 키포즈(R104 계열), 이번 잡몹 범위 밖 |

## 미검증

- 실제 GPU·실기기 모바일·자연 플레이에서의 걷기 자연스러움(헤드리스 Chromium 스크린샷만 확인).
- 4→1 이어짐과 발 미끄러짐: Drive 안내대로 "완성 루프 승인" 아님. 걸음 속도와 그림 속도(6.5fps)는 맞추지 않음.
- M002 거미 8다리 위상, M019 메달리온 배치 변화(회전이 아닌 재묘사)는 눈으로만 확인.
- 사몽 S-01 몹 교체(거짓천국 근위천사 → 부정의 잔영)와 두 몹 번갈아 나오기 수정의 체감 난이도 변화.
