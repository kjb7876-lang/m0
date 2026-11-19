// R1226 몹 모션 사이 일관성 — 사용자 2026-11-19 "소환진순례악마를 보면 왼쪽에 칼을들고있었는데 공격할때는 오른쪽에서 칼을 갑자기들고 내리치니까 일관성이 없어
//  왼손칼들었으면 왼손으로 내리치도록 … 전수조사해서 크기도 맞추고 이미지가 한방향이면 좌우반전하면되잖아, 가고일도 앞에 공격하는데 뒤를 돌아봤다가 앞모습 보이니까 어색함"
//  + "늪의뿔악마군주랑 소환진순례악마랑 또 같은 이미지더만 색을 좀 달리해서 차별점도 주고".
//  헤드리스 전수(r96/qa/r1226/census.mjs: 지역마다 몹 한 마리씩 떼어 대기·걷기·공격(영웅 좌/우)·피격 동안 실제 그린 몸 명령)에서 찾은 원인:
//   · 시트마다 좌우를 정하는 곳이 달라(R109 STRIP_FACE·R425 ATK_FACE·R444·공급자 표) 같은 순간 걷기는 영웅 쪽, 공격 시트는 늘 원본 쪽으로 그려져
//     칼 든 손이 동작마다 바뀌었다(소환진 순례악마 M008: 걷기는 R444 쪽을 따르는데 공격 시트는 좌우 무시).
//   · 한 시트 안에서 칸마다 그림 방향이 섞인 것(가고일 M007 공격: 0·3번 칸은 오른쪽, 1·2번 칸은 왼쪽을 봄) — 시트 통째 뒤집기로는 고칠 수 없어
//     준비 칸에서 뒤를 돌았다가 내려치는 칸에서 다시 앞을 보는 것처럼 보였다.
//  고친 것(그림만 — 판정·피해·이동·시간·저장은 그대로):
//   · 이 파일 하나가 일반몹 몸 그림의 마지막 좌우를 정한다: 표(FACE)에 시트·칸마다 '원본이 보는 쪽'(L/R)을 적고, 그린 쪽 = 원본 ⊕ 뒤집힘 이
//     R444 최종 좌우(공격 중엔 공격 각 쪽)와 다르면 그 몸 그림(같은 그림·칸의 겹 포함)을 발 세로선 기준으로 좌우 반전한다.
//     → 한 몹의 모든 동작이 같은 쪽을 보고, 같은 손에 무기를 든다(#735 규칙: 한 방향 그림은 좌우반전으로 반대쪽).
//   · 크기: 표(SIZE)의 시트는 대기·걷기 기준 몸 키에 맞게 발 기준점에서 배율을 곱한다(전수에서 시트 중앙값 차이 12% 넘는 것만).
//   · 색: 소환진 순례악마(dist05-h1)는 늪의 뿔악마 군주(dist02 중간보스)와 같은 그림이라, 순례악마의 초록·이끼 색만 소환진 핏빛·보라로 바꾼
//     사본(오프스크린 캔버스, 한 번 만들어 재사용)으로 그린다. 늪 군주는 그대로(늪 초록).
//  맡지 않는 것: 보스·중간보스(R1224 보스 점검 스레드 몫, 단 R81 '중간보스 · …' 지역 수호자는 일반몹 그림이라 맡음), 페르소나, 구조물 적, 맘몬 구역,
//   R974 가 방향을 정한 위·아래·옆 이동 칸(c.r974).
//  끄기: localStorage storyworld.r1226.motion {"on":false} (좌우·크기·색 각각 {"face":false} {"size":false} {"tint":false}).
(()=>{'use strict';
if(window.__STORYWORLD_MOB_MOTION_R1226__)return;
const REV='R1226-motion-1',KEY='storyworld.r1226.motion';
let prefs={on:true,face:true,size:true,tint:true,sheets:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={draws:0,flipped:0,kept:0,scaled:0,tinted:0,skipped:0,errors:0,wraps:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const fin=Number.isFinite;
// ---- 표 ----
// FACE: 열쇠 = assets/ 뒤 경로(칸마다 다르면 '경로#sx,sy'). 값 = 원본 그림이 보는 쪽 'L'(화면 왼쪽) / 'R'.
const FACE=Object.freeze({
 // 소환진 순례악마(dist05-h1) = 늪 악마 M008 묶음: 모든 동작에서 식칼을 그림 왼쪽 손에 들고 왼쪽으로 내려침 → 모두 L(같은 손)
 'r116/mobs/M008-idle.png':'L','r109/mobs/M008-move.png':'L','r92/mobs/M008-attack.png':'L','r116/mobs/M008-hit.png':'L','episode1a/horned_swamp_demon.webp':'L',
 // 검은기둥 가고일 수호자(dist05-c1·s1) 공격: 4칸 모두 머리·몸이 오른쪽을 보는 3/4 그림(R425 ATK_FACE 는 'L' 로 적어 영웅 반대쪽을 보고 덮쳤다)
 'r92/mobs/M007-attack.png':'R',
 // 가면 잡역부 M012(오만의 흰 가면 ep1a09 등): 걷기·대기·공격 모두 주사기·구속끈을 그림 왼쪽 손에 들고 왼쪽으로 찌름 — 걷기 시트만 반대로 뒤집혀 뒷걸음처럼 보였다
 'r92/mobs/M012-move.png':'L','r109/mobs/M012-move.png':'L','r116/mobs/M012-idle.png':'L','r92/mobs/M012-attack.png':'L','r116/mobs/M012-hit.png':'L',
 // 늑대 M046(중립초원 늑대 last304 등): 대기·걷기·공격·피격 모두 왼쪽을 보는 그림 — 걷기 시트만 반대로 뒤집혀 공격 때 몸이 홱 돌았다
 'r198/mobs/M046-idle.png':'L','r198/mobs/M046-move.png':'L','r92/mobs/M046-attack.png':'L','r116/mobs/M046-hit.png':'L',
 // 오만의 폐허핵(ep1a10 중간보스, 사용자 2026-11-19 "공격시 반대방향으로 공격하는 모션") 아틀라스: 1번 칸 준비·2번 칸 주먹 지르기는 그림 오른쪽으로 침(R425 표는 'L' 로 잘못 적혀 영웅 반대쪽으로 쳤다).
 //  대기 0번 칸·r104 열쇠자세(p1~p4)는 정면이라 적지 않는다. 중간보스는 R1224 몫이지만 이 몹의 좌우만 사용자 요청으로 맡는다(MID_OK).
 'generated-story10-cycle-20261005/ep1a10/mb-ep1a10-pride-ruin-core-atlas.png#710,0':'R','generated-story10-cycle-20261005/ep1a10/mb-ep1a10-pride-ruin-core-atlas.png#1330,0':'R',
 // 전수조사(헤드리스 전 지역 기록 + 2배 확대 확인)로 찾은 나머지: 같은 몹의 시트끼리 서로 다른 쪽으로 뒤집히거나(걷기 ↔ 공격) 움직일 때마다 좌우가 흔들리던 것
 //  시간수문장 M095(뱀 꼬리 수문장): 걷기·공격 모두 왼쪽 — 걷기만 반대로 돌았다. M064·M055 공격(왼쪽으로 베기)은 좌우가 칸마다 흔들렸다.
 'r92/mobs/M095-move.png':'L','r92/mobs/M095-attack.png':'L','r92/mobs/M064-attack.png':'L','r92/mobs/M055-attack.png':'L',
 //  긴 뱀의 그림자 M023: 머리·숨결 모두 왼쪽. 되살아난 수호기사 M033: 공격은 오른쪽으로 찌르고 칼은 그림 오른편, 걷기 그림은 칼이 그림 왼편이라 걷기를 반대로 둬 같은 손에 칼이 오게 한다.
 'r92/mobs/M023-move.png':'L','r92/mobs/M023-attack.png':'L','r92/mobs/M033-attack.png':'R','r198/mobs/M033-move.png':'L',
 //  살아 있는 거대한 위장 M024: 국자로 오른쪽을 침(기존 표는 왼쪽). 숲 고블린 M047: 대기·걷기·공격 모두 칼이 그림 오른편, 오른쪽으로 벰.
 'r198/mobs/M024-idle.png':'R','r92/mobs/M024-attack.png':'R','r198/mobs/M047-idle.png':'R','r198/mobs/M047-move.png':'R','r92/mobs/M047-attack.png':'R',
 // 안정화 집행체 새 시트(M012 원본, 위와 같은 손)
 'r1226/mobs/m015-stabilizer.webp':'L',
});
// SIZE: 열쇠 = 경로, 값 = 발 기준 배율(대기·걷기 기준 몸 키에 맞춤).
const SIZE=Object.freeze({
 // 전수조사(게임 화면 몸 키 중앙값, 일반몹 286종): 대부분 ±12% 안. 웅크림·폭발처럼 동작 자체로 작아지거나 커지는 칸(슬라임 늘어남 1.28, M018 폭발 1.14)은 두고,
 // 공격 때 몸이 눈에 띄게 줄던 두 시트만 줄어든 몫의 절반쯤 되돌린다(웅크림 느낌은 남김).
 'r92/mobs/M008-attack.png':1.06,   // 소환진 순례악마: 공격 몸 키 0.88(대기 대비)
 'r92/mobs/M060-attack.png':1.08,   // 시간수문장 06: 공격 몸 키 0.83
});
// TINT: 이름·nativeId 로 고른 몹의 몸 그림 색 바꾸기(초록·이끼 색상대만 다른 색으로, 금속 뿔·칼·피부 어두운 곳은 그대로).
const TINT=Object.freeze([
 {id:'pilgrim',nid:/^dist05-h1$/,name:/소환진 순례악마/,from:[42,190],to:345,sat:1.6,smin:.28,light:.93},
]);
// 피로물든 병원 안정화 집행체: R410 이 얹은 드라이브 후보(assets/r410/mobs/m015.webp)는 보라 상자머리 픽셀 인형이라 병원과 맞지 않았다
//  (사용자 2026-11-19 "안정화 집행체몹도 기본이미지는 다른이미지가 적용되어야" · "피로물든 병원에서는 병원관련 몹이미지만").
//  → 이 몹의 원래 병원 그림(가면 잡역부, episode1a/hallucinated_orderly)과 같은 원본의 걷기 8·공격 4칸(r92 M012)으로 만든 시트
//    (scripts/r1226-stabilizer-sheet.py, 같은 R248 칸 틀)로 바꾼다. 오만의 흰 가면·백의 구속자와 구분되게 흰 가운을 수술복 청록 쪽으로 옮겼다.
//    임시본: Dots CX-0170SO 걷기·공격·피격 시트가 오면 바꾼다.
const SHEET_SWAP=Object.freeze({m015:{name:'안정화 집행체',path:'assets/r1226/mobs/m015-stabilizer.webp',body:150}});
const swapped=[];
function swapSheets(on){const D=window.__STORYWORLD_MOB_UNIQUE_R248_DATA__;if(!D||!D.sheets)return;for(const [id,a] of Object.entries(SHEET_SWAP)){const s=D.sheets[id];if(!s||s.name!==a.name)continue;
 // 뒤에 실리는 R410 이 같은 줄에 path 를 다시 얹으면(헤드리스에서 확인) 그 값을 원래 값으로 새로 기억하고 다시 바꾼다
 try{if(!s.__r1226||(s.path!==a.path&&s.path!==s.__r1226.path))s.__r1226={path:s.path,body:s.body};if(on){s.path=a.path;s.body=a.body;if(!swapped.includes(id))swapped.push(id);}else{s.path=s.__r1226.path;s.body=s.__r1226.body;}}catch(err){fail(err);}}}
swapSheets(prefs.on!==false&&prefs.sheets!==false);
// 초자아 잠식체(ep1a11 a11-d1, 사용자 2026-11-19 "초자아잠식체 일관성이 좀 떨어지는데"): 대기·걷기는 어두운 이끼빛 그릇 몸(ego_corrosion_vessel·R1029 안개판)인데
//  공격만 R92 M017(창 든 금빛 천사 — 다른 몹 그림)으로 바뀌어 동작마다 다른 몹처럼 보였다 → 공격 칸도 제 몸 그림으로 그린다(발·키 유지, R109 짧은 내딛기만).
//  전용 공격 시트는 Dots 요청. ART_SWAP: 이름 → {from: 바꿀 그림 경로, to: 제 그림, toBox: 제 그림 알파 경계 [x0,y0,x1,y1,w,h], fromBody: 바꿀 칸 몸 키/칸 키}
const ART_SWAP=Object.freeze([
 {name:/^초자아 잠식체/,nid:/^a11-d1$/,from:'r92/mobs/M017-attack.png',to:'assets/episode1a/generated-v392/ego_corrosion_vessel.webp',toBox:[26,8,356,393,418,418],fromBody:145/196},
]);
function artSwap(e,cmds,st,b,a,fx,fy){if(!prefs.sheets)return false;const R=ART_SWAP.find(r=>r.from===a.path&&(r.nid.test(String(e.nativeId||''))||r.name.test(String(e.name||''))));if(!R)return false;
 const im=typeof readyImage==='function'?readyImage(R.to)?.image:null;if(!im||!((im.naturalWidth||im.width)>0)){try{if(typeof addImage==='function')addImage(R.to,'R1226 art swap');}catch(_){}return false;}
 const P=b.points,qh=Math.abs(P[3][1]-P[0][1]),pad=(b.sourceRect&&b.sourceRect[3]>0)?b.sourceRect[3]:qh;
 // 캐시 캔버스 칸 = 원래 칸 높이 + 위아래 여백: 몸 키 = 칸 높이 비율 × fromBody
 const m=/:(\d+(?:\.\d+)?),(\d+(?:\.\d+)?),(\d+(?:\.\d+)?),(\d+(?:\.\d+)?):(\d+):/.exec(String(b.sourcePath||''));const cellH=m?+m[4]:pad;const hv=qh*(cellH/pad)*R.fromBody;if(!(hv>2&&fin(hv)))return false;
 const [x0,y0,x1,y1,W,H]=R.toBox,k=hv/(y1-y0),w=W*k,h=H*k,left=fx-((x0+x1)/2)*k,top=fy-y1*k;
 const mir=P[1][0]<P[0][0];let Q=[[left,top],[left+w,top],[left+w,top+h],[left,top+h]];if(mir)Q=[Q[1],Q[0],Q[3],Q[2]];
 b.image=im;b.sourceRect=[0,0,W,H];b.sourcePath=R.to;b.imageSize=[W,H];b.points=Q;delete b.immutableTint;
 for(let i=st;i<cmds.length;i++){const c=cmds[i];if(c!==b&&c?.kind==='image'&&c.owner?.kind==='enemy'&&String(c.sourcePath||'')===String(m?m.input:'')){c.alpha=0;}}stats.swapped=(stats.swapped||0)+1;return true;}
// ---- 도우미 ----
const MID_OK=/^mb-ep1a10$/;
function excluded(e){if(!e||!(e.hp>0)||e.persona||e.boss)return true;if(e.midboss&&!e.wardChampionR81&&!/^중간보스 · /.test(String(e.name||''))&&!MID_OK.test(String(e.nativeId||'')))return true;
 if(e.r170Tower||e.r446Pillar||e.r251Circle||e.towerR193||e.r193Tower||e.prop||e.object)return true;
 try{const id=String(typeof room==='object'&&room?room.id||'':'');if(/mammon/i.test(id)||id==='ep1b06'||e.mammon||/mammon/i.test(String(e.nativeId||'')))return true;}catch(_){}return false;}
// 몸 명령의 원래 그림 경로·칸: 몹 캐시 캔버스는 sourcePath 가 'assets/…png:sx,sy,sw,sh:pad:enemy' 꼴, 아니면 경로 + sourceRect
function artOf(c){let s=String(c?.immutableTint?.r1226Src||c?.sourcePath||c?.image?.src||'');s=s.replace(/^[a-z]+:\/\/[^/]+/i,'');const i=s.indexOf('assets/');s=i>=0?s.slice(i+7):s.replace(/^\.?\//,'');
 for(let t=s;;s=t){t=s.replace(/^r(?:99|118|425)\/clean\/assets\//,'');if(t===s)break;}
 const m=/^(.+?\.(?:png|webp|jpe?g))(?:#[^:]*)?:(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(\d+(?:\.\d+)?),(\d+(?:\.\d+)?):/i.exec(s);
 if(m)return{path:m[1],cell:Math.round(+m[2])+','+Math.round(+m[3])};
 const p=s.replace(/[?#].*$/,'');const r=Array.isArray(c?.sourceRect)?c.sourceRect:null;return{path:p,cell:r?Math.round(r[0])+','+Math.round(r[1]):null};}
function faceOf(a){if(!a)return null;return FACE[a.path+'#'+a.cell]||FACE[a.path]||null;}
const okPts=c=>Array.isArray(c?.points)&&c.points.length===4&&c.points.every(p=>Array.isArray(p)&&fin(p[0])&&fin(p[1]));
function bodyCmd(cmds,st){let b=null,bh=0;for(let i=st;i<cmds.length;i++){const c=cmds[i];if(c?.kind!=='image'||c.owner?.kind!=='enemy'||!okPts(c))continue;
  const h=Math.abs(c.points[3][1]-c.points[0][1])*Math.abs(c.points[1][0]-c.points[0][0]);if(h>bh){bh=h;b=c;}}return b;}
function sameArt(c,b){return c?.kind==='image'&&c.owner?.kind==='enemy'&&okPts(c)&&(c===b||(c.image&&c.image===b.image&&String(c.sourceRect||'')===String(b.sourceRect||'')));}
function mapCmd(c,f){c.points=c.points.map(p=>f(p));}
function wantLeft(e){let v=null;try{v=window.__STORYWORLD_ENEMY_FACE_R444__?.left?.(e);}catch(_){}if(typeof v==='boolean')return v;
 try{const p=typeof player==='object'?player:null;if(!p)return null;const d=(p.x-p.y)-(e.x-e.y);return Math.abs(d)<.02?null:d<0;}catch(_){return null;}}
// ---- 색 바꾼 사본 ----
const tints=new Map();
function rgb2hsl(r,g,b){r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2;let h=0,s=0;if(mx!==mn){const d=mx-mn;s=l>.5?d/(2-mx-mn):d/(mx+mn);
 h=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;h*=60;}return[h,s,l];}
function hsl2rgb(h,s,l){const f=n=>{const k=(n+h/30)%12,a=s*Math.min(l,1-l);return l-a*Math.max(-1,Math.min(k-3,9-k,1));};return[f(0)*255,f(8)*255,f(4)*255];}
// 색상 h 가 from 범위(초록·이끼)면 to 쪽으로 돌린다. 범위 끝 10° 는 부드럽게 섞어 경계 띠가 생기지 않게.
function shiftPixel(T,r,g,b){const [h,s,l]=rgb2hsl(r,g,b);if(s<.03)return null;const [a0,a1]=T.from;let w=0;
 if(h>=a0&&h<=a1)w=Math.min(1,(h-a0)/10,(a1-h)/10);if(!(w>0))return null;const h2=(T.to+(h-(a0+a1)/2)*.25+360)%360;
 const [R,G,B]=hsl2rgb(h2,Math.min(1,Math.max(T.smin||0,s*T.sat)),Math.max(0,Math.min(1,l*T.light)));return[r+(R-r)*w,g+(G-g)*w,b+(B-b)*w];}
function tintImage(img,T,srcKey){const k=T.id+'|'+srcKey;let c=tints.get(k);if(c){return c.width>1?c:null;}
 const iw=img?.naturalWidth||img?.width,ih=img?.naturalHeight||img?.height;if(!(iw>0&&ih>0)||typeof document==='undefined')return null;
 try{c=document.createElement('canvas');c.width=iw;c.height=ih;const g=c.getContext('2d',{willReadFrequently:true});if(!g)return null;g.drawImage(img,0,0);
  const d=g.getImageData(0,0,iw,ih),p=d.data;for(let i=0;i<p.length;i+=4){if(p[i+3]<8)continue;const q=shiftPixel(T,p[i],p[i+1],p[i+2]);if(q){p[i]=q[0];p[i+1]=q[1];p[i+2]=q[2];}}g.putImageData(d,0,0);
  c.__storyworldStaticSource=Object.freeze({path:srcKey+'#r1226-tint-'+T.id,immutable:true,r1226Tint:true,r1226Src:srcKey});tints.set(k,c);
  while(tints.size>24){const o=tints.keys().next().value,old=tints.get(o);tints.delete(o);if(old)old.width=old.height=1;}return c;}
 catch(err){fail(err);const z={width:1};tints.set(k,z);return null;}}
function tintOf(e){for(const T of TINT){if(T.nid.test(String(e.nativeId||''))||T.name.test(String(e.name||'')))return T;}return null;}
function tintCmds(e,cmds,st){const T=tintOf(e);if(!T)return;for(let i=st;i<cmds.length;i++){const c=cmds[i];if(c?.kind!=='image'||c.owner?.kind!=='enemy'||!c.image||c.immutableTint?.r1226Tint)continue;
  const src=String(c.sourcePath||c.image?.src||'');if(/pixelfx|r251\/atlas|\/fx\/|effect|vfx|shadow/i.test(src))continue;
  const t=tintImage(c.image,T,src);if(!t)continue;c.image=t;c.immutableTint=t.__storyworldStaticSource;c.sourcePath=t.__storyworldStaticSource.path;stats.tinted++;}}
// ---- 한 몹 그리기 뒤처리 ----
function post(e,cmds,st){const b=bodyCmd(cmds,st);if(!b){stats.skipped++;return;}stats.draws++;
 const q=typeof project==='function'?project(e.x,e.y):null;if(!q||!fin(q.x)||!fin(q.y))return;const fx=q.x,fy=q.y;
 let a=artOf(b);
 if(artSwap(e,cmds,st,b,a,fx,fy))a=artOf(b);
 if(prefs.size&&!b.r974){const k=SIZE[a.path];if(fin(k)&&k>0&&Math.abs(k-1)>.01){const hit=[];for(let i=st;i<cmds.length;i++)if(sameArt(cmds[i],b))hit.push(cmds[i]);for(const c of hit)mapCmd(c,p=>[fx+(p[0]-fx)*k,fy+(p[1]-fy)*k]);stats.scaled++;}}
 if(prefs.face&&!b.r974){const f=faceOf(a);if(f){const want=wantLeft(e);if(want!=null){const mir=b.points[1][0]<b.points[0][0],left=(f==='L')!==mir;
   if(left!==want){const hit=[];for(let i=st;i<cmds.length;i++)if(sameArt(cmds[i],b))hit.push(cmds[i]);for(const c of hit)mapCmd(c,p=>[2*fx-p[0],p[1]]);stats.flipped++;}else stats.kept++;}}}
 if(prefs.tint)tintCmds(e,cmds,st);}
// ---- drawEnemy 맨 바깥 감싸기(다른 오버레이가 나중에 감싸도 다시 바깥으로, 최대 6번) ----
let mine=null,rewraps=0;
function wrap(){if(typeof drawEnemy!=='function')return;const base=drawEnemy;
 mine=function(e,...a){if(prefs.on&&prefs.sheets!==false){const D=window.__STORYWORLD_MOB_UNIQUE_R248_DATA__,t=D&&D.sheets;if(t)for(const [id,x] of Object.entries(SHEET_SWAP))if(t[id]&&t[id].name===x.name&&t[id].path!==x.path){swapSheets(true);break;}}
  const rec=typeof ctx==='object'?ctx:null,cmds=Array.isArray(rec?.commands)?rec.commands:null;
  if(!prefs.on||!cmds||excluded(e))return base.apply(this,[e,...a]);const st=cmds.length;const r=base.apply(this,[e,...a]);
  try{if(cmds.length>st)post(e,cmds,st);}catch(err){fail(err);}return r;};
 mine.__r1226=true;drawEnemy=mine;stats.wraps++;}
wrap();
const keepOuter=()=>{try{if(typeof drawEnemy==='function'&&drawEnemy!==mine&&rewraps<6){rewraps++;wrap();}}catch(err){fail(err);}};
try{setInterval(keepOuter,700);}catch(_){}
function set(p={}){for(const k of Object.keys(prefs))if(typeof p[k]==='boolean')prefs[k]=p[k];try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}swapSheets(prefs.on!==false&&prefs.sheets!==false);return{...prefs};}
window.__STORYWORLD_MOB_MOTION_R1226__=Object.freeze({revision:REV,set,prefs:()=>({...prefs}),stats:()=>({...stats,tintCache:tints.size,lastError}),
 face:a=>faceOf(a),art:c=>artOf(c),size:p=>SIZE[p]??null,tables:()=>({face:{...FACE},size:{...SIZE},tint:TINT.map(t=>t.id),sheets:JSON.parse(JSON.stringify(SHEET_SWAP)),swapped:[...swapped]}),shiftPixel:(id,r,g,b)=>{const T=TINT.find(t=>t.id===id);return T?shiftPixel(T,r,g,b):null;},excluded});
})();
