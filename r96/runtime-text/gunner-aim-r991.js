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
const REV='R1101c-gunner-diag2+R1101b-gunner-diag+R1101-gunner-aim-7+R1045d+R1045c+R1045b+R1045+R1003-s2',KEY='storyworld.r991.gunnerAim',HERO='gunner';
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
// R1045 (사용자 11-15 02:34Z "기억사수 모션개선적용 닷츠자산확인"): Dots CX-0085GA r2 attack-n3 — 사용자가 "이거좋아" 한 뒷모습 어깨 겨눔 6칸.
//  총이 화면 안쪽(정 위)으로 짧게 줄어 보이는 그림이라 그려진 총열 토막(−35°)이 아니라 몸·두 팔이 겨눈 방향 −80° 로 둔다(반전 −100°). tip 은 칸마다 잰 값.
//  동쪽은 사용자가 Dots 에 부탁한 무반동 E r6(r3 1번 칸 6번 반복) — 위아래 흔들림·반동 없이 총구가 한 자리. {"n3":false}/{"e3":false} 로 R143 그대로.
if(prefs.n3!==false)Object.assign(SHEET.n,{gun:-80,face:-90,body:182,path:'assets/r1045/gunner/attack-n3.webp',tip:[[126,62],[126,62],[126,60],[126,60],[126,62],[126,62]]});
if(prefs.e3!==false)Object.assign(SHEET.e,{path:'assets/r1045/gunner/attack-e3.webp',tip:[0,1,2,3,4,5].map(()=>[156,74])});
// R1045c (사용자 "괜춘한데 드라이브올려서 클로드 개선적용하라고해"): Dots gunner-ew-r1 동쪽 공격 6칸 — 공통 배율 .402·후드 위치를 e3 에 맞추고 발 y227, 알파 ≤16 잔티 0. {"e4":false} 면 e3.
if(prefs.e3!==false&&prefs.e4!==false)Object.assign(SHEET.e,{path:'assets/r1045c/gunner/attack-e4.webp',tip:[0,1,2,3,4,5].map(()=>[156,77])});
// R1101b: Dots CX-0119GD r1 대각 공격 8칸(GD-1 se·GD-2 ne) — 얼굴·몸·총구가 같은 쪽. 그림 총 각도가 화면 대각(±45°)보다 낮은 +26°·−29° 라
//  R143 se·ne(시선 반대)를 바꾸지 않고 그 각에 맞는 칸(se2·ne2)으로 더한다. 몸 키 183·발 96·227 로 맞춘 사본, tip 은 Dots 총구 값을 같은 배율로 옮김. {"diag2":false} 로 끔.
if(prefs.diag2!==false){SHEET.se2={gun:26,face:30,body:183,frames:8,path:'assets/r1101b/gunner/attack-se8.webp',tip:[0,1,2,3,4,5,6,7].map(()=>[155,111])};
 SHEET.ne2={gun:-29,face:-35,body:183,frames:8,path:'assets/r1101b/gunner/attack-ne8.webp',tip:[0,1,2,3,4,5,6,7].map(()=>[151,55])};}
// R1101c: Dots CX-0119GD r2 공격 8칸(GD-1 se 총열 ≈44°·GD-2 ne ≈−37°, 발 96·227·몸 183 사본) — 정 대각 조준에 R143 se·ne(시선 반대) 대신. r1 se2·ne2 는 낮은 각(+26°·−29°)용으로 둠.
//  tip 은 Dots spec 칸별 총구 좌표를 같은 배율·자리로 옮긴 값. se3 는 1~2칸 총구가 위로 5.6px 물러나는 반동(Dots 측정). {"diag3":false} 로 끔.
if(prefs.diag2!==false&&prefs.diag3!==false){SHEET.se3={gun:44,face:45,body:183,frames:8,path:'assets/r1101c/gunner/attack-se9.webp',tip:[[148,129],[148,129],[148,131],[148,135],[148,136],[148,137],[148,137],[148,137]]};
 SHEET.ne3={gun:-37,face:-45,body:183,frames:8,path:'assets/r1101c/gunner/attack-ne9.webp',tip:[0,1,2,3,4,5,6,7].map(()=>[150,63])};
 SHEET.se.retired=SHEET.ne.retired=true;} // 대각 조준 후보에서 R143 se·ne(시선 반대)는 뺌 — 그림은 엔진이 그대로 그리니 SHEET 항목은 남김
