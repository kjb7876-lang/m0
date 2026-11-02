/* R204 유기적 동굴 지형 — 시범 지역: 거미동굴(dist01). 사용자 2026-11-01 "스토리월드 유기적 2.5D 맵 리마스터 … 기존 자산 최우선 …
 * 거미동굴 맵 하나부터 시범 적용 … 영상의 맵 같은 형식이 목표".
 *  보이는 것만 바꾼다. 충돌(exploration.walls·floorCells)·문·몹·보스·저장·카메라·캐릭터 크기는 그대로다.
 *  · 바닥 칸(floorCells)에서 부호 거리장을 만들고(칸당 4점) 부드럽게 한 뒤 고정 시드 노이즈를 ±0.28칸 섞는다.
 *    그 0 등고선이 동굴 경계다 — 직각·계단 외곽선이 생기지 않고, 실제 보행 칸 경계에서 0.4칸 넘게 벗어나지 않는다.
 *  · 바닥: 기존 질감 3종(r118 거미동굴 바닥·r118 검은 모래·r99 갈라진 암반)을 거리장 텍스처의 노이즈 채널로 섞어
 *    한 장의 지면 메시로 그린다(셰이더 혼합 — 큰 베이크 텍스처 없이 512px 질감 3장 + 320px 거리장 1장). 절벽 밑은 접촉 그림자.
 *  · 암반 대지: 같은 거리장으로 잘라낸 높이장 메시(칸당 1점). 카메라 쪽(남동) 대지는 낮게(0.45), 뒤쪽은 높게(1.6) — 통로를 가리지 않게.
 *    절벽면: 0 등고선(마칭 스퀘어)을 위로 세운 면. 질감은 r99 이끼 암벽면(오른쪽 반), 아래로 갈수록 어둡게.
 *  · 장식(고정 시드): 대지 가장자리의 종유석·바위 기둥(낮은 다각 원뿔, 암벽 질감), 바닥 데칼(기존 균열·뼈·뿌리 그림 + 직접 그린 거미줄·잔돌).
 *  · 영웅 앞을 가리는 대지·절벽·기둥은 영웅 둘레만 성글게 비춰 보인다(디더). 시야(횃불) 마스크는 엔진 attachSight24 로 그대로 붙인다.
 *  · 원래 벽판·벽 장식·바닥 청크는 숨기기만 한다(지우지 않음). storyworld.r204.cave {on:false} 로 원래 모습.
 * Canonical source; copied to runtime-text by scripts/sync-r99.py. */
(()=>{'use strict';
const A=window.StoryPhase1,C=A?.ThreeRenderer?.prototype;
if(!A||!C||window.__STORYWORLD_CAVE_R204__)return;
const REV='R220-cave-1',KEY='storyworld.r204.cave';
let prefs={on:true,widen:true,skeleton:false,inflate:true,unify:true};/* R220: 사용자 "벽에 기둥이 오히려 품질을 저하" → 기둥 골격(R218)은 기본 끔 */try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(typeof s?.on==='boolean')prefs.on=s.on;if(typeof s?.widen==='boolean')prefs.widen=s.widen;if(typeof s?.skeleton==='boolean')prefs.skeleton=s.skeleton;if(typeof s?.inflate==='boolean')prefs.inflate=s.inflate;if(typeof s?.unify==='boolean')prefs.unify=s.unify;}catch(_){}
const stats={blocks:0,builds:0,buildMs:0,hidden:0,segments:0,pillars:0,decals:0,frames:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.stack||e).slice(0,300);};
// 지역별 설정. 확장할 때 여기에 한 줄씩 더한다.
const ZONES={
 // 마수궁 피난 거점(첫 맵): 무너진 석조 회랑 — 정원 돌길·이끼·흙 바닥, 벽면은 기존 벽돌(r118 공방 벽), 윗면은 이끼 낀 잔해(r99 폐허 오른쪽 반).
 //  통로 넓히기 없음(회랑 레이아웃 그대로), 불룩도 작게(건축물), 둔덕 위 낮은 돌 경계.
 hub:{decalMix:{near:[[5,3],[6,3],[2,1],[11,2]],open:[[0,2],[5,3],[6,3],[7,2],[11,1]]},tufts:['assets/r138/props/weed.webp',.11,1/70],seed:0x5d00a1,tint:[.96,.9,.8],floorBGain:1.05,hiTop:1.75,loTop:.55,bulge:.7,widen:false,web:false,pillars:false,boulders:1/120,floorK:1.15,topK:2.0,
  tex:{floorA:['assets/r118/tiles/garden.webp',0],floorB:['assets/r118/tiles/castle.webp',0],rock:['assets/r99/outdoor/ground-ruin.webp',1],face:['assets/r118/tiles/workshop.webp',1]},
  patches:[['garden_root_paving_break_01','floor',.32,1/420,.8],['garden_soil_paving_transition_01','floor',.34,1/380,.8]],uprights:[['garden_low_border_01',.3]],uprightRate:1/160,uprightEdge:[-1.0,-.35]},
 // 거미동굴: 흙·암반 동굴, 종유석, 거미줄
 dist01:{seed:0x5d0124,tint:[1.0,.78,.55],hiTop:1.6,loTop:.45,bulge:1.35,widen:true,web:true,pillars:true,
  // R207 Drive 「첫 정원 → 거미동굴」 512 패치: 절벽 밑 흙·자갈·접지 그림자(바닥 평면), 뒤쪽 대지 가장자리 암벽 조각(세운 그림)
  patches:[['soil_rock_transition_01','base',.3,1/90,.5],['soil_rock_transition_02','base',.3,1/90,.5],['cliff_contact_shadow_01','base',.42,1/110,1]],
  // 암벽 조각(세운 그림)은 동굴 암반 질감과 어긋나 보여 쓰지 않는다(R207 2차) — 대신 대지 위 낮은 바위 무더기(boulders)
  boulders:1/60,floorK:1.02,topK:2.25},
 // 악마화 나무의 정원: 정원 돌길·이끼 흙·마른 풀, 이끼 낀 둔덕, 둔덕 위 마른 나무(r99 원화 12장). 거미줄 없음.
 dist00:{decalMix:{near:[[2,3],[11,3],[5,2],[6,2]],open:[[0,2],[11,3],[5,2],[6,2],[7,1],[2,1]]},decalDensity:11,tufts:['assets/r138/props/weed.webp',.12,1/34],seed:0x5d0077,tint:[.86,.92,.76],topK:1.9,floorK:1.0,hiTop:1.3,loTop:.4,bulge:1.35,widen:true,web:false,pillars:false,trees:'dead',
  tex:{floorA:['assets/r118/tiles/garden.webp',0],floorB:['assets/r99/outdoor/ground-moss.webp',0],rock:['assets/r99/outdoor/surround-moss.webp',-1],face:['assets/r99/outdoor/ground-moss.webp',1]},
  patches:[['garden_root_paving_break_01','floor',.36,1/260,.8],['garden_soil_paving_transition_01','floor',.38,1/220,.8],['soil_rock_transition_02','base',.3,1/120,.5]],
  uprights:[['garden_low_border_01',.34]],uprightRate:1/110},
 // R210 — 나머지 1부 야외 지역(사용자 "나머지맵들도 작업 … 모든맵이 화풍이 비슷해야함"). 통로 넓히기는 하지 않는다(맵 레이아웃·전수 검사 그대로), 불룩도 중간.
 // 늪지대의 뿔악마: 이끼 흙·진흙 바닥, 물 먹은 이끼 둔덕, 마른 나무
 dist02:{decalMix:{near:[[2,3],[11,4],[5,1],[6,1]],open:[[10,4],[9,1],[11,4],[5,1],[6,1],[0,1]]},decalDensity:10,tufts:['assets/r138/props/weed.webp',.13,1/22],seed:0x5d0202,tint:[.78,.86,.7],topK:1.9,floorK:.98,hiTop:1.2,loTop:.4,bulge:1.1,widen:false,web:false,pillars:false,trees:'dead',boulders:1/150,
  tex:{floorA:['assets/r118/tiles/meadow.webp',0],floorB:['assets/r99/outdoor/ground-moss.webp',0],rock:['assets/r99/outdoor/surround-moss.webp',-1],face:['assets/r99/outdoor/ground-moss.webp',1]},
  patches:[['soil_rock_transition_01','base',.3,1/120,.5],['garden_soil_paving_transition_01','floor',.34,1/300,.8]]},
 // 무너진 성: 성 돌바닥·정원 돌길, 벽면은 성 벽돌, 윗면은 무너진 잔해 — 건축물이라 불룩 작게(hub 처럼)
 dist03:{decalMix:{near:[[5,3],[6,3],[0,2],[8,1]],open:[[0,3],[5,3],[6,2],[7,2],[8,1],[1,.4]]},decalDensity:12,seed:0x5d0303,tint:[.92,.86,.8],floorBGain:1.04,hiTop:1.75,loTop:.55,bulge:.7,widen:false,web:false,pillars:false,boulders:1/110,floorK:1.1,topK:2.0,
  tex:{floorA:['assets/r118/tiles/castle.webp',0],floorB:['assets/r118/tiles/garden.webp',0],rock:['assets/r99/outdoor/ground-ruin.webp',1],face:['assets/r118/tiles/castle.webp',1]},
  patches:[['garden_root_paving_break_01','floor',.3,1/420,.8]],uprights:[['garden_low_border_01',.3]],uprightRate:1/170,uprightEdge:[-1.0,-.35]},
 // 시체들이 되살아난 밤: 검은 흙·이끼 무덤가, 암반 둔덕, 마른 나무
 dist04:{decalMix:{near:[[2,3],[1,2],[5,2],[11,1]],open:[[1,2],[0,2],[5,2],[6,2],[11,2],[7,1]]},decalDensity:11,tufts:['assets/r138/props/weed.webp',.11,1/40],seed:0x5d0404,tint:[.8,.8,.88],topK:2.0,floorK:1.0,hiTop:1.3,loTop:.42,bulge:1.1,widen:false,web:false,pillars:false,trees:'dead',boulders:1/90,
  tex:{floorA:['assets/r118/tiles/sandblack.webp',0],floorB:['assets/r99/outdoor/ground-moss.webp',0],rock:['assets/r99/outdoor/surround-cliff.webp',-1],face:['assets/r99/outdoor/ground-cliff.webp',1]},
  patches:[['soil_rock_transition_02','base',.3,1/110,.5],['cliff_contact_shadow_01','base',.4,1/130,1]]},
 // 일곱 기둥: 금고·성 돌바닥 신전 터, 잔해 윗면 — 건축물
 dist05:{decalMix:{near:[[5,3],[6,3],[0,2]],open:[[0,4],[5,3],[6,2],[7,2],[8,.6]]},decalDensity:12,seed:0x5d0505,tint:[.9,.86,.84],floorBGain:1.03,hiTop:1.7,loTop:.55,bulge:.7,widen:false,web:false,pillars:false,boulders:1/130,floorK:1.1,topK:2.0,
  tex:{floorA:['assets/r118/tiles/vault.webp',0],floorB:['assets/r118/tiles/castle.webp',0],rock:['assets/r99/outdoor/ground-ruin.webp',1],face:['assets/r118/tiles/castle.webp',1]}},
 // 추락: 낭떠러지 암반·검은 모래
 dist06:{decalMix:{near:[[5,4],[6,3],[7,2]],open:[[5,4],[6,3],[7,3],[0,3]]},decalDensity:10,seed:0x5d0606,tint:[.92,.82,.72],hiTop:1.6,loTop:.45,bulge:1.15,widen:false,web:false,pillars:false,boulders:1/70,floorK:1.0,topK:2.2,
  tex:{floorA:['assets/r118/tiles/cave.webp',0],floorB:['assets/r118/tiles/sandblack.webp',0],rock:['assets/r99/outdoor/ground-cliff.webp',0],face:['assets/r99/outdoor/surround-cliff.webp',1]},
  patches:[['cliff_contact_shadow_01','base',.42,1/110,1]]},
 // R212 — 정원·해안 마을·설원 계열의 나머지 야외 지역(사용자 "다른맵들도작업"). 서사 지역 이름만 보고 겉모습 결을 고른다(서사·배치는 그대로). 넓히기 없음.
 // 중립 지역의 재각성(4부): 되살아나는 정원 — 살아 있는 나무·풀
 last304:{seed:0x5d3040,tint:[.84,.94,.78],topK:1.9,floorK:1.0,hiTop:1.3,loTop:.4,bulge:1.1,widen:false,web:false,pillars:false,trees:'living',boulders:1/140,
  decalMix:{near:[[2,2],[11,4],[5,2],[6,2]],open:[[11,4],[0,1],[5,2],[6,2],[7,1]]},decalDensity:11,tufts:['assets/r138/props/weed.webp',.12,1/26],
  tex:{floorA:['assets/r118/tiles/meadow.webp',0],floorB:['assets/r118/tiles/garden.webp',0],rock:['assets/r99/outdoor/surround-moss.webp',-1],face:['assets/r99/outdoor/ground-moss.webp',1]},
  patches:[['garden_soil_paving_transition_01','floor',.36,1/260,.85]],uprights:[['garden_low_border_01',.32]],uprightRate:1/140},
 // 고블린 두목과 장미 인장(4부): 장미 정원 돌길·이끼
 last305:{seed:0x5d3050,tint:[.9,.86,.8],topK:1.9,floorK:1.02,hiTop:1.3,loTop:.42,bulge:1.0,widen:false,web:false,pillars:false,trees:'living',boulders:1/120,
  decalMix:{near:[[2,2],[11,3],[5,2],[6,2]],open:[[0,2],[11,2],[5,3],[6,2],[7,1]]},decalDensity:12,tufts:['assets/r138/props/weed.webp',.11,1/34],
  tex:{floorA:['assets/r118/tiles/garden.webp',0],floorB:['assets/r99/outdoor/ground-paving.webp',0],rock:['assets/r99/outdoor/surround-moss.webp',-1],face:['assets/r99/outdoor/ground-moss.webp',1]},
  patches:[['garden_root_paving_break_01','floor',.34,1/280,.8]],uprights:[['garden_low_border_01',.3]],uprightRate:1/130},
 // 빼앗긴 시간(5부): 시간을 빼앗긴 마른 정원
 kair05:{seed:0x5d5050,tint:[.86,.84,.8],topK:2.0,floorK:1.0,hiTop:1.3,loTop:.4,bulge:1.1,widen:false,web:false,pillars:false,trees:'dead',boulders:1/110,
  decalMix:{near:[[2,3],[5,2],[6,2],[0,1]],open:[[0,3],[5,2],[6,2],[7,1],[11,1]]},decalDensity:12,tufts:['assets/r138/props/weed.webp',.1,1/50],
  tex:{floorA:['assets/r118/tiles/garden.webp',0],floorB:['assets/r118/tiles/meadow.webp',0],rock:['assets/r99/outdoor/ground-ruin.webp',1],face:['assets/r99/outdoor/ground-moss.webp',1]}},
 // 잠들지 못하는 마을(4부): 바닷가 마을 — 포장 돌길·모래, 낮은 언덕, 둔덕 위 풀
 last302:{seed:0x5d3020,tint:[.9,.88,.84],floorBGain:1.03,topK:1.9,floorK:1.05,hiTop:1.4,loTop:.5,bulge:.8,widen:false,web:false,pillars:false,boulders:1/130,
  decalMix:{near:[[5,3],[6,3],[2,1],[11,1]],open:[[0,2],[5,3],[6,2],[7,2]]},decalDensity:13,tufts:['assets/r138/props/weed.webp',.1,1/60],
  tex:{floorA:['assets/r99/outdoor/ground-paving.webp',0],floorB:['assets/r118/tiles/sandgold.webp',0],rock:['assets/r99/outdoor/surround-cliff.webp',-1],face:['assets/r99/outdoor/ground-cliff.webp',1]}},
 // 한약과 불면귀(4부): 약초 마을 — 돌길·풀밭, 살아 있는 나무 몇 그루
 last303:{seed:0x5d3030,tint:[.88,.9,.8],floorBGain:1.02,topK:1.9,floorK:1.03,hiTop:1.4,loTop:.48,bulge:.85,widen:false,web:false,pillars:false,trees:'living',boulders:1/150,
  decalMix:{near:[[2,2],[11,2],[5,2],[6,2]],open:[[0,1],[11,2],[5,2],[6,2],[7,1]]},decalDensity:12,tufts:['assets/r138/props/weed.webp',.11,1/40],
  tex:{floorA:['assets/r99/outdoor/ground-paving.webp',0],floorB:['assets/r118/tiles/meadow.webp',0],rock:['assets/r99/outdoor/surround-moss.webp',-1],face:['assets/r99/outdoor/ground-moss.webp',1]}},
 // 눈보라 속의 소년(2부): 눈 덮인 바위 언덕·검은 돌
 ep1b06b:{seed:0x5d1066,tint:[.92,.96,1.06],topK:2.1,floorK:1.04,hiTop:1.5,loTop:.45,bulge:1.15,widen:false,web:false,pillars:false,trees:'dead',boulders:1/80,
  decalMix:{near:[[5,4],[6,3],[7,2]],open:[[5,3],[6,3],[7,2],[0,1]]},decalDensity:13,
  tex:{floorA:['assets/r118/tiles/snow.webp',0],floorB:['assets/r118/tiles/sandblack.webp',0],rock:['assets/r118/tiles/snow.webp',0],face:['assets/r99/outdoor/ground-cliff.webp',1]}},
 // R213 — 돌 유적 계열 야외 지역(탐침 계열 stone, 판타지 유적 서사). 건축물이라 불룩 작게(무너진 성·일곱 기둥처럼), 넓히기 없음.
 // 솔로몬의 봉인식(2부): 봉인 의식 터 — 금고 돌바닥·성 돌, 균열·쇠사슬
 ep1b01:{seed:0x5d1010,tint:[.9,.86,.86],floorBGain:1.03,hiTop:1.7,loTop:.55,bulge:.75,widen:false,web:false,pillars:false,boulders:1/120,floorK:1.08,topK:2.0,
  decalMix:{near:[[5,3],[6,3],[0,2],[8,1]],open:[[0,4],[5,2],[6,2],[7,2],[8,.8]]},decalDensity:12,
  tex:{floorA:['assets/r118/tiles/vault.webp',0],floorB:['assets/r118/tiles/castle.webp',0],rock:['assets/r99/outdoor/ground-ruin.webp',1],face:['assets/r118/tiles/castle.webp',1]}},
 // 하늘에 서려는 자(2부): 높이 쌓은 돌 언덕 — 높은 윗면, 벽돌 벽면
 ep1b08:{seed:0x5d1080,tint:[.88,.86,.9],floorBGain:1.02,hiTop:1.95,loTop:.6,bulge:.8,widen:false,web:false,pillars:false,boulders:1/100,floorK:1.06,topK:2.1,
  decalMix:{near:[[5,3],[6,3],[7,2],[0,1]],open:[[0,3],[5,3],[6,2],[7,2]]},decalDensity:12,
  tex:{floorA:['assets/r118/tiles/castle.webp',0],floorB:['assets/r99/outdoor/ground-paving.webp',0],rock:['assets/r99/outdoor/ground-ruin.webp',1],face:['assets/r118/tiles/workshop.webp',1]}},
 // 최초명령의 세계(5부): 오래된 돌 평원 — 포장 돌·흙, 낮은 바위 언덕
 kair01:{seed:0x5d5010,tint:[.9,.88,.84],floorBGain:1.02,hiTop:1.5,loTop:.5,bulge:.9,widen:false,web:false,pillars:false,boulders:1/90,floorK:1.04,topK:2.0,
  decalMix:{near:[[5,3],[6,3],[2,1],[0,1]],open:[[0,3],[5,3],[6,2],[7,2],[11,.6]]},decalDensity:12,tufts:['assets/r138/props/weed.webp',.1,1/80],
  tex:{floorA:['assets/r99/outdoor/ground-paving.webp',0],floorB:['assets/r118/tiles/garden.webp',0],rock:['assets/r99/outdoor/surround-cliff.webp',-1],face:['assets/r99/outdoor/ground-cliff.webp',1]}},
 // 예순여섯 수문장(5부): 문을 지키는 돌 회랑 — 성 돌바닥·잔해 윗면
 kair04:{seed:0x5d5040,tint:[.88,.84,.82],floorBGain:1.03,hiTop:1.75,loTop:.55,bulge:.7,widen:false,web:false,pillars:false,boulders:1/110,floorK:1.1,topK:2.0,
  decalMix:{near:[[5,3],[6,3],[0,2],[1,.5]],open:[[0,3],[5,3],[6,2],[7,2],[8,.6],[1,.3]]},decalDensity:12,
  tex:{floorA:['assets/r118/tiles/castle.webp',0],floorB:['assets/r118/tiles/vault.webp',0],rock:['assets/r99/outdoor/ground-ruin.webp',1],face:['assets/r118/tiles/castle.webp',1]},
  uprights:[['garden_low_border_01',.3]],uprightRate:1/170,uprightEdge:[-1.0,-.35]},
 // R214 — 큰 레이아웃(바닥 8022칸) 돌 계열 지역. 건축물이라 불룩 작게, 넓히기 없음.
 // 타락천사 기사(4부, coast): 바닷가 성채 — 포장 돌·모래, 바위 둔덕
 last301:{seed:0x5d3010,tint:[.88,.88,.9],floorBGain:1.03,hiTop:1.6,loTop:.5,bulge:.8,widen:false,web:false,pillars:false,boulders:1/140,floorK:1.05,topK:2.0,
  decalMix:{near:[[5,3],[6,3],[0,2],[8,.6]],open:[[0,3],[5,3],[6,2],[7,2],[8,.5]]},decalDensity:13,
  tex:{floorA:['assets/r99/outdoor/ground-paving.webp',0],floorB:['assets/r118/tiles/sandgold.webp',0],rock:['assets/r99/outdoor/surround-cliff.webp',-1],face:['assets/r118/tiles/castle.webp',1]}},
 // 성 안에 소환된 의목사(hando, stone): 성 안뜰 — 성 돌바닥, 잔해 윗면
 hando01:{seed:0x5d6010,tint:[.9,.86,.84],floorBGain:1.03,hiTop:1.75,loTop:.55,bulge:.7,widen:false,web:false,pillars:false,boulders:1/130,floorK:1.1,topK:2.0,
  decalMix:{near:[[5,3],[6,3],[0,2],[8,1]],open:[[0,3],[5,3],[6,2],[7,2],[8,.6]]},decalDensity:13,
  tex:{floorA:['assets/r118/tiles/castle.webp',0],floorB:['assets/r118/tiles/garden.webp',0],rock:['assets/r99/outdoor/ground-ruin.webp',1],face:['assets/r118/tiles/castle.webp',1]}},
 // 두 주인의 각성(hando, stone): 같은 성 — 금고 돌·성 돌
 hando02:{seed:0x5d6020,tint:[.88,.84,.86],floorBGain:1.03,hiTop:1.75,loTop:.55,bulge:.7,widen:false,web:false,pillars:false,boulders:1/130,floorK:1.1,topK:2.0,
  decalMix:{near:[[5,3],[6,3],[0,2],[8,1]],open:[[0,4],[5,3],[6,2],[7,2],[8,.6]]},decalDensity:13,
  tex:{floorA:['assets/r118/tiles/vault.webp',0],floorB:['assets/r118/tiles/castle.webp',0],rock:['assets/r99/outdoor/ground-ruin.webp',1],face:['assets/r118/tiles/castle.webp',1]}}};/* 윗면은 눈, 벽면은 바위, 바닥 일부는 검은 흙(밟힌 눈) */
