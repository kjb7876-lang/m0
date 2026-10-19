# StoryWorld 메모리 조사

사용자가 제공한 Windows 관측은 RAM 16GB 중 물리 사용 약 8.1GB, 시스템 커밋 61.7/63.8GB, `WerFault.exe` 오류 `0xc000012d`였습니다. 자세히 탭에서 가장 큰 단일 프로세스는 약 591MB였고, 재시작 뒤 커밋은 8/58.7GB로 내려갔습니다. 이 정보만으로 StoryWorld를 원인으로 지목하지 않습니다. Microsoft의 [NTSTATUS 정의](https://learn.microsoft.com/en-us/openspecs/windows_protocols/ms-erref/596a1078-e883-4972-9bbc-49e60bebca55)는 `0xC000012D`를 `STATUS_COMMITMENT_LIMIT`로 정의합니다.

## R73 브라우저 결과

정확 SHA `6790a0d5af53639515aa088fff3401e33db8d71d`의 [메모리 브라우저 실행](https://github.com/kjb7876-lang/m0/actions/runs/39178641950)에서 23단계가 모두 통과했습니다. [memory artifact 12155492756](https://github.com/kjb7876-lang/m0/actions/runs/39178641950/artifacts/12155492756)에 `memory-browser.json`과 단계별 프로필을 보관합니다.

검사는 실제 게임 UI에서 새 게임, 황금실 편집기 닫기, 선택 저장 복원, ep1b09 생체 부트로더 진입·귀환을 세 차례 반복했습니다. 보스 HP/플레이어 생존·위치는 라벨이 있는 테스트 fixture였습니다. 이미지 로드 실패 한 번과 프레임 예외 한 번도 의도적으로 만들고 복구 UI·저장 재접속을 확인했습니다. 이는 사용자의 PC 오류 재현이 아닙니다.

| 단계 | GC 후 JS 힙 | DOM 리스너 | RAF 대기 | 타이머·간격·object URL | 캔버스 RGBA 추정 |
|---|---:|---:|---:|---:|---:|
| 새 게임 | 33.26 MiB | 130 | 1 | 각각 0 | 13.18 MiB |
| 보스 왕복 후 슬롯 복원 1 | 38.02 MiB | 138 | 1 | 각각 0 | 36.59 MiB |
| 보스 왕복 후 슬롯 복원 2 | 38.91 MiB | 138 | 1 | 각각 0 | 42.21 MiB |
| 보스 왕복 후 슬롯 복원 3 | 39.61 MiB | 138 | 1 | 각각 0 | 42.22 MiB |
| 예외 후 선택 저장 재접속 | 33.48 MiB | 133 | 1 | 각각 0 | 13.18 MiB |

`canvas width × height × 4`는 캔버스 버퍼의 거친 추정치이며 실제 할당·GPU VRAM 값이 아닙니다. 슬롯 복원 뒤 힙은 38.02→38.91→39.61 MiB로 증가했고 보스 전투 중 최대 42.52 MiB까지 관측됐습니다. 이 반복만으로 무누수나 장기 안정성을 주장하지 않습니다. 프레임 예외 후 선택 저장을 재접속했으며 힙은 33.48 MiB였습니다. 브라우저 종료 뒤 테스트가 관찰한 OS 프로세스 5개가 모두 사라졌습니다.

## 범위와 한계

검사는 GitHub Actions의 격리된 Linux Chromium과 SwiftShader 소프트웨어 GPU에서 실행했습니다. 실제 휴대폰, 물리 GPU, 장시간 실제 전투, 사용자의 Windows 커널·그래픽 드라이버·페이지 파일 및 시스템 커밋은 측정하지 않았습니다. 브라우저 프로세스 RSS/PSS와 JavaScript 힙은 Windows 전체 시스템 커밋을 뜻하지 않습니다. 따라서 위 수치로 사용자의 `STATUS_COMMITMENT_LIMIT` 원인이나 해결 여부를 확정하지 않습니다.

UI 이미지 콜백 중복 방지는 고정 이미지의 `load` 등록이 반복 메뉴 갱신 중 누적되던 관측을 대상으로 합니다. 제한된 캐시와 Three 리소스 정리도 코드·브라우저 계측으로 확인했지만, 그것이 Windows 커밋 오류의 원인이었다고 결론 내리지 않습니다. 드라이버, 보안 설정, 페이지 파일은 변경하지 않았습니다.
