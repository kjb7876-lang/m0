# R712 보물상자 그림 출처

| 파일 | 원본 | 원본 sha256 | 처리 | 크기 | 용도 |
|---|---|---|---|---|---|
| chest-closed.png | `engine/treasure_chest/treasure_chest.glb` (30,420 B) | 4385c4068350df7f06e305695c6128f122725dd1f6595a45fdc2258e5fba1a53 | three.js 0.187 직교 카메라(방위 45°, 고도 30°, 게임 2:1 등각과 같음), 따뜻한 키라이트+어두운 반구광, 최근접 텍스처, 채도 ×0.84·밝기 ×1.18·대비 ×1.08, 150px 폭 축소, 1px 투명 여백 | 152×147 | 닫힌 보물상자(growth-r103) |
| chest-open.png | 같은 GLB | 같음 | 위와 같음 + y=0.5 에서 잘라 뚜껑을 뒤 경첩축으로 −100° 젖힘, 속은 어두운 판 | 216×202 | 연 보물상자 |

- 데이터셋: Pixel Art Atlas 3D GLB, https://huggingface.co/datasets/codepawl/pixel-atlas-glb (커밋 24fc03aabdf3536ff4e488f7887fa2d045456c32, 2026-11-10), 패키징 CodePawl(An Xuan).
- 원 그림: Pixel Art Atlas (1.4M Synthetic Sprites) by Angais, https://huggingface.co/datasets/Angais/pixel-art-atlas-1.4m — CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/).
- 고지: 원 16×16 그림은 Krea 2 Turbo + 픽셀 아트 LoRA 로 만든 AI 생성물이다. Angais 는 자신이 가진 권리만 CC0 로 포기했고 제3자 권리·상표·Krea 모델 약관(Krea 2 Community License §2.3·§5.3)은 별도라고 적었다. 이 게임은 비상업 공개 배포이며, 상업 배포 전에는 Krea 약관을 다시 확인한다.
- 옛 그림 `assets/r103/chest-closed.svg`·`chest-open.svg` 는 지우지 않고 남겨 두었다(되돌리기: growth-r103.js ASSET 두 경로만 바꾸면 됨).