const R=4,M=8;
// R217 통로 확장(사용자 2026-11-02 "전체적인 맵통로 확장") — 쉼터(hub)를 뺀 유기 지형 지역 모두 좁은 통로(바닥 깊이 2칸 이하) 둘레를 2.3칸까지 넓힌다(바닥 깊이 2칸 이하 = 폭 4칸 이하 통로만, 원래 R204 는 1.5칸·거미동굴 등 5곳).
//  긴 벽(4칸 이상)·문 둘레·맵 가장자리는 그대로, 원래 바닥에서 닿는 칸만 더한다(widen 참고). storyworld.r204.cave {widen:false} 로 끈다.
const WIDEN_SKIP=new Set(['hub']);for(const [id,c] of Object.entries(ZONES))if(!WIDEN_SKIP.has(id)){c.widen=true;c.widenHW=c.widenHW||2;c.widenR=c.widenR||2.3;}
// R215 디테일 전용(decorOnly) — 사용자 "모든맵개선" + 앞서 "현대 건물 안(학교·호텔)은 직각 타일 허용". 실내·현대·기계 계열은 원래 벽·바닥·충돌을 그대로 두고
//  같은 화풍의 바닥 장식(균열·잔해·얼룩·쇠사슬)만 덧입힌다. 지형을 숨기지 않고, 이동 판정·길찾기도 바꾸지 않는다.
const DECO=(seed,kind)=>{const K={
  clinic:{bone:[.5,.54,.53],floorLift:1,tint:[.82,.8,.8],decalMix:{near:[[0,2],[5,2],[6,2],[10,1]],open:[[0,3],[5,2],[6,1],[7,1],[10,1.2]]},decalDensity:18},
  urban:{bone:[.58,.55,.52],floorLift:1.4,tint:[.84,.82,.8],decalMix:{near:[[0,2],[5,2],[6,2],[11,1]],open:[[0,3],[5,2],[6,2],[7,1],[10,1]]},decalDensity:18},
  home:{bone:[.52,.4,.3],floorLift:1.8,tint:[.86,.82,.78],decalMix:{near:[[0,2],[5,1],[6,1]],open:[[0,2],[5,1],[7,1],[10,.5]]},decalDensity:26},
  forge:{bone:[.46,.4,.35],floorLift:1.15,tint:[.86,.8,.74],decalMix:{near:[[5,3],[6,3],[0,2],[8,1]],open:[[0,3],[5,2],[7,2],[8,1]]},decalDensity:16},
  machine:{bone:[.4,.44,.5],floorLift:1.1,tint:[.7,.74,.82],decalMix:{near:[[0,2],[7,1]],open:[[0,2],[7,1]]},decalDensity:34}}[kind];
 return {seed,decorOnly:true,kind,bulge:0,widen:false,web:false,pillars:false,...K};};
Object.assign(ZONES,{
 ep1a08:DECO(0x5e1a08,'clinic'),ep1a09:DECO(0x5e1a09,'clinic'),ep1a10:DECO(0x5e1a10,'urban'),ep1a11:DECO(0x5e1a11,'clinic'),ep1a09b:DECO(0x5e1a9b,'urban'),
 ep1b02:DECO(0x5e1b02,'home'),ep1b03:DECO(0x5e1b03,'home'),ep1b04:DECO(0x5e1b04,'home'),ep1b05:DECO(0x5e1b05,'urban'),ep1b06:DECO(0x5e1b06,'forge'),ep1b07:DECO(0x5e1b07,'forge'),ep1b09:DECO(0x5e1b09,'machine'),
 u201:DECO(0x5e2201,'machine'),u202:DECO(0x5e2202,'machine'),u203:DECO(0x5e2203,'machine'),u204:DECO(0x5e2204,'machine'),u205:DECO(0x5e2205,'machine'),u206:DECO(0x5e2206,'machine'),
 hando03:DECO(0x5e6030,'machine'),murder01:DECO(0x5e7001,'urban'),murder02:DECO(0x5e7002,'home'),murder03:DECO(0x5e7003,'urban'),murder04:DECO(0x5e7004,'home'),
 cult01:DECO(0x5e8001,'machine'),cult02:DECO(0x5e8002,'machine'),cult03:DECO(0x5e8003,'machine'),cult04:DECO(0x5e8004,'machine'),cult05:DECO(0x5e8005,'urban'),cult06:DECO(0x5e8006,'machine')});
                       // 칸당 거리장 점 수, 맵 바깥 여백(칸)
const TEX={floorA:['assets/r118/tiles/cave.webp',0],floorB:['assets/r118/tiles/sandblack.webp',0],rock:['assets/r99/outdoor/ground-cliff.webp',0],
 face:['assets/r99/outdoor/ground-moss.webp',1],crack:['assets/r106/fx/crack.webp',-1],bones:['assets/r138/props/bones.webp',-1],root:['assets/r138/props/root.webp',-1]};
const solo=()=>{const c=window.__STORYWORLD_COOP_SIM_R62__;return !c?.mode||c.mode()==='off';};

// ---- 결정적 난수·노이즈 -------------------------------------------------------------------------
function rng(seed){let s=seed>>>0||1;return()=>{s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296;};}
function hash2(x,y,s){let h=(x*374761393+y*668265263+s*1442695041)|0;h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return (h>>>0)/4294967296;}
function vnoise(x,y,s){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);
 const a=hash2(xi,yi,s),b=hash2(xi+1,yi,s),c=hash2(xi,yi+1,s),d=hash2(xi+1,yi+1,s);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;}
const fbm=(x,y,s,o=4)=>{let t=0,a=.5,f=1,n=0;for(let i=0;i<o;i++){t+=a*vnoise(x*f,y*f,s+i*101);n+=a;a*=.5;f*=2.03;}return t/n*2-1;};

