/* R991 기억사수 총구·시선 방향 맞추기 (사용자 2026-11-13 03:26Z "기억사수 총구방향이랑 바라보는 곳이랑 이미지가 달라서")
 * 헤드리스 측정(qa/r991/review.md, 8방향 기본 공격):
 *  ① 몸 그림: R143 공격 시트(e·se·s·ne·n, 왼쪽은 반전)를 R425 규칙(좌·우 그림이 ±60°)으로 골라, 대각선(45°)으로 쏘면
 *     총이 수평인 옆 그림이 나왔다(총 각도 오차 42~48°). → 쏜 방향(화면 각)에 총 각도가 가장 가까운 칸을 고른다.
 *     옆·대각 6방향 오차 ≤ 13°. 정 위·정 아래는 시트에 그 방향으로 겨눈 그림이 없어 남는다(위 33°·아래 40°, Dots 요청서 CX-0085GA).
 *  ② 탄 출발점: 엔진 총구표는 옛 그림(hero_direction334) 기준이라 실제로 그려진 R143 칸의 총구 끝과 17~34px 어긋났다.
 *     → 고른 칸의 총구 끝(그림을 열어 잰 표)을 화면 → 땅 좌표로 옮겨 탄을 거기서 내보내고, 같은 표적을 향하게 각도·수명만 다시 맞춘다.
 *  ④ 걸으며 쏘기: 걷기 그림이 걷는 방향(가설 3)이라 → 쏜 뒤 .45초 조준 쪽 걷기 칸으로, 탄은 그 칸 총구 끝에서.
 *  ③ 쏘고 난 뒤 서 있기: 4방향 서 있기라 대각선 표적 앞에서 총이 수평이었다 → 사거리 안 적이 있으면 8방향 서 있기 칸으로.
 *  판정·피해·반경·탄속·사거리·연사 간격은 그대로. 벽 안으로 들어가면 엔진 출발점 유지. 그리기 값은 유한값만.
 *  다른 덧그림보다 바깥에서 감싸야 해서(R143 이 이 파일보다 뒤에 올라옴) 페이지가 다 올라온 뒤 감싼다.
 *  설정 storyworld.r991.gunnerAim {"on":false} 로 끄면 예전 그대로. Canonical source; copied by scripts/sync-r99.py. */
