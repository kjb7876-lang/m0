// R1007 영화 모드에서 영웅이 죽는 지역 재현: 영화 모드 시작 → 777 → 지역 → 빨리 감기, 받은 피해(hurt)를 출처별로 모은다.
//  사용: node r96/qa/r1007/cine-death.mjs <지역> [분] [cinema|story]
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/';const [Z='murder01',MIN='8',MODE='cinema']=process.argv.slice(2);
const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});const ctx=await b.newContext({viewport:{width:640,height:360}});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));localStorage.setItem('storyworld.r790.npc','{"on":false}');});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
await p.goto(URL);await p.locator(MODE==='cinema'?'#cinemaStartR461':'#campaignNew54').click({timeout:180000});const sc=p.locator('#slotConfirmR73');if(await sc.isVisible().catch(()=>false))await sc.click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});
await p.evaluate(async()=>{for(let i=0;i<200&&storyScene;i++)advanceScene();if(modal)closePanel(true);await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:120000});
await p.evaluate(z=>{for(let i=0;i<200&&storyScene;i++)advanceScene();if(modal)closePanel(true);enterRegion(z,null,{layer:'STORY',restore:true});},Z);await p.waitForFunction(z=>!loading&&room?.id===z,Z,{timeout:180000});
await p.evaluate(mode=>{window.__H={by:{},log:[],deaths:0};const h=hurt;hurt=function(d,s){const hp0=player.hp;const r=h.apply(this,arguments);const lost=hp0-player.hp;if(lost>0){const k=(s?.name||s?.kind||s?.type||s?.samongPattern||s?.id||typeof s)+'|'+(s?.boss?'boss':s?.midboss?'mid':'')+'|'+(s?.type||'');const o=__H.by[k]||(__H.by[k]={n:0,dmg:0,max:0});o.n++;o.dmg+=lost;o.max=Math.max(o.max,lost);if(lost>80)__H.log.push({t:+time.toFixed(1),k,lost,hp:player.hp,stage:room.encounterStage});if(player.hp<=0)__H.deaths++;}return r;};
 if(mode!=='cinema'){guide=true;auto=true;window.__STORYWORLD_GUIDE_R77__?.syncGuide?.();}
 const raf=window.requestAnimationFrame.bind(window);let last=0;window.requestAnimationFrame=cb=>raf(function loop(ts){if(loading||ts-last>=200){last=ts;cb(ts);}else raf(loop);});
 setInterval(()=>{try{if(started&&!loading&&!modal&&player.hp>0)for(let i=0;i<3;i++)tick(.05);}catch(e){}},50);},MODE);
const t0=Date.now();let res;while(Date.now()-t0<+MIN*60000){res=await p.evaluate(()=>({room:room.id,t:+time.toFixed(1),hp:Math.round(player.hp),max:Math.round(maxHP()),def:player.defense??null,stage:room.encounterStage,deaths:__H.deaths,mods:modal?document.querySelector('#panel')?.innerText?.slice(0,120):null}));
 if(res.deaths)break;await new Promise(r=>setTimeout(r,4000));}
const H=await p.evaluate(()=>({by:Object.entries(__H.by).sort((a,b)=>b[1].dmg-a[1].dmg).slice(0,12),log:__H.log.slice(-25),lv:player.level,diff:room.difficultyR63,cin:window.__STORYWORLD_CINEMA_RUN_R461__?.active?.(),sync:window.__STORYWORLD_CINEMA_SYNC_R384__?.inspect?.()}));
console.log(JSON.stringify({res,H,errs},null,1));await b.close();