// ---- 거리장 ------------------------------------------------------------------------------------
// 노드 (i,j) 의 월드 좌표 = ((i+.5)/R - M, (j+.5)/R - M) — 칸 경계에 걸치지 않는 점. 보행 칸 (cx,cy) 는 [cx,cx+1)×[cy,cy+1).
function field(ex,cfg,protect){
 const W=ex.bounds[2],H=ex.bounds[3],GW=(W+2*M)*R,GH=(H+2*M)*R,N=GW*GH;
 const walk=new Uint8Array((W+2*M)*(H+2*M)),CW=W+2*M;
 for(const c of ex.floorCells||[]){const x=(c.x??c[0])+M,y=(c.y??c[1])+M;if(x>=0&&y>=0&&x<CW&&y<H+2*M)walk[y*CW+x]=1;}
 const inside=new Uint8Array(N);
 for(let j=0;j<GH;j++)for(let i=0;i<GW;i++)inside[j*GW+i]=walk[Math.floor(j/R)*CW+Math.floor(i/R)];
 // 바닥 칸 사이에 선 벽판(미로 칸막이 등)도 바위로 본다 — 원래 벽 그림을 숨기므로 보이지 않는 벽이 생기지 않게. 문 벽은 제외.
 for(const w of ex.walls||[]){if(/door/i.test(String(w.id||'')))continue;
  // 선분이 아닌 상자 벽(기둥·덩어리): AABB 안을 바위로
  if((!w.endpoints||w.endpoints.length!==2)&&Number.isFinite(w.x)&&Number.isFinite(w.y)&&w.width>0&&w.depth>0&&!w.decorative){const hx=w.width/2+.05,hy=w.depth/2+.05;
   for(let j=Math.max(0,Math.floor((w.y-hy+M)*R));j<=Math.min(GH-1,Math.ceil((w.y+hy+M)*R));j++)for(let i=Math.max(0,Math.floor((w.x-hx+M)*R));i<=Math.min(GW-1,Math.ceil((w.x+hx+M)*R));i++){const px=(i+.5)/R-M,py=(j+.5)/R-M;if(Math.abs(px-w.x)<=hx&&Math.abs(py-w.y)<=hy)inside[j*GW+i]=0;}continue;}
  const e=w.endpoints;if(!e||e.length!==2)continue;const [[x0,y0],[x1,y1]]=e,len=Math.hypot(x1-x0,y1-y0);if(!(len>0))continue;
  const ux=(x1-x0)/len,uy=(y1-y0)/len,minx=Math.min(x0,x1)-.4,maxx=Math.max(x0,x1)+.4,miny=Math.min(y0,y1)-.4,maxy=Math.max(y0,y1)+.4;
  for(let j=Math.max(0,Math.floor((miny+M)*R));j<=Math.min(GH-1,Math.ceil((maxy+M)*R));j++)for(let i=Math.max(0,Math.floor((minx+M)*R));i<=Math.min(GW-1,Math.ceil((maxx+M)*R));i++){
   const px=(i+.5)/R-M-x0,py=(j+.5)/R-M-y0,t=px*ux+py*uy;if(t<-.05||t>len+.05)continue;if(Math.abs(px*uy-py*ux)<.3)inside[j*GW+i]=0;}}
 // 두 방향 챔퍼 거리(점 단위) — 안쪽은 바깥까지, 바깥은 안쪽까지
 const INF=1e9,dIn=new Float32Array(N).fill(INF),dOut=new Float32Array(N).fill(INF);
 for(let k=0;k<N;k++){if(inside[k])dOut[k]=0;else dIn[k]=0;}
 const pass=d=>{const a=1,b=Math.SQRT2;
  for(let j=0;j<GH;j++)for(let i=0;i<GW;i++){const k=j*GW+i;let v=d[k];if(!v)continue;
   if(i>0)v=Math.min(v,d[k-1]+a);if(j>0){v=Math.min(v,d[k-GW]+a);if(i>0)v=Math.min(v,d[k-GW-1]+b);if(i<GW-1)v=Math.min(v,d[k-GW+1]+b);}d[k]=v;}
  for(let j=GH-1;j>=0;j--)for(let i=GW-1;i>=0;i--){const k=j*GW+i;let v=d[k];if(!v)continue;
   if(i<GW-1)v=Math.min(v,d[k+1]+a);if(j<GH-1){v=Math.min(v,d[k+GW]+a);if(i<GW-1)v=Math.min(v,d[k+GW+1]+b);if(i>0)v=Math.min(v,d[k+GW-1]+b);}d[k]=v;}};
 pass(dIn);pass(dOut);
 const raw=new Float32Array(N);for(let k=0;k<N;k++)raw[k]=(inside[k]?(dIn[k]-.5):-(dOut[k]-.5))/R;// 칸 단위 부호 거리(+ = 보행)
 const blur=src=>{const o=new Float32Array(N);for(let j=0;j<GH;j++)for(let i=0;i<GW;i++){let s=0,n=0;for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){const ii=i+di,jj=j+dj;if(ii<0||jj<0||ii>=GW||jj>=GH)continue;s+=src[jj*GW+ii];n++;}o[j*GW+i]=s/n;}return o;};
 const sm=blur(blur(blur(raw))),f=new Float32Array(N),s=cfg.seed,prot=protect||[];
 // 통로 반폭: 각 점에서 거리장 기울기(벽 → 안쪽) 방향으로 가운데선(값이 더 오르지 않는 곳)까지 걸어가 그 값을 쓴다.
 //  이웃 최댓값으로 재면 통로 입구에서 옆방 안쪽 값이 섞여 좁은 통로를 넓다고 보고 양쪽 절벽이 통로를 막을 수 있다.
 const hw=new Float32Array(N);const S=(x,y)=>{const i=Math.max(0,Math.min(GW-1,Math.round(x))),j=Math.max(0,Math.min(GH-1,Math.round(y)));return sm[j*GW+i];};
 for(let j=0;j<GH;j++)for(let i=0;i<GW;i++){const k=j*GW+i;if(raw[k]<=0||raw[k]>cfg.bulge+1.4){hw[k]=raw[k]>0?9:0;continue;}let x=i,y=j,v=sm[k],best=raw[k];
  for(let t=0;t<28;t++){const gx=S(x+1,y)-S(x-1,y),gy=S(x,y+1)-S(x,y-1),gl=Math.hypot(gx,gy);if(gl<1e-4)break;const nx=x+gx/gl*.75,ny=y+gy/gl*.75,nv=S(nx,ny);if(nv<=v+1e-4)break;x=nx;y=ny;v=nv;best=Math.max(best,nv);}
  hw[k]=best;}
 for(let j=0;j<GH;j++)for(let i=0;i<GW;i++){const k=j*GW+i,x=(i+.5)/R-M,y=(j+.5)/R-M;
  // 절벽 불룩: 벽에서 보행 쪽으로만(최대 cfg.bulge 칸). 통로는 2.3칸 이상 남기고, 지켜야 할 자리(입구·문·조형물·몹) 둘레 2.6칸은 건드리지 않는다.
  let allow=Math.min(cfg.bulge,Math.max(0,hw[k]-1.15));
  if(allow>0)for(const q of prot){const dd=Math.hypot(q[0]-x,q[1]-y)-q[2];if(dd<1){allow*=Math.max(0,dd);if(allow<=0)break;}}
  const n1=fbm(x*.2,y*.2,s,3)*.5+.5,n2=fbm(x*.62,y*.62,s+33,2)*.67;// 잔물결 ±0.2칸
  const bulge=allow*Math.min(1,Math.max(0,(n1-.2)/.42));
  f[k]=Math.min(sm[k]-bulge+.3*n2,raw[k]);}

 // 얇게 튀어나온 바위 두껍게(사용자 "뜬금없이 얇게 튀어나온 건 일정 두께 이상"): 바위 쪽으로 기울기를 따라 걸어 바위 한가운데 깊이(r)를 재고,
 //  r<THICK/2 이면 둘레를 (THICK/2-r)만큼 바닥 쪽으로 키운다 → 바위 두께가 THICK(1.4칸) 이상. 키운 자리는 이동 판정도 막는다(f<raw).
 {const TH=(cfg.thick??1.4)/2,g=f.slice(),SF=(x,y)=>{const i=Math.max(0,Math.min(GW-1,Math.round(x))),j=Math.max(0,Math.min(GH-1,Math.round(y)));return g[j*GW+i];};
  for(let j=0;j<GH;j++)for(let i=0;i<GW;i++){const k=j*GW+i,v=g[k];if(v>TH+.15||v<-TH)continue;let x=i,y=j,cur=v,deep=-v;
   for(let t=0;t<16;t++){const gx=SF(x+1,y)-SF(x-1,y),gy=SF(x,y+1)-SF(x,y-1),gl=Math.hypot(gx,gy);if(gl<1e-4)break;const nx=x-gx/gl*.75,ny=y-gy/gl*.75,nv=SF(nx,ny);if(nv>=cur-1e-4)break;x=nx;y=ny;cur=nv;deep=Math.max(deep,-nv);}
   if(deep>0&&deep<TH){let add=(TH-deep)*Math.min(1,Math.max(0,(TH+.15-v)/(TH+.15)));
    if(v>0)add=Math.min(add,Math.max(0,hw[k]-1.15-(raw[k]-v)));// 바닥 쪽으로 키울 땐 통로 반폭 1.15칸(폭 2.3칸)은 남긴다
    f[k]=Math.min(f[k],v-add);}}}
 // R208 연결 보장(이지 모드 자연 진행에서 dist00 도착 포털 앞 목이 바위 언덕에 막혀 길잡이가 멈춤):
 //  원래 지형(raw)에서 입구로부터 영웅 몸(.27칸)으로 갈 수 있던 점이 바위 언덕(f) 때문에 끊기면, 원래 길(입구에서 그 점까지)을 따라 반경 .75칸만 바닥 깊이 .7까지 되돌린다(바위 모양은 거의 그대로).
 {const OK=.27,starts=[];const add=q=>{if(q&&Number.isFinite(q.x)&&Number.isFinite(q.y))starts.push(q);};add(ex.entry);(ex.starts||[]).forEach(add);for(const q of prot)starts.push({x:q[0],y:q[1]});
  const idx=(x,y)=>{const i=Math.floor((x+M)*R),j=Math.floor((y+M)*R);return i>=0&&j>=0&&i<GW&&j<GH?j*GW+i:-1;};
  const bfs=(arr,par)=>{const seen=new Uint8Array(N),q=new Int32Array(N);let h=0,t=0;for(const st of starts){const k=idx(st.x,st.y);if(k>=0&&arr[k]>=OK&&!seen[k]){seen[k]=1;q[t++]=k;if(par)par[k]=-1;}}
   while(h<t){const k=q[h++],i=k%GW,j=(k-i)/GW;for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){const ii=i+di,jj=j+dj;if(ii<0||jj<0||ii>=GW||jj>=GH)continue;const kk=jj*GW+ii;if(seen[kk]||arr[kk]<OK)continue;seen[kk]=1;if(par)par[kk]=k;q[t++]=kk;}}return seen;};
  const par=new Int32Array(N).fill(-1),nat=bfs(raw,par);let carved=0;
  for(let pass=0;pass<4;pass++){const got=bfs(f,null);let any=false;
   for(let k=0;k<N;k++){if(!nat[k]||got[k]||f[k]<OK)continue;any=true;/* 바위에 덮인 점은 의도된 것 — 아직 걸을 수 있는데 끊긴 주머니만 잇는다 */let c=k,steps=0;
    while(c>=0&&steps++<4000){const ci=c%GW,cj=(c-ci)/GW;for(let dj=-3;dj<=3;dj++)for(let di=-3;di<=3;di++){const ii=ci+di,jj=cj+dj;if(ii<0||jj<0||ii>=GW||jj>=GH||di*di+dj*dj>9)continue;const kk=jj*GW+ii,want=Math.min(raw[kk],.7);if(f[kk]<want){f[kk]=want;carved++;}}
     if(got[c])break;c=par[c];}}
   if(!any)break;}
  // 길찾기는 칸 중심만 .29(+.32 여유)로 묻는다 → 이웃한 두 칸 중심이 모두 길로 보이면 그 사이 직선 위 얇은 바위(잔물결)를 걷어 실제 이동(.27)과 맞춘다.
  const atF=(x,y)=>{const i=Math.max(0,Math.min(GW-1,Math.floor((x+M)*R))),j=Math.max(0,Math.min(GH-1,Math.floor((y+M)*R)));return j*GW+i;};
  const PATH=.61,cells=new Set((ex.floorCells||[]).map(c=>(c.x??c[0])+','+(c.y??c[1])));let slivers=0;const stop=(k,need)=>f[k]<need&&raw[k]-f[k]>.02;/* 판정 감싸기와 같은 조건 */
  for(const key of cells){const [cx,cy]=key.split(',').map(Number),ax=cx+.5,ay=cy+.5;if(stop(atF(ax,ay),PATH)||raw[atF(ax,ay)]<.29)continue;
   for(const [dx,dy] of [[1,0],[0,1],[1,1],[1,-1]]){if(!cells.has((cx+dx)+','+(cy+dy)))continue;const bx=ax+dx,by=ay+dy;if(stop(atF(bx,by),PATH)||raw[atF(bx,by)]<.29)continue;
    let bad=false;for(let t=.1;t<.95;t+=.1){const k=atF(ax+dx*t,ay+dy*t);if(stop(k,.34)&&raw[k]>=.3){bad=true;break;}}if(!bad)continue;
    for(let t=0;t<=1.0001;t+=.1){const ci=Math.floor((ax+dx*t+M)*R),cj=Math.floor((ay+dy*t+M)*R);for(let dj=-2;dj<=2;dj++)for(let di=-2;di<=2;di++){const ii=ci+di,jj=cj+dj;if(ii<0||jj<0||ii>=GW||jj>=GH||di*di+dj*dj>4)continue;const kk=jj*GW+ii,want=Math.min(raw[kk],.7);if(f[kk]<want){f[kk]=want;slivers++;}}}}}
  stats.carved=(stats.carved||0)+carved;stats.slivers=(stats.slivers||0)+slivers;}
 let mod=0;for(let k=0;k<N;k++)if(raw[k]>0&&raw[k]-f[k]>.3)mod++;
 return {W,H,GW,GH,f,raw,inside,walk,CW,G:blur(blur(blur(blur(f)))),bulgedCells:Math.round(mod/(R*R)),protect:prot.length};
}
const at=(F,a,x,y)=>{const gx=(x+M)*R-.5,gy=(y+M)*R-.5,i=Math.max(0,Math.min(F.GW-2,Math.floor(gx))),j=Math.max(0,Math.min(F.GH-2,Math.floor(gy))),u=Math.min(1,Math.max(0,gx-i)),v=Math.min(1,Math.max(0,gy-j)),k=j*F.GW+i;
 return a[k]*(1-u)*(1-v)+a[k+1]*u*(1-v)+a[k+F.GW]*(1-u)*v+a[k+F.GW+1]*u*v;};
function topHeight(F,cfg,x,y){const g=at(F,F.G,x,y),gx=at(F,F.G,x+.5,y)-at(F,F.G,x-.5,y),gy=at(F,F.G,x,y+.5)-at(F,F.G,x,y-.5),L=Math.hypot(gx,gy)||1;
 // 기울기는 보행 쪽을 가리킨다. 보행 쪽이 (-x,-y)(카메라에서 먼 쪽)이면 이 대지는 카메라와 통로 사이 → 낮게.
 const front=Math.max(0,(-gx-gy)/(L*Math.SQRT2)),deep=Math.min(1,Math.max(0,(-g-2.5)/2.5));
 const s=Math.max(1-Math.min(1,Math.max(0,(front-.15)/.55)),deep);
 // 윗선이 들쭉날쭉하게: 높이에 비례한 잔물결(대지 윗면과 절벽 윗선이 같은 함수를 써서 이어진다)
 let hh=cfg.loTop+(cfg.hiTop-cfg.loTop)*s;
 // 문 둘레: 문틀(약 2.6) 높이까지 절벽을 올려 문이 바위 사이에 박혀 보이게(1.6칸 안은 문틀 높이, 3.6칸까지 서서히)
 for(const d of F.doors||[]){const dd=Math.hypot(d[0]-x,d[1]-y);if(dd<3.6){const w=dd<1.6?1:1-(dd-1.6)/2;hh=Math.max(hh,hh+(2.55-hh)*w*w);}}
 return hh*(1+.22*fbm(x*1.7,y*1.7,cfg.seed+71,2))+.06*fbm(x*4.1,y*4.1,cfg.seed+5,1);}

// ---- 통로 넓히기(사용자 "모든 맵 통로 지금보다 2~3배 넓게" — 이 시범 지역부터) -----------------------------------
// 엔진 충돌은 floorCells(바닥 칸)와 얇은 벽 AABB(walls)뿐이다. 좁은 통로 칸 옆에 바닥 칸을 더하고, 양쪽이 다 바닥이 된 벽판을 빼서
// 새 레이아웃 객체로 바꿔 끼운다(엔진 충돌 색인은 레이아웃 객체마다 새로 만든다) → 충돌·길찾기·몹 배치가 모두 같은 바닥을 쓴다.
//  · 폭 4칸 이하 통로만, 반지름 1.5칸. 문 둘레 3.5칸·맵 가장자리 2칸은 넓히지 않는다(닫힌 문을 돌아가지 못하게).
//  · 다른 통로·방과 새로 이어지는 지름길은 만들지 않는다: 새 칸 둘레 2.3칸 안의 원래 바닥 칸이 모두, 넓히는 칸에서 원래 바닥으로 8걸음 안이어야 한다.
function widen(ex,cfg,doorPts){const W=ex.bounds[2],H=ex.bounds[3],key=(x,y)=>x+','+y,S=new Set((ex.floorCells||[]).map(c=>key(c[0],c[1])));
 const has=(x,y)=>S.has(key(x,y));const dist=new Map();// 칸 단위 체비쇼프 거리(바닥 안쪽 깊이)
 const q=[];for(const c of ex.floorCells){const [x,y]=c;let edge=false;for(let dy=-1;dy<=1&&!edge;dy++)for(let dx=-1;dx<=1;dx++)if(!has(x+dx,y+dy)){edge=true;break;}if(edge){dist.set(key(x,y),1);q.push([x,y]);}}
 for(let h=0;h<q.length;h++){const [x,y]=q[h],d=dist.get(key(x,y));for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const k=key(x+dx,y+dy);if(S.has(k)&&!dist.has(k)){dist.set(k,d+1);q.push([x+dx,y+dy]);}}}
 const hwOf=(x,y)=>{let m=0;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)m=Math.max(m,dist.get(key(x+dx,y+dy))||0);return m;};
 const nearDoor=(x,y)=>doorPts.some(p=>Math.hypot(p[0]-x-.5,p[1]-y-.5)<(p[2]||3.5));// 문 폭의 절반 + 3칸(넓은 문 끝을 돌아가는 길이 생기지 않게)
 const reach=(sx,sy,lim)=>{const seen=new Map([[key(sx,sy),0]]),qq=[[sx,sy]];for(let h=0;h<qq.length;h++){const [x,y]=qq[h],d=seen.get(key(x,y));if(d>=lim)continue;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const k=key(x+dx,y+dy);if(S.has(k)&&!seen.has(k)){seen.set(k,d+1);qq.push([x+dx,y+dy]);}}}return seen;};
 // 4칸 이상 긴 벽은 그대로 둔다(원래 지도의 큰 벽 — 그 목록·순서를 바꾸지 않는다). 그 바로 뒤 칸은 넓히지 않는다(벽 뒤 1칸 바닥 띠 방지).
 const longEdge=new Set();for(const w of ex.walls||[]){const e=w.endpoints;if(!e||e.length!==2)continue;const [[x0,y0],[x1,y1]]=e;
  if(x0===x1&&Math.abs(y1-y0)>=4)for(let y=Math.min(y0,y1);y<Math.max(y0,y1);y++)longEdge.add('v:'+x0+':'+y);else if(y0===y1&&Math.abs(x1-x0)>=4)for(let x=Math.min(x0,x1);x<Math.max(x0,x1);x++)longEdge.add('h:'+x+':'+y0);}
 const behindLong=(x,y)=>(has(x-1,y)&&longEdge.has('v:'+x+':'+y))||(has(x+1,y)&&longEdge.has('v:'+(x+1)+':'+y))||(has(x,y-1)&&longEdge.has('h:'+x+':'+y))||(has(x,y+1)&&longEdge.has('h:'+x+':'+(y+1)));
 const add=new Set();
 const HW=cfg.widenHW||2,GR=cfg.widenR||1.5,GI=Math.ceil(GR),CK=GR+.8,CI=Math.ceil(CK),RL=Math.ceil(CK*3);
 for(const c of ex.floorCells){const [x,y]=c;if(hwOf(x,y)>HW||nearDoor(x,y))continue;let R8=null;
  for(let dy=-GI;dy<=GI;dy++)for(let dx=-GI;dx<=GI;dx++){if(Math.hypot(dx,dy)>GR)continue;const nx=x+dx,ny=y+dy,k=key(nx,ny);if(S.has(k)||add.has(k))continue;
   if(nx<2||ny<2||nx>W-3||ny>H-3||nearDoor(nx,ny)||behindLong(nx,ny))continue;
   if(GR>1.5){const sx=Math.sign(dx),sy=Math.sign(dy);let thin=false;for(let t=1;t<=2&&!thin;t++)if(has(nx+sx*t,ny+sy*t)||(sx&&sy&&(has(nx+sx*t,ny)||has(nx,ny+sy*t))))thin=true;if(thin)continue;}/* R217: 넓힌 칸 너머 2칸 안에 다른 바닥이 있으면(두 통로 사이 바위 벽) 넓히지 않는다 — 벽이 종잇장처럼 얇아지지 않게 */R8=R8||reach(x,y,RL);let ok=true;
   for(let yy=-CI;yy<=CI&&ok;yy++)for(let xx=-CI;xx<=CI;xx++){if(Math.hypot(xx,yy)>CK)continue;const kk=key(nx+xx,ny+yy);if(S.has(kk)&&!R8.has(kk)){ok=false;break;}}
   if(ok)add.add(k);}}
 if(!add.size)return null;
 // 벽: 각 벽이 덮는 칸 경계(세로 'v:x:y' = (x-1,y)|(x,y), 가로 'h:x:y' = (x,y-1)|(x,y))를 구한다.
 //  넓힌 칸에 닿는 경계이고 양쪽이 다 바닥이 되면 그 벽을 뺀다 — 원래부터 양쪽이 바닥이던 미로 칸막이는 그대로 둔다. 긴 벽은 덮는 경계가 모두 해당될 때만 뺀다.
 const S2=new Set([...S,...add]),has2=(x,y)=>S2.has(key(x,y)),isAdd=(x,y)=>add.has(key(x,y));
 const edgesOf=w=>{const e=w.endpoints;if(!e||e.length!==2)return null;const [[x0,y0],[x1,y1]]=e,out=[];
  if(x0===x1&&Number.isInteger(x0)&&Number.isInteger(y0)&&Number.isInteger(y1))for(let y=Math.min(y0,y1);y<Math.max(y0,y1);y++)out.push(['v',x0,y,[x0-1,y],[x0,y]]);
  else if(y0===y1&&Number.isInteger(y0)&&Number.isInteger(x0)&&Number.isInteger(x1))for(let x=Math.min(x0,x1);x<Math.max(x0,x1);x++)out.push(['h',x,y0,[x,y0-1],[x,y0]]);
  else return null;return out;};
 let removed=0;const blockedEdge=new Set();
 // 긴 벽은 넓힌 칸에 닿아 열린 경계만 1칸 단위로 잘라 낸다(나머지 구간은 1칸 벽판으로 남김) — 긴 벽 뒤에 1칸짜리 바닥 띠가 생기지 않게.
 const unit=(w,[k,x,y],n)=>k==='v'?{...w,id:w.id+'#'+n,x,y:y+.5,width:w.width??.24,depth:1,endpoints:[[x,y],[x,y+1]],analyticBounds12:[x-.12,y,x+.12,y+1],r204Split:true}
  :{...w,id:w.id+'#'+n,x:x+.5,y,width:1,depth:w.depth??.24,endpoints:[[x,y],[x+1,y]],analyticBounds12:[x,y-.12,x+1,y+.12],r204Split:true};
 const walls=[];for(const w of ex.walls||[]){const es=edgesOf(w);if(!es||!es.length||/door/i.test(String(w.id||''))){walls.push(w);continue;}
  if(es.length>=4){walls.push(w);for(const [k,x,y] of es)blockedEdge.add(k+':'+x+':'+y);continue;}
  const open=es.map(([,, ,a,b])=>has2(...a)&&has2(...b)&&(isAdd(...a)||isAdd(...b)));
  if(open.every(Boolean)){removed++;continue;}
  if(!open.some(Boolean)){walls.push(w);for(const [k,x,y] of es)blockedEdge.add(k+':'+x+':'+y);continue;}
  removed++;es.forEach((e,n)=>{if(open[n])return;walls.push(unit(w,e,n));blockedEdge.add(e[0]+':'+e[1]+':'+e[2]);});}
 // 원래 바닥에서 4방향(남은 벽을 넘지 않고)으로 닿는 추가 칸만 남긴다 — 벽 뒤에 갇힌 조각을 만들지 않는다.
 const edgeKey=(x,y,nx,ny)=>nx!==x?'v:'+Math.max(x,nx)+':'+y:'h:'+x+':'+Math.max(y,ny);
 const reachAdd=new Set(),qq=[...S].map(k=>k.split(',').map(Number)),seenB=new Set(S);
 for(let h=0;h<qq.length;h++){const [x,y]=qq[h];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=key(nx,ny);if(seenB.has(k)||!add.has(k)||blockedEdge.has(edgeKey(x,y,nx,ny)))continue;seenB.add(k);reachAdd.add(k);qq.push([nx,ny]);}}
 const dropped=add.size-reachAdd.size;
 // 버린 칸에 닿아 뺐던 벽은 되살린다
 // 버린 칸이 있으면 그 칸에 닿는 열린 경계에 1칸 벽판을 되살린다
 const keepWalls=walls.slice();if(dropped){const dropSet=new Set([...add].filter(k=>!reachAdd.has(k)));let n=0;
  for(const w of ex.walls||[]){const es=edgesOf(w);if(!es||/door/i.test(String(w.id||'')))continue;for(const e of es){const [k,x,y,a,b]=e,ek=k+':'+x+':'+y;if(blockedEdge.has(ek))continue;
    if(dropSet.has(key(...a))||dropSet.has(key(...b))){keepWalls.push(unit(w,e,'r'+(n++)));blockedEdge.add(ek);}}}}
 const floorCells=[...ex.floorCells,...[...reachAdd].map(k=>k.split(',').map(Number))];
 const out={...ex,floorCells,walls:keepWalls,r204Widened:{added:reachAdd.size,dropped,wallsRemoved:removed,before:S.size,after:S.size+reachAdd.size}};Object.defineProperty(out,'r204Source',{value:ex});return out;}
