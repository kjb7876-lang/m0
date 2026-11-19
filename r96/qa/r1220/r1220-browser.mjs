// R1220 헤드리스 검사(Playwright, 소프트웨어 렌더): 기억사수 기본 공격 연사를 16방향으로 쏘며
//  (1) 화면에 그려진 탄의 꼬리(뒤끝)가 같은 순간 그려진 몸 그림의 총구 끝에 붙어 나오는지(18px 들림·크기 키움 포함 실제 그리기 기준)
//  (2) 탄 굵기가 총구 굵기(그림 칸 총열 지름 × 화면 배율)에 맞는지 — 좌·우 사격에서 굵기, 모든 방향에서 길이 상한
//  (3) 연사 중 몸이 표적 쪽을 계속 보는지(공격·서 있기 그림이 앞뒤로 깜빡이지 않는지)
//  (4) 기본 공격 동안 만들어진 모든 아군 탄이 총구에서 나오는지(패시브·연발 포함)
//   STORYWORLD_URL=http://127.0.0.1:4396/m0/ OUT=out/r1220 node r96/qa/r1220/r1220-browser.mjs   (GPU·실기기·자연 플레이 미검증)
import {createRequire} from 'node:module';import fs from 'node:fs';
const req=createRequire(import.meta.url);let chromium;for(const p of ['playwright','/opt/node22/lib/node_modules/playwright']){try{({chromium}=req(p));break;}catch(_){}}
const URL=process.env.STORYWORLD_URL||'http://127.0.0.1:4396/m0/',OUT=process.env.OUT||'out/r1220';fs.mkdirSync(OUT,{recursive:true});
let fails=0;const check=(n,ok,info)=>{if(!ok)fails++;console.log((ok?'PASS ':'FAIL ')+n+(info===undefined?'':' '+JSON.stringify(info).slice(0,1200)));};
const b=await chromium.launch({headless:true});const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});
await ctx.addInitScript(()=>{try{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));localStorage.setItem('storyworld.r953.gunnerVeil','{"on":false}');localStorage.setItem('storyworld.r663.skillgrowth','{"on":false}');}catch(_){}});
const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(String(e).slice(0,200)));
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await p.waitForTimeout(800);
const skip=()=>p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:120000});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.go('dist01','STORY');const P=window.__STORYWORLD_PROGRESSION_R71__;if(P?.difficultyState?.().open){P.selectDifficulty('normal');await P.confirmDifficulty();}});
await p.waitForFunction(()=>room?.id==='dist01'&&!loading,null,{timeout:180000});await skip();
await p.evaluate(async()=>{try{window.__STORYWORLD_GUNNER_ARMS_R561__.set({chain:false});}catch(_){}guide=false;auto=false;settings.autoSkill=false;loading=true;try{await ensureImages(heroPaths('gunner'));player.hero='gunner';player.combo=0;}finally{loading=false;}updateHUD();
 const A=window.__STORYWORLD_GUNNER_AIM_R991__,R911=window.__STORYWORLD_PROJ_SIZE_R911__;
 const W=window.__r1220={frames:[],shots:[],pin:null,on:false};
 const IDLE_FACE={e:0,se:45,s:90,sw:135,w:180,nw:-135,n:-90,ne:-45};
 function faceOf(c){const s=String(c.sourcePath||c.image?.src||'').replace(/^.*?(assets\/)/,'$1').split('?')[0],mir=c.points[1][0]<c.points[0][0];
  if(c.r991Aim){const f=A.faceAngle(c.r991Aim.sheet,c.r991Aim.mirror)*180/Math.PI;return{f,kind:'atk:'+c.r991Aim.sheet+(c.r991Aim.mirror?'M':''),s};}
  let m=/gunner\/attack-([a-z0-9]+)\.webp/.exec(s);if(m)return{f:null,kind:'atkRaw:'+m[1]+(mir?'M':''),s};
  m=/gunner\/idle-(e|se|ne|n|s|s2|w|sw|nw)6?\.webp/.exec(s);if(m){const d=m[1]==='s2'?'s':m[1];let f=IDLE_FACE[d];if(mir)f=180-f;return{f:((f+540)%360)-180,kind:'idle:'+m[1]+(mir?'M':''),s};}
  return{f:null,kind:'other',s};}
 const dh=drawHero;drawHero=function(...a){const rec=typeof ctx==='object'?ctx:null,st=Array.isArray(rec?.commands)?rec.commands.length:-1;
  /* (5) 기록기 명령 배열의 push 를 감싸 W 탄 줄·E 연사 시트 칸이 들어오는 순간 시트 기준점(piv)의 화면 자리와 그 순간 총구(muzzle)를 적음 */
  try{const C=rec?.commands;if(Array.isArray(C)&&!C.r1220){C.r1220=true;const pb=C.push;C.push=function(...items){try{if(W.skLog)for(const c of items){if(c?.kind!=='image'||!c.points)continue;const src=String(c.sourcePath||c.image?.src||'');const m=/gunner-(w-tracer|e-rifle)\.webp/.exec(src);if(!m)continue;
     const piv=m[1]==='w-tracer'?[0,64,512,128]:[35,139,256,256],Q=c.points,sr=c.sourceRect||[0,0,piv[2],piv[3]],u=piv[0]/piv[2],v=piv[1]/piv[3];const q=project(player.x,player.y),mz=W.G?.muzzle?.();
     W.skLog.push({k:m[1],x:Q[0][0]+(Q[1][0]-Q[0][0])*u+(Q[3][0]-Q[0][0])*v-q.x,y:Q[0][1]+(Q[1][1]-Q[0][1])*u+(Q[3][1]-Q[0][1])*v-q.y,m:mz?[mz.x-q.x,mz.y-q.y]:null,H:actorHeight(),sr});}}catch(e){W.err=String(e);}return pb.apply(this,items);};}}catch(e){W.err=String(e);}const r=dh.apply(this,a);
  try{if(st>=0&&W.on&&player.hero==='gunner'){let best=null,bh=0;for(let i=st;i<rec.commands.length;i++){const c=rec.commands[i];if(c.kind!=='image'||!c.points||!c.sourceRect)continue;if(c.owner&&c.owner.kind!=='hero')continue;const hh=Math.abs(c.points[3][1]-c.points[0][1]);if(hh>bh){bh=hh;best=c;}}
   if(best){const q=project(player.x,player.y),F=faceOf(best),row={t:time,anim:player.attackAnim||0,face:F.f,kind:F.kind,src:F.s.split('/').slice(-2).join('/')};
    if(best.r991Aim){const P=best.points,fr=Math.round(best.sourceRect[0]/192),tp=A.tip(best.r991Aim.sheet,fr),u=tp[0]/192,v=tp[1]/256;
     row.tip=[P[0][0]+(P[1][0]-P[0][0])*u+(P[3][0]-P[0][0])*v-q.x,P[0][1]+(P[1][1]-P[0][1])*u+(P[3][1]-P[0][1])*v-q.y];row.k=Math.hypot(P[1][0]-P[0][0],P[1][1]-P[0][1])/192;}
    W.frames.push(row);}}}catch(e){W.err=String(e);}return r;};
 const ms=makeShot;makeShot=function(...args){const s=ms.apply(this,args);try{if(W.on&&s?.friendly&&player.hero==='gunner'){const q=project(player.x,player.y),o=project(s.x,s.y),m=R911.measure(s),k=m&&!s.r1220Muzzle?R911.scaleFor(m.size):1,/* R911 이 실제로 키우는 조건과 같게(r1220Muzzle 이면 안 키움) */
   fa=Math.atan2((s.vx+s.vy)*.5,s.vx-s.vy);W.shots.push({t:time,kind:s.attackKind9||null,asset:String(s.asset||'').split('/').pop(),cx:m?o.x+m.ox-q.x:null,cy:m?o.y+m.oy-q.y:null,w:m?m.w*k:null,h:m?m.h*k:null,size:m?m.size*k:null,fa,moved:!!s.currentPublicMuzzle?.r991});}}catch(e){W.err=String(e);}return s;};
 {const ok=(x,y)=>{if(typeof blocked==='function'&&blocked(x,y,.5))return false;for(let s=0;s<16;s++){const S=s*Math.PI/8,dx=(Math.cos(S)+2*Math.sin(S))/2,dy=(2*Math.sin(S)-Math.cos(S))/2,L=Math.hypot(dx,dy);for(const r of [1.6,3.2,4])if(blocked(x+dx/L*r,y+dy/L*r,.6))return false;}return true;};
  let best=null;for(let r=0;r<30&&!best;r+=.5)for(let a=0;a<6.283&&!best;a+=.3){const x=player.x+Math.cos(a)*r,y=player.y+Math.sin(a)*r;if(ok(x,y))best={x,y};}if(best){player.x=best.x;player.y=best.y;}W.spot=best;}
 (function pin(){const P=W.pin;if(P){const e=P.e;e.x=player.x+P.dx;e.y=player.y+P.dy;e.spawnState='active';e.visible=true;e.hp=1e7;e.speed=0;e.attack=null;for(const v of room.enemies)if(v!==e&&v.hp>0){v.x=player.x-60;v.y=player.y-60;v.speed=0;}}requestAnimationFrame(pin);})();
});
const D=Math.PI/180,ad=(a,c)=>Math.abs(Math.atan2(Math.sin((a-c)*D),Math.cos((a-c)*D)))/D;
// 총구 지름: R1045c attack-e4 칸 총열 앞끝 세로 굵기 7px(몸 181px 기준, 그림을 열어 잼) — 다른 칸도 같은 총(Dots 같은 가족)
const MUZZLE_D=7;
const ALL=[];
for(let i=0;i<(process.env.SKONLY?0:16);i++){const deg=-180+i*22.5;
 const r=await p.evaluate(async(deg)=>{const W=window.__r1220,S=deg*Math.PI/180,dx=(Math.cos(S)+2*Math.sin(S))/2,dy=(2*Math.sin(S)-Math.cos(S))/2,L=Math.hypot(dx,dy),P=player;room.engaged=true;
  const e=room.enemies.find(v=>v.hp>0&&!v.boss);W.pin={e,dx:dx/L*3.4,dy:dy/L*3.4};P.hp=maxHP();P.invincible=999;keys.clear?.();
  await new Promise(r=>setTimeout(r,300));W.frames=[];W.shots=[];W.on=true;const t0=time;W.iv=setInterval(()=>{try{basicAttack(false);}catch(_){}},50);return t0;},deg);
 await p.waitForFunction((t)=>time>=t+3.2,r,{timeout:240000});
 const shot=await p.evaluate(()=>{const q=project(player.x,player.y);return q;});await p.screenshot({path:`${OUT}/a${String(i).padStart(2,'0')}.png`,clip:{x:Math.max(0,shot.x-110),y:Math.max(0,shot.y-150),width:220,height:220}});
 const log=await p.evaluate(()=>{const W=window.__r1220;clearInterval(W.iv);W.on=false;return{frames:W.frames,shots:W.shots,err:W.err||null};});
 // (1)(4) 탄마다: 다음에 그려진 공격 칸의 총구 끝과 탄 꼬리
 const offs=[];for(const s of log.shots){if(s.cx==null)continue;const f=log.frames.find(f=>f.t>=s.t-1e-6&&f.tip);if(!f)continue;const ux=Math.cos(s.fa),uy=Math.sin(s.fa);
  // 꼬리 = 그려진 몸통 중심에서 날아가는 쪽 반대로 길이 절반(상자 긴 변 기준)
  const half=s.size/2,tx=s.cx-ux*half,ty=s.cy-uy*half;offs.push({d:+Math.hypot(tx-f.tip[0],ty-f.tip[1]).toFixed(1),k:f.k,w:+s.w.toFixed(1),h:+s.h.toFixed(1),size:+s.size.toFixed(1),moved:s.moved,kind:s.kind,asset:s.asset});}
 const t0=log.frames[0]?.t||0,fr=log.frames.filter(f=>f.t>t0+.6&&f.face!=null);const bad=fr.filter(f=>ad(f.face,deg)>67.5);
 let flips=0;for(let j=1;j<fr.length;j++)if(ad(fr[j].face,fr[j-1].face)>60)flips++;
 const kinds={};for(const f of fr)kinds[f.kind]=(kinds[f.kind]||0)+1;
 ALL.push({deg,offs,bad:bad.length,n:fr.length,flips,kinds,err:log.err});console.log(deg,JSON.stringify({n:offs.length,maxOff:Math.max(0,...offs.map(o=>o.d)),size:offs[0],bad:bad.length,flips,kinds}).slice(0,600));}
