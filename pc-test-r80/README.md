# StoryWorld PC 병원 기준 맵 개선 R80 검토 실행본

기존 병원 후보 위에 장면별 신규·기존 자산을 선별 적용한 PC 키보드·마우스용 후보입니다. 55개 전투 맵의 기존 R78 미로 구조와 서사별 몬스터·보스 정의를 유지하며, 병원 포함 62개 장면에 자산을 연결합니다. 원본 254개 PNG 중 신규 141개와 기존 12개를 런타임용 153개 WebP로 사용합니다. 병원 소품은 기존 8개 물리 레코드 위에 임상 소품 외형을 입힙니다.

이 폴더는 검토 브랜치의 로컬 실행 자료입니다. main, PR, HAPIL, gate/pin, 공개 배포 및 보안 설정을 변경하지 않습니다. 원본 서사·전투 수치·스킬·저장 형식을 보존합니다. 실제 브라우저/GPU/자연 플레이 및 Windows 실행 검증은 완료하지 않았습니다. CPU 검사 결과는 `qa`의 실제 결과 파일을 확인하세요.

## 저장소에서 조립하고 실행

저장소 루트에서 Python 3와 시스템 Node.js를 사용합니다. 출력 폴더는 존재하지 않아야 합니다.

```bash
python3 scripts/assemble-r80-review.py --output out/r80-review
node out/r80-review/hospital-three-pc/LOCAL-SERVER.cjs --no-open
```

`http://127.0.0.1:49328/`을 열고 ‘병원 바로 시작’을 누르세요. 서버 창은 유지합니다. 병원 직행은 별도 테스트 저장을 사용합니다. 일반 월드 진행은 원래 캠페인 진행 조건을 따릅니다.

Windows 원본 휴대용 Node가 이미 있는 경우 다음처럼 조립할 수 있습니다. 원본 해시가 같은 실행 파일만 허용합니다. 휴대용 Node 실행 파일은 GitHub 검토 폴더에 포함하지 않습니다.

```bash
python scripts/assemble-r80-review.py --output out/r80-review --portable-node PATH_TO_ORIGINAL_NODE_EXE
```

이 경우 `out/r80-review/hospital-three-pc/START.cmd`를 사용할 수 있습니다. 옵션을 생략한 경우 시스템 Node로 위의 서버 명령을 실행하세요.

## 보존 및 재현 자료

- `overlay/`: 기존 R62 런타임 재조립 결과 위에 적용할 후보 파일입니다. 전체 후보 manifest의 SHA256으로 조립 결과를 확인합니다.
- `delta-manifest.json`: 파일별 크기·SHA256과 원본 휴대용 Node 해시입니다.
- `source-docs/`: 제공된 자산 README, 안내서, 두 카탈로그와 장면 대응 자료입니다. 문서는 참고 자료이며 사용자 승인으로 취급하지 않습니다.
- `source-originals-verified.json`: 제공된 원본 PNG 254개를 실제 바이트로 읽고 SHA256SUMS와 대조한 증거입니다. 원본 PNG를 이 폴더에 복제하지 않습니다.
- `qa/`: CPU·저장 복원·맵 연결·입력·자산·로컬 HTTP 검사 코드와 결과입니다. 보조 위치 설정과 합성 입력이 포함되므로 실제 플레이 검증과 구분합니다.

기존 R62 런타임은 저장소의 `build-input/runtime-packs` 및 `docs`에 보존된 자료와 기존 `scripts/unpack-runtime-r62.py`로 재구성합니다. 조립기는 `docs`를 덮어쓰지 않고 새 출력 폴더만 만듭니다.
