# 7대죄 보스방 카메라·구도 독립 심사

점수 **8.0 / 10**, 판정 **임시 통과 — 헤드리스 화면 범위**. 구현 소스는 수정하지 않은 별도 카메라 검토자가 실제 PNG를 열어 평가했다. PC 1920×1080, 모바일 390×844 DPR3이며, 일반 STORY 777 진입 후 카메라와 시간을 고정했다. 중앙 쌍은 (16,11), 모바일 세부 시점은 (21,10)이다.

PC에서는 일곱 방 모두 가구가 북쪽·서쪽 외곽을 따라 보이며, 중앙 영웅과 전투 바닥을 가리지 않는다. 문 개구부도 새 가구에 가려지지 않는다. 소파·액자와 거울·주방 조리대·빈 무대와 객석·맘몬 금고·청소 수레·감시 콘솔의 서로 다른 실루엣이 방을 구분한다. 좁은 모바일 중앙 시점은 북쪽 주요 가구를 읽을 수 있지만 오른쪽 보조 가구와 서쪽 수납장은 화면 밖이다. 이동한 세부 시점에서 냉장고·거울·레인지·의자·금고·수레·전극 침대를 추가 확인했다. 전체 가구를 한 프레임에 넣으려 카메라를 축소하지 않아 영웅 크기는 유지된다.

초기 후보에서 ep1b05 객석과 무대가 네이티브 벽 상자에 가렸고, ep1b08 콘솔과 침대는 동굴 바위에 완전히 묻혔다. 픽셀 확인으로 발견해 구현자에게 전달했고, 수정 빌드의 PC·모바일에서 해당 상자가 사라지고 조형물이 드러나는 것을 재확인했다. 초기 증거는 `/workspace/seven-sins-first-candidate/`에 보존했다.

남은 한계:
- 나태 방 냉장고 앞에 기존 촛대 테이블이 겹쳐 전면 일부를 가린다. 새 냉장고의 전체 실루엣과 문 분할은 읽히며 영웅·문을 가리지는 않는다. 기존 보호 조형물의 기능을 확인한 뒤 후속 배치를 다듬을 여지가 있다.
- PC에서 병·구두·사진의 작은 표면 정보는 잘 안 읽힌다. 주요 가구 실루엣은 구별되지만 재질·초상 세부의 아트 품질을 이 카메라 점수로 승인하지 않는다.
- 모바일 중앙 화면은 오른쪽 가구를 한 번에 보여주지 않는다. 세부 시점은 실제 이동 중 화면 전환을 대신하는 위치 배치 검사다.
- 자연 보스전, 전투 이펙트 중 가림, 화면 흔들림, 터치 조작, 가로 모바일, 실기기 GPU는 미검증이다. 무작위 적·기존 장식과 벽 가림 상태는 프레임마다 차이가 있어 PNG 전체 픽셀 동일성을 주장하지 않는다.

실제 열어 본 최종 이미지와 SHA-256:

| 파일 | SHA-256 |
|---|---|
| `after-ep1b02-pc.png` | `9f385aaf28ac22cf2bd7975a650ceebf98b7acf0d57c64b6f0cc58e81c80c169` |
| `after-ep1b03-pc.png` | `3eb45ac3ced418d107d56a7138cc294c0802d50afc62374de6fff09c056c651b` |
| `after-ep1b04-pc.png` | `0fb38959bf61752402da4d2d759ba46ffa8f51e56f79e536b37327b375887248` |
| `after-ep1b05-pc.png` | `f88ed825f8fe64c9052497174ba25fc0deca69766268a5302cab1af6cc7a99c9` |
| `after-ep1b06-pc.png` | `e8d7fc511c4afd45185fafef9895b8557ca26ebd452c44a9a0375da6b3581413` |
| `after-ep1b07-pc.png` | `9e4119f1026e5347b5eb5f74f90ae711181bfa014f78a4490f5ad5aa7c816608` |
| `after-ep1b08-pc.png` | `de02b50bc98ef024d44ecd384c1af36094486e77ba1df9f4fc76cac0c7a317e0` |
| `after-ep1b02-mobile-detail.png` | `d918700dbf17232a90588e8e7b4563a37f70f733faa0f63c3e19db427c91dc9a` |
| `after-ep1b03-mobile-detail.png` | `157405a29f8abc41a8e1738230092544043e45cfa0ea673cd59307d72f90d641` |
| `after-ep1b04-mobile-detail.png` | `650a3e53b59ada1bbe50d829777cfb9d23654f1bfe9f90ad7bd8500d42240a4f` |
| `after-ep1b05-mobile-detail.png` | `9036703fdb3a918410f5725e8f95dae425df11961b28f6060be268d23a493a04` |
| `after-ep1b06-mobile-detail.png` | `2ab45f0c315f3104677d9c8a76c8b06d81fa13a952950a516782650469d2362e` |
| `after-ep1b07-mobile-detail.png` | `89f2b57edb62db4af29596c943d0a70812bbccd0377c55090cde840dea224d81` |
| `after-ep1b08-mobile-detail.png` | `4183147f6aa9188ef61652591499286e8382041a24261fefb7e325bee0d77e30` |
| `after-ep1b05-mobile.png` | `5dd663deab5473b659dcbcb7a2b014ac9f0d177069efa92cce2a807de925986c` |
| `after-ep1b08-mobile.png` | `2de95e93ed6d37207d1b696ed5ff50bef8b03f8f4db952f2bea5a99cbd3fabc1` |

추가로 변경 전 `before-ep1b05-pc.png`, 초기 후보의 일곱 PC 화면 및 모바일 세부 표본을 열어 가림 문제를 비교했다. 위 표는 최종 후보에서 직접 본 파일만 나열한다. 모든 최종 캡처 JSON은 game/page/resource 오류 없음, overlay 오류 0, 충돌용 가구 벽 높이 ≤0.011을 기록한다.