// R219 실내 넓히기(사용자 2026-11-02 "이동가능한공간이 적고 벽지붕 같은 공간 너무 이질감이 있고 너무 많아서 … 맵 외곽쪽을 벽으로 채워서 여기가 진짜 내부라는 점이 들도록 모든실내맵"):
//  디테일 전용(실내) 지역은 R171 병동 틀(68×70)에서 바닥이 42%뿐이고 나머지가 지붕 덮개였다. 바닥을 둘레로 최대 depth 칸(기본 3) 넓히되
//  ① 길로 먼 두 곳(원래 바닥 위 4방향 길 거리 > 1.5×직선거리+4)이 만나는 자리는 1칸 벽(이음매)으로 남겨 방·구역 구분을 지키고
//  ② 문(R74 doors)·입구 둘레는 그대로, 길 거리를 잴 때 문 선은 넘지 못하게 해(닫힌 문 우회 방지) ③ 맵 가장자리 1칸은 외벽으로 남긴다.
//  벽은 새 바닥 경계를 이어 다시 만들고(원래 양쪽이 바닥이던 칸막이는 유지), 바닥 사각형(floorRects)도 새로 만든다 — 엔진 바닥·벽 덩어리가 같은 지도를 그리게.
function inflate(ex,opt={}){const D=opt.depth||8,MARGIN=opt.margin??1;const [bx0,by0,W,H]=ex.bounds;const key=(x,y)=>x+','+y;
 const S=new Set(ex.floorCells.map(c=>key(c[0],c[1])));const has=(x,y)=>S.has(key(x,y));
 const doors=[];for(const d of ex.worldR74?.doors||[])doors.push([d.x,d.y,Math.max(3.5,(Number(d.width)||0)/2+2.5)]);for(const q of [ex.entry])if(q)doors.push([q.x,q.y,2.5]);
 const nearDoor=(x,y)=>doors.some(([dx,dy,r])=>Math.hypot(dx-x-.5,dy-y-.5)<r);
 // 1) 바닥에서 바깥으로 BFS(8방향) — 가장 가까운 원래 바닥(src)과 깊이
 const src=new Map(),dep=new Map(),q=[];for(const c of ex.floorCells){const k=key(c[0],c[1]);src.set(k,k);dep.set(k,0);q.push([c[0],c[1]]);}
 for(let h=0;h<q.length;h++){const [x,y]=q[h],k=key(x,y),d=dep.get(k);if(d>=D)continue;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const nx=x+dx,ny=y+dy,nk=key(nx,ny);
  if(nx<MARGIN||ny<MARGIN||nx>W-1-MARGIN||ny>H-1-MARGIN||dep.has(nk)||nearDoor(nx,ny))continue;dep.set(nk,d+1);src.set(nk,src.get(k));q.push([nx,ny]);}}
 // 2) 원래 바닥 위 길 거리(4방향) — 필요할 때만, 제한 거리 BFS 를 캐시
 // 문 선을 넘는 이동은 막는다(닫힌 문 너머는 '길로 가깝다'고 보지 않음 — 문 우회 방지)
 const doorCut=new Set();for(const d of ex.worldR74?.doors||[]){const w=Number(d.width)||0,dp=Number(d.depth)||0;if(w>=dp){const y=Math.round(d.y);for(let x=Math.floor(d.x-w/2);x<Math.ceil(d.x+w/2);x++)doorCut.add('h:'+x+':'+y);}else{const x=Math.round(d.x);for(let y=Math.floor(d.y-dp/2);y<Math.ceil(d.y+dp/2);y++)doorCut.add('v:'+x+':'+y);}}
 const cut=(x,y,dx,dy)=>dx?doorCut.has('v:'+(dx>0?x+1:x)+':'+y):doorCut.has('h:'+x+':'+(dy>0?y+1:y));
 const cache=new Map();const pathWithin=(a,b,lim)=>{let m=cache.get(a);if(!m||m.lim<lim){m={lim,seen:new Map([[a,0]])};const qq=[a.split(',').map(Number)];for(let h=0;h<qq.length;h++){const [x,y]=qq[h],d=m.seen.get(key(x,y));if(d>=lim)continue;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nk=key(x+dx,y+dy);if(S.has(nk)&&!m.seen.has(nk)&&!cut(x,y,dx,dy)){m.seen.set(nk,d+1);qq.push([x+dx,y+dy]);}}}cache.set(a,m);}
  const d=m.seen.get(b);return d!=null&&d<=lim;};
 const close=(a,b)=>{if(a===b)return true;const [ax,ay]=a.split(',').map(Number),[bx,by]=b.split(',').map(Number);const e=Math.hypot(ax-bx,ay-by);return pathWithin(a,b,Math.ceil(1.5*e+4));};
 // 3) 이음매: 이웃 칸의 src 가 길로 먼 곳이면 그 칸은 벽으로 남김
 const add=new Set();for(const [k,d] of dep){if(d===0)continue;const [x,y]=k.split(',').map(Number),s=src.get(k);let seam=false;
  for(let dy=-1;dy<=1&&!seam;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const nk=key(x+dx,y+dy),t=src.get(nk);if(t&&!close(s,t)){seam=true;break;}}
  if(!seam)add.add(k);}
 // 이음매가 대각선으로만 이어지면 새 바닥끼리 대각선으로 붙어 벽이 끊긴다 → 원래 바닥(src)이 서로 먼 두 새 칸이 대각선이면 둘 다 뺀다
 for(const k of [...add]){const [x,y]=k.split(',').map(Number),s=src.get(k);for(const [dx,dy] of [[1,1],[1,-1],[-1,1],[-1,-1]]){const nk=key(x+dx,y+dy);if((add.has(nk)||S.has(nk))&&!close(s,src.get(nk))){add.delete(k);break;}}}
 // 4) 새 바닥에서 원래 바닥으로 4방향으로 이어진 칸만
 const F=new Set(S),qq=[...S].map(k=>k.split(',').map(Number));for(let h=0;h<qq.length;h++){const [x,y]=qq[h];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nk=key(x+dx,y+dy);if(add.has(nk)&&!F.has(nk)){F.add(nk);qq.push([x+dx,y+dy]);}}}
 const fh=(x,y)=>F.has(key(x,y));
 // 5) 벽: 원래 칸막이(양쪽 다 바닥이던 벽)는 남기고, 새 바닥 경계 변을 이어 붙인 벽을 만든다
 const tpl=ex.walls[0]||{};let n=0;const walls=[];
 const mk=(o,x0,y0,x1,y1,h)=>{const hz=y0===y1,len=hz?x1-x0:y1-y0;return {...tpl,id:'r219-wall:'+(n++),x:hz?x0+len/2:x0,y:hz?y0:y0+len/2,width:hz?len:.24,depth:hz?.24:len,height:h||tpl.height||2.85,angle:0,endpoints:[[x0,y0],[x1,y1]],analyticBounds12:hz?[x0,y0-.12,x1,y0+.12]:[x0-.12,y0,x0+.12,y1],r219:true};};
 // 칸막이: 원래부터 양쪽이 다 바닥이던 벽만(원래 경계벽 바깥이 새 바닥이 된 경우는 칸막이가 아니다 — 남기면 새 바닥을 갈라 놓는다)
 const isPart=w=>{const e=w.endpoints;if(!e)return false;const [[x0,y0],[x1,y1]]=e;if(x0===x1){for(let y=Math.min(y0,y1);y<Math.max(y0,y1);y++)if(!(has(x0-1,y)&&has(x0,y)))return false;return true;}
  if(y0===y1){for(let x=Math.min(x0,x1);x<Math.max(x0,x1);x++)if(!(has(x,y0-1)&&has(x,y0)))return false;return true;}return false;};
 const keepPart=ex.walls.filter(isPart);
 // 남은 칸막이를 막힌 변으로 보고, 원래 바닥에서 몸이 지나갈 수 있는 변으로 닿지 않는 새 칸은 뺀다(엔진 '모든 바닥 칸이 이어짐' 검사와 같은 기준)
 {const blk=new Set();for(const w of keepPart){const [[x0,y0],[x1,y1]]=w.endpoints;if(x0===x1)for(let y=Math.min(y0,y1);y<Math.max(y0,y1);y++)blk.add('v:'+x0+':'+y);else for(let x=Math.min(x0,x1);x<Math.max(x0,x1);x++)blk.add('h:'+x+':'+y0);}
  const edge=(x,y,dx,dy)=>dx?'v:'+(dx>0?x+1:x)+':'+y:'h:'+x+':'+(dy>0?y+1:y);const ok=new Set(S),q3=[...S].map(k=>k.split(',').map(Number));
  for(let h=0;h<q3.length;h++){const [x,y]=q3[h];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nk=key(x+dx,y+dy);if(F.has(nk)&&!ok.has(nk)&&!blk.has(edge(x,y,dx,dy))){ok.add(nk);q3.push([x+dx,y+dy]);}}}
  for(const k of [...F])if(!ok.has(k))F.delete(k);}
 // 가로 변: y 경계, (x,y-1)|(x,y) 중 하나만 바닥
 for(let y=0;y<=H;y++){let run=null;for(let x=0;x<=W;x++){const e=x<W&&(fh(x,y-1)!==fh(x,y));if(e&&run==null)run=x;if(!e&&run!=null){walls.push(mk(tpl,run,y,x,y));run=null;}}}
 for(let x=0;x<=W;x++){let run=null;for(let y=0;y<=H;y++){const e=y<H&&(fh(x-1,y)!==fh(x,y));if(e&&run==null)run=y;if(!e&&run!=null){walls.push(mk(tpl,x,run,x,y));run=null;}}}
 // 6) floorRects: 행 단위 구간 → 같은 구간이 이어지는 행을 묶음
 const rects=[];const open=new Map();for(let y=0;y<=H;y++){const runs=[];let r0=null;for(let x=0;x<=W;x++){const f=x<W&&y<H&&fh(x,y);if(f&&r0==null)r0=x;if(!f&&r0!=null){runs.push(r0+':'+x);r0=null;}}
  const next=new Map();for(const r of runs){const o=open.get(r);if(o){o.depth++;next.set(r,o);}else{const [a,b2]=r.split(':').map(Number);const o2={x:a,y,width:b2-a,depth:1};rects.push(o2);next.set(r,o2);}}open.clear();for(const [k,v] of next)open.set(k,v);}
 const floorCells=[...F].map(k=>k.split(',').map(Number));
 stats.inflated={before:S.size,after:F.size};const out={...ex,floorCells,floorRects:rects,walls:[...walls,...keepPart],r219:{before:S.size,after:F.size,walls:walls.length,kept:keepPart.length}};Object.defineProperty(out,"r219Source",{value:ex});return out;}
// 문·입구 자리: 레이아웃 안의 R74 문(worldR74.doors)·입구·관문, 이름에 door 가 든 벽.
const layoutDoorPoints=L=>{const out=[],pt=(q,rad)=>{if(q&&Number.isFinite(q.x)&&Number.isFinite(q.y))out.push([q.x,q.y,rad||3.5]);};
 for(const d of L.worldR74?.doors||[])pt(d,Math.max(3.5,(Number(d.width)||0)/2+3));for(const q of [L.gate,L.entrance,L.entry])pt(q);for(const w of L.walls||[])if(/door/i.test(String(w.id||'')))pt(w);return out;};
// R171 지도 레이아웃이 처음 방에 붙을 때(꾸미기 전에) 부른다 — 같은 원본 레이아웃에는 늘 같은 결과 객체를 돌려준다(꾸미기·색인이 한 번만).
const widened=new WeakMap();
window.__STORYWORLD_LAYOUT_HOOK_R204__=(id,L)=>{try{if(!prefs.on||!solo()||!L?.floorCells?.length||L.r204Widened||L.r219)return null;if(widened.has(L))return widened.get(L);
 if(ZONES[id]?.decorOnly){if(!prefs.inflate)return null;const nx=inflate(L,{depth:ZONES[id].inflateDepth||3});widened.set(L,nx);return nx;}/* R219 */
 if(!prefs.widen||!ZONES[id]?.widen)return null;
 const nx=widen(L,ZONES[id],layoutDoorPoints(L));widened.set(L,nx);if(nx)stats.widened=nx.r204Widened;return nx;}catch(e){fail(e);return null;}};

// ---- 게임 쪽 거리장: 이동 판정(blocked)과 렌더러가 같은 것을 쓴다 ------------------------------------
// 첫 렌더 때(몹·조형물이 다 놓인 뒤) 만든다. 만들기 전에는 막는 것도 그리는 것도 없다(Legacy 렌더러도 그대로).
const cache=new WeakMap();
const roomOn=r=>!!(prefs.on&&solo()&&r&&r.layer==='STORY'&&ZONES[r.id]&&r.exploration?.floorCells?.length);
// [x,y,반지름]: 입구·문·상자·영웅 2.4칸, 조형물 1.3칸(+자기 반지름), 몹 1.0칸
function protectPoints(r){const out=[],ex=r.exploration,pt=(q,rad)=>{if(q&&Number.isFinite(q.x)&&Number.isFinite(q.y))out.push([q.x,q.y,rad]);};
 for(const q of [ex.entrance,ex.entry,ex.gate])pt(q,1.6);for(const q of r.props||[])pt(q,/door|chest|altar|gate|portal/i.test(String(q.kind||q.id||''))?2.2:.9+(Number(q.radius)||0));
 for(const q of r.enemies||[])pt(q,1.0);for(const d of window.__STORYWORLD_WORLD_R74__?.doors||[])pt(d,2.4);if(typeof player==='object'&&player&&typeof room!=='undefined'&&r===room)pt(player,1.2);return out;}
