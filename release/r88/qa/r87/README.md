# R87/V11 현재 검증

최신 판정은 final-suite.json 하나를 기준으로 합니다. 같은 파일에 고정된 전체 런타임 해시와 각 검사 스크립트 SHA, 실행 로그, 소스 불변 여부를 기록합니다. 과거 r80~r86 보고서는 이전 버전의 자료이며 현재 판정을 대체하지 않습니다.

실제 게임 코드를 독립 Node VM에서 실행하고, 명령 기록을 고정 Three CPU 지오메트리로 재생하며, 로컬 HTTP와 파일 SHA256을 검사합니다. 전투·진행 검사는 좌표 배치·무적·피해 보조와 별도 VM 저장 복원을 포함합니다. 브라우저/GPU 화면·자연 플레이·Windows 실행·실제 FPS·음원 재생 검증은 아닙니다.

painted-results.json: 새 그림 프레임3종, 명중·착탄·발 위치·속박·지속 피해·블링크·일시정지·복원·리소스 정리.
atlas-results.json: 원본 PNG 해시·크기·프레임별 투명 테두리·독 종료 프레임.
build-idempotence.json: 빌드를 다시 실행해도 실행 파일 바이트가 변하지 않는지 확인.

최종 두 ZIP은 별도 archive-verification-v11-two.json에서 CRC·파일 합집합·고정 런타임 해시·원본 실행기 보존을 검사하며, v11-two-extraction-check.json은 두 ZIP을 실제 압축 해제한 파일로 HTTP 검사를 수행합니다. 두 보고서는 ZIP 생성 뒤 outputs 폴더에 생성됩니다.
