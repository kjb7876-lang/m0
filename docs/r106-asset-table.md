# R106 자산 적용표 (2026-10-27)

## 1. 드라이브 역행 묶음 (원본 ZIP은 수정하지 않음, 게임용 사본만 잘라 줄임)

| 원본 ZIP (Drive id) | ZIP SHA-256 앞자리 | 원본 PNG | 게임 파일 | 크기(px) | 바이트 | SHA-256 앞자리 | 용도 | 적용 |
|---|---|---|---|---|---|---|---|---|
| R05-judgment-hammer.zip (`1e8cYUzV_8qnoBTEWrePkOLNIP0s6Z5x7`) | 8f838f76… | reverse-r05-judgment-hammer-two-key-states.png | `assets/r106/drive/hammer-1.webp` | 420×420 | 21,292 | f2e40b7c14cf… | R-05 재판관의 망치 · 저울판 온전 (보스 대기·체력 절반 위) | 적용(정적 조형물) |
| R05-judgment-hammer.zip (`1e8cYUzV_8qnoBTEWrePkOLNIP0s6Z5x7`) | 8f838f76… | reverse-r05-judgment-hammer-two-key-states.png | `assets/r106/drive/hammer-2.webp` | 420×420 | 21,722 | 6a2991b18a9d… | R-05 재판관의 망치 · 저울판 일부 깨짐 (보스 체력 절반 이하·격파) | 적용(정적 조형물) |
| R06-paper-king.zip (`1Moq6_d9hGPDpA3sKi4emhdd8KPJf8Ud6`) | 0be3b348… | storyworld-reverse-r06-paper-king-idle-v1.png | `assets/r106/drive/paper-king.webp` | 293×512 | 59,984 | 4420f624dc7a… | R-06 금고 안쪽의 종이 왕 · 전신 정적 조형물 | 적용(정적 조형물) |
| R07-surveillance-lotus.zip (`1nrVqLSNYhg5IV4Go75RVXp_4aCJ0mJ9A`) | b54f29db… | reverse-r07-surveillance-lotus.png | `assets/r106/drive/lotus.webp` | 321×420 | 49,744 | ca8919fb7d09… | R-07 감시의 연꽃 · 늪 다리·병동 환경 개체 | 적용(정적 조형물) |
| R08-tactile-table-v2.zip (`11tTMJjB_HdND7piD6abcdj8J281fBi0I`) | 4d725a89… | reverse-r08-tactile-table-drawing-v2-underpaper-emboss.png | `assets/r106/drive/table-drawing.webp` | 431×320 | 30,502 | 42aea48f9c04… | R-11 작은 식탁 그림(종이 밑 실 양각 v2) · 바닥의 작은 종이 | 적용(정적 조형물) |
| R13-empty-sleeve-trumpet.zip (`1zyh9q-VZ1yP2hv-AN5pVMNfj-6r_SDiX`) | d14b557c… | storyworld-reverse-r13-empty-sleeve-trumpet-idle-v1.png | `assets/r106/drive/trumpet.webp` | 488×420 | 32,450 | 459db47b004c… | R-13 빈 소매 나팔 · 정적 1장 | 적용(정적 조형물) |
| R14-thread-door.zip (`101KzhqUIU30wu8qdLkFJ-B4lewFF1Vzm`) | 59b06fc3… | reverse-r14-thread-door-drawing.png | `assets/r106/drive/thread-door.webp` | 322×320 | 19,158 | 447d7152b364… | R-14 실로 그린 문 그림 · 바닥의 종이 | 적용(정적 조형물) |

- 배치: 사몽역행 RC(R-05·R-06) 망치·종이 왕, RD(R-07) 연꽃, RF(R-11) 식탁 그림, RG(R-13·R-14) 나팔·실로 그린 문 (`art-drive-r105.js` PLAN).
- 망치는 2키: 보스 대기·체력 절반 위 = 저울판 온전, 보스 체력 절반 이하·격파 = 저울판 일부 깨짐. 안내문대로 애니메이션 프레임이 아니다.
- R08은 안내문의 선택본 v2(종이 밑 실 양각)만 썼다. v1은 HOLD라 받지 않았다. 작은 종이 그림이며 S-07 식탁 가구가 아니다.
- 안내문 한계 유지: 엔진·실GPU·모바일·실플레이 검증은 미검증. 최종 아트 승인은 사용자 몫.