function fieldFor(r,make=false){const ex=r?.exploration;if(!ex)return null;let F=cache.get(ex);if(F||!make||!roomOn(r))return F||null;
 const t0=performance.now();F=field(ex,ZONES[r.id],protectPoints(r));F.zone=r.id;F.doors=layoutDoorPoints(ex);F.ms=Math.round(performance.now()-t0);cache.set(ex,F);try{window.__STORYWORLD_POLISH_R100__?.resetNav?.();if(typeof room!=='undefined'&&r===room&&typeof route!=='undefined'&&Array.isArray(route)&&route.length)route=[];}catch(_){}/* R208: 거리장이 생기기 전에 잰 길안내 격자·경로는 버린다 */return F;}
// 맵에 들어설 때(로딩 중) 거리장을 미리 계산하고, 게임 시작 뒤 한가할 때 지형 질감을 미리 받아 둔다 → 첫 화면에서 바로 새 지형
/* R208 전환 안정: 지역에 들어간 뒤 2.5초 동안은 화면 흔들림(shake)을 0 으로 둔다 — 로딩 직후 끊긴 프레임 위에 피격·연출 흔들림이 겹치면 크게 흔들려 보였다. */
let calmUntil=0;const calm=()=>{try{if(typeof shake==='number'&&shake>0)shake=0;}catch(_){}if(performance.now()<calmUntil&&typeof requestAnimationFrame==='function')requestAnimationFrame(calm);};
if(typeof enterRegion==='function'){const en=enterRegion;enterRegion=async function(...a){calmUntil=performance.now()+1e5;calm();let out;try{out=await en.apply(this,a);}finally{calmUntil=performance.now()+2500;}return out;};}/* 지형장은 첫 렌더에서 만든다(전환 직후 미리 만들면 렌더 전 판정까지 바뀜 — 전수 검사 projectile) */
if(typeof setTimeout==='function')setTimeout(()=>{try{const paths=new Set();for(const z of Object.values(ZONES)){for(const [p] of Object.values({...TEX,...(z.tex||{})}))paths.add(p);for(const [n] of [...(z.patches||[]),...(z.uprights||[])])paths.add('assets/r207/organic/'+n+'.png');if(z.trees)for(let i=0;i<12;i++)paths.add('assets/r99/outdoor/tree-'+z.trees+'-'+String(i).padStart(2,'0')+'.webp');}
 let i=0;const list=[...paths];const next=()=>{if(i>=list.length)return;loadImg(list[i++]).catch(()=>{}).finally(()=>setTimeout(next,60));};next();}catch(e){fail(e);}},2500);
if(typeof blocked==='function'){const base=blocked;
 blocked=function(x,y,rad=.27,where=(typeof room!=='undefined'?room:null)){if(base.call(this,x,y,rad,where))return true;
  /* R208: 바위 언덕 판정은 몸(반지름 .2 초과: 영웅·몹·길잡이 .29)에만 — 투사체(.08·.18)는 원래처럼 terrainContact153 기준(렌더 시점에 따라 결과가 달라지던 전수 검사 projectile) */
  if(!(rad>.2))return false;
  if(ZONES[where?.id]?.decorOnly)return false;/* R215: 디테일 전용 지역은 판정을 바꾸지 않는다 */
  try{if(prefs.on&&where?.exploration){const F=cache.get(where.exploration);if(F&&roomOn(where)){const fv=at(F,F.f,x,y);
   // 길찾기(findPath·R100·R101)는 칸 중심을 반지름 .29 로 묻고 대각선 모서리 깎기는 보지 않는다 → 새 바위 둘레에선 .32칸 여유를 더해 경로가 바위 가장자리를 스치지 않게 한다(실제 이동 .27 은 그대로).
   const need=rad>=.285&&rad<=.3?rad+.32:rad;if(fv<need&&at(F,F.raw,x,y)-fv>.02){stats.blocks++;return true;}}}}catch(e){fail(e);}return false;};}

// ---- 텍스처 -------------------------------------------------------------------------------------
const imgs=new Map();
function loadImg(p){let r=imgs.get(p);if(!r){r=new Promise((res,rej)=>{const im=new Image();im.decoding='async';im.onload=()=>res(im);im.onerror=()=>rej(Error('image failed '+p));im.src=p;});imgs.set(p,r);}return r;}
function tileTex(T,r,im,half,size=512){const c=document.createElement('canvas');c.width=c.height=size;const g=c.getContext('2d');g.imageSmoothingQuality='high';
 const w=im.naturalWidth,h=im.naturalHeight,sx=half===1?w/2:0,sw=half>=0&&w>h?w/2:w;g.drawImage(im,sx,0,sw,h,0,0,size,size);
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.generateMipmaps=true;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.anisotropy=Math.min(4,r.renderer?.capabilities?.getMaxAnisotropy?.()||1);r.spatialResources.add(t);return t;}
function fieldTex(T,r,F){const w=F.GW,h=F.GH,data=new Uint8Array(w*h*4),s=ZONES_SEED(F);
 for(let j=0;j<h;j++)for(let i=0;i<w;i++){const k=j*w+i,x=(i+.5)/R-M,y=(j+.5)/R-M;data[k*4]=Math.max(0,Math.min(255,Math.round((.5+F.f[k]/6)*255)));
  data[k*4+1]=Math.round((fbm(x*.11,y*.11,s+7,4)*.5+.5)*255);data[k*4+2]=Math.round((fbm(x*.31+9,y*.31,s+19,3)*.5+.5)*255);data[k*4+3]=255;}
 const t=new T.DataTexture(data,w,h,T.RGBAFormat);t.colorSpace=T.NoColorSpace;t.magFilter=t.minFilter=T.LinearFilter;t.generateMipmaps=false;t.wrapS=t.wrapT=T.ClampToEdgeWrapping;t.flipY=false;t.needsUpdate=true;r.spatialResources.add(t);return t;}
let SEED=1;const ZONES_SEED=()=>SEED;

// 거미줄·잔돌 데칼(직접 그린 보조 자산) + 기존 균열·뼈·뿌리 그림을 한 장(1024×512, 4×2 칸)에 모은다.
function decalAtlas(T,r,ims,cfg){const c=document.createElement('canvas');c.width=1024;c.height=768;/* R212: 4×3 칸(8~11 추가) */const g=c.getContext('2d');const rnd=rng(cfg.seed^0x77);
 const put=(im,k)=>{const x=(k%4)*256,y=Math.floor(k/4)*256;const w=im.naturalWidth,h=im.naturalHeight,s=Math.min(236/w,236/h);g.drawImage(im.__c||im,x+128-w*s/2,y+128-h*s/2,w*s,h*s);};
 // r106 균열은 원래 하얗게 빛나는 효과 그림 → 바닥 균열로 쓰도록 어둡게(밝기 반전에 가깝게 눌러) 칠한다
 {const c2=document.createElement('canvas');c2.width=ims.crack.naturalWidth;c2.height=ims.crack.naturalHeight;const g2=c2.getContext('2d');g2.drawImage(ims.crack,0,0);const id=g2.getImageData(0,0,c2.width,c2.height),d=id.data;
  for(let i=0;i<d.length;i+=4){d[i]=26;d[i+1]=20;d[i+2]=16;d[i+3]=Math.min(255,d[i+3]*.85);}g2.putImageData(id,0,0);put({naturalWidth:c2.width,naturalHeight:c2.height,__c:c2},0);}
 put(ims.bones,1);put(ims.root,2);
 // 3: 거미줄(모서리형) 4: 거미줄(둥근형)
 const web=(ox,oy,corner)=>{g.save();g.translate(ox,oy);g.strokeStyle='rgba(222,214,200,.55)';g.lineWidth=1.1;const n=corner?7:11,ang=corner?Math.PI/2:Math.PI*2,R0=corner?236:118,cx=corner?6:128,cy=corner?6:128;
  const spokes=[];for(let i=0;i<n;i++){const a=(corner?0:0)+ang*(i+(corner?.0:.0))/(corner?n-1:n)+(rnd()-.5)*.12;spokes.push(a);g.beginPath();g.moveTo(cx,cy);g.lineTo(cx+Math.cos(a)*R0,cy+Math.sin(a)*R0);g.stroke();}
  for(let ring=1;ring<=9;ring++){const rr=R0*ring/10*(0.95+rnd()*.1);g.beginPath();spokes.forEach((a,i)=>{const q=rr*(0.92+rnd()*.12),x=cx+Math.cos(a)*q,y=cy+Math.sin(a)*q;if(!i)g.moveTo(x,y);else g.quadraticCurveTo(cx+Math.cos(a-.06)*q*.93,cy+Math.sin(a-.06)*q*.93,x,y);});if(!corner)g.closePath();g.stroke();}
  g.restore();};
 web(768,0,true);web(0,256,false);
 // 5,6,7: 잔돌 무더기(크기 다르게) — 어두운 흙색 작은 돌
 for(const [k,n,sz] of [[5,22,16],[6,40,10],[7,9,30]]){const ox=(k%4)*256,oy=Math.floor(k/4)*256;for(let i=0;i<n;i++){const a=rnd()*Math.PI*2,d=Math.sqrt(rnd())*90,x=ox+128+Math.cos(a)*d,y=oy+128+Math.sin(a)*d*.8,s=sz*(.5+rnd());
   const gr=g.createRadialGradient(x-s*.25,y-s*.3,s*.1,x,y,s);gr.addColorStop(0,'rgba(150,132,110,1)');gr.addColorStop(.7,'rgba(78,66,54,1)');gr.addColorStop(1,'rgba(30,24,20,0)');
   g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.ellipse(x+s*.25,y+s*.3,s*.9,s*.5,0,0,Math.PI*2);g.fill();
   g.fillStyle=gr;g.beginPath();const m=6+Math.floor(rnd()*3);for(let q=0;q<m;q++){const aa=q/m*Math.PI*2,rr=s*(.7+rnd()*.35);const px=x+Math.cos(aa)*rr,py=y+Math.sin(aa)*rr*.75;q?g.lineTo(px,py):g.moveTo(px,py);}g.closePath();g.fill();}}
 // R212 8: 땅에 떨어진 쇠사슬(r138, 성) 9: 물결(r138 ripple, 늪 웅덩이 위) 10: 늪 웅덩이(검푸른 물·젖은 가장자리) 11: 이끼 얼룩
 if(ims.chain)put(ims.chain,8);
 if(ims.ripple){const c3=document.createElement('canvas');c3.width=ims.ripple.naturalWidth;c3.height=ims.ripple.naturalHeight;const g3=c3.getContext('2d');g3.drawImage(ims.ripple,0,0);const id=g3.getImageData(0,0,c3.width,c3.height),d=id.data;
  for(let i=0;i<d.length;i+=4){d[i]=Math.min(255,d[i]*.55+20);d[i+1]=Math.min(255,d[i+1]*.62+24);d[i+2]=Math.min(255,d[i+2]*.6+22);d[i+3]=d[i+3]*.55;}g3.putImageData(id,0,0);put({naturalWidth:c3.width,naturalHeight:c3.height,__c:c3},9);}
 {const ox=2*256,oy=2*256;for(let i=0;i<5;i++){const x=ox+128+(rnd()-.5)*70,y=oy+128+(rnd()-.5)*40,rx=40+rnd()*50,ry=rx*(.45+rnd()*.2);
   const gr=g.createRadialGradient(x,y,rx*.1,x,y,rx);gr.addColorStop(0,'rgba(44,58,54,.9)');gr.addColorStop(.55,'rgba(30,40,34,.86)');gr.addColorStop(.86,'rgba(50,54,36,.55)');/* 탁한 늪물(검은 구멍처럼 보이지 않게) */gr.addColorStop(1,'rgba(40,36,24,0)');
   g.fillStyle=gr;g.beginPath();g.ellipse(x,y,rx,ry,(rnd()-.5)*.6,0,Math.PI*2);g.fill();}
  for(const [a,w,al] of [[.0,3,.32],[.5,1.6,.22]]){g.strokeStyle='rgba(176,196,190,'+al+')';g.lineWidth=w;g.beginPath();g.ellipse(ox+116+a*20,oy+118+a*8,50-a*14,17-a*5,-.2,Math.PI*1.08,Math.PI*1.8);g.stroke();}/* 물 같은 반사 띠 */}
 {const ox=3*256,oy=2*256;for(let i=0;i<60;i++){const a=rnd()*Math.PI*2,d=Math.sqrt(rnd())*96,x=ox+128+Math.cos(a)*d,y=oy+128+Math.sin(a)*d*.75,s=6+rnd()*16;
   const gr=g.createRadialGradient(x,y,1,x,y,s);gr.addColorStop(0,'rgba(78,96,46,.7)');gr.addColorStop(1,'rgba(40,52,24,0)');g.fillStyle=gr;g.beginPath();g.arc(x,y,s,0,Math.PI*2);g.fill();}}
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.generateMipmaps=true;t.minFilter=T.LinearMipmapLinearFilter;r.spatialResources.add(t);return t;}

// ---- 셰이더 조각 --------------------------------------------------------------------------------
const NOISE_GLSL=`
float r204h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
vec4 r204tex(sampler2D t,vec2 w,float sc,float rot,vec2 off){float c=cos(rot),s=sin(rot);vec2 q=mat2(c,-s,s,c)*w*sc+off;return texture2D(t,q);}
`;
function cutaway(shader,uniforms){// 영웅 앞의 조각만 성글게 지운다(화면 거리 + 카메라 쪽 깊이)
 shader.uniforms.r204Hero=uniforms.r204Hero;shader.uniforms.r204Aspect=uniforms.r204Aspect;
 shader.vertexShader='varying vec4 r204Clip;\n'+shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nr204Clip=gl_Position;');
 shader.fragmentShader='varying vec4 r204Clip;\nuniform vec4 r204Hero;\nuniform float r204Aspect;\n'+shader.fragmentShader.replace('void main() {','void main() {\n{vec2 nd=r204Clip.xy/r204Clip.w-r204Hero.xy;nd.x*=r204Aspect;float dz=r204Clip.z/r204Clip.w;float dd=length(nd);\n if(r204Hero.w>0.5&&dz<r204Hero.z-0.002&&dd<0.2){float k=smoothstep(0.2,0.11,dd);float pat=mod(floor(gl_FragCoord.x)+floor(gl_FragCoord.y),2.0);float pat2=mod(floor(gl_FragCoord.x*0.5)+floor(gl_FragCoord.y*0.5),2.0);if(k>0.66||(k>0.33&&pat>0.5)||(pat>0.5&&pat2>0.5))discard;}}');}

function groundMaterial(T,r,F,tx,cfg,U){const m=new T.MeshBasicMaterial({color:0xffffff,toneMapped:false});
 m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,{r204Field:{value:tx.field},r204A:{value:tx.floorA},r204B:{value:tx.floorB},r204C:{value:tx.rock},r204Min:{value:new T.Vector2(-M,-M)},r204Span:{value:new T.Vector2(F.W+2*M,F.H+2*M)},r204Tint:{value:new T.Vector3(...cfg.tint)},r204FloorK:{value:cfg.floorK??.92},r204BGain:{value:cfg.floorBGain??2.2}});
  sh.vertexShader='varying vec2 r204W;\n'+sh.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nr204W=(modelMatrix*vec4(transformed,1.0)).xz;');
  sh.fragmentShader='varying vec2 r204W;\nuniform sampler2D r204Field,r204A,r204B,r204C;uniform vec2 r204Min,r204Span;uniform vec3 r204Tint;uniform float r204FloorK;uniform float r204BGain;\n'+NOISE_GLSL+sh.fragmentShader.replace('#include <map_fragment>',`
   vec2 fu=(r204W-r204Min)/r204Span;vec4 fd=texture2D(r204Field,fu);float fv=(fd.r-0.5)*6.0;
   vec4 a1=r204tex(r204A,r204W,0.21,0.0,vec2(0.0)),a2=r204tex(r204A,r204W,0.137,1.1,vec2(0.37,0.11));vec3 ta=mix(a1.rgb,a2.rgb,smoothstep(0.35,0.65,fd.b));
   vec3 tb=r204tex(r204B,r204W,0.17+0.05*fd.b,0.6,vec2(0.0)).rgb*r204BGain;
   vec3 tc=r204tex(r204C,r204W,0.12+0.07*fd.g,1.9,vec2(0.2,0.7)).rgb;float lc=dot(tc,vec3(0.3,0.59,0.11));tc=vec3(lc)*1.25;
   float wB=smoothstep(0.42,0.62,fd.g),wC=smoothstep(0.55,0.75,fd.b)*(1.0-wB*0.5);
   vec3 col=mix(mix(ta,tb,wB),tc,wC*0.75);float lum=dot(col,vec3(0.3,0.59,0.11));col=mix(vec3(lum)*r204Tint,col*r204Tint,0.35)*r204FloorK;
   float fl=(texture2D(r204Field,fu+vec2(-0.55,-0.55)/r204Span).r-0.5)*6.0;
   float ao=mix(0.3,1.0,smoothstep(-0.05,1.4,fv))*mix(0.62,1.0,smoothstep(0.0,1.8,fl));col*=ao;
   diffuseColor.rgb*=col;`);};
 m.customProgramCacheKey=()=>'r204-ground-v1';return m;}