(()=>{'use strict';
if(window.__STORYWORLD_GUNNER_AIM_R991__)return;
const REV='R1003-gunner-aim-2',KEY='storyworld.r991.gunnerAim',HERO='gunner';
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={walk:0,idle:0,swings:0,replaced:0,shots:0,moved:0,blocked:0,waiting:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const D=Math.PI/180,CW=192,CH=256,FX=96,FY=227;
const fin=(v,d=0)=>Number.isFinite(v)?v:d,clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
// R143 기억사수 공격 시트(assets/r143/attack/gunner/attack-<d>.webp, 6칸 192×256, 발 96·227).
//  gun: 화면 기준 총 각도(개머리 → 총구, 오른쪽 0°·아래 +90°), tip: 칸마다 총구 끝 픽셀, body: R143 bodyOf 와 같은 방법의 몸 키.
//  face: 몸(얼굴·어깨)이 향한 화면 각 — 총 각도가 비슷하면 몸도 그쪽을 보는 칸을 고른다(앞모습에 총만 비스듬한 s 보다 몸을 돌린 se).
const SHEET={e:{gun:-3,face:0,body:181,tip:[[159,75],[154,72],[172,83],[151,71],[159,75],[163,77]]},
 se:{gun:35,face:45,body:182,tip:[[158,133],[155,130],[163,143],[152,126],[158,133],[159,137]]},
 s:{gun:50,face:90,body:182,tip:[[128,126],[128,126],[132,131],[125,119],[135,169],[135,169]]},
 ne:{gun:-52,face:-60,body:180,tip:[[156,38],[150,36],[170,43],[146,35],[156,38],[160,39]]},
 n:{gun:-57,face:-90,body:182,tip:[[134,44],[130,44],[145,47],[128,44],[135,45],[138,45]]},
 // R1003 Dots 정 아래 조준(앞모습, 총구가 화면 앞으로) — 드라이브 HERO-gunner-attack-s2 후보, 7분야 심사 통과분. 대칭 그림이라 반전하지 않는다. tip 은 Dots 수동 측정값.
 s2:{gun:87,face:90,body:181,noMirror:true,path:'assets/r1003/gunner/attack-s2.webp',tip:[[93,131],[94,131],[94,131],[94,128],[94,128],[94,128]]}};
const SHEETS=Object.freeze(Object.keys(SHEET));
// 걸으며 쏠 때: R128 걷기 시트(8칸 192×256, 발 96·226, walk-e 는 R144 v1 사본) — 같은 총 각도, 칸마다 총구 끝
const WALK={e:{path:'assets/r144/walk/gunner/walk-e.webp',tip:[[165,81],[166,76],[166,76],[166,80],[165,80],[164,76],[163,76],[164,81]]},
 se:{path:'assets/r128/gunner/walk-se.webp',tip:[[162,136],[161,140],[160,139],[159,135],[158,136],[159,140],[160,139],[161,136]]},
 s:{path:'assets/r128/gunner/walk-s.webp',tip:[[127,149],[125,149],[124,149],[124,149],[123,149],[122,149],[124,149],[126,149]]},
 ne:{path:'assets/r128/gunner/walk-ne.webp',tip:[[164,39],[163,42],[162,41],[161,38],[160,39],[161,43],[162,41],[163,38]]},
 n:{path:'assets/r128/gunner/walk-n.webp',tip:[[142,45],[141,48],[140,47],[139,44],[138,45],[138,48],[140,47],[141,44]]}};
WALK.s2=WALK.s; // 정 아래 걷기 사격 그림은 아직 없음 → 앞모습 걷기 그대로
// R1003 쏜 뒤 정 아래 서 있기: Dots idle-s2 v4(4칸 192×256, 발 96·227, 몸 181) — 사용자 방향 확인("이건 맞음") + 7분야 심사 통과분
const IDLE_S2={path:'assets/r1003/gunner/idle-s2.webp',cellW:192,cellH:256,footX:96,footY:227,refBody:181,frames:4};
const WFY=226;
const pathOf=s=>SHEET[s]?.path||'assets/r143/attack/gunner/attack-'+s+'.webp';
const gunAngle=(s,mirror)=>{const g=(SHEET[s]||SHEET.e).gun*D;return mirror?Math.PI-g:g;};
const angDiff=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));
const faceAngle=(s,mirror)=>{const g=(SHEET[s]||SHEET.e).face*D;return mirror?Math.PI-g:g;};
// 화면 각 a 에 맞는 칸: 총 각도 오차 + 몸 방향 오차×0.25 가 가장 작은 칸(같으면 앞 순서)
const FACE_W=.25,cost=(a,s,m)=>angDiff(a,gunAngle(s,m))+FACE_W*angDiff(a,faceAngle(s,m));
function pick(a){a=Number.isFinite(a)?Math.atan2(Math.sin(a),Math.cos(a)):0;if(!Number.isFinite(a))a=0;let best={sheet:'e',mirror:false},bd=Infinity;
 for(const s of SHEETS)for(const m of (SHEET[s].noMirror?[false]:[false,true])){const d=cost(a,s,m);if(d<bd-1e-9){bd=d;best={sheet:s,mirror:m};}}return best;}
function tip(s,fr){const t=(SHEET[s]||SHEET.e).tip;const i=clamp(Math.round(fin(fr,0)),0,t.length-1);return t[i].slice();}
// 화면 오프셋(rx,ry px) → 땅 좌표: 엔진 project(x,y)=((x−y)·TILE·zoom, (x+y)·TILE·.5·zoom) 의 역
function screenToGround(o,rx,ry,TILE,zoom){const T=fin(TILE,64)*Math.max(.05,fin(zoom,1)),a=fin(rx)/T,b=fin(ry)/(T*.5);return{x:fin(o?.x)+(a+b)/2,y:fin(o?.y)+(b-a)/2};}
const on=()=>{try{return prefs.on&&typeof player==='object'&&player?.hero===HERO;}catch(_){return false;}};
// R143 공격 시트로 그려질 때만(혼자 플레이·R143 켜짐·걷기 그림 아님) — 협동·걷기 중에는 다른 그림이라 엔진 출발점 그대로
const solo=()=>{const m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();return !m||m==='off';};
let r143At=-9,r143On=true,walkAt=-9,walkGeo=null;const r143=()=>{const t=Date.now();if(t-r143At>1000){r143At=t;try{r143On=window.__STORYWORLD_ATTACK_ANIM_R143__?.inspect?.()?.prefs?.on!==false;}catch(_){r143On=true;}}return r143On;};
const sheetLive=()=>solo()&&r143()&&T()-walkAt>.15,walking=()=>solo()&&T()-walkAt<=.15&&walkGeo&&T()-walkGeo.t<=.2;
const T=()=>typeof time==='number'?time:0;
const standRatio=()=>{try{return fin(window.__STORYWORLD_VISUAL_R119__?.inspect?.()?.stats?.standRatio,.98)||.98;}catch(_){return .98;}};
function image(p){try{const row=typeof readyImage==='function'?readyImage(p):null;if(row?.image)return row.image;if(typeof ensureImages==='function')Promise.resolve(ensureImages([p])).catch(()=>{});}catch(e){fail(e);}stats.waiting++;return null;}
// 한 번 쏠 때의 조준(화면 각) — 생존 배치 영웅(r720Ally)은 영웅마다 따로
const swings=new WeakMap();let pending=null;
const swingOf=p=>p?swings.get(p)||null:null;
function aimNow(range){const e=typeof nearestEnemy==='function'?nearestEnemy(range):null;if(!e||typeof project!=='function')return null;
 const q=project(player.x,player.y),b=project(e.x,e.y),a=Math.atan2(b.y-q.y,b.x-q.x);return Number.isFinite(a)?{a,target:{x:e.x,y:e.y}}:null;}
function wrapAttack(){if(typeof basicAttack!=='function'||basicAttack.r991)return;const base=basicAttack;const w=function(...args){
  if(!on())return base.apply(this,args);let aim=null;try{const before=player.combo;aim=aimNow((typeof HEROES!=='undefined'&&HEROES?.[HERO]?.range)||7);pending=aim?{...aim,t:T(),before}:null;}catch(e){fail(e);}
  try{return base.apply(this,args);}finally{try{if(pending&&player.combo>pending.before){const pk=pick(pending.a);swings.set(player,{...pending,...pk,at:T()});stats.swings++;}}catch(e){fail(e);}pending=null;}};
 w.r991=true;basicAttack=w;}
// 탄 출발점: 고른 칸 첫 칸(쏘는 순간)의 총구 끝
function wrapShot(){if(typeof makeShot!=='function'||makeShot.r991)return;const base=makeShot;const w=function(...args){const s=base.apply(this,args);
  try{const wk=walking();if(pending&&s?.friendly&&on()&&(sheetLive()||wk)&&s.attackKind9!=='skill'&&!s.storyWER&&Number.isFinite(s.x+s.y+s.vx+s.vy)){const pk=pick(pending.a),k0=wk?walkGeo.k:typeof actorHeight==='function'?fin(actorHeight())*standRatio()/SHEET[pk.sheet].body:0;
    if(k0>0&&typeof project==='function'){const t=wk?WALK[pk.sheet].tip[clamp(walkGeo.frame,0,7)]:tip(pk.sheet,0),f=pk.mirror?-1:1,lift=clamp(fin(player.visualLiftPx),0,k0*SHEET[pk.sheet].body*.65),
      rx=wk?walkGeo.dx+f*(t[0]-FX)*k0:f*(t[0]-FX)*k0,ry=wk?walkGeo.dy+(t[1]-WFY)*k0:(t[1]-FY)*k0-lift,g=screenToGround(player,rx,ry,typeof TILE==='number'?TILE:64,typeof zoom==='number'?zoom:1);stats.shots++;
     if(typeof blocked==='function'&&blocked(g.x,g.y,s.radius||.14)){stats.blocked++;}else if(Number.isFinite(g.x+g.y)){
      const sp=Math.hypot(s.vx,s.vy),tg=pending.target,old=Math.atan2(s.vy,s.vx),aimOld=Math.atan2(tg.y-s.y,tg.x-s.x),spread=Math.atan2(Math.sin(old-aimOld),Math.cos(old-aimOld)),
       na=Math.atan2(tg.y-g.y,tg.x-g.x)+spread,dOld=Math.hypot(tg.x-s.x,tg.y-s.y),dNew=Math.hypot(tg.x-g.x,tg.y-g.y);
      if(Number.isFinite(na)&&sp>0){s.x=s.px=g.x;s.y=s.py=g.y;s.vx=Math.cos(na)*sp;s.vy=Math.sin(na)*sp;if(Number.isFinite(s.life))s.life=Math.max(.001,s.life+(dNew-dOld)/sp);
       s.currentPublicMuzzle={...(s.currentPublicMuzzle||{}),applied:true,r991:{sheet:pk.sheet,mirror:pk.mirror,tip:t}};stats.moved++;}}}}}catch(e){fail(e);}return s;};
 w.r991=true;makeShot=w;}
// 몸 그림: R143 이 그린 공격 칸을 고른 칸(같은 프레임·같은 키·같은 발)으로 바꿔 놓는다
function replace(rec,st){const sw=swingOf(player);if(!sw||!(player.attackAnim>0)||T()-sw.at>.6)return;
 for(let i=st;i<rec.commands.length;i++){const c=rec.commands[i];if(c.kind!=='image'||!c.r143Attack||!c.points||!c.sourceRect)continue;
  const m=/(?:r143\/attack|r1003)\/gunner\/attack-([a-z0-9]+)\.webp/.exec(String(c.sourcePath||c.image?.src||''));if(!m)continue;
  const P=c.points,oldMir=P[1][0]<P[0][0],fOld=oldMir?-1:1,k=Math.abs(P[1][0]-P[0][0])/CW,ky=(P[3][1]-P[0][1])/CH;if(!(k>0)||!Number.isFinite(ky))return;
  if(m[1]===sw.sheet&&oldMir===sw.mirror)return;const p=pathOf(sw.sheet),im=image(p);if(!im)return;
  const fx=P[0][0]+fOld*FX*k,fy=P[0][1]+FY*ky,f=sw.mirror?-1:1,X=v=>fx+f*(v-FX)*k,Y=v=>fy+(v-FY)*ky,sx=clamp(Math.round(fin(c.sourceRect[0])/CW),0,5)*CW;
  const pts=[[X(0),Y(0)],[X(CW),Y(0)],[X(CW),Y(CH)],[X(0),Y(CH)]];if(pts.flat().some(v=>!Number.isFinite(v)))return;
  Object.assign(c,{image:im,sourcePath:p,sourceRect:[sx,0,CW,CH],imageSize:[im.naturalWidth||im.width,im.naturalHeight||im.height],points:pts,r991Aim:{sheet:sw.sheet,mirror:sw.mirror}});stats.replaced++;return;}}
// 쏘고 난 뒤 서 있기: R93 서 있기는 4방향(player.direction)이라 대각선 표적을 두고 총이 수평으로 섰다.
//  사거리 안에 적이 있으면 R128 8방향 서 있기(idle-<d>, 왼쪽은 왼쪽 그림) 중 표적 쪽 칸으로 바꾼다. 같은 프레임·발·키(refBody 비율).
const SEC8=['e','se','s','sw','w','nw','n','ne'];
const sector8=a=>SEC8[((Math.round(fin(a)/(Math.PI/4))%8)+8)%8];
function replaceIdle(rec,st){const S=window.__STORYWORLD_HERO_SHEETS__;if(!S?.idleItem)return;
 for(let i=st;i<rec.commands.length;i++){const c=rec.commands[i];if(c.kind!=='image'||!c.points||!c.sourceRect)continue;
  const src=String(c.sourcePath||c.image?.src||''),m=/(?:r128|r710)\/gunner\/idle-([a-z]+)\.webp/.exec(src);if(!m)continue;
  const aim=aimNow((typeof HEROES!=='undefined'&&HEROES?.[HERO]?.range)||7);if(!aim)return;const d=sector8(aim.a),P=c.points,oldMir=P[1][0]<P[0][0];
  const oldShown=oldMir?({e:'w',w:'e',se:'sw',sw:'se',ne:'nw',nw:'ne'}[m[1]]||m[1]):m[1];const s2=d==='s'&&prefs.s2!==false;if(oldShown===d&&!s2)return;
  let it=S.idleItem(HERO,d,false);const from=S.idleItem(HERO,m[1],false);if(s2){const im=image(IDLE_S2.path);if(!im)return;it={...IDLE_S2,image:im};}if(!it?.image)return;
  const cw=fin(it.cellW,192),ch=fin(it.cellH,256),k0=Math.abs(P[1][0]-P[0][0])/fin(from?.cellW,192),ky0=(P[3][1]-P[0][1])/fin(from?.cellH,256);if(!(k0>0)||!Number.isFinite(ky0))return;
  const r=clamp(fin(from?.refBody,183)/fin(it.refBody,183),.8,1.25),k=k0*r,ky=ky0*r,fo=oldMir?-1:1,fx=P[0][0]+fo*fin(from?.footX,96)*k0,fy=P[0][1]+fin(from?.footY,226)*ky0;
  const X=v=>fx+(v-fin(it.footX,96))*k,Y=v=>fy+(v-fin(it.footY,226))*ky,fr=clamp(Math.round(fin(c.sourceRect[0])/fin(from?.cellW,192)),0,Math.max(0,fin(it.frames,4)-1));
  const pts=[[X(0),Y(0)],[X(cw),Y(0)],[X(cw),Y(ch)],[X(0),Y(ch)]];if(pts.flat().some(v=>!Number.isFinite(v)))return;
  Object.assign(c,{image:it.image,sourcePath:it.path,sourceRect:[fr*cw,0,cw,ch],imageSize:[it.image.naturalWidth||it.image.width,it.image.naturalHeight||it.image.height],points:pts,r991Idle:d});stats.idle=(stats.idle||0)+1;return;}}
// 걸으며 쏠 때: 걷기 그림(R119)이 걷는 방향이라 표적과 다른 쪽을 봤다 → 쏜 뒤 .45초는 조준 쪽 걷기 칸(같은 박자·발·키)으로
function replaceWalk(rec,st){const sw=swingOf(player);
 for(let i=st;i<rec.commands.length;i++){const c=rec.commands[i];if(c.kind!=='image'||!c.r121Walk||!c.points||!c.sourceRect)continue;
  if(!/gunner\/walk-[a-z]+\.webp/.test(String(c.sourcePath||c.image?.src||'')))return;
  const P=c.points,b=c.sourceRect,fo=P[1][0]<P[0][0]?-1:1,k=Math.abs(P[1][0]-P[0][0])/Math.max(1,fin(b[2],1)),idx=clamp(Math.floor(fin(b[0])/CW),0,7);if(!(k>0))return;
  const fx=P[0][0]+fo*(idx*CW+FX-b[0])*k,fy=P[0][1]+(WFY-b[1])*k,q=typeof project==='function'?project(player.x,player.y):{x:fx,y:fy};
  walkGeo={t:T(),k,frame:idx,dx:fx-q.x,dy:fy-q.y};
  if(!sw||T()-sw.at>.45)return;const W=WALK[sw.sheet],im=W&&image(W.path);if(!im)return;const f=sw.mirror?-1:1,X=v=>fx+f*(v-idx*CW-FX)*k,Y=v=>fy+(v-WFY)*k;
  const pts=[[X(idx*CW),Y(0)],[X(idx*CW+CW),Y(0)],[X(idx*CW+CW),Y(CH)],[X(idx*CW),Y(CH)]];if(pts.flat().some(v=>!Number.isFinite(v)))return;
  Object.assign(c,{image:im,sourcePath:W.path,sourceRect:[idx*CW,0,CW,CH],imageSize:[im.naturalWidth||im.width,im.naturalHeight||im.height],points:pts,r991Walk:{sheet:sw.sheet,mirror:sw.mirror}});stats.walk=(stats.walk||0)+1;return;}}
// 처음 쓰는 순간 그림이 없어 예전 그림이 한 번 보이지 않게 기억사수일 때 미리 받는다(지역을 옮기면 게임이 그림 기억을 비우므로 2초마다 확인)
let preAt=0;function preload(){const t=Date.now();if(t-preAt<2000)return;preAt=t;try{for(const p of [...SHEETS.map(pathOf),...Object.values(WALK).map(w=>w.path),IDLE_S2.path])if(!(typeof readyImage==='function'&&readyImage(p)))image(p);}catch(e){fail(e);}}
function wrapDraw(){if(typeof drawHero!=='function'||drawHero.r991)return;const base=drawHero;const w=function(...a){if(on())preload();const rec=typeof ctx==='object'?ctx:null,st=Array.isArray(rec?.commands)?rec.commands.length:-1;const r=base.apply(this,a);
  try{if(st>=0&&on()){for(let i=st;i<rec.commands.length;i++)if(rec.commands[i]?.r121Walk){walkAt=T();break;}if(solo()){replace(rec,st);if(T()-walkAt<.05)replaceWalk(rec,st);if(!(player.attackAnim>0)&&prefs.idle!==false)replaceIdle(rec,st);}}}catch(e){fail(e);}return r;};w.r991=true;drawHero=w;}
function install(){try{wrapAttack();wrapShot();wrapDraw();}catch(e){fail(e);}}
try{if(typeof document!=='undefined'&&document.readyState==='complete')install();else if(typeof window.addEventListener==='function')window.addEventListener('load',install);}catch(e){fail(e);}
function set(k,v){prefs[k]=v;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
window.__STORYWORLD_GUNNER_AIM_R991__=Object.freeze({revision:REV,SHEETS,pick,tip,gunAngle,faceAngle,screenToGround,set,install,
 inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError,swing:(()=>{try{const s=swingOf(player);return s?{sheet:s.sheet,mirror:s.mirror,a:s.a}:null;}catch(_){return null;}})(),browser:false,GPU:false})});
})();
