# R1247 Dots 시트 입고 검사 — 기존 자산 전수(보고용)

PASS 204 · HOLD 143 · 건너뜀 60 · 규칙별 {'baseline': 67, 'bleed': 42, 'empty': 2, 'jitter': 42, 'scale': 5}

보고용이다. 그룹(walk·attack) 정보가 없는 시트는 모든 칸을 한 그룹으로 비교하므로 공격 돌진·달리기 체공 칸이 baseline·jitter 로 잡힐 수 있다(사람이 그림으로 확인할 후보 목록).

| 시트 | 판정 | 문제(칸) | 발 줄 차이(px) | 몸통 중심 차이(px) | 키 비율 |
|---|---|---|---|---|---|
| r229/michaela/run-ne-v4.webp | HOLD | baseline[1] | 8 | 5.18 | 1.1317 |
| r248/mobs/m003.webp | HOLD | bleed[9] | 0 | 11.36 | 1.0286 |
| r248/mobs/m004.webp | HOLD | bleed[9, 10] | 0 | 20.58 | 1.0185 |
| r248/mobs/m005.webp | HOLD | bleed[9] | 0 | 11.36 | 1.0286 |
| r248/mobs/m008.webp | HOLD | bleed[9, 10] | 0 | 15.52 | 1.0208 |
| r248/mobs/m009.webp | HOLD | bleed[9, 10] | 0 | 19.5 | 1.02 |
| r248/mobs/m012.webp | HOLD | bleed[9, 10] | 0 | 19.5 | 1.02 |
| r248/mobs/m014.webp | HOLD | bleed[9] | 0 | 11.28 | 1.0208 |
| r248/mobs/m015.webp | HOLD | bleed[9] | 0 | 11.28 | 1.0208 |
| r248/mobs/m018.webp | HOLD | baseline[2, 7] | 16 | 19.88 | 1.14 |
| r248/mobs/m020.webp | HOLD | bleed[9, 10] | 0 | 20.58 | 1.0185 |
| r248/mobs/m021.webp | HOLD | jitter[9] | 0 | 48.0 | 1.1304 |
| r248/mobs/m022.webp | HOLD | baseline[2, 7] | 16 | 19.88 | 1.14 |
| r248/mobs/m023.webp | HOLD | baseline[2, 7] | 16 | 19.88 | 1.14 |
| r248/mobs/m024.webp | HOLD | jitter[2]; jitter[8, 9] | 0 | 108.5 | 1.2381 |
| r248/mobs/m026.webp | HOLD | jitter[9] | 0 | 48.0 | 1.1364 |
| r248/mobs/m027.webp | HOLD | jitter[9] | 0 | 48.0 | 1.1277 |
| r248/mobs/m029.webp | HOLD | jitter[9] | 0 | 48.0 | 1.1364 |
| r248/mobs/m034.webp | HOLD | baseline[2, 7] | 16 | 19.88 | 1.14 |
| r248/mobs/m038.webp | HOLD | bleed[9, 10] | 0 | 15.52 | 1.0208 |
| r248/mobs/m039.webp | HOLD | baseline[2, 7] | 16 | 19.88 | 1.14 |
| r248/mobs/m040.webp | HOLD | baseline[2, 7] | 16 | 19.88 | 1.14 |
| r248/mobs/m041.webp | HOLD | baseline[2, 7] | 16 | 19.88 | 1.14 |
| r248/mobs/m042.webp | HOLD | bleed[9, 10] | 0 | 15.52 | 1.0208 |
| r248/mobs/m045.webp | HOLD | bleed[9]; jitter[9, 10] | 8 | 41.76 | 1.0312 |
| r248/mobs/m046.webp | HOLD | bleed[9]; jitter[9, 10] | 8 | 41.76 | 1.0312 |
| r248/mobs/m047.webp | HOLD | baseline[2, 7] | 16 | 19.88 | 1.14 |
| r248/mobs/m049.webp | HOLD | baseline[2, 7] | 16 | 19.88 | 1.14 |
| r248/mobs/m050.webp | HOLD | baseline[2, 7] | 16 | 19.88 | 1.14 |
| r248/mobs/m051.webp | HOLD | baseline[2, 7] | 16 | 19.88 | 1.14 |
| r248/mobs/m052.webp | HOLD | baseline[2, 7] | 16 | 19.88 | 1.14 |
| r248/mobs/m053.webp | HOLD | jitter[9] | 0 | 48.0 | 1.2667 |
| r248/mobs/m054.webp | HOLD | baseline[2, 7] | 16 | 19.88 | 1.14 |
| r248/mobs/m055.webp | HOLD | baseline[2, 7] | 16 | 19.88 | 1.14 |
| r248/mobs/m063.webp | HOLD | baseline[2, 7] | 16 | 19.88 | 1.14 |
| r248/mobs/m065.webp | HOLD | bleed[9]; jitter[9, 10] | 8 | 41.76 | 1.0312 |
| r248/mobs/m066.webp | HOLD | baseline[2, 7] | 16 | 19.88 | 1.14 |
| r248/mobs/m067.webp | HOLD | bleed[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] | 0 | 13.09 | 1.0 |
| r248/mobs/m069.webp | HOLD | bleed[9, 10] | 0 | 15.52 | 1.0208 |
| r248/mobs/m070.webp | HOLD | bleed[9, 10] | 0 | 15.52 | 1.0208 |
| r248/mobs/m072.webp | HOLD | bleed[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] | 0 | 13.09 | 1.0 |
| r248/mobs/m074.webp | HOLD | baseline[2, 7] | 16 | 19.88 | 1.14 |
| r248/mobs/m075.webp | HOLD | baseline[2, 7] | 16 | 19.88 | 1.14 |
| r248/mobs/m080.webp | HOLD | baseline[2, 7] | 16 | 19.88 | 1.14 |
| r248/mobs/m081.webp | HOLD | baseline[2, 7] | 16 | 19.88 | 1.14 |
| r248/mobs/m082.webp | HOLD | baseline[2, 7] | 16 | 19.88 | 1.14 |
| r248/mobs/m084.webp | HOLD | jitter[9] | 0 | 48.0 | 1.2667 |
| r248/mobs/m085.webp | HOLD | baseline[2, 7] | 16 | 19.88 | 1.14 |
| r248/mobs/m087.webp | HOLD | baseline[2, 7] | 16 | 19.88 | 1.14 |
| r248/mobs/m088.webp | HOLD | baseline[2, 7] | 16 | 19.88 | 1.14 |
| r248/mobs/m090.webp | HOLD | jitter[9] | 0 | 48.0 | 1.2667 |
| r248/mobs/m092.webp | HOLD | bleed[9, 10] | 0 | 13.71 | 1.0208 |
| r248/mobs/m093.webp | HOLD | bleed[9, 10] | 0 | 13.71 | 1.0208 |
| r248/mobs/m095.webp | HOLD | baseline[2, 7] | 16 | 19.88 | 1.14 |
| r248/mobs/m099.webp | HOLD | bleed[9, 10] | 0 | 20.58 | 1.0185 |
| r284/michaela/run-ne-v5.webp | HOLD | baseline[1, 5] | 18 | 5.12 | 1.1707 |
| r290/mobs/m025.webp | HOLD | scale[8] | 1 | 8.69 | 1.405 |
| r290/mobs/m026.webp | HOLD | jitter[10] | 3 | 32.58 | 1.0654 |
| r290/mobs/m030.webp | HOLD | baseline[10] | 15 | 16.29 | 1.2696 |
| r290/mobs/m051.webp | HOLD | baseline[0, 7]; baseline[11] | 18 | 6.49 | 1.1055 |
| r290/mobs/m053.webp | HOLD | jitter[10] | 5 | 33.97 | 1.0294 |
| r290/mobs/m055.webp | HOLD | baseline[0, 1, 2] | 26 | 2.12 | 1.1445 |
| r290/mobs/m058.webp | HOLD | baseline[0, 1] | 15 | 6.65 | 1.2547 |
| r290/mobs/m059.webp | HOLD | jitter[10] | 5 | 22.1 | 1.0924 |
| r290/mobs/m074.webp | HOLD | baseline[0, 3, 4, 6, 7] | 24 | 2.48 | 1.0874 |
| r290/mobs/m076.webp | HOLD | baseline[5]; jitter[10] | 11 | 39.32 | 1.0345 |
| r290/mobs/m085.webp | HOLD | baseline[2]; baseline[10] | 20 | 12.35 | 1.1514 |
| r290/mobs/m090.webp | HOLD | jitter[8, 10] | 8 | 61.34 | 1.2143 |
| r290/mobs/m095.webp | HOLD | baseline[2] | 14 | 4.84 | 1.0753 |
| r306/pixel/p003969d46a2c.webp | HOLD | bleed[9, 10] | 0 | 15.52 | 1.0208 |
| r306/pixel/p02efba5d54cc.webp | HOLD | bleed[9] | 0 | 11.36 | 1.0286 |
| r306/pixel/p05800ba378fd.webp | HOLD | bleed[9, 10] | 0 | 19.5 | 1.02 |
| r306/pixel/p0afc179a51fe.webp | HOLD | baseline[2, 7] | 16 | 19.88 | 1.14 |
| r306/pixel/p10447845ef69.webp | HOLD | bleed[9, 10] | 0 | 19.5 | 1.02 |
| r306/pixel/p16130945db9e.webp | HOLD | baseline[2, 7] | 16 | 19.88 | 1.14 |
| r306/pixel/p1bedd800e04a.webp | HOLD | bleed[9, 10] | 0 | 19.5 | 1.02 |
| r306/pixel/p2349b042c2e6.webp | HOLD | bleed[9]; jitter[9, 10] | 8 | 41.76 | 1.0312 |
| r306/pixel/p2383f590ba64.webp | HOLD | baseline[2, 7] | 16 | 19.88 | 1.14 |
| r306/pixel/p25eb90b513a0.webp | HOLD | baseline[2, 7] | 16 | 19.88 | 1.14 |
| r306/pixel/p29026a87cc69.webp | HOLD | baseline[2, 7] | 16 | 19.88 | 1.14 |
| r306/pixel/p2b2faf14a64f.webp | HOLD | jitter[9] | 0 | 48.0 | 1.1304 |
| r306/pixel/p2f3e4b253ffd.webp | HOLD | baseline[2, 7] | 16 | 19.88 | 1.14 |
| r306/pixel/p3262e2ff3ba4.webp | HOLD | jitter[2]; jitter[8, 9] | 0 | 108.5 | 1.2381 |
| r306/pixel/p3e26120b9fd3.webp | HOLD | bleed[9, 10] | 0 | 17.91 | 1.1053 |
| r306/pixel/p3faccbe08f7a.webp | HOLD | bleed[9]; jitter[9, 10] | 8 | 41.76 | 1.0312 |
| r306/pixel/p495c9a45b6ec.webp | HOLD | baseline[2, 7] | 16 | 19.88 | 1.14 |
| r306/pixel/p51cb661d0ac9.webp | HOLD | baseline[2, 7] | 16 | 19.88 | 1.14 |
| r306/pixel/p51d7317bfc9f.webp | HOLD | bleed[9, 10] | 0 | 21.68 | 1.0189 |
| r306/pixel/p5828c31d06f1.webp | HOLD | jitter[9] | 0 | 48.0 | 1.2667 |
| r306/pixel/p685011501869.webp | HOLD | baseline[2, 7] | 16 | 19.88 | 1.14 |
| r306/pixel/p6e50388b8624.webp | HOLD | jitter[9] | 0 | 48.0 | 1.1364 |
| r306/pixel/p75e4ee528b8f.webp | HOLD | baseline[2, 7] | 16 | 19.88 | 1.14 |
| r306/pixel/p786abec62af5.webp | HOLD | baseline[2, 7] | 16 | 19.88 | 1.14 |
| r306/pixel/p7a68b573780b.webp | HOLD | bleed[9, 10] | 0 | 15.52 | 1.0208 |
| r306/pixel/p84cabb8f93f1.webp | HOLD | bleed[9, 10] | 0 | 15.52 | 1.0208 |
| r306/pixel/p863119b3f239.webp | HOLD | bleed[9, 10] | 0 | 15.61 | 1.1042 |
| r306/pixel/p8a8dcc6e574e.webp | HOLD | baseline[2, 7] | 16 | 19.88 | 1.14 |
| r306/pixel/p8b2a4b42ac41.webp | HOLD | bleed[9, 10] | 0 | 20.58 | 1.0185 |
| r306/pixel/p942c401c947a.webp | HOLD | bleed[9, 10] | 0 | 15.52 | 1.0208 |
| r306/pixel/p9a4ce8b4dc98.webp | HOLD | jitter[9] | 0 | 48.0 | 1.1304 |
| r306/pixel/p9b4e3f165200.webp | HOLD | baseline[2, 7] | 16 | 19.88 | 1.14 |
| r306/pixel/pa18631f330a4.webp | HOLD | jitter[2]; jitter[8, 9] | 0 | 108.5 | 1.2381 |
| r306/pixel/pa250b2be2fd6.webp | HOLD | bleed[0, 1, 2, 3, 4, 5, 6, 7, 9, 10, 11] | 0 | 10.79 | 1.02 |
| r306/pixel/pa7671794c381.webp | HOLD | bleed[9, 10] | 0 | 15.52 | 1.0208 |
| r306/pixel/pb0740b997dd4.webp | HOLD | baseline[2, 7] | 16 | 19.88 | 1.14 |
| r306/pixel/pb5ca132aca10.webp | HOLD | jitter[9] | 0 | 46.23 | 1.0909 |
| r306/pixel/pb6bccf15ed6e.webp | HOLD | bleed[9, 10] | 0 | 15.52 | 1.0208 |
| r306/pixel/pb7bb9a776dc1.webp | HOLD | jitter[2]; jitter[8, 9] | 0 | 108.5 | 1.2381 |
| r306/pixel/pbc4446f1b31c.webp | HOLD | jitter[9] | 0 | 46.23 | 1.0909 |
| r306/pixel/pcc81221fc308.webp | HOLD | jitter[9] | 0 | 48.0 | 1.1277 |
| r306/pixel/pd1f9bf013be3.webp | HOLD | bleed[9, 10] | 0 | 15.52 | 1.0208 |
| r306/pixel/pd354498c759c.webp | HOLD | bleed[9] | 0 | 11.28 | 1.0208 |
| r306/pixel/pd6701acd125f.webp | HOLD | jitter[9] | 0 | 48.0 | 1.2667 |
| r306/pixel/pdbbaba4482c0.webp | HOLD | jitter[9] | 0 | 48.0 | 1.12 |
| r306/pixel/pdde46134b8c4.webp | HOLD | baseline[2, 7] | 16 | 19.88 | 1.14 |
| r306/pixel/pe6cbe6350383.webp | HOLD | bleed[9] | 0 | 11.36 | 1.0286 |
| r306/pixel/pe99278e2986f.webp | HOLD | jitter[9] | 0 | 48.0 | 1.12 |
| r306/pixel/pf0ad5f9f7a51.webp | HOLD | baseline[2, 7] | 16 | 19.88 | 1.14 |
| r306/pixel/pf29dd31b2508.webp | HOLD | baseline[2, 7] | 16 | 19.88 | 1.14 |
| r306/pixel/pf2a43cb7b697.webp | HOLD | jitter[9] | 0 | 48.0 | 1.1395 |
| r306/pixel/pf4d55608976d.webp | HOLD | baseline[2, 7] | 16 | 19.88 | 1.14 |
| r306/pixel/pf6bf2d09d851.webp | HOLD | baseline[2, 7] | 16 | 19.88 | 1.14 |
| r306/pixel/pf7600322bd41.webp | HOLD | jitter[9] | 0 | 48.0 | 1.1277 |
| r306/pixel/pf7f5394c1c7b.webp | HOLD | baseline[2, 7] | 16 | 19.88 | 1.14 |
| r363/mobs/L102.webp | HOLD | baseline[3, 7] | 10 | 18.56 | 1.2857 |
| r366/tornado-back.webp | HOLD | baseline[0, 11] | 15 | 22.41 | 1.107 |
| r366/tornado-front.webp | HOLD | baseline[0, 1, 2, 5, 6] | 23 | 19.64 | 1.1005 |
| r410/mobs/m011.webp | HOLD | scale[3, 7]; jitter[8] | 4 | 38.01 | 1.551 |
| r410/mobs/m027.webp | HOLD | baseline[2, 6]; jitter[8, 9, 10] | 18 | 51.37 | 1.0146 |
| r410/mobs/m029.webp | HOLD | jitter[9, 10] | 1 | 42.54 | 1.0303 |
| r410/mobs/m039.webp | HOLD | baseline[2] | 19 | 3.12 | 1.099 |
| r410/mobs/m040.webp | HOLD | baseline[3] | 13 | 4.08 | 1.066 |
| r410/mobs/m043.webp | HOLD | scale[2, 3, 4]; scale[8, 9] | 1 | 15.4 | 1.8831 |
| r410/mobs/m045.webp | HOLD | jitter[8] | 5 | 37.0 | 1.1319 |
| r410/mobs/m047.webp | HOLD | baseline[2] | 11 | 3.8 | 1.0507 |
| r410/mobs/m048.webp | HOLD | bleed[9] | 8 | 3.82 | 1.0363 |
| r410/mobs/m054.webp | HOLD | baseline[1, 2, 7] | 21 | 3.88 | 1.1 |
| r410/mobs/m056.webp | HOLD | scale[9] | 1 | 8.1 | 1.5102 |
| r410/mobs/m075.webp | HOLD | baseline[2, 5, 7] | 22 | 5.88 | 1.0955 |
| r410/mobs/m080.webp | HOLD | baseline[0, 2, 7] | 23 | 9.42 | 1.125 |
| r410/mobs/m084.webp | HOLD | jitter[8, 10] | 8 | 47.9 | 1.2174 |
| r425/hunter/attack-l.webp | HOLD | empty[7] | 0 | 0.67 | 1.125 |
| r425/hunter/attack-r.webp | HOLD | empty[7] | 0 | 0.67 | 1.125 |
| r1179/mobs/m077.webp | PASS | - | 2 | 9.84 | 1.0096 |
| r1179/mobs/m081.webp | PASS | - | 1 | 4.09 | 1.1165 |
| r144/walk/gunner/walk-e.webp | PASS | - | 5 | 2.21 | 1.0508 |
| r144/walk/hwando/walk-e.webp | PASS | - | 3 | 2.97 | 1.0279 |
| r226/michaela/run-ne-v3.webp | PASS | - | 3 | 4.72 | 1.0857 |
| r248/mobs/m001.webp | PASS | - | 0 | 12.0 | 1.0 |
| r248/mobs/m002.webp | PASS | - | 0 | 17.63 | 1.1053 |
| r248/mobs/m006.webp | PASS | - | 0 | 13.24 | 1.0208 |
| r248/mobs/m007.webp | PASS | - | 0 | 13.24 | 1.0208 |
| r248/mobs/m010.webp | PASS | - | 0 | 13.24 | 1.0208 |
| r248/mobs/m011.webp | PASS | - | 0 | 21.45 | 1.0189 |
| r248/mobs/m013.webp | PASS | - | 0 | 13.56 | 1.06 |
| r248/mobs/m016.webp | PASS | - | 0 | 21.57 | 1.06 |
| r248/mobs/m017.webp | PASS | - | 0 | 13.24 | 1.0208 |
| r248/mobs/m019.webp | PASS | - | 0 | 19.91 | 1.0465 |
| r248/mobs/m025.webp | PASS | - | 0 | 12.0 | 1.4286 |
| r248/mobs/m028.webp | PASS | - | 0 | 19.91 | 1.0465 |
| r248/mobs/m030.webp | PASS | - | 0 | 19.91 | 1.0465 |
| r248/mobs/m031.webp | PASS | - | 0 | 15.61 | 1.02 |
| r248/mobs/m032.webp | PASS | - | 0 | 5.49 | 1.0208 |
| r248/mobs/m033.webp | PASS | - | 0 | 5.49 | 1.0208 |
| r248/mobs/m035.webp | PASS | - | 0 | 19.91 | 1.0465 |
| r248/mobs/m036.webp | PASS | - | 0 | 5.49 | 1.0208 |
| r248/mobs/m037.webp | PASS | - | 0 | 5.49 | 1.0208 |
| r248/mobs/m043.webp | PASS | - | 0 | 12.0 | 1.4286 |
| r248/mobs/m044.webp | PASS | - | 0 | 13.24 | 1.0208 |
| r248/mobs/m048.webp | PASS | - | 0 | 13.24 | 1.0208 |
| r248/mobs/m056.webp | PASS | - | 0 | 12.0 | 1.4286 |
| r248/mobs/m057.webp | PASS | - | 0 | 12.0 | 1.0769 |
| r248/mobs/m058.webp | PASS | - | 0 | 12.0 | 1.0769 |
| r248/mobs/m059.webp | PASS | - | 0 | 12.0 | 1.0769 |
| r248/mobs/m060.webp | PASS | - | 0 | 12.0 | 1.4286 |
| r248/mobs/m061.webp | PASS | - | 0 | 12.0 | 1.0769 |
| r248/mobs/m062.webp | PASS | - | 0 | 13.24 | 1.0208 |
| r248/mobs/m064.webp | PASS | - | 0 | 12.0 | 1.0 |
| r248/mobs/m068.webp | PASS | - | 0 | 13.24 | 1.0208 |
| r248/mobs/m071.webp | PASS | - | 0 | 13.24 | 1.0208 |
| r248/mobs/m073.webp | PASS | - | 0 | 13.24 | 1.0208 |
| r248/mobs/m076.webp | PASS | - | 0 | 12.0 | 1.0769 |
| r248/mobs/m077.webp | PASS | - | 0 | 13.24 | 1.0208 |
| r248/mobs/m078.webp | PASS | - | 0 | 19.91 | 1.0465 |
| r248/mobs/m079.webp | PASS | - | 0 | 13.24 | 1.0208 |
| r248/mobs/m083.webp | PASS | - | 0 | 15.61 | 1.02 |
| r248/mobs/m086.webp | PASS | - | 0 | 13.24 | 1.0208 |
| r248/mobs/m089.webp | PASS | - | 0 | 13.24 | 1.0208 |
| r248/mobs/m091.webp | PASS | - | 0 | 4.85 | 1.0213 |
| r248/mobs/m094.webp | PASS | - | 0 | 13.24 | 1.0208 |
| r248/mobs/m096.webp | PASS | - | 0 | 13.24 | 1.0208 |
| r248/mobs/m097.webp | PASS | - | 0 | 13.24 | 1.0208 |
| r248/mobs/m098.webp | PASS | - | 0 | 15.61 | 1.02 |
| r248/mobs/m100.webp | PASS | - | 0 | 15.61 | 1.02 |
| r290/mobs/m001.webp | PASS | - | 1 | 20.85 | 1.0299 |
| r290/mobs/m003.webp | PASS | - | 1 | 7.79 | 1.0207 |
| r290/mobs/m004.webp | PASS | - | 2 | 18.32 | 1.0761 |
| r290/mobs/m005.webp | PASS | - | 2 | 7.82 | 1.1017 |
| r290/mobs/m014.webp | PASS | - | 1 | 5.7 | 1.0442 |
| r290/mobs/m052.webp | PASS | - | 2 | 20.16 | 1.183 |
| r290/mobs/m057.webp | PASS | - | 9 | 8.75 | 1.0385 |
| r290/mobs/m061.webp | PASS | - | 9 | 7.43 | 1.1077 |
| r290/mobs/m064.webp | PASS | - | 1 | 7.34 | 1.0206 |
| r290/mobs/m066.webp | PASS | - | 6 | 2.32 | 1.0309 |
| r290/mobs/m073.webp | PASS | - | 1 | 7.77 | 1.0157 |
| r290/mobs/m082.webp | PASS | - | 10 | 3.6 | 1.0508 |
| r290/mobs/m087.webp | PASS | - | 5 | 2.67 | 1.0296 |
| r290/mobs/m088.webp | PASS | - | 7 | 3.31 | 1.0383 |
| r306/pixel/p02e4b2c0c967.webp | PASS | - | 0 | 15.61 | 1.02 |
| r306/pixel/p047e6f7538aa.webp | PASS | - | 0 | 13.24 | 1.0208 |
| r306/pixel/p076f7fca9911.webp | PASS | - | 0 | 13.24 | 1.0208 |
| r306/pixel/p08036fb54e5c.webp | PASS | - | 0 | 19.91 | 1.0465 |
| r306/pixel/p09553a7c5567.webp | PASS | - | 0 | 5.49 | 1.0208 |
| r306/pixel/p0b12ad078636.webp | PASS | - | 0 | 12.0 | 1.4286 |
| r306/pixel/p1503fe78ff60.webp | PASS | - | 0 | 13.24 | 1.0208 |
| r306/pixel/p16b484888c6c.webp | PASS | - | 0 | 13.24 | 1.0208 |
| r306/pixel/p1c1d0d2f945a.webp | PASS | - | 0 | 21.45 | 1.0189 |
| r306/pixel/p1c71c07c853c.webp | PASS | - | 0 | 13.24 | 1.0208 |
| r306/pixel/p1ff2b3e04217.webp | PASS | - | 0 | 15.61 | 1.02 |
| r306/pixel/p2086f52c386f.webp | PASS | - | 0 | 19.91 | 1.0465 |
| r306/pixel/p2346ce3faf4c.webp | PASS | - | 0 | 13.24 | 1.0208 |
| r306/pixel/p2453efe589b5.webp | PASS | - | 0 | 17.63 | 1.1053 |
| r306/pixel/p29849ee251d6.webp | PASS | - | 0 | 13.24 | 1.0208 |
| r306/pixel/p2add939a3049.webp | PASS | - | 0 | 12.0 | 1.4286 |
| r306/pixel/p2f6628a4466c.webp | PASS | - | 0 | 12.0 | 1.4286 |
| r306/pixel/p3082c994fe4e.webp | PASS | - | 0 | 13.24 | 1.0208 |
| r306/pixel/p320459a8166c.webp | PASS | - | 0 | 21.45 | 1.0189 |
| r306/pixel/p3a3b1612cb3b.webp | PASS | - | 0 | 13.24 | 1.0208 |
| r306/pixel/p3ac72a81cc05.webp | PASS | - | 0 | 5.49 | 1.0208 |
| r306/pixel/p40d825f5a223.webp | PASS | - | 0 | 21.93 | 1.02 |
| r306/pixel/p47d009168139.webp | PASS | - | 0 | 15.61 | 1.02 |
| r306/pixel/p49837d7f78af.webp | PASS | - | 0 | 15.61 | 1.02 |
| r306/pixel/p4b7f41abdf1a.webp | PASS | - | 0 | 21.93 | 1.02 |
| r306/pixel/p4e2baf32314f.webp | PASS | - | 0 | 13.24 | 1.0208 |
| r306/pixel/p5052a80f1795.webp | PASS | - | 0 | 13.24 | 1.0208 |
| r306/pixel/p5188256667ec.webp | PASS | - | 0 | 13.24 | 1.0208 |
| r306/pixel/p51ec979472c2.webp | PASS | - | 0 | 5.49 | 1.0208 |
| r306/pixel/p5247d50d5b9d.webp | PASS | - | 0 | 15.61 | 1.02 |
| r306/pixel/p53d380fb7c4c.webp | PASS | - | 0 | 5.49 | 1.0208 |
| r306/pixel/p5447cad8aa60.webp | PASS | - | 0 | 13.24 | 1.0208 |
| r306/pixel/p555feb2a2344.webp | PASS | - | 0 | 5.49 | 1.0208 |
| r306/pixel/p590b93495cd8.webp | PASS | - | 0 | 13.24 | 1.0208 |
| r306/pixel/p5b54d4901722.webp | PASS | - | 0 | 15.05 | 1.0185 |
| r306/pixel/p66aa9473d482.webp | PASS | - | 0 | 5.49 | 1.0208 |
| r306/pixel/p66f5a50c836f.webp | PASS | - | 0 | 13.24 | 1.0208 |
| r306/pixel/p687eb7a4f882.webp | PASS | - | 0 | 13.24 | 1.0208 |
| r306/pixel/p68d79cfeece0.webp | PASS | - | 0 | 13.24 | 1.0208 |
| r306/pixel/p6dd5b163d266.webp | PASS | - | 0 | 12.0 | 1.0769 |
| r306/pixel/p72b7f18ea0aa.webp | PASS | - | 0 | 13.24 | 1.0208 |
| r306/pixel/p7568608ce6b7.webp | PASS | - | 0 | 19.91 | 1.0465 |
| r306/pixel/p772d5da4558f.webp | PASS | - | 0 | 5.49 | 1.0208 |
| r306/pixel/p78267d0c869a.webp | PASS | - | 0 | 15.61 | 1.02 |
| r306/pixel/p78ff7c6b69f0.webp | PASS | - | 0 | 13.24 | 1.0208 |
| r306/pixel/p7a25b221af27.webp | PASS | - | 0 | 13.24 | 1.0208 |
| r306/pixel/p7b46663659b0.webp | PASS | - | 0 | 21.45 | 1.0189 |
| r306/pixel/p8341f7a5a6f8.webp | PASS | - | 0 | 13.24 | 1.0208 |
| r306/pixel/p84b378bed5f7.webp | PASS | - | 0 | 13.24 | 1.0208 |
| r306/pixel/p85b862cce9af.webp | PASS | - | 0 | 5.49 | 1.0208 |
| r306/pixel/p85da69f8c0d8.webp | PASS | - | 0 | 12.0 | 1.0769 |
| r306/pixel/p89479ec8ce41.webp | PASS | - | 0 | 5.49 | 1.0208 |
| r306/pixel/p8e8ab2dd0fda.webp | PASS | - | 0 | 13.24 | 1.0208 |
| r306/pixel/p8e9a91fafed6.webp | PASS | - | 0 | 13.24 | 1.0208 |
| r306/pixel/p90df28c98e11.webp | PASS | - | 0 | 13.24 | 1.0208 |
| r306/pixel/p90e15562027c.webp | PASS | - | 0 | 5.49 | 1.0208 |
| r306/pixel/p91799c645ad0.webp | PASS | - | 0 | 4.85 | 1.0213 |
| r306/pixel/p91e83cb2e733.webp | PASS | - | 0 | 13.24 | 1.0208 |
| r306/pixel/p92045a55e81f.webp | PASS | - | 0 | 13.24 | 1.0208 |
| r306/pixel/p94c2d1938655.webp | PASS | - | 0 | 15.61 | 1.02 |
| r306/pixel/p98931d16e385.webp | PASS | - | 0 | 19.91 | 1.0465 |
| r306/pixel/p9ace9a3e9c7d.webp | PASS | - | 0 | 13.24 | 1.0208 |
| r306/pixel/pa68bff7f1f3b.webp | PASS | - | 0 | 4.85 | 1.0213 |
| r306/pixel/pa80938538360.webp | PASS | - | 0 | 13.24 | 1.0208 |
| r306/pixel/pa832fc0f4661.webp | PASS | - | 0 | 19.91 | 1.0465 |
| r306/pixel/pa87ac9a0eaa8.webp | PASS | - | 0 | 5.49 | 1.0208 |
| r306/pixel/pb24fbec61b2b.webp | PASS | - | 0 | 13.24 | 1.0208 |
| r306/pixel/pb4f0f93d77a0.webp | PASS | - | 0 | 13.24 | 1.0208 |
| r306/pixel/pb8341bce6abd.webp | PASS | - | 0 | 13.24 | 1.0208 |
| r306/pixel/pcd5fa60058b9.webp | PASS | - | 0 | 22.04 | 1.0208 |
| r306/pixel/pd137732841f6.webp | PASS | - | 0 | 19.91 | 1.0465 |
| r306/pixel/pd17766629f09.webp | PASS | - | 0 | 4.88 | 1.0213 |
| r306/pixel/pd6cf275644bf.webp | PASS | - | 0 | 13.24 | 1.0208 |
| r306/pixel/pd79f70d44200.webp | PASS | - | 0 | 13.24 | 1.0208 |
| r306/pixel/pda589b38b01d.webp | PASS | - | 0 | 5.22 | 1.0213 |
| r306/pixel/pdbf321a1a081.webp | PASS | - | 0 | 12.0 | 1.0 |
| r306/pixel/pde13437ae654.webp | PASS | - | 0 | 19.91 | 1.0465 |
| r306/pixel/pe027d83a6b10.webp | PASS | - | 0 | 13.24 | 1.0208 |
| r306/pixel/pe1bdc656566f.webp | PASS | - | 0 | 5.49 | 1.0208 |
| r306/pixel/pe6822a19684a.webp | PASS | - | 0 | 5.49 | 1.0208 |
| r306/pixel/pe790db007afd.webp | PASS | - | 0 | 5.49 | 1.0208 |
| r306/pixel/pe7abcfa8661e.webp | PASS | - | 0 | 21.93 | 1.02 |
| r306/pixel/pe86264aba5fd.webp | PASS | - | 0 | 13.24 | 1.0208 |
| r306/pixel/pecb90e930a61.webp | PASS | - | 0 | 5.49 | 1.0208 |
| r306/pixel/pf07944107f6a.webp | PASS | - | 0 | 13.24 | 1.0208 |
| r306/pixel/pf24f70981149.webp | PASS | - | 0 | 13.24 | 1.0208 |
| r306/pixel/pf490905e252f.webp | PASS | - | 0 | 13.24 | 1.0208 |
| r306/pixel/pf672985ea4f7.webp | PASS | - | 0 | 13.24 | 1.0208 |
| r306/pixel/pf8b527f039e6.webp | PASS | - | 0 | 5.49 | 1.0208 |
| r306/pixel/pfe37f18eb7ed.webp | PASS | - | 0 | 5.49 | 1.0208 |
| r363/mobs/L128.webp | PASS | - | 4 | 14.11 | 1.0197 |
| r410/mobs/m007.webp | PASS | - | 1 | 12.8 | 1.0183 |
| r410/mobs/m009.webp | PASS | - | 1 | 18.35 | 1.0085 |
| r410/mobs/m013.webp | PASS | - | 1 | 16.85 | 1.0949 |
| r410/mobs/m015.webp | PASS | - | 1 | 29.33 | 1.0195 |
| r410/mobs/m016.webp | PASS | - | 1 | 6.77 | 1.0248 |
| r410/mobs/m018.webp | PASS | - | 8 | 9.78 | 1.0462 |
| r410/mobs/m028.webp | PASS | - | 2 | 8.83 | 1.2077 |
| r410/mobs/m033.webp | PASS | - | 6 | 4.31 | 1.0284 |
| r410/mobs/m044.webp | PASS | - | 3 | 15.37 | 1.0188 |
| r410/mobs/m046.webp | PASS | - | 4 | 11.79 | 1.0452 |
| r410/mobs/m050.webp | PASS | - | 11 | 3.9 | 1.0704 |
| r410/mobs/m060.webp | PASS | - | 2 | 6.22 | 1.3661 |
| r410/mobs/m062.webp | PASS | - | 0 | 4.88 | 1.0051 |
| r410/mobs/m063.webp | PASS | - | 10 | 4.81 | 1.0628 |
| r410/mobs/m069.webp | PASS | - | 0 | 12.58 | 1.1485 |
| r410/mobs/m070.webp | PASS | - | 7 | 6.07 | 1.0474 |
| r410/mobs/m071.webp | PASS | - | 2 | 1.63 | 1.0168 |
| r410/mobs/m072.webp | PASS | - | 2 | 3.32 | 1.0075 |
| r410/mobs/m078.webp | PASS | - | 3 | 6.85 | 1.2645 |
| r410/mobs/m091.webp | PASS | - | 8 | 5.51 | 1.0484 |
| r410/mobs/m092.webp | PASS | - | 2 | 8.66 | 1.0323 |
| r410/mobs/m094.webp | PASS | - | 1 | 6.11 | 1.0199 |
| r410/mobs/m096.webp | PASS | - | 8 | 2.89 | 1.0402 |
| r410/mobs/m098.webp | PASS | - | 4 | 4.74 | 1.0191 |
| r410/mobs/m099.webp | PASS | - | 2 | 7.17 | 1.0139 |
| r410/mobs/m100.webp | PASS | - | 1 | 11.94 | 1.0848 |
| r411/fx/boss-bone-spikes.webp | PASS | - | 0 | 0 | 1.0 |
| r411/fx/boss-corpse-explosion.webp | PASS | - | 0 | 0 | 1.0 |
| r411/fx/boss-fire-wall.webp | PASS | - | 0 | 0 | 1.0 |
| r411/fx/boss-gravity-well.webp | PASS | - | 0 | 0 | 1.0 |
| r411/fx/boss-ground-fissure.webp | PASS | - | 0 | 0 | 1.0 |
| r411/fx/boss-infection-mark.webp | PASS | - | 0 | 0 | 1.0 |
| r411/fx/boss-lightning-strike.webp | PASS | - | 0 | 0 | 1.0 |
| r411/fx/boss-meteor.webp | PASS | - | 0 | 0 | 1.0 |
| r411/fx/boss-tentacle-bind.webp | PASS | - | 0 | 0 | 1.0 |
| r411/fx/hit-chain-lightning.webp | PASS | - | 0 | 0 | 1.0 |
| r411/fx/hit-explosion.webp | PASS | - | 0 | 0 | 1.0 |
| r411/fx/hit-fire.webp | PASS | - | 0 | 0 | 1.0 |
| r411/fx/hit-ice-spikes.webp | PASS | - | 0 | 0 | 1.0 |
| r411/fx/hit-teleport.webp | PASS | - | 0 | 0 | 1.0 |
| r438/fx/enemy-cold-wave.webp | PASS | - | 0 | 0 | 1.0 |
| r438/fx/enemy-curse-brand.webp | PASS | - | 0 | 0 | 1.0 |
| r438/fx/enemy-poison-mist.webp | PASS | - | 0 | 0 | 1.0 |
| r438/fx/enemy-shockwave.webp | PASS | - | 0 | 0 | 1.0 |
| r438/fx/enemy-wraith-dash.webp | PASS | - | 0 | 0 | 1.0 |
| r438/fx/hero-barrier.webp | PASS | - | 0 | 0 | 1.0 |
| r438/fx/hero-cleanse.webp | PASS | - | 0 | 0 | 1.0 |
| r438/fx/hero-healing.webp | PASS | - | 0 | 0 | 1.0 |