const SHEETS=Object.freeze(Object.keys(SHEET).filter(k=>!SHEET[k].retired));
// 걸으며 쏠 때: R128 걷기 시트(8칸 192×256, 발 96·226, walk-e 는 R144 v1 사본) — 같은 총 각도, 칸마다 총구 끝
const WALK={e:{path:'assets/r144/walk/gunner/walk-e.webp',tip:[[165,81],[166,76],[166,76],[166,80],[165,80],[164,76],[163,76],[164,81]]},
 se:{path:'assets/r128/gunner/walk-se.webp',tip:[[162,136],[161,140],[160,139],[159,135],[158,136],[159,140],[160,139],[161,136]]},
 s:{path:'assets/r128/gunner/walk-s.webp',tip:[[127,149],[125,149],[124,149],[124,149],[123,149],[122,149],[124,149],[126,149]]},
 ne:{path:'assets/r128/gunner/walk-ne.webp',tip:[[164,39],[163,42],[162,41],[161,38],[160,39],[161,43],[162,41],[163,38]]},
 n:{path:'assets/r128/gunner/walk-n.webp',tip:[[142,45],[141,48],[140,47],[139,44],[138,45],[138,48],[140,47],[141,44]]}};
WALK.s2=WALK.s;WALK.se2=WALK.se;WALK.ne2=WALK.ne;WALK.se3=WALK.se;WALK.ne3=WALK.ne; // R1101b 대각 겨눔 칸도 걷기 사격은 대각 걷기 그림 // 정 아래 걷기 사격 그림이 없거나 꺼졌을 때 → 앞모습 걷기 그대로
// R1045b: 사용자가 고른 Dots CX-0085GA r3 walk-s2(총구를 화면 앞으로 겨누며 걷는 8칸, 발 96·226). F3 한 칸만 좌우 반전해(x'=192−x)
//  같은 다리가 F3·F7 두 번 앞으로 나오던 것을 왼발·오른발 번갈아로 고쳤다. tip 은 Dots 총구 구멍 중심(F3 은 반전값).
if(prefs.walkS2!==false)WALK.s2={path:'assets/r1045/gunner/walk-s2.webp',tip:[[93,126],[94,133],[95,130],[98,128],[95,128],[94,131],[94,129],[95,128]]};
// R1045c: Dots gunner-ew-r1 동쪽 걷기 8칸(겨눈 채 걷기) — 공통 배율 .583·후드 위치를 R144 walk-e 에 맞추고 발 y226. {"walkE2":false} 면 R144 walk-e.
if(prefs.walkE2!==false)WALK.e={path:'assets/r1045c/gunner/walk-e2.webp',tip:[[165,79],[165,79],[165,79],[166,79],[166,79],[165,79],[165,79],[165,79]]};
// R1045d: R1045c walk-e2 는 큰 보폭 칸이 두 칸씩 겹쳐(3·4, 7·0) 그 자리에서 멈칫했고 3번 칸이 4.6px 떴다 → 같은 Dots r1 을 순서 [1,1,2,3,5,5,6,7]·칸마다 발 y226 으로
//  다시 놓은 손질본(밤샘 스레드 qa r1064 손질본, 잔티 0). 그냥 옆으로 걸을 때도 이 그림(plainWalk). {"walkE3":false} 면 walk-e2, {"plainWalk":false} 면 그냥 걷기는 예전 그대로.
if(prefs.walkE2!==false&&prefs.walkE3!==false)WALK.e={path:'assets/r1045d/gunner/walk-e3.webp',tip:[[163,79],[163,79],[163,79],[162,84],[163,79],[163,79],[162,79],[161,80]]};
// R1101 (사용자 11-16 "좌우 걸을 때·공격할 때 잘리거나 시선이 총구와 반대"): 엔진·R119 는 걷기·서 있기 칸을 그림 내용 bbox 로 잘라(예 [55,43,112,186]) 그린다.
//  그 사각형은 옛 그림 기준이라 그림만 바꾸면 새 그림 가장자리(외투 자락·뒷발)가 잘렸다 → 같은 칸 전체(192×256)로 넓히고 그리기 자리도 같은 배율로 넓힌다.
function toFullCell(c,img,path){const b=c.sourceRect,P=c.points;if(!b||!P)return false;const sw=fin(b[2],0),sh=fin(b[3],0);if(!(sw>0&&sh>0))return false;
 const kx=(P[1][0]-P[0][0])/sw,ky=(P[3][1]-P[0][1])/sh,idx=clamp(Math.floor((fin(b[0])+sw/2)/CW),0,63),cx=idx*CW;
 const X=v=>P[0][0]+(v-fin(b[0]))*kx,Y=v=>P[0][1]+(v-fin(b[1]))*ky,pts=[[X(cx),Y(0)],[X(cx+CW),Y(0)],[X(cx+CW),Y(CH)],[X(cx),Y(CH)]];
 if(pts.flat().some(v=>!Number.isFinite(v)))return false;
 Object.assign(c,{image:img,sourcePath:path,sourceRect:[cx,0,CW,CH],imageSize:[img.naturalWidth||img.width||CW*8,img.naturalHeight||img.height||CH],points:pts});return true;}
