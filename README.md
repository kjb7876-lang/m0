# 스토리월드 R62

스토리월드 전체 63개 STORY 지역과 협동 DREAM 진행을 위한 웹 클라이언트 및 최대 4인 중계 서버 소스입니다. 합일 저장소와 분리된 전용 저장소입니다.

사용자가 제공한 공개 저장소 [`kjb7876-lang/m0`](https://github.com/kjb7876-lang/m0)를 배포 대상으로 확정했습니다. 코드 업로드와 Pages 공개 배포 승인을 받았습니다. 실제 공개 URL·배포 커밋·서버 주소는 [배포 상태](DEPLOYMENT_STATUS_R62.json)에 확인된 결과만 기록합니다. 게임 코드·이미지·음원은 공개 다운로드될 수 있습니다.

- [배포·실행·롤백 안내](README_DEPLOY_KO.md)
- [중계 서버 안내](relay/README_KO.md)
- [지역별 지원 및 검증 범위](MAP_SUPPORT_R62_KO.md)
- [실제 원격 플레이 검증 절차](VERIFY_REMOTE_KO.md)
- [친구 접속 안내](FRIENDS_KO.md)

GitHub Actions가 검증된 빌드 입력을 실제 HTML·이미지·음원으로 복원해 Pages에 게시합니다. 빌드용 ZIP은 게임 사이트에 포함하지 않으며 플레이어는 조립이나 Node.js 설치 없이 브라우저로 실행합니다. 방장 브라우저가 게임 판정을 담당하고, Node.js WebSocket 중계 서버는 별도 무료 Render 서비스에서 실행합니다.

현 검증은 네 개의 네이티브 실행 컨텍스트·실제 localhost WebSocket·CPU 렌더·정적 HTTP 검사입니다. 실제 브라우저/GPU, 모바일, 서로 다른 네트워크의 4인 플레이 검증은 별도이며 완료로 주장하지 않습니다.
