// R1350 헤드리스 검사(Playwright, 소프트웨어 렌더): 기억사수 Q '회상 광선포'가 언제나 실제로 그려진 총구에서 나가는지.
//  사용자 11-27 "기억사수 회상광선포 언제나 정확히 총구에서 나가게" · "총구방향바뀌면 총구계속따라가게".
//  재는 것(그리는 순간의 실제 값끼리 비교 — 같은 게임 시각 프레임):
//   · 광선 시트(gunner-q-beam) 첫 조각 기준점(drawImage 의 변환 원점) = 광선 시작점, 변환 회전 = 광선 화면 각
//   · 3D: 장면 onBeforeRender(자세 R1320 이 걸린 뒤)에서 소총 EmissionFX(총구 끝)·SupportSocket 세계 좌표 → 카메라 투영
//   · 2D: drawHero 가 남긴 몸 그림 명령(R991 r991Aim 칸)의 총구 끝 픽셀 → 화면, 그 칸의 총 각도
//  사례: 3D·2D 각각 8방향 + 칸 경계(22.5° 간격) + 정 위 30° 경계 안팎, 좌우 반전(왼쪽 방향), 발사 중 방향 전환(걷기),
//        발사 중 3D→2D 전환, 판정선(inspect a)과 그린 광선 각 일치.
//   STORYWORLD_URL=http://127.0.0.1:4396/m0/ OUT=out/r1350 node r96/qa/r1350/r1350-browser.mjs   (GPU·실기기·자연 플레이 미검증)
import {createRequire} from 'node:module';import fs from 'node:fs';
const req=createRequire(import.meta.url);let chromium;for(const p of ['playwright','/opt/node22/lib/node_modules/playwright']){try{({chromium}=req(p));break;}catch(_){}}
const URL=process.env.STORYWORLD_URL||'http://127.0.0.1:4396/m0/',OUT=process.env.OUT||'out/r1350';fs.mkdirSync(OUT,{recursive:true});
let fails=0;const check=(n,ok,info)=>{if(!ok)fails++;console.log((ok?'PASS ':'FAIL ')+n+(info===undefined?'':' '+JSON.stringify(info).slice(0,900)));};
const b=await chromium.launch({headless:true});const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});
await ctx.addInitScript(()=>{try{localStorage.setItem('storyworld.r953.gunnerVeil','{"on":false}');localStorage.setItem('storyworld.r663.skillgrowth','{"on":false}');localStorage.setItem('storyworld.r1302.hwando3d','on');}catch(_){}});
const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(String(e).slice(0,200)));
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await p.waitForTimeout(800);
const skip=()=>p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:120000});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.go('dist01','STORY');const P=window.__STORYWORLD_PROGRESSION_R71__;if(P?.difficultyState?.().open){P.selectDifficulty('normal');await P.confirmDifficulty();}});
await p.waitForFunction(()=>room?.id==='dist01'&&!loading,null,{timeout:180000});await skip();
await p.evaluate(async()=>{try{window.__STORYWORLD_GUNNER_ARMS_R561__.set({chain:false});}catch(_){}guide=false;auto=false;settings.autoSkill=false;loading=true;try{await ensureImages(heroPaths('gunner'));player.hero='gunner';}finally{loading=false;}
 const W=window.__t1350={beam:[],rifle:[],tip3:[],tip2:[],pin:null,on:false},A=window.__STORYWORLD_GUNNER_AIM_R991__;
 // 사방이 빈 바닥인 곳으로(벽에 밀려 표적이 흔들리지 않게)
 {const ok=(x,y)=>{if(blocked(x,y,.5))return false;for(let s=0;s<16;s++){const S=s*Math.PI/8;for(const r of [1.6,3.2,4.5])if(blocked(x+Math.cos(S)*r,y+Math.sin(S)*r,.5))return false;}return true;};
  let best=null;for(let r=0;r<30&&!best;r+=.5)for(let a=0;a<6.283&&!best;a+=.3){const x=player.x+Math.cos(a)*r,y=player.y+Math.sin(a)*r;if(ok(x,y))best={x,y};}if(best){player.x=best.x;player.y=best.y;}W.spot=best;}
 (function pin(){const P=W.pin;if(P){const e=P.e;e.x=player.x+P.dx;e.y=player.y+P.dy;e.spawnState='active';e.visible=true;e.hp=1e7;e.speed=0;e.attack=null;for(const v of room.enemies)if(v!==e&&v.hp>0){v.x=player.x-60;v.y=player.y-60;v.speed=0;}}requestAnimationFrame(pin);})();
 // 3D: 자세가 걸린 뒤(onBeforeRender 맨 바깥, 다른 스크립트가 다시 감싸면 다시 바깥으로) 소총 끝
 const three=()=>window.__STORYWORLD_PHASE1__?.controller?.state?.three;
 function grab(r){try{if(!W.on)return;const g=r.scene.children.find(c=>/^r1305-gunner-3d-shared$/.test(c.name||'')&&c.visible);if(!g)return;/* 총열 축: 총구 EmissionFX ← 소총 메시 원점(GLB 실측 같은 총열 줄 x −.118·−.122). 첫 실행에서 쓴 SupportSocket 은 총열 아래(x −.06)라 축이 6° 들려 화면 각을 잘못 냈다 */let tip=null,sup=null;g.traverse(o=>{if(/^EmissionFX/.test(o.name||''))tip=o;else if(/^SW_MEMORY_ARC_RIFLE_MESH$/.test(o.name||''))sup=o;});if(!tip||!sup)return;
  const T=r.T,v=tip.getWorldPosition(new T.Vector3()),s=sup.getWorldPosition(new T.Vector3()),w=r.projection.width,h=r.projection.height,q=project(player.x,player.y),pv=v.clone().project(r.camera),ps=s.clone().project(r.camera);
  const sx=(pv.x+1)*w/2,sy=(1-pv.y)*h/2,ux=(ps.x+1)*w/2,uy=(1-ps.y)*h/2;
  W.tip3.push({t:time,x:sx-q.x,y:sy-q.y,scr:Math.atan2(sy-uy,sx-ux),ground:Math.atan2(v.z-s.z,v.x-s.x)});}catch(e){W.err=String(e);}}
 setInterval(()=>{const r=three();if(!r?.scene)return;const cur=r.scene.onBeforeRender;if(cur&&cur.__t1350)return;const w=function(...a){const o=cur?.apply(this,a);grab(r);return o;};w.__t1350=true;r.scene.onBeforeRender=w;},100);
 // 광선 그림 = 시트 기준점(0,64)을 원점으로 옮긴 drawImage, 2D 몸 그림 = R991 칸 명령
 const hookC=c=>{if(!c||c.__t1350)return;c.__t1350=true;const di=c.drawImage;c.drawImage=function(im,...a){try{if(W.on&&a.length>=8&&a[3]===128&&a[5]===-64&&a[4]===0&&(im?.width===3072||/gunner-q-beam/.test(String(im?.src||'')))){const m=c.getTransform?.();if(m){const q=project(player.x,player.y);W.beam.push({t:time,x:m.e-q.x,y:m.f-q.y,scr:Math.atan2(m.b,m.a)});}}
   if(W.on&&a.length>=8&&a[2]===256&&a[3]===256&&a[4]===-35&&a[5]===-139&&a[0]===0&&a[1]===0){const m=c.getTransform?.();if(m){const q=project(player.x,player.y);W.rifle.push({t:time,x:m.e-q.x,y:m.f-q.y,scr:Math.atan2(m.b,m.a)});}}}catch(e){W.err=String(e);}return di.call(this,im,...a);};};
 const de=drawEffect;drawEffect=function(...a){try{hookC(ctx);}catch(_){}return de.apply(this,a);};
 // 뒷모습 겨눔 칸(n·attack-n3)은 표의 gun(−80°, 겨누는 뜻)과 달리 화면에서 총열이 오른쪽 위 대각으로 보인다(그림을 열어 확인, R561 NORTH_BARREL 총열→총구 (16,−10)px)
 //  → 이 칸의 '보이는 총 방향'은 그 실측 각으로 비교한다(첫 실행에서 표 값 −80° 로 잘못 비교했던 것을 고침).
 const NB=Math.atan2(-10,16);
 const dh=drawHero;drawHero=function(...a){const rec=typeof ctx==='object'?ctx:null,st=Array.isArray(rec?.commands)?rec.commands.length:-1;const r=dh.apply(this,a);
  try{if(W.on&&st>=0&&player.hero==='gunner'){const q=project(player.x,player.y);let hit=null,kind='none';for(let i=st;i<rec.commands.length;i++){const c=rec.commands[i];if(c.kind!=='image'||!c.points||!c.sourceRect)continue;if(c.owner&&c.owner.kind!=='hero')continue;
    if(c.r991Aim){const P=c.points,fr=Math.round(c.sourceRect[0]/192),tp=A.tip(c.r991Aim.sheet,fr),u=tp[0]/192,v=tp[1]/256;hit={x:P[0][0]+(P[1][0]-P[0][0])*u+(P[3][0]-P[0][0])*v-q.x,y:P[0][1]+(P[1][1]-P[0][1])*u+(P[3][1]-P[0][1])*v-q.y,scr:c.r991Aim.sheet==='n'?(c.r991Aim.mirror?Math.PI-NB:NB):A.gunAngle(c.r991Aim.sheet,c.r991Aim.mirror),sheet:c.r991Aim.sheet+(c.r991Aim.mirror?'M':'')};}
    else if(kind==='none')kind=String(c.sourcePath||'').split('/').slice(-1)[0];}
   W.tip2.push(hit?{t:time,...hit}:{t:time,none:kind});}}catch(e){W.err=String(e);}return r;};
});
const D=Math.PI/180,ad=(a,c)=>Math.abs(Math.atan2(Math.sin(a-c),Math.cos(a-c)))/D,screenOf=a=>Math.atan2((Math.cos(a)+Math.sin(a))*.5,Math.cos(a)-Math.sin(a));
async function cast(deg,opt={}){
 const kind=opt.k||'q';const t0=await p.evaluate(async([deg,kind])=>{const W=window.__t1350,S=deg*Math.PI/180,P=player;const dx=(Math.cos(S)+2*Math.sin(S))/2,dy=(2*Math.sin(S)-Math.cos(S))/2,L=Math.hypot(dx,dy);room.engaged=true;
  const e=room.enemies.find(v=>v.hp>0&&!v.boss);W.pin={e,dx:dx/L*3.4,dy:dy/L*3.4};P.hp=maxHP();P.invincible=999;keys.clear?.();P.specialCD=0;
  /* 재사용 대기를 거의 0 으로(곧바로 같은 시각이면 아직 남아 있어 한 프레임 이상 기다린다) */if(kind!=='q')window.__STORYWORLD_GUNNER_ARMS_R561__.scaleRemain(kind,1e-9);await new Promise(r=>setTimeout(r,1500));W.beam=[];W.rifle=[];W.tip3=[];W.tip2=[];W.fa=[];W.on=true;const t0=time;const G=window.__STORYWORLD_GUNNER_ARMS_R561__;if(kind==='q')special();else{W.castOk=G.fire(kind,false);}
  (function fa(){if(!W.on)return;const x=window.__STORYWORLD_GUNNER_ARMS_R561__.inspect().effects.find(f=>f.kind===kind);if(x)W.fa.push({t:time,a:x.a,fx:x});requestAnimationFrame(fa);})();return t0;},[deg,kind]);
 if(opt.move){await p.waitForFunction((t)=>time>=t+.3,t0,{timeout:240000});await p.keyboard.down(opt.move);await p.waitForFunction((t)=>time>=t+.62,t0,{timeout:240000});await p.keyboard.up(opt.move);}
 if(opt.to2d){await p.waitForFunction((t)=>time>=t+.45,t0,{timeout:240000});await p.evaluate(()=>{window.__STORYWORLD_HWANDO3D_R1302__.set(false);window.__t1350.switchAt=time;});}
 await p.waitForFunction((t)=>time>=t+.98,t0,{timeout:240000});
 const L=await p.evaluate(()=>{const W=window.__t1350;W.on=false;return {castOk:W.castOk,rifle:W.rifle,beam:W.beam,tip3:W.tip3,tip2:W.tip2,fa:W.fa,err:W.err||null,switchAt:W.switchAt??null};});
 if(opt.to2d)await p.evaluate(()=>window.__STORYWORLD_HWANDO3D_R1302__.set(true));
 // 같은 시각 프레임끼리(광선 그림이 두 번 그려지는 프레임도 하나로)
 const seen=new Set(),rows=[];for(const bm of L.beam){const k=bm.t.toFixed(6);if(seen.has(k))continue;seen.add(k);const el=bm.t-t0;if(el<.26||el>.92)continue;
  const t3=L.tip3.filter(x=>Math.abs(x.t-bm.t)<1e-9).pop()||null,t2=L.tip2.filter(x=>Math.abs(x.t-bm.t)<1e-9).pop()||null,fa=L.fa.filter(x=>Math.abs(x.t-bm.t)<1e-9).pop()||null;
  rows.push({el:+el.toFixed(3),bx:bm.x,by:bm.y,bs:bm.scr,t3,t2,fa:fa?.a??null,after2d:L.switchAt!=null&&bm.t>=L.switchAt});}
 return {rows,t0,err:L.err,targetScr:deg*D,L};
}
const fmt=r=>({el:r.el,beam:[+r.bx.toFixed(1),+r.by.toFixed(1),+(r.bs/D).toFixed(1)],t3:r.t3?[+r.t3.x.toFixed(1),+r.t3.y.toFixed(1),+(r.t3.scr/D).toFixed(1)]:null,t2:r.t2?.sheet?[+r.t2.x.toFixed(1),+r.t2.y.toFixed(1),+(r.t2.scr/D).toFixed(1),r.t2.sheet]:r.t2?.none??null});
const DIRS=[0,45,90,135,180,-135,-90,-45,22.5,67.5,112.5,157.5,-157.5,-112.5,-67.5,-22.5,-59,-61,-119,-121];
await p.waitForFunction(()=>window.__STORYWORLD_HWANDO3D_R1302__?.inspect?.().ready&&window.__STORYWORLD_HWANDO3D_R1302__.inspect().hero==='gunner',null,{timeout:240000}).catch(()=>{});
check('3D 기억사수 모델 준비',await p.evaluate(()=>window.__STORYWORLD_HWANDO3D_R1302__.inspect().ready&&window.__STORYWORLD_HWANDO3D_R1302__.inspect().hero==='gunner'));
// ── 3D ──
const WEONLY=!!process.env.WEONLY;/* WEONLY=1: W·E 사례만 */
for(const deg of WEONLY?[]:DIRS){const R=await cast(deg);const rows=R.rows.filter(r=>r.t3);
 const dist=rows.map(r=>Math.hypot(r.bx-r.t3.x,r.by-r.t3.y)),angS=rows.map(r=>ad(r.bs,r.t3.scr)),angG=rows.filter(r=>r.fa!=null).map(r=>ad(r.fa,r.t3.ground)),drawn=rows.filter(r=>r.fa!=null).map(r=>ad(r.bs,screenOf(r.fa))),aim=rows.map(r=>ad(r.bs,R.targetScr));
 check(`3D ${deg}° 광선 시작점 = 3D 총구(≤4px)`,rows.length>=5&&Math.max(...dist)<=4,{n:rows.length,max:+Math.max(...dist).toFixed(1),s:rows.slice(0,2).map(fmt)});
 check(`3D ${deg}° 광선 방향 = 소총 방향(화면 ≤6°, 땅 ≤4°)`,rows.length>=5&&Math.max(...angS)<=6&&angG.length>=5&&Math.max(...angG)<=4,{scr:+Math.max(...angS).toFixed(1),ground:angG.length?+Math.max(...angG).toFixed(1):null});
 check(`3D ${deg}° 판정선 각 = 그린 광선 각(≤1.5°)`,drawn.length>=5&&Math.max(...drawn)<=1.5,{max:drawn.length?+Math.max(...drawn).toFixed(2):null});
 check(`3D ${deg}° 표적을 겨눔(≤3°)`,rows.length>=5&&Math.max(...aim)<=3,{max:+Math.max(...aim).toFixed(1)});
 if(R.err)check(`3D ${deg}° 측정 오류 없음`,false,R.err);}