function topMaterial(T,r,F,tx,cfg,U){const m=new T.MeshBasicMaterial({color:0xffffff,toneMapped:false});
 m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,{r204TopK:{value:cfg.topK??2.5},r204Field:{value:tx.field},r204C:{value:tx.rock},r204Min:{value:new T.Vector2(-M,-M)},r204Span:{value:new T.Vector2(F.W+2*M,F.H+2*M)},r204Tint:{value:new T.Vector3(...cfg.tint)}});
  sh.vertexShader='varying vec2 r204W;varying float r204Y;\n'+sh.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nvec4 r204wp=modelMatrix*vec4(transformed,1.0);r204W=r204wp.xz;r204Y=r204wp.y;');
  sh.fragmentShader='varying vec2 r204W;varying float r204Y;\nuniform sampler2D r204Field,r204C;uniform vec2 r204Min,r204Span;uniform vec3 r204Tint;uniform float r204TopK;\n'+NOISE_GLSL+sh.fragmentShader.replace('#include <map_fragment>',`
   vec2 fu=(r204W-r204Min)/r204Span;vec4 fd=texture2D(r204Field,fu);float fv=(fd.r-0.5)*6.0;if(fv>0.0)discard;
   vec4 c1=r204tex(r204C,r204W,0.16,0.4,vec2(0.0)),c2=r204tex(r204C,r204W,0.27,2.0,vec2(0.3,0.6));vec3 tc=mix(c1.rgb,c2.rgb,fd.g);float lc=dot(tc,vec3(0.3,0.59,0.11));
   vec3 col=vec3(lc)*r204Tint*r204TopK;float rim=smoothstep(-0.32,-0.04,fv);col*=mix(0.66,1.0,smoothstep(0.3,1.6,r204Y))*(1.0+rim*0.55);col*=mix(0.55,1.0,fd.b);
   col*=mix(1.0,0.42,smoothstep(0.4,4.5,-fv));// 통로에서 먼 바위일수록 어둡게(깊이감·통로 가독성)
   col*=1.0-0.28*smoothstep(-0.55,-0.3,fv)*(1.0-smoothstep(-0.3,-0.12,fv));// 가장자리 바로 안쪽 어두운 균열 띠 → 밝은 입술과 대비
   diffuseColor.rgb*=col;`);};
 m.customProgramCacheKey=()=>'r204-top-v1';return m;}

function faceMaterial(T,r,tx,cfg,lip=false){const m=new T.MeshBasicMaterial({color:0xffffff,toneMapped:false,vertexColors:true});
 m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,{r204F:{value:tx.face},r204Tint:{value:new T.Vector3(...cfg.tint)}});
  sh.vertexShader='varying vec3 r204P;varying float r204Rel;\n'+(lip?'attribute float r204top;\n':'')+sh.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nr204P=(modelMatrix*vec4(transformed,1.0)).xyz;r204Rel='+(lip?'clamp(r204P.y/max(0.2,r204top),0.0,1.0)':'0.5')+';');
  sh.fragmentShader='varying vec3 r204P;varying float r204Rel;\nuniform sampler2D r204F;uniform vec3 r204Tint;\n'+NOISE_GLSL+sh.fragmentShader.replace('#include <map_fragment>',`
   vec2 q=vec2((r204P.x-r204P.z)*0.19,r204P.y*0.26+(r204P.x+r204P.z)*0.03);vec3 t1=texture2D(r204F,q).rgb,t2=texture2D(r204F,q*0.61+vec2(0.31,0.17)).rgb;vec3 tc=mix(t1,t2,0.4);
   float lc=dot(tc,vec3(0.3,0.59,0.11));float st=0.82+0.3*fract(sin(floor((r204P.x-r204P.z)*3.1)*12.9898)*43758.5);vec3 col=vec3(lc)*r204Tint*2.1*st;col*=mix(0.3,1.0,smoothstep(0.0,1.3,r204P.y));
   col*=1.0+0.5*smoothstep(0.86,1.0,r204Rel)-0.18*smoothstep(0.55,0.8,r204Rel)*(1.0-smoothstep(0.8,0.9,r204Rel));// 윗가장자리 밝은 입술·그 아래 그늘 띠
   diffuseColor.rgb*=col;`);};
 m.customProgramCacheKey=()=>'r204-face-v2'+(lip?'-lip':'');return m;}

// ---- 바닥 굽기: 질감 3종 혼합·접촉 그림자를 진입할 때 한 번만 렌더 타깃(칸당 16px)에 굽는다 ----------------------
// 매 프레임은 구운 그림 1장 + 잔결(거미동굴 바닥 질감) 1장만 읽는다 — 모바일 채움 비용을 줄인다.
const BAKE_PPU=16;
function bakeGround(T,r,F,bakeMat,detail,cfg){const sw=F.W+2*M,sh=F.H+2*M,rt=new T.WebGLRenderTarget(sw*BAKE_PPU,sh*BAKE_PPU,{depthBuffer:false,generateMipmaps:true,minFilter:T.LinearMipmapLinearFilter,magFilter:T.LinearFilter,colorSpace:T.SRGBColorSpace});
 const geo=groundMesh(T,F),scene=new T.Scene(),cam=new T.OrthographicCamera(-sw/2,sw/2,sh/2,-sh/2,-10,10);scene.add(new T.Mesh(geo,bakeMat));
 cam.up.set(0,0,-1);cam.position.set(F.W/2,5,F.H/2);cam.lookAt(F.W/2,0,F.H/2);cam.updateMatrixWorld();cam.updateProjectionMatrix();
 const prev=r.renderer.getRenderTarget();r.renderer.setRenderTarget(rt);r.renderer.render(scene,cam);r.renderer.setRenderTarget(prev);geo.dispose();bakeMat.dispose();
 r.spatialResources.add(rt);
 const m=new T.MeshBasicMaterial({map:rt.texture,toneMapped:false});
 m.onBeforeCompile=sh2=>{sh2.uniforms.r204D={value:detail};sh2.vertexShader='varying vec2 r204W;\n'+sh2.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nr204W=(modelMatrix*vec4(transformed,1.0)).xz;');
  sh2.fragmentShader='varying vec2 r204W;\nuniform sampler2D r204D;\n'+sh2.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\nfloat r204d=dot(texture2D(r204D,r204W*0.47).rgb,vec3(0.33));diffuseColor.rgb*=clamp(0.55+r204d*1.05,0.6,1.35);');};
 m.customProgramCacheKey=()=>'r204-ground-baked-v1';return m;}

// ---- 기하 ---------------------------------------------------------------------------------------
function groundMesh(T,F){const g=new T.PlaneGeometry(F.W+2*M,F.H+2*M,1,1);g.rotateX(-Math.PI/2);g.translate(F.W/2,0,F.H/2);return g;}
function topMesh(T,F,cfg){// 칸당 1점 격자, 보행 쪽(f>0)은 셰이더가 버린다. 경계 근처는 거리장 0 근방이라 높이가 이어진다.
 const nx=F.W+2*M+1,ny=F.H+2*M+1,pos=new Float32Array(nx*ny*3),idx=[];
 for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const x=i-M,y=j-M,k=(j*nx+i)*3;pos[k]=x;pos[k+1]=topHeight(F,cfg,x,y);pos[k+2]=y;}
 for(let j=0;j<ny-1;j++)for(let i=0;i<nx-1;i++){const a=j*nx+i,b=a+1,c=a+nx,d=c+1;
  // 전부 보행 칸 한가운데면(네 점 모두 f>0.6) 삼각형을 만들지 않는다
  // 이 칸 안 거리장 점이 모두 보행 쪽으로 넉넉하면(>0.25) 삼각형을 만들지 않는다 — 작은 바위섬 윗면이 빠지지 않게 칸 안 모든 점을 본다
  let mn=1e9;for(let q=0;q<R&&mn>.25;q++)for(let w=0;w<R;w++){const v=F.f[(j*R+q)*F.GW+i*R+w];if(v<mn)mn=v;}if(mn>.25)continue;idx.push(a,c,b,b,c,d);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(pos,3));g.setIndex(idx);g.computeBoundingSphere();return g;}
function faceMesh(T,F,cfg){// 마칭 스퀘어: 노드 값 f, 0 등고선 조각마다 세로 면. 법선은 보행 쪽(앞면) — 뒤쪽 면은 컬링.
 const pos=[],col=[],idx=[],tops=[];let n=0;const f=F.f,GW=F.GW,GH=F.GH;
 const P=(i,j)=>[(i+.5)/R-M,(j+.5)/R-M];const L=[-.55,.62,-.56];// 빛: 왼쪽 위 앞
 const edge=(i0,j0,i1,j1)=>{const v0=f[j0*GW+i0],v1=f[j1*GW+i1],t=v0/(v0-v1),a=P(i0,j0),b=P(i1,j1);return[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];};
 for(let j=0;j<GH-1;j++)for(let i=0;i<GW-1;i++){const a=f[j*GW+i],b=f[j*GW+i+1],c=f[(j+1)*GW+i+1],d=f[(j+1)*GW+i];
  const code=(a>0?1:0)|(b>0?2:0)|(c>0?4:0)|(d>0?8:0);if(code===0||code===15)continue;
  const eT=()=>edge(i,j,i+1,j),eR=()=>edge(i+1,j,i+1,j+1),eB=()=>edge(i,j+1,i+1,j+1),eL=()=>edge(i,j,i,j+1);
  const segs={1:[[eL,eT]],2:[[eT,eR]],3:[[eL,eR]],4:[[eR,eB]],5:[[eL,eT],[eR,eB]],6:[[eT,eB]],7:[[eL,eB]],8:[[eB,eL]],9:[[eB,eT]],10:[[eT,eR],[eB,eL]],11:[[eB,eR]],12:[[eR,eL]],13:[[eR,eT]],14:[[eT,eL]]}[code];
  for(const [s0,s1] of segs){const p=s0(),q=s1();
   // 보행 쪽을 향하는 법선: 조각 가운데에서 f 의 기울기
   const mx=(p[0]+q[0])/2,my=(p[1]+q[1])/2,gx=at(F,f,mx+.1,my)-at(F,f,mx-.1,my),gy=at(F,f,mx,my+.1)-at(F,f,mx,my-.1);
   let nx=-(q[1]-p[1]),ny=q[0]-p[0];if(nx*gx+ny*gy<0){nx=-nx;ny=-ny;}const nl=Math.hypot(nx,ny)||1;nx/=nl;ny/=nl;
   const h0=topHeight(F,cfg,p[0],p[1]),h1=topHeight(F,cfg,q[0],q[1]);
   const sh=.5+.5*Math.max(0,nx*L[0]+ny*L[2])+.12;const cA=Math.min(1.15,sh);
   pos.push(p[0],-.03,p[1], q[0],-.03,q[1], p[0],h0,p[1], q[0],h1,q[1]);for(let k=0;k<4;k++)col.push(cA,cA,cA);tops.push(h0,h1,h0,h1);
   // 앞면(반시계, 바깥=보행 쪽)이 되도록 감는 방향을 법선으로 고른다
   const cross=(q[0]-p[0])*ny-(q[1]-p[1])*nx;if(cross<0)idx.push(n,n+2,n+1,n+1,n+2,n+3);else idx.push(n,n+1,n+2,n+1,n+3,n+2);n+=4;}}
 stats.segments=n/4;const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setAttribute('r204top',new T.Float32BufferAttribute(tops,1));g.setIndex(idx);g.computeBoundingSphere();return g;}
function pillarMesh(T,F,cfg){// 종유석·바위 기둥: 대지 가장자리(f -0.6~-2.6)에 고정 시드로. 6~8각 뿔, 꼭짓점을 흔든다.
 const rnd=rng(cfg.seed^0x3141),pos=[],col=[],idx=[];let n=0,count=0;const want=cfg.pillars===false?0:Math.round((F.W*F.H)/55);
 for(let t=0;t<want*30&&count<want;t++){const x=rnd()*F.W,y=rnd()*F.H,fv=at(F,F.f,x,y);if(fv>-.6||fv<-2.6)continue;
  const base=topHeight(F,cfg,x,y),tall=(.9+rnd()*2.2)*(fv<-1.5?1.25:.85)*Math.min(1,Math.max(.35,base/cfg.hiTop)),rad=.18+rnd()*.32,sides=6+Math.floor(rnd()*3),lean=[(rnd()-.5)*.25,(rnd()-.5)*.25];
  const rings=[[0,1],[.45,.72],[.8,.38],[1,.04]];const start=n;
  for(const [hv,rv] of rings)for(let s=0;s<=sides;s++){const a=s/sides*Math.PI*2+rnd()*.15,rr=rad*rv*(.8+rnd()*.35);pos.push(x+Math.cos(a)*rr+lean[0]*hv*tall,base-.05+hv*tall,y+Math.sin(a)*rr+lean[1]*hv*tall);const lit=.55+.45*Math.max(0,Math.cos(a+2.4));const c=Math.min(1.1,lit*(0.7+hv*.4));col.push(c,c,c);n++;}
  for(let ri=0;ri<rings.length-1;ri++)for(let s=0;s<sides;s++){const a=start+ri*(sides+1)+s,b=a+1,c=a+sides+1,d=c+1;idx.push(a,b,c,b,d,c);}
  count++;}
 // 대지 위 낮은 바위 무더기: 깊은 대지(f<-1.1)에 납작하고 넓은 다각 덩어리 — 넓은 대지가 밋밋하지 않게. 높이는 대지 높이의 일부라 영웅을 가리지 않는다.
 if(cfg.boulders){const wantB=Math.round(F.W*F.H*cfg.boulders);let nb=0;
  for(let t=0;t<wantB*30&&nb<wantB;t++){const cx=rnd()*F.W,cy=rnd()*F.H,fv=at(F,F.f,cx,cy);if(fv>-1.1)continue;const base=topHeight(F,cfg,cx,cy);
   const grp=1+Math.floor(rnd()*3);for(let gi=0;gi<grp;gi++){const x=cx+(rnd()-.5)*1.2,y=cy+(rnd()-.5)*1.2;if(at(F,F.f,x,y)>-.8)continue;
    const rad=.35+rnd()*.55,tall=(.25+rnd()*.45)*Math.min(1,.5+base/cfg.hiTop),sides=7+Math.floor(rnd()*3),rings=[[0,1],[.45,1.08],[.8,.75],[1,.25]],start=n;
    for(const [hv,rv] of rings)for(let k=0;k<=sides;k++){const a2=k/sides*Math.PI*2+rnd()*.25,rr=rad*rv*(.75+rnd()*.4);pos.push(x+Math.cos(a2)*rr,base-.06+hv*tall,y+Math.sin(a2)*rr*.85);const lit=.5+.5*Math.max(0,Math.cos(a2+2.4));const c=Math.min(1.05,lit*(.62+hv*.45));col.push(c,c,c);n++;}
    for(let ri=0;ri<rings.length-1;ri++)for(let k=0;k<sides;k++){const a3=start+ri*(sides+1)+k,b=a3+1,c=a3+sides+1,d=c+1;idx.push(a3,b,c,b,d,c);}}nb++;}
  stats.boulders=nb;}
 stats.pillars=count;const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setIndex(idx);g.computeVertexNormals();g.computeBoundingSphere();return g;}
// R212: 지역마다 장식 비율(cfg.decalMix {near,open}: [[칸,무게]…])·밀도(cfg.decalDensity, 칸 수 나눔). 없으면 예전 동굴 규칙.
const pickW=(list,r)=>{let t=0;for(const [,w] of list)t+=w;let x=r*t;for(const [k,w] of list){x-=w;if(x<=0)return k;}return list[list.length-1][0];};
const DSIZE={0:1.8,1:1.1,2:1.5,3:1.6,4:1.6,5:1.0,6:1.0,7:.9,8:1.5,9:1.4,10:2.4,11:1.7};
// R218 실내 골격(사용자 2026-11-02 "내부맵도 개선 다만 내부맵은 건물답게 골격이 확실히 있어야해"):
//  디테일 전용(실내·현대) 지역의 벽 모서리·T자·끝점과 긴 벽(6칸 이상)의 4칸마다 기둥(받침·몸통·머리)을 세운다. 높이는 그 벽 높이에 맞춘다.
//  문 둘레(문 폭 절반+1칸)는 비운다. 판정·길찾기는 바꾸지 않는다(보기 전용, 벽 두께 안쪽에 서므로 걸리지 않음).
function skeletonPoints(ex){const walls=(ex.walls||[]).filter(w=>Array.isArray(w.endpoints)&&w.endpoints.length===2&&!/door/i.test(String(w.id||'')));
 const doors=layoutDoorPoints(ex).map(([x,y,r])=>[x,y,Math.max(1.6,(r||3.5)-1.5)]),nearDoor=(x,y)=>doors.some(d=>Math.hypot(d[0]-x,d[1]-y)<d[2]);
 const pts=new Map(),key=(x,y)=>Math.round(x*4)+','+Math.round(y*4);
 const put=(x,y,h,kind)=>{if(nearDoor(x,y))return;const k=key(x,y),o=pts.get(k);if(o){o.h=Math.max(o.h,h);o.n++;if(kind==='end')o.end=true;}else pts.set(k,{x,y,h,n:1,end:kind==='end'});};
 for(const w of walls){const [[x0,y0],[x1,y1]]=w.endpoints,h=Number(w.height)||2.85,len=Math.hypot(x1-x0,y1-y0);if(!(len>.6))continue;put(x0,y0,h,'end');put(x1,y1,h,'end');
  if(len>=6){const n=Math.floor(len/4);for(let i=1;i<n;i++){const t=i/n;put(x0+(x1-x0)*t,y0+(y1-y0)*t,h,'mid');}}}
 return [...pts.values()];}
