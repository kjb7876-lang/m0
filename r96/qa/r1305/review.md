# R1305 3D 영웅 10명 — 7분야 심사 (임시: 헤드리스 SwiftShader 캡처 기준, 그래픽 검증 아님)

대상: 설정 '3D 영웅(시험)'(기본 끔)을 켰을 때 환도·서하·네온·미카엘라·라우렌·헌터·슬레이어·거너·페르소나·EGO 의 몸 그림.
자료: `heroes-3d.png`(960×540, 영웅 자리 220×250 자르기; 맨 앞 2D 환도 기준, 윗줄 3D 대기·아랫줄 3D 공격), `heroes-3d-zoom.png`(같은 캡처 영웅 둘레 2배).

## 1차 심사(먹 테두리 전) — 미달
캡처를 키워 보니 3D 몸에 외곽선이 없어 한지빛 바닥에 묻힘(특히 흰 두건의 환도는 거의 안 보임). 2D 영웅은 붉은 먹 외곽선으로 바닥에서 뜬다.
미술 6.6 · 연출 7.6 · 카메라 7.6 · 공간 7.6 · 조명색채 6.4 · 애니VFX 7.4 · UX 6.9 → **평균 7.16(미달)**.

## 고침
- 스킨 몸마다 뒤집은 껍질(BackSide) 먹 테두리 `#3a1612`, 두께 0.024m(60px 키에서 약 1px). 같은 뼈대에 묶여 동작을 따라가고, 몸 투명도에 맞춰 함께 옅어짐.
  gltfpack 양자화 메시는 노드 scale 이 1e-4 수준이라 두께를 몸 로컬 단위로 나눠 넣음(처음엔 이 때문에 테두리가 안 보였음).

## 2차 심사(먹 테두리 후)

| 분야 | 점수 | 근거 | 고칠 점 |
|---|---|---|---|
| 1. 미술감독 | 7.8 | 먹 테두리로 2D 수묵 외곽선과 같은 말투, 10명 모두 원화(hero_refs) 실루엣·옷색 유지(서하 흰 코트·광륜, 페르소나 붉은 망토, 거너 흰 코트) | TRELLIS 텍스처라 얼굴·작은 장식은 60px 에서 뭉개짐. 절차형 무기(창·지팡이·활·라이플)는 원화에 없는 임시 모양 |
| 2. 연출감독 | 8.0 | 인물 정체성·서사 변경 없음, 페르소나·EGO 는 형상(라우렌+R1113, 환도+R1046)일 때만 자기 모델 | — |
| 3. 카메라·구도 | 7.8 | 10명 모두 키 56~61px(2D 기준 54px), 발 기준점은 R1304 검사 2.5px | 공격 자세에서 무기가 화면 위로 길게 나가는 영웅(슬레이어) 있음 |
| 4. 공간·환경 | 7.9 | 맵·조형물 변경 없음, 같은 깊이 층 2라 벽에 가려짐(R1304 검사 통과), 2D 유령 복제 숨김 | 벽 뒤 유령 생성 장면은 이번 캡처 자리에서 재현 안 됨(미검증) |
| 5. 조명·색채 | 7.7 | R1304 한지 톤 셰이더 그대로 + 먹 테두리로 명도 대비 확보, 칼날 metalness .65 · roughness .25 로 몸과 재질 구분 | 환경맵 없는 장면이라 금속 반사는 약함. 어두운 지역(사몽) 미확인 |
| 6. 애니메이션·VFX | 7.8 | Idle·Walk·공격 3클립 10명, 환도 걷기 보폭 30→24°·로브 자락 웨이트로 갈라짐 줄임(CPU 검사 661/661→285/661), 스킬 이펙트(광륜·오라)는 2D 그대로 위에 남음 | TRELLIS 9명은 사용자 공용 프리셋 모션이라 영웅별 고유 동작 아님 |
| 7. UX·UI·레벨 | 8.3 | 기본 끔(0바이트), 지금 영웅 GLB 하나만(3.5~4.3MB) 처음 볼 때 받음, 재방문 재요청 없음, 설정 한 줄 '3D 영웅(시험)' | 영웅마다 첫 로드 2~4초(헤드리스) 동안 2D 로 보임 |