## 2. 코드로 만든 이펙트 텍스처 (임시 그림, 최종 아트 아님)

`scripts/r106-fx-sprites.py`가 numpy로 그린 회색 밝기+알파 그림. 게임에서 영웅 주색·보조색으로 물들인다. 외부 게임 그림을 쓰지 않았다.

| 파일 | 크기(px) | 바이트 | SHA-256 앞자리 | 용도 |
|---|---|---|---|---|
| `assets/r106/fx/glow.webp` | 128×128 | 3,168 | a08107223476… | soft radial glow |
| `assets/r106/fx/orb.webp` | 64×64 | 1,272 | d1a3f665256c… | bright orb with halo |
| `assets/r106/fx/flare.webp` | 256×256 | 10,058 | af103a5ab0ff… | star flare: impact, holy light |
| `assets/r106/fx/ring.webp` | 256×256 | 19,372 | 389d91697444… | energy shock ring (draw squashed for the ground) |
| `assets/r106/fx/halo.webp` | 256×96 | 9,038 | 43fc784adfad… | halo ring over the head |
| `assets/r106/fx/slashline.webp` | 512×96 | 8,884 | 17a8cd9e4c74… | straight slash streak, along +x (tail at x=0, head at x=1) |
| `assets/r106/fx/spark.webp` | 128×32 | 832 | a1572bf01c0a… | tapered spark streak, head at +x |
| `assets/r106/fx/line.webp` | 64×32 | 420 | a7bd654967ef… | glowing segment, ends at x=.25 and x=.75 |
| `assets/r106/fx/wing.webp` | 512×512 | 78,648 | e2a78151f459… | feathered right wing seen from behind; pivot = shoulder |
| `assets/r106/fx/feather.webp` | 48×144 | 4,016 | f960c6f1a027… | single falling feather, quill at bottom |
| `assets/r106/fx/petal.webp` | 64×48 | 1,068 | 79d664006ef3… | flower petal |
| `assets/r106/fx/shard.webp` | 96×192 | 3,112 | 45895ab3ad5f… | crystal shard, point up |
| `assets/r106/fx/pillar.webp` | 128×512 | 9,806 | 3f4ff5b369f1… | column of light rising from the ground |
| `assets/r106/fx/cross.webp` | 256×384 | 14,552 | 79951d0d6a3a… | holy cross glyph with bloom |
| `assets/r106/fx/bolt.webp` | 512×288 | 37,026 | ab0409a7ed68… | lightning bolts (4 rows), from x=0 to x=1 |
| `assets/r106/fx/smoke.webp` | 256×256 | 10,942 | 55c2727763f0… | smoke puff |
| `assets/r106/fx/crack.webp` | 256×256 | 17,552 | 925f50971fb1… | glowing ground cracks (draw squashed) |
| `assets/r106/fx/pixel.webp` | 48×48 | 714 | ff04206891d2… | glowing data square |
| `assets/r106/fx/blade.webp` | 256×72 | 4,594 | ee8591331294… | orbiting sword-light crescent, along +x |
| `assets/r106/fx/flame.webp` | 768×288 | 31,808 | 8d616b707fc3… | flame sheet, 4 frames side by side, base at bottom |
| `assets/r106/fx/spike.webp` | 64×192 | 2,152 | 3b675c112143… | crystal spike rising from the ground |
| `assets/r106/fx/slash.webp` | 512×288 | 18,016 | 3829f5b4f6fc… | crescent sword arc (150 deg), arc centre at pivot |
| `assets/r106/fx/slashwide.webp` | 512×288 | 21,578 | b1009ff72052… | crescent sword arc (220 deg), arc centre at pivot |
| `assets/r106/fx/rune.webp` | 512×512 | 101,340 | 84fb8ed6c375… | rune circle (draw squashed for the ground) |
| `assets/r106/fx/clock.webp` | 512×512 | 100,320 | d68ec596fbcc… | clock circle (draw squashed for the ground) |
| `assets/r106/fx/circuit.webp` | 512×512 | 98,608 | c90433158eec… | circuit circle (draw squashed for the ground) |

