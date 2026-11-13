// R1008 브라우저 검사(헤드리스): 영화 모드 마무리.
//  A 영화 모드 murder01 에서 영웅이 쓰러지면 쉼터로 가지 않고 그 자리에서 다시 일어선다.  B 일반 기록은 원래대로 '기억은 남아 있습니다' 창.
//  C 영화 모드 사몽 마지막(M-4) 진료기록 창이 자막이 끝나고 스스로 넘어가 거점으로 돌아온다.  D 일반 기록의 진료기록 창은 기다린다.
//  C 는 자막이 모두 끝날 때까지(빨리 감기 때문에 몇 분) 기다린 뒤 20초를 센다 — 최대 10분.
//  사용: SW_URL=http://127.0.0.1:4410/ node r96/qa/r1008/r1008-browser.mjs
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/';
const res=[];const ok=(k,v,info)=>{res.push({k,v:!!v});console.log((v?'PASS ':'FAIL ')+k+(info!==undefined?' · '+JSON.stringify(info).slice(0,500):''));};
const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
async function start(cin){const ctx=await b.newContext({viewport:{width:640,height:360}});await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));localStorage.setItem('storyworld.r790.npc','{"on":false}');});
 const p=await ctx.newPage();p.errs=[];p.on('pageerror',e=>p.errs.push(String(e).slice(0,200)));await p.goto(URL);await p.locator(cin?'#cinemaStartR461':'#campaignNew54').click({timeout:180000});const sc=p.locator('#slotConfirmR73');if(await sc.isVisible().catch(()=>false))await sc.click();
 await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});
 await p.evaluate(async()=>{for(let i=0;i<200&&storyScene;i++)advanceScene();if(modal)closePanel(true);await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:120000});return p;}
const enter=async(p,z)=>{await p.evaluate(z=>{for(let i=0;i<200&&storyScene;i++)advanceScene();if(modal)closePanel(true);enterRegion(z,null,{layer:'STORY',restore:true});},z);await p.waitForFunction(z=>!loading&&room?.id===z,z,{timeout:180000});};
const fast=p=>p.evaluate(()=>{setInterval(()=>{try{if(started&&!loading&&!modal&&player.hp>0)for(let i=0;i<3;i++)tick(.05);}catch(e){}},50);});
// A·B
for(const cin of [true,false]){const p=await start(cin);await enter(p,'murder01');
 await p.evaluate(()=>{for(let i=0;i<200&&storyScene;i++)advanceScene();if(modal)closePanel(true);player.invincible=0;player.shield=0;hurt(1e7,{name:'qa-r1008',damage:1e7});});
 await p.waitForTimeout(6000);
 const s=await p.evaluate(()=>({room:room.id,hp:Math.round(player.hp),max:Math.round(maxHP()),modal:!!modal,revive:!!document.getElementById('reviveHome'),panel:modal?(document.getElementById('panel')?.innerText||'').slice(0,40):null,inv:player.invincible,cin:window.__STORYWORLD_CINEMA_RUN_R461__?.active?.(),st:window.__STORYWORLD_CINEMA_FINISH_R1008__?.inspect?.().stats||null}));
 if(cin){ok('A cinema: hero stands up in murder01 (no sanctuary trip)',s.room==='murder01'&&s.hp>=s.max*.45&&!s.revive&&s.cin===true,s);
  await fast(p);await p.waitForTimeout(20000);const t=await p.evaluate(()=>({room:room.id,hp:Math.round(player.hp)}));ok('A cinema: still playing murder01 afterwards',t.room==='murder01'&&t.hp>0,t);ok('A page errors 0',!p.errs.length,p.errs);}
 else{ok('B normal record: original death window',s.revive&&s.hp===0&&s.room==='murder01',s);ok('B page errors 0',!p.errs.length,p.errs);}
 await p.context().close();}
// C·D
for(const cin of [true,false]){const p=await start(cin);await p.evaluate(()=>{for(let i=0;i<200&&storyScene;i++)advanceScene();if(modal)closePanel(true);window.__STORYWORLD_SAMONG_R103__.goZone('sz115-M-4');});
 await p.waitForFunction(()=>!loading&&room?.samongR103?.zone==='sz115-M-4',null,{timeout:180000});
 if(!cin)await p.evaluate(()=>{guide=true;auto=true;window.__STORYWORLD_GUIDE_R77__?.syncGuide?.();});
 await fast(p);
 // 일반 기록은 사람이 서사를 넘긴다(Enter). 영화 모드는 손대지 않는다.
 const t0=Date.now();let rec=false;while(Date.now()-t0<900000){const s=await p.evaluate(()=>({rec:!!document.getElementById('r103End'),scene:!!storyScene}));if(s.rec){rec=true;break;}if(!cin&&s.scene)await p.evaluate(()=>{for(let i=0;i<300&&storyScene;i++)advanceScene();});await p.waitForTimeout(2000);}
 ok((cin?'C':'D')+' record window reached',rec);
 const t1=Date.now();let gone=null;while(Date.now()-t1<(cin?600000:60000)){const s=await p.evaluate(()=>({rec:!!document.getElementById('r103End'),room:room?.id,sm:room?.samongR103?.zone||null,loading:!!loading,scene:!!storyScene}));if(!s.rec){gone={...s,after:Math.round((Date.now()-t1)/1000)};break;}await p.waitForTimeout(2000);}
 if(cin){// 에필로그 장면 뒤 거점으로
  const t2=Date.now();let fin=null;while(Date.now()-t2<300000){const s=await p.evaluate(()=>({room:room?.id,sm:room?.samongR103?.zone||null,loading:!!loading,modal:!!modal}));if(!s.sm&&!s.loading){fin=s;break;}await p.waitForTimeout(3000);}
  ok('C cinema: record window moves on by itself',!!gone,gone);ok('C cinema: back out of the samong zone (epilogue → base)',!!fin,fin);ok('C page errors 0',!p.errs.length,p.errs);}
 else{ok('D normal record: record window waits for the player (60 s)',!gone,gone);ok('D page errors 0',!p.errs.length,p.errs);}
 await p.context().close();}
await b.close();const bad=res.filter(r=>!r.v);console.log(bad.length?'RESULT FAIL '+bad.map(r=>r.k).join(' | '):'RESULT PASS');process.exit(bad.length?1:0);
