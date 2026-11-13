// R991 무한 생존 배치 영웅(R720) 기억사수에도 같은 보정이 걸리는지(헤드리스·소프트웨어 렌더 — 그래픽·실기기 검증 아님).
//   SW_URL=http://127.0.0.1:4396/m0/ OUT=out/r991 node r96/qa/r991/r991-survival.mjs
//  조종 영웅 환도 + 배치 영웅 기억사수 → 배치 기억사수가 스스로 쏠 때 (1) 탄이 그 몸의 그려진 총구 끝에서 나오고
//  (2) 몸 그림 총 각도가 있는 그림 중 최선에 가까운지(최선+10°, 전체 ≤41°) 잰다. 5방향 그림 사이 각(예 160°)은 그림이 없어 최선도 ~19° 다. 협동 모드는 R143 공격 시트를 안 써서 이 보정을 걸지 않는다(review.md).
import {createRequire} from 'node:module';import fs from 'node:fs';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||process.env.STORYWORLD_URL||'http://127.0.0.1:4396/m0/',OUT=process.env.OUT||'out/r991';fs.mkdirSync(OUT,{recursive:true});let fail=0;
const ok=(m,c,x)=>{console.log(c?'PASS':'FAIL',m,x!==undefined?JSON.stringify(x).slice(0,700):'');if(!c)fail++;};
const GUN={e:-3,se:35,s:50,ne:-52,n:-57},TIP0={e:[159,75],se:[158,133],s:[128,126],ne:[156,38],n:[134,44]};
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:960,height:540}});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));const A=(f,a)=>p.evaluate(f,a);
await p.goto(URL);await p.locator('#survivalStartR600').waitFor({timeout:180000});
await p.locator('#survivalStartR600').click();await p.locator('[data-r600diff="normal"]').click();await p.locator('[data-r600hero="hwando"]').click();await p.locator('#r600Go').click();
await p.waitForFunction(()=>window.__STORYWORLD_SURVIVAL_R600__.here()&&!loading&&window.__STORYWORLD_SURVIVAL_R600__.state().ready,null,{timeout:240000});
await A(()=>window.__STORYWORLD_SURVIVAL_R600__.skipNarration());
await A(()=>{const z=room.survivalR600.centre;player.x=z.x+2.5;player.y=z.y+1;player.attackCD=99;player.specialCD=99;window.__STORYWORLD_HERO_DEFENSE_R720__.qaGive(2000);});
await p.keyboard.press('i');await p.waitForFunction(()=>!!document.querySelector('[data-r720buy="gunner"]'),null,{timeout:20000});
await A(()=>document.querySelector('[data-r720buy="gunner"]').click());await p.waitForTimeout(200);await p.keyboard.press('i');await p.waitForTimeout(300);
await A(()=>{player.invincible=999;window.__r991s={rows:[],pend:null};
 const ms=makeShot;makeShot=function(...a){const s=ms.apply(this,a);try{if(s?.friendly&&player.r720Ally===true&&player.hero==='gunner'){const o=project(s.x,s.y),e=nearestEnemy(HEROES.gunner.range||7),q=project(player.x,player.y),qe=e?project(e.x,e.y):null;
   window.__r991s.pend={gx:s.x,gy:s.y,r991:s.currentPublicMuzzle?.r991||null,aim:qe?Math.atan2(qe.y-q.y,qe.x-q.x):null,t:time,body:player,px:player.x,py:player.y};}}catch(_){}return s;};
 const dh=drawHero;drawHero=function(...a){const rec=ctx,st=Array.isArray(rec?.commands)?rec.commands.length:-1;const r=dh.apply(this,a);
  try{const P=window.__r991s.pend;if(P&&player===P.body&&st>=0)for(let i=st;i<rec.commands.length;i++){const c=rec.commands[i],m=/r143\/attack\/gunner\/attack-([a-z]+)\.webp/.exec(String(c.sourcePath||c.image?.src||''));
    if(c.kind==='image'&&m&&c.points){const o2=project(P.gx,P.gy);window.__r991s.rows.push({...P,sx:o2.x,sy:o2.y,body:undefined,sheet:m[1],dt:time-P.t,dmv:Math.hypot(player.x-P.px,player.y-P.py),walkC:!!c.r121Walk,r143:!!c.r143Attack,fr:Math.round((c.sourceRect?.[0]||0)/192),anim:+player.attackAnim||0,points:c.points.map(v=>[v[0],v[1]])});window.__r991s.pend=null;break;}}}catch(_){}return r;};});
