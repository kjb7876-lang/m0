// R1055c 전수 확인(사용자 2026-11-15 14:49Z "사몽 사몽역행 등 모든맵 모두"): 무한 생존의 단계 목록(이야기 지역 전부 + 사몽 장)을 하나씩 들어가
//  필터가 켜졌는지(k), 맵 재질이 몇 개 걸렸는지, 켬·끔 화면 채도 차이를 적는다. 실행: node r1055c-sweep.mjs <out dir> [from] [to]
import {createRequire} from 'node:module';import fs from 'node:fs';const req=createRequire(import.meta.url);const {chromium}=req('/opt/node-tools/node_modules/playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/',out=process.argv[2]||'.',from=+(process.argv[3]||0),to=+(process.argv[4]||999);
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:640,height:360},deviceScaleFactor:1});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
await p.goto(URL);await p.locator('#survivalStartR600').waitFor({timeout:180000});
const SV=()=>p.evaluate(()=>{const A=window.__STORYWORLD_SURVIVAL_R600__;return {here:A.here?.(),ready:!!A.state?.()?.ready,loading:typeof loading!=='undefined'&&loading};});
await p.evaluate(()=>window.__STORYWORLD_SURVIVAL_R600__.start('hwando'));
const ready=()=>p.waitForFunction(()=>{const A=window.__STORYWORLD_SURVIVAL_R600__;return A.here()&&!loading&&A.state().ready;},null,{timeout:240000});
await ready();const ids=await p.evaluate(()=>window.__STORYWORLD_SURVIVAL_R600__.stageIds());console.log('STAGES',ids?ids.length:null);
const sat=async()=>{const buf=await p.screenshot({clip:{x:0,y:20,width:640,height:260}});return p.evaluate(async s=>{const im=new Image();im.src='data:image/png;base64,'+s;await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');g.drawImage(im,0,0);const d=g.getImageData(0,0,c.width,c.height).data;let t=0,n=0;for(let i=0;i<d.length;i+=16){const mx=Math.max(d[i],d[i+1],d[i+2]),mn=Math.min(d[i],d[i+1],d[i+2]);if(mx>24){t+=(mx-mn)/mx;n++;}}return n?+(t/n).toFixed(3):0;},buf.toString('base64'));};
const meas=()=>p.evaluate(()=>{const r=window.__STORYWORLD_PHASE1__.controller.state.three,I=window.__STORYWORLD_INK_WASH_R1055__.inspect();let tot=0,pat=0;const seen=new Set(),miss={};
 r.scene.traverse(o=>{if(!(o.layers?.mask&4)||!o.material)return;for(const m of [].concat(o.material)){if(!m||seen.has(m))continue;seen.add(m);tot++;let k='';try{k=m.customProgramCacheKey?.()||'';}catch(_){}if(String(k).includes('|r1055'))pat++;else{const nm=String(o.name||o.parent?.name||'?').slice(0,24);miss[nm]=(miss[nm]||0)+1;}}});
 return {room:room?.id,k:+I.k.toFixed(2),level:I.level,tot,pat,miss,err:I.stats.errors,three:!!r};});
const set=m=>p.evaluate(m=>window.__STORYWORLD_INK_WASH_R1055__.set({mode:m}),m);const rows=[];
const n=Math.min(ids?ids.length:0,to+1);
for(let i=from;i<n;i++){let row={i,id:ids[i]};try{if(i>0||from>0){await p.evaluate(i=>window.__STORYWORLD_SURVIVAL_R600__.qaGo(i),i);await p.waitForTimeout(400);await ready();}
  await p.evaluate(()=>{try{for(let j=0;j<160&&storyScene;j++)advanceScene();if(modal)closePanel(true);}catch(_){}});
  await set('all');await p.waitForTimeout(2200);const m=await meas(),on=await sat();if(i%6===0)await p.screenshot({path:`${out}/sweep-${String(i).padStart(2,'0')}-${String(ids[i]).replace(/[^a-zA-Z0-9]/g,'_')}.png`});
  await set('off');await p.waitForTimeout(1600);const off=await sat();await set('all');row={...row,...m,satOn:on,satOff:off};}catch(e){row.fail=String(e).slice(0,120);}
 rows.push(row);console.log(JSON.stringify(row));}
fs.writeFileSync(`${out}/sweep.json`,JSON.stringify({rows,errs},null,1));
const badRows=rows.filter(r=>r.fail||!(r.k>.95)||!(r.pat>0)||r.err>0);console.log(`\nR1055c sweep: ${rows.length-badRows.length}/${rows.length} stages with the filter on · page errors ${errs.length}`,JSON.stringify(badRows.map(r=>r.id)));await b.close();process.exit(badRows.length?1:0);
