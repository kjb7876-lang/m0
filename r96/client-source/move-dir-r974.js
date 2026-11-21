// R974 보스·중간보스 방향 이동 — 사용자 2026-11-12 "모든보스몹과 일반몹 위아래 이동모션은 최소4프레임… 옆모습이동 없는경우 이것도… 위아래옆3가지 방향만 있으면됨 좌우는 서로 반전", "일단 이동만".
//  Dots CX-0082MV 결과 가운데 지금 게임 그림과 같은 인물로 확인한 26종(표 move-dir-r974-data.js, scripts/r974-move-dir.py)의 옆·아래·위 4프레임 시트(384칸, 8fps).
//  · 몹 그림은 옆모습 한 장을 좌우로 뒤집어 써서 화면 위·아래로 걸을 때 옆으로 미끄러져 보였다 → 걷는 동안만 방향 시트로 바꾼다.
//  · 바꾸는 때: 살아 있고, 공격·시전·피격이 아니고, 실제로 움직이고(게임 시간 기준 속도), 엔진이 지금 그린 몸이 표의 '대기 그림'일 때만.
//    공격 자세·패턴 그림·다른 덧씌우기 그림(R380 등)이 그려진 프레임은 건드리지 않는다. 시트가 안 실렸으면 엔진 그림 그대로.
//  · 크기·발: 엔진이 마지막으로 그린 대기 그림의 몸통 키(가는 꼬리·칼끝을 뺀 값, R205 최소 크기 맞춤과 같은 잣대)와 발 줄(알파 테두리)을 읽어 같은 몸통 키·같은 발 자리로 놓는다(다른 덧씌우기가 키운 크기를 그대로 따름). 값은 표에 미리 재 둔다.
//  · 방향: 화면 속도를 고르게 한 값. 위·아래로 들어갈 때는 세로가 가로의 1.25배 넘게, 나올 때는 .8배 아래로(오락가락 방지). 옆 시트는 오른쪽을 보는 그림 → 왼쪽으로 가면 뒤집는다. 앞·뒤 모습은 뒤집지 않는다.
//  · 그림만 바꾼다. 판정·피해·체력·AI·속도·저장은 그대로. 불면귀(R973)·맘몬·페르소나는 표에 없다.
//  끄기: localStorage['storyworld.r974.moveDir']='{"on":false}'. 점검: window.__STORYWORLD_MOVE_DIR_R974__.inspect()
(()=>{'use strict';
if(window.__STORYWORLD_MOVE_DIR_R974__)return;
const REV='R974-move-dir-1',KEY='storyworld.r974.moveDir';
let prefs={on:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s==='object')for(const k of Object.keys(prefs))if(typeof s[k]==='boolean')prefs[k]=s[k];}catch(_){}
const stats={draws:0,swapped:0,waiting:0,otherArt:0,dropped:0,errors:0,warm:0,gait:0};let lastError=null,last=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const DATA=window.__STORYWORLD_MOVE_DIR_R974_DATA__?.enemies||{};
// The DREAM inspector's robe is a different body from the STORY machine.
const DREAM_INSPECTOR={"idle":[{"path":"assets/r104/bosses/u204-mid-p4.webp","rect":[0,0,386,438],"size":[386,438],"bbox":[89,6,316,407],"body":379}],"cell":320,"n":4,"fps":7,"dirs":{"side":{"path":"assets/sw0014/u204-mid-side.webp","px":136.5,"py":299.0,"vis":259.5},"down":{"path":"assets/sw0014/u204-mid-down.webp","px":169.5,"py":299.0,"vis":259.5},"up":{"path":"assets/sw0014/u204-mid-up.webp","px":149.8,"py":299.0,"vis":259.0}}};
const T=()=>typeof time==='number'&&Number.isFinite(time)?time:performance.now()/1000;
const FX=/r251\/atlas|pixelfx|\/fx|effect|vfx|ring|circle|sigil|shadow|aura|hexagram|blood|flame|r572|r571|r92\/boss|death|dissol|burn/i;
const srcOf=c=>String(c?.sourcePath||c?.image?.currentSrc||c?.image?.src||'');
const Hq=c=>Math.abs(c.points[3][1]-c.points[0][1]);
function entry(e){
 if(!e||!(e.hp>0)||e.persona)return null;
 if(e.nativeId==='u204-mid'&&typeof layer==='string'&&layer==='DREAM')return movingBoss(e)?DREAM_INSPECTOR:null;
 return DATA[String(e.nativeId||'')]||null;
}
function img(p){try{const r=typeof readyImage==='function'?readyImage(p):null;if(r&&r.ready!==false&&r.image)return r.image;}catch(_){}
 try{if(typeof addImage==='function')addImage(p,'R974 방향 이동');}catch(_){}return null;}
// 이펙트 그림은 몸으로 치지 않는다. 단 육망성 실험체 몹 그림(mobs/hexagram-experiment)과 방향 이동 시트는 이름에 hexagram 이 있어도 몸이다(R1018 육망성 실험체).
function bodyCmd(cmds,st0){let best=null,bh=0;for(let i=st0;i<cmds.length;i++){const c=cmds[i];if(c?.kind!=='image'||c.owner?.kind!=='enemy'||c.r620Ghost||c.r760Ghost||!Array.isArray(c.points)||c.points.length<4)continue;
  if(FX.test(srcOf(c))&&!/assets\/r974\/|\/mobs\/hexagram-experiment|assets\/r\d+\/move\//.test(srcOf(c)))continue;const h=Hq(c);if(h>bh){bh=h;best=c;}}return best;}
// 지금 그려진 몸이 표의 대기 그림인가(경로 끝·칸이 같아야 함)
function idleOf(D,c){const p=srcOf(c),r=c.sourceRect;for(const I of D.idle){if(!p.endsWith(I.path))continue;if(!Array.isArray(r)||r.length<4)return I;
  if(Math.abs(r[0]-I.rect[0])<=1.5&&Math.abs(r[1]-I.rect[1])<=1.5&&Math.abs(r[2]-I.rect[2])<=1.5&&Math.abs(r[3]-I.rect[3])<=1.5)return I;}return null;}
const ST=new WeakMap();const stOf=e=>{let s=ST.get(e);if(!s)ST.set(e,s={wx:NaN,wy:NaN,move:0,lastT:-1,hx:0,hy:0,dir:'side',sideSg:1,seed:seedOf(e),stride:0,stableAt:0,bodyKey:null,warmed:null});return s;};
const seedOf=e=>{const t=String(e?.id??e?.nativeId??'');let h=7;for(let i=0;i<t.length;i++)h=(h*31+t.charCodeAt(i))%9973;return h%4;};
// 그리기 한 번에 한 번, 게임 시간으로: 걷는지 + 화면에서 어느 쪽으로 가는지. 위치가 한 번에 크게 튀면(순간이동·밀려남) 걸음으로 보지 않는다.
function track(e,s){const t=T(),dt=s.lastT<0?0:Math.max(0,Math.min(.1,t-s.lastT));if(s.lastT>=0&&dt<=0)return;s.lastT=t;
 if(Number.isFinite(s.wx)&&dt>0){const d=Math.hypot(e.x-s.wx,e.y-s.wy),sp=d/dt,jump=d>.9;
  if(!jump){if(sp>.18)s.stride=(s.stride+d/1.6)%1;let sx,sy;try{const a=project(s.wx,s.wy),b=project(e.x,e.y);sx=(b.x-a.x)/dt;sy=(b.y-a.y)/dt;}catch(_){sx=((e.x-s.wx)-(e.y-s.wy))/dt;sy=((e.x-s.wx)+(e.y-s.wy))/dt;}
   if(Number.isFinite(sx)&&Number.isFinite(sy)){const k=Math.min(1,dt*6);s.hx+=(sx-s.hx)*k;s.hy+=(sy-s.hy)*k;const ax=Math.abs(s.hx),ay=Math.abs(s.hy),v=s.dir==='up'||s.dir==='down';
    if(v?ay<ax*.8:!(ay>ax*1.25)){s.dir='side';if(ax>1e-6)s.sideSg=s.hx>0?1:-1;}else s.dir=s.hy<0?'up':'down';}}
  s.move+=(((!jump&&sp>.18)?1:0)-s.move)*Math.min(1,dt*8);}
 s.wx=e.x;s.wy=e.y;}
const busy=e=>!!e.attack||e.state==='attack'||e.state==='cast'||e.state==='windup'||e.hitTimer>0||e.stunned>0||e.frozen>0;
function setImg(c,im,path,w,h){c.image=im;c.sourcePath=path;const iw=im.naturalWidth||im.width||w,ih=im.naturalHeight||im.height||h;c.imageSize=[iw,ih];}
// R1125: 같은 번호가 지역·이름에 따라 다른 그림으로 나오면 표 항목에 alt(다른 그림의 항목)가 붙는다 → 지금 그린 대기 그림에 맞는 항목을 고른다(본 항목 먼저).
function pick(D,c){const I=idleOf(D,c);if(I)return [D,I];if(Array.isArray(D.alt))for(const A of D.alt){const J=A&&A.idle?idleOf(A,c):null;if(J)return [A,J];}return null;}
// SW-0017. Contact rows measured from the solid leg tips of the existing sheets.
const SPIDER_FEET=[
 {path:'assets/r380/mobs/u204-mech-03-v1.webp',size:256,feet:[188,187,194,193]},
 {path:'assets/r1018/move/u204-mech-03-down.webp',size:384,feet:[341,347,349,342]},
 {path:'assets/r1018/move/u204-mech-03-up.webp',size:384,feet:[351,351,349,342]}];
function thresholdSpider(e){
 return e.nativeId==='u204-e3'&&typeof room==='object'&&room?.id==='u204'&&room.layer==='STORY'&&!room.samongR103;
}
function strideFrame(s,n){return (Math.floor(s.stride*n)+s.seed)%n;}
function groundSpider(e,c,s,walking){
 const src=srcOf(c).split('?')[0],rect=c.sourceRect;
 const gait=SPIDER_FEET.find(f=>src.endsWith(f.path));
 if(!gait||!Array.isArray(rect)||rect[2]!==gait.size||rect[3]!==gait.size)return false;
 let step=Math.round(rect[0]/gait.size);
 if(!gait.feet[step])return false; // The side sheet also contains attack frames.
 if(walking&&gait===SPIDER_FEET[0]){step=strideFrame(s,gait.feet.length);c.sourceRect=[step*gait.size,0,gait.size,gait.size];}
 const P=c.points,plant=P[0][1]+(P[3][1]-P[0][1])*gait.feet[step]/gait.size,delta=project(e.x,e.y).y-plant;
 if(!Number.isFinite(delta))return false;
 c.points=P.map(([x,y])=>[x,y+delta]);c.r974Grounded=true;
 return true;
}
function swap(e,D0,c,s,cmds,st0,spider){
 const m=pick(D0,c);if(!m){stats.otherArt++;last={id:e.nativeId,why:'other-art',src:srcOf(c).split('/').pop()};return false;}
 const [D,I]=m,S=D.dirs[s.dir];if(!S){last={id:e.nativeId,why:'no-'+s.dir};return;}
 const im=img(S.path);if(!im){stats.waiting++;last={id:e.nativeId,why:'loading'};return;}
 // 엔진이 그린 대기 그림의 화면 사각형 → 보이는 키·발 줄·가운데
 const P=c.points,W=P[1][0]-P[0][0],top=Math.min(P[0][1],P[3][1]),H=Hq(c),rw=I.rect[2],rh=I.rect[3],B=I.bbox;
 const vis=H*I.body/rh,footY=top+H*B[3]/rh,cx=P[0][0]+W*((B[0]+B[2])/2/rw);
 const kk=vis/S.vis,sg=s.dir==='side'?s.sideSg:1,x0=cx-sg*S.px*kk,y0=footY-S.py*kk,w=D.cell*kk,f=spider?strideFrame(s,D.n):(Math.floor(T()*D.fps)+s.seed)%D.n;
 // R620 이 옛 자세끼리 섞으려 얹은 교차 보간 잔상(옛 그림)은 뺀다
 for(let i=cmds.length-1;i>=st0;i--){const k=cmds[i];if(k!==c&&k?.kind==='image'&&k.r620Ghost&&k.owner?.kind==='enemy'){cmds.splice(i,1);stats.dropped++;}}
 c.points=[[x0,y0],[x0+sg*w,y0],[x0+sg*w,y0+w],[x0,y0+w]];setImg(c,im,S.path,D.cell*D.n,D.cell);c.sourceRect=[f*D.cell,0,D.cell,D.cell];c.r974=s.dir;
 stats.swapped++;last={id:e.nativeId,dir:s.dir,frame:f,vis:+vis.toFixed(1),flip:sg<0};return true;}
// R1029 떠서 이동: 방향 시트가 없는 몹·보스(걷는 동안 그림이 한 장뿐) — 사용자 2026-11-14 "날개가 펄럭이며 이동 혹은 유령은 아래발을 유령답게 흩날리게 … 다리쪽을 흑색짙은불꽃안개구름".
//  표(move-float-r1029-data.js)는 그림(경로|칸)으로 찾는다. 엔진이 그린 몸 사각형을 시트 여백만큼만 넓혀 같은 자리·같은 좌우 뒤집힘·같은 기울기로 8칸 시트를 놓는다. 끄기: localStorage['storyworld.r1029.moveFloat']='{"on":false}'
const FKEY='storyworld.r1029.moveFloat';let fprefs={on:true};try{const s=JSON.parse(localStorage.getItem(FKEY)||'null');if(s&&typeof s.on==='boolean')fprefs.on=s.on;}catch(_){}
// SW-0014 strips use the exact body and crop already chosen by the renderer.
const BOSS_STRIPS={
 "r104/bosses/mb-dist06-p4.webp|0,0,398,432": {"path":"assets/sw0014/mb-dist06-gait.webp","cw":320,"ch":344,"fps":7,"n":6,"pad":[0.0552764,0.0601852,0.0527638,0.037037],"kind":"gait"},
 "r104/bosses/mb-ep1a10-p4.webp|0,0,455,473": {"path":"assets/sw0014/mb-ep1a10-gait.webp","cw":332,"ch":339,"fps":7,"n":6,"pad":[0.0571429,0.0443975,0.0175824,0.012685],"kind":"gait"},
 "r104/bosses/b02-boss-p4.webp|0,0,388,443": {"path":"assets/sw0014/b02-boss-gait.webp","cw":314,"ch":344,"fps":7,"n":6,"pad":[0.056701,0.0586907,0.056701,0.0090293],"kind":"gait"},
 "r104/bosses/mb-ep1b06-p4.webp|0,0,334,425": {"path":"assets/sw0014/mb-ep1b06-gait.webp","cw":257,"ch":344,"fps":7,"n":6,"pad":[0.0239521,0.0611765,0.0209581,0.0376471],"kind":"gait"},
 "r104/bosses/b06-boss-p4.webp|0,0,265,439": {"path":"assets/sw0014/b06-boss-gait.webp","cw":207,"ch":344,"fps":7,"n":6,"pad":[0.0415094,0.0592255,0.0415094,0.0250569],"kind":"gait"},
 "r104/bosses/mb-ep1b06b-p4.webp|0,0,424,458": {"path":"assets/sw0014/mb-ep1b06b-gait.webp","cw":325,"ch":344,"fps":7,"n":6,"pad":[0.0518868,0.0567686,0.0495283,0.0240175],"kind":"gait"},
 "r104/bosses/b06b-boss-p4.webp|0,0,296,433": {"path":"assets/sw0014/b06b-boss-gait.webp","cw":227,"ch":344,"fps":7,"n":6,"pad":[0.0168919,0.0623557,0.0304054,0.0230947],"kind":"gait"},
 "r104/bosses/u204-mid-p4.webp|0,0,386,438": {"path":"assets/sw0014/u204-mid-gait.webp","cw":290,"ch":344,"fps":7,"n":6,"pad":[0.0336788,0.0593607,0.0336788,0.0570776],"kind":"gait"},
 "generated-v31224/actors-normalized/c5859bd35492_controller_idle.webp|0,0,672,384": {"path":"assets/sw0014/u203-boss-gait.webp","cw":298,"ch":336,"fps":7,"n":6,"pad":[-0.2782738,-0.1041667,-0.2782738,-0.0208333],"kind":"gait"},
 "rc140/story-cycle-motions/mb-kair01-v31231.png|0,0,726,724": {"path":"assets/sw0014/mb-kair01-v31231-gait.webp","cw":317,"ch":344,"fps":7,"n":6,"pad":[-0.1225895,0.0069061,0.0482094,0.0013812],"kind":"gait"},
 "generated-v31224/actors-normalized/b19d67bb1973_siren_idle.webp|0,0,672,384": {"path":"assets/sw0014/k103-boss-gait.webp","cw":326,"ch":335,"fps":7,"n":6,"pad":[-0.2574405,-0.1015625,-0.2574405,-0.0260417],"kind":"gait"},
 "rc140/story-cycle-motions/c101-mid.png|0,0,661,724": {"path":"assets/sw0014/c101-mid-gait.webp","cw":315,"ch":344,"fps":7,"n":6,"pad":[0.0605144,0.0469613,0.0590015,0.0676796],"kind":"gait"},
 "boss-actions-20261011/c102-boss-poses.png|160,5,545,505": {"path":"assets/sw0014/c102-boss-gait.webp","cw":332,"ch":302,"fps":7,"n":6,"pad":[0.0697248,0.0455446,0.0697248,0.0732673],"kind":"gait"},
 "rc140/story-cycle-motions/c105-mid.png|0,0,728,724": {"path":"assets/sw0014/c105-mid-gait.webp","cw":332,"ch":328,"fps":7,"n":6,"pad":[0.0576923,0.0372928,0.043956,0.058011],"kind":"gait"},
 "rc140/story-cycle-motions/c106-mid.png|0,0,685,724": {"path":"assets/sw0014/c106-mid-gait.webp","cw":330,"ch":344,"fps":7,"n":6,"pad":[0.0656934,0.0524862,0.0656934,0.0649171],"kind":"gait"}
};
const fstats={draws:0,swapped:0,waiting:0};let FIDX=null,FSRC;
function fIndex(){const A=window.__STORYWORLD_MOVE_FLOAT_R1029_DATA__?.arts||null;if(A===FSRC)return FIDX;FSRC=A;const M=new Map();
 for(const [k,S] of Object.entries({...A,...BOSS_STRIPS})){
  const i=k.lastIndexOf('|'),p=k.slice(0,i),r=k.slice(i+1).split(',').map(Number),b=p.split('/').pop();
  if(r.length!==4||!r.every(Number.isFinite))continue;
  const backup=BOSS_STRIPS[k]&&A?.[k]||null;
  if(!M.has(b))M.set(b,[]);M.get(b).push({p,r,S,backup});
 }
 FIDX=M;return M;}
function floatOf(c,s,boss){const M=FIDX;if(!M)return null;const p=srcOf(c).split('?')[0],L=M.get(p.split('/').pop());if(!L)return null;
 const r=c.sourceRect,z=c.imageSize;
 for(const q of L){
  if(!(p===q.p||p.endsWith('/'+q.p)))continue;
  const same=Array.isArray(r)&&r.length>=4
   ?q.r.every((v,i)=>Math.abs(v-r[i])<=1.5)
   :Array.isArray(z)&&q.r[0]===0&&q.r[1]===0&&Math.abs(z[0]-q.r[2])<=1.5&&Math.abs(z[1]-q.r[3])<=1.5;
  if(!same)continue;
  if(!boss)return q.backup||q.S;
  if(!q.backup||readyImage(q.S.path)?.image)return q.S;
  // The actor-specific gait replaces the generic float on the same body.
  // Existing float art can bridge a cold entry without two idle downloads.
  warmFloat(q.S,s);
  if(readyImage(q.backup.path)?.image)return q.backup;
  if(s.move>.5)warmFloat(q.backup,s);
  return q.S;
 }
 return null;}
function floatSwap(e,c,s,S){if(!S||c.r974)return false;fstats.draws++;const im=img(S.path);if(!im){fstats.waiting++;return false;}
 const P=c.points,ux=P[1][0]-P[0][0],uy=P[1][1]-P[0][1],vx=P[3][0]-P[0][0],vy=P[3][1]-P[0][1],[l,t,r,b]=S.pad,f=(Math.floor(T()*S.fps)+s.seed)%S.n;
 if(![ux,uy,vx,vy].every(Number.isFinite))return;
 c.points=[[P[0][0]-ux*l-vx*t,P[0][1]-uy*l-vy*t],[P[1][0]+ux*r-vx*t,P[1][1]+uy*r-vy*t],[P[2][0]+ux*r+vx*b,P[2][1]+uy*r+vy*b],[P[3][0]-ux*l+vx*b,P[3][1]-uy*l+vy*b]];
 setImg(c,im,S.path,S.cw*S.n,S.ch);c.sourceRect=[f*S.cw,0,S.cw,S.ch];c.r1029='float';fstats.swapped++;last={id:e.nativeId,float:S.kind,frame:f};return true;}
function movingBoss(e){
 return !!(e&&(e.boss||e.midboss)&&!(e.persona||e.stationary||e.immobile||e.rooted||e.turret||e.prop||e.object||e.r75Tower||e.r170Tower||e.r251Circle||e.r446Pillar));
}
// Only warm the sheet for a live boss's current body. The cache can evict
// between fights, so a later draw may request the same registered sheet again.
function warmFloat(S,s){
 if(!S)return;
 const warmed=s.warmed??=new Map(),until=warmed.get(S.path);
 if(until!==undefined&&s.lastT<until)return;
 warmed.set(S.path,s.lastT+2);
 img(S.path);stats.warm++;
}
function gaitFallback(c,s){
 const key=srcOf(c)+'|'+String(c.sourceRect||'');
 if(s.bodyKey!==key||s.stableAt>s.lastT){s.bodyKey=key;s.stableAt=s.lastT;return;}
 if(s.lastT-s.stableAt<.22||typeof settings==='object'&&settings?.reducedMotion)return;
 const P=c.points,h=Hq(c),step=Math.sin(s.stride*Math.PI*2),vertical=s.dir==='side'?1:.55;
 const sway=step*h*.025*vertical,lift=Math.abs(step)*h*.018;
 // Keep the foot line anchored. Only change the existing body command.
 c.points=[[P[0][0]+sway,P[0][1]-lift],[P[1][0]+sway,P[1][1]-lift],P[2],P[3]];
 c.r974Gait=true;stats.gait++;
}
function moveArt(e,D,F,boss,cmds,st0){
 if(!e||!(e.hp>0)||e.persona)return;
 const s=stOf(e);track(e,s);
 const casting=e.rangedWindup>0||e.r61Action&&!e.r61Action.cancelled&&s.lastT<e.r61Action.endAt||s.lastT<e.storyAttackUntil5;
 const spider=prefs.on&&thresholdSpider(e);
 const blocked=busy(e)||(D===DREAM_INSPECTOR||spider)&&casting,walking=s.move>.5&&!blocked;
 if(D){stats.draws++;if(!walking)last={id:e.nativeId,why:blocked?'busy':'still'};}
 if(blocked||!walking&&!boss&&!spider){s.bodyKey=null;return;}
 const c=bodyCmd(cmds,st0);if(!c)return;
 if(walking&&D&&swap(e,D,c,s,cmds,st0,spider)){
  if(spider)groundSpider(e,c,s,true);
  s.bodyKey=null;return;
 }
 if(spider&&groundSpider(e,c,s,walking))return;
 const S=F&&floatOf(c,s,boss);
 if(!walking){warmFloat(S,s);s.bodyKey=null;return;}
 if(F&&(S?.kind!=='gait'||boss&&!casting)&&floatSwap(e,c,s,S)){s.bodyKey=null;return;}
 if(boss&&!casting)gaitFallback(c,s);
}
const asked=new WeakSet();
// 맨 바깥에서 바꿔야 한다(R620 보간·R425 크기·R205 최소 크기가 다 다듬은 몸을 읽으려고). 이 파일 뒤에 실리는 덧씌우기가 drawEnemy 를 또 감싸므로
//  불러온 뒤 한 번 미뤄 씌우고, 그 뒤에도 누가 바깥을 감싼 것이 보이면(drawEnemy 가 내 함수가 아님) 다시 맨 바깥에 씌운다(최대 6번). 안쪽에 남은 내 옛 감싸기는 그냥 지나간다(depth).
let mine=null,wraps=0,depth=0;
function wrap(){if(typeof drawEnemy!=='function'||drawEnemy===mine||wraps>=6)return !!mine;const base=drawEnemy;
 const w=function(e,...a){const D=prefs.on?entry(e):null,F=fprefs.on?fIndex():null,boss=prefs.on&&movingBoss(e);if(!D&&!F&&!boss)return base.call(this,e,...a);
  if(D&&!asked.has(e)){asked.add(e);for(const V of [D,...(Array.isArray(D.alt)?D.alt:[])])for(const k of Object.keys(V?.dirs||{}))img(V.dirs[k].path);}
  const cm=(typeof ctx!=='undefined'&&Array.isArray(ctx?.commands))?ctx.commands:null,st0=cm?cm.length:-1;depth++;let r;try{r=base.call(this,e,...a);}finally{depth--;}
  if(depth===0){if(cm&&st0>=0)try{moveArt(e,D,F,boss,cm,st0);}catch(err){fail(err);}try{if(drawEnemy!==mine)wrap();}catch(err){fail(err);}}return r;};
 for(const k of Object.keys(base))try{w[k]=base[k];}catch(_){}w.__r974=true;try{drawEnemy=w;}catch(_){return !!mine;}mine=w;wraps++;return true;}
let installed=false;const install=()=>{installed=wrap()||installed;};
if(typeof setTimeout==='function')setTimeout(install,0);else install();
window.__STORYWORLD_MOVE_DIR_R974__=Object.freeze({rev:REV,inspect:()=>({rev:REV,installed,wraps,outermost:typeof drawEnemy==='function'&&drawEnemy===mine,enemies:Object.keys(DATA).length,prefs:{...prefs},stats:{...stats},float:{on:fprefs.on,arts:Object.keys(window.__STORYWORLD_MOVE_FLOAT_R1029_DATA__?.arts||{}).length,...fstats},last,lastError}),
 set(p={}){for(const k of Object.keys(prefs))if(typeof p[k]==='boolean')prefs[k]=p[k];try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return {...prefs};}});
})();
