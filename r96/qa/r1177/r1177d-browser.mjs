// R1177d 지역 몹 타격 pixelfx(mob-*) Dots D 칠한 시트, 헤드리스 브라우저 검사(그래픽·GPU 검증 아님).
//  실행: SW_URL=http://127.0.0.1:4396/m0/ [SHOT=/tmp/dir] node r96/qa/r1177/r1177d-browser.mjs
//  ① 본편(스토리)에서 9종을 몹 색 물들임과 함께 불러 실제로 읽는 시트가 Dots 칸뿐인지(원래 흑백 도트 mob-* 0), 그림이 실제로 읽혔는지
//  ② 본편 몹이 실제로 때릴 때 R169 가 부른 타격도 Dots 칸인지 ③ 사몽 에피소드에서도 같은지. 페이지 오류 0.
import {createRequire} from 'node:module';
let chromium;try{({chromium}=createRequire(import.meta.url)('playwright'));}catch(_){({chromium}=createRequire('/opt/node22/lib/node_modules/')('playwright'));}
const URL=process.env.SW_URL||'http://127.0.0.1:4396/m0/',SHOT=process.env.SHOT||'';
let n=0,bad=0;const ok=(c,m,d)=>{n++;if(!c)bad++;console.log((c?'ok  ':'FAIL')+' '+m+(d!==undefined?': '+JSON.stringify(d).slice(0,500):''));};
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r790.npc','{"on":false}');});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,300)));
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:240000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});
const skip=()=>p.evaluate(()=>{for(let i=0;i<200&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip();
const waitGame=s=>p.evaluate(s=>new Promise(r=>{const t0=time;const f=()=>time>t0+s?r():setTimeout(f,50);f();}),s);
await p.evaluate(()=>{window.__C={paths:new Set()};const base=readyImage;readyImage=function(q,...a){if(typeof q==='string')__C.paths.add(q);return base.call(this,q,...a);};});
const FAM=['domestic','forge','neural','clinical','garden','stone','snow','coast','regional'];
const look=()=>p.evaluate(()=>{const A=window.__STORYWORLD_SAMONG_PIXEL_ART_R1177__,P=[...__C.paths].map(q=>A.resolve(q)||q);return{pixel:P.filter(q=>/assets\/r163\/pixelfx\/mob-(?!memory)[a-z]+\.webp$/.test(q)),dots:P.filter(q=>/assets\/r1177\/mob-[a-z]+-dots-\d+\.webp$/.test(q))};});
// ① 본편: 9종을 몹 색으로 불러 본다(한 줄로 늘어놓음)
await p.evaluate(F=>{player.invincible=1e9;const X=__STORYWORLD_PIXELFX_R163__;X.warm?.(F.map(f=>'mob-'+f));F.forEach((f,i)=>X.play('mob-'+f,player.x-3.2+(i%5)*1.6,player.y-1+Math.floor(i/5)*1.8,{k:1.3,rate:1.2,tint:'#7a3040'}));},FAM);
await waitGame(.25);if(SHOT)await p.screenshot({path:`${SHOT}/r1177d-story.png`});await waitGame(1.2);
let r=await look();ok(r.pixel.length===0,'본편: 원래 흑백 도트 mob-* 시트를 그리지 않음',r.pixel);
for(const f of FAM)ok(r.dots.some(q=>q.includes('/mob-'+f+'-dots-')),'본편: mob-'+f+' Dots 칸 그림',r.dots.length);
const loaded=await p.evaluate(F=>F.map(f=>{const row=__STORYWORLD_PIXELFX_R163__.meta()['mob-'+f];const q='assets/r163/pixelfx/'+row.file;try{const im=readyImage(q);return [f,!!(im&&(im.image||im).naturalWidth||im&&im.image&&im.image.width)];}catch(e){return [f,String(e)];}}),FAM);
ok(loaded.every(x=>x[1]===true),'Dots 시트 9장 실제로 읽힘',loaded);
// ② 본편 몹이 실제로 때리는 동안
await p.evaluate(()=>{__C.paths.clear();});const st0=await p.evaluate(()=>window.__STORYWORLD_PLAY_R169__?.inspect?.().stats?.mobPixel||0);
await waitGame(6);const st1=await p.evaluate(()=>window.__STORYWORLD_PLAY_R169__?.inspect?.().stats?.mobPixel||0);r=await look();
if(st1>st0){ok(r.pixel.length===0,'본편 실제 몹 타격: 도트 mob-* 없음',r.pixel);ok(r.dots.length>0,'본편 실제 몹 타격: Dots 칸',r.dots);}else console.log('skip ②: 6초 동안 몹 타격 없음',st0,st1);
// ③ 사몽 에피소드
await p.evaluate(async()=>{const SM=__STORYWORLD_SAMONG_R103__;await SM.go(SM.episodes.findIndex(e=>e.key==='S-06'),null,{zone:'sz115-S06-23'});});
await p.waitForFunction(()=>!loading,null,{timeout:150000});await skip();await waitGame(.3);
await p.evaluate(F=>{__C.paths.clear();player.invincible=1e9;const X=__STORYWORLD_PIXELFX_R163__;F.forEach((f,i)=>X.play('mob-'+f,player.x-3.2+(i%5)*1.6,player.y-1+Math.floor(i/5)*1.8,{k:1.3,tint:'#405060'}));},FAM);
await waitGame(.3);if(SHOT)await p.screenshot({path:`${SHOT}/r1177d-samong.png`});await waitGame(1.0);r=await look();
ok(r.pixel.length===0&&FAM.every(f=>r.dots.some(q=>q.includes('/mob-'+f+'-dots-'))),'사몽: 9종 모두 Dots 칸',r);
const ins=await p.evaluate(()=>window.__STORYWORLD_SAMONG_PIXEL_ART_R1177__.inspect());ok(ins.stats.errors===0,'R1177 오류 0',ins);
ok(errs.length===0,'페이지 오류 0',errs);
await b.close();console.log(`R1177d browser ${n-bad}/${n}`);process.exit(bad?1:0);