const PLAIN_E=/^assets\/(?:r144\/walk\/gunner|r128\/gunner)\/walk-e\.webp$/,IDLE_E=/^assets\/r128\/gunner\/idle-e\.webp$/;
const srcOf=c=>String(c.sourcePath||c.image?.src||'').replace(/^.*?(assets\/)/,'$1').split('?')[0];
// 그냥 걸을 때: R143 이 그린 기억사수 옆 걷기 칸(r144 v1·r128)을 같은 칸의 새 그림으로(칸 배치 192×256·발 96·226 같음, R1101: 잘린 사각형은 칸 전체로)
function plainWalk(rec,st){if(prefs.plainWalk===false||!/r1045/.test(WALK.e.path))return 0;let n=0;
 for(let i=Math.max(0,st|0);i<(rec?.commands?.length||0);i++){const c=rec.commands[i];if(c?.kind!=='image'||c.owner?.kind!=='hero'||c.r991Walk)continue;
  if(!PLAIN_E.test(srcOf(c)))continue;const row=typeof readyImage==='function'?readyImage(WALK.e.path):null;if(!row?.image){image(WALK.e.path);continue;}
  if(toFullCell(c,row.image,WALK.e.path))n++;}
 stats.plain=(stats.plain||0)+n;return n;}
// R1101: 옆 서 있기 R128 idle-e 는 얼굴이 왼쪽(총 반대)을 본다 → 시선·총이 같은 쪽인 Dots r1 겨눔(attack-e4, 발 96·227 같음). 4칸 숨쉬기 → e4 칸(6칸 거의 같은 자세)
// R1101b: Dots CX-0119GD r1 대기 6칸(GD-5 se·GD-6 ne·GD-7 e, 시선·총구 같은 쪽, 왼쪽 w·sw·nw 는 거울) — 몸 키 183·발 96·227 로 맞춘 사본. 6칸을 .15초씩(게임 시간).
//  {"idle6":false} 면 R1101(e 만 attack-e4), {"sideIdle":false} 면 모두 예전 R128.
const IDLE6={e:'assets/r1101b/gunner/idle-e6.webp',se:'assets/r1101b/gunner/idle-se6.webp',ne:'assets/r1101b/gunner/idle-ne6.webp'},IDLE_D=/^assets\/r128\/gunner\/idle-(e|se|ne|w|sw|nw)\.webp$/,LEFT6={w:'e',sw:'se',nw:'ne'},IDLE_STEP6=.15;
function sideIdle(rec,st){if(prefs.sideIdle===false)return 0;const six=prefs.idle6!==false;if(!six&&!/r1045c\/gunner\/attack-e4/.test(SHEET.e.path))return 0;let n=0;
 for(let i=Math.max(0,st|0);i<(rec?.commands?.length||0);i++){const c=rec.commands[i];if(c?.kind!=='image'||!c.points||!c.sourceRect)continue;
  const m=IDLE_D.exec(srcOf(c));if(!m||(!six&&m[1]!=='e'))continue;const lf=LEFT6[m[1]],path=six?IDLE6[lf||m[1]]:SHEET.e.path;
  const row=typeof readyImage==='function'?readyImage(path):null;if(!row?.image){image(path);continue;}
  if(toFullCell(c,row.image,path)){c.sourceRect[0]=six?(Math.floor(Math.max(0,fin(T()))/IDLE_STEP6)%6)*CW:c.sourceRect[0]%(CW*6);c.r1101Idle=six?m[1]:true;
   if(lf){const P=c.points,mid=(P[0][0]+P[1][0])/2;c.points=P.map(([x,y])=>[2*mid-x,y]);} /* R128 왼쪽 그림(w·sw·nw)은 오른쪽 그림의 거울 → 새 오른쪽 그림을 발 중심으로 뒤집어 그림 */
   n++;}}
 stats.sideIdle=(stats.sideIdle||0)+n;return n;}
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
// R1110: 쏘는 도중(attackAnim>0) 기록된 조준이 .6초 넘게 묵으면(표적이 사거리 밖으로 걸어 나가 새 기록이 안 생김) R143 이 걷는 쪽으로 반전해 그린 attack-e 칸이 끼어 반대쪽을 봤다
//  → 묵었으면 지금 가장 가까운 적(넓은 사거리)으로 다시 고르고, 그것도 없으면 마지막 기록을 그대로 쓴다. 기록 자체(탄 출발점)는 건드리지 않는다.
function liveSwing(){const sw=swingOf(player);if(sw&&T()-sw.at<=.6)return sw;if(!(player.attackAnim>0)||prefs.staleSwing===false)return null;
 try{const a=aimNow(40);if(a){const pk=pick(a.a);return{...a,...pk,at:T()};}}catch(e){fail(e);}return sw&&T()-sw.at<=3?sw:null;}