function skeletonMesh(T,ex,cfg){const pts=skeletonPoints(ex);if(!pts.length)return null;const pos=[],uv=[],col=[],idx=[];let n=0;const bc=cfg.bone||[.55,.55,.55];
 const box=(cx,cz,w,y0,y1,shade)=>{const h=w/2,X=[cx-h,cx+h],Z=[cz-h,cz+h];
  const faces=[[[X[0],y1,Z[0]],[X[1],y1,Z[0]],[X[1],y1,Z[1]],[X[0],y1,Z[1]],1.0],[[X[1],y0,Z[0]],[X[1],y0,Z[1]],[X[1],y1,Z[1]],[X[1],y1,Z[0]],.82],[[X[0],y0,Z[1]],[X[1],y0,Z[1]],[X[1],y1,Z[1]],[X[0],y1,Z[1]],.64],[[X[0],y0,Z[0]],[X[0],y0,Z[1]],[X[0],y1,Z[1]],[X[0],y1,Z[0]],.5],[[X[0],y0,Z[0]],[X[1],y0,Z[0]],[X[1],y1,Z[0]],[X[0],y1,Z[0]],.56]];
  for(const [a,b,c,d,k] of faces){const s=k*shade,top=a[1]===b[1]&&b[1]===c[1];for(const [v,uu,vv] of [[a,0,0],[b,1,0],[c,1,1],[d,0,1]]){pos.push(...v);uv.push(uu*w*1.6,top?vv*w*1.6:(v[1]-y0)*.55);const g=top?1:.72+.28*Math.min(1,(v[1]-y0)/Math.max(.2,y1-y0));col.push(bc[0]*s*g,bc[1]*s*g,bc[2]*s*g);}idx.push(n,n+1,n+2,n,n+2,n+3);n+=4;}};
 for(const p of pts){const big=p.n>1||!p.end?1:0,h=p.h,w=big?.44:.38;box(p.x,p.y,w+.14,0,.18,.78);box(p.x,p.y,w,.18,h-.02,1);box(p.x,p.y,w+.16,h-.02,h+.12,1.08);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setIndex(idx);g.computeBoundingSphere();stats.skeleton=pts.length;return g;}
function decalMesh(T,F,cfg){// 바닥 데칼: 보행 영역(f>0.15) — 균열·잔돌·뼈는 아무 데나, 뿌리·거미줄은 절벽 가까이(f<1.2)
 const rnd=rng(cfg.seed^0x2718),pos=[],uv=[],idx=[];let n=0,count=0;const want=Math.round((F.W*F.H)/(cfg.decalDensity||14));const mix=cfg.decalMix;
 for(let t=0;t<want*20&&count<want;t++){const x=rnd()*F.W,y=rnd()*F.H,fv=at(F,F.f,x,y);if(fv<.15)continue;
  const near=fv<1.2;let k;const r0=rnd();
  if(mix)k=pickW(near?mix.near:mix.open,r0);else if(near)k=r0<.32&&cfg.web?(r0<.16?3:4):r0<.55?2:r0<.8?5:6;else k=r0<.3?0:r0<.55?5:r0<.75?6:r0<.88?7:1;
  if(k===10&&fv<1.6)continue;/* 웅덩이는 트인 곳에만 */
  const size=(DSIZE[k]||1)*(.65+rnd()*.7),rot=k===10||k===9?(rnd()-.5)*.3:rnd()*Math.PI*2,u0=(k%4)/4,v0=Math.floor(k/4)/3;
  const cs=Math.cos(rot)*size/2,sn=Math.sin(rot)*size/2;const yy=.012+count*1e-5;
  pos.push(x-cs+sn,yy,y-sn-cs, x+cs+sn,yy,y+sn-cs, x+cs-sn,yy,y+sn+cs, x-cs-sn,yy,y-sn+cs);
  uv.push(u0,1-v0, u0+.25,1-v0, u0+.25,1-v0-1/3, u0,1-v0-1/3);idx.push(n,n+2,n+1,n,n+3,n+2);n+=4;count++;}
 stats.decals=count;const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeBoundingSphere();return g;}

function blobTex(T,r){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),gr=g.createRadialGradient(64,64,4,64,64,62);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.55,'rgba(255,255,255,.55)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,128,128);
 const t=new T.CanvasTexture(c);t.colorSpace=T.NoColorSpace;r.spatialResources.add(t);return t;}
// 바닥에 놓인 조형물(문·상자·빛 소품 포함, 공중 장식 제외) 아래 타원. 반지름은 소품 반지름의 1.25배(최소 0.45칸), 화면 세로로 눌린 모양은 바닥 평면이라 저절로 생긴다.
function propShadowMesh(T,F,rm){const props=(rm?.props||[]).filter(q=>Number.isFinite(q.x)&&Number.isFinite(q.y)&&!q.flying&&!q.r204NoShadow&&at(F,F.f,q.x,q.y)>-.2);if(!props.length)return null;
 const pos=[],uv=[],idx=[];let n=0;for(const q of props){const rad=Math.max(.45,(Number(q.radius)||.4)*1.25),y=.011;
  pos.push(q.x-rad,y,q.y-rad, q.x+rad,y,q.y-rad, q.x+rad,y,q.y+rad, q.x-rad,y,q.y+rad);uv.push(0,0,1,0,1,1,0,1);idx.push(n,n+2,n+1,n,n+3,n+2);n+=4;}
 stats.propShadows=props.length;const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeBoundingSphere();return g;}
// 둔덕 위 나무: 뒤쪽(높은) 둔덕에만 — 카메라 쪽 낮은 둔덕엔 세우지 않아 영웅을 가리지 않는다. 원화 12장 중 고정 시드로 고르고 좌우 반전·크기만 바꾼다.
function treeSprites(T,r,F,cfg,ims){const rnd=rng(cfg.seed^0x7ee5),g=new T.Group(),mats=[];let n=0;const want=Math.round((F.W*F.H)/120);
 for(let i=0;i<12;i++){const im=ims['tree'+i];if(!im)continue;const t=new T.Texture(im);t.colorSpace=T.SRGBColorSpace;t.needsUpdate=true;r.spatialResources.add(t);
  const m=new T.SpriteMaterial({map:t,alphaTest:.45,depthWrite:true,toneMapped:false,color:new T.Color(cfg.tint[0]*.9,cfg.tint[1]*.9,cfg.tint[2]*.9)});r.spatialResources.add(m);mats.push(m);}
 if(!mats.length)return null;const placed=[];
 for(let t=0;t<want*40&&n<want;t++){const x=rnd()*F.W,y=rnd()*F.H,fv=at(F,F.f,x,y);if(fv>-.9||fv<-4)continue;const h=topHeight(F,cfg,x,y);if(h<1.05)continue;
  if(placed.some(p=>Math.hypot(p[0]-x,p[1]-y)<2.2))continue;placed.push([x,y]);
  const s=new T.Sprite(mats[Math.floor(rnd()*mats.length)]);const hgt=3.4+rnd()*1.8;s.scale.set(hgt*.95,hgt,1);s.center.set(.5,.04);s.position.set(x,h-.05,y);s.layers.set(2);s.renderOrder=-27;s.userData.r204=true;g.add(s);n++;}
 stats.trees=n;return n?g:null;}

// ---- R207 Drive 유기 지형 패치 ---------------------------------------------------------------------
// 그림 자체가 이 게임의 2:1 아이소 시점으로 그려져 있다 → 화면 픽셀을 바닥 좌표로 되돌린 평면 사각형에 붙이면 그린 모양 그대로 바닥에 눕는다.
//  화면 (dpx,dpy) px(줌 1) → 바닥 x−y = dpx/34, x+y = dpy/17 (엔진 Projection tile=34). 늘이기·회전·반전 없음(조명 방향 보존). 비충돌.
const ISO_T=34;
function isoQuad(cx,cy,box,s,yOff){const P=(px,py)=>{const dx=(px-box.cx)*s,dy=(py-box.cy)*s;return[cx+(dx/ISO_T+dy/(ISO_T/2))/2,yOff,cy+(dy/(ISO_T/2)-dx/ISO_T)/2];};
 return[P(box.x0,box.y0),P(box.x1,box.y0),P(box.x1,box.y1),P(box.x0,box.y1)];}
function bboxOf(im){const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const g=c.getContext('2d');g.drawImage(im,0,0);const d=g.getImageData(0,0,c.width,c.height).data;
 let x0=c.width,y0=c.height,x1=0,y1=0;for(let y=0;y<c.height;y+=2)for(let x=0;x<c.width;x+=2)if(d[(y*c.width+x)*4+3]>24){if(x<x0)x0=x;if(y<y0)y0=y;if(x>x1)x1=x;if(y>y1)y1=y;}
 return{x0,y0,x1:x1+2,y1:y1+2,cx:(x0+x1)/2,cy:(y0+y1)/2,w:c.width,h:c.height};}
// 바위 조각은 회보라 암석이라 지역 색(tint)으로 다시 칠한다(밝기만 살림) — 화풍·색 일관
function tintedCanvas(im,tint){const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const g=c.getContext('2d');g.drawImage(im,0,0);const id=g.getImageData(0,0,c.width,c.height),d=id.data;
 for(let i=0;i<d.length;i+=4){const l=(d[i]*.3+d[i+1]*.59+d[i+2]*.11)/255,k=Math.pow(l,1.1)*1.05;d[i]=Math.min(255,k*255*tint[0]);d[i+1]=Math.min(255,k*255*tint[1]);d[i+2]=Math.min(255,k*255*tint[2]);}g.putImageData(id,0,0);return c;}
function organicDecor(T,r,F,cfg,ims,rm){const rnd=rng(cfg.seed^0x0207),g=new T.Group();let np=0,nu=0;
 const avoid=[...(F.doors||[]).map(d=>[d[0],d[1],Math.max(3,(d[2]||3.5)-.5)]),...(rm?.props||[]).filter(q=>Number.isFinite(q.x)).map(q=>[q.x,q.y,1.4+(Number(q.radius)||0)])];
 const clear=(x,y)=>!avoid.some(a=>Math.hypot(a[0]-x,a[1]-y)<a[2]);
 for(const [name,where,sc,rate,bright=1] of cfg.patches||[]){const im=ims['org:'+name];if(!im)continue;const box=bboxOf(im),t=new T.Texture(im);t.colorSpace=T.SRGBColorSpace;t.needsUpdate=true;r.spatialResources.add(t);
  const m=new T.MeshBasicMaterial({map:t,transparent:true,depthWrite:false,toneMapped:false,color:new T.Color(cfg.tint[0]*.92*bright,cfg.tint[1]*.92*bright,cfg.tint[2]*.92*bright),polygonOffset:true,polygonOffsetFactor:-4});r.spatialResources.add(m);if(r.sightState24)A.attachSight24?.(m,r.sightState24);
  const pos=[],uv=[],idx=[];let k=0;const want=Math.max(1,Math.round(F.W*F.H*rate)),placed=[];
  for(let t2=0;t2<want*40&&k<want;t2++){const x=rnd()*F.W,y=rnd()*F.H,fv=at(F,F.f,x,y);if(where==='base'?(fv<.25||fv>1.1):fv<1.3)continue;if(!clear(x,y)||placed.some(p=>Math.hypot(p[0]-x,p[1]-y)<3.2))continue;placed.push([x,y]);
   const q=isoQuad(x,y,box,sc*(.85+rnd()*.3),.013+np*1e-5);for(const v of q)pos.push(...v);uv.push(box.x0/box.w,1-box.y0/box.h,box.x1/box.w,1-box.y0/box.h,box.x1/box.w,1-box.y1/box.h,box.x0/box.w,1-box.y1/box.h);
   const b=k*4;idx.push(b,b+2,b+1,b,b+3,b+2);k++;np++;}
  if(!k)continue;const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeBoundingSphere();r.spatialResources.add(geo);
  const mesh=new T.Mesh(geo,m);mesh.layers.set(2);mesh.renderOrder=-17;mesh.userData.r204=true;mesh.name='r207-patch:'+name;g.add(mesh);}
 // 세운 그림(암벽 조각·낮은 돌 경계): 뒤쪽 높은 대지 가장자리만(카메라 쪽 낮은 대지·바닥엔 두지 않아 영웅·길을 가리지 않음). 바닥 기준점 = 그림 아래 끝 가운데.
 const ups=(cfg.uprights||[]).map(([name,sc])=>{const im=ims['org:'+name];if(!im)return null;const box=bboxOf(im),src=/garden/.test(name)?im:tintedCanvas(im,cfg.tint),t=new (src instanceof HTMLCanvasElement?T.CanvasTexture:T.Texture)(src);
  t.colorSpace=T.SRGBColorSpace;t.needsUpdate=true;r.spatialResources.add(t);const m=new T.SpriteMaterial({map:t,alphaTest:.4,depthWrite:true,toneMapped:false});r.spatialResources.add(m);return{m,box,sc};}).filter(Boolean);
 if(ups.length){const want=Math.round(F.W*F.H*(cfg.uprightRate||1/100)),placed=[];
  const [eLo,eHi]=cfg.uprightEdge||[-1.4,-.35];for(let t2=0;t2<want*40&&nu<want;t2++){const x=rnd()*F.W,y=rnd()*F.H,fv=at(F,F.f,x,y);if(fv>eHi||fv<eLo)continue;const h=topHeight(F,cfg,x,y);if(h<1.0)continue;if(!clear(x,y)||placed.some(p=>Math.hypot(p[0]-x,p[1]-y)<2.6))continue;placed.push([x,y]);
   const u=ups[Math.floor(rnd()*ups.length)],sp=new T.Sprite(u.m),wpx=u.box.w*u.sc,hpx=u.box.h*u.sc,ppu=ISO_T*Math.SQRT2;// 화면 px → 월드 크기(정사영: 화면 1px ≈ 1/(34·√2) 단위)
   sp.scale.set(wpx/ppu,hpx/ppu*1.15,1);sp.center.set(u.box.cx/u.box.w,1-(u.box.y1-6)/u.box.h);sp.position.set(x,h-.05,y);sp.layers.set(2);sp.renderOrder=-26;sp.userData.r204=true;g.add(sp);nu++;}}
 stats.organicPatches=np;stats.organicUprights=nu;return(np||nu)?g:null;}

// R212 풀 덤불(r138 weed): 절벽 밑 바닥(f .2~1.0) 가장자리에 세운 그림. 지역 색으로 살짝 누름. 문·소품 둘레는 비움.
function tuftSprites(T,r,F,cfg,ims,rm){const im=ims.tuft;if(!im||!cfg.tufts)return null;const [,sc,rate]=cfg.tufts,rnd=rng(cfg.seed^0x7af7),g=new T.Group();
 const box=bboxOf(im),t=new T.Texture(im);t.colorSpace=T.SRGBColorSpace;t.needsUpdate=true;r.spatialResources.add(t);
 const mats=[.85,1,1.12].map(k=>{const c=i=>Math.min(1.2,(.45+.55*cfg.tint[i])*k);const m=new T.SpriteMaterial({map:t,alphaTest:.35,depthWrite:true,toneMapped:false,color:new T.Color(c(0),c(1),c(2)*.95)});r.spatialResources.add(m);return m;});
 const avoid=[...(F.doors||[]).map(d=>[d[0],d[1],Math.max(3,(d[2]||3.5)-.5)]),...(rm?.props||[]).filter(q=>Number.isFinite(q.x)).map(q=>[q.x,q.y,1.2+(Number(q.radius)||0)])];
 const want=Math.round(F.W*F.H*rate),placed=[],ppu=ISO_T*Math.SQRT2;let n=0;
 for(let t2=0;t2<want*40&&n<want;t2++){const x=rnd()*F.W,y=rnd()*F.H,fv=at(F,F.f,x,y);const top=n%3===2;/* 셋에 하나는 둔덕 윗면(이끼·풀이 자란 대지) */
  if(top?(fv>-.9||fv<-3):(fv<.2||fv>1.0))continue;const hy=top?topHeight(F,cfg,x,y):.02;if(top&&hy<.6)continue;if(avoid.some(a=>Math.hypot(a[0]-x,a[1]-y)<a[2])||placed.some(p=>Math.hypot(p[0]-x,p[1]-y)<1.1))continue;placed.push([x,y]);
  const k=sc*(.7+rnd()*.6),sp=new T.Sprite(mats[Math.floor(rnd()*mats.length)]);sp.scale.set(box.w*k/ppu*(rnd()<.5?-1:1),box.h*k/ppu*1.1,1);sp.center.set(box.cx/box.w,1-(box.y1-4)/box.h);sp.position.set(x,hy,y);sp.layers.set(2);sp.renderOrder=-25;sp.userData.r204=true;g.add(sp);n++;}
 stats.tufts=n;return n?g:null;}