const t0=await A(()=>time);await p.waitForFunction(a=>time>=a&&window.__r991s.rows.length>=6,t0+40,{timeout:600000}).catch(()=>{});
await p.screenshot({path:`${OUT}/survival-ally.png`});
const rows=await A(()=>window.__r991s.rows),D=Math.PI/180,ad=(a,c)=>Math.abs(Math.atan2(Math.sin(a-c),Math.cos(a-c)))/D;
// 탄 출발점은 땅 좌표로 적어 두고 그리는 순간의 카메라로 다시 투영(조종 영웅이 움직여 카메라가 흐르는 몫 제거).
// 쏜 뒤 그리기 전에 배치 영웅이 움직인 줄(dmv>0.01)은 몸과 탄 출발점이 다른 순간이라 총구 오차 판정에서 뺀다.
const out=rows.map(r=>{const P=r.points,mir=P[1][0]<P[0][0],k=Math.abs(P[1][0]-P[0][0])/192,ky=(P[3][1]-P[0][1])/256,f=mir?-1:1,fx=P[0][0]+f*96*k,fy=P[0][1]+227*ky,t=TIP0[r.sheet],mx=fx+f*(t[0]-96)*k,my=fy+(t[1]-227)*ky,g=mir?Math.PI-GUN[r.sheet]*D:GUN[r.sheet]*D;
 let best=1e9;for(const k in GUN)for(const mm of [false,true])best=Math.min(best,ad(r.aim,mm?Math.PI-GUN[k]*D:GUN[k]*D));
 return{best:+best.toFixed(1),sheet:r.sheet+(mir?'(반전)':''),aimDeg:+(r.aim/D).toFixed(1),gunErr:+ad(r.aim,g).toFixed(1),spawnOff:+Math.hypot(r.sx-mx,r.sy-my).toFixed(1),r991:!!r.r991,pick:r.r991?r.r991.sheet+(r.r991.mirror?'(반전)':''):null,dt:+(r.dt||0).toFixed(3),dmv:+(r.dmv||0).toFixed(3),r143:r.r143,fr:r.fr,anim:r.anim};});
console.log('ALLY '+JSON.stringify(out));fs.writeFileSync(`${OUT}/survival.json`,JSON.stringify(out,null,1));
ok('배치 기억사수가 쏜 탄 6발 이상 기록',out.length>=6,out.length);
ok('배치 기억사수 탄도 R991 총구 보정',out.every(r=>r.r991),out);
ok('배치 기억사수 탄이 그 몸의 그려진 총구 끝에서 나옴(≤6px)',out.filter(r=>r.dmv<=.01).length>=6&&out.filter(r=>r.dmv<=.01).every(r=>r.spawnOff<=6),out.map(r=>[r.spawnOff,r.dmv]));
ok('배치 기억사수 몸 그림 총 각도가 있는 5방향 그림 중 최선+10° 이내(CPU 검사와 같은 기준, 전체 ≤41°)',out.every(r=>r.gunErr<=41&&r.gunErr<=r.best+10),out.map(r=>[r.aimDeg,r.sheet,r.gunErr,r.best]));
const st=await A(()=>window.__STORYWORLD_GUNNER_AIM_R991__.inspect().stats);ok('R991 오류 없음',st.errors===0,st);
ok('페이지 오류 없음',errs.length===0,errs);
console.log(JSON.stringify({fail}));await b.close();process.exitCode=fail?1:0;
