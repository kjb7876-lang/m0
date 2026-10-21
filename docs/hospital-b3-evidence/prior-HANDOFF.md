# 병원 B3 개선 후보 인수인계

## 상태 / 대상
2026-10-21. kjb7876-lang/m0, ep1a08 솔로만. 공개 B2 기준 f81d0d78af5bce04532b948a3cee36aa4fd4d5b8.
기존 work/hospital-ep1a08-b2 작업공간의 out/hospital-b3-candidate에 별도 후보를 만들었다. 로컬 git HEAD cfedc1f20f8d1a1e2ef8d86a5dcc157edd34ef04는 공개 main SHA가 아니다. B2 HTML/renderer 입력 해시를 정확히 고정했다. git 상태는 기존처럼 ?? out/뿐이다. 새 commit/push/main 병합/배포/보안 변경 없음. HAPIL 저장소 변경 없음. C 착수 아님.
기존 원본·B1·B2 파일/세이브와 Drive 백업은 그대로다. 이번에 백업을 재업로드하거나 별도 검증했다고 주장하지 않는다. 모델·정속 설정은 독립 확인하지 못했다.

## 동일 기준 비교
월드 면적은 실제 floor 합집합. 경로는 compiled explorationPath, 반경 .31, 실제 boundary contact + .1 간격 보수적 표본이다. 실제 플레이 시간/최적 연속 최단거리/웨이브 클리어 시간은 아니다.

| 버전 | 바닥 면적 | 왼쪽 시작→목표 | 중앙 | 오른쪽 |
|---|---:|---:|---:|---:|
| 원본 f415 | 3653.5 | 104.78 | 118.88 | 146.83 |
| B1 / 62f | 3889.5 | 104.78 | 118.88 | 146.83 |
| B2 / f81 | 1129 | 19.85 | 20.26 | 22.30 |
| B3 기본 문 닫힘 | 5710 | 102.50 | 127.88 | 146.05 |
| B3 세 문 열림 | 동일 | 102.50 | 107.67 | 132.86 |

B3 면적은 B1보다 46.8% 크다. 기본 경로는 B1과 대략 같은 규모이고 문을 열면 지름길이 생긴다. **문을 연 상태의 모든 시작 경로가 B1보다 길다고 주장하지 않는다.** 기존 보고 104.30/120.44/147.78과 새 표의 차이는 비교 반경·선분 판정 조건 차이다. 초기 비교 하네스의 길이0 선분 NaN 오류도 수정해 중앙 시작을 재측정했다. 과거 값을 새 실행으로 둔갑시키지 않았다.

comparison.svg는 원본/B1/B2/B3를 같은 축척으로 그린 전체 평면 진단 도면이다. candidate-plan.svg는 B3 좌표/방/문/기본 경로 도면이다. 둘 다 실제 게임 화면이 아니다.

## 실제 공간과 진행
- 세 시작 (5,109), (43,109), (83,109) → 입장 복도 [2,106,86,112].
- 하부 4병실: [12,92,22,102], [26,92,36,102], [50,92,60,102], [64,92,76,102]. 상·하 통로로 분기/재합류. 1웨이브 기존 개체는 (17,97)/(70,97) 주변의 두 병실에 나뉜다.
- 하부 횡복도 [2,82,86,88] → 중간 우회 [6,68,84,74]와 양측 연결. 중앙 연결은 y=88에서 끝나므로 입장 후 하부 병실 연결을 선택할 수 있다.
- 중간 4병실: [12,54,30,66], [34,54,48,66], [52,54,66,66], [70,54,78,66]. 각각 북측 횡복도 [2,44,86,50]와 남측 우회로를 잇는다. 기존 2웨이브는 (21,60)/(59,60) 주변에 배치.
- 준비실 [12,32,28,40] → 상부 복도 [2,22,66,28]. 북쪽 선택 병실 2개 [32,6,44,20]/[48,6,62,20]는 재합류한다. 선택 병실에 필수 방문 조건을 새로 만들지 않았다.
- 전투실 [10,6,28,18] / 관찰실 [1,6,9,18]은 분리되고 [8,10,12,14] 연결만 개방한다. 기존 objective (15,13), mb-ep1a08, 일반 웨이브→소환→보스→post 기억복원→ep1a09 순서를 보존한다.
- 관찰실 우회 [1,17,7,24]는 전투실 문이 닫혀도 구역을 완전히 고립시키지 않는다. 출구 전실 [1,1,9,6]에 기존 다음 포탈 선호점 (5.221291866,5.221291866)을 유지한다. 이전 dist06 및 EGO 포탈 계약은 변경하지 않았다.
- 실제 방은 10병실 + 관찰실/준비실/전투실이다. 보조 alcove와 연결 rect는 방 수로 세지 않는다. 복도와 방은 2~4단위 공백을 두고 지정 통로만 연결해 B2의 경계 소실을 피한다. floorCells와 경계벽은 같은 정의에서 생성한다.

