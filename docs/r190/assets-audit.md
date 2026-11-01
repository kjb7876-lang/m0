# R190 무료 자산 검토 — 2026-11-01

범위: 요청한 배포처의 라이선스와 기존 자산 중복을 확인하고, 실제 받은 후보만 원본과 분리해 기록했다. 이 검토가 새 자산의 런타임 채택 또는 그래픽 검증 완료를 뜻하지 않는다. 기존 이미지·음원·게임 파일은 이 자산 검토에서 수정하지 않았다.

## 출처와 선정 결과

| 자료 | 원본 출처의 확인 내용 | 이번 결정 |
|---|---|---|
| [Kenney Particle Pack](https://kenney.nl/assets/particle-pack) | HTTPS 200, CC0 1.0 링크. 페이지는 80개·512×512를 표시 | 런타임 도입 안 함. R106 glow/smoke/spark/ring과 기능 중복; 파일 다운로드 안 함 |
| [Kenney Smoke Particles](https://kenney.nl/assets/smoke-particles) | HTTPS 200, CC0 1.0 링크. 페이지는 70개 표시 | 기존 칠한 `r106/fx/smoke.webp` 재사용 우선. 파일 다운로드 안 함 |
| [para Animated particle effects #2](https://opengameart.org/content/animated-particle-effects-2) | HTTPS 200, 저작자 para, CC0. blood hit 셀 128×128·16프레임·30fps | `blood_hit_02.png` 1개 다운로드·PNG 검증·시트 확인. 단색 실루엣과 계단 가장자리로 기존 그림체 대비 개선 불확실; **미적용** |
| [Kenney RPG Audio](https://kenney.nl/assets/rpg-audio) | HTTPS 200, CC0 1.0 링크, 50개 표시 | 파일 다운로드 안 함. 현 런타임에 재질별 발소리·무기 타격이 이미 존재해 추가 필요를 입증하지 못함 |
| [Kenney Impact Sounds](https://kenney.nl/assets/impact-sounds) | HTTPS 200, CC0 1.0 링크, 130개 표시 | 파일 다운로드 안 함. 기존 melee-impact 등과 중복; 청취·믹스 개선 근거 없는 추가 안 함 |
| [Poly Haven textures](https://polyhaven.com/textures) / [license](https://polyhaven.com/license) | 공식 license 검색 도구 응답은 모든 자산 CC0·상업 이용 허용 확인. 직접 HTTP 요청은 403 실패 | 개별 텍스처 미선정·미다운로드·미적용. 병원은 원본 아틀라스 사각형을 샘플링하므로 반복 PBR 재질의 단순 교체는 부적합 |
| [Quaternius Ultimate Monsters](https://quaternius.com/packs/ultimatemonsters.html) | HTTPS 200, CC0 1.0 및 개인·상업 프로젝트 이용 가능 명시. 공식 Download가 공개 Drive 폴더를 가리킴 | `Big/Blends/Demon.blend`·원본 아틀라스 다운로드 후 공식 Blender로 독립 2D 시범 제작. 둥근 만화풍 형상 때문에 런타임 미적용 |

Kenney의 [공식 지원 안내](https://kenney.nl/support)는 자산 페이지의 CC0 파일이 상업 프로젝트에도 사용 가능하며 별도 크레딧이 필수는 아니라고 명시한다. 로고는 자산 라이선스와 별도이므로 사용하지 않았다. Poly Haven의 사이트 텍스트·예제 렌더 이미지는 CC0 자산 자체와 구분되므로 재배포하지 않았다.

직접 받은 페이지의 HTTP 상태·바이트 수·페이지 SHA-256·CC0 링크는 `asset-staging/r190/source-verification.json`에 남겼다. **페이지 해시는 자산 파일 해시가 아니다.** 검색 도구의 Poly Haven 라이선스 응답과 직접 다운로드 실패도 구분했다. 모든 요청은 기본 프록시와 TLS 검증을 사용했다.

## 실제 다운로드한 원본

| 파일 | 저작자·라이선스 | 크기·SHA-256 | 변환·적용 |
|---|---|---|---|
| `asset-staging/r190/originals/para-blood-hit-02.png` | para · CC0 1.0 | 38,081 bytes, 512×512 RGBA PNG; `eef5bcd4096e70a1c52a060731108a4bc6e868ae65a7fc0f5467878f65180fc1` | 원본 그대로. 변환 없음. 런타임 경로 없음 |
| `asset-staging/r190/originals/Demon.blend` | Quaternius · CC0 1.0(원본 배포 페이지) | 2,985,780 bytes; `86a9aebbfe9fd4ae55828517f101867338848f4096e2609117c3c0d68520e09b`; 헤더 `BLENDER-v306` | 원본 그대로 보존. 별도 파생물로 4방향×Idle 4프레임 2D 실험. 런타임 경로 없음 |

각 다운로드 URL·원본 규격·검증 결과·선정/보류 이유는 `blood-hit-manifest.json`, `monster-manifest.json`, `atlas-manifest.json`에 기록했다. 원본 `Atlas_Monsters.png`는 9,007 bytes, 1024×1024이며 SHA-256은 `b970ed1359ce749fd81a8395d58ff5f3044d843213e17fb94b97892d417c0af9`다. 일시적 인증 다운로드 URL은 저장하지 않았다. 다운로드하지 않은 팩의 SHA-256이나 바이트 크기는 만들지 않았다.

Quaternius 폴더에 포함된 License.txt는 CC0를 명시하지만 첫 줄의 팩 이름은 **Ultimate Platformer Pack**이다. 원본 Ultimate Monsters 페이지가 CC0와 상업 이용을 명시하고 직접 해당 폴더를 연결한다는 근거와 함께 이 불일치를 그대로 기록했다. 파일 이름을 고쳐 라이선스 문서를 꾸미지 않았다.

## 기존 자산을 우선한 근거

- `assets/r163/pixelfx/index.json`: 30개 프레임 시트. 피격·검붉은 폭발·회복·정화 구슬·운석·촉수·대지 균열·마력 폭발 이미 존재.
- `window.__STORYWORLD_FX_SPRITES_R106__`: 색상 팔레트로 칠하는 smoke/glow/flare/spark/ring/crack/spike 등 기존 스프라이트. 새 Kenney 파일을 붙이기 전에 이 그림을 재사용하는 것이 프로젝트 아트 규칙과 맞는다.
- 재사용 후보 7종의 정확한 크기와 SHA-256은 `asset-staging/r190/existing-fx-inventory.json`에 기록했다. 기존 파일 변경 없음.
- 빌드 런타임에서 `.ogg`, `.mp3`, `.wav` 파일은 총 294개. `assets/r93/audio`에 돌 타일·젖은 진흙·자갈·목재 각각 4종 발소리(16개), 횃불·물방울 루프가 존재한다. `audio/rc133/processed/melee-impact` 등 무기 충격음도 존재한다. 개수는 품질 증명이 아니며, 미청취 파일의 완성도를 평가하지 않았다.
- `visual-r93-ui.js`는 재질에 따라 발소리를 선택하고, `.78` 이동 거리 뒤 재생하며, 1.2칸 이상의 순간 이동은 발걸음으로 세지 않는다. 지연된 디코딩 뒤 플레이어·방·오디오 컨텍스트가 바뀌면 재생을 취소하고, 피크가 큰 전투 소리를 가리지 않도록 발소리 gain `.065`를 사용한다. 소리 파일을 추가하는 것만으로 이 구조가 개선된다고 판단할 근거가 없다.
- `world-tiles-r118.js`는 정원·거미동굴·무너진 성·주방·금고·산장·설원·공방의 기존 칠한 텍스처를 명시적으로 매핑한다. `ep1a08` 병원은 반복 physical UV가 아닌 원본 시트 사각형을 사용하여 이 교체 경로에서 제외된다. 벽·바닥·통행 판정에 새 PBR 텍스처를 일괄 적용하지 않았다.

## 몬스터 변환 실험

처음에는 Blender 실행 파일과 Python bpy 모듈이 없었고 설정된 pip 소스에서도 bpy를 찾지 못했다. 이후 [Blender 공식 4.5 배포 목록](https://download.blender.org/release/Blender4.5/)에서 Linux x64용 **Blender 4.5.15 LTS** 휴대용 배포본을 확인해 해결했다. 공식 SHA-256 파일과 378,036,492 bytes 아카이브의 해시가 `0d2b8bb2efe97e6c8eb57de6b7322f8800e1984e3125b60decca5f6771e4773e`로 일치한다. 실행 파일도 아카이브 구성원과 대조했다(`7421ab1c52a25df4b5dbb0f2ee3f008d9f71f4bb437ff69a1d0af78dfec50323`). 일시적으로 잘린 실행 파일이 발견되어 실행을 중단하고 검증된 아카이브의 정확한 구성원으로 복원했다. 공식 다운로드 영수증·체크섬은 `blender-download-receipt.json`, `blender-4.5.15.sha256`에 남기고 `tools/` 전체(대용량 실행 도구와 아카이브)는 `.gitignore`로 제외했다.

`--background --factory-startup --disable-autoexec`로 실행하고 `open_mainfile(...,use_scripts=False)`로 원본에 포함된 스크립트의 자동 실행을 금지했다. 무료 CPU Cycles(24 samples, 2 threads)를 사용했으며 원본 .blend와 아틀라스는 덮어쓰지 않았다. 파일의 14개 애니메이션을 확인했고 이번 시범은 **Idle의 0·8·16·24 프레임을 앞·오른쪽·뒤·왼쪽에서 렌더한 16개 RGBA 이미지**다.

- 파생물: `asset-staging/r190/monster-proof/idle-*.png`(각 192×256), `idle-four-directions.png`(시트), `contact-sheet.png`(검토판), `idle-four-directions.gif`(동작 비교).
- 변환 코드: `render-monster.py`, `assemble-proof.py`. 원본 구조·뼈 검사: `inspect-monster.py`, `check-monster-feet.py`.
- 카메라: 고정 직교 투영, 고도 30°, 원점의 발 기준은 (96,226). 4방향과 전 프레임에서 셀 크기·카메라 배율을 고정했다.
- 첫 시범의 무기 가장자리 잘림을 알파 경계로 검출해 카메라 범위를 넓혔다. 초기 실패는 `monster-preflight-framing.json`에 보존했다. 최종 몸체·무기의 불투명 경계는 셀 가장자리에 닿지 않는다.
- 무한 바닥 shadow catcher가 투명 모서리에 옅은 알파를 남기는 것도 검출해 발밑의 작은 원판으로 제한했다. 하지만 최종 Cycles 합성 결과의 모서리에 5–12/255 알파가 남아 **투명 모서리 검사 실패**다. 접지 그림자는 Blender에서 렌더한 그림자이며, 이 실패를 숨기기 위한 수동 픽셀 수정은 하지 않았다.
- Idle 4개 표본에서 `Foot.L`, `Foot.R`의 머리·꼬리 세계 좌표가 완전히 같아 발 뼈의 흔들림이 없다. 원점의 투영 기준과 실제 발가락 픽셀의 최하단을 같은 것으로 주장하지 않는다.
- 실제 검토판을 확인한 결과 둥근 얼굴·몸통, 큰 눈, 단순 아틀라스 질감이 기존 칠한 고딕 호러와 맞지 않고 투명 모서리 검사도 실패하여 **런타임 채택 거절**. 기존 몬스터 교체 없음. 파생물의 7개 자동 검사 중 6개 통과·1개 실패이며 `assemble-proof.py`는 이 실패 때문에 종료 코드 1을 반환한다. 이를 전체 통과로 보고하지 않는다.
- 전체 Walk/Run/Weapon/Death 루프, 실제 게임의 몬스터 크기·가림·플레이 검증은 **미검증**이다. 작은 시범 셀에 들어간다는 사실을 게임용 최종 아트 합격으로 보고하지 않는다.

최종 해시·알파 모서리·불투명 경계·입력 및 Blender 체크섬은 `monster-proof/validation.json`, 렌더 조건은 `monster-proof/render-manifest.json`에 기록했다.

## 사용 도구와 보존 범위

- 원본 사이트 확인: 웹 검색 및 HTTPS read-only 요청.
- 공식 공개 Drive 다운로드: `google-drive` 스킬/플러그인으로 해당 폴더와 파일만 읽음. 개인 Drive 검색·변경·공유 변경 없음.
- PNG 헤더·픽셀 규격 검증: Pillow `verify()` 및 직접 시트 시각 검사. Blender 파생물은 Pillow로 시트·GIF만 조립했으며 원본 이미지 편집 없음.
- SHA-256: Python hashlib. 유료 API 호출·결제 없음.
- 이 자산 검토가 쓴 경로는 `docs/r190/assets-audit.md`와 `asset-staging/r190/`뿐이다. 런타임 매니페스트에 후보를 넣지 않았다. 병원 실행본 개선과 테스트 결과는 메인 작업 보고서에서 별도로 확인한다.