function replace(rec,st){const sw=liveSwing();if(!sw||!(player.attackAnim>0))return;
 for(let i=st;i<rec.commands.length;i++){const c=rec.commands[i];if(c.kind!=='image'||!c.r143Attack||!c.points||!c.sourceRect)continue;
  const src=String(c.sourcePath||c.image?.src||''),m=/(?:r143\/attack|r1003|r1045|r1101b|r1101c)\/gunner\/attack-([a-z0-9]+)\.webp/.exec(src);if(!m)continue;
  const P=c.points,oldMir=P[1][0]<P[0][0],fOld=oldMir?-1:1,k=Math.abs(P[1][0]-P[0][0])/CW,ky=(P[3][1]-P[0][1])/CH;if(!(k>0)||!Number.isFinite(ky))return;
  if(m[1]===sw.sheet&&oldMir===sw.mirror&&src.includes(pathOf(sw.sheet)))return;/* R1045: 같은 칸 이름이어도 n·e 는 새 그림 경로로 바꿈 */const p=pathOf(sw.sheet),im=image(p);if(!im)return;
  const fx=P[0][0]+fOld*FX*k,fy=P[0][1]+FY*ky,f=sw.mirror?-1:1,X=v=>fx+f*(v-FX)*k,Y=v=>fy+(v-FY)*ky,sx=Math.round(clamp(Math.round(fin(c.sourceRect[0])/CW),0,5)*(fin(SHEET[sw.sheet]?.frames,6)-1)/5)*CW;
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
  if(!sw||T()-sw.at>.45){plainWalk(rec,i);return;}const W=WALK[sw.sheet],im=W&&image(W.path);if(!im)return;const f=sw.mirror?-1:1,X=v=>fx+f*(v-idx*CW-FX)*k,Y=v=>fy+(v-WFY)*k;
  const pts=[[X(idx*CW),Y(0)],[X(idx*CW+CW),Y(0)],[X(idx*CW+CW),Y(CH)],[X(idx*CW),Y(CH)]];if(pts.flat().some(v=>!Number.isFinite(v)))return;
  Object.assign(c,{image:im,sourcePath:W.path,sourceRect:[idx*CW,0,CW,CH],imageSize:[im.naturalWidth||im.width,im.naturalHeight||im.height],points:pts,r991Walk:{sheet:sw.sheet,mirror:sw.mirror}});stats.walk=(stats.walk||0)+1;return;}}