## 문·렌더·저장 연결
3개 기존 형식 ID만 사용: door-0 (20,20), door-1 (29,90), door-2 (55,52). 개구 6, 벽 두께 .24. 기존 R74 canUse/use/interact/clean/serialize/restore를 사용하며 문턱에 플레이어/활성 개체/NPC가 있으면 닫기를 거부하는 기존 동작을 유지한다. schema 확장/door-3 생성 없음.
R74 doors(r) 접근자만 hospitalDoorsB3를 인식하고 기존 entries/opened에 기록한다. 병원에 worldR74 장식·추가 몬스터·집단 AI를 활성화하지 않는다. 의료진/환각 적의 의미 분류와 피해 판정은 바꾸지 않았다. 의료진 보호 완료도 주장하지 않는다.
HTML cache key에 현재 모드와 openedFor(id,layer)를 포함한다. meta.hospitalDoorsB3→hospitalCoreLayoutB2(core,opened)가 닫힌 문 leaf를 벽/충돌/시각 목록에 추가한다. native use 뒤 attach(room)로 현재 참조를 갱신한다. solo↔host/guest에서 원래 협동 배치로 돌아가고 기존 안전 입장/복원 보정이 적용된다.
기존 병원 atlas의 문틀을 3개 prop으로 재사용한다. 새 이미지/몹/성장/보상/공격 수치는 없다. 문틀 이미지의 실제 화면 축척·접합·가림은 사용자 확인이 필요하다.
Three의 기존 original-source-floor-apron은 hospitalDoorsB3일 때 옵션 on/off보다 먼저 [] 처리한다. Legacy 원본 지도 그림 생략과 동일 floor/wall 연결은 유지한다. 카메라 envelope [-112,58]×[0,200]은 모든 바닥 사각형 네 모서리를 포함한다. 카메라/화면 자체를 브라우저로 확인한 것은 아니다.
B3 저장 prefix는 storyworld.hospital-b3.test.v1:. 원본/B1/B2 자동 읽기·이관·덮어쓰기 없음. 저장 호환 검사는 명시적 합성 복사본만 사용했다.

## 최종 동일 후보 검사
FINAL-RUN.json의 시작/끝 동일 HTML·renderer·manifest 해시를 고정한 단일 순차 실행:

| 묶음 | 결과 | 조건 |
|---|---|---|
| geometry | 8/8, exit0, 34.139초 | 면적/경로/방 경계/문/카메라/연결/1912자산/apron 코드 |
| broadphase | 2/2, exit0, 1.117초 | 2400점+300선분 원래 전수 판정과 동일, 문 8상태 반경 .9 연결 |
| production-order | 8/9, exit1, 90.339초 | 실제 105 script 설치 순서, 실제 production normalizer/restore, EGO HP 실패 포함 |
| doors | 7/7, exit0, 41.322초 | 실제 R74 사용·충돌·겹침 거부·복원·오류 거부·warm 전환·STORY/DREAM |
| progression | 10/10, exit0, 91.394초 | 4101seed index, 웨이브/소환/기억/포탈, 협동·다른 지역 비교, CPU Three geometry |