// ---- 장면 연결 ----------------------------------------------------------------------------------
const FLOOR_CMD=/^r9[02]:floor:/;
const HIDE=/wall|partition|masonry|roof-caps|cap-rims|cap-trim|contact-skirt|nonwalkable|-edge|decor|halo|annex-ground|jamb|threshold|door-contact|door-apertures/i;
const roomOf=frame=>typeof room!=='undefined'&&room?.exploration===frame?.exploration?room:null;
function eligible(r,frame){const rm=roomOf(frame);return !!(rm&&roomOn(rm)&&frame?.layer==='STORY'&&r.spatialBuilt);}
function build(r,frame){const t0=performance.now(),T=r.T,cfg=ZONES[frame.zone],ex=frame.exploration;SEED=cfg.seed;
 const gen=r.sceneGeneration;r.__r204={gen,pending:true,zone:frame.zone};
 const TX={...TEX,...(cfg.tex||{})},want=cfg.decorOnly?{crack:loadImg(TEX.crack[0]),bones:loadImg(TEX.bones[0]),root:loadImg(TEX.root[0])}/* R216: 디테일 전용은 장식판에 쓰는 그림만 */:Object.fromEntries(Object.entries(TX).map(([k,[p]])=>[k,loadImg(p)]));
 for(const [n] of [...(cfg.patches||[]),...(cfg.uprights||[])])want['org:'+n]=loadImg('assets/r207/organic/'+n+'.png');
 want.chain=loadImg('assets/r138/props/chain.webp').catch(()=>null);want.ripple=loadImg('assets/r138/props/ripple.webp').catch(()=>null);/* R212 */
 if(cfg.tufts)want.tuft=loadImg(cfg.tufts[0]).catch(()=>null);
 if(cfg.trees)for(let i=0;i<12;i++)want['tree'+i]=loadImg('assets/r99/outdoor/tree-'+cfg.trees+'-'+String(i).padStart(2,'0')+'.webp');
 Promise.all(Object.values(want)).then(list=>{if(r.disposed||r.sceneGeneration!==gen)return;const ims={};Object.keys(want).forEach((k,i)=>ims[k]=list[i]);
  const F=fieldFor(roomOf(frame),true);if(!F)throw Error('no field');
  // R216(Codex #136): 디테일 전용은 바닥 굽기(전체 맵 렌더 타깃)·지형 재질을 만들지 않고 장식 재질만 만든다
  if(cfg.decorOnly){const dm=new T.MeshBasicMaterial({map:decalAtlas(T,r,ims,cfg),transparent:true,depthWrite:false,toneMapped:false,color:new T.Color(cfg.tint[0]*.82,cfg.tint[1]*.82,cfg.tint[2]*.82),polygonOffset:true,polygonOffsetFactor:-2});
   r.spatialResources.add(dm);if(r.sightState24&&A.attachSight24)A.attachSight24(dm,r.sightState24);const group=new T.Group();group.name='r204-cave';const geo=decalMesh(T,F,cfg),mesh=new T.Mesh(geo,dm);
   mesh.name='r215-decals';mesh.layers.set(2);mesh.renderOrder=-19;mesh.userData.presentationOnly=true;mesh.userData.r204=true;r.spatialResources.add(geo);group.add(mesh);
   if(prefs.skeleton===true){const sg=skeletonMesh(T,ex,cfg);if(sg){let tex=null;r.spatialRoot.traverse(o=>{if(!tex&&/masonry-boundary-bevel-and-fascia/.test(o.name||'')&&o.material?.map)tex=o.material.map;});
     let map=null;if(tex){map=tex.clone();map.wrapS=map.wrapT=T.RepeatWrapping;map.needsUpdate=true;r.spatialResources.add(map);}
     const U=r.__r204U||(r.__r204U={r204Hero:{value:new T.Vector4(0,0,0,0)},r204Aspect:{value:1}});
     const sm=new T.MeshBasicMaterial({color:0xffffff,vertexColors:true,map,toneMapped:false});sm.onBeforeCompile=sh=>cutaway(sh,U);sm.customProgramCacheKey=()=>'r218-skeleton'+(map?'-map':'');
     r.spatialResources.add(sm);if(r.sightState24&&A.attachSight24)A.attachSight24(sm,r.sightState24);const sk=new T.Mesh(sg,sm);sk.name='r218-skeleton';sk.layers.set(2);sk.renderOrder=-26;sk.userData.presentationOnly=true;sk.userData.r204=true;r.spatialResources.add(sg);group.add(sk);}}
   if(prefs.unify!==false&&cfg.floorLift>1){let k=0;r.spatialRoot.traverse(o=>{if(/annex-ground/.test(o.name||'')&&o.material?.color&&!o.material.userData?.r218Lift){const c=o.material.color;c.setRGB(c.r*cfg.floorLift,c.g*cfg.floorLift,c.b*cfg.floorLift);/* 1을 넘겨도 된다(MeshBasic·톤매핑 없음 → 그림 자체가 밝아짐) */o.material.userData.r218Lift=true;k++;}});stats.floorLifted=k;}
   dimRoofs(r);interiorShell(r);interiorProps(roomOf(frame),cfg);
   r.spatialRoot.add(group);
   r.__r204={gen,pending:false,zone:frame.zone,group,F,sightState:r.sightState24,decorOnly:true};stats.builds++;stats.buildMs=Math.round(performance.now()-t0);return;}
  const tx={field:fieldTex(T,r,F),floorA:tileTex(T,r,ims.floorA,0),floorB:tileTex(T,r,ims.floorB,0),rock:tileTex(T,r,ims.rock,TX.rock[1]),face:tileTex(T,r,ims.face,TX.face[1])};
  const U=r.__r204U||(r.__r204U={r204Hero:{value:new T.Vector4(0,0,0,0)},r204Aspect:{value:1}});
  const mats={ground:bakeGround(T,r,F,groundMaterial(T,r,F,tx,cfg,U),tx.floorA,cfg),top:topMaterial(T,r,F,tx,cfg,U),face:faceMaterial(T,r,tx,cfg,true),pillar:faceMaterial(T,r,tx,cfg),
   decal:new T.MeshBasicMaterial({map:decalAtlas(T,r,ims,cfg),transparent:true,depthWrite:false,toneMapped:false,color:new T.Color(cfg.tint[0]*.82,cfg.tint[1]*.82,cfg.tint[2]*.82),polygonOffset:true,polygonOffsetFactor:-2})};
  for(const k of ['top','face','pillar']){const m=mats[k],before=m.onBeforeCompile;m.onBeforeCompile=function(sh,re){before.call(this,sh,re);cutaway(sh,U);};const key=m.customProgramCacheKey;m.customProgramCacheKey=()=>key()+'|cut';}
  for(const m of Object.values(mats)){r.spatialResources.add(m);if(r.sightState24&&A.attachSight24)A.attachSight24(m,r.sightState24);}
  const group=new T.Group();group.name='r204-cave';
  const add=(geo,mat,name,order)=>{const mesh=new T.Mesh(geo,mat);mesh.name=name;mesh.layers.set(2);mesh.renderOrder=order;mesh.userData.presentationOnly=true;mesh.userData.r204=true;mesh.frustumCulled=true;r.spatialResources.add(geo);group.add(mesh);return mesh;};
  // 앞에서 뒤로 그린다: 대지·절벽·기둥이 먼저 깊이를 채우면 그 뒤 바닥 조각은 깊이 검사에서 일찍 버려진다(덧그리기 감소)
  add(faceMesh(T,F,cfg),mats.face,'r204-cliff-faces',-30);if(cfg.pillars!==false||cfg.boulders)add(pillarMesh(T,F,cfg),mats.pillar,'r204-stalagmites',-29);add(topMesh(T,F,cfg),mats.top,'r204-plateau',-28);
  add(groundMesh(T,F),mats.ground,'r204-ground',-20);add(decalMesh(T,F,cfg),mats.decal,'r204-decals',-19);
  // 조형물 발밑 그늘(사용자 "조형물도 자연스럽게"): 바닥에 붙은 부드러운 어두운 타원 — 소품이 바닥에 놓여 있게 보이도록
  {const rm=roomOf(frame),pg=propShadowMesh(T,F,rm);if(pg){const m=new T.MeshBasicMaterial({map:blobTex(T,r),transparent:true,depthWrite:false,toneMapped:false,color:0x000000,opacity:.62,polygonOffset:true,polygonOffsetFactor:-3});r.spatialResources.add(m);if(r.sightState24)A.attachSight24?.(m,r.sightState24);add(pg,m,'r204-prop-shadows',-18);}}
  if(cfg.trees){const tg=treeSprites(T,r,F,cfg,ims);if(tg){tg.name='r204-trees';group.add(tg);}}
  if(cfg.tufts){const tg=tuftSprites(T,r,F,cfg,ims,roomOf(frame));if(tg){tg.name='r212-tufts';group.add(tg);}}
  if(cfg.patches||cfg.uprights){const og=organicDecor(T,r,F,cfg,ims,roomOf(frame));if(og){og.name='r207-organic';group.add(og);}}
  r.spatialRoot.add(group);r.__r204={gen,pending:false,zone:frame.zone,group,F,sightState:r.sightState24};stats.builds++;stats.buildMs=Math.round(performance.now()-t0);
 }).catch(e=>{fail(e);if(r.__r204?.gen===gen)r.__r204.failed=true;});}
// R220 실내 일관성(사용자 2026-11-02 "보고바탕진행" — R220 측정: 실내 맵 바깥이 물·절벽 같은 야외 그림, 길거리 소품, 방마다 다른 밝기):
//  ① 실내 지역에서는 야외용 바깥 덮개(r100-hedge-top: 이끼·절벽 그림)와 맵 밖 바닥판(r98-annex-ground-open: 물·절벽 그림)을 숨긴다 —
//     바깥은 병원(ep1a08~)처럼 어두운 바탕이 되어 '건물 안'으로 읽힌다. 원래 레이어는 기억했다가 실내를 벗어나면 되돌린다(restoreNative).
const SHELL=/^(r100-hedge-top|r98-annex-ground-open)$/;
function interiorShell(r){if(prefs.unify===false)return 0;let k=0;r.spatialRoot.traverse(o=>{if(SHELL.test(o.name||'')&&o.userData.r204Mask==null){o.userData.r204Mask=o.layers.mask;o.layers.mask=0;k++;}});if(k){r.__r204Hidden=true;stats.shellHidden=(stats.shellHidden||0)+k;}return k;}
//  ② 실내에 깔린 지역 공통 소품 중 길거리·야외 그림(가로등·시장 좌판·이끼 바위·죽은 나무·부서진 대문)은 뺀다. 주택(home)·도심(urban, 살인사건 집·아파트) 계열은 지붕 환풍구(r80-058)도 뺀다.
//     이름 붙은 서사 소품(q.name)·상자·상호작용 물건은 그대로 둔다.
const OUTDOOR_PROP=/street_lamp|ruined_market|moss_boulder|dead_tree|broken_gate|\/tree-|boulder/i,HOME_EXTRA=/world-r80\/r80-058\./;
function interiorProps(rm,cfg){if(prefs.unify===false||!rm||!Array.isArray(rm.props)||rm.r220Props)return 0;const before=rm.props.length;
 rm.props=rm.props.filter(q=>{if(!q||q.name||q.interactive||q.altar||q.chest||/chest|altar|portal|door|note|memory/i.test(String(q.kind||'')+String(q.id||'')))return true;const pth=String(q.path||'');
  if(OUTDOOR_PROP.test(pth))return false;if((cfg.kind==='home'||cfg.kind==='urban')&&HOME_EXTRA.test(pth))return false;return true;});
 rm.r220Props=true;const k=before-rm.props.length;stats.propsRemoved=(stats.propsRemoved||0)+k;return k;}
// R219: 실내에 남은 지붕 덮개(벽 위 평판)는 어둡게 — 벽 덩어리로 읽히게(사용자 "벽지붕 같은 공간 이질감"). 엔진이 덮개를 나중에 다시 만들 수 있어 실내 프레임에서 가끔 다시 본다.
function dimRoofs(r){if(prefs.unify===false)return 0;let k=0;r.spatialRoot.traverse(o=>{if(!/roof/i.test(o.name||''))return;for(const m of Array.isArray(o.material)?o.material:[o.material]){if(m?.color&&!m.userData?.r219Dim){m.color.multiplyScalar(.45);m.userData.r219Dim=true;k++;}}});if(k)stats.roofDimmed=(stats.roofDimmed||0)+k;return k;}
let dimTick=0;
// 엔진이 매 프레임 visible 을 다시 켜는 메시가 있어(벽 가림·R188) 레이어를 비워 숨긴다(원래 레이어는 기억했다가 되돌린다).
function hideNative(r){let n=0;r.spatialRoot.traverse(o=>{if(o===r.spatialRoot||o.userData?.r204||o.name==='r204-cave'||o.parent?.name==='r204-cave')return;
 if(HIDE.test(o.name||'')&&o.userData.r204Mask==null){o.userData.r204Mask=o.layers.mask;o.layers.mask=0;n++;}});stats.hidden+=n;r.__r204Hidden=true;}
function restoreNative(r){r.spatialRoot.traverse(o=>{if(o.userData?.r204Mask!=null){o.layers.mask=o.userData.r204Mask;delete o.userData.r204Mask;}});r.__r204Hidden=false;}
function heroUniform(r,frame){const U=r.__r204U;if(!U)return;const h=frame.entities?.find(e=>e.hero);if(!h){U.r204Hero.value.w=0;return;}
 const v=new r.T.Vector3(h.x,.9,h.y).project(r.camera);U.r204Hero.value.set(v.x,v.y,v.z,1);const el=r.renderer.domElement;U.r204Aspect.value=el.width/Math.max(1,el.height);}
// R213(Codex #134): 풀 덤불·나무는 SpriteMaterial 이라 R24 시야 마스크(attachSight24 은 메시 재질만)를 받지 않아 시야 밖에서도 보였다.
//  → 시야가 켜져 있으면 12장면마다 각 그림의 바닥 점이 보이는지(SIGHT24.pointVisible) 물어 안 보이면 레이어를 끈다(엔진이 visible 을 되살리므로 layers.mask 로).
let sightTick=0;function spriteSight(st){try{const S=window.__STORYWORLD_SIGHT24__,on=!!S?.enabled;if(!st?.group)return;if(on&&(++sightTick%12))return;
 for(const g of st.group.children){if(g.name!=='r212-tufts'&&g.name!=='r204-trees')continue;for(const sp of g.children){const want=!on||S.pointVisible(sp.position.x,sp.position.z)?4:0;if(sp.layers.mask!==want)sp.layers.mask=want;}}}catch(e){fail(e);}}
function before(r,frame){try{
 const st=r.__r204;if(!eligible(r,frame)){if(st?.group)st.group.visible=false;if(r.__r204Hidden)restoreNative(r);return;}/* R211: 그룹이 없어도(빌드 실패·대기 중 지역 이탈) 가린 원래 지형을 되돌린다 — Codex #132 */
 // 새 지형이 준비되기 전에는 원래(사각) 지형·2D 바닥 그림을 보이지 않는다 — 맵에 들어설 때 옛 지형이 잠깐 보였다 통째로 바뀌는 '팝'·끊김 방지(사용자 "맵 변경 시 이상한 곳 보여주고 화면이 흔들림")
 const deco=!!ZONES[frame.zone]?.decorOnly;/* R215: 디테일 전용 — 원래 지형을 가리지 않는다 */
 const veil=()=>{if(deco)return;hideNative(r);if(Array.isArray(frame.commands))frame.commands=frame.commands.filter(c=>c?.owner?.kind!=='ground');stats.veiled=(stats.veiled||0)+1;};
 if(!st||st.gen!==r.sceneGeneration||st.zone!==frame.zone){build(r,frame);veil();return;}
 if(st.failed){if(r.__r204Hidden)restoreNative(r);return;}/* R211: 그림을 못 읽어 빌드가 실패하면 원래 지형으로 */if(st.pending){veil();return;}st.group.visible=true;
 if(r.sightState24&&st.sightState!==r.sightState24){for(const o of st.group.children)A.attachSight24?.(o.material,r.sightState24);st.sightState=r.sightState24;}
 if(deco){heroUniform(r,frame);if(!(++dimTick%30)){dimRoofs(r);interiorShell(r);}stats.frames++;return;}
 hideNative(r);heroUniform(r,frame);spriteSight(st);stats.frames++;
 // 사각 방에 맞춰 그린 옛 바닥 무늬(R90·R92 floor 명령)는 새 바닥과 어긋나므로 이 지역에서만 뺀다
 if(Array.isArray(frame.commands)){const n0=frame.commands.length;frame.commands=frame.commands.filter(c=>!FLOOR_CMD.test(String(c?.owner?.id||'')));stats.floorCmdsDropped=n0-frame.commands.length;}}catch(e){fail(e);}}
// perf-r97 이 인스턴스에 render 를 복사해 두므로 프로토타입과 인스턴스를 함께 감싼다.
const wrapFn=fn=>{if(fn.__r204)return fn;const w=function(frame){before(this,frame);return fn.apply(this,arguments);};w.__r204=true;return w;};
C.render=wrapFn(C.render);
function wrapInst(){try{const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;if(r&&Object.prototype.hasOwnProperty.call(r,'render')&&!r.render.__r204)r.render=wrapFn(r.render);}catch(e){fail(e);}}
setInterval(wrapInst,500);wrapInst();
function set(p){if(typeof p?.on==='boolean')prefs.on=p.on;if(typeof p?.widen==='boolean')prefs.widen=p.widen;if(typeof p?.skeleton==='boolean')prefs.skeleton=p.skeleton;if(typeof p?.inflate==='boolean')prefs.inflate=p.inflate;if(typeof p?.unify==='boolean')prefs.unify=p.unify;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
window.__STORYWORLD_CAVE_R204__=Object.freeze({revision:REV,set,skeletonPoints,inflate,interiorProps,zones:Object.keys(ZONES),field,topHeight:(F,z,x,y)=>topHeight(F,ZONES[z],x,y),at,
 inspect:()=>{const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three,st=r?.__r204,F=st?.F;return{revision:REV,prefs:{...prefs},active:!!st?.group?.visible,zone:st?.zone||null,field:F?{ms:F.ms,bulgedCells:F.bulgedCells,protect:F.protect,size:[F.W,F.H]}:null,stats:{...stats},lastError};}});
})();
