# StoryWorld(m0) AI 협업 운영 기준

대상: `kjb7876-lang/m0` 하나. 작업 ID 는 `SW-NNNN`. hapil-reboot·hapil1 은 다른 프로젝트라 이 루트에서 수정하지 않는다(참고만).
설정값은 `ops/collab.config.json`, 검사기는 `scripts/collab/validate.py`(단위 시험 `scripts/collab/test_validate.py`, CI `Collab contract check`).

## 1. 역할
| 누구 | 맡는 일 | 하지 않는 일 |
|---|---|---|
| Claude Code(클라우드 세션) | 요구 정리, 작업 분해·완료 조건, 배정, 결과 검증, 통합, 공식 상태 확정 | 자기 구현을 자기 혼자 최종 통과 |
| Dots(ChatGPT) | 그림·스프라이트·이펙트 제작과 시각 검수, Drive 업로드, 지정된 Codex 작업 전달 | 게임 저장소 수정, 폴더 밖 접근, 결제 |
| Codex Cloud | 지정 범위 코드 변경·테스트·PR, GitHub PR 리뷰 | 범위 밖 수정, main 직접 반영 |
| GitHub | 공식 작업 원장(Issue `agent-task`), 코드·PR·CI 기록, 운영 현황판(Issue `ops-board`) | — |
| Google Drive | 원본·생성 자산, 비공개 상세 manifest·검수 문서, Dots 지시 전달 창구 | 게임 런타임 CDN, 공식 상태 원장 |
| GitHub Actions | AI 판단 없는 반복 검사(빌드·회귀·계약·manifest) | 댓글·이슈 본문을 명령으로 실행 |

- 작은 수정에 세 AI 를 모두 부르지 않는다. 자산은 Dots, 코드는 구현자 1명.
- 독립 리뷰: Claude 구현 → Codex 리뷰(PR 을 ready 로 바꾸면 자동, 또는 `@codex review`). Codex 구현 → Claude 리뷰. 시각 변경은 그림을 실제로 본 검수자가 확인.
- 같은 파일을 Claude 와 Codex 가 동시에 고치지 않는다. 동시 실행: 코드 1, 독립 자산 1.
- Codex 경로는 작업마다 하나만: `via-dots` | `github-codex-mention`(PR 댓글 `@codex …`) | `github-codex-review`. 같은 작업을 두 경로로 보내지 않는다.
- Claude 내부 서브에이전트를 쓴 것을 Dots·Codex 가 했다고 보고하지 않는다.

## 2. 작업 계약
필수 필드(검사기가 확인): task_id, project, repository, issue_number, revision, goal, acceptance_criteria, non_goals, allowed_paths, base_commit, input_manifest_hash, executor, reviewer, dependencies, status, dispatch_id, provider_task_id, attempt_count, artifact_manifest, evidence, blocked_reason, approval_scope, completion(`pr-opened|merged|deployed|asset-delivered|report`).

- 공식 원본: GitHub Issue 본문의 `task-contract:v1` JSON + 상태 라벨 `status:*`. 변경·증거는 그 Issue 댓글로만 남긴다. Drive 의 지시서는 전달용 복제본(revision·입력 해시 포함)이다. `ops/tasks/*.json` 은 CI 로 검사하는 견본·시험 계약이다.
- 상태: `QUEUED → RUNNING → REVIEW → READY_FOR_APPROVAL → DONE`, 예외 `NEEDS_FIX·BLOCKED·PAUSED·CANCELLED`. 허용 전이는 설정 파일의 `transitions`. 상태 확정은 Claude 총괄만.
- 중복 판단 키: `repository + task_id + revision + input_manifest_hash`.
  - 외부 요청 전에 dispatch 기록(`dispatch_id`, 상태 `requested`)을 Issue 댓글로 남기고, 실제로 받은 작업 ID 를 `provider_task_id` 에 적는다.
  - 응답이 없거나 성공 여부가 불명확하면 `unknown` → 다시 보내기 전에 기존 작업이 있는지 먼저 찾는다(검사기 판정 `CONFIRM_EXISTING`).
  - 결과의 revision·입력 해시가 현재 계약과 다르면 적용하지 않는다(`STALE`). PAUSED/CANCELLED 작업의 결과는 받지 않는다.
  - 요구가 바뀌면 revision 을 올리고 영향받는 검증을 다시 한다.
- "딱 한 번 실행"을 보장하지 않는다. 중복 요청이 생겨도 키·revision 검사로 중복 변경이 반영되지 않게 한다. GitHub Actions concurrency 는 Dots·Codex 작업을 잠그지 않는다.

## 3. 자산 전달 (Drive)
- 승인 폴더(ID 는 비공개 운영 메모에만): 지시 / 결과 / Storyworld_Assets. 결과는 버전 이름(`_v1`,`_v2`)으로 새로 올리고 덮어쓰지 않는다. 폴더 생성·접근이 거부되면 다른 이름·경로로 우회하지 않는다.
- manifest(`storyworld.asset-manifest/v1`): task_id, revision, expected_count, assets[asset_id, file, mime, bytes, sha256, origin, license, target_path, format{width,height,alpha}, sprite{cell,frames,directions,pivot}, review]. 공개 저장소에는 논리 asset_id·해시·규격만, Drive 파일 ID·미공개 서사는 넣지 않는다.
- 전달 순서: 파일 선택·생성 → 로컬 형식·해시 → 업로드 → 업로드된 크기 확인 → 수신 측 재다운로드 해시 비교 → 전부 검증되면 전달 완료 기록. 일부만 오면 완료가 아니다(`일부만 전달됨`).
- 이미지: 실제 결과 파일을 확보해야 생성 완료. 프롬프트만·임시 도형은 완성품이 아니다. 프레임 수·잘림·배경·투명도·방향·기준점을 잰다.
- ZIP: 풀기 전에 경로 이탈·심볼릭 링크·실행/스크립트 파일·비정상 용량을 검사(`validate.py zip`). 받은 스크립트는 실행하지 않는다. 받은 파일은 각각 새 빈 폴더에서 `python3 -I` 로만 다룬다.
- Drive 는 런타임 CDN 이 아니다. 승인된 자산만 `r96/runtime-text/assets/rNNN/` 로 복사하고 index.json 에 출처·해시를 남긴다.

