# 스토리월드 R62 전용 웹 배포 준비본

사용자가 제공한 기존 공개 저장소 `kjb7876-lang/m0`를 배포 대상으로 확정했다. 연결된 GitHub에서 저장소 접근·쓰기 권한을 확인했으며, 사용자가 코드 업로드와 GitHub Pages 공개 배포를 승인했다. 현재는 승인된 배포를 준비한 상태이며, 성공한 Git 커밋·Pages 배포·실제 게임 주소는 아래 상태 파일에 확인 결과로 기록한다. 승인과 배포 성공은 구분한다. `hapil1` 저장소에는 넣지 않는다.

배포 진행 기록은 `DEPLOYMENT_STATUS_R62.json`을 따른다. `docs/web-manifest-r62.json`의 `PREPARED_NOT_UPLOADED`와 승인 전 제안 정보는 검사 당시의 준비본 기록이며, 실행 파일 해시를 보존하기 위해 그대로 둔다.

일반 GitHub Pages에 게시된 게임 코드·이미지·음원은 방문자가 다운로드할 수 있다. 저장소를 비공개로 설정하는 것만으로 일반 Pages 게임 자산이 비공개가 되지는 않는다. GitHub Free의 Pages는 공개 저장소에서 제공되며 비공개 저장소의 Pages 사용 가능 여부는 계정 요금제에 따라 다르다. 계정·결제 변경은 이 준비 작업에 포함하지 않는다.

## 폴더

- `docs/`: 원본 작업 폴더에는 완전한 웹 실행 파일이 있다. GitHub 저장소에는 HTML·JS·JSON 등 텍스트 소스를 그대로 두며, 미디어는 아래 빌드 입력에서 복원한다. 실행 시작점은 `index.html`이다.
- `build-input/runtime-packs/`: 승인된 웹 미디어만 새로 묶은 5MiB 미만의 빌드 입력이다. 원본 다운로드 ZIP이나 비공개 백업이 아니며 브라우저가 조립하지 않는다. 공개 저장소에서는 이 입력 자산도 다운로드할 수 있다.
- `scripts/unpack-runtime-r62.py`: 각 묶음과 복원된 1,906개 런타임 파일의 경로·크기·SHA256을 검사한다. 누락·추가·중복 경로·링크·변조가 있으면 배포를 중단한다.
- `.github/workflows/pages.yml`: GitHub Actions에서 `_pages/docs`로 복원하고 상대경로·음원 검사를 수행한 뒤 이 폴더만 Pages artifact로 게시한다. ZIP·중계서버·검사로그는 게임 사이트에 포함하지 않는다. 공식 upload-pages-artifact v4는 숨김 메타데이터 `.nojekyll`을 제외하지만 Actions가 Jekyll을 실행하지 않으며 1,906개 런타임 파일에는 영향이 없다.
- `docs/web-manifest-r62.json`: 배포 파일 경로·크기·SHA256과 원본/웹 HTML SHA256.
- `client-source/`: 최신 R62 클라이언트 확장 모듈 소스. 실제 전체 클라이언트 소스는 `docs/index.html`, `docs/dist/phase1.js`에 있다.
- 중계 서버 소스와 Render 설정은 별도 `relay/` 폴더로 제공한다. `relay/README_KO.md`, `relay/PROTOCOL.md`, `relay/render.yaml`을 따른다. `relay/node_modules`와 테스트 출력은 공개 저장소에 넣지 않는다.
- `PAGES_STATIC_VERIFICATION_R62.json`, `PAGES_BOOT_R62_CPU.json`: 로컬 검사 결과. 공개 Git 대상에서는 제외한다. 없으면 해당 검사를 아직 실행하지 않은 것이다.
- `MAP_SUPPORT_R62_KO.md`: 63개 STORY 지역과 협동 DREAM 검사 지점의 지원 표. 맵 로딩·전환·엔티티 동기화와 개별 전투 전체 검증을 구분한다.

`docs`에는 원본 ZIP, 분할 파일, ASSEMBLE CMD, Node/PowerShell 로컬 실행기, 검사 스크린샷, projection33 백업, 비밀키를 넣지 않는다. `delivery/`의 7개 OGG는 실제 게임 효과음이므로 포함한다. 이미지 생성 프롬프트·생성 원본 경로 기록은 공개 폴더에서 제외했다. 선택 가능한 맵·사몽·영웅이 쓰는 그림이 누락되지 않도록 실행 manifest의 실제 미디어는 유지한다.

연결 계정의 저장소와 합일 README를 읽기 전용으로 확인했으나 호환되는 공통 중계 서버는 확인하지 못했다. 이번 준비본은 독립 중계 서버를 사용하며 합일과 gameId·빌드·프로토콜을 분리한다.

## 로컬에서 웹 전용 준비와 검사

통합 코드와 자산이 확정된 뒤 원본 작업본에서 다음을 실행한다. 준비 스크립트는 원본 HTML과 그림을 수정하지 않으며, 원본 manifest의 해시가 현재 파일과 다르면 중단한다.

```sh
python deploy-r62/prepare-pages-r62.py --manifest RUNTIME_FILES_R62.json --hardlink
node ../StoryWorld_R62_GitHub/verify-pages-r62.mjs ../StoryWorld_R62_GitHub
```

`--hardlink`는 작업 공간의 용량 절약 옵션이다. 이 옵션으로 만든 `docs` 미디어를 직접 수정하지 말고 원본에서 수정한 뒤 준비 스크립트를 다시 실행한다. 다른 컴퓨터로 복사하거나 Git으로 커밋하면 일반 파일 내용으로 전달된다. 이 명령은 Git 업로드와 서버 배포를 하지 않는다. 원본 준비 스크립트를 다시 실행하면 전용 저장소 문서가 준비 당시 내용으로 돌아갈 수 있으므로 현재 배포 메타데이터를 보존한다.

