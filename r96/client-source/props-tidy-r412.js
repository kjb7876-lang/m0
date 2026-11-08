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
//  벽 높이: R115(사몽 밖 지역 벽 높이)가 들어온 뒤 첫 게임 틱에 같은 벽 객체 높이를 1.3~1.5 → 2.85~3.31 로 올린다(측정: dist03 5초, ep1b03 11초 뒤).
//   그 전에 재면 낮은 벽 기준이라 윗부분이 벽에 든 채로 끝났다(dist03 나무 6~14%) → R115 가 이 방 벽을 손본 뒤에 재고(방문마다 12초까지만 기다림),
//   그 뒤에도 벽 개수·높이 합(서명)이 바뀌면 그 방 조형물을 다시 잰다. 서사 소품: R117 장면 등불은 솎지 않고, R406 보스 소품은 숨기지 않는다.
(()=>{'use strict';
if(window.__STORYWORLD_PROPS_TIDY_R412__)return;
const REV='R412-props-tidy-7',KEY='storyworld.r412.props';
const prefs={on:true,unwall:true,lamps:true,face:true};
try{const s=JSON.parse(localStorage.getItem(KEY)||'null');for(const k of Object.keys(prefs))if(typeof s?.[k]==='boolean')prefs[k]=s[k];}catch(_){}
const stats={rooms:0,measured:0,embedded:0,unwalled:0,stuck:0,hidden:0,unseen:0,lampsSeen:0,lampsRemoved:0,faced:0,remeasured:0,wallWaits:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.stack||e).slice(0,300);};
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
function setFoot(p,x,y,on=r111On(),F=flipCtx()){if(on&&!OWN_PAINT(p)){let dx=x-p.x,dy=y-p.y;if(mirrored(p,F))[dx,dy]=[dy,dx];Object.defineProperty(p,'r111To',{value:{x:+(p.x+dx).toFixed(3),y:+(p.y+dy).toFixed(3)},configurable:true});return 'r111To';}p.x=+x.toFixed(3);p.y=+y.toFixed(3);return 'xy';}

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
function isLamp(p){const a=artOf(p)+' '+String(p?.r74Prop||'')+' '+String(p?.r406From||'')+' '+String(p?.r406FromR74||'');return (LAMP_R74.has(p?.r74Prop)||LAMP_R74.has(p?.r406FromR74)||LAMP.test(a))&&!NOT_LAMP.test(a)&&!WALLISH.test(String(p?.id||'')+' '+artOf(p));}

// ---- 3D 판 모형(phase1 worldPoint) --------------------------------------------------------------------
//  화면 오른쪽 s(칸) → 월드 (+s/√2, −s/√2), 화면 위 h(칸) → 월드 (−h·√½/2, −h·√½/2) 뒤로 + 높이 h·√3/2. 1칸 = TILE·zoom·√2 화면 px.
const SQ=Math.SQRT1_2,BACK=.5*Math.SQRT1_2,RISE=Math.sqrt(3)/2,WALL_H=2.45,MW=20,MH=28;
const CV=typeof document!=='undefined'?document.createElement('canvas'):null,g=CV?.getContext?.('2d')||null;let rec=null;
if(CV){CV.width=1600;CV.height=1000;}
if(g){const od=g.drawImage.bind(g);g.drawImage=function(img,...a){if(rec)rec.push({img,a,m:g.getTransform(),f:String(g.filter||'')});return od(img,...a);};}
const MC=typeof document!=='undefined'?document.createElement('canvas'):null,mg=MC?.getContext?.('2d',{willReadFrequently:true})||null;if(MC){MC.width=MW;MC.height=MH;}
// 그림(이미지 객체)마다 잘라 낸 사각형별 알파 — 열쇠는 이미지 객체(data: 주소처럼 긴 src 를 열쇠로 쓰지 않는다)
const masks=new WeakMap();
function mask(img,sx,sy,sw,sh){if(!img||typeof img!=='object')return null;let M=masks.get(img);if(!M){M=new Map();masks.set(img,M);}const k=[sx,sy,sw,sh].map(v=>Math.round(v)).join(',');if(M.has(k))return M.get(k);let m=null;
 if(mg)try{mg.clearRect(0,0,MW,MH);mg.drawImage(img,sx,sy,sw,sh,0,0,MW,MH);m=mg.getImageData(0,0,MW,MH).data;}catch(e){m=null;}if(M.size>64)M.clear();M.set(k,m);return m;}
// 그 조형물을 게임 그리기 함수 그대로(덧씌운 모든 그림 규칙 포함) 화면 밖 캔버스에 한 번 그려 본체 그림의 화면 사각형을 얻는다.
//  점은 보이는 발 자리(R111 r111To 또는 x·y) 기준이다.
//  손전등 시야(R24, 모바일 기본 켜짐)는 시야 밖 조형물을 그리지 않는다 → 그리는 동안만 끄고 같은 호출 안에서 되돌린다.
function bodyOf(p){if(!g||typeof drawProp!=='function'||typeof project!=='function')return null;rec=[];const saved=ctx,cx=cam.x,cy=cam.y,F=footOf(p);let r=null,q=null;
 const SET=typeof settings!=='undefined'&&settings&&typeof settings==='object'?settings:null,had=!!SET&&Object.prototype.hasOwnProperty.call(SET,'flashlight58'),lit=SET?SET.flashlight58:undefined;
 try{if(SET)SET.flashlight58=false;cam.x=F.x;cam.y=F.y;q=project(F.x,F.y);ctx=g;g.setTransform(1,0,0,1,0,0);g.globalAlpha=1;g.filter='none';drawProp(p);if(!rec.length)drawProp(p);/* R266 은 이번 장면에 먼저 그린 소품을 한 번 건너뛴다 → 아무것도 안 그려졌으면 한 번 더 */}catch(e){fail(e);}finally{if(SET){if(had)SET.flashlight58=lit;else delete SET.flashlight58;}ctx=saved;cam.x=cx;cam.y=cy;r=rec;rec=null;}
 let best=null,ba=0;for(const d of r||[]){if(/brightness\(0/.test(d.f))continue;const a=d.a,img=d.img;let sx=0,sy=0,sw=img.naturalWidth||img.width,sh=img.naturalHeight||img.height,dx,dy,dw,dh;
  if(a.length===8)[sx,sy,sw,sh,dx,dy,dw,dh]=a;else if(a.length===4)[dx,dy,dw,dh]=a;else{[dx,dy]=a;dw=sw;dh=sh;}
  const m=d.m,X=[dx,dx+dw].map(x=>m.a*x+m.e),Y=[dy,dy+dh].map(y=>m.d*y+m.f),area=Math.abs((X[1]-X[0])*(Y[1]-Y[0]));
  if(area>ba){ba=area;best={img,src:[sx,sy,sw,sh],x0:Math.min(...X),x1:Math.max(...X),y0:Math.min(...Y),y1:Math.max(...Y),flip:m.a*Math.sign(dw||1)<0,qx:q.x,qy:q.y};}}
 return best;}
// R99 흔들리는 나무는 12장(0.1초씩)이 번갈아 그려진다 → 한 장만 재면 다른 장의 가지가 벽에 다시 든다 → 12장 알파를 합쳐 잰다.
//  아직 안 읽힌 장이 있으면 8초까지는 기다리고(null), 그 뒤에는 읽힌 장만 합친다.
const R99_FRAMES=12;
let visit=0,lastRoom=null,visitAt=-1e9;// 방에 들어올 때마다 1 늘린다 — 그림 기다리기(r412Since)·벽 높이 기다리기는 방문마다 새로 센다
function swayUnion(p,b,m){const kind=p?.r99Tree?.kind;if(!kind||typeof readyImage!=='function')return m;const u=new Uint8ClampedArray(m),whole=b.src[0]===0&&b.src[1]===0;let miss=0;
 for(let i=0;i<R99_FRAMES;i++){let row=null;try{row=readyImage('assets/r99/outdoor/tree-'+kind+'-'+String(i).padStart(2,'0')+'.webp');}catch(_){}const im=row?.image;if(!im||!(im.naturalWidth>0)){miss++;continue;}
  const mm=mask(im,...(whole?[0,0,im.naturalWidth,im.naturalHeight]:b.src));if(!mm){miss++;continue;}for(let j=3;j<u.length;j+=4)if(mm[j]>u[j])u[j]=mm[j];}
 return miss&&(!p.r412Since||p.r412Visit!==visit||now()-p.r412Since<8000)?null:u;}
// 불투명 픽셀 → 보이는 발 기준 3D 점 [dx,dy,z]. 못 얻으면 null 이고 까닭을 why 에 남긴다('none' = 그리기 사슬이 아무것도 안 그렸다).
let why='wait';
function samplesOf(p){const b=bodyOf(p);if(!b){why='none';return null;}let m=mask(b.img,...b.src);if(!m)return null;m=swayUnion(p,b,m);if(!m)return null;const ppu=TILE*zoom*Math.SQRT2,out=[];
 for(let j=0;j<MH;j++)for(let i=0;i<MW;i++){const u=b.flip?MW-1-i:i;if(m[(j*MW+u)*4+3]<80)continue;const sx=b.x0+(i+.5)/MW*(b.x1-b.x0),sy=b.y0+(j+.5)/MH*(b.y1-b.y0),s=(sx-b.qx)/ppu,h=(b.qy-sy)/ppu;
  if(h<0)continue;out.push([s*SQ-BACK*h,-s*SQ-BACK*h,RISE*h]);}
 return out.sort((a,b)=>b[2]-a[2]);}// 높은 점부터(벽에 먼저 닿는 쪽) — 후보 자리를 빨리 버린다
// 무엇이 '벽 덩어리'인가: 실내는 바닥 밖(벽 덩어리·벽 윗면 어둠)도 벽으로 본다. 실외(R406 indoorOf 가 아닌 곳, R99 나무는 늘)는 바닥 밖이
//  탁 트인 땅·숲 가장자리라 벽 상자(L.walls, 그 높이까지)만 벽으로 본다 — 숲 가장자리 나무를 벽 속으로 잘못 읽어 바닥 쪽으로 끌어오거나 숨기지 않게.
const wallGrid=new WeakMap(),GC=4;
// 벽 서명(개수·높이 합) — 같은 벽 객체의 높이가 그 자리에서 바뀌어도(R115) 알아챈다. apply 가 한 번씩만 보고, 바뀌면 격자를 버리고 다시 잰다.
function wallSig(L){const W=L?.walls;if(!Array.isArray(W))return '0';let s=0;for(const w of W)if(w&&Number.isFinite(w.height))s+=w.height;return W.length+':'+Math.round(s*100);}
// R115 가 이 방(사몽 밖) 벽 높이를 아직 손보지 않았으면 false — 손본 벽에는 r115Wall(원래 높이)이 붙는다
function wallsDressed(L){try{const P=window.__STORYWORLD_PLAY_R115__;if(!P||P.prefs?.().walls===false||!L||L.samongR103||L.samongR115||!Array.isArray(L.walls))return true;
 for(const w of L.walls)if(w&&Number.isFinite(w.height))return w.r115Wall!=null;return true;}catch(_){return true;}}
const WALL_WAIT_MS=12000;
function wallBoxes(L){let m=wallGrid.get(L);if(m)return m;m=new Map();
 for(const w of L?.walls||[]){if(!w||!Number.isFinite(w.x+w.y+w.width+w.depth))continue;const h=Number.isFinite(w.height)?w.height:WALL_H;if(h<.2)continue;/* 가구 충돌 상자(높이 .01)는 벽이 아니다 */
  const b={x0:w.x-w.width/2,x1:w.x+w.width/2,y0:w.y-w.depth/2,y1:w.y+w.depth/2,h};
  for(let gy=Math.floor(b.y0/GC);gy<=Math.floor(b.y1/GC);gy++)for(let gx=Math.floor(b.x0/GC);gx<=Math.floor(b.x1/GC);gx++){const k=gx+','+gy;let a=m.get(k);if(!a)m.set(k,a=[]);a.push(b);}}
 wallGrid.set(L,m);return m;}
function inWallBox(L,x,y,z,r=0){const G=wallBoxes(L);for(let gy=Math.floor((y-r)/GC);gy<=Math.floor((y+r)/GC);gy++)for(let gx=Math.floor((x-r)/GC);gx<=Math.floor((x+r)/GC);gx++){const a=G.get(gx+','+gy);if(a)for(const b of a)if(z<b.h&&x>b.x0-r&&x<b.x1+r&&y>b.y0-r&&y<b.y1+r)return true;}return false;}
// 실내 벽 덩어리 = 바닥 칸 밖(벽 높이까지) + 벽 상자(그 높이까지). 가구 충돌 상자(높이 .01)는 벽이 아니다(explorationBlocked 는 그것도 막는다).
//  바닥 칸 자료가 없거나 병원 해석형 배치면 explorationBlocked 로 본다.
const floorSets=new WeakMap();
function floorSet(L){if(!L||typeof L!=='object')return null;if(floorSets.has(L))return floorSets.get(L);const c=L.floorCells;
 const s=Array.isArray(c)&&c.length&&!L.hospitalAnalytic12?new Set(c.filter(v=>Array.isArray(v)).map(([x,y])=>Math.floor(x)+','+Math.floor(y))):null;floorSets.set(L,s);return s;}
function solidAt(L,x,y,z,indoor){if(!indoor)return inWallBox(L,x,y,z);if(!(z<WALL_H))return inWallBox(L,x,y,z);const F=floorSet(L);if(!F)return blocked(L,x,y,.02);return !F.has(Math.floor(x)+','+Math.floor(y))||inWallBox(L,x,y,z);}
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
function unwall(r,rep,sampler=samplesOf,budget=14){const L=r.exploration,avoid=avoidPoints(r),lights=r92Lights(r),F=flipCtx(),on=r111On(),t0=now(),sig=rep.wallSig;let pending=0,waiting=0,feet=null;
 for(const p of byCamera(r.props)){if(now()-t0>budget){pending++;break;}/* 한 번에 budget ms 까지만 — 남은 것은 곧 이어서(유휴 시간) */if(!p||p.r412Wall||!shown(p)||untouchable(p)||OWN_PAINT(p)||!Number.isFinite(p.x+p.y)||WALLISH.test(String(p.id||'')+' '+artOf(p)))continue;
  why='wait';const S=sampler(p);if(!S){if(why==='none'&&artReady(p)){p.r412Wall=1;stats.unseen++;continue;}const t=now();if(p.r412Visit!==visit||!p.r412Since){p.r412Visit=visit;p.r412Since=t;}if(t-p.r412Since>WAIT_MS)p.r412Wall=1;else waiting++;continue;}/* 그림이 아직 안 읽힌 것은 방문마다 20초까지 기다린다 */
  const again=p.r412Sig!=null;p.r412Sig=sig;// 잰 때의 벽 서명 — 벽이 바뀌면 다시 잰다(다시 잰 것은 두 번 세지 않는다)
  const counted=()=>{if(again)stats.remeasured++;else stats.measured++;};
  if(S.length<6){p.r412Wall=1;counted();continue;}
  const V=footOf(p,on,F),fx=V.x,fy=V.y,ind=indoorFor(rep,p);// 보이는 발 자리
  const lim=Math.floor(LIMIT*S.length),n0=embedded(L,fx,fy,S,Infinity,ind);if(n0<=lim){p.r412Wall=1;counted();continue;}
  feet=feet||feetOf(r,on,F);const d0=pathD(r,fx,fy),near0=nearAny(avoid,fx,fy),onFloor=!blocked(L,fx,fy,.02);
  // 벽에 든 점들의 무게중심 반대쪽부터 본다
  let cx=0,cy=0;for(const[a,b,z]of S)if(solidAt(L,fx+a,fy+b,z,ind)){cx+=a;cy+=b;}const cl=Math.hypot(cx,cy)||1;
  const dirs=DIR8.map(d=>[d,-(d[0]*cx+d[1]*cy)/cl]).filter(([,k])=>k>-.2).sort((a,b)=>b[1]-a[1]).map(([d])=>d);
  let best=null,cut=false;const tries=p.r412Tries||0;
  for(let s=.1;s<=1.81&&!best;s+=.1){if(tries<2&&now()-t0>budget*2){cut=true;break;}/* 한 조형물 찾기가 길면 다음 차례에 처음부터(두 번까지) */
   for(const[dx,dy]of dirs){const x=fx+dx*s,y=fy+dy*s;
    if(!footOk(L,x,y,ind,onFloor)||crowdedF(feet,p,x,y,.75))continue;if(!near0&&nearAny(avoid,x,y))continue;if(pathD(r,x,y)<Math.min(d0,PATH_BAND))continue;if(lights.some(l=>Math.hypot(l.x-x,l.y-y)<1))continue;
    const n=embedded(L,x,y,S,lim,ind);if(n<=lim&&(!best||n<best.n))best={x,y,n,s};}}
  if(cut){p.r412Tries=tries+1;if(!again)delete p.r412Sig;pending++;break;}
  p.r412Wall=1;counted();if(!p.r412Emb){p.r412Emb=1;stats.embedded++;rep.embedded++;}// 벽에 든 조형물은 한 번만 센다(벽이 바뀌어 다시 잰 것 포함)
  if(best){const was0={x:fx,y:fy,embedded:+(n0/S.length).toFixed(3)};try{was0.via=setFoot(p,best.x,best.y,on,F);const first=!p.r412Moved;p.r412Moved=first?was0:{...p.r412Moved,via:was0.via,again:(p.r412Moved.again||0)+1};feet.set(p,{x:best.x,y:best.y});if(first){stats.unwalled++;rep.unwalled++;}}catch(e){fail(e);}}
  else{stats.stuck++;const sid=String(p.id||artOf(p)).slice(-48);if(!rep.stuck.includes(sid))rep.stuck.push(sid);
   // 1.8칸 안에 벽 밖 자리가 없고 그림의 15% 넘게 벽 속이면 그 장식은 숨긴다(R303 이 벽 자리를 못 찾은 장식을 숨기는 것과 같은 표시)
   if(n0/S.length>HIDE_OVER&&!p.r406Boss){p.r303Hide='r412-wall';feet.delete(p);stats.hidden++;rep.hidden=(rep.hidden||0)+1;}}}
 return{pending,waiting};}

// ② 등불 솎기
function lamps(r,rep,indoor){const L=r.exploration,on=r111On(),F=flipCtx(),list=(r.props||[]).filter(p=>shown(p)&&!untouchable(p)&&!OWN_PAINT(p)&&!p.r117Scene&&Number.isFinite(p?.x+p?.y)&&isLamp(p));stats.lampsSeen+=list.length;rep.lamps=list.length;if(list.length<2)return;
 const floor=(L.floorCells||[]).length||400,SP=indoor?6.5:8,cap=Math.max(indoor?1:2,Math.round(floor/(indoor?110:320)));
 const others=(r.props||[]).filter(q=>shown(q)&&!isLamp(q)&&Number.isFinite(q?.x+q?.y)&&!q.terrainWall).map(q=>footOf(q,on,F));
 const W=R406()?.walls;
 const score=p=>{const v=footOf(p,on,F),w=typeof W==='function'?(W(L,v.x,v.y)[0]?.d??9):9;let f=9;for(const q of others){const d=Math.hypot(q.x-v.x,q.y-v.y);if(d<f)f=d;}
  return (w<=1.3?2:0)+(f>=1.1&&f<=3.2?1:0)-(f<.95?3:0)+(h32(p.id||p.x+','+p.y)%997)/1e4;};
 const ranked=list.map(p=>[p,score(p)]).sort((a,b)=>b[1]-a[1]),keep=[];
 for(const[p,s]of ranked){const v=footOf(p,on,F);if(keep.length<cap&&s>-2&&keep.every(q=>{const u=footOf(q,on,F);return Math.hypot(u.x-v.x,u.y-v.y)>=SP;}))keep.push(p);}
 const drop=new Set(list.filter(p=>!keep.includes(p)));rep.lampsKept=keep.length;if(!drop.size)return;
 r.r412Lamps=r.r412Lamps||[];for(let i=r.props.length-1;i>=0;i--){const p=r.props[i];if(drop.has(p)){r.r412Lamps.push({prop:p,index:i});r.props.splice(i,1);}}
 stats.lampsRemoved+=drop.size;rep.lampsRemoved=drop.size;
 // R303·R406 은 소품 수로 새 소품을 알아챈다 → 뺀 직후 다시 세게 한다(뺀 수만큼 늦은 가구가 붙어 수가 같아지면 그 가구를 놓치던 것, 심사 지적)
 try{R303()?.apply?.(r);}catch(e){fail(e);}try{R406()?.apply?.(r);}catch(e){fail(e);}}

// ③ 벽 가구 방향 — R80 가구 그림(정면이 +y, 화면 왼쪽 아래)·R303 벽 캐비닛: 뒷벽 1.2칸 안이면 -x 벽은 뒤집고 -y 벽은 그대로(R303·R406 규칙).
//   R140(장식 절반을 좌우로 뒤집어 다양하게)이 같은 소품을 한 번 더 뒤집으면 R303 뒤집기와 상쇄돼 가구가 벽을 옆으로 보고 섰다
//   (측정: 뒷벽 R80 가구의 뒤집힘이 벽 방향과 따로 놀았다) → R140 이 뒤집을 소품은 반대로 맞춰 결과가 벽 방향이 되게 한다.
const R80ART=/world-r80\/(refined-r85-)?r80-\d+\.webp$/,FREE_STANDING=/r80-(142|145|146|149)\.webp$/;// 침대·의자·탁자·휠체어는 홀로 서는 가구
function face(r,rep){const L=r.exploration,W=R406()?.walls;if(typeof W!=='function')return;const F=flipCtx(),on=r111On();
 for(const p of r.props){if(!p||p.r412Face||!shown(p)||untouchable(p)||OWN_PAINT(p)||!Number.isFinite(p.x+p.y))continue;p.r412Face=1;const art=artOf(p),cab=p.r303Wall==='w'||p.r303Wall==='n';
  if(!cab&&(!R80ART.test(art)||FREE_STANDING.test(art)))continue;
  let side=cab?(p.r303Wall==='w'?'-x':'-y'):null;if(!side){const back=W(L,p.x,p.y).filter(q=>(q.dx<0||q.dy<0)&&q.d<=1.2)[0];if(!back)continue;side=back.side;}
  const flip=(side==='-x')!==r140Flips(p,F);if(!!p.r303Flip!==flip){const v=footOf(p,on,F),had=on&&p.r111To;if(flip)p.r303Flip=true;else delete p.r303Flip;if(had)setFoot(p,v.x,v.y,on,F);/* 그림만 뒤집고 보이는 자리는 그대로 */stats.faced++;rep.faced++;}p.r412Face=side;}}
// R303·R406 이 이 방을 먼저 다 본 뒤에 손댄다(그 둘이 옮기고 뒤집은 결과 위에서 재고 맞춘다)
function ready(r){try{const a=R303(),b=R406();const ra=!a||a.inspect?.().on===false||!!a.inspect?.().room,rb=!b||b.inspect?.().prefs?.on===false||!!b.inspect?.().room;return ra&&rb;}catch(_){return true;}}

function indoorOf(r){try{return !!R406()?.indoorOf?.(r);}catch(_){return false;}}
const done=new WeakMap(),reports=new WeakMap();
function apply(r,opt={}){if(!prefs.on||!r?.exploration||!Array.isArray(r.props))return null;fresh();const L=r.exploration;
 if(!opt.force&&typeof room!=='undefined'&&r===room){if(!ready(r))return null;if(!wallsDressed(L)&&now()-visitAt<WALL_WAIT_MS){stats.wallWaits++;return null;}}
 const first=done.get(r)!==r.exploration,sig=wallSig(L);let rep=reports.get(r);
 if(first){rep={room:r.id,zone:r.exploration.samongR115?.zone||null,indoor:indoorOf(r),embedded:0,unwalled:0,stuck:[],hidden:0,lamps:0,lampsRemoved:0,lampsKept:0,faced:0,n:-1,pending:0,waiting:0,lampsDone:false,wallSig:sig,remeasured:0};stats.rooms++;}
 if(!first&&rep&&rep.n===r.props.length&&!rep.pending&&!rep.waiting&&rep.wallSig===sig)return rep;
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
 try{if(prefs.on&&typeof room!=='undefined'&&room&&!loading){
  if(room!==lastRoom){lastRoom=room;visit++;visitAt=now();}
  try{R303()?.apply?.(room);}catch(e){fail(e);}try{R406()?.apply?.(room);}catch(e){fail(e);}
  const left=d&&typeof d.timeRemaining==='function'?d.timeRemaining():8,rep=apply(room,{budget:Math.max(4,Math.min(10,left))});
  next=!rep?150:rep.pending>0?0:rep.waiting>0?300:900;}}catch(e){fail(e);}
 if(next===0&&IDLE)IDLE(step,{timeout:100});else setTimeout(step,next||32);}
setTimeout(step,0);
function set(o={}){for(const k of Object.keys(prefs))if(typeof o[k]==='boolean')prefs[k]=o[k];try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
window.__STORYWORLD_PROPS_TIDY_R412__=Object.freeze({revision:REV,set,apply,isLamp,untouchable,samplesOf,embedded,solidAt,inWallBox,bodyOf,r140Flips,mirrored,spotOf,footOf,pathD,wallSig,wallsDressed,WALLISH,LAMP,R80ART,WALL_H,
 inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},room:typeof room!=='undefined'&&room?(reports.get(room)||null):null,lastError,collisionChanged:false,savesTouched:false})});
})();
