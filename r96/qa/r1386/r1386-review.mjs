// R1386 QA 심사 자료: 2D 기억사수(3D 끈 조종 영웅 = R1374 2D 몸, R1386 예외 경로) 8방향 × 상태(기본 공격·Q 레이저·끝 0.4초·끝 0.9초)
//  각 칸: 같은 축척(영웅 화면 자리 중심 340×290 자르기). 측정: 몸 그림 사각(points) 키·폭·발 y, 그림 총구(R991 tip 표를 그린 칸에 사상), Q 레이저 시작점.
import {createRequire} from 'node:module';import fs from 'node:fs';
const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/',OUT=process.env.OUT||'/tmp/r1386-review';fs.mkdirSync(OUT,{recursive:true});
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});
await ctx.addInitScript((g8)=>{localStorage.setItem('storyworld.r183.scene3d','{"on":false}');localStorage.setItem('storyworld.r953.gunnerVeil','{"on":false}');localStorage.setItem('storyworld.r663.skillgrowth','{"on":false}');localStorage.setItem('storyworld.r1302.hwando3d','off');if(g8==='off')localStorage.setItem('storyworld.r1374.hero2d','{"gunner8":false}');},process.env.GUNNER8||'on');
const p=await ctx.newPage();p.on('pageerror',e=>console.error('PAGEERR',String(e).slice(0,200)));
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});
const skip=()=>p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:120000});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.go('dist01','STORY');const P=window.__STORYWORLD_PROGRESSION_R71__;if(P?.difficultyState?.().open){P.selectDifficulty('normal');await P.confirmDifficulty();}});
await p.waitForFunction(()=>room?.id==='dist01'&&!loading,null,{timeout:180000});await skip();
await p.evaluate(async()=>{try{window.__STORYWORLD_GUNNER_ARMS_R561__.set({chain:false});}catch(_){}guide=false;auto=false;settings.autoSkill=false;loading=true;try{await ensureImages(heroPaths('gunner'));player.hero='gunner';}finally{loading=false;}
 const W=window.__p={beam:[],pin:null,body:null};
 {const ok=(x,y)=>{if(blocked(x,y,.5))return false;for(let s=0;s<16;s++){const S=s*Math.PI/8;for(const r of [1.6,3.2,4.5])if(blocked(x+Math.cos(S)*r,y+Math.sin(S)*r,.5))return false;}return true;};
  let best=null;for(let r=0;r<30&&!best;r+=.5)for(let a=0;a<6.283&&!best;a+=.3){const x=player.x+Math.cos(a)*r,y=player.y+Math.sin(a)*r;if(ok(x,y))best={x,y};}if(best){player.x=best.x;player.y=best.y;}}
 (function pin(){const P=W.pin;if(P){const e=P.e;e.x=player.x+P.dx;e.y=player.y+P.dy;e.spawnState='active';e.visible=true;e.hp=1e7;e.speed=0;e.attack=null;e.damage=0;for(const v of room.enemies)if(v!==e&&v.hp>0){v.x=player.x-60;v.y=player.y-60;v.speed=0;}}requestAnimationFrame(pin);})();
 // 몸 그림: R1374 관찰자(post)에서 이번 그리기의 영웅 몸 명령을 본다
 const A=window.__STORYWORLD_HERO2D_RULES_R1374__,G=window.__STORYWORLD_GUNNER_AIM_R991__;let st=-1;
 A.qaProbe({pre(){st=Array.isArray(ctx?.commands)?ctx.commands.length:-1;},post(q){if(st<0)return;const sheets=G.inspect().sheets,byPath={};for(const [k,v] of Object.entries(sheets))byPath[String(v).replace(/^.*assets\//,'')]=k;
  let best=null;for(const c of ctx.commands.slice(st)){if(c?.kind!=='image'||c.owner?.kind!=='hero'||!c.points)continue;const src=String(c.sourcePath||'');if(!/gunner\//.test(src))continue;const xs=c.points.map(v=>v[0]),ys=c.points.map(v=>v[1]);const h=Math.max(...ys)-Math.min(...ys);if(!best||h>best.h)best={c,src,h,w:Math.max(...xs)-Math.min(...xs),foot:Math.max(...ys)};}
  if(!best)return;const c=best.c,rel=best.src.replace(/^.*assets\//,''),sheet=byPath[rel]||null;let muzzle=null;
  if(sheet&&c.sourceRect){const [sx,sy,sw,sh]=c.sourceRect,fi=Math.floor(sx/192),t=G.tip(sheet,fi),u=(t[0]-(sx-fi*192))/sw,v=(t[1]-sy)/sh,[tl,tr,,bl]=c.points;muzzle=[tl[0]+u*(tr[0]-tl[0])+v*(bl[0]-tl[0]),tl[1]+u*(tr[1]-tl[1])+v*(bl[1]-tl[1])];}
  W.body={t:time,src:rel,sheet,flip:c.points[1][0]<c.points[0][0],h:best.h,w:best.w,foot:best.foot,muzzle,dir:q.direction,pts:c.points};}});
 // Q 레이저 그림 첫 조각 원점(R1350 방식)
 const hookC=c=>{if(c&&!c.__p1386){c.__p1386=true;const di=c.drawImage;c.drawImage=function(im,...a){try{if(/gunner-q/.test(String(im?.src||''))||im?.width===3072){const m=c.getTransform?.();if(m){/* 몸통 조각: 변환 원점 + dx·dy 를 화면으로 = 레이저 그림 시작 *//* gsDraw 는 그리는 자리(x0,y0)로 옮긴 뒤 각도만큼 돌려 피벗 둘레로 그린다 → 변환 원점 = 레이저 시작점 */W.beam.push({t:time,src:String(im?.src||'').replace(/^.*assets\//,'')||'canvas'+im?.width,x:m.e,y:m.f,ang:Math.atan2(m.b,m.a)*180/Math.PI,args:a.map(v=>+(+v).toFixed(1))});}if(W.beam.length>200)W.beam.shift();}}catch(_){}return di.call(this,im,...a);};}};
 const de=drawEffect;drawEffect=function(...a){try{hookC(ctx);}catch(_){}return de.apply(this,a);};
});
await p.waitForTimeout(2500);
const NAMES=['e','se','s','sw','w','nw','n','ne'],rows=[];
const shot=async(name,clipQ)=>{await p.screenshot({path:`${OUT}/${name}.png`,clip:{x:Math.max(0,clipQ.x-170),y:Math.max(0,clipQ.y-190),width:340,height:290}});};
const freeze=()=>p.evaluate(()=>{window.__spd=window.__spd||null;});
for(let k=0;k<8;k++){const deg=k*45;
 const q0=await p.evaluate(async(deg)=>{const W=window.__p,S=deg*Math.PI/180;/* 화면 각 → 땅: 화면 x∝x−y, y∝(x+y)/2 */const sx=Math.cos(S),sy=Math.sin(S),dx=sx/2+sy,dy=sy-sx/2,L=Math.hypot(dx,dy);room.engaged=true;
  const e=room.enemies.find(v=>v.hp>0&&!v.boss);W.pin={e,dx:dx/L*3.4,dy:dy/L*3.4};player.hp=maxHP();player.invincible=999;player.direction='right';await new Promise(r=>setTimeout(r,1200));return project(player.x,player.y);},deg);
 for(const st of (process.env.STATES||'atk,q,hold04,idle09').split(',')){
  let t0;
  if(st==='atk'){t0=await p.evaluate(()=>{player.attackCD=0;basicAttack(true);return time;});await p.waitForFunction(t=>time>=t+.08,t0,{timeout:240000});}
  else if(st==='q'){t0=await p.evaluate(()=>{player.attackCD=9;player.specialCD=0;window.__p.beam.length=0;special();return time;});await p.waitForFunction(t=>time>=t+.3,t0,{timeout:240000});}
  else{const wait=st==='hold04'?.4:.9;t0=await p.evaluate(()=>{player.attackCD=0;basicAttack(true);player.attackCD=99;return time;});await p.waitForFunction(([t,w])=>time>=t+.24+w&&player.attackAnim<=0&&player.skillAnim<=0,[t0,wait],{timeout:240000});}
  const m=await p.evaluate(()=>{const W=window.__p,q=project(player.x,player.y);const bs=W.beam.filter(b=>/flash/.test(b.src)&&b.t>=time-.5);return {q,body:W.body,beam:bs.length?bs[bs.length-1]:null,beams:W.beam.filter(b=>b.t>=time-.5).slice(-4),time};});
  await shot(`${NAMES[k]}-${st}`,m.q);
  const bd=m.body,beamD=st==='q'&&m.beam&&bd?.muzzle?Math.hypot(m.beam.x-bd.muzzle[0],m.beam.y-bd.muzzle[1]):null;
  rows.push({dir:NAMES[k],state:st,sheet:bd?.src,flip:bd?.flip,h:bd&&+bd.h.toFixed(1),w:bd&&+bd.w.toFixed(1),footY:bd&&+(bd.foot-m.q.y).toFixed(1),muzzle:bd?.muzzle&&bd.muzzle.map((v,i)=>+(v-(i?m.q.y:m.q.x)).toFixed(1)),beam:st==='q'&&m.beam?[+(m.beam.x-m.q.x).toFixed(1),+(m.beam.y-m.q.y).toFixed(1)]:null,beamMuzzlePx:beamD==null?null:+beamD.toFixed(1),drawDir:bd?.dir});
  console.log(JSON.stringify(rows[rows.length-1]));
  await p.waitForFunction(t=>time>=t+1.2,m.time,{timeout:240000});await p.evaluate(()=>{player.attackCD=0;});
 }}
// 전환 이음: 위(n) 공격 끝 → 0.1초 간격 8칸
{const k=6,deg=k*45;await p.evaluate(async(deg)=>{const W=window.__p,S=deg*Math.PI/180,sx=Math.cos(S),sy=Math.sin(S),dx=sx/2+sy,dy=sy-sx/2,L=Math.hypot(dx,dy);W.pin={e:W.pin.e,dx:dx/L*3.4,dy:dy/L*3.4};await new Promise(r=>setTimeout(r,800));},deg);
 const t0=await p.evaluate(()=>{player.attackCD=0;basicAttack(true);player.attackCD=99;return time;});
 for(let i=0;i<8;i++){const tt=.1+i*.12;await p.waitForFunction(([t,w])=>time>=t+w,[t0,tt],{timeout:240000});const m=await p.evaluate(()=>({q:project(player.x,player.y),body:window.__p.body,time,atk:player.attackAnim}));await shot(`seq-${i}`,m.q);console.log('seq',i,JSON.stringify({t:+(m.time-t0).toFixed(2),atk:+m.atk.toFixed(2),sheet:m.body?.src,dir:m.body?.dir}));rows.push({dir:'n',state:'seq'+i,t:+(m.time-t0).toFixed(2),sheet:m.body?.src,flip:m.body?.flip,drawDir:m.body?.dir});}}
// 기본 줌 넓은 장면
await p.screenshot({path:`${OUT}/wide.png`});
fs.writeFileSync(`${OUT}/rows.json`,JSON.stringify(rows,null,1));await b.close();