fs.writeFileSync(`${OUT}/r1220.json`,JSON.stringify(ALL));
// (5) W 망각 저격·E 잔향 연사: 실제 그리기 명령(ctx.scope 'r561:tracer'·'r561:rifle' 안 첫 translate)이 같은 순간 그려진 영웅 그림의 총구 끝(R561 muzzleScreen, Q 광선과 같은 점)에서 시작하는지
const SK=[];
for(const [slot,deg] of [['w',0],['w',180],['w',-90],['e',0],['e',180],['e',90]]){
 const r=await p.evaluate(async([slot,deg])=>{const W=window.__r1220,S=deg*Math.PI/180,dx=(Math.cos(S)+2*Math.sin(S))/2,dy=(2*Math.sin(S)-Math.cos(S))/2,L=Math.hypot(dx,dy),P=player;room.engaged=true;
  const e=room.enemies.find(v=>v.hp>0&&!v.boss);W.pin={e,dx:dx/L*3.4,dy:dy/L*3.4};P.hp=maxHP();P.invincible=999;await new Promise(r=>setTimeout(r,500));
  const G=window.__STORYWORLD_GUNNER_ARMS_R561__,out=[];const sc=ctx.scope;let want=null;
  W.G=G;
  for(let i=0;i<60&&storyScene;i++)advanceScene();if(modal)closePanel(true);for(const k of ['w','e','r'])G.scaleRemain(k,1e-6);await new Promise(r=>setTimeout(r,150));W.skLog=[];const t0=time;let ret;try{ret=G.fire?.(slot);}catch(x){return{err:String(x)};}return{t0,ret,scope:typeof ctx.scope,st:G.inspect().stats,rem:G.inspect().remain,on:G.on()};},[slot,deg]);
 await p.waitForFunction((t)=>time>=t+2.2,r.t0||0,{timeout:240000});
 const log=await p.evaluate(()=>{const W=window.__r1220,l=W.skLog;W.skLog=null;return l;});
 const first=log.find(v=>v.m);SK.push({slot,deg,fire:r,n:log.length,first,d:first?+Math.hypot(first.x-first.m[0],first.y-first.m[1]).toFixed(1):null,old:first?+Math.hypot(first.x,first.y+first.H*.45).toFixed(1):null});console.log('skill',slot,deg,JSON.stringify(SK.at(-1)));}