// 발사 중 방향 전환(걷기): 총이 돌면 광선 시작점·방향이 따라감
for(const [deg,key] of WEONLY?[]:[[0,'ArrowUp'],[180,'ArrowDown'],[90,'ArrowLeft'],[-45,'ArrowRight']]){const R=await cast(deg,{move:key});const rows=R.rows.filter(r=>r.t3);
 const dist=rows.map(r=>Math.hypot(r.bx-r.t3.x,r.by-r.t3.y)),angS=rows.map(r=>ad(r.bs,r.t3.scr)),bs=rows.map(r=>r.bs),turn=bs.length?Math.max(...bs.map(a=>ad(a,bs[0]))):0,gunTurn=rows.length?Math.max(...rows.map(r=>ad(r.t3.scr,rows[0].t3.scr))):0;
 const ok=dist.filter(d=>d<=4).length/Math.max(1,dist.length);
 check(`3D ${deg}°+${key} 발사 중 총이 돌아도 시작점이 총구(≤4px 90%·최대 ≤8px)`,rows.length>=5&&ok>=.9&&Math.max(...dist)<=8,{n:rows.length,ok:+ok.toFixed(2),max:+Math.max(...dist).toFixed(1),gunTurn:+gunTurn.toFixed(0)});
 check(`3D ${deg}°+${key} 광선 방향이 총을 따라감(화면 ≤8°, 총이 30° 넘게 돌면 광선도)`,rows.length>=5&&Math.max(...angS)<=8&&(gunTurn<30||turn>=gunTurn-8),{maxDiff:+Math.max(...angS).toFixed(1),gunTurn:+gunTurn.toFixed(0),beamTurn:+turn.toFixed(0),s:rows.filter((_,i)=>i%3===0).map(fmt)});}