총 35통과/1실패. 통합 실행을 전부 성공으로 보고하지 않는다. production-order는 실제 validator를 대체하지 않는다. 별도 progression 묶음은 기존 부분 추출 VM의 fixture outer validator/직접 처치/강제 선행 완료/수동 서사 확인을 유지한 검사이며 전체 로더 검사와 구분한다. Three r186 CPU geometry는 2480 vertices/1240 triangles, wall faces965; 실제 draw call/FPS/GPU compile 측정이 아니다.
모든 모의검사에서 DOM/canvas/audio는 비활성 대체, 이미지 픽셀 디코딩과 크기는 가정, 시간/rAF는 수동, 입력은 함수 호출, localStorage는 빈 메모리 Map이다. 소프트웨어 GPU나 실기기를 사용하지 않았다. 실제 자연 진행·전체 협동 통신/snapshot 전달·원본 사용자 저장 호환을 증명하지 않는다.

## EGO — 미해결, 별도 대조
같은 synthetic-base.json을 B2와 B3 각각 실제 설치 순서로 복원하고 두 차례 reload/first tick을 대조했다. 좌표를 제외한 개체 ID/HP/maxHP/사망/owner/spawn 상태가 양쪽에서 동일했다. 첫 복원 일반 HP208.164→1430, 중간보스6085.56→33984; 두 번째 일반593.45→1430. B3 신규 차이는 이 대조에서 없지만 HP 보존 자체는 실패다. 실제 사용자 장애 여부/원인은 이번 구조 후보에서 해결하지 않았다. 제어 스크립트 exit0은 기록 완료이며 HP 안정화 통과가 아니다.

## 실패 이력 / 보정 근거
attempt-1/2/3에 입력·산출물·로그를 보존했다. 초기 공간 검사 실패, 닫힌 전투실 단절로 인한 restore 20초 timeout, 카메라 (62,6) 모서리 누락, door warm 테스트가 복원 전후 정규화 HP를 잘못 비교한 fixture 범위 오류가 포함된다. 시간 제한을 늘리거나 validator를 대체하지 않았다. 관찰실 우회로 및 정확 선분 판정 이전 공간 조회를 보정했고, 카메라 네 모서리 검사를 강화했다. warm 테스트는 같은 복원 완료 시점의 before/after를 비교한다.

## 재현·되돌리기 주의
- 실제 사이트: site/index.html, site/dist/phase1.js, site/web-manifest-r62.json. 1914 실파일; 자산 symlink에 기대지 않는다.
- source/plan.json, source/hospital-core-b3.js, source/hospital-runtime-b3.js, source/world-r74-hospital-door-adapter.js, build.py. 빌더는 정확 B2 입력 해시와 원래 B2 소스가 필요하다. output이 존재하면 덮어쓰지 않고 거부한다.
- source.patch(130 diff lines), html.diff, renderer.diff가 B2 대비 변경 근거다. 기존 tracked 소스/승인 JSON/workflow/gate는 수정하지 않았다.
- 증거는 evidence/, 최종 파일 연결은 FINAL-RECEIPT.json 및 FINAL-RUN.json. 로컬 경로가 다른 세션에서 자동으로 읽힌다고 가정하지 않는다. Library/파일전달 거부를 재시도하지 않았다.
- 로컬 후보 폐기는 후보를 사용하지 않는 것으로 충분하다. 공개판은 여전히 B2이며 이번 턴 rollback 불필요. 후속 코드 롤백이 브라우저 저장까지 복원하지 않는다. 저장 prefix의 자동 복사/삭제 금지.
- 독립 검토에서 source diff, 문/캐시/복원 순서, 후보 구조 규모를 확인한 뒤 다음 적용을 판단해야 한다. 이번에 merge/재배포나 C 단계로 진행하지 않았다. 사용자 실화면 검증은 별도다.

## 고정 해시
- HTML: f2e269c26f4814394d88f2e5cb444d0d03d3940b4f1671bf708d7a2e6a6bb992
- renderer: a1bfb1846b658032f731475e471db269caea24192c18d3ecff301e7de26524f3
- manifest: fba062c619329a64ec8114d20d2760c1b2b9211a860e1b76364e82c2f5cf0000
- source.patch: 5f708f4c36a87a80216734b9cffc20e813b3d2eb08f8b729633c9b33dece8564
- FINAL-RECEIPT.json: ab8be406bbb40a4ddcde9373e4176ec905aabc7d55b377b843a01c9ccc904633