fs.writeFileSync(`${OUT}/r1220-skills.json`,JSON.stringify(SK));
const kOf=a=>a.offs.find(o=>o.k)?.k||0;
const offAll=ALL.flatMap(a=>a.offs.map(o=>({deg:a.deg,...o,lim:Math.max(4,o.k*14)})));
check('(1) 그려진 탄 꼬리가 같은 순간 그려진 총구 끝에서 나옴(오차 ≤ 총구 지름 2배·최소 4px, 16방향 모든 탄)',offAll.length>=32&&offAll.every(o=>o.d<=o.lim),offAll.filter(o=>o.d>o.lim).slice(0,8).map(o=>({deg:o.deg,d:o.d,lim:+o.lim.toFixed(1)})));
// (2a) 굵기는 R911 상자 재기(48px 축소)가 작은 탄에서 2배쯤 부풀어 — 실제 그리는 칸 크기 × 시트 칸 원본 해상도 불투명(.45) 세로 굵기(8칸 중 최대)로 정확히 잰다
const thick=await p.evaluate(async()=>{const R=window.__STORYWORLD_PROJ_SHEETS_R912__,k=R.kinds.pj04,row=readyImage(k.flyPath);if(!row?.image)return null;const im=row.image,c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const g=c.getContext('2d');g.drawImage(im,0,0);
 const d=g.getImageData(0,0,c.width,c.height).data;let mh=0;for(let f=0;f<k.fly.frames;f++){let y0=1e9,y1=-1;for(let y=0;y<256;y++)for(let x=f*256;x<f*256+256;x++)if(d[(y*c.width+x)*4+3]>115){if(y<y0)y0=y;if(y>y1)y1=y;}if(y1>=0)mh=Math.max(mh,y1-y0+1);}
 const S=actorHeight()*k.size*256/k.fly.bodyLong;return{S,mh,px:S*mh/256,H:actorHeight()};});
