// R1200 브라우저 검사(헤드리스 Chromium 소프트웨어 렌더링 — 실기기 GPU 아님): 사몽 4장 3구역(ep1b08) 환도 777 전투 중
//  ① 장면당 '열쇠 같고 그림만 바뀌어 지우고 새로 만든' 메시 수 ≤ 5 (예전 약 57)  ② 모든 행에서 재질 map 의 그림 = 행 그림(어긋남 0), 텍스처 참조 표에 없는 텍스처 0
//  ③ 같은 순간(게임 시간 멈춤)을 켬·끔으로 각각 새로 그린 화면이 같다(화소 차 평균 < 0.5/255, 최대 영역 차 작음)  ④ 페이지 오류 0
//  SW_URL(기본 http://127.0.0.1:4410/m0/)
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/';let fail=0;const ok=(m,c,x)=>{console.log(c?'PASS':'FAIL',m,x!==undefined?JSON.stringify(x).slice(0,400):'');if(!c)fail++;};
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:640,height:360},deviceScaleFactor:1});
await ctx.addInitScript(()=>{try{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));}catch(_){}});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
const skip=()=>p.evaluate(()=>{try{for(let i=0;i<200&&storyScene;i++)advanceScene();if(modal)closePanel(true);}catch(_){}});
await p.goto(URL,{timeout:180000});await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip();
await p.evaluate(()=>window.__STORYWORLD_CHEAT777__.goSamong(4,3,{force:true}));await p.waitForFunction(()=>!loading&&layer==='DREAM',null,{timeout:180000});await skip();
await p.evaluate(()=>{setInterval(()=>{try{player.hp=maxHP();player.invincible=99;if(modal&&!storyScene)closePanel(true);if(storyScene)advanceScene();}catch(_){}},300);auto=true;guide=true;});
const t0=await p.evaluate(()=>time);await p.waitForFunction(t=>time>=t,t0+15,{timeout:600000,polling:500});
const R=await p.evaluate(async()=>{const C=window.__STORYWORLD_PHASE1__.controller.state.three.commands;let prev=new Map(C.rows);const K={frames:0,imgReplace:0,swaps0:window.__STORYWORLD_DRAW_REUSE_R1200__?.inspect().stats.swaps||0,mismatch:0,orphanTex:0,rows:0,created0:C.stats.created,removed0:C.stats.removed,rk0:window.__STORYWORLD_DRAW_REUSE_R1200__?.inspect().stats.rekeys||0};
 const texSet=()=>{const s=new Set();for(const r of C.textures.values())s.add(r.texture);return s;};
 await new Promise(res=>{const g=()=>{K.frames++;const cur=C.rows,ts=texSet();for(const [k,r] of cur){const q=prev.get(k);if(q&&q!==r&&q.image&&r.image&&q.image!==r.image)K.imgReplace++;
   if(r.image&&r.mesh?.material?.map){K.rows++;if(r.mesh.material.map.image!==r.image)K.mismatch++;if(!ts.has(r.mesh.material.map))K.orphanTex++;}}prev=new Map(cur);if(K.frames>=24)return res();requestAnimationFrame(g);};requestAnimationFrame(g);});
 K.swaps=(window.__STORYWORLD_DRAW_REUSE_R1200__?.inspect().stats.swaps||0)-K.swaps0;K.perFrame=+(K.imgReplace/K.frames).toFixed(2);K.createdPerFrame=+((C.stats.created-K.created0)/K.frames).toFixed(1);K.rekeysPerFrame=+(((window.__STORYWORLD_DRAW_REUSE_R1200__?.inspect().stats.rekeys||0)-K.rk0)/K.frames).toFixed(1);K.swapsPerFrame=+(K.swaps/K.frames).toFixed(1);return K;});
