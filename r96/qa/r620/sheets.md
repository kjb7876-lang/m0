# R620 Dots CX-0068SM 보스 시트 적용표

| 보스 | 게임 파일 | Dots 원본(드라이브 결과 폴더) | 원본 sha256 | 칸 | 검수 |
|---|---|---|---|---|---|
| 호텔 부매니저 · 레비아탄(b03) 대기 | assets/r620/bosses/b03-idle6.webp (sha256 510a714c…01f2) | CX-0068SM_b03_idle6_r1_GENERATED_HOLD.png (1285×1224) | c4ff0e56…ddc2 | 6칸 672×384, 8fps | 키 편차 1.0%, 발 줄 352 그대로, 색 채널 보정 뒤 평균 RGB 차 0.02(보정 전 3.2) |
| 레비아탄(b03) 피격 | assets/r620/bosses/b03-hit4.webp (sha256 2d14c75d…84aa) | CX-0068SM_b03_hit4_r1_GENERATED_HOLD.png (2032×774) | d1edf382…a6a5 | 4칸 672×384, 16fps | 키 편차 0.3%, 발 줄 352, 보정 전 색 차 9.6 → 보정 뒤 0.02 |

맞춤 방법: `python -I r96/qa/r620/normsheet.py <Dots 원본> <칸 수> <게임 대기 원본> <출력>` — 그룹 자르기, 중앙 키로 한 배율, 발밑 x 를 원본 발밑에 맞춤, 알파 16 이하 0, 보이는 화소 평균 RGB 로 채널별 곱.
대기 원본: assets/generated-v31224/actors-normalized/1a8ca2c5759b_ep1b03_envy_sister_phase0.webp (sha256 ef48c98d…0cfe).
Dots 는 결과를 HOLD(생성기 원본, 손질 안 함)로 올렸고, 위 맞춤은 Claude 가 했다. 헤드리스·실플레이 화면 확인은 미검증.
