# AGENTS.md — StoryWorld(m0) 공통 지침 (Codex 등)

- 운영 기준: `docs/agent-collaboration.md`. 빌드·검증·서사 규칙: `CLAUDE.md`. 두 문서가 이 파일보다 우선한다.
- 대상은 이 저장소(`kjb7876-lang/m0`, 작업 ID `SW-NNNN`)뿐. hapil-reboot·hapil1 은 수정하지 않는다.
- 작업은 GitHub Issue(`agent-task`)의 `task-contract:v1` 계약에 적힌 `allowed_paths` 안에서만 바꾼다. 같은 파일을 다른 에이전트가 고치는 중이면(열린 PR 확인) 손대지 않는다.
- 변경은 새 브랜치 + PR. main 직접 push·force push 금지. 확정 서사·밸런스·세이브 형식·원본 자산을 바꾸지 않는다(새 파일·오버레이로 덧붙인다).
- PR 본문에: 작업 ID·revision, 기준 커밋, 실행한 테스트 명령과 결과, 미검증 항목. 실행하지 않은 검사를 통과라고 쓰지 않는다.
- 빠른 검사: `python3 -I scripts/collab/test_validate.py`, `python3 -I scripts/collab/validate.py all`, 변경한 오버레이의 `node r96/qa/rNNN/*.cjs`.
- 유료 API·결제·키 발급·비밀정보 커밋 금지.
- 참고 스킬: `.claude/skills/` 의 SKILL.md 는 Codex 도 읽고 따른다. 특히 UI 흐름 버그는 `ecc-click-path-audit`, 브라우저 테스트는 `ecc-e2e-testing`, 배포 뒤 점검은 `ecc-browser-qa`, 그림·이펙트는 `storyworld-art-style`, 렉은 `threejs-debug-profiler`. 출처·고른 이유: `.claude/skills/README-SOURCES.md`.
- 시각 요소를 바꾸는 작업은 모두 `storyworld-art-style` 8절의 7분야 전문가 심사(미술·연출·카메라구도·공간인테리어·조명색채·애니메이션VFX·UX레벨)를 거친다. 10점 만점에 평균 7.77 초과면 통과한다. 심사표와 전후 스크린샷을 남긴다(사용자 2026-11-05).