Actions 빌드 검증은 저장소에서 다음처럼 실행한다. `_pages/docs`는 새 폴더여야 하며 원본 `docs`를 덮어쓰지 않는다.

```sh
python3 scripts/unpack-runtime-r62.py --output _pages/docs
node verify-pages-r62.mjs _pages
```

묶음 업로드가 모두 끝난 뒤 완전한 트리를 한 커밋으로 반영한다. 업로드 중인 일부 파일로 Pages를 배포하지 않는다. 묶음을 웹 실행 파일로 사용하거나 Windows 조립기를 웹에서 실행하지 않는다.

## 승인된 GitHub Pages 배포 절차

1. 사용자가 제공한 **공개** 전용 저장소 `kjb7876-lang/m0`를 사용한다. 새 저장소를 추가로 만들지 않는다. 빈 저장소이면 README 초기 커밋을 만든 뒤 게임 파일을 올린다.
2. 이 폴더의 승인된 파일만 연결된 GitHub 도구 또는 Git으로 `m0`에 커밋한다. 기존 합일 원본·ZIP·비공개 백업 폴더를 저장소 루트로 선택하지 않는다.
3. `Settings → Pages → Build and deployment → Source`에서 **GitHub Actions**를 선택한다. `.github/workflows/pages.yml`이 `main`의 완성된 빌드 입력을 검사하고 실제 정적 게임 파일만 게시한다. 이 설정은 현재 채팅 도구에 노출되지 않아 사용자의 개인 브라우저에서 한 번 필요할 수 있다. 추가 토큰·계정 비밀번호를 요청하지 않는다.
4. 예상 Pages 경로는 `/m0/`이다. 아직 실제 게임 URL이 확인되지 않았으므로 배포 완료 후 직접 확인하여 `DEPLOYMENT_STATUS_R62.json`과 친구 안내에 기록한다. 저장소 URL은 게임 실행 URL과 다르다.
5. 승인 후 Render Free에 `relay/` 코드를 배포하고 실제 WSS 주소를 협동 연결 설정에 입력한다. 서버의 `ALLOWED_ORIGINS`는 승인된 Pages Origin으로 제한한다. 승인된 소유 계정의 값은 `https://kjb7876-lang.github.io`이고 저장소 하위 경로는 Origin에 넣지 않는다. `NODE_ENV=production`, `TRUST_PROXY=1`, `NODE_VERSION=24`, Render 제공 `PORT`를 사용한다. 자세한 명령·환경 변수는 서버 README를 따른다. 자격증명은 채팅으로 전달하지 않는다.
6. `VERIFY_REMOTE_KO.md` 순서로 두 명과 네 명 실제 접속을 확인한다. 성공 커밋 SHA, 배포 시각, 게임 URL, 중계 서버 URL, 실제 원격 검증 결과를 별도로 기록한다.

분할 ZIP과 CMD는 웹 실행 파일이 아니다. 이 준비본은 `docs/index.html` 및 상대 자산 경로를 사용하므로 로컬 Node/PowerShell 실행기 없이 브라우저로 실행한다. 중계 서버의 Node.js는 Render에서 실행되며 플레이어 컴퓨터에 설치할 필요가 없다.

## 무료 서비스 한계

2026-10-16 공식 문서 확인 기준: GitHub Pages 사이트 크기는 1GB 이하여야 하며 월 트래픽은 100GB 소프트 제한이다. GitHub는 개별 100MiB 초과 파일을 거부한다. 현재 정확한 파일 수와 크기는 `docs/web-manifest-r62.json`을 따른다. 전체 자산을 새로 받는 사람이 많으면 트래픽 제한에 먼저 도달할 수 있다.

Render Free는 HTTP 또는 WebSocket 수신 트래픽이 15분 동안 없으면 절전할 수 있고, 다시 시작하는 데 약 1분이 걸릴 수 있다. 워크스페이스의 무료 실행 시간은 월 750시간이며 재시작·재배포 때 메모리의 방은 사라진다. 외부 자동 호출로 절전을 회피하지 않는다. heartbeat는 실제 연결 유지·끊김 감지에만 사용한다. 유료 전환·카드 등록·외부 DB는 추가하지 않는다.

방장 브라우저가 시뮬레이션을 담당한다. 방장 탭을 닫거나 새로고침하면 방은 종료된다. 백그라운드 탭에서 브라우저가 실행을 제한할 수 있으므로 플레이 중 방장 탭을 활성 상태로 둔다. 이번 범위에서 방장 승계는 제공하지 않는다.

## 롤백

배포 전에 기존 공개 커밋 SHA와 서버 배포 버전을 기록한다. 문제가 발견되면 진행 중인 방을 종료하고 Pages를 이전 검증 커밋으로 되돌린다. 서버도 같은 프로토콜/빌드와 호환되는 버전으로 되돌린다. 빌드 불일치 차단을 해제하여 억지로 접속시키지 않는다. 현재 릴리스 전용 협동 저장은 별도로 보관하며 이전 버전에서 읽을 수 있다고 가정하지 않는다. 싱글 저장과 projection33 원본 백업은 롤백 작업 대상이 아니다.

## 근거 문서

- https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
- https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github
- https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- https://render.com/docs/free

로컬 CPU·정적 HTTP 검사, 브라우저·GPU 검사, 모바일 실제 기기, 서로 다른 네트워크의 4인 플레이는 서로 다른 검증이다. 한 가지 검사를 다른 검증의 완료로 표시하지 않는다.