## 건너뜀

- r290/mobs/m001_walk_00.png (missing file)
- r290/mobs/m001_walk_01.png (missing file)
- r290/mobs/m001_walk_02.png (missing file)
- r290/mobs/m001_walk_03.png (missing file)
- r290/mobs/m001_walk_04.png (missing file)
- r290/mobs/m001_walk_05.png (missing file)
- r290/mobs/m001_walk_06.png (missing file)
- r290/mobs/m001_walk_07.png (missing file)
- r290/mobs/m001_attack_00.png (missing file)
- r290/mobs/m001_attack_01.png (missing file)
- r290/mobs/m001_attack_02.png (missing file)
- r290/mobs/m001_attack_03.png (missing file)
- r290/mobs/m003_walk_00.png (missing file)
- r290/mobs/m003_walk_01.png (missing file)
- r290/mobs/m003_walk_02.png (missing file)
- r290/mobs/m003_walk_03.png (missing file)
- r290/mobs/m003_walk_04.png (missing file)
- r290/mobs/m003_walk_05.png (missing file)
- r290/mobs/m003_walk_06.png (missing file)
- r290/mobs/m003_walk_07.png (missing file)
- r290/mobs/m003_attack_00.png (missing file)
- r290/mobs/m003_attack_01.png (missing file)
- r290/mobs/m003_attack_02.png (missing file)
- r290/mobs/m003_attack_03.png (missing file)
- r290/mobs/m004_walk_00.png (missing file)
- r290/mobs/m004_walk_01.png (missing file)
- r290/mobs/m004_walk_02.png (missing file)
- r290/mobs/m004_walk_03.png (missing file)
- r290/mobs/m004_walk_04.png (missing file)
- r290/mobs/m004_walk_05.png (missing file)
- r290/mobs/m004_walk_06.png (missing file)
- r290/mobs/m004_walk_07.png (missing file)
- r290/mobs/m004_attack_00.png (missing file)
- r290/mobs/m004_attack_01.png (missing file)
- r290/mobs/m004_attack_02.png (missing file)
- r290/mobs/m004_attack_03.png (missing file)
- r290/mobs/m005_walk_00.png (missing file)
- r290/mobs/m005_walk_01.png (missing file)
- r290/mobs/m005_walk_02.png (missing file)
- r290/mobs/m005_walk_03.png (missing file)
- r290/mobs/m005_walk_04.png (missing file)
- r290/mobs/m005_walk_05.png (missing file)
- r290/mobs/m005_walk_06.png (missing file)
- r290/mobs/m005_walk_07.png (missing file)
- r290/mobs/m005_attack_00.png (missing file)
- r290/mobs/m005_attack_01.png (missing file)
- r290/mobs/m005_attack_02.png (missing file)
- r290/mobs/m005_attack_03.png (missing file)
- r290/mobs/frame_01.png (missing file)
- r290/mobs/frame_02.png (missing file)
- r290/mobs/frame_03.png (missing file)
- r290/mobs/frame_04.png (missing file)
- r290/mobs/frame_05.png (missing file)
- r290/mobs/frame_06.png (missing file)
- r290/mobs/frame_07.png (missing file)
- r290/mobs/frame_08.png (missing file)
- r290/mobs/frame_09.png (missing file)
- r290/mobs/frame_10.png (missing file)
- r290/mobs/frame_11.png (missing file)
- r290/mobs/frame_12.png (missing file)
