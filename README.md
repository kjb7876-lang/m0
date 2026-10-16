# 스토리월드 R62

스토리월드 전체 63개 STORY 지역과 협동 DREAM 진행을 위한 웹 클라이언트 및 최대 4인 중계 서버 소스입니다. 합일 저장소와 분리된 전용 저장소입니다.

사용자가 제공한 공개 저장소 [`kjb7876-lang/m0`](https://github.com/kjb7876-lang/m0)를 배포 대상으로 확정했습니다. 코드 업로드와 Pages 공개 배포 승인을 받았습니다. 실제 공개 URL·배포 커밋·서버 주소는 [배포 상태](DEPLOYMENT_STATUS_R62.json)에 확인된 결과만 기록합니다. 게임 코드·이미지·음원은 공개 다운로드될 수 있습니다.

웹 게임: [스토리월드 R62 실행](https://kjb7876-lang.github.io/m0/) · 최신 Pages 배포 성공: 2026-10-16 18:15 KST · 배포 커밋 `545bdca9ac3da7539663f3e53627e50f9316911d`. 공개 HTML SHA-256 `a260ed7b1d62e5574ae35525d58135543878e9c444d6fdaf039367ab01de330e` 일치를 확인했습니다. 브라우저/GPU에서의 플레이 검증은 별도입니다.

멀티 중계는 https://storyworld-r62-relay.onrender.com 에서 공개 HTTPS/WSS 검사를 통과했습니다. Render 무료 서버가 잠들어 있었다면 첫 연결이 약 1분 걸릴 수 있습니다. 실패 후 다시 연결하면 같은 방 만들기/참가 화면과 입력값이 복원됩니다. 게임에 `wss://storyworld-r62-relay.onrender.com/ws`가 기본값으로 채워집니다. 직접 설정한 다른 주소는 보존됩니다. 방장 포함 4개 공개 연결, 5번째 거절, 공유 상태, 맵 전환, 재접속, 방장 종료 등 11개 자동 검사를 수행했습니다. 실제 4인 기기·서로 다른 네트워크의 게임 플레이는 별도입니다. 이미 서버를 생성했다면 다시 만들 필요가 없습니다.

자신의 별도 서버가 필요한 경우에만 [Render 무료 중계 서버 배포](https://render.com/deploy?repo=https://github.com/kjb7876-lang/m0)에서 로그인한 뒤 Free 서비스 1개를 검토하고 배포합니다. 저장소 루트의 `render.yaml`에 Node 24, 실행 명령, Pages 허용 출처가 입력돼 있습니다. 이 버튼만으로 서버가 이미 생성된 것은 아닙니다. 발급된 공개 `onrender.com` 주소를 확인한 뒤 WSS 연결 검증을 진행합니다.

- [배포·실행·롤백 안내](README_DEPLOY_KO.md)
- [중계 서버 안내](relay/README_KO.md)
- [지역별 지원 및 검증 범위](MAP_SUPPORT_R62_KO.md)
- [실제 원격 플레이 검증 절차](VERIFY_REMOTE_KO.md)
- [친구 접속 안내](FRIENDS_KO.md)

GitHub Actions가 검증된 빌드 입력을 실제 HTML·이미지·음원으로 복원해 Pages에 게시합니다. 빌드용 ZIP은 게임 사이트에 포함하지 않으며 플레이어는 조립이나 Node.js 설치 없이 브라우저로 실행합니다. 방장 브라우저가 게임 판정을 담당하고, Node.js WebSocket 중계 서버는 별도 무료 Render 서비스에서 실행합니다.

현 검증은 네 개의 네이티브 실행 컨텍스트·실제 localhost WebSocket·CPU 렌더·정적 HTTP 검사입니다. 실제 브라우저/GPU, 모바일, 서로 다른 네트워크의 4인 플레이 검증은 별도이며 완료로 주장하지 않습니다.