// 처음 쓰는 순간 그림이 없어 예전 그림이 한 번 보이지 않게 기억사수일 때 미리 받는다(지역을 옮기면 게임이 그림 기억을 비우므로 2초마다 확인)
let preAt=0;function preload(){const t=Date.now();if(t-preAt<2000)return;preAt=t;try{for(const p of [...SHEETS.map(pathOf),...Object.values(WALK).map(w=>w.path),IDLE_S2.path,...(prefs.idle6!==false?Object.values(IDLE6):[])])if(!(typeof readyImage==='function'&&readyImage(p)))image(p);}catch(e){fail(e);}}
function wrapDraw(){if(typeof drawHero!=='function'||drawHero.r991)return;const base=drawHero;const w=function(...a){if(on())preload();const rec=typeof ctx==='object'?ctx:null,st=Array.isArray(rec?.commands)?rec.commands.length:-1;const r=base.apply(this,a);
  try{if(st>=0&&on()){for(let i=st;i<rec.commands.length;i++)if(rec.commands[i]?.r121Walk){walkAt=T();break;}if(solo()){replace(rec,st);if(T()-walkAt<.05)replaceWalk(rec,st);if(!(player.attackAnim>0)&&prefs.idle!==false)replaceIdle(rec,st);if(!(player.attackAnim>0))sideIdle(rec,st);}}}catch(e){fail(e);}return r;};w.r991=true;drawHero=w;}
function install(){try{wrapAttack();wrapShot();wrapDraw();}catch(e){fail(e);}}
try{if(typeof document!=='undefined'&&document.readyState==='complete')install();else if(typeof window.addEventListener==='function')window.addEventListener('load',install);}catch(e){fail(e);}
function set(k,v){prefs[k]=v;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
window.__STORYWORLD_GUNNER_AIM_R991__=Object.freeze({revision:REV,SHEETS,pick,tip,gunAngle,faceAngle,screenToGround,set,install,
 plainWalk,sideIdle,
 walks:()=>Object.fromEntries(Object.entries(WALK).map(([k,w])=>[k,{path:w.path,tip:w.tip.map(v=>v.slice())}])),
 inspect:()=>({revision:REV,prefs:{...prefs},sheets:Object.fromEntries(SHEETS.map(k=>[k,pathOf(k)])),stats:{...stats},lastError,swing:(()=>{try{const s=swingOf(player);return s?{sheet:s.sheet,mirror:s.mirror,a:s.a}:null;}catch(_){return null;}})(),browser:false,GPU:false})});
})();
