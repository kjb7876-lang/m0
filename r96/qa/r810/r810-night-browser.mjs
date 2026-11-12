// R810 headless — 불면귀 구역(last302 잠들지 못하는 마을·last303 한약과 불면귀)을 홍보 영상에 쓸 밤 장면으로.
//   STORYWORLD_URL=http://127.0.0.1:4396/ node r96/qa/r810/r810-night-browser.mjs   (SHOTS=폴더 를 주면 찍은 화면을 남긴다)
// 화면 실측(길잡이 길 위 세 자리, 플레이 영역만): 남색 달빛(파랑-빨강 평균 > 0), 등불 호박빛 점(따뜻하고 진한 화소 비율),
// 데칼에 거미 모양 균열이 없는지, 다른 지역(악마화 나무의 정원)의 색 보정은 그대로인지(회귀).
// 헤드리스 소프트웨어 렌더링 — GPU·실기기 모바일·자연 플레이는 미검증.
import {createRequire} from 'node:module';import fs from 'node:fs';const req=createRequire(import.meta.url);let chromium;
for(const p of ['playwright','/opt/node22/lib/node_modules/playwright']){try{({chromium}=req(p));break;}catch(_){}}
const URL=process.env.STORYWORLD_URL||'http://127.0.0.1:4396/',SHOTS=process.env.SHOTS||'';let fails=0,n=0;
const check=(m,c,i)=>{n++;if(!c)fails++;console.log((c?'PASS ':'FAIL ')+m+(i===undefined?'':' '+JSON.stringify(i).slice(0,500)));};
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});const ctx=await b.newContext({viewport:{width:1280,height:720}});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));const skip=()=>p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await skip();await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:60000});await skip();
const go=async z=>{await p.evaluate(z=>{enterRegion(z,null,{layer:'STORY',restore:true});},z);await p.waitForFunction(z=>!loading&&room?.id===z,z,{timeout:180000});await p.waitForTimeout(6000);await skip();};
// 화면 실측: 플레이 영역(위 띠·아래 HUD·오른쪽 길잡이 빼고)
const measure=async()=>{const png=(await p.screenshot({type:'png'})).toString('base64');return p.evaluate(async s=>{const im=new Image();im.src='data:image/png;base64,'+s;await im.decode();
 const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');g.drawImage(im,0,0);const H=im.height,W=im.width,y0=Math.round(H*.07),y1=Math.round(H*.82),x1=Math.round(W*.92);
 const d=g.getImageData(0,y0,x1,y1-y0).data;let n=0,br=0,warm=0,lum=0;for(let i=0;i<d.length;i+=16){const r=d[i]/255,gg=d[i+1]/255,bb=d[i+2]/255,mx=Math.max(r,gg,bb),mn=Math.min(r,gg,bb),sat=mx?(mx-mn)/mx:0;n++;br+=bb-r;lum+=(r+gg+bb)/3;if(r>bb*1.35&&r>.35&&sat>.35)warm++;}
 return {bMinusR:+(br/n).toFixed(4),warm:+(warm/n).toFixed(4),mean:+(lum/n).toFixed(3)};},png);};
const res={};
for(const Z of ['last302','last303']){await go(Z);
 const st=await p.evaluate(()=>{const L=window.__STORYWORLD_LOCAL_LIGHT_R451__,D=window.__STORYWORLD_DARK_R123__,C=window.__STORYWORLD_CAVE_R204__;const li=L?.inspect?.()||{};
  return {amb:li.ambient,filter:D?.filter?.()||'',decals:C?.decalKinds?.(room.id)||null,lamps:(li.lights||[]).filter(l=>l.type==='lamp'||l.type==='fire').length,
   pts:(()=>{const s=[...(window.__STORYWORLD_PLAY_R169__?.pathCells?.(room)||[])].map(k=>String(k).split(',').map(Number));return [.2,.5,.8].map(f=>{const c=s[Math.floor(f*s.length)];return {x:c[0]+.5,y:c[1]+.5};});})()};});
 check(Z+': 달빛 바탕빛이 남색(파랑 > 빨강×1.3, 세기 ≤ .7)',!!st.amb&&st.amb.c[2]>st.amb.c[0]*1.3&&st.amb.k<=.7,st.amb);
 check(Z+': 화면 색 보정에 세피아·붉은 색조 돌림 없음',!/sepia|hue-rotate\(-/.test(st.filter),st.filter);
 check(Z+': 바닥 데칼에 거미 모양 균열(0번) 없음',Array.isArray(st.decals)&&st.decals.length>0&&!st.decals.includes(0),st.decals);
 const M=[];for(let i=0;i<st.pts.length;i++){const q=st.pts[i];await p.evaluate(q=>{window.__r810pin&&clearInterval(window.__r810pin);window.__r810pin=setInterval(()=>{player.x=q.x;player.y=q.y;cam={x:q.x,y:q.y};},30);},q);
  await p.waitForTimeout(9000);await skip();
  // 맵(바닥·지형·조형물) 색만 잰다: 몹 무리(갈색 옷의 잠식된 주민 수십 명)가 화면을 덮는 자리가 있어 잴 때만 잠깐 몹을 비우고 되돌린다
  await p.evaluate(()=>{if(typeof enemies!=='undefined'&&Array.isArray(enemies))window.__r810en=enemies.splice(0);});await p.waitForTimeout(1500);M.push(await measure());
  await p.evaluate(()=>{if(window.__r810en&&typeof enemies!=='undefined'){enemies.push(...window.__r810en);window.__r810en=null;}});if(SHOTS){fs.mkdirSync(SHOTS,{recursive:true});await p.screenshot({path:`${SHOTS}/${Z}-${i}.jpg`,type:'jpeg',quality:84});}}
 await p.evaluate(()=>clearInterval(window.__r810pin));res[Z]=M;
 const avg=k=>M.reduce((a,m)=>a+m[k],0)/M.length;
 check(Z+': 화면이 남색 달빛 쪽(파랑-빨강 평균 > 0)',avg('bMinusR')>0,M.map(m=>m.bMinusR));
 check(Z+': 등불 호박빛이 화면에 보임(따뜻한 진한 화소 평균 ≥ 1%)',avg('warm')>=.01,M.map(m=>m.warm));
 check(Z+': 너무 어둡지 않음(평균 밝기 ≥ .12, 바닥 결이 읽힘)',avg('mean')>=.12,M.map(m=>m.mean));}
// 회귀: 다른 지역은 그대로
await go('dist00');const other=await p.evaluate(()=>({amb:window.__STORYWORLD_LOCAL_LIGHT_R451__?.inspect?.().ambient,filter:window.__STORYWORLD_DARK_R123__?.filter?.()||'',decals:window.__STORYWORLD_CAVE_R204__?.decalKinds?.('dist00')||null}));
check('회귀: 악마화 나무의 정원 색 보정(세피아 포함)·바탕빛 그대로',/sepia/.test(other.filter)&&!!other.amb&&other.amb.k>=.8,other);
check('회귀: 다른 지역 데칼 표는 그대로(균열 0번 남음)',Array.isArray(other.decals)&&other.decals.includes(0),other.decals);
check('페이지 오류 없음',!errs.length,errs);await b.close();console.log(JSON.stringify(res));console.log(fails?`FAIL ${fails}`:`ALL ${n} PASS`);process.exit(fails?1:0);
