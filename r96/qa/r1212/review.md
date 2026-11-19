# R1212 코드 합성 효과음 → ElevenLabs 효과음

사용자 2026-11-19 "단순코드로만든 모든효과음 조사해서 일레븐랩스로 각각상황에 맞는 고품질 효과음으로 바꿔 메이플,워크등 유명게임효과음 참고해서".

## 전수 조사(소리 파일 없이 WebAudio 오실레이터·잡음으로 만들던 곳)

| 파일 | 소리 | 바꾼 뒤 |
|---|---|---|
| ambience-r125.js | 사몽 구역 깔리는 소리 5종(wind·leaves·hum·drone·room) | leaves·hum·drone 새 생성, wind·room 은 R664 ElevenLabs 환경음 재사용 |
| ambience-r125.js | 가끔 소리 17종(발소리·종·딩·돌풍·쇳소리·쿵·짹짹·글리치·풍경·오르골·초침·물방울·붓질·유리·전차 종·속삭임·심장) | 16종 새 생성, 유리는 풍경을 1.5배 높여 씀 |
| kairo-homage-r356.js | 카이로 초침·시간 제어 종·구역 입장 쇠종 | 종·쇠종 새 생성, 초침은 R125 초침 공유(음량 따로) |
| boss-cinematic-r568.js | 보스 등장 낮은 울림 | 새 생성 |
| samong-mood-r123.js | 층·연도 숫자 딸깍 | 새 생성(높은 딸깍은 재생 속도 1.25) |

그 밖의 createOscillator·createBuffer 사용(sfx-mix-r993·sfx-r541·visual-r93-ui·audio-r108·ambience-r664)은 이미 파일 소리를 가공·재생하는 코드라 대상 아님. EGO·페르소나 전용(R1155)·전투 효과음은 손대지 않음.

## 방법
- ElevenLabs text-to-sound v3, 23문구 × 변주 4 = 92개 요청(3개는 동시 실행 한도로 늦어져 안 씀), 약 1,564크레딧. 재시도·재생성 없음. 문구에 외부 게임 이름 없음(느낌만: 짧고 또렷한 타격·맑은 종·어두운 울림).
- scripts/build-sfx-r1212.py: 변주 중 상황 길이·음색(2~5kHz 거슬림·150Hz 아래 비중·너무 높은 중심 주파수)으로 골라 자르고 다듬음. 음량은 예전 합성과 같은 크기(가장 큰 구간 RMS), 단 거의 안 들리던 합성(초침 -55dB 등)은 바닥값까지 올림.
- 훅: 네 파일이 소리 내기 직전 `__STORYWORLD_SYNTH_SFX_R1212__` 에 묻고, 파일이 준비돼 있지 않거나 끄면(storyworld.r1212.sfx=0) 예전 합성 그대로.

## 표

| 종류 | 게인 | 파일 |
|---|---|---|
| amb_bell | 1.064 | amb-bell-1.ogg |
| amb_boom | 1.799 | amb-boom-1.ogg |
| amb_brush | 0.423 | amb-brush-1.ogg, amb-brush-2.ogg |
| amb_chime | 0.909 | amb-chime-1.ogg |
| amb_chirp | 0.46 | amb-chirp-1.ogg, amb-chirp-2.ogg |
| amb_clank | 0.362 | amb-clank-1.ogg |
| amb_ding | 1.052 | amb-ding-1.ogg |
| amb_drip | 0.548 | amb-drip-1.ogg, amb-drip-2.ogg |
| amb_glass | 0.909 ×1.5 | amb-chime-1.ogg |
| amb_glitch | 0.223 | amb-glitch-1.ogg, amb-glitch-2.ogg |
| amb_gust | 0.246 | amb-gust-1.ogg |
| amb_heart | 1.864 | amb-heart-1.ogg, amb-heart-2.ogg |
| amb_music | 0.309 | amb-music-1.ogg |
| amb_steps | 0.494 | amb-steps-1.ogg, amb-steps-2.ogg |
| amb_tick | 0.539 | amb-tick-1.ogg, amb-tick-2.ogg |
| amb_tram | 0.462 | amb-tram-1.ogg |
| amb_whisper | 0.234 | amb-whisper-1.ogg |
| banner_tick | 0.342 | banner-tick-1.ogg, banner-tick-2.ogg |
| bed_drone | 2.5 | bed-drone.ogg |
| bed_hum | 0.999 | bed-hum.ogg |
| bed_leaves | 1.357 | bed-leaves.ogg |
| bed_room | 2.5 | hall.ogg |
| bed_wind | 2.5 | wind.ogg |
| boss_reveal | 1.431 | boss-reveal-1.ogg |
| kairo_chime | 0.184 | kairo-chime-1.ogg |
| kairo_tick | 0.266 | amb-tick-1.ogg, amb-tick-2.ogg |
| kairo_toll | 0.343 | kairo-toll-1.ogg |

## 미검증
- 귀로 들은 확인(사용자 청취), 실기기 모바일, 자연 플레이에서 카이로 시계·보스 등장·층 표시 딸깍 실제 발동(헤드리스는 사몽 기계 구역 깔리는 소리·가끔 소리만 확인).
- 깔리는 소리 중 바람·방 공기(R664 재사용)는 게인 상한 2.5 로 예전 합성보다 약 4~6dB 작음(바닥소리 원칙상 그대로 둠).
