# R712 보물상자 다시 만들기

1. `engine/treasure_chest/treasure_chest.glb` 를 https://huggingface.co/datasets/codepawl/pixel-atlas-glb 에서 받아 `glb/` 에 둔다(sha256 4385c406…).
2. three@0.187.0 을 `node_modules/` 에 두고 이 폴더를 4420 에서 정적 서버로 띄운다.
3. `node shot.cjs '[{"name":"treasure_chest","out":"fc.png","opt":{"size":512,"half":1.0}},{"name":"treasure_chest","out":"fo.png","opt":{"size":512,"half":1.0,"open":0.5,"lidAng":-100,"innerColor":1182730}}]'`
4. 두 그림을 닫힌 상자 bbox 가운데 x 기준으로 좌우 대칭으로 자르고(바닥 같게), 닫힌 상자 폭 150px 축척으로 줄인 뒤 채도 ×0.84·밝기 ×1.18·대비 ×1.08, 1px 투명 여백.
   열린 그림 높이/닫힌 그림 높이 = growth-r103 `CHEST_H.open/closed` (74/54).