const kk=ALL.flatMap(a=>a.offs).find(o=>o.k)?.k||0,md=MUZZLE_D*kk;
check('(2a) 탄 굵기(그려지는 시트 칸의 불투명 세로 굵기 최대) = 총구 지름의 0.6~1.8배',!!thick&&thick.px>=md*.6&&thick.px<=md*1.8,{...thick,muzzle:+md.toFixed(2)});
check('(2b) 모든 방향 탄 길이 ≤ 총구 지름 5배',offAll.every(o=>o.size<=MUZZLE_D*o.k*5),offAll.filter(o=>o.size>MUZZLE_D*o.k*5).slice(0,4).map(o=>({deg:o.deg,size:o.size,muzzle:+(MUZZLE_D*o.k).toFixed(1)})));
check('(3a) 연사 중 몸이 표적 쪽(±67.5°)을 봄 — 16방향 모든 프레임',ALL.every(a=>a.bad===0&&a.n>20),ALL.filter(a=>a.bad||a.n<=20).map(a=>({deg:a.deg,bad:a.bad,n:a.n,kinds:a.kinds})));
check('(3b) 연사 중 몸 방향이 앞뒤로 깜빡이지 않음(60° 넘게 바뀜 ≤ 1번)',ALL.every(a=>a.flips<=1),ALL.filter(a=>a.flips>1).map(a=>({deg:a.deg,flips:a.flips,kinds:a.kinds})));
check('(4) 기본 공격 동안 만든 아군 탄이 모두 총구로 옮겨짐',offAll.length>0&&offAll.every(o=>o.moved),offAll.filter(o=>!o.moved).slice(0,6));
check('(5) W 저격·E 연사 탄이 그려진 총구 끝(≤4px)에서 시작 — 6장면 모두 그려짐',SK.every(k=>k.n>0&&k.d!=null&&k.d<=4),SK);
check('페이지 오류 없음',errors.length===0&&ALL.every(a=>!a.err),errors.concat(ALL.map(a=>a.err).filter(Boolean)));
console.log(JSON.stringify({fails}));await b.close();process.exit(fails?1:0);