// 발사 중 3D→2D 전환: 바뀐 뒤(두 프레임 뒤부터)는 2D 총구에서
if(!WEONLY){const R=await cast(0,{to2d:true});const rows=R.rows.filter(r=>r.after2d).slice(2).filter(r=>r.t2?.sheet);const dist=rows.map(r=>Math.hypot(r.bx-r.t2.x,r.by-r.t2.y));
 check('발사 중 3D→2D 전환 뒤 시작점 = 2D 총구(≤4px)',rows.length>=3&&Math.max(...dist)<=4,{n:rows.length,max:dist.length?+Math.max(...dist).toFixed(1):null,s:R.rows.filter(r=>r.after2d).slice(0,4).map(fmt)});}
// ── R1350b W 저격·E 연사(3D): 그려진 탄 출발점 = 같은 프레임 3D 총구, 탄 화면 각 = 총열 ──
const pair3=(L,t)=>L.tip3.filter(x=>Math.abs(x.t-t)<1e-9).pop()||null;
for(const deg of [0,90,-90,157.5,-135,22.5]){const R=await cast(deg,{k:'w'});const L=R.L,seen=new Set(),rows=[];for(const b of L.beam){const k=b.t.toFixed(6);if(seen.has(k))continue;seen.add(k);const t3=pair3(L,b.t);/* 이번 저격(겨눔 .35초 뒤 발사)의 탄만 — 앞 시전 탄 자국이 남아 섞이지 않게 */if(t3&&b.t-R.t0>=.34&&b.t-R.t0<.7)rows.push({b,t3});}
 const dist=rows.map(r=>Math.hypot(r.b.x-r.t3.x,r.b.y-r.t3.y)),ang=rows.map(r=>ad(r.b.scr,r.t3.scr)),aim=rows.map(r=>ad(r.b.scr,deg*D));
 check(`3D W ${deg}° 저격 탄 출발점 = 3D 총구(≤4px)·방향 = 총열(≤6°)·표적(≤3°)`,L.castOk!==false&&rows.length>=1&&Math.max(...dist)<=4&&Math.max(...ang)<=6&&Math.max(...aim)<=3,{cast:L.castOk,n:rows.length,d:dist.map(v=>+v.toFixed(1)).slice(0,4),ang:ang.map(v=>+(v/1).toFixed(1)).slice(0,4),aim:aim.map(v=>+v.toFixed(1)).slice(0,4)});}
