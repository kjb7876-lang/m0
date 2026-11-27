// R1371 2D 몹·보스 최종 좌우 한 곳에서 맞추기 — 사용자 2026-11-27 "흑장미 귀막은신도는 왜 공격할때 뒤를보고 공격하냐 이러한문제 일어나지 않게해줘 특히 2d몹과 보스들".
//  원인(헤드리스 탐침 qa/r1371/face-probe.mjs, 공격을 강제로 만들고 실제로 그려진 몸 명령을 읽음):
//   · 흑장미 귀막은 신도(cult01 c101-e2)의 그림 censer-priest(R223 → R275 사본)는 오른쪽을 보는 그림인데, R223 그림 목록(assets/r223/mobs/index.json)에
//     facing 'left' 로 적혀 있었다. R208 공급자는 '왼쪽 그림이면 반대로 뒤집기'를 하므로 영웅이 오른쪽이면 왼쪽을, 왼쪽이면 오른쪽을 보고 향로를 휘둘렀다
//     (대기·걷기도 같이 반대였지만 공격 때 팔·향로가 뒤로 뻗어 눈에 띄었다).
//   · 같은 종류의 실수가 다시 생기는 길: 그림 공급자가 열 곳 넘게(R208·R223·R248·R380·R1065·R620·R104 …) 저마다 '원본 그림이 보는 쪽'을 따로 적고 뒤집는다.
//     어느 한 곳의 표가 틀리면 그 몹만 뒤를 보고, R444(원하는 쪽)·R1226(일반몹 표) 은 그 표가 맞다고 믿는다.
//  고친 것(그림만 — 판정·피해·이동·시간·저장은 그대로):
//   · 사람이 그림을 눈으로 보고 맞춘 '원본이 보는 쪽' 표 하나(enemy-face-truth-r1371-data.js, 시트·칸 단위 'L'/'R'/'F')를 둔다.
//   · 매 프레임 그리기 기록이 끝나는 순간(기록기 finish) 몹·보스마다 몸 그림 명령을 찾아, 그린 쪽 = 원본 쪽 ⊕ 거울 이
//     R444 가 정한 쪽(공격 중엔 공격 각 쪽, 걷기는 실제 걸음 쪽)과 다르면 같은 그림 명령(겹 포함)을 발 세로선 기준으로 좌우 반전한다.
//     drawEnemy 감싸기 순서와 상관없이 맨 마지막에 한 번 돈다(감싸기 핑퐁 없음).
//   · 'F'(정면·위아래 그림)·표에 없는 그림은 건드리지 않는다. 표에 없는 2D 몸 그림은 qa/r1371 검사가 '표 누락'으로 잡는다.
//  맡지 않는 것: 페르소나·구조물 적·맘몬 구역(ep1b06·ep1b06b, 승인 규칙), 3D 로 그리는 몹·보스(몸 그림 명령이 없음).
//  끄기: localStorage storyworld.r1371.face {"on":false}.
(()=>{'use strict';
if(window.__STORYWORLD_ENEMY_FACE_FINAL_R1371__)return;
const REV='R1371-face-1',KEY='storyworld.r1371.face';
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={frames:0,bodies:0,flipped:0,kept:0,front:0,unknown:0,skipped:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const fin=Number.isFinite;
const FX=/r251\/atlas|pixelfx|\/fx\/|effect|vfx|shadow|smoke|aura|glow|halo|ring\b|sigil|telegraph/i;
const truth=()=>window.__STORYWORLD_ENEMY_FACE_TRUTH_R1371_DATA__||{};
// 몸 명령의 원래 그림 경로·칸 — 몹 캐시 캔버스는 sourcePath 가 'assets/…png:sx,sy,sw,sh:pad:enemy' 꼴, 아니면 경로 + sourceRect(R1226 artOf 와 같은 규칙)
// R409 테두리는 몸을 테와 한 장에 구워 경로가 'r409:outline:enemy:u:<원래 경로>:sx,sy,sw,sh:…' 꼴이 된다 → 앞머리를 떼면 원래 그림·칸.
const OUT=/^r409:outline:[a-z]+:[a-z]+:/;
function artOf(c){let s=String(c?.immutableTint?.r1226Src||c?.sourcePath||c?.image?.src||'');s=s.replace(OUT,'').replace(/^[a-z]+:\/\/[^/]+/i,'');const i=s.indexOf('assets/');s=i>=0?s.slice(i+7):s.replace(/^\.?\//,'');
 for(let t=s;;s=t){t=s.replace(/^r(?:99|118|425)\/clean\/assets\//,'');if(t===s)break;}
 const m=/^(.+?\.(?:png|webp|jpe?g))(?:#[^:]*)?:(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(\d+(?:\.\d+)?),(\d+(?:\.\d+)?):/i.exec(s);
 if(m)return{path:m[1],cell:Math.round(+m[2])+','+Math.round(+m[3])};
 const p=s.replace(/[?#].*$/,'');const r=Array.isArray(c?.sourceRect)?c.sourceRect:null;return{path:p,cell:r?Math.round(r[0])+','+Math.round(r[1]):null};}
// 원본 쪽: 칸 지정('경로#sx,sy') > 경로 > R1226 표(일반몹, 이미 눈으로 맞춘 값)
function faceOf(a){if(!a||!a.path)return null;const T=truth();const v=T[a.path+'#'+a.cell]||T[a.path];if(v)return v;
 try{return window.__STORYWORLD_MOB_MOTION_R1226__?.face?.(a)||null;}catch(_){return null;}}
const okPts=c=>Array.isArray(c?.points)&&c.points.length===4&&c.points.every(p=>Array.isArray(p)&&fin(p[0])&&fin(p[1]));
const area=c=>Math.abs(c.points[1][0]-c.points[0][0])*Math.abs(c.points[3][1]-c.points[0][1]);
function excluded(e){if(!e||e.persona||e.r170Tower||e.r446Pillar||e.r251Circle||e.towerR193||e.r193Tower||e.prop||e.object||e.mammon)return true;
 try{const id=String(typeof room==='object'&&room?room.id||'':'');if(/mammon/i.test(id)||/^ep1b06/.test(id))return true;}catch(_){}return false;}
function wantLeft(e){try{const v=window.__STORYWORLD_ENEMY_FACE_R444__?.left?.(e);return typeof v==='boolean'?v:null;}catch(_){return null;}}
// 명령 주인 id 는 'enemy:<id>'·'r248:mob:<id>'·'enemy:<id>:r373c0'(겹) 꼴 → id 가 ':' 경계로 들어 있으면 같은 몹.
const esc=v=>String(v).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function enemyFor(id,map){if(map.has(id))return map.get(id);let hit=null;try{const s=String(id);for(const e of room.enemies){if(!e||e.id==null)continue;if(e.id===id||new RegExp('(^|:)'+esc(e.id)+'($|:)').test(s)){hit=e;break;}}}catch(_){}map.set(id,hit);return hit;}
const artKey=c=>{const a=artOf(c);return a.path+'#'+a.cell;};
// 한 프레임의 명령 전체를 보고 몹마다 몸 그림의 좌우를 맞춘다.
function fix(cmds){if(!prefs.on||!Array.isArray(cmds)||!cmds.length)return;if(typeof room!=='object'||!room||!Array.isArray(room.enemies)||typeof project!=='function')return;
 stats.frames++;const groups=new Map(),ids=new Map();
 for(const c of cmds){if(c?.kind!=='image'||c.owner?.kind!=='enemy'||!okPts(c))continue;const k=c.owner.id;let g=groups.get(k);if(!g)groups.set(k,g=[]);g.push(c);}
 for(const [id,list] of groups){try{const e=enemyFor(id,ids);if(!e||excluded(e)){stats.skipped++;continue;}
  let b=null,ba=0;for(const c of list){const src=String(c.sourcePath||c.image?.src||'').replace(OUT,'');if(FX.test(src))continue;const s=area(c);if(s>ba){ba=s;b=c;}}
  if(!b)continue;stats.bodies++;const f=faceOf(artOf(b));if(f!=='L'&&f!=='R'){if(f)stats.front++;else stats.unknown++;continue;}
  const want=wantLeft(e);if(want==null){stats.skipped++;continue;}
  const mir=b.points[1][0]<b.points[0][0],left=(f==='L')!==mir;if(left===want){stats.kept++;continue;}
  const q=project(e.x,e.y);if(!q||!fin(q.x))continue;const fx=q.x;
  const key=artKey(b);for(const c of list)if(c===b||artKey(c)===key)c.points=c.points.map(p=>[2*fx-p[0],p[1]]);stats.flipped++;
 }catch(err){fail(err);}}}
// 기록기 finish 를 프로토타입에서 한 번 감싼다(인스턴스가 바뀌어도 같은 클래스).
let hooked=null;
// 기록기 클래스(StoryPhase1.DrawCommands)를 바로 잡는다 — 게임 ctx 는 프레임 밖에서는 보통 캔버스라 ctx 로는 못 잡는다.
function hook(){try{const K=window.StoryPhase1?.DrawCommands;const P=K?.prototype||null;
 if(!P||typeof P.finish!=='function'||P.finish.__r1371)return !!P?.finish?.__r1371;const base=P.finish;
 const f=function(...a){const r=base.apply(this,a);try{fix(r);}catch(err){fail(err);}return r;};f.__r1371=true;P.finish=f;hooked=P;return true;}catch(err){fail(err);return false;}}
let tries=0;const timer=setInterval(()=>{if(hook()||++tries>2400)clearInterval(timer);},250);
function set(p={}){if(typeof p.on==='boolean')prefs.on=p.on;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
window.__STORYWORLD_ENEMY_FACE_FINAL_R1371__=Object.freeze({revision:REV,set,prefs:()=>({...prefs}),stats:()=>({...stats,hooked:!!hooked,lastError}),face:a=>faceOf(a),art:c=>artOf(c),fix});
})();