## 4. 클라우드 실행·트리거
- 지속 실행은 claude.ai 클라우드 세션과 그 예약 작업으로 한다(집 PC 불필요).
  - 매시 13분: Drive 확인 + 운영 현황판 명령 처리·갱신.
  - Dots 결과 15분 확인(사용자 요청, 자기 재예약 방식).
  - 매일 04:05 KST: 작업 재개.
- GitHub 이벤트: Claude 가 연 PR 은 구독해서 CI·리뷰·병합 이벤트로 깨어난다. Codex 리뷰는 PR 을 ready 로 바꿀 때 자동 요청된다.
- 같은 큐를 읽는 예약을 새로 만들지 않는다. 변경이 없으면 조용히 끝낸다. Claude 자신의 현황판 갱신은 명령으로 읽지 않는다(자기 호출 방지: 소유자 댓글만, 처리한 댓글은 ✅ 반응).
- 재시도: 네트워크·일시 서버 오류만 최대 2회(총 3회). 사용량 한도는 재개 시각까지 대기. 인증·권한·정책 거부·저장 용량 부족은 원인 기록 후 중단(403 을 일시 장애로 보지 않음). 같은 목표 수정은 최대 3회, 개선 없으면 BLOCKED 로 원인·선택지 보고.

## 5. 리뷰·검증
- 리뷰 요청에는 요구사항·revision·기준/변경 커밋·diff·자산·실제 테스트 명령과 로그·미해결을 붙인다.
- 판정: PASS / NEEDS_FIX / BLOCKED / UNVERIFIED. 지적에는 심각도·재현 방법·파일/자산·요구와의 차이·최소 수정.
- 검사: 빌드, 자산 누락·경로, 형식·크기·해시·프레임, 회귀(CPU 검사·전체 묶음), 세이브 호환, 콘솔 오류, 범위에 맞는 게임 동작, 화면 캡처.
- 헤드리스 ≠ 그래픽 검증, 모바일 에뮬레이션 ≠ 실기기. 실행하지 않은 검사는 미검증으로 적는다.
- 리뷰 요청 ≠ 리뷰 도착. 봇의 지적 없음이 테스트·배포 승인을 대신하지 않는다.

## 6. 승인·통합·배포
- 사용자 지시(2026-11-04): "배포도 알아서, 심각한 것만 물어보기" → CI 초록 + 독립 리뷰(Codex 리뷰가 도착했거나, 시각 변경은 화면 확인) 후 Claude 가 squash 병합하고 공개 URL 을 확인한다.
- 다음은 반드시 사용자에게 먼저 묻는다: 확정 서사·밸런스·맵 순서 변경, 세이브 형식 변경, 원본 자산 삭제·덮어쓰기, 공개 권한·공유 범위 변경, 비용이 생길 수 있는 기능, 다른 프로젝트 저장소 변경.
- `/approve #PR 커밋` 은 그 커밋에만 유효하다. 이후 커밋이 바뀌면 영향받는 검증·승인을 다시 본다. AI·봇 댓글은 승인이 아니다.
- 금지: main 직접 push, force push, 승인 검사·보안 제한 끄기, 유료 API·결제·키 발급.

## 7. 모바일 운영 (Issue `SW 운영 현황`)
- 현황판 이슈 본문: 진행 중 / 검토 대기 / 승인 필요 / 차단(정확한 원인) / 최근 완료 / 관련 PR·로그·Drive 문서 이름 / 마지막 동기화(KST).
- 명령은 저장소 소유자 댓글만: `/status`, `/new 제목 — 내용`, `/pause SW-n`, `/resume SW-n`, `/cancel SW-n`, `/approve #PR sha7`, `/stop-all`, `/start-all`. 매시 점검에서 처리(실시간 아님). `/stop-all` 은 새 배정 중지이고, 진행 중인 외부 작업(Dots·Codex)은 취소 가능 여부를 확인해 따로 적는다.
- 알림: 완료·실질 차단·승인 필요만. 같은 차단은 한 번만. 00:00~07:00 KST 는 모아서 07시 이후 요약. 알림 끄기와 작업 중지는 다르다.

## 8. 비용
- 기존 구독(Claude, ChatGPT/Dots·Codex)과 GitHub 무료 범위 안에서만. API 키 발급·결제·초과 사용·유료 서버 가입은 하지 않는다. 구독 로그인 권한과 API 사용 권한은 다르다. 과금이 불명확한 기능은 켜지 않고 보고한다.

## 9. 복구
- 작업이 꼬이면: 해당 Issue 를 `PAUSED` 로, 마지막 정상 커밋·manifest 해시를 댓글로 고정, revision 을 올려 다시 배정.
- 잘못 병합: 새 브랜치에서 revert PR(강제 push 금지).
- Dots 가 응답하지 않으면: 지시서 재게시 대신 수신 확인 파일 유무부터 본다. 2회 점검 동안 없으면 BLOCKED(사용자에게 Dots 세션 확인 요청).