for(const [deg,key] of [[0,null],[-135,null],[45,null],[90,null],[0,'ArrowUp']]){const R=await cast(deg,{k:'e',move:key});const L=R.L,rows=[];for(const b of L.rifle){const t3=pair3(L,b.t);if(t3)rows.push({b,t3});}
 const dist=rows.map(r=>Math.hypot(r.b.x-r.t3.x,r.b.y-r.t3.y)),ang=rows.map(r=>ad(r.b.scr,r.t3.scr)),turn=rows.length?ad(rows[rows.length-1].b.scr,rows[0].b.scr):0;
 check(`3D E ${deg}°${key?'+'+key:''} 연사 매 발 출발점 = 3D 총구(≤4px)·방향 = 총열(≤6°)${key?'·걸으면 총 따라 돎(≥45°)':''}`,L.castOk!==false&&rows.length>=4&&Math.max(...dist)<=4&&Math.max(...ang)<=6&&(!key||turn>=45),{cast:L.castOk,n:rows.length,d:+Math.max(...dist).toFixed(1),ang:+Math.max(...ang).toFixed(1),turn:+turn.toFixed(0)});}
await p.evaluate(()=>window.__STORYWORLD_HWANDO3D_R1302__.set(false));await p.waitForTimeout(500);
// ── 2D ──
for(const deg of WEONLY?[]:DIRS){const R=await cast(deg);const all=R.rows,rows=all.filter(r=>r.t2?.sheet);
 const dist=rows.map(r=>Math.hypot(r.bx-r.t2.x,r.by-r.t2.y)),angS=rows.map(r=>ad(r.bs,r.t2.scr)),drawn=rows.filter(r=>r.fa!=null).map(r=>ad(r.bs,screenOf(r.fa)));
 check(`2D ${deg}° 몸 그림이 겨눈 칸(R991)으로 그려짐`,rows.length>=Math.max(5,all.length*.8),{n:rows.length,all:all.length,none:all.filter(r=>!r.t2?.sheet).slice(0,3).map(fmt)});
 check(`2D ${deg}° 광선 시작점 = 그려진 총구(≤4px)`,rows.length>=5&&Math.max(...dist)<=4,{max:dist.length?+Math.max(...dist).toFixed(1):null,s:rows.slice(0,2).map(fmt)});
 check(`2D ${deg}° 광선 방향 = 그려진 총 각도(≤12°)${deg>90||deg<-90?' (좌우 반전)':''}`,rows.length>=5&&Math.max(...angS)<=12,{max:angS.length?+Math.max(...angS).toFixed(1):null});
 check(`2D ${deg}° 판정선 각 = 그린 광선 각(≤1.5°)`,drawn.length>=5&&Math.max(...drawn)<=1.5,{max:drawn.length?+Math.max(...drawn).toFixed(2):null});
 if(R.err)check(`2D ${deg}° 측정 오류 없음`,false,R.err);}
for(const [deg,key] of WEONLY?[]:[[0,'ArrowUp'],[180,'ArrowDown']]){const R=await cast(deg,{move:key});const rows=R.rows.filter(r=>r.t2?.sheet);
 const dist=rows.map(r=>Math.hypot(r.bx-r.t2.x,r.by-r.t2.y)),angS=rows.map(r=>ad(r.bs,r.t2.scr));
 check(`2D ${deg}°+${key} 발사 중 걸어도 시작점 = 그려진 총구·방향 = 총(≤4px, ≤12°)`,rows.length>=5&&Math.max(...dist)<=4&&Math.max(...angS)<=12,{n:rows.length,all:R.rows.length,max:dist.length?+Math.max(...dist).toFixed(1):null,ang:angS.length?+Math.max(...angS).toFixed(1):null,s:R.rows.filter((_,i)=>i%3===0).map(fmt)});}
await p.screenshot({path:`${OUT}/last.png`});
check('페이지 오류 없음',errors.length===0,errors.slice(0,5));
console.log(fails?`R1350 browser: ${fails} FAIL`:'R1350 browser: ALL PASS','(헤드리스 소프트웨어 렌더 — GPU·실기기·자연 플레이 미검증)');
await b.close();process.exit(fails?1:0);
