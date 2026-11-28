// R1378 전후 장면(헤드리스 SwiftShader — 그래픽 검증 아님). 960×540, DSF 2. 같은 순간(게임 시간을 1e-4 배로 멈춤)을 창 있음/없음으로 찍는다.
//  장면: 네온·라우렌 × 대기(오른쪽 보기) · 찌르기 정점(오른쪽·왼쪽 보기 — 창끝이 몸 앞으로 가장 멀리 나간 순간), 페르소나 대기.
// 실행: 정적 서버 뒤 `node r96/qa/r1378/r1378-shots.mjs` 다음 `python3 r96/qa/r1378/r1378-join.py r96/qa/r1378/r1378-before-after.jpg`
import {chromium,skip,go,URL} from '../r444/lib.mjs';import {createRequire} from 'node:module';
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:2});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
const p=await ctx.newPage();await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await skip(p);
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip(p);
await go(p,process.env.ZONE||'dist00');
await p.evaluate(()=>{player.hp=player.maxHp=99999;for(const e of room.enemies){e.speed=0;e.damage=0;e.visible=false;e.x+=9999;}window.__STORYWORLD_HWANDO3D_R1302__.set(true);
 window.__SLOW=1;const tb=tick;tick=function(dt,...a){return tb.call(this,dt*(window.__SLOW??1),...a);};
 const r=window.__STORYWORLD_PHASE1__.controller.state.three,s=r.scene,T=r.T,prev=s.onAfterRender;
 // 그리는 순간 창끝의 몸 좌표 z(앞) — 자세 오버레이가 되돌리기 전
 s.onAfterRender=function(...a){try{const h=window.__r1378H,g=h&&s.getObjectByName('r1305-'+h+'-3d-shared'),m=g?.getObjectByName('r1305-'+h+'-3d-model'),w=g?.getObjectByName('r1313-'+h+'-weapon');let tip=null;w?.traverse(x=>{if(!tip&&/^BladeTip/.test(x.name||''))tip=x;});
  if(tip)window.__r1378Z=m.worldToLocal(tip.getWorldPosition(new T.Vector3())).z;}catch(_){}return prev?.apply(this,a);};});
const shots=[];
const shoot=async(id,label)=>{
 const box=await p.evaluate(id=>{const r=window.__STORYWORLD_PHASE1__.controller.state.three,g=r.scene.getObjectByName('r1305-'+id+'-3d-shared'),T=r.T;const v=g.getWorldPosition(new T.Vector3());v.y+=.9*g.getWorldScale(new T.Vector3()).y;v.project(r.camera);return {x:(v.x+1)/2*innerWidth,y:(1-v.y)/2*innerHeight};},id);
 const clip={x:Math.max(0,box.x-60),y:Math.max(0,box.y-60),width:120,height:120};
 const set=on=>p.evaluate(([id,on])=>{const g=window.__STORYWORLD_PHASE1__.controller.state.three.scene.getObjectByName('r1305-'+id+'-3d-shared'),w=g?.getObjectByName('r1313-'+id+'-weapon');if(w)w.visible=on;},[id,on]);
 await set(false);await p.waitForTimeout(300);const a=await p.screenshot({clip});await set(true);await p.waitForTimeout(300);const c=await p.screenshot({clip});shots.push({label,a,c});};
const pick=async(h,persona=false)=>{await p.evaluate(async([h,persona])=>{window.__SLOW=1;try{await ensureImages(heroPaths(h));}catch(_){}clearInterval(window.__r1378A);player.personaHeroR1113=persona;player.egoSovereignR1046=false;player.hero=h;player.moving=false;player.attackAnim=0;route.length=0;window.__r1378H=persona?null:h;},[h,persona]);
 await p.waitForFunction(id=>{const i=window.__STORYWORLD_HWANDO3D_R1302__.inspect();return i.hero===id&&i.shown;},persona?'persona':h,{timeout:240000});await p.waitForTimeout(2500);};
const face=async d=>{await p.evaluate(d=>{window.__SLOW=1;clearInterval(window.__r1378A);player.attackAnim=0;player.direction=d;},d);await p.waitForFunction(()=>window.__STORYWORLD_HWANDO3D_R1302__.inspect().weights.idle>.97,null,{timeout:60000});await p.waitForTimeout(400);};
// 찌르기 정점: 천천히(0.15배) 공격을 돌리며 창끝 앞 거리 최대를 재고, 그 95% 에 다시 닿는 순간 1e-4 배로 멈춘다.
const peak=async()=>{await p.evaluate(()=>{window.__SLOW=.15;window.__r1378A=setInterval(()=>{player.moving=false;player.attackAnim=.2;},8);});
 await p.waitForFunction(()=>{const i=window.__STORYWORLD_HWANDO3D_R1302__.inspect();return i.action==='attack'&&i.weights.attack>.97;},null,{timeout:60000});
 let mx=-9;const t0=Date.now();while(Date.now()-t0<9000){mx=Math.max(mx,await p.evaluate(()=>window.__r1378Z??-9));await p.waitForTimeout(40);}
 await p.waitForFunction(m=>{if((window.__r1378Z??-9)>=m*.95){window.__SLOW=1e-4;return true;}return false;},mx,{timeout:60000,polling:'raf'});await p.waitForTimeout(400);
 return {mx,now:await p.evaluate(()=>window.__r1378Z)};};
for(const h of ['neon','lauren']){await pick(h);await face('right');await shoot(h,h+' idle');
 for(const d of ['right','left']){await face(d);const k=await peak();console.log(h,d,'tip z max',k.mx.toFixed(3),'shot',k.now.toFixed(3));await shoot(h,`${h} thrust peak ${d} (tip ${k.now.toFixed(2)})`);}}
await pick('lauren',true);await face('right');await shoot('persona','persona idle');
await b.close();
const req=createRequire(import.meta.url);req('fs').writeFileSync('/tmp/claude-0/r1378-shots.json',JSON.stringify(shots.map(s=>({label:s.label,a:s.a.toString('base64'),c:s.c.toString('base64')}))));
console.log('shots',shots.length);
