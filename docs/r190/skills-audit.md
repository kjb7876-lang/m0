# R190 외부 게임 개발 스킬 감사

검사일: 2026-11-01. 적용 범위는 `kjb7876-lang/m0` 프로젝트의 `.claude/skills/`뿐이다. 사용자 지시와 `CLAUDE.md`, 기존 `storyworld-art-style`을 외부 문서보다 우선한다. 전역·개인 스킬 설치, 플러그인 설치, 엔진 교체, 새 프로젝트 생성, 유료 API 호출은 수행하지 않았다.

## 원본과 라이선스

| 저장소 | 검사한 고정 커밋 | 라이선스 / 저작자 |
|---|---|---|
| [awesome-gamedev-agent-skills](https://github.com/gamedev-skills/awesome-gamedev-agent-skills) | `19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9` | Apache-2.0; Abhishek Barali and contributors, 2026. LICENSE와 NOTICE 보존. |
| [threejs-game-skills](https://github.com/majidmanzarpour/threejs-game-skills) | `8286774b22a2566bf894dbc825825c16921866af` | MIT; Majid Manzarpour, 2026. LICENSE 보존. |

두 라이선스는 상업적 사용과 재배포를 허용하며 해당 고지 보존 조건을 따른다. 원본 저장소를 별도 검사 디렉터리로 받아 문서를 읽었고 자동 설치기는 실행하지 않았다.

## 선정 결과

| 스킬 | 결정 | 적용 기능 또는 제외 이유 |
|---|---|---|
| performance-optimization | 프로젝트에 추가 | 동일 장면의 변경 전후 측정, CPU/GPU 구분, 할당·캐시·리소스 예산 확인. 기존 systematic-debugging의 원인 추적을 보완하는 게임 성능 지침. 엔진별 예제는 설명일 뿐 실행하지 않음. |
| threejs-debug-profiler | 프로젝트에 추가 | Three.js 초기화, 렌더 호출·텍스처 수·로딩·모바일 입력·오디오 문제의 진단 순서와 결과 기록. 렌더 결과 동일성 우선. |
| create-game-assets | 검토만 | 기존 storyworld-art-style, 자산 생성/변환 스크립트와 출처 관리가 이미 있음. 생성기·추가 도구를 설치할 필요 없음. |
| threejs-scene-setup | 검토만 | r186 기반 새 장면/루프/모듈 예제가 기존 고정 런타임과 맞지 않을 수 있음. 이미 작동하는 엔진·로더 보존. |
| game-feel | 검토만 | 기존 피격·카메라·pixelfx 연출이 있음. hit-stop·knockback 예제는 판정/속도감 변경 우려; 이번 범위에 불필요. |
| game-ai | 검토만 | 확정된 AI/경로 탐색 보존 요구. 시각·렌더링 개선에 불필요. |
| level-design | 검토만 | 확정된 맵/동선/충돌 보존 요구. 블록아웃·배치 변경 불필요. |
| save-systems | 검토만 | 기존 저장 형식·마이그레이션·슬롯 QA 보존. 새 저장 시스템 도입 불필요. |
| rpg | 검토만 | 능력치/피해/성장/퀘스트 재설계는 이번 작업 범위 밖. |
| threejs-qa-release | 검토만 | 기존 verification-before-completion 및 r95 전체 검사와 중복. 범용 inspector는 기존 테스트 훅/진단 객체와 계약이 다르므로 설치·실행하지 않음. |

## 실행 코드와 의존성 검사

- 설치한 두 스킬은 Markdown 문서, 참고문서와 표시용 YAML만 있다. 실행 스크립트·설치 훅·패키지 의존성·네트워크 호출이 없다. 참고용 코드 블록도 실행하지 않았다.
- `create-game-assets/scripts/asset_report.py`(140줄)와 `build_preview_sheet.py`(88줄)를 읽었다. Python 3.10+, Pillow `>=10,<14`; 명시한 로컬 파일만 읽고 보고서 또는 출력 이미지를 쓴다. 두 스크립트와 Pillow 의존성은 설치·실행하지 않았다. 최근접 보간 미리보기는 StoryWorld의 실제 렌더링 정책으로 채택하지 않는다.
- `threejs-qa-release/scripts/inspect-threejs-canvas.mjs`(601줄)를 읽었다. `@playwright/test`, `pngjs`를 가져오고 지정한 URL에서 Chromium을 구동하여 캡처·JSON을 쓴다. `__THREE_GAME_TEST_HOOKS__`의 상태/시드/일시정지 훅이 필요하고, 진단 렌더 수치 계약도 기존 StoryWorld API에 맞춰야 한다. 소프트웨어 렌더러 결과를 실기기 성능으로 쓰지 않으며, 새로운 브라우저/검사 의존성을 이 스킬로 설치하지 않았다.
- 상위 `threejs-game-skills/install.sh`는 기본적으로 홈 디렉터리에 전체 스킬을 설치하며 `--force`와 `--prune-managed`에 삭제 경로가 있다. 사용자 프로젝트 범위·덮어쓰기 금지와 맞지 않으므로 실행하지 않고 선택한 폴더만 복사했다.
- 상위 package.json에는 이미지/3D/오디오 생성기와 자격증명 검사 관련 스크립트가 있으나, 해당 파일·프로그램은 설치·실행하지 않았다. Tripo, Gemini, ElevenLabs 및 다른 유료 API는 호출하지 않았다.
- debug-profiler의 참고문서에 등장하는 `threejs-3d-generator`, 자동 해상도/LOD 감소 등의 제안은 자동 실행 권한이 아니다. 이번 작업에서는 원본 화질·자산·게임 규칙 보존 요구가 우선한다.
- `skill-creator` 지침도 전체 읽었다. 이 요청은 개인 스킬 설치가 아니라 사용자가 명시한 프로젝트 범위 외부 스킬 복사이므로 개인 스킬 체크아웃 절차는 적용하지 않는다. 새 스킬 작성·원본 내용 변경 없이 정확한 복사와 라이선스 보존만 수행한다. 변경은 게임 작업 브랜치의 최종 커밋/드래프트 PR에 포함해 보존한다.

## 기존 스킬 중복·보존 검사

기존 12개 스킬의 이름/설명과 README-SOURCES를 확인했다:

- storyworld-art-style
- systematic-debugging, verification-before-completion, test-driven-development
- writing-plans, executing-plans, requesting-code-review, receiving-code-review, writing-skills
- ponytail, ponytail-review, ui-ux-pro-max

두 신규 폴더가 없음을 확인한 뒤 복사했고, 복사 직후 기존 `.claude/skills/` 파일 전체 SHA-256이 복사 전과 같음을 확인했다. 이후 출처 목록인 README-SOURCES에 두 항목 및 범위 규칙만 별도로 추가했다. 기존 SKILL.md·LICENSE·스크립트는 덮어쓰지 않았다.

## 설치 파일 검증

원본 파일과 바이트 동일성 확인 완료. YAML frontmatter의 name/description을 파싱하고 폴더명 일치를 확인했다. 실제 성능 개선 수치는 이 문서에서 주장하지 않으며 실행본 QA 보고서를 따른다.

| 프로젝트 경로 | 바이트 | SHA-256 |
|---|---:|---|
| `.claude/skills/performance-optimization/LICENSE` | 11395 | `6f82dcfeb95a1c0a0452180a3b16f21bf82111780018fed59d95a052b5b75f6c` |
| `.claude/skills/performance-optimization/NOTICE` | 883 | `2dcb65b1c5be24e5ba11e937f3996100f4e980d8cf8ac5b30ba1d70dae6c40f8` |
| `.claude/skills/performance-optimization/SKILL.md` | 10285 | `287161d2ed49670a051271c8fade5a7265fda5109d39c218c02598dca7983e2a` |
| `.claude/skills/performance-optimization/references/profiling-and-budgets.md` | 7344 | `e68c43d5e66ec0f2fe60e0c0121c85360144ab7da5876ce6e2e3f26a2244e284` |
| `.claude/skills/threejs-debug-profiler/LICENSE` | 1073 | `306512561953da83863404efe11ba8845c6a7cf47a8744321c7cbd67f9944304` |
| `.claude/skills/threejs-debug-profiler/SKILL.md` | 2050 | `1cf28e596eec23a88d310cb9ca3b652aebb3e70f889202ddd5988f591ff243bf` |
| `.claude/skills/threejs-debug-profiler/agents/openai.yaml` | 240 | `5cce9559ecd917d440064c9898a776b5a94c897b3c9556e9a12c911e9eff24ff` |
| `.claude/skills/threejs-debug-profiler/references/debug-playbook.md` | 6362 | `be1ad722648aa56ee9c4a93cd1dd58836b1133f0a063026537395b3bc49955ae` |

## 검토한 SKILL.md 체크섬

| 스킬 | SHA-256 |
|---|---|
| performance-optimization | `287161d2ed49670a051271c8fade5a7265fda5109d39c218c02598dca7983e2a` |
| create-game-assets | `36cd246a434fefe1e36feff066597a6268d9f63364bee387ee65a22f03838b5d` |
| threejs-scene-setup | `4f229f27bc84eba0ba9197a775245cf8ddc1ba9959798d6caf9a9f59b4706c17` |
| game-feel | `48971c7ad1fbb39069cb165f0e45f88c13776585870d69d5de8a04bbe0988e28` |
| game-ai | `5c193ac1debc8ec9ed8f44be7a05d12d817ac390e1fa82018bcae4f2ff53fbd8` |
| level-design | `9dd60fec5dc09957f7836739da96b5a2bcff2b46ecaab020f0a9ccff7463ba3a` |
| save-systems | `17a7e580cdb8ee2fe654fe1b2d9ba3066c57ef1ea6a8cd9cc69141ebaea16224` |
| rpg | `023d5305787c1c56b1e2be31aa9a2e4be48aac7e3d828198d4745fd1fabcb807` |
| threejs-debug-profiler | `1cf28e596eec23a88d310cb9ca3b652aebb3e70f889202ddd5988f591ff243bf` |
| threejs-qa-release | `21042d59f3983e487c436f77ce3be0cba6ac4c183e49b40ed495de3a1cdd2d61` |

## 감사 범위의 한계

선택한 문서의 라이선스·파일·정적 코드 검사는 완료했다. 제외한 스킬은 실제 게임에 실행하거나 동작을 검증하지 않았다. 이 표는 스킬 설치·감사 결과이며 게임 테스트 성공을 대신하지 않는다. 실기기 GPU/FPS·모바일 열화·음향 품질은 별도 실행 증거가 필요하다.
