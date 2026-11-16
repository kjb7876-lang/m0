// R1116 헤드리스 확인: 게임 안 EGO 수묵 몸이 곧은 칼 판(assets/r1116/ego-ink)을 받아 그리는지, 원본 r1112 판은 받지 않는지 + 장면 사진.
//  실행: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r1116/r1116-browser.mjs [스크린샷 폴더]
import {createRequire} from 'node:module';import fs from 'node:fs';
let chromium;try{({chromium}=createRequire(import.meta.url)('playwright'));}catch(_){({chromium}=createRequire('/opt/node22/lib/node_modules/')('playwright'));}
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/',SH=process.argv[2]||'';if(SH)fs.mkdirSync(SH,{recursive:true});
let n=0,bad=0;const ok=(c,m,d)=>{n++;if(!c)bad++;console.log((c?'ok  ':'FAIL')+' '+m+(d!==undefined?': '+JSON.stringify(d).slice(0,300):''));};
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});
const p=await ctx.newPage();const errs=[],got={r1116:new Set(),r1112:new Set()};p.on('pageerror',e=>errs.push(String(e).slice(0,300)));
p.on('request',r=>{const m=r.url().match(/assets\/(r1116|r1112)\/ego-ink\/([a-z]+-[a-z]+)\.webp/);if(m)got[m[1]].add(m[2]);});
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('.heroRowR101 button[data-hero="hwando"]').waitFor({timeout:30000});
await p.evaluate(()=>{const E=window.__STORYWORLD_EGO_SOVEREIGN_R1046__;E.unlock?.('qa');E.refresh?.();});await p.waitForTimeout(600);
await p.locator('#panel [data-ego-r1046]').first().click();await p.waitForTimeout(300);
await p.locator('#slotConfirmR73').click();await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});
await p.evaluate(()=>{for(let i=0;i<200&&storyScene;i++)advanceScene();if(modal)closePanel(true);player.invincible=1e6;});
const waitG=s=>p.evaluate(async s=>{const t0=time;for(let i=0;i<4000&&time-t0<s;i++)await new Promise(r=>setTimeout(r,25));},s);
const t0=Date.now();let st=null;
while(Date.now()-t0<240000){st=await p.evaluate(()=>({form:!!window.__STORYWORLD_EGO_SOVEREIGN_R1046__?.formActive?.(),base:window.__STORYWORLD_EGO_INK_R1099__?.pre?.()?.base,ready:window.__STORYWORLD_EGO_INK_R1099__?.inspect?.()?.ready}));if(st.form&&st.ready>=48&&got.r1116.size>=48)break;await waitG(.3);}
ok(st?.base==='assets/r1116/ego-ink/','PRE 표가 곧은 칼 판을 가리킴',st);
ok(got.r1116.size===48,'곧은 칼 판 48장을 받음',got.r1116.size);
ok(got.r1112.size===0,'원본(휜 칼) r1112 판은 받지 않음',[...got.r1112].slice(0,5));
if(SH){for(const [nm,dx,dy] of [['e',1,0],['w',-1,0],['s',0,1],['n',0,-1]]){
 await p.evaluate(([dx,dy])=>{window.__w=setInterval(()=>{player.x+=dx*.04;player.y+=dy*.04;},16);},[dx,dy]);await waitG(.5);await p.evaluate(()=>clearInterval(window.__w));
 await p.screenshot({path:SH+'/walk-'+nm+'.png'});
 await p.keyboard.press('KeyA');await p.evaluate(()=>{if(!(player.attackAnim>0))player.attackAnim=.35;});await waitG(.12);await p.screenshot({path:SH+'/attack-'+nm+'.png'});await waitG(.3);}}
ok(errs.length===0,'페이지 오류 0',errs);
console.log(`\nR1116 browser: ${n-bad}/${n} 통과`);await b.close();process.exit(bad?1:0);