**평균 7.90 (통과 기준 7.77 초과).** 헤드리스 결과라 '임시'. GPU 실기기·모바일 실기기·자연 플레이·어두운 지역은 미검증.

## 자산 적용표

| 영웅 | 원본(읽기 전용, 저장소에 넣지 않음) | TRELLIS.2 결과(저장소에 넣지 않음) | 배포 GLB | 적용 |
|---|---|---|---|---|
| seoha | hero_refs/seoha.jpg 1025f09a53cd… (443,989) | trellis_raw/seoha_trellis2.glb d53fcb4f75ab… (11,882,348) | assets/r1305/seoha-3d.glb 2c6b84e84327… (3,726,644) | 적용 |
| neon | hero_refs/neon.jpg 6bd06075c3e4… (605,965) | trellis_raw/neon_trellis2.glb f31e594f92e8… (11,532,216) | assets/r1305/neon-3d.glb 884acb29389e… (3,590,180) | 적용 |
| lauren | hero_refs/lauren.jpg e3361ac4eeff… (463,426) | trellis_raw/lauren_trellis2.glb af27e5353c7e… (12,367,000) | assets/r1305/lauren-3d.glb 152f45040190… (3,960,932) | 적용 |
| michaela | hero_refs/michaela.jpg b0a8d96e96c6… (422,650) | trellis_raw/michaela_trellis2.glb b4747846b8f2… (11,916,640) | assets/r1305/michaela-3d.glb 9f4d1647ce14… (3,836,956) | 적용 |
| slayer | hero_refs/slayer.jpg b0e875a3fbdb… (461,465) | trellis_raw/slayer_trellis2.glb 5085a90d1502… (12,744,308) | assets/r1305/slayer-3d.glb 8e5d49c66c55… (3,996,688) | 적용 |
| hunter | hero_refs/hunter.jpg 1898e03fbddc… (420,040) | trellis_raw/hunter_trellis2.glb df47d309df79… (13,059,936) | assets/r1305/hunter-3d.glb 64653f400c09… (4,146,516) | 적용 |
| gunner | hero_refs/gunner.jpg 32d9c847aeda… (433,578) | trellis_raw/gunner_trellis2.glb e3084d15c74b… (11,070,140) | assets/r1305/gunner-3d.glb 21cc38df3fdd… (3,510,360) | 적용 |
| persona | hero_refs/persona.jpg 4b7573d2ef15… (447,098) | trellis_raw/persona_trellis2.glb 44d138790bab… (13,521,064) | assets/r1305/persona-3d.glb 8857875f8c60… (4,277,816) | 적용 |
| hidden_ego → ego | hero_refs/hidden_ego.jpg 8e24e3adfe66… (502,924) | trellis_raw/hidden_ego_trellis2.glb f53c97bf3c91… (12,379,200) | assets/r1305/ego-3d.glb 75af9915e455… (3,924,108) | 적용 |
| hwando | hwando_hero_trellis2_clean.glb e437155cf182… (15,498,476, R1302 원본) | — | assets/r1302/hwando-3d.glb ab734a8760b2… (3,890,580) | 교체(Blender 5.3 재생성) |

hero_refs/hwando.jpg 는 이번에 쓰지 않음(환도는 R1302 원본 GLB 재사용). TRELLIS 9명 중 무기가 있는 5명(라우렌 창·미카엘라 지팡이·슬레이어 대검·헌터 활·거너 라이플)의 무기는 사용자 공용 스크립트의 절차형 임시 무기(최종 아트 아님).

## 파이프라인
hero_refs → `gradio_client` + HF_TOKEN → Space `microsoft/TRELLIS.2`(start_session → preprocess_image → image_to_3d seed 1·1024 → extract_glb 300k·2048) →
`tools/r1305/blender_heroes_r1305.py`(Blender 5.3.0: 사용자 공용 프리셋·12뼈·3클립, decimate .30 + 복셀 대리 메시 자동 무게, 로브 자락 70/15/15) →
gltfpack 1.3(native, `-tw -tl 1024 -kn`) → `tools/r1302/retex.py` WebP 1024 q88 → `assets/r1305/<id>-3d.glb`.
환도: `tools/r1305/blender_hwando_walk_r1305.py` → gltfpack → retex → `tools/r1304/rebalance-hwando-robe.cjs`(R1305 입력 등록) → `assets/r1302/hwando-3d.glb`.
