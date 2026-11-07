# 맘몬 금고: 확대 후 격리 후보 (SW-0008)

기준 `7b6577d0bc9d88c1a8ef56fb70a2abd077df5071` (#280). #277 확대 병합 `a2fc5bc5dedc39ee8f7052cc9bb61cac7c4434e2`. 이 PR은 **공개 게임에 등록하지 않는 검토용 후보**다. 원본 게임·미술·세이브는 수정하지 않는다.

## 정본과 후보

- 기준 manifest `b26306fa1493f5ced2c4a1cb88fd61f87a6a789fa1e510bcc7c8203a2db84a58`로 4,948파일/955,238,766바이트 재구성. #277 직후와 동일한 seed 77에서 바닥 7,185·벽 192·논리 방 17·연결 22·길목 31·r224Rooms 48·문 3. 확대 전 3,558/168과 다르다. 입구 (88,60.5), 보스문 (20,20) 폭6, 앞방 문 (85.5,64) 폭5, 다음 구역 문 (5,6) 폭8. 다음 구역 문 위치는 클리어 출구 성공 증거가 아니다.
- V12 보존본 SHA256 `0572822ba4eb01bed69cec79e3ef6f5c9be3bcf733ca31256f0a6db2656471bf`. 준비 후보 두 ZIP의 CRC와 SHA256 재확인. 별도 V3 원본 PART01 저장은 미확인이고 전체 원본 ZIP은 이전 확인 SHA256 `c428423f8b9f8356776d61961f20559d32eaf2d75a3388d2a0884669fbf24e5f`; 이번 실행에서 전체 원본 ZIP을 다시 내려받았다는 뜻은 아니다.
- F01/W06은 native 물리 UV에 적용하며 R228의 방 바닥 음영은 유지한다. 추가 바닥 메시를 만들지 않는다. 이미 원근이 그려진 W01–W05는 중복 투영을 피하려고 불러오지 않는다. 기존 native 가림과 같은 프레임에 마감이 사라진다. P01/P02는 실제 벽의 지지점에, D01은 가운데가 빈 양쪽 문설주로 나누어 각각의 native 끝점에 붙인다. 문간을 덮는 가로 그림은 쓰지 않는다. 제한된 시점에서 실제 접점 보정은 아직 필요하다.
- O01/O02는 기록실·전실의 장부 책상, 금고 구획·보안 회랑의 금고장으로 구분한다. 피벗은 원본 발 접점에서 파생했고 카메라를 향한 평면에 한 번만 투영한다. R224 가구의 늦은 생성, 입구·문·통행 가능한 방 경계·전투 구역을 피한다. 위협 예고 때 추가 가구·장식 기둥/문설주를 숨기며 게임 상태는 쓰지 않는다. 서사·보상·보스 조건·세이브·기존 문 UI는 후보 파일에서 건드리지 않는다.
- 준비 12종 모두 원본 SHA/파생 SHA 및 최대변 768 px. 격리 빌드가 실제로 요청하는 7종은 인코딩 2,179,372 B, RGBA8 기본 레벨 13,762,560 B, 전체 mip 이론 합계 18,350,032 B. 실제 GPU 메모리·FPS 측정값은 없다. 이 범위의 전용 경로 외에 공통 index, release manifest, Pages 등록 파일은 수정하지 않았다.

## 재현

```sh
python3 scripts/build-r96.py
node r96/qa/mammon-miniature-pilot/check.cjs
node r96/qa/mammon-miniature-pilot/prepare-preview.cjs --site r96/hospital-three-pc/site --out /tmp/mammon-v3-preview
python3 -m http.server 4300 --bind 127.0.0.1 --directory r96/hospital-three-pc/site
# 별도 터미널
python3 -m http.server 4301 --bind 127.0.0.1 --directory /tmp/mammon-v3-preview
# 별도 터미널: 보안을 해제하지 않은 비-root Chrome/ChromeDriver 필요
python3 r96/qa/mammon-miniature-pilot/browser-check.py --before http://127.0.0.1:4300/ --after http://127.0.0.1:4301/ --out /tmp/mammon-v3-captures
```

- CPU 검사는 seed 27/77/777 VM의 `makeRoom`/`placeRoom`, 실제 Three 클래스와 모의 렌더 호출이다. 자연 진행, 브라우저, GPU 성공으로 집계하지 않는다.
- PR의 독립 화면 검사 workflow는 임시 세이브 프로필로 PC 1920×1080과 모바일 CSS 390×844/DPR3을 시도한다. `777`, 시드 고정, 장면 건너뛰기, 위치 주입 후의 키보드 이동/공격은 자연 진행이 아니다. 화면별 fixture 좌표·WebGL renderer·콘솔·진단 실패를 JSON/PNG로 남긴다. 렌더러 오류 사진은 게임 캡처가 아니다.
- 로컬 Chromium 실행 파일이 없고 공식 설치 파일 URL은 ZIP 대신 `Site Unavailable` HTML을 반환했다. 별도 공식 브라우저는 공개 페이지를 열었지만 `WebGL2 context unavailable`였다. 로컬 화면/실기기 성공 근거 없음. 이 문서는 CI 결과나 독립 미술 승인을 대신하지 않는다.

## 공개 적용 전 남은 검수

입구·분기·기록실·집결실·보스문·출구·전투 화면을 PC/모바일로 비교하고, 실제 움직임·벽 충돌·문 해제·보스 진입 및 완료·출구·저장 재실행을 확인해야 한다. 미술, 연출, 카메라, 공간·인테리어, 조명·색채, 애니메이션·VFX, UX·레벨 가독성 모두 캡처 검토 전 **미평가**다. 이전 7.56은 이 후보의 점수가 아니며 평균 7.77 통과로 기록하지 않는다. CI·화면 독립검토·공통파일 소유권 확인 없이 병합/Pages 공개 배포하지 않는다.