## 3. 정본 텍스트

| 파일 | SHA-256 | 용도 |
|---|---|---|
| `story-source/hapil-canon-r106-improved.txt` (사용자 업로드 2026-10-27 05:48, 합일몽세_여섯빛깔의묵시록_1인칭독백_문장개선본.txt) | 369c6a252eef1af4… | 스토리모드 62구역·사몽/역행 42구간 문장 |

## 4. 드라이브 오후 묶음 (2026-10-27, 정적 후보 5개)

ZIP 다섯 개 모두 안내문의 ZIP SHA-256·원본 PNG SHA-256과 일치. 원본 PNG는 ZIP 그대로 두고 투명 여백만 잘라 webp로 줄였다(`scripts/r106-drive-assets-2.py`).

| 게임 파일 | 크기 | 바이트 | SHA-256 | 원본 ZIP (Drive id) | ZIP SHA-256 | 원본 PNG SHA-256 | 배치 | 적용 여부 |
|---|---|---|---|---|---|---|---|---|
| `assets/r106/drive/teal-rail.webp` | 402×360 | 46,978 | 3195c4e5b662… | StoryWorld-Reverse-R00-teal-painted-rail-v2-static-candidate.zip (1b6sjdwjFoox7a0xzXYB_lCLqrk61f92Q) | fc4e4aa4416c… | 7e26976fa81e… | RA(ep8) 생존 3·미로 2·상승 2, 바닥 조각 | 적용(정적). 파란 fringe·여백 미달은 안내문대로 그대로 둠, 바닥 합성·선 연결 미검증 |
| `assets/r106/drive/sunflower-gurney.webp` | 412×420 | 61,550 | 5142577a9403… | StoryWorld-Reverse-R02-sunflower-gurney-static-candidate.zip (14FP_K24Xf4HK--VK8y1k0UG6B8mTAIi4) | d64319e44f8e… | 982fa71c23ac… | RA(ep8) 각 단계 1 | 적용(정적). 이송·꽃닫힘·이름호출 없음, 은재 부활로 해석하지 않음 |
| `assets/r106/drive/link-pillar.webp` | 495×480 | 68,876 | f33288e021f4… | StoryWorld-Reverse-R13-ending-link-pillar-v2-conditional-static.zip (1xAXSxZfeBPIHb9KrFIgx06SOpCbPoRrT) | ee078bb075ac… | 86c6a65c74b6… | RG(ep14) 생존 1·상승 1 | 적용(조건부 정적). 저알파 막이 화면에서 다시 보일 수 있음 — GPU 화면 미검증 |
| `assets/r106/drive/care-record.webp` | 462×320 | 26,776 | 2ffc60222b42… | StoryWorld-Reverse-R16-care-record-spread-static-candidate.zip (1NlIrPtThyZ1QULbjYmHmiu83h76_idC2) | 46b573012dc7… | 0a86d7b9d104… | RG(ep14) 미로 1·상승 1, 바닥 | 적용(정적). 이름(미카엘라) UI·등장 조건 구현 안 함 |
| `assets/r106/drive/mannequin-eating-1.webp` | 202×375 | 27,810 | f4fd69a9c543… | StoryWorld-Samong-S04-mannequin-eating-v2-six-frame-candidate.zip (1sUHX7jw5Z4CZDiBhwS89DwRdIOrBSy_u) | d3194ec77c98… | b0b0f48e1b67… | S-04(ep4) 생존 3·미로 2·상승 2 | 1번 칸만 정적 적용. 6칸 동작은 anchor 미등록·접시 jump로 미적용 |
