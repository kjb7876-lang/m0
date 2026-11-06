// R378 전후 스크린샷 — 같은 카메라 자리(오르골 왼쪽 1.2칸)에서 오르골 끔(=이전)·켬, 열림·재생. PC(3D 기본)·모바일(Pixel 7).
//   STORYWORLD_URL=http://127.0.0.1:4410/m0/ OUT=r96/qa/r378/screens node r96/qa/r378/r378-screens.mjs
// 헤드리스 화면(임시). GPU·실기기·소리는 미검증.
import {createRequire} from 'node:module';import fs from 'node:fs';
const req=createRequire(import.meta.url);let pw;for(const p of ['playwright','/opt/node22/lib/node_modules/playwright']){try{pw=req(p);break;}catch(_){}}
const {chromium,devices}=pw;const URL=process.env.STORYWORLD_URL||'http://127.0.0.1:4410/m0/',OUT=process.env.OUT||'r96/qa/r378/screens';fs.mkdirSync(OUT,{recursive:true});
const skip=p=>p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
async function shot(tag,ctxOpt,off){const b=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']});const ctx=await b.newContext(ctxOpt);
 await ctx.addInitScript(o=>{try{if(o)localStorage.setItem('storyworld.r378.orgel',JSON.stringify({on:false}));}catch(_){}},off);
 const p=await ctx.newPage();await p.goto(URL);await p.locator('#campaignNew54').click({timeout:120000});await p.locator('#slotConfirmR73').click();
 await p.waitForFunction(()=>started&&!loading,null,{timeout:180000});await skip(p);await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading);await skip(p);
 await p.evaluate(()=>{visited.add('STORY:dist00');enterRegion('dreamRest',null,{layer:'STORY',restore:true});});await p.waitForFunction(()=>!loading&&room?.id==='dreamRest',null,{timeout:120000});await skip(p);await p.waitForTimeout(2500);await skip(p);
 // 같은 자리: 켬일 때 오르골 자리(로그로 남김)를 끔에도 그대로 쓴다
 const spot={x:20.5,y:14.5};
 await p.evaluate(s=>{const o=room.props.find(q=>q.r378Orgel);const at=o||s;player.x=at.x-1.2;player.y=at.y+.3;route=[];command=null;auto=false;},spot);await p.waitForTimeout(900);
 await p.screenshot({path:`${OUT}/${tag}-${off?'before':'after'}.jpg`,quality:74});
 const where=await p.evaluate(()=>{const o=room.props.find(q=>q.r378Orgel);return o?{x:o.x,y:o.y}:null;});
 if(!off){await p.evaluate(()=>interact());await p.waitForTimeout(2600);await p.screenshot({path:`${OUT}/${tag}-open.jpg`,quality:74});}
 await b.close();return where;}
const pc={viewport:{width:1280,height:720}},mob={...devices['Pixel 7']};
const w=await shot('pc',pc,false);console.log('orgel at',JSON.stringify(w));await shot('pc',pc,true);
await shot('mobile',mob,false);await shot('mobile',mob,true);console.log('done');