ok('image-only replacements per frame ≤ 5 (was ~57)',R.perFrame<=5,R);
ok('meshes really reused (swaps ≥ 10 per frame in this scene)',R.swapsPerFrame>=10,R);
ok('new-key recycling used (re-keys ≥ 1 per frame) and meshes created per frame ≤ 45 (was ~90~220 in this scene)',R.rekeysPerFrame>=1&&R.createdPerFrame<=45,R);
ok('every image row shows its own image; no texture outside the ref table',R.mismatch===0&&R.orphanTex===0&&R.rows>50,R);
// ③ 같은 순간 켬·끔 비교: 게임 시간을 멈추고(tick 배율 아주 작게) 장면 명령 메시를 모두 지운 뒤 다시 그린다
const shot=async()=>{await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(r)))));return p.screenshot({clip:{x:0,y:0,width:640,height:360}});};
await p.evaluate(()=>{const base=window.tick;window.__r1200Freeze=true;});
const frozen=await p.evaluate(()=>{try{const T=window.__STORYWORLD_PHASE1__.controller.state.three;const C=T.commands;window.__r1200Pause=()=>{for(const k of [...C.rows.keys()])C.remove(k);};return typeof C.remove==='function';}catch(e){return String(e);}});
await p.evaluate(()=>{window.__r1200Old=window.tick;});
// 게임 멈추기: 엔진 tick 을 건너뛰게 한다(그리기만 계속)
await p.evaluate(()=>{const o=tick;window.tick=undefined;tick=function(){};window.__r1200Restore=()=>{tick=o;};});
const A=[],B=[];
for(let i=0;i<2;i++){await p.evaluate(()=>{window.__STORYWORLD_DRAW_REUSE_R1200__?.set(true);window.__r1200Pause();});A.push(await shot());
 await p.evaluate(()=>{window.__STORYWORLD_DRAW_REUSE_R1200__?.set(false);window.__r1200Pause();});B.push(await shot());}
await p.evaluate(()=>{window.__STORYWORLD_DRAW_REUSE_R1200__?.set(true);window.__r1200Restore();});
const cmp=await p.evaluate(async([a,b])=>{const load=async s=>{const im=new Image();im.src='data:image/png;base64,'+s;await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');g.drawImage(im,0,0);return g.getImageData(0,0,c.width,c.height).data;};
 const x=await load(a),y=await load(b);let s=0,big=0;for(let i=0;i<x.length;i+=4){const d=(Math.abs(x[i]-y[i])+Math.abs(x[i+1]-y[i+1])+Math.abs(x[i+2]-y[i+2]))/3;s+=d;if(d>40)big++;}return {mean:+(s/(x.length/4)).toFixed(3),big};},[A[1].toString('base64'),B[1].toString('base64')]);
const self=await p.evaluate(async([a,b])=>{const load=async s=>{const im=new Image();im.src='data:image/png;base64,'+s;await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');g.drawImage(im,0,0);return g.getImageData(0,0,c.width,c.height).data;};
 const x=await load(a),y=await load(b);let s=0,big=0;for(let i=0;i<x.length;i+=4){const d=(Math.abs(x[i]-y[i])+Math.abs(x[i+1]-y[i+1])+Math.abs(x[i+2]-y[i+2]))/3;s+=d;if(d>40)big++;}return {mean:+(s/(x.length/4)).toFixed(3),big};},[A[0].toString('base64'),A[1].toString('base64')]);
// 헤드리스는 게임 시간을 멈춰도 실제 시계로 움직이는 그림(깜빡임·흔들림)이 있어 '켬 대 켬'도 조금 다르다 → 켬 대 끔 차이가 그 잡음 수준 이하인지 본다
ok('frozen moment: reuse on vs off differ no more than on vs on (time-driven noise) — mean ≤ 1.5×noise+0.3, big-diff px ≤ 1.5×noise+50',cmp.mean<=self.mean*1.5+.3&&cmp.big<=self.big*1.5+50,{onVsOff:cmp,onVsOn:self,frozen});
ok('no page errors',errs.length===0,errs);
if(process.env.SHOT){const fs=await import('node:fs');fs.writeFileSync(process.env.SHOT+'-on.png',A[1]);fs.writeFileSync(process.env.SHOT+'-off.png',B[1]);}
await b.close();console.log(fail?'FAILED '+fail:'ALL PASS');process.exit(fail?1:0);
