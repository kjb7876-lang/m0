// R730 headless — 불면귀 구역 조형물이 뒤 절벽(벽 덩어리)에 파묻히지 않는지 R412 의 3D 벽 검사로 전수 측정한다.
//   STORYWORLD_URL=http://127.0.0.1:4396/ node r96/qa/r730/r730-wall-browser.mjs
// 조형물마다 그림 불투명 점을 3D 로 옮겨 벽 상자 안에 든 비율을 잰다(R412 LIMIT 3%). 헤드리스 소프트웨어 렌더링: GPU·실기기·자연 플레이 미검증.
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);let chromium;
for(const p of ['playwright','/opt/node22/lib/node_modules/playwright']){try{({chromium}=req(p));break;}catch(_){}}
const URL=process.env.STORYWORLD_URL||'http://127.0.0.1:4396/',LIMIT=.03;let fails=0,n=0;const check=(m,c,i)=>{n++;if(!c)fails++;console.log((c?'PASS ':'FAIL ')+m+(i===undefined?'':' '+JSON.stringify(i).slice(0,400)));};
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});const ctx=await b.newContext({viewport:{width:960,height:540}});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));const skip=()=>p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:120000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:180000});await skip();await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:60000});await skip();
for(const Z of ['last302','last303']){
 await p.evaluate(z=>{enterRegion(z,null,{layer:'STORY',restore:true});},Z);await p.waitForFunction(z=>!loading&&room?.id===z,Z,{timeout:120000});await p.waitForTimeout(8000);await skip();
 await p.evaluate(()=>{for(const q of room.props)if(q.path&&typeof addImage==='function')addImage(q.path,'r730 wall');});await p.waitForTimeout(6000);
 const res=await p.evaluate(()=>{const A=window.__STORYWORLD_PROPS_TIDY_R412__,L=room.exploration,out=[];
  for(const q of room.props){if(!q.r730||q.r730==='house'||!Number.isFinite(q.x+q.y))continue;const row={id:q.id,kind:q.r730,x:q.x,y:q.y,moved:!!q.r412Moved};
   try{const sv=cam;cam={x:q.x,y:q.y};const S=A.samplesOf(q);cam=sv;if(S){const F=A.footOf(q);row.emb=+(A.embedded(L,F.x,F.y,S,Infinity,false)/S.length).toFixed(3);}}catch(e){row.err=String(e).slice(0,80);}out.push(row);}return out;});
 const meas=res.filter(r=>r.emb!==undefined);
 check(Z+': 길 가 조형물 대부분 측정됨('+meas.length+'/'+res.length+')',meas.length>=res.length*.6&&!res.some(r=>r.err));
 check(Z+': 벽에 파묻힌 조형물 없음(전부 '+LIMIT*100+'% 이하)',meas.every(r=>r.emb<=LIMIT),meas.filter(r=>r.emb>LIMIT));}
check('페이지 오류 없음',!errs.length,errs);await b.close();console.log(fails?`FAIL ${fails}`:`ALL ${n} PASS`);process.exit(fails?1:0);
