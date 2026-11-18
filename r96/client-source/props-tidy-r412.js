// R412 조형물 정돈 — 모든 맵(사용자 2026-11-08 "조형물들 벽에 들어가지 않도록, 그리고 조형물 각도에 맞게 배치, 전등 등이 너무 남발되어
//  부산스럽지 않도록, 그리고 그림자는 조형물 앞이 아닌 뒷쪽에 생기도록 - 모든 맵에 적용").
//  원인(헤드리스 전수 측정, 스크래치 r412 census — 227개 지역):
//   ① 3D 화면(phase1 worldPoint)에서 조형물 그림은 발(x,y)을 지나 카메라를 향한 판으로 선다. 판은 위로 갈수록 뒤(-x·-y)로 30° 눕고 옆으로 넓다.
//      벽(높이 2.25~2.75)에 0.5칸쯤 붙인 키 큰 조형물은 윗부분·옆부분이 벽 덩어리 속으로 들어가 벽에 잘려 보였다(2D 판정만 보던 R303·R406 이 놓친 것).
//      → 그림의 불투명 픽셀을 그 판 위 3D 점으로 옮겨 벽 칸 안(높이 < 벽 높이)에 드는 비율을 재고, 3% 넘으면 벽 반대쪽으로 가장 조금 옮긴다.
//      벽 덩어리는 실내면 바닥 밖 전부, 실외면 벽 상자만이다(실외 바닥 밖은 탁 트인 땅·숲 가장자리 — 그곳 나무는 벽에 든 것이 아니다).
//   ② R406 이 실내 화로를 전구 등으로 바꾸면서 R74·R80·R92 등불이 한 방에 6~8개씩 남아 바닥을 메웠다.
//      → 등불만 솎는다: 벽 가까이·가구 곁에 선 것을 먼저 남기고, 남긴 등불끼리 실내 6.5칸·실외 8칸 띄우며 바닥 넓이에 맞춘 개수까지만.
//   ③ 벽에 기대는 가구(서랍장·캐비닛·책장·조리대 등)는 뒷벽 방향에 맞게 좌우를 고른다(R303·R406 과 같은 규칙: 그림 정면 +y → -y 벽 그대로, -x 벽 뒤집기).
//   ④ 그림자 방향은 R329 에서 고쳤다(빛이 조형물 뒤에 있으면 앞으로 눕던 갈래 제거).
//  손대지 않는 것: 충돌 소품(solid)·상호작용·문·벽 장식·NPC·단서·사몽 기능·목표·제단·상자·서사 소품. 충돌·길찾기·몹·저장·진행·서사는 그대로.
//  옮길 때는 R111 과 같은 숨은 그리기 자리(r111To)만 바꾼다 — 소품의 x·y(배치 자료·저장·비교)는 그대로다(R111 이 꺼져 있으면 x·y).
//  R111 이 이미 벽에서 2D 로 띄워 둔 소품은 그 자리(r111To)에서 그려지므로 그 자리를 기준으로 잰다.
//  1.8칸 안에 벽 밖 자리가 없고 15% 넘게 벽 속인 장식은 R303 과 같은 숨김 표시(r303Hide='r412-wall')로 숨긴다.
//  옮긴 것은 r412Moved, 뺀 등불은 room.r412Lamps 에 남긴다. 끄기: localStorage['storyworld.r412.props']='{"on":false}' (부분: unwall/lamps/face)
//  잴 때는 손전등 시야(R24, 모바일 기본)를 잠깐 끈다(시야 밖 조형물도 그려 봐야 잰다). 늦게 붙는 R224 가구는 R406 이 먼저 놓은 뒤에 재고 맞춘다.
//  자기 붓으로 x·y 에 그리는 R299·R317 지역 소품과 R138 벽 걸이는 옮기지도 돌리지도 않는다(r111To 를 쓰지 않는다).
//  R412-9(7분야 심사 반영): ① 정면이 +x 인 R80 그림(소파 r80-024·쓰러진 기둥 r80-021)은 -y 벽에서 뒤집는다(벽과 어긋나던 소파).
//   ② 방을 만들 때(그리기 전) 방향·등불을 정하고, 벽 가까이 아직 안 잰 조형물은 방에 들어온 뒤 2.5초까지 감췄다가 잰 자리에 0.2초 동안 나타나게,
//      이미 보인 조형물이 옮겨지거나 뒤집히면 0.2초 동안 다시 나타나게 한다(입장 뒤 튀던 것). ③ 옮길 자리 앞(화면 아래)에 선 이웃이 그림의 1/4 넘게 덮으면 버린다.
//   ④ 야외 불빛 지역은 불꽃 등불(촛대·화로·횃불)을 하나는 남기고, 다른 조형물 곁 등불 감점을 줄였다. ⑤ 잴 때 유휴 시간이 2ms 안 남으면 미루고, 세 번째 찾기는 성기게.
//  벽 높이: R115(사몽 밖 지역 벽 높이)가 들어온 뒤 첫 게임 틱에 같은 벽 객체 높이를 1.3~1.5 → 2.85~3.31 로 올린다(측정: dist03 5초, ep1b03 11초 뒤).
//   그 전에 재면 낮은 벽 기준이라 윗부분이 벽에 든 채로 끝났다(dist03 나무 6~14%) → R115 가 이 방 벽을 손본 뒤에 재고(방문마다 12초까지만 기다림),
//   그 뒤에도 벽 개수·높이 합(서명)이 바뀌면 그 방 조형물을 다시 잰다. 서사 소품: R117 장면 등불은 솎지 않고, R406 보스 소품은 숨기지 않는다.
(()=>{'use strict';
if(window.__STORYWORLD_PROPS_TIDY_R412__)return;
const REV='R412-props-tidy-11',KEY='storyworld.r412.props';
const prefs={on:true,unwall:true,lamps:true,face:true};
try{const s=JSON.parse(localStorage.getItem(KEY)||'null');for(const k of Object.keys(prefs))if(typeof s?.[k]==='boolean')prefs[k]=s[k];}catch(_){}
const stats={rooms:0,measured:0,embedded:0,unwalled:0,stuck:0,hidden:0,unseen:0,lampsSeen:0,lampsRemoved:0,faced:0,remeasured:0,refooted:0,wallWaits:0,maskBaked:0,maskReadbacks:0,maskProbes:0,maskProfile:'pending',errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.stack||e).slice(0,300);};
let ver=0;// 옮기거나 등불을 뺄 때마다 1 늘린다 — R300 빛 목록 캐시가 이 수로 새로 읽는다
const now=()=>typeof performance!=='undefined'&&performance.now?performance.now():Date.now();
const h32=s=>{let h=2166136261;s=String(s);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;};
const SA=()=>window.StoryPhase1;
const blocked=(L,x,y,r)=>{const a=SA();return typeof a?.explorationBlocked==='function'?!!a.explorationBlocked(L,x,y,r):true;};
const R303=()=>window.__STORYWORLD_PROPS_FIT_R303__,R406=()=>window.__STORYWORLD_PROPS_PLACE_R406__;
// R111(⑤ 조형물 벽 간격)은 소품을 x·y 가 아니라 숨은 r111To 자리에 그린다 → 보이는 발 자리는 그쪽이다.
//  그런데 R303(벽 캐비닛)·R140(장식 절반) 좌우 뒤집기는 그 바깥에서 x·y 의 화면 세로선을 축으로 거울처럼 뒤집는다 →
//  뒤집힌 소품은 r111To 쪽 밀어 둔 거리(dx,dy)가 (dy,dx)로 바뀐 자리에 그려진다(벽에서 띄운 것이 벽을 따라 옆으로, 때로는 벽 속으로).
function r111On(){try{const P=window.__STORYWORLD_PLAY_R111__;return !!P&&P.prefs?.().props!==false;}catch(_){return false;}}
// 거울 뒤집기 스위치(R140 장식 절반·R303 벽 캐비닛)는 조형물마다 묻지 않고 0.25초에 한 번 읽는다(R329 그림자가 프레임마다 발 자리를 묻는다). apply 는 새로 읽는다.
let FC=null,FCt=-1e9;
function flipCtx(){const t=now();if(FC&&t-FCt<250)return FC;FCt=t;let V=null,vOn=false,r3On=true;
 try{V=window.__STORYWORLD_PROPS_VARIETY_R140__||null;vOn=!!V&&V.inspect?.().prefs?.flip!==false;}catch(_){vOn=false;}try{r3On=R303()?.inspect?.().on!==false;}catch(_){}
 return FC={V,vOn,r3On};}
const fresh=()=>{FCt=-1e9;};
function r140Flips(p,F=flipCtx()){try{return !!(F.vOn&&F.V?.free?.(p)&&F.V?.flipOf?.(p));}catch(_){return false;}}
function mirrored(p,F=flipCtx()){let f=r140Flips(p,F);if(p?.r303Flip&&F.r3On)f=!f;return f;}
// 자기 붓으로 x·y 에 그리는 소품(R299·R317 지역 소품, R138 벽 걸이 창)은 R111 바깥에서 그려져 r111To 를 쓰지 않는다
const OWN_PAINT=p=>!!(p&&(p.r299||p.r317||p.r138Lift));
// 그리는 자리(거울 전 — 게임 그리기 함수가 받는 자리): R111 이 켜져 있고 r111To 가 있으면 그 자리, 아니면 x·y
function spotOf(p,on=r111On()){const t=p&&p.r111To;return on&&t&&Number.isFinite(t.x+t.y)&&!OWN_PAINT(p)?t:p;}
// 보이는 발 자리: 그리는 자리를 x·y 의 화면 세로선에 비춘 곳(뒤집힌 소품만)
function footOf(p,on=r111On(),F=flipCtx()){const t=spotOf(p,on);if(t===p)return p;if(!mirrored(p,F))return t;return{x:p.x+(t.y-p.y),y:p.y+(t.x-p.x)};}
// 보이는 발 자리를 (x,y)로: R111 이 켜져 있으면 숨은 r111To 만(뒤집힌 소품은 거울 반대로), 아니면 x·y
// 그리기 상태(감춤·보임·나타나기)는 조형물 객체가 아니라 WeakMap 에 둔다(R412-10: 그리기가 조형물 JSON 을 바꾸면 R86 문 검사가 깨진다)
const DS=new WeakMap();function ds(p){let d=DS.get(p);if(!d)DS.set(p,d={held:0,drawn:0,fadeT:0,eligV:0,elig:false});return d;}
function changed(p){if(p&&DS.get(p)?.drawn===visit)ds(p).fadeT=now();}
function setFoot(p,x,y,on=r111On(),F=flipCtx()){changed(p);/* 이미 보인 것은 새 자리에 0.2초 동안 나타나게 */ver++;if(on&&!OWN_PAINT(p)){let dx=x-p.x,dy=y-p.y;if(mirrored(p,F))[dx,dy]=[dy,dx];Object.defineProperty(p,'r111To',{value:{x:+(p.x+dx).toFixed(3),y:+(p.y+dy).toFixed(3)},configurable:true});return 'r111To';}p.x=+x.toFixed(3);p.y=+y.toFixed(3);return 'xy';}

// ---- 분류 ------------------------------------------------------------------------------------------
const artOf=p=>String(p?.r81NativeSkin?.path||p?.path||p?.r74Prop||'');
// 벽 장식(벽에 붙는 게 정상) — R329 WALLISH 와 같은 낱말 경계 규칙
const WALLISH=/(?:^|[^a-z])(?:walls?|doors?|gates?|banners?|torch(?:es)?|reliefs?|frames?|windows?|paintings?|portals?|signs?|sconces?|curtains?|posters?|clocks?|mirrors?|vents?|rugs?|carpets?|decals?|stains?|puddles?|blood(?=-)|cracks?)(?=[^a-z]|$)/i;
const LAMP=/lantern|(^|[^a-z])lamps?([^a-z]|$)|street_?light|candle|brazier|bulb|lights_[a-z]+_\d|r80-022\.webp|lamppost|lamp-post/i;
const LAMP_R74=new Set(['brazier','torch','candle','lantern']);
const NOT_LAMP=/altar|shrine|door|beast|ailment|vfx/i;
// 보스방 전용 가구(sin-room-art·mammon-bossroom: 자기 세로 판·충돌 상자로 그린다)는 그 파일 몫이라 건드리지 않는다
const OWNED=p=>!!(p.sinArtKey||p.sinArtZone||p.mammonFurniture||/^(sin-art:|sin:|mammon)/i.test(String(p.id||'')));
function untouchable(p){if(!p||typeof p!=='object'||OWNED(p)||p.solid===true||p.interactive||p.samongR103||p.r115Clue||p.r115Stmt!=null||p.r105Record||p.objective||p.terrainWall||p.wallMounted||p.r75NPC||p.r75NarrativeNPC||p.r75FortPerson||p.r74Door||p.r81WardDoor||p.name)return true;
 if(/chest|altar|portal|door|note|memory|clue|npc/i.test(String(p.kind||'')+' '+String(p.id||'')))return true;
 try{if(R303()?.locked?.(p))return true;}catch(_){}return false;}
const shown=p=>!!p&&p.visible!==false&&p.enabled!==false&&p.disabled!==true&&p.destroyed!==true&&!p.r303Hide;
const FLAME=/candle|brazier|torch|campfire|bonfire|r80-022\.webp|(^|[^a-z])fire([^a-z]|$)/i,BULBY=/bulb|electric|street_?light|lamppost|lamp-post|neon/i;
function isFlame(p){const a=artOf(p)+' '+String(p?.r74Prop||'')+' '+String(p?.r406From||'');return isLamp(p)&&FLAME.test(a)&&!BULBY.test(a);}
function isLamp(p){const a=artOf(p)+' '+String(p?.r74Prop||'')+' '+String(p?.r406From||'')+' '+String(p?.r406FromR74||'');return (LAMP_R74.has(p?.r74Prop)||LAMP_R74.has(p?.r406FromR74)||LAMP.test(a))&&!NOT_LAMP.test(a)&&!WALLISH.test(String(p?.id||'')+' '+artOf(p));}

// ---- 3D 판 모형(phase1 worldPoint) --------------------------------------------------------------------
//  화면 오른쪽 s(칸) → 월드 (+s/√2, −s/√2), 화면 위 h(칸) → 월드 (−h·√½/2, −h·√½/2) 뒤로 + 높이 h·√3/2. 1칸 = TILE·zoom·√2 화면 px.
const SQ=Math.SQRT1_2,BACK=.5*Math.SQRT1_2,RISE=Math.sqrt(3)/2,WALL_H=2.45,MW=20,MH=28;
const CV=typeof document!=='undefined'?document.createElement('canvas'):null,g=CV?.getContext?.('2d')||null;let rec=null;
if(CV){CV.width=1600;CV.height=1000;}
if(g){const od=g.drawImage.bind(g);g.drawImage=function(img,...a){if(rec)rec.push({img,a,m:g.getTransform(),f:String(g.filter||'')});return od(img,...a);};}
const MC=typeof document!=='undefined'?document.createElement('canvas'):null,mg=MC?.getContext?.('2d',{willReadFrequently:true})||null;if(MC){MC.width=MW;MC.height=MH;}
// Each bit describes the existing alpha >= 80 placement test. Max-alpha over
// the twelve tree frames is exactly the OR of their thresholded masks.
// BEGIN GENERATED R412 MASKS
// Generated by scripts/build-sw0013-prop-masks.cjs.
const bakedPropMasks={
// sha256 bfb4d191ef7862269eb54faad8dc37103dae2626f1fdcc2a51225a927c1e5577
"assets/props/v290/bone_heap.webp":[512,512,[[0,0,512,512,"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACACQAYAMAPgD4AcCfAP4H8P+A/w/4/4H/H/j/gf8f+P8A/gfgHwAcAA==","AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACQAQgMABgD4AcCfAP4H8P+A/w/4/4D/H/D/Af8P8P8A/AOgHQAYAA=="],[69.33333333333333,177.33333333333334,373.3333333333333,334.66666666666663,"AIAAAAgAgACABABEAFAGAFYA8QXQPwD8A+D/gv8f/P/B/z/8/+f/f/7/7/9////n///+////f/3/4/8/+P+A/APgDQAOAA==","AIAAAAgAgACABABEgFAGAFcAsAEQLwD8A+C/gv4f8P/B/z/8/+f/f/7/7/9//v/n///+/+f/P/3/Yf8f+P+A/ALgAAAEAA=="],[69.33333333333333,177.33333333333334,373.3333333333333,336,"AIAAAAgAgACABABEgFAGAFYA8QfQPwD8A+D/gv8f/P/B/z/8/+f/f/7/7/9////n///+////f/3/4/8/+P+A/APgDQAOAA==","AIAAAAgAgACABABEgFAGAFcAsAAQLwD8A+C/gv4f8P/B/z/8/+f/f/7/6/9//v/n///8/9f/f/z/Y/8v+P+A/ALgBQAEAA=="]]],
// sha256 b0d2f19afd5317340f4bd24ec3eb5a6c76f10040a8ef06caa4fed84829310efc
"assets/props/v290/collapsed_pillar.webp":[512,512,[[0,0,512,512,"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGAOAAAA8A+ADADwD+AfgPgP8B+x/w/wH/Hvj/gP8H+B+AfwDwAwAcAA==","AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOAAAA8A+ADADwD+APgPgP8B+h/w3wH/HvjvgP8F+B+AfwDwAwAcAA=="],[72,208,366.6666666666667,304,"AIAAADwA4AMAfgDwBwB/APwHwH8A/gfwf8D/B/x/4P/P/v/s/8////6f7/99/t/j/x/+/+H/A/8/8H8A/gPAPwD8AQAGAA==","AIAAADwAwAMAPgDgBwB/APgHwH8A/gfwf8D/B/x/4P/P/v/s/8f/+/yf7/9//t/j/x/+v+H/A/838H8A/gPAPwDwAQACAA=="],[72,208,366.6666666666667,305.3333333333333,"AIAAADwA4AMAfgDwBwB/APwH4H8A/gf4f8D/B/x/4P/P/v/8/8//+/6f7/99/v/j/x/+v+H/A/8/8H8A/gPAPwD4AQAGAA==","AIAAADwAwAMAPgDgBwB/APgHwH8A/gfwf8D/B/x/4P/P/v/8/8f/+/yf7/9//t/j/x/+v+H/A/838H8A/gPAPwDwAQACAA=="]]],
// sha256 d6e99d41bd69d9b7e71edf7e2e21fc8ea84fd7053b2525c66f3724b1d5cf4363
"assets/props/v290/corrupted_shrine.webp":[512,512,[[0,0,512,512,"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAACAHAAAAcAcAAADwDwAAAfAP4H8P8A/w/w/4D/H/j/Af8P8P8A/wfAPwAwAA==","AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAACACAAAAcAcAAABwBwAUAfAPoF8H8A/w/w/wD/D/D/Af8P4P8A/wfAPwAwAA=="],[74.66666666666667,150.66666666666666,362.6666666666667,361.33333333333337,"AAAAIAAAAgAgAAAHAPgAgA8A+ACADwD4AIAvAPgCgD/A/x/8/8P/P/7/4/9//v/n///+/+f/f/7/w/8//P8B/w+AFwAwAA==","AAIAIAAAAgAgAIAHAPgAgA8A+ACADwD4AKAvAPkCgD/A/x/8/8P/P/7/4/9//v/3///+/+f/f/z/x/8//P8B/w8ABwAwAA=="],[74.66666666666667,150.66666666666666,362.6666666666667,362.6666666666667,"AAAAIAAAAgAgAAAHAPgAgA8A+ACADwD4AKAvAPgCgL/A/x/8/8P/P/7/4/9//v/n///+/+f/f/7/w/8//P8B/w+ABwAwAA==","AAIAIAAAAgAgAIAHAPgAgA8A+ACADwD4AKAvAPkCgD/A/h/8/8P/P/7/4/9//v/n///+/+f/f/z/w/8f/P8B/w9ABwAwAA=="]]],
// sha256 84b6567166dd3682fb7be71de76955d97f9974d71889135f16adc876fd9d6935
"assets/props/v290/dead_tree.webp":[512,512,[[0,0,512,512,"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAgAKAHAH4BABcA/AGAPgD4BgAHAPgAgAcAeACADwD+AeA/AP8H8H8A/wPgHwB8AA==","AAAAAAAAAAAAAAAAAAAAAAAAIAAAAgAgACABAD4CABcAdQGAHgDwAAAHAPgAgAcAeACgDwD6AOA/AP8H8H8A/gPADwA0AA=="],[86.66666666666667,117.33333333333333,337.3333333333333,394.6666666666667,"AAAAIACAAgAyAOQDgG4E/scAeAcML6D7F0D/BPw9gA8A/APAHwD+AOAPAP4A4B+A/wP8f8D/H/7/8/8//v/B/w/0fwD+AA==","AAAAAACAAgAwAOACgGAE/McAfAMEJyDyF0D/APw9gAcEeCDAnwB8AOAHAP4AwB+A/QP8/8D/H/7/4/8P/L+B/w/0PwCcAA=="],[86.66666666666667,117.33333333333333,337.3333333333333,396,"AAAAIACAAgAyAOQDgG4E/scAeAeML6D7F0D/BPw9gC8A/APAHwD+AOAPAP4A4B+A/wP8/8D/H/7/4/8//v/B/w/wfwD+AA==","AAAAAACAAgAwAOACgGAE/scAfAMEJyDyF0D/APw9gAcAeCLAnwD+AOAHAP4AwB+A/QP8/+D/H/7/4/8f/L/B/wfwPwCcAA=="]]],
// sha256 65ab02a0ac1e68493e3d86376cfb0d569bae7029ca190690a0bc1430a8b07c11
"assets/props/v290/moss_boulders.webp":[512,512,[[0,0,512,512,"AAAAAAAAAAAAAAAAAAAAAAAAwAAADgDwAQAfAPgBgH8A/Afg/wD+D/D/gP8f+P+B/x/4/4H/D/D/AP8DwB8AQAAAAAAAAA==","AAAAAAAAAAAAAAAAAAAAAAAAQAAADgDwAQAfAPgBgH8A/AfgfwD+B+D/gP8f+P+B/x/4/4H/D/D/AP8DwB8AAAAAAAAAAA=="],[66.66666666666667,132,378.6666666666667,380,"AAwA4AEAHwD4A4A/APgDwP8A/B/g/wH/H/j/gf8f+v/j/z///+f/////7////v/v/z/8/8P/D/B/AP4DAA0AAAAAAAAAAA==","AAwA4AEAHwD4A4A/APgDwL8A/A/g/wH/H/D/gf8f+v/j/z/+/+f/////7////v/n/z/8/8P/D/A/AP4DAAAAAAAAAAAAAA=="],[66.66666666666667,132,378.6666666666667,381.3333333333333,"AAwA4AEAHwD4A4A/APgDwP8A/B/g/wH/H/j/gf8f+v/j/z///+f/////7////v/v/z/8/8P/D/B/AP4BAAQAAAAAAAAAAA==","AAwA4AEAHwD4A4A/APgDwL8A/A/g/wH/H/D/gf8f+v/j/z/+/+f/////7////v/n/z/8/8P/D/A/AP4BAAAAAAAAAAAAAA=="]]],
// sha256 c342b4d9d463e0ba41a37183923f6094c46413a4e54a35adfa0fcec854e0ac70
"assets/props/v3100/memory_archivist_statue.webp":[512,512,[[0,0,512,512,"AAAAIAAABgDgAAAPAPAAAA8A+AGAHwD4AYAfAPgBgA8A8AAADwDwAIAPAPgAgB8A+AGAHwD4AcA/APwDwD8A+AEADwAAAA==","AAAAIAAABgDgAAAPAPAAAA8A8ACADwD4AAAPAPAAAA8A8AAADwDwAAAPAPgAgB8A+AGAHwD4AYA/APwDwB8A+AEABgAAAA=="],[160,20,190.66666666666666,472,"AAcA+ACAPwD8B/B/AP8P8P+A/x/4/4H/H/j/gf8f8P8A/w/wfwD/B/h/gP8P+P/h/3/+/+f/f/7/9//////////8/wP+Bw==","AAcA8AAALwD8B/B/AP8H8P+A/x/4/4H/D/D/AP8P8P8A/w/wfwD/B/B/gP8H8P/A/3/+/8f/f/7/9////////3/8/wP8AQ=="]]],
// sha256 6beb013ae95dd282698ef8ef4eea6ea9f329d51bb58babc17666d0e5e0480dfa
"assets/r105/props/dist02-hands.webp":[512,441,[[0,0,512,441,"AAQAYAAABgB4AIAHAHgCwHcA/AfAPwD8AcAfAPwBzA/A/BCMj8P4Opw/9/vz/+///37//////////+d9fsbHbz/49AMfPw==","AAQAYAAAAgAoAIADAHgCwHcA/AfAPwD4AcAfAPwBTB/AcAGED8HwOgwv93ny/+/3/37/7//3/n7P7+f8fMbHTz748AMfDw=="],[2.6666666666666665,2.6666666666666665,506.6666666666667,438.3333333333333,"AAYAYAAABgB4AIAHAHwGwH8A/APAHwD8AcAfAPwBzA/A9BCED8P4Mpwv9/v3/+///3///////3///+f9f973bz/59ANPPw==","AAQAYAAAAgAoAIAHAHwCwHcA/AfAHwD4AcAfAPwBTB9AcAGED8PwMgwv93ny/+/3/37/7//3/n/f7+f8fcbPT7748AMPHw=="],[2.6666666666666665,2.6666666666666665,506.6666666666667,440,"AAYAYAAABgB4AIAHAHwGwH8A/APAHwD8AcAfgPwAzA/A9BCED8P4Mp4v9/v3/+///3///////3///+f9f973bz/59ANPPw==","AAQAYAAAAgAoAIAHAHwCwHcA/AfAHwD4AcAfAPwBTB9AcBGED8PwIgwv9/ny/+/3/37/7//3/n/f7+f8fMbPT7748AMfDw=="]]],
// sha256 9df6a02ab1c842c42d26203995eb8adb8b8793466fbe4bf8f9e517240408fa57
"assets/r105/props/dist02-waterweed.webp":[512,504,[[0,0,512,504,"gAAAPgCQD4D6AfgfgP8B8P8A/w/4/8D/H/j/g/8//P/H/z///8f/f/i/h/+7bH7I5g9g8AEOH8DAAxwIAAEAEAAAAAAAAA==","gAAANgCAD4D4AdgPgP8D8P8A/g74f4D/D/z/g/8//P/B/7/3/8v/f3i/xvpjKH5k4m9g8AkOD4TQAQgIAAEAJAAAAAAAAA=="],[1.3333333333333333,1.3333333333333333,509.3333333333333,500,"wAAAPgCQD8D6AfgfgP8B8P8A/w/4/8D/H/z/g/9//P/n/3///8f/f/i/j/+7PH+o5g9g+AkOH6DAAwwogAEAEAAAAAAAAA==","gAAANgCAD4D4AdgPgP8B8P8A/w74f4D/D/z/g/8//P/B/z/3/8P/f/i/xvpyKH5o4i8g8AkOD6TQAQgIgAEAJAAAAAAAAA=="]]],
// sha256 633027398115352202f2b82e4ffb27d55499b8b011f07e7ed779e8a59a041ef4
"assets/r138/props/weed.webp":[512,252,[[0,0,512,252,"AAgAgAEAMABABwB0AE4D4DQAGQuAswBwAwB/Afg/wP8D+h+g/wT7D8D/yf4//H/h/wf+/xD/D/G/EZgTADgBABAAAAAAAA==","AAgAAAEAMABABwBkAE4DoDQAGQOAswBwAwA/Abg3wP8D+gyg/wT7D8B/gf6f7P+g/wf2/xD+DfG/AZATABgBABAAAAAAAA=="],[1.3333333333333333,1.3333333333333333,509.3333333333333,249.33333333333334,"AAgAAAEAcABABwB0AE4DoDUAGQuAswBwAwB/Afg/wP8D+l+g/wT7D+D/yf4f/P/h/wf+/xD/D/G/EfwTADkBABEAAAAAAA==","AAgAAAEAMABABwBkAE4DoDQAGQuAswBwAwB/Abg3wP8D+gyg/wT7D8B/if6f7P+g/wf+/xD/D/G/AZATADgBABAAAAAAAA=="]]],
// sha256 512743d4edf643821220bb435ec6c4e1f2ae6e1cad0ee90410d1e0df1f19e0ee
"assets/r257/props/weed-opp.webp":[512,259,[[0,0,512,259,"OADAAwB8AEAHAGAAIM4A4hwgawG4EoA7B3hzgP4P+J/A/wj8H+D/B+p7oP87+v+T/3/5f8b/n/7/if+f/P9A/wdE8QAAAA==","KACAAwB8AEAHAGAAIE4A4gwgawGwEoArAyhzgPQH+J/A/QA8H+D6B+p7oP87+P+T/2/5f8D/H/7/iP+v+H9A/wcA8AAAAA=="]]],
// sha256 6be45765551477b8623efb5e0d5aaaa20ffee5f084bed53c28ba09ce97b1dafb
"assets/r99/outdoor/tree-dead-00.webp":[413,440,[[0,0,413,440,"AAAAAACAAAAwAOADwHgE+MfBfwfAZ8DrB3J/AfZNwM8D+ErAPwD8AcAPAPwAwA8A/APwHwD/B/j/QP8fePsC2gfABQAAAA==","AAEAAACAAAAgACCDwGgE6McAfQcQJ8BgAmJ/AORNwM8DeCqANwD8CcAHAHwAwA8A+AHwHwD/A/g/QP4fGDsASQRABQCAAA=="],[1.1458333333333335,1.1458333333333335,411.3541666666667,436.5625,"AAAAAACAAAAwAOBDwHgE/sfAfQfAL8D7B/J/AP5dwM8D+ErAHwD8AcAPAPwAwA8A/AHQH4D/A/j/wP8f+P+A+gfABQAAAA==","AAEAAACAAAAgAGCDwGgE6MdAfQcAJ8BgAmJ/AORNwM8DeCqANwD8AcAHAHwAwA8A+AHAH4D/A+i/YP8PWH8ASQJAFQAAAA=="],[1.1458333333333335,1.1458333333333335,411.3541666666667,437.70833333333337,"AAAAAACAAAAwAOBDwHgE/sfAfQfAL8D7B3J/AP5dwM8D+ErAHwD8AcAPAPwAwA8A/AHQHwD/A/j/wP8f+P+A+gfABQAAAA==","AAEAAACAAAAgAGCCwGgE6MdAfQcAJ8BgAmJ/AORNwM8DeEqANwD8CcAHAHwAwA8A+AHAHwD/A/i/YP4fGDsASQRABQCAAA=="]]],
// sha256 850743f75642453c4d15bd658677226221b8c718e5c7689dba7f377a120b6c7e
"assets/r99/outdoor/tree-dead-01.webp":[413,440,[[0,0,413,440,"AAAAAACAAAAwAOADwHgE+MfBfwfAZ8DrB3J/AfZNwM8D+ErAPwD8AcAPAPwAwA8A/APwHwD/B/j/QP8fePsC2gfABQAAAA==","AAEAAACAAAAgACCDwGgE6McAfQcQJ8BgAmJ/AORNwM8DeCqANwD8CcAHAHwAwA8A+AHwHwD/A/g/QP4fGDsASQRABQCAAA=="],[1.1458333333333335,1.1458333333333335,411.3541666666667,436.5625,"AAAAAACAAAAwAOBDwHgE/sfAfQfAL8D7B/J/AP5dwM8D+ErAHwD8AcAPAPwAwA8A/AHQH4D/A/j/wP8f+P+A+gfABQAAAA==","AAEAAACAAAAgAGCDwGgE6MdAfQcAJ8BgAmJ/AORNwM8DeCqANwD8AcAHAHwAwA8A+AHAH4D/A+i/YP8PWH8ASQZAFQAAAA=="],[1.1458333333333335,1.1458333333333335,411.3541666666667,437.70833333333337,"AAAAAACAAAAwAOBDwHgE/sfAfQfAL8D7B3J/AP5dwM8D+ErAHwD8AcAPAPwAwA8A/AHQHwD/A/j/wP8f+P+A+gfABQAAAA==","AAEAAACAAAAgAGCCwGgE6MdAfQcAJ8BgAmJ/AORNwM8DeEqANwD8CcAHAHwAwA8A+AHAHwD/A/i/YP4fGDsASQRABQCAAA=="]]],
// sha256 eb0bf57352d52c817ef4185147f43a4608e427070adcfed0d65d513ccb18ca4f
"assets/r99/outdoor/tree-dead-02.webp":[413,440,[[0,0,413,440,"AAAAAACAAAAwAOADwHgE+MfBfwfAZ8DrB3J/AfZNwM8D+ErAPwD8AcAPAPwAwA8A/APwHwD/B/j/QP8fePsC2gfABQAAAA==","AAEAAACAAAAgACCDwGgE6McAfQcQJ8BgAmJ/AORNwM8DeCqANwD8CcAHAHwAwA8A+AHwHwD/A/g/QP4fGLsASQRABQCAAA=="],[1.1458333333333335,1.1458333333333335,411.3541666666667,436.5625,"AAAAAACAAAAwAOBDwHgE/sfAfQfAL8D7B/J/AP5dwM8D+ErAHwD8AcAPAPwAwA8A/AHQH4D/A/j/wP8f+P+A+gfABQAAAA==","AAEAAACAAAAgAGCDwGgE6MdAfQcAJ8BgAmJ/AORNwM8DeCqANwD8AcAHAHwAwA8A+AHAH4D/A+i/YP8PWH8ASQZAFQAAAA=="],[1.1458333333333335,1.1458333333333335,411.3541666666667,437.70833333333337,"AAAAAACAAAAwAOBDwHgE/sfAfQfAL8D7B3J/AP5dwM8D+ErAHwD8AcAPAPwAwA8A/AHQHwD/A/j/wP8f+P+A+gfABQAAAA==","AAEAAACAAAAgAGCCwGgE6MdAfQcAJ8BgAmJ/AORNwM8DeEqANwD8CcAHAHwAwA8A+AHAHwD/A/i/YP4fGDsASQRABQCAAA=="]]],
// sha256 a93b80d3763ef1a534b2ea0d0d814420431b8db0ca766c42eabbc1fd8f88514c
"assets/r99/outdoor/tree-dead-03.webp":[413,440,[[0,0,413,440,"AAAAAACAAAAwAOADwHgE+MfBfwfAZ8DrB3J/AfZNwM8D+ErAPwD8AcAPAPwAwA8A/APwHwD/B/j/QP8fePsC2gfABQAAAA==","AAEAAACAAAAgACCDwGgE6McAfQcQJ8BgAmJ/AORNwM8DeCqANwD8CcAHAHwAwA8A+AHwHwD/A/g/QP4fGLsASQRABQCAAA=="],[1.1458333333333335,1.1458333333333335,411.3541666666667,436.5625,"AAAAAACAAAAwAOBDwHgE/sfAfQfAL8D7B/J/AP5dwM8D+ErAHwD8AcAPAPwAwA8A/AHQH4D/A/j/wP8f+P+A+gfABQAAAA==","AAEAAACAAAAgAGCDwGgE6MdAfQcAJ8BgAmJ/AORNwM8DeCqANwD8AcAHAHwAwA8A+AHAH4D/A+i/YP8PWH8ASQZAFQAAAA=="],[1.1458333333333335,1.1458333333333335,411.3541666666667,437.70833333333337,"AAAAAACAAAAwAOBDwHgE/sfAfQfAL8D7B3J/AP5dwM8D+ErAHwD8AcAPAPwAwA8A/AHQHwD/A/j/wP8f+P+A+gfABQAAAA==","AAEAAACAAAAgAGCCwGgE6MdAfQcAJ8BgAmJ/AORNwM8DeEqANwD8CcAHAHwAwA8A+AHAHwD/A/i/YP4fGDsASQRABQCAAA=="]]],
// sha256 7f5d2be5923d8e9075f2179109dc14b9ec7464fb3f38ab2411deea8eada3fdee
"assets/r99/outdoor/tree-dead-04.webp":[413,440,[[0,0,413,440,"AAAAAACAAAAwAOADwHgE+MfBfwfAZ8DrB3J/AfZNwM8D+ErAPwD8AcAPAPwAwA8A/APwHwD/B/j/QP8fePsCWgfABQAAAA==","AAEAAACAAAAgACCDwGgE6McAfQcQJ8BgAmJ/AORNwM8DeCqANwD8CcAHAHwAwA8A+AHwHwD/A/g/QP4fGLsASQRABQCAAA=="],[1.1458333333333335,1.1458333333333335,411.3541666666667,436.5625,"AAAAAACAAAAwAOBDwHgE/sfAfQfAL8D7B/J/AP5dwM8D+ErAHwD8AcAPAPwAwA8A/AHQH4D/A/j/wP8f+P+A+gfABQAAAA==","AAEAAACAAAAgAGCDwGgE6MdAfQcAJ8BgAmJ/AORNwM8DeCqANwD8AcAHAHwAwA8A+AHAH4D/A+i/YP8PWH8ASQZABQCAAA=="],[1.1458333333333335,1.1458333333333335,411.3541666666667,437.70833333333337,"AAAAAACAAAAwAOBDwHgE/sfAfQfAL8D7B3J/AP5dwM8D+ErAHwD8AcAPAPwAwA8A/AHQHwD/A/j/wP8f+P+A+gfABQAAAA==","AAEAAACAAAAgAGCCwGgE6MdAfQcAJ8BgAmJ/AORNwM8DeEqANwD8CcAHAHwAwA8A+AHAHwD/A/i/YP4fGDuASQRABQCAAA=="]]],
// sha256 7dc17455f322f3badc6859fca0a4ce1b6a20f012c23ac516c24771aa386eff60
"assets/r99/outdoor/tree-dead-05.webp":[413,440,[[0,0,413,440,"AAAAAACAAAAwAOADwHgE+MfBfwfAZ8DrB3J/AfZNwM8D+ErAPwD8AcAPAPwAwA8A/APwHwD/B/j/QP8fePsCWgfABQAAAA==","AAEAAACAAAAgACCDwGgE6McAfQcQJ8BgAmJ/AORNwM8DeCqANwD8CcAHAHwAwA8A+AHwHwD/A/g/QP4fGLsASQRABQCAAA=="],[1.1458333333333335,1.1458333333333335,411.3541666666667,436.5625,"AAAAAACAAAAwAOBDwHgE/sfAfQfAL8D7B/J/AP5dwM8D+ErAHwD8AcAPAPwAwA8A/AHQH4D/A/j/wP8f+P+A+gfABQAAAA==","AAEAAACAAAAgAGCDwGgE6MdAfQcAJ8BgAmJ/AORNwM8DeCqANwD8AcAHAHwAwA8A+AHAH4D/A+i/YP8PWH8ASQZAFQCAAA=="],[1.1458333333333335,1.1458333333333335,411.3541666666667,437.70833333333337,"AAAAAACAAAAwAOBDwHgE/sfAfQfAL8D7B3J/AP5dwM8D+ErAHwD8AcAPAPwAwA8A/AHQHwD/A/j/wP8f+P+A+gfABQAAAA==","AAEAAACAAAAgAGCCwGgE6MdAfQcAJ8BgAmJ/AORNwM8DeEqANwD8CcAHAHwAwA8A+AHAHwD/A/i/YP4fGDsASQRABQCAAA=="]]],
// sha256 6be45765551477b8623efb5e0d5aaaa20ffee5f084bed53c28ba09ce97b1dafb
"assets/r99/outdoor/tree-dead-06.webp":[413,440,[[0,0,413,440,"AAAAAACAAAAwAOADwHgE+MfBfwfAZ8DrB3J/AfZNwM8D+ErAPwD8AcAPAPwAwA8A/APwHwD/B/j/QP8fePsC2gfABQAAAA==","AAEAAACAAAAgACCDwGgE6McAfQcQJ8BgAmJ/AORNwM8DeCqANwD8CcAHAHwAwA8A+AHwHwD/A/g/QP4fGDsASQRABQCAAA=="],[1.1458333333333335,1.1458333333333335,411.3541666666667,436.5625,"AAAAAACAAAAwAOBDwHgE/sfAfQfAL8D7B/J/AP5dwM8D+ErAHwD8AcAPAPwAwA8A/AHQH4D/A/j/wP8f+P+A+gfABQAAAA==","AAEAAACAAAAgAGCDwGgE6MdAfQcAJ8BgAmJ/AORNwM8DeCqANwD8AcAHAHwAwA8A+AHAH4D/A+i/YP8PWH8ASQJAFQAAAA=="],[1.1458333333333335,1.1458333333333335,411.3541666666667,437.70833333333337,"AAAAAACAAAAwAOBDwHgE/sfAfQfAL8D7B3J/AP5dwM8D+ErAHwD8AcAPAPwAwA8A/AHQHwD/A/j/wP8f+P+A+gfABQAAAA==","AAEAAACAAAAgAGCCwGgE6MdAfQcAJ8BgAmJ/AORNwM8DeEqANwD8CcAHAHwAwA8A+AHAHwD/A/i/YP4fGDsASQRABQCAAA=="]]],
// sha256 9b327a33fc796980f7d61c7eb714d5788fc94229674641009003e1518ee00c6c
"assets/r99/outdoor/tree-dead-07.webp":[413,440,[[0,0,413,440,"AAAAAACAAAAwAOADwHgE+MfBfwfAZ8DrB3J/AfZNwM8D+ErAPwD8AcAPAPwAwA8A/APwHwD/B/j/QP8fePsC2gfABQAAAA==","AAEAAACAAAAgACCDwGgE6McAfQcQJ8BgAmJ/AORNwM8DeCqANwD8CcAHAHwAwA8A+AHwHwD/A/g/QP4fGDsASQRABQCAAA=="],[1.1458333333333335,1.1458333333333335,411.3541666666667,436.5625,"AAAAAACAAAAwAOBDwHgE/sfAfQfAL8D7B/J/AP5dwM8D+ErAHwD8AcAPAPwAwA8A/AHQH4D/A/j/wP8f+P+A+gfABQAAAA==","AAEAAACAAAAgAGCDwGgE6MdAfQcAJ8BgAmJ/AORNwM8DeCqANwD8AcAHAHwAwA8A+AHAH4D/A+i/YP8PWH8AWQpAFQAAAA=="],[1.1458333333333335,1.1458333333333335,411.3541666666667,437.70833333333337,"AAAAAACAAAAwAOBDwHgE/sfAfQfAL8D7B3J/AP5dwM8D+ErAHwD8AcAPAPwAwA8A/AHQHwD/A/j/wP8f+P+A+gfABQAAAA==","AAEAAACAAAAgAGCCwGgE6MdAfQcAJ8BgAmJ/AORNwM8DeEqANwD8CcAHAHwAwA8A+AHAHwD/A/i/YP4fGD8ASQRAFQCAAA=="]]],
// sha256 b1cbe9f953fb2525b48890e4d6e928cc0ef8276807118f44dd4d8fe9c9a7da72
"assets/r99/outdoor/tree-dead-08.webp":[413,440,[[0,0,413,440,"AAAAAACAAAAwAOADwHgE+MfBfwfAZ8DrB3J/AfZNwM8D+ErAPwD8AcAPAPwAwA8A/APwHwD/B/j/QP8fePsC2gfABQAAAA==","AAEAAACAAAAgACCDwGgE6McAfQcQJ8BgAmJ/AORNwM8DeCqANwD8CcAHAHwAwA8A+AHwHwD/A/g/QP4fGDsASQRABQCAAA=="],[1.1458333333333335,1.1458333333333335,411.3541666666667,436.5625,"AAAAAACAAAAwAOBDwHgE/sfAfQfAL8D7B/J/AP5dwM8D+ErAHwD8AcAPAPwAwA8A/AHQH4D/A/j/wP8f+P+A+gfABQAAAA==","AAEAAACAAAAgAGCDwGgE6MdAfQcAJ8BgAmJ/AORNwM8DeCqANwD8AcAHAHwAwA8A+AHAH4D/A+i/YP8PWH8AWQpAFQAAAA=="],[1.1458333333333335,1.1458333333333335,411.3541666666667,437.70833333333337,"AAAAAACAAAAwAOBDwHgE/sfAfQfAL8D7B3J/AP5dwM8D+ErAHwD8AcAPAPwAwA8A/AHQHwD/A/j/wP8f+P+A+gfABQAAAA==","AAEAAACAAAAgAGCCwGgE6MdAfQcAJ8BgAmJ/AORNwM8DeEqANwD8CcAHAHwAwA8A+AHAHwD/A/i/YP4fGD8ASQxAFQCAAA=="]]],
// sha256 f040fb460efb3596af5ab38cdd24831f40c785566c08e7072a0a22054cf9c908
"assets/r99/outdoor/tree-dead-09.webp":[413,440,[[0,0,413,440,"AAAAAACAAAAwAOADwHgE+MfBfwfAZ8DrB3J/AfZNwM8D+ErAPwD8AcAPAPwAwA8A/APwHwD/B/j/QP8fePsC2gfABQAAAA==","AAEAAACAAAAgACCDwGgE6McAfQcQJ8BgAmJ/AORNwM8DeCqANwD8CcAHAHwAwA8A+AHwHwD/A/g/QP4fGDsASQRABQCAAA=="],[1.1458333333333335,1.1458333333333335,411.3541666666667,436.5625,"AAAAAACAAAAwAOBDwHgE/sfAfQfAL8D7B/J/AP5dwM8D+ErAHwD8AcAPAPwAwA8A/AHQH4D/A/j/wP8f+P+A+gfABQAAAA==","AAEAAACAAAAgAGCDwGgE6MdAfQcAJ8BgAmJ/AORNwM8DeCqANwD8AcAHAHwAwA8A+AHAH4D/A+i/YP8PWH8ASQpAFQAAAA=="],[1.1458333333333335,1.1458333333333335,411.3541666666667,437.70833333333337,"AAAAAACAAAAwAOBDwHgE/sfAfQfAL8D7B3J/AP5dwM8D+ErAHwD8AcAPAPwAwA8A/AHQHwD/A/j/wP8f+P+A+gfABQAAAA==","AAEAAACAAAAgAGCCwGgE6MdAfQcAJ8BgAmJ/AORNwM8DeEqANwD8CcAHAHwAwA8A+AHAHwD/A/i/YP4fGD8ASQxAFQCAAA=="]]],
// sha256 5fcff863db74ca663a382d004d6da72c3398bcdcbfb09ec0c6a4edd563edac99
"assets/r99/outdoor/tree-dead-10.webp":[413,440,[[0,0,413,440,"AAAAAACAAAAwAOADwHgE+MfBfwfAZ8DrB3J/AfZNwM8D+ErAPwD8AcAPAPwAwA8A/APwHwD/B/j/QP8fePsC2gfABQAAAA==","AAEAAACAAAAgACCDwGgE6McAfQcQJ8BgAmJ/AORNwM8DeCqANwD8CcAHAHwAwA8A+AHwHwD/A/g/QP4fGDsASQRAAQCAAA=="],[1.1458333333333335,1.1458333333333335,411.3541666666667,436.5625,"AAAAAACAAAAwAOBDwHgE/sfAfQfAL8D7B/J/AP5dwM8D+ErAHwD8AcAPAPwAwA8A/AHQH4D/A/j/wP8f+P+A+gfABQAAAA==","AAEAAACAAAAgAGCDwGgE6MdAfQcAJ8BgAmJ/AORNwM8DeCqANwD8AcAHAHwAwA8A+AHAH4D/A+i/YP8PWH8ASQpAFQCAAA=="],[1.1458333333333335,1.1458333333333335,411.3541666666667,437.70833333333337,"AAAAAACAAAAwAOBDwHgE/sfAfQfAL8D7B3J/AP5dwM8D+ErAHwD8AcAPAPwAwA8A/AHQHwD/A/j/wP8f+P+A+gfABQAAAA==","AAEAAACAAAAgAGCCwGgE6MdAfQcAJ8BgAmJ/AORNwM8DeEqANwD8CcAHAHwAwA8A+AHAHwD/A/i/YP4fGDsASQRAFQCAAA=="]]],
// sha256 1b564de906111e6c1f98f5efdaae569460d6aa2e0215b908a692edc53d977c2c
"assets/r99/outdoor/tree-dead-11.webp":[413,440,[[0,0,413,440,"AAAAAACAAAAwAOADwHgE+MfBfwfAZ8DrB3J/AfZNwM8D+ErAPwD8AcAPAPwAwA8A/APwHwD/B/j/QP8fePsCWgfABQAAAA==","AAEAAACAAAAgACCDwGgE6McAfQcQJ8BgAmJ/AORNwM8DeCqANwD8CcAHAHwAwA8A+AHwHwD/A/g/QP4fGDsASQRAAQCAAA=="],[1.1458333333333335,1.1458333333333335,411.3541666666667,436.5625,"AAAAAACAAAAwAOBDwHgE/sfAfQfAL8D7B/J/AP5dwM8D+ErAHwD8AcAPAPwAwA8A/AHQH4D/A/j/wP8f+P+A+gfABQAAAA==","AAEAAACAAAAgAGCDwGgE6MdAfQcAJ8BgAmJ/AORNwM8DeCqANwD8AcAHAHwAwA8A+AHAH4D/A+i/YP8PWH8ASQpAFQCAAA=="],[1.1458333333333335,1.1458333333333335,411.3541666666667,437.70833333333337,"AAAAAACAAAAwAOBDwHgE/sfAfQfAL8D7B3J/AP5dwM8D+ErAHwD8AcAPAPwAwA8A/AHQHwD/A/j/wP8f+P+A+gfABQAAAA==","AAEAAACAAAAgAGCCwGgE6MdAfQcAJ8BgAmJ/AORNwM8DeEqANwD8CcAHAHwAwA8A+AHAHwD/A/i/YP4fGDsASQRAFQCAAA=="]]],
// sha256 0ae3e61b0e194a1a06071603d88750c4f2f1813c166d0350db1856f4b057da1c
"assets/world-r80/r80-013.webp":[317,512,[[0,0,317,512,"ABAAgAEAOABABxDUwAMIHIbAZQDEBgD8MFCfB/f54P/K/w36PwD+A/A/gP8f/H+D/yP4P8D8B8h/AP4DwD8A/APAPwAAAA==","ABAAgAEAMIBABwDEwAMLGIKAZAjEhkL4AFCfA/NxIP9C/aniH4B6hvEvkP8c9D+B+iPIP8D4BchfAP4HwD8A/QPAHwAAAA=="],[1.3333333333333333,1.3333333333333333,314.6666666666667,509.3333333333333,"ABAAgAEAPABABzjUwCMIGIbAdADEBgD8MFifB/Zx4P9K/w36P4D+A/A/gP8f/H+D/yP4P8L8B8h/gPwBwD8A/APAPwD4AA==","ABAAgAEAMABABwDAwAMLCIKAZAjEhgLwMFCfB/NxIP9C/YniH4h6h/AvkP8c9D+B+iPKP4D4BchfAP4FwD8A/APAPwCIAA=="]]],
// sha256 14e0556adb1ce034a00634207700e8bad7dbb17c7cb572de1500b84fb494fe1b
"assets/world-r80/r80-014.webp":[512,435,[[0,0,512,435,"8ACAHwD4AcA9AJwDwDAADAPAMACcB8D/APgPgP8A/A/A/wH+P+D/B/5/4P8P/v/h/x////P/f//P73/4+MMJHniAgAcAcA==","YAAADwD4AYAdAIwDwDAADAPAMACcB4D/APgPgP8A+A/A3wH+N+D/B/5/4P8H/v/h/x//7/P/fv/P73/48IMBHDgAgAcAMA=="],[1.3333333333333333,1.3333333333333333,509.3333333333333,433.3333333333333,"8ACAHwD4AcA9AIwDwDAADAPAMACcB8D/APgPgP8A/B/A/wH+P+D/B/7/4P8P/v/x/z////P/f//P73/4+IMJHniAgAcAcA==","cACADwD4AcAZAIwDwDAADAPAMACcB4D/APgPgP8A+A/A3wH+N+D/B/5/4P8H/v/h/x//7/P/fv/P73/48IMJHHgAgAcAcA=="]]]
};
// END GENERATED R412 MASKS
const masks=new WeakMap();
const assetRoot=typeof BASE==='string'?BASE:'';
const maskSmoothing=mg?.imageSmoothingQuality;
// Browser image resamplers differ at alpha edges. Learn the actual backend with
// two independently measured shipped images, including a full and a fractional
// crop at different scales. Unknown or conflicting results keep native sampling.
// Chromium may change the decoder's downsampling for an individual image after
// it has been rendered. Fresh and previously displayed copies of identical bytes
// produced different masks in the same game tab. Keep native sampling on that path.
const webkitMask=typeof window.WebKitPoint==='function'&&typeof CSS!=='undefined'&&
 CSS.supports?.('-webkit-nbsp-mode','space');
const probes=[];
stats.maskProfile=webkitMask?'pending':'native';
function sameMask(bits,encoded){
 const bytes=atob(encoded);
 return bytes.length===bits.length&&bits.every((b,i)=>b===bytes.charCodeAt(i));
}
function observeMask(bits,row,img,path){
 stats.maskProbes++;
 const chrome=sameMask(bits,row[4]),webkit=sameMask(bits,row[5]);
 if(chrome&&webkit)return;
 if(!webkit){
  stats.maskProfile='native';probes.length=0;return;
 }
 const full=row[0]===0&&row[1]===0&&row[2]===img.naturalWidth&&row[3]===img.naturalHeight;
 if(!full&&row.slice(0,4).every(Number.isInteger))return;
 if(probes.some(p=>p.full!==full&&p.path!==path&&(p.width!==row[2]||p.height!==row[3]))){
  stats.maskProfile='webkit';probes.length=0;
 }else if(!probes.some(p=>p.row===row)){
  probes.push({row,path,full,width:row[2],height:row[3]});
 }
}
function bakedOrNative(img,url,sx,sy,sw,sh){
 if(stats.maskProfile==='native'||!assetRoot||!url.startsWith(assetRoot+'assets/'))return;
 const path=url.slice(assetRoot.length),entry=bakedPropMasks[path];
 if(!entry||entry[0]!==img.naturalWidth||entry[1]!==img.naturalHeight)return;
 for(const row of entry[2]){
  if(row[0]!==sx||row[1]!==sy||row[2]!==sw||row[3]!==sh)continue;
  if(stats.maskProfile==='pending'){
   const bits=readMask(img,sx,sy,sw,sh);
   if(bits)observeMask(bits,row,img,path);
   return bits;
  }
  const bytes=atob(row[5]),bits=new Uint8Array(bytes.length);
  for(let i=0;i<bits.length;i++)bits[i]=bytes.charCodeAt(i);
  stats.maskBaked++;
  return bits;
 }
 return;
}
function readMask(img,sx,sy,sw,sh){
 if(!mg)return null;
 try{
  mg.clearRect(0,0,MW,MH);
  mg.drawImage(img,sx,sy,sw,sh,0,0,MW,MH);
  stats.maskReadbacks++;
  const rgba=mg.getImageData(0,0,MW,MH).data,bits=new Uint8Array(MW*MH/8);
  for(let i=0;i<MW*MH;i++)if(rgba[i*4+3]>=80)bits[i>>3]|=1<<(i&7);
  return bits;
 }catch(_){return null;}
}
function mask(img,sx,sy,sw,sh){
 if(!img||typeof img!=='object')return null;
 const image=typeof HTMLImageElement!=='undefined'&&img instanceof HTMLImageElement;
 // Phase1 tags immutable derived canvases for its own texture cache. Reuse the
 // native result for those objects too, but never look them up by asset URL.
 const tag=!image&&(img.__storyworldStaticTint||img.__storyworldStaticSource);
 if(!image&&(!tag||tag.immutable===false))return readMask(img,sx,sy,sw,sh);
 const width=image?img.naturalWidth:img.width,height=image?img.naturalHeight:img.height;
 if(!(width>0&&height>0)||(image&&!img.complete))return null;
 const url=image&&(img.currentSrc||img.src);
 if(image&&(!url||url!==img.src))return readMask(img,sx,sy,sw,sh);
 const memory=window.__STORYWORLD_MOBILE_MEMORY_R980__;
 // A previous R980 revision has no way to identify the live half variant.
 if(image&&memory&&typeof memory.usesHalfSource!=='function')return readMask(img,sx,sy,sw,sh);
 const half=image&&!!memory?.usesHalfSource(img);
 const id=image?url:tag,version=tag?.revision,path=tag?.path;
 let cached=masks.get(img);
 if(!cached||cached.id!==id||cached.half!==half||cached.width!==width||cached.height!==height||
   cached.version!==version||cached.path!==path){
  cached={id,half,width,height,version,path,rects:new Map()};masks.set(img,cached);
 }
 const M=cached.rects,key=sx+','+sy+','+sw+','+sh;
 if(M.has(key))return M.get(key);
 const canBake=stats.maskProfile!=='native'&&image&&!half&&mg?.imageSmoothingEnabled&&mg.imageSmoothingQuality===maskSmoothing;
 let m;
 if(canBake)m=bakedOrNative(img,url,sx,sy,sw,sh);
 if(m===undefined)m=readMask(img,sx,sy,sw,sh);
 if(m){if(M.size>64)M.clear();M.set(key,m);}
 return m;
}
// 그 조형물을 게임 그리기 함수 그대로(덧씌운 모든 그림 규칙 포함) 화면 밖 캔버스에 한 번 그려 본체 그림의 화면 사각형을 얻는다.
//  점은 보이는 발 자리(R111 r111To 또는 x·y) 기준이다.
//  손전등 시야(R24, 모바일 기본 켜짐)는 시야 밖 조형물을 그리지 않는다 → 그리는 동안만 끄고 같은 호출 안에서 되돌린다.
let measuring=0;// bodyOf 가 화면 밖 캔버스에 그려 재는 동안(아래 그리기 감싸기가 감추거나 옅게 하지 않게)
function bodyOf(p){if(!g||typeof drawProp!=='function'||typeof project!=='function')return null;rec=[];const saved=ctx,cx=cam.x,cy=cam.y,F=footOf(p);let r=null,q=null;
 const SET=typeof settings!=='undefined'&&settings&&typeof settings==='object'?settings:null,had=!!SET&&Object.prototype.hasOwnProperty.call(SET,'flashlight58'),lit=SET?SET.flashlight58:undefined;
 try{if(SET)SET.flashlight58=false;cam.x=F.x;cam.y=F.y;q=project(F.x,F.y);ctx=g;measuring++;g.setTransform(1,0,0,1,0,0);g.globalAlpha=1;g.filter='none';try{drawProp(p);if(!rec.length)drawProp(p);}finally{measuring--;}/* R266 은 이번 장면에 먼저 그린 소품을 한 번 건너뛴다 → 아무것도 안 그려졌으면 한 번 더 */}catch(e){fail(e);}finally{if(SET){if(had)SET.flashlight58=lit;else delete SET.flashlight58;}ctx=saved;cam.x=cx;cam.y=cy;r=rec;rec=null;}
 let best=null,ba=0;for(const d of r||[]){if(/brightness\(0/.test(d.f))continue;const a=d.a,img=d.img;let sx=0,sy=0,sw=img.naturalWidth||img.width,sh=img.naturalHeight||img.height,dx,dy,dw,dh;
  if(a.length===8)[sx,sy,sw,sh,dx,dy,dw,dh]=a;else if(a.length===4)[dx,dy,dw,dh]=a;else{[dx,dy]=a;dw=sw;dh=sh;}
  const m=d.m,X=[dx,dx+dw].map(x=>m.a*x+m.e),Y=[dy,dy+dh].map(y=>m.d*y+m.f),area=Math.abs((X[1]-X[0])*(Y[1]-Y[0]));
  if(area>ba){ba=area;best={img,src:[sx,sy,sw,sh],x0:Math.min(...X),x1:Math.max(...X),y0:Math.min(...Y),y1:Math.max(...Y),flip:m.a*Math.sign(dw||1)<0,qx:q.x,qy:q.y};}}
 return best;}
// R99 흔들리는 나무는 12장(0.1초씩)이 번갈아 그려진다 → 한 장만 재면 다른 장의 가지가 벽에 다시 든다 → 12장 알파를 합쳐 잰다.
//  아직 안 읽힌 장이 있으면 8초까지는 기다리고(null), 그 뒤에는 읽힌 장만 합친다.
const R99_FRAMES=12;
let visit=0,lastRoom=null,visitAt=-1e9;// 방에 들어올 때마다 1 늘린다 — 그림 기다리기(r412Since)·벽 높이 기다리기는 방문마다 새로 센다
function swayUnion(p,b,m){const kind=p?.r99Tree?.kind;if(!kind||typeof readyImage!=='function')return m;const u=new Uint8Array(m),whole=b.src[0]===0&&b.src[1]===0;let miss=0;
 for(let i=0;i<R99_FRAMES;i++){let row=null;try{row=readyImage('assets/r99/outdoor/tree-'+kind+'-'+String(i).padStart(2,'0')+'.webp');}catch(_){}const im=row?.image;if(!im||!(im.naturalWidth>0)){miss++;continue;}
  const mm=mask(im,...(whole?[0,0,im.naturalWidth,im.naturalHeight]:b.src));if(!mm){miss++;continue;}for(let j=0;j<u.length;j++)u[j]|=mm[j];}
 return miss&&(!p.r412Since||p.r412Visit!==visit||now()-p.r412Since<8000)?null:u;}
// 불투명 픽셀 → 보이는 발 기준 3D 점 [dx,dy,z]. 못 얻으면 null 이고 까닭을 why 에 남긴다('none' = 그리기 사슬이 아무것도 안 그렸다).
let why='wait';
function samplesOf(p){const b=bodyOf(p);if(!b){why='none';return null;}try{Object.defineProperty(p,'r412Rect',{value:[b.x0-b.qx,b.x1-b.qx,b.y0-b.qy,b.y1-b.qy,typeof zoom==='number'?zoom:1],configurable:true,writable:true});}catch(_){}let m=mask(b.img,...b.src);if(!m)return null;m=swayUnion(p,b,m);if(!m)return null;const ppu=TILE*zoom*Math.SQRT2,out=[];
 for(let j=0;j<MH;j++)for(let i=0;i<MW;i++){const u=b.flip?MW-1-i:i,bit=j*MW+u;if(!(m[bit>>3]&(1<<(bit&7))))continue;const sx=b.x0+(i+.5)/MW*(b.x1-b.x0),sy=b.y0+(j+.5)/MH*(b.y1-b.y0),s=(sx-b.qx)/ppu,h=(b.qy-sy)/ppu;
  if(h<0)continue;out.push([s*SQ-BACK*h,-s*SQ-BACK*h,RISE*h]);}
 return out.sort((a,b)=>b[2]-a[2]);}// 높은 점부터(벽에 먼저 닿는 쪽) — 후보 자리를 빨리 버린다
// 무엇이 '벽 덩어리'인가: 실내는 바닥 밖(벽 덩어리·벽 윗면 어둠)도 벽으로 본다. 실외(R406 indoorOf 가 아닌 곳, R99 나무는 늘)는 바닥 밖이
//  탁 트인 땅·숲 가장자리라 벽 상자(L.walls, 그 높이까지)만 벽으로 본다 — 숲 가장자리 나무를 벽 속으로 잘못 읽어 바닥 쪽으로 끌어오거나 숨기지 않게.
const wallGrid=new WeakMap(),GC=4,GK=(x,y)=>(x+32768)*65536+(y+32768);// 숫자 열쇠(점마다 'x,y' 문자열을 만들지 않게 — 심사 지적)
// 벽 서명(개수·높이 합) — 같은 벽 객체의 높이가 그 자리에서 바뀌어도(R115) 알아챈다. apply 가 한 번씩만 보고, 바뀌면 격자를 버리고 다시 잰다.
function wallSig(L){const W=L?.walls;if(!Array.isArray(W))return '0';let s=0;for(const w of W)if(w&&Number.isFinite(w.height))s+=w.height;return W.length+':'+Math.round(s*100);}
// R115 가 이 방(사몽 밖) 벽 높이를 아직 손보지 않았으면 false — 손본 벽에는 r115Wall(원래 높이)이 붙는다
function wallsDressed(L){try{const P=window.__STORYWORLD_PLAY_R115__;if(!P||P.prefs?.().walls===false||!L||L.samongR103||L.samongR115||!Array.isArray(L.walls))return true;
 for(const w of L.walls)if(w&&Number.isFinite(w.height))return w.r115Wall!=null;return true;}catch(_){return true;}}
const WALL_WAIT_MS=12000;
function wallBoxes(L){let m=wallGrid.get(L);if(m)return m;m=new Map();
 for(const w of L?.walls||[]){if(!w||!Number.isFinite(w.x+w.y+w.width+w.depth))continue;const h=Number.isFinite(w.height)?w.height:WALL_H;if(h<.2)continue;/* 가구 충돌 상자(높이 .01)는 벽이 아니다 */
  const b={x0:w.x-w.width/2,x1:w.x+w.width/2,y0:w.y-w.depth/2,y1:w.y+w.depth/2,h};
  for(let gy=Math.floor(b.y0/GC);gy<=Math.floor(b.y1/GC);gy++)for(let gx=Math.floor(b.x0/GC);gx<=Math.floor(b.x1/GC);gx++){const k=GK(gx,gy);let a=m.get(k);if(!a)m.set(k,a=[]);a.push(b);}}
 wallGrid.set(L,m);return m;}
function inWallBox(L,x,y,z,r=0){const G=wallBoxes(L);for(let gy=Math.floor((y-r)/GC);gy<=Math.floor((y+r)/GC);gy++)for(let gx=Math.floor((x-r)/GC);gx<=Math.floor((x+r)/GC);gx++){const a=G.get(GK(gx,gy));if(a)for(const b of a)if(z<b.h&&x>b.x0-r&&x<b.x1+r&&y>b.y0-r&&y<b.y1+r)return true;}return false;}
// 실내 벽 덩어리 = 바닥 칸 밖(벽 높이까지) + 벽 상자(그 높이까지). 가구 충돌 상자(높이 .01)는 벽이 아니다(explorationBlocked 는 그것도 막는다).
//  바닥 칸 자료가 없거나 병원 해석형 배치면 explorationBlocked 로 본다.
const floorSets=new WeakMap();
function floorSet(L){if(!L||typeof L!=='object')return null;if(floorSets.has(L))return floorSets.get(L);const c=L.floorCells;
 const s=Array.isArray(c)&&c.length&&!L.hospitalAnalytic12?new Set(c.filter(v=>Array.isArray(v)).map(([x,y])=>GK(Math.floor(x),Math.floor(y)))):null;floorSets.set(L,s);return s;}
function solidAt(L,x,y,z,indoor){if(!indoor)return inWallBox(L,x,y,z);if(!(z<WALL_H))return inWallBox(L,x,y,z);const F=floorSet(L);if(!F)return blocked(L,x,y,.02);return !F.has(GK(Math.floor(x),Math.floor(y)))||inWallBox(L,x,y,z);}
const indoorFor=(rep,p)=>!!rep?.indoor&&!p?.r99Tree;
function embedded(L,x,y,S,cap=Infinity,indoor=true){let n=0;for(const[a,b,z]of S)if(solidAt(L,x+a,y+b,z,indoor)&&++n>cap)return n;return n;}
// 옮길 발 자리: 실내·바닥 위 소품은 걸을 수 있는 바닥, 실외 바닥 밖(숲 가장자리) 소품은 벽 상자만 피해 그 바깥에서 옮긴다(바닥으로 끌어오지 않는다)
function footOk(L,x,y,indoor,onFloor){if(indoor||onFloor)return !blocked(L,x,y,.3);const b=L?.bounds;if(Array.isArray(b)&&(x<b[0]||y<b[1]||x>b[2]||y>b[3]))return false;return !inWallBox(L,x,y,0,.3);}

// ---- 자리 도우미(R406 과 같은 기준) ------------------------------------------------------------------
function avoidPoints(r){const L=r.exploration,out=[];for(const d of L.worldR74?.doors||[])if(Number.isFinite(d.x+d.y))out.push([d.x,d.y,(+d.width||0)/2+1.4]);
 for(const q of[L.entry,L.gate,r.objective,r.altar,L.altar,L.samongR103?.exit,L.samongR103?.dais])if(q&&Number.isFinite(q.x+q.y))out.push([q.x,q.y,1.4]);
 for(const p of r.props||[])if(p&&(p.interactive||p.r75NPC||p.r75NarrativeNPC||p.samongR103||p.r115Clue)&&Number.isFinite(p.x+p.y))out.push([p.x,p.y,1.2]);return out;}
const nearAny=(pts,x,y)=>pts.some(([ax,ay,rr])=>Math.hypot(ax-x,ay-y)<rr);
// 보이는 조형물들의 발 자리는 한 번만 구해 두고(후보 자리마다 다시 구하지 않는다), 옮기거나 숨길 때 고친다
function feetOf(r,on,F){const m=new Map();for(const q of r.props||[])if(shown(q)&&Number.isFinite(q?.x+q?.y))m.set(q,footOf(q,on,F));return m;}
const crowdedF=(feet,p,x,y,gap)=>{for(const[q,f]of feet)if(q!==p&&Math.hypot(f.x-x,f.y-y)<gap)return true;return false;};
// R169 은 입구→목표·제단·출구 길 1.15칸 안의 장식을 숨긴다 → 옮긴 자리가 그 길 위면 안 된다(R406 과 같은 1.45칸)
const pathMemo=new WeakMap();
function pathOf(r){const L=r.exploration,m=pathMemo.get(r);if(m&&m.L===L)return m.s;let s=null;try{s=window.__STORYWORLD_PLAY_R169__?.pathCells?.(r)||null;}catch(e){fail(e);}pathMemo.set(r,{L,s});return s;}
// 그 자리에서 R169 길 칸 가운데까지 가장 가까운 거리(2칸 안만, 없으면 9). 길 띠(1.45칸) 밖이던 것은 띠 안으로, 띠 안이던 것은 길 쪽으로 더 옮기지 않는다.
const PATH_BAND=1.45;
function pathD(r,x,y){const s=pathOf(r);if(!s)return 9;const cx=Math.floor(x),cy=Math.floor(y);let d=9;for(let dx=-2;dx<=2;dx++)for(let dy=-2;dy<=2;dy++)if(s.has((cx+dx)+','+(cy+dy))){const e=Math.hypot(cx+dx+.5-x,cy+dy+.5-y);if(e<d)d=e;}return d;}
const DIR8=[[1,0],[0,1],[1,1],[-1,1],[1,-1],[-1,0],[0,-1],[-1,-1]].map(([x,y])=>{const d=Math.hypot(x,y);return[x/d,y/d];});

// ① 벽 속에 든 조형물 빼기
const LIMIT=.03,WAIT_MS=20000,HIDE_OVER=.15;
// R92 등불(바닥 등 기둥) 자리 — 옮긴 조형물이 그 곁(1칸)에 서지 않게
function r92Lights(r){try{if(typeof room==='undefined'||r!==room)return[];return window.__STORYWORLD_VISUAL_R92__?.plan?.()?.lights||[];}catch(_){return[];}}
// 그림이 이미 읽혔는데 그리기 사슬이 아무것도 안 그린 조형물(R303·R191 숨김, 보스방 덮개, 병원 a5 등)은 보이지 않으니 20초 기다리지 않고 끝낸다
function artReady(p){if(typeof readyImage!=='function')return false;const a=artOf(p);if(!/\.(png|webp|jpe?g|gif|avif)(\?|$)/i.test(a))return false;try{return !!readyImage(a);}catch(_){return false;}}
// 화면 가운데(카메라)에서 가까운 것부터 — 보이는 조형물이 먼저 자리를 잡는다
function byCamera(list){if(typeof cam==='undefined'||!cam||!Number.isFinite(cam.x+cam.y))return list;const k=p=>Number.isFinite(p?.x+p?.y)?Math.hypot(p.x-cam.x,p.y-cam.y):1e9;return list.slice().sort((a,b)=>k(a)-k(b));}
// R412 심사(ep1b02 소파가 TV장 뒤로 숨던 것): 옮길 자리에서 그보다 앞(화면 아래, x+y 큰 쪽) 4칸 안 이웃이 그림 사각형의 1/4 넘게 덮으면 버린다.
//  사각형은 잰 그림(r412Rect, 그때 줌 기준)이 있으면 그것, 없으면 키(height)와 그림 가로세로 비로 어림한다.
function rectAt(q,x,y){const z=typeof zoom==='number'&&zoom>0?zoom:1,P=project(x,y),R=q.r412Rect;if(R){const k=z/(R[4]||z);return[P.x+R[0]*k,P.x+R[1]*k,P.y+R[2]*k,P.y+R[3]*k];}
 const h=(Number(q.height)||60)*z;let asp=.8;try{const row=typeof readyImage==='function'?readyImage(artOf(q)):null,b=row?.crop||(row?.image?{w:row.image.naturalWidth,h:row.image.naturalHeight}:null);if(b&&b.h>0)asp=b.w/b.h;}catch(_){}
 const w=h*asp;return[P.x-w/2,P.x+w/2,P.y-h,P.y];}
function covered(p,x,y,feet){if(typeof project!=='function')return false;const A=rectAt(p,x,y),area=(A[1]-A[0])*(A[3]-A[2]);if(!(area>0))return false;const d0=x+y;
 for(const[q,f]of feet){if(q===p||!(f.x+f.y>d0+.05)||Math.abs(f.x-x)>4||Math.abs(f.y-y)>4)continue;const B=rectAt(q,f.x,f.y),ix=Math.min(A[1],B[1])-Math.max(A[0],B[0]),iy=Math.min(A[3],B[3])-Math.max(A[2],B[2]);if(ix>0&&iy>0&&ix*iy>.25*area)return true;}return false;}
function unwall(r,rep,sampler=samplesOf,budget=14){const L=r.exploration,avoid=avoidPoints(r),lights=r92Lights(r),F=flipCtx(),on=r111On(),t0=now(),sig=rep.wallSig;let pending=0,waiting=0,feet=null;
 for(const p of byCamera(r.props)){if(now()-t0>budget){pending++;break;}/* 한 번에 budget ms 까지만 — 남은 것은 곧 이어서(유휴 시간) */if(!p||p.r412Wall||!shown(p)||untouchable(p)||OWN_PAINT(p)||!Number.isFinite(p.x+p.y)||WALLISH.test(String(p.id||'')+' '+artOf(p)))continue;
  why='wait';const S=sampler(p);if(!S){if(why==='none'&&artReady(p)){p.r412Wall=1;stats.unseen++;continue;}const t=now();if(p.r412Visit!==visit||!p.r412Since){p.r412Visit=visit;p.r412Since=t;}if(t-p.r412Since>WAIT_MS)p.r412Wall=1;else waiting++;continue;}/* 그림이 아직 안 읽힌 것은 방문마다 20초까지 기다린다 */
  const again=p.r412Sig!=null;p.r412Sig=sig;// 잰 때의 벽 서명 — 벽이 바뀌면 다시 잰다(다시 잰 것은 두 번 세지 않는다)
  const counted=()=>{if(again)stats.remeasured++;else stats.measured++;};
  if(S.length<6){p.r412Wall=1;counted();continue;}
  const V=footOf(p,on,F),fx=V.x,fy=V.y,ind=indoorFor(rep,p);// 보이는 발 자리
  const lim=Math.floor(LIMIT*S.length),n0=embedded(L,fx,fy,S,Infinity,ind);if(n0<=lim){p.r412Wall=1;p.r412Foot=[fx,fy];counted();continue;}
  feet=feet||feetOf(r,on,F);const d0=pathD(r,fx,fy),near0=nearAny(avoid,fx,fy),onFloor=!blocked(L,fx,fy,.02);
  // 벽에 든 점들의 무게중심 반대쪽부터 본다
  let cx=0,cy=0;for(const[a,b,z]of S)if(solidAt(L,fx+a,fy+b,z,ind)){cx+=a;cy+=b;}const cl=Math.hypot(cx,cy)||1;
  const dirs=DIR8.map(d=>[d,-(d[0]*cx+d[1]*cy)/cl]).filter(([,k])=>k>-.2).sort((a,b)=>b[1]-a[1]).map(([d])=>d);
  let best=null,cut=false;const tries=p.r412Tries||0,ds=tries>=2?.3:.1,D3=tries>=2?dirs.slice(0,3):dirs;/* 세 번째부터는 성기게(0.3칸·앞 3방향) — 끝없이 길어지지 않게(심사 지적) */
  for(let s=ds;s<=1.81&&!best;s+=ds){if(tries<2&&now()-t0>budget*2){cut=true;break;}/* 한 조형물 찾기가 길면 다음 차례에 처음부터(두 번까지) */
   for(const[dx,dy]of D3){const x=fx+dx*s,y=fy+dy*s;
    if(!footOk(L,x,y,ind,onFloor)||crowdedF(feet,p,x,y,.75))continue;if(!near0&&nearAny(avoid,x,y))continue;if(pathD(r,x,y)<Math.min(d0,PATH_BAND))continue;if(lights.some(l=>Math.hypot(l.x-x,l.y-y)<1))continue;
    const n=embedded(L,x,y,S,lim,ind);if(n<=lim&&(!best||n<best.n)&&!covered(p,x,y,feet))best={x,y,n,s};}}
  if(cut){p.r412Tries=tries+1;if(!again)delete p.r412Sig;pending++;break;}
  p.r412Wall=1;counted();if(!p.r412Emb){p.r412Emb=1;stats.embedded++;rep.embedded++;}// 벽에 든 조형물은 한 번만 센다(벽이 바뀌어 다시 잰 것 포함)
  // R412-10d 심사: 벽에 기대는 가구(캐비닛·선반·장롱)는 0.6칸 넘게 끌어내면 바닥 한가운데 홀로 선 것처럼 보인다 → 그만큼 못 붙이면 R303 처럼 숨긴다
  if(best&&best.s>WALL_FURN_MAX&&WALL_FURN.test(String(p.id||'')+' '+artOf(p))&&!p.r406Boss&&!SCENE(p)){p.r303Hide='r412-wall';feet.delete(p);stats.hidden++;rep.hidden=(rep.hidden||0)+1;stats.wallFurnHidden=(stats.wallFurnHidden||0)+1;continue;}
  if(best){const was0={x:fx,y:fy,embedded:+(n0/S.length).toFixed(3)};try{was0.via=setFoot(p,best.x,best.y,on,F);const v=footOf(p,on,F);p.r412Foot=[v.x,v.y];const first=!p.r412Moved;p.r412Moved=first?was0:{...p.r412Moved,via:was0.via,again:(p.r412Moved.again||0)+1};feet.set(p,{x:best.x,y:best.y});if(first){stats.unwalled++;rep.unwalled++;}}catch(e){fail(e);}}
  else{stats.stuck++;p.r412Foot=[fx,fy];const sid=String(p.id||artOf(p)).slice(-48);if(!rep.stuck.includes(sid))rep.stuck.push(sid);
   // 1.8칸 안에 벽 밖 자리가 없고 그림의 15% 넘게 벽 속이면 그 장식은 숨긴다(R303 이 벽 자리를 못 찾은 장식을 숨기는 것과 같은 표시)
   if(n0/S.length>HIDE_OVER&&!p.r406Boss){p.r303Hide='r412-wall';feet.delete(p);stats.hidden++;rep.hidden=(rep.hidden||0)+1;}}}
 return{pending,waiting};}

// ② 등불 솎기
// 정본 장면에 골라 놓은 서사 소품(R80 장면 소품·R81 장면)은 등불이어도 솎지 않는다(R412-10 심사: dist03 의식 고리 곁 붉은 촛대·화로가 빠져 장면 초점광이 사라짐)
const WALL_FURN=/cabinet|shelf|shelves|bookcase|wardrobe|locker|cupboard/i,WALL_FURN_MAX=.6;
const SCENE=p=>!!(p&&(p.r80Dressing||/^r8[01]:scene:/.test(String(p.id||''))));
function lamps(r,rep,indoor){const L=r.exploration,on=r111On(),F=flipCtx(),list=(r.props||[]).filter(p=>shown(p)&&!untouchable(p)&&!OWN_PAINT(p)&&!p.r117Scene&&!SCENE(p)&&Number.isFinite(p?.x+p?.y)&&isLamp(p));stats.lampsSeen+=list.length;rep.lamps=list.length;if(list.length<2)return;
 const floor=(L.floorCells||[]).length||400,SP=indoor?6.5:8,cap=Math.max(2,Math.round(floor/(indoor?110:320)))/* R412-10d 심사: 실내도 등불 둘은 남긴다(murder01 유일한 등이 빠지던 것) */;
 const others=(r.props||[]).filter(q=>shown(q)&&!isLamp(q)&&Number.isFinite(q?.x+q?.y)&&!q.terrainWall).map(q=>footOf(q,on,F));
 const W=R406()?.walls;
 const score=p=>{const v=footOf(p,on,F),w=typeof W==='function'?(W(L,v.x,v.y)[0]?.d??9):9;let f=9;for(const q of others){const d=Math.hypot(q.x-v.x,q.y-v.y);if(d<f)f=d;}
  return (w<=1.3?2:0)+(f>=1.1&&f<=3.2?1:0)-(f<.95?1.5:0)+(!indoor&&isFlame(p)?1:0)+(h32(p.id||p.x+','+p.y)%997)/1e4;};/* R412 심사: 장면 소품 곁 촛대가 늘 빠지던 감점(3)을 줄이고, 야외는 불꽃을 전기 등보다 먼저 남긴다 */
 const ranked=list.map(p=>[p,score(p)]).sort((a,b)=>b[1]-a[1]),keep=[];
 for(const[p,s]of ranked){const v=footOf(p,on,F);if(keep.length<cap&&s>-2&&keep.every(q=>{const u=footOf(q,on,F);return Math.hypot(u.x-v.x,u.y-v.y)>=SP;}))keep.push(p);}
 // 야외 불빛 지역에서 불꽃(촛대·화로·횃불)이 하나도 안 남으면 가장 나은 불꽃 하나를 남긴다(가장 낮은 것과 바꾸거나 더한다) — dist03 에서 불빛이 다 사라지던 것(심사 지적)
 if(!indoor&&!keep.some(isFlame)){const c=ranked.find(([p,s])=>isFlame(p)&&s>-3&&!keep.includes(p));if(c){if(keep.length>=cap)keep.pop();keep.push(c[0]);rep.flameKept=1;}}
 const drop=new Set(list.filter(p=>!keep.includes(p)));rep.lampsKept=keep.length;if(!drop.size)return;
 r.r412Lamps=r.r412Lamps||[];for(let i=r.props.length-1;i>=0;i--){const p=r.props[i];if(drop.has(p)){r.r412Lamps.push({prop:p,index:i});r.props.splice(i,1);}}
 stats.lampsRemoved+=drop.size;rep.lampsRemoved=drop.size;ver++;
 // R303·R406 은 소품 수로 새 소품을 알아챈다 → 뺀 직후 다시 세게 한다(뺀 수만큼 늦은 가구가 붙어 수가 같아지면 그 가구를 놓치던 것, 심사 지적)
 try{R303()?.apply?.(r);}catch(e){fail(e);}try{R406()?.apply?.(r);}catch(e){fail(e);}}

// ③ 벽 가구 방향 — R80 가구 그림(정면이 +y, 화면 왼쪽 아래)·R303 벽 캐비닛: 뒷벽 1.2칸 안이면 -x 벽은 뒤집고 -y 벽은 그대로(R303·R406 규칙).
//   R140(장식 절반을 좌우로 뒤집어 다양하게)이 같은 소품을 한 번 더 뒤집으면 R303 뒤집기와 상쇄돼 가구가 벽을 옆으로 보고 섰다
//   (측정: 뒷벽 R80 가구의 뒤집힘이 벽 방향과 따로 놀았다) → R140 이 뒤집을 소품은 반대로 맞춰 결과가 벽 방향이 되게 한다.
const R80ART=/world-r80\/(refined-r85-)?r80-\d+\.webp$/,FREE_STANDING=/r80-(142|145|146|149)\.webp$/,NATIVE_X=/r80-(021|024)\.webp$/;/* NATIVE_X: 정면이 +x(화면 오른쪽 아래)·긴 변이 오른쪽 위로 오르는 그림 — 소파 r80-024·쓰러진 기둥 r80-021(153장 눈으로 확인, 나머지 벽 가구는 +y) */// 침대·의자·탁자·휠체어는 홀로 서는 가구
// R80 그림은 발이 그림 가운데가 아닌 곳(pivot)에 있다(소파 r80-024 는 가로 26.6%) → 좌우를 뒤집으면 몸이 옆으로 돌아가 이웃 뒤로 숨었다(ep1b02 소파, 심사 검증).
//  → 뒤집을 때 발을 화면 가로(벽을 따라가는 평면 위, 3D 판은 그대로)로 옮겨 몸 가운데를 제자리에 둔다. 값은 화면 오른쪽 거리(칸, 월드 (+d,−d)).
function pivotShift(p,art){try{const A=window.__STORYWORLD_ASSETS_R80_DATA__?.assets,m=/(r80-\d+)\.webp$/.exec(art),a=A?(A[p.r80Art]||(m&&A[m[1]])):null,pv=a?.frame?.pivot;
 if(!a||!Array.isArray(pv)||!(a.width>0&&a.height>0))return 0;return (.5-pv[0]/a.width)*(+a.scale||1)*(a.width/a.height)*66*2/68;}catch(_){return 0;}}
function face(r,rep){const L=r.exploration,W=R406()?.walls;if(typeof W!=='function')return;const F=flipCtx(),on=r111On();
 for(const p of r.props){if(!p||p.r412Face||!shown(p)||untouchable(p)||OWN_PAINT(p)||!Number.isFinite(p.x+p.y))continue;p.r412Face=1;const art=artOf(p),cab=p.r303Wall==='w'||p.r303Wall==='n';
  if(!cab&&(!R80ART.test(art)||FREE_STANDING.test(art)))continue;
  let side=cab?(p.r303Wall==='w'?'-x':'-y'):null;if(!side){const back=W(L,p.x,p.y).filter(q=>(q.dx<0||q.dy<0)&&q.d<=1.2)[0];if(!back)continue;side=back.side;}
  const flip=(NATIVE_X.test(art)?side==='-y':side==='-x')!==r140Flips(p,F);if(!!p.r303Flip!==flip){const v=footOf(p,on,F),had=on&&p.r111To,m0=mirrored(p,F);changed(p);ver++;if(flip)p.r303Flip=true;else delete p.r303Flip;
   const m1=mirrored(p,F),k=m0!==m1?pivotShift(p,art):0;if(Math.abs(k)>.01){const d=m1?k:-k;setFoot(p,v.x+d,v.y-d,on,F);p.r412Pivot=+d.toFixed(3);}else if(had)setFoot(p,v.x,v.y,on,F);/* 그림만 뒤집고 몸 자리는 그대로 */stats.faced++;rep.faced++;}p.r412Face=side;}}
// R303·R406 이 이 방을 먼저 다 본 뒤에 손댄다(그 둘이 옮기고 뒤집은 결과 위에서 재고 맞춘다)
function ready(r){try{const a=R303(),b=R406();const ra=!a||a.inspect?.().on===false||!!a.inspect?.().room,rb=!b||b.inspect?.().prefs?.on===false||!!b.inspect?.().room;return ra&&rb;}catch(_){return true;}}

function indoorOf(r){try{return !!R406()?.indoorOf?.(r);}catch(_){return false;}}
const done=new WeakMap(),reports=new WeakMap();
// 잰 뒤에 보이는 발 자리가 바뀐 조형물은 그 자리에서 다시 잰다(R412-8). R111 벽 간격(spaceProps)은 방마다 첫 게임 틱에 한 번 r111To 를
//  정하는데, 사몽 구역은 R115 벽 손질을 기다릴 일이 없어 R412 가 그보다 먼저 재고 옮겼다 → R111 이 r111To 를 덮어쓰고, 거울(R303 뒤집기)
//  때문에 그 자리가 벽 속(사몽 장롱 214점 중 214점)으로 그려졌다(전 지역 측정 rev 7). R303 이 늦게 뒤집는 것도 같은 길로 잡힌다.
//  같은 방문에 한 조형물은 세 번까지만 다시 잰다(서로 덮어쓰는 고리 막기).
function refoot(r,rep){if(!prefs.unwall)return 0;const on=r111On(),F=flipCtx();let n=0;
 for(const p of r.props){const f=p&&p.r412Foot;if(!f||!p.r412Wall||p.r303Hide)continue;const v=footOf(p,on,F);if(Math.abs(v.x-f[0])<.01&&Math.abs(v.y-f[1])<.01)continue;
  if(p.r412RefootVisit!==visit){p.r412RefootVisit=visit;p.r412Refoot=0;}if(p.r412Refoot>=3)continue;p.r412Refoot++;delete p.r412Wall;delete p.r412Tries;delete p.r412Foot;n++;}
 if(n){stats.refooted+=n;rep.refooted=(rep.refooted||0)+n;}return n;}
function newRep(r,sig){return{room:r.id,zone:r.exploration.samongR115?.zone||null,indoor:indoorOf(r),embedded:0,unwalled:0,stuck:[],hidden:0,lamps:0,lampsRemoved:0,lampsKept:0,faced:0,n:-1,pending:0,waiting:0,lampsDone:false,wallSig:sig,remeasured:0};}
// R412 심사(VFX): 입장 뒤 0.9~12초 늦게 등불이 꺼지고 가구가 뒤집히던 팝 → 방을 만들 때(첫 그리기 전) R303·R406 을 먼저 마치게 하고 방향·등불을 바로 정한다
//  (둘 다 그림·R115 벽 높이가 필요 없다). 벽 빼기(unwall)는 그림을 그려 봐야 해서 아래 그리기 감싸기로 잠깐 감췄다가 나타나게 한다.
// 실제 플레이(started)에서만: 게임을 시작하지 않은 검사 하네스의 getRoom 은 조형물 자리·목록을 그대로 둔다(R412-10)
function early(r){if(!prefs.on||!r?.exploration||!Array.isArray(r.props))return;if(typeof started==='undefined'||!started)return;fresh();
 try{R303()?.apply?.(r);}catch(e){fail(e);}try{R406()?.apply?.(r);}catch(e){fail(e);}
 let rep=reports.get(r);if(!rep||done.get(r)!==r.exploration){rep=newRep(r,wallSig(r.exploration));reports.set(r,rep);done.set(r,r.exploration);stats.rooms++;}
 try{if(prefs.face)face(r,rep);if(prefs.lamps&&!rep.lampsDone){lamps(r,rep,rep.indoor);rep.lampsDone=true;}stats.early=(stats.early||0)+1;}catch(e){fail(e);}rep.n=-1;}
try{if(typeof makeRoom==='function'){const base=makeRoom;makeRoom=function(...a){const r=base.apply(this,a);try{early(r);}catch(e){fail(e);}return r;};}}catch(e){fail(e);}
// 그리기 감싸기: ① 방에 들어온 뒤 HOLD_MS 안에는 아직 안 잰(벽 빼기 대상) 조형물을 그리지 않는다 → 잰 자리에서 FADE_MS 동안 나타난다.
//  ② 이미 보인 조형물을 옮기거나 뒤집으면(changed → fadeT) 새 모습이 FADE_MS 동안 나타난다. bodyOf 로 잴 때는 그대로 그린다.
const HOLD_MS=2500,FADE_MS=200;
function holdable(p,d){if(d.eligV!==visit){d.eligV=visit;d.elig=!!(shown(p)&&!untouchable(p)&&!OWN_PAINT(p)&&Number.isFinite(p.x+p.y)&&!WALLISH.test(String(p.id||'')+' '+artOf(p)));}return d.elig;}
// 감출 때도 그리기는 한다(아주 옅게): 그리기 명령을 세는 검사·그림 미리 읽기가 끊기지 않게(R412-10)
const HELD_ALPHA=.04;
function faint(base,self,args,k){ctx.save();try{ctx.globalAlpha*=k;return base.apply(self,args);}finally{ctx.restore();}}
function installDraw(){if(typeof drawProp!=='function')return false;const base=drawProp;
 drawProp=function(p,...a){if(!p||measuring||!prefs.on||!prefs.unwall||typeof room==='undefined'||!room)return base.apply(this,[p,...a]);
  try{if(room!==lastRoom){lastRoom=room;visit++;visitAt=now();}
   const d=ds(p);
   if(!p.r412Wall&&now()-visitAt<HOLD_MS&&!loading&&holdable(p,d)){d.held=visit;stats.held=(stats.held||0)+1;return faint(base,this,[p,...a],HELD_ALPHA);}
   if(d.held===visit&&p.r412Wall){d.held=0;if(d.drawn!==visit)d.fadeT=now();}
   const t=d.fadeT?(now()-d.fadeT)/FADE_MS:1;d.drawn=visit;
   if(t<1&&t>=0)return faint(base,this,[p,...a],Math.max(HELD_ALPHA,t*t*(3-2*t)));
   if(d.fadeT)d.fadeT=0;}catch(e){fail(e);}
  return base.apply(this,[p,...a]);};return true;}
let drawInstalled=false;try{drawInstalled=installDraw();}catch(e){fail(e);}
function apply(r,opt={}){if(!prefs.on||!r?.exploration||!Array.isArray(r.props))return null;fresh();const L=r.exploration;
 if(!opt.force&&typeof room!=='undefined'&&r===room){if(!ready(r))return null;if(!wallsDressed(L)&&now()-visitAt<WALL_WAIT_MS){stats.wallWaits++;return null;}}
 const first=done.get(r)!==r.exploration,sig=wallSig(L);let rep=reports.get(r);
 if(first){rep=newRep(r,sig);stats.rooms++;}
 const refooted=!first&&rep?refoot(r,rep):0;
 if(!first&&rep&&!refooted&&rep.n===r.props.length&&!rep.pending&&!rep.waiting&&rep.wallSig===sig)return rep;
 // 벽이 바뀌었다(같은 배치에서 벽 높이·개수가 달라짐) → 벽 격자를 버리고, 그 전 벽으로 잰 조형물을 다시 잰다(숨긴 것은 그대로)
 if(rep&&rep.wallSig!==sig){wallGrid.delete(L);floorSets.delete(L);for(const p of r.props)if(p&&p.r412Wall&&p.r412Sig!=null&&p.r412Sig!==sig&&!p.r303Hide){delete p.r412Wall;delete p.r412Tries;}rep.wallSig=sig;rep.remeasured++;}
 try{if(prefs.face)face(r,rep);if(prefs.lamps&&!rep.lampsDone){lamps(r,rep,rep.indoor);rep.lampsDone=true;}
  if(prefs.unwall){const w=unwall(r,rep,typeof opt.samples==='function'?opt.samples:samplesOf,Number.isFinite(opt.budget)?opt.budget:14);rep.pending=w.pending;rep.waiting=w.waiting;}}catch(e){fail(e);}
 rep.n=r.props.length;done.set(r,r.exploration);reports.set(r,rep);return rep;}
// 방에 들어오면(로딩 끝) R303·R406 을 먼저 마치게 하고 바로 이어서 잰다. 남은 일이 있으면 유휴 시간마다 4~10ms 씩 이어 가서
//  조형물이 들어온 뒤 몇 초씩 늦게 움직이지 않게 한다. 다 끝난 방은 0.9초마다 소품 수만 본다(늦게 붙는 R224 가구·R406 보스 소품).
//  R303·R406 은 매번 먼저 따라잡게 한다(둘 다 바뀐 게 없으면 바로 돌아온다) — 늦게 붙은 가구를 R406 이 놓기 전에 R412 가 재고 돌리면
//  R406 이 그 뒤에 옮기고 뒤집어 R412 의 결과를 되돌렸다(심사 지적).
const IDLE=typeof requestIdleCallback==='function'?requestIdleCallback:null;
function step(d){let next=900;
 if(d&&IDLE&&typeof d.timeRemaining==='function'&&!d.didTimeout&&d.timeRemaining()<2){IDLE(step,{timeout:100});return;}/* 유휴 시간이 2ms 안 남았으면 미룬다(바쁜 프레임에 끼어들지 않게 — 심사 지적) */
 try{if(prefs.on&&typeof room!=='undefined'&&room&&!loading){
  if(room!==lastRoom){lastRoom=room;visit++;visitAt=now();}
  try{R303()?.apply?.(room);}catch(e){fail(e);}try{R406()?.apply?.(room);}catch(e){fail(e);}
  const left=d&&typeof d.timeRemaining==='function'?d.timeRemaining():8,rep=apply(room,{budget:Math.max(4,Math.min(10,left))});
  next=!rep?150:rep.pending>0?0:rep.waiting>0?300:900;}}catch(e){fail(e);}
 if(next===0&&IDLE)IDLE(step,{timeout:100});else setTimeout(step,next||32);}
setTimeout(step,0);
function set(o={}){for(const k of Object.keys(prefs))if(typeof o[k]==='boolean')prefs[k]=o[k];try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
window.__STORYWORLD_PROPS_TIDY_R412__=Object.freeze({revision:REV,set,apply,early,covered,rectAt,isFlame,NATIVE_X,HOLD_MS,FADE_MS,ver:()=>ver,isLamp,untouchable,drawState:p=>({...ds(p)}),changed,HELD_ALPHA,samplesOf,embedded,solidAt,inWallBox,bodyOf,r140Flips,mirrored,spotOf,footOf,pathD,wallSig,wallsDressed,WALLISH,LAMP,R80ART,WALL_H,
 inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},room:typeof room!=='undefined'&&room?(reports.get(room)||null):null,lastError,collisionChanged:false,savesTouched:false})});
})();
