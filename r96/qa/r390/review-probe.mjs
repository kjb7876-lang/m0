// R390 외부 리뷰 사실 확인(헤드리스): 화면 글자 중 상호작용 'E' 안내가 남았는지, 스킬 칸에 남은 초 숫자가 있는지, 모바일 조이스틱 touch-action.
import {createRequire} from 'node:module';import fs from 'node:fs';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const OUT=process.env.OUT||'out';fs.mkdirSync(OUT,{recursive:true});const res={};
const b=await chromium.launch();
async function boot(vp,mobile){const ctx=await b.newContext({viewport:vp,isMobile:mobile,hasTouch:mobile,deviceScaleFactor:1});
 await ctx.addInitScript(()=>{try{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));}catch(_){}});const p=await ctx.newPage();
 await p.goto('http://127.0.0.1:4396/m0/');await p.locator('#campaignNew54').click({timeout:120000});await p.locator('#slotConfirmR73').click();
 await p.waitForFunction(()=>started&&!loading,null,{timeout:180000});await p.waitForTimeout(800);await p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);});return p;}
const scan=p=>p.evaluate(()=>{const out=new Set();const re=/(^|[^A-Za-z])E\s*(키|·|:|\]|\)|로|를|누르|상호)|\[E\]|\(E\)/;
 const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){const t=n.textContent.trim();if(!t||!re.test(t))continue;const el=n.parentElement;if(!el)continue;const cs=getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden'||!el.getClientRects().length)continue;out.add(t.slice(0,90));}
 for(const el of document.querySelectorAll('[title]')){const t=el.title;if(re.test(t))out.add('title: '+t.slice(0,90));}return [...out];});
const p=await boot({width:1280,height:720},false);
res.hubE=await scan(p);
await p.evaluate(()=>{showSettings?.();});await p.waitForTimeout(500);res.settingsE=await scan(p);await p.evaluate(()=>{if(modal)closePanel(true);});
// 스킬 하나 쓰고 칸 글자
await p.keyboard.press('KeyQ');await p.waitForTimeout(300);await p.keyboard.press('KeyW');await p.waitForTimeout(300);
res.skillSlots=await p.evaluate(()=>[...document.querySelectorAll('.skill')].slice(0,8).map(s=>({id:s.id,text:s.innerText.replace(/\s+/g,' ').slice(0,40)})));
await p.screenshot({path:OUT+'/review-hub.jpg',quality:70});
const m=await boot({width:390,height:844},true);
res.mobile=await m.evaluate(()=>{const j=document.getElementById('joystick');const r=j?.getBoundingClientRect();const hits=[...document.querySelectorAll('#joystick,#touchUse,#attackBtn,#blinkBtn,#specialBtn,#egoBtn,#guardBtn,.skill,#hpOrb,#mpOrb,.orb')].filter(e=>e.getClientRects().length).map(e=>{const b=e.getBoundingClientRect();return{id:e.id||e.className,ta:getComputedStyle(e).touchAction,x:Math.round(b.x),y:Math.round(b.y),w:Math.round(b.width),h:Math.round(b.height)};});
 const ov=[];for(let i=0;i<hits.length;i++)for(let k=i+1;k<hits.length;k++){const a=hits[i],c=hits[k];if(a.x<c.x+c.w&&c.x<a.x+a.w&&a.y<c.y+c.h&&c.y<a.y+a.h)ov.push(a.id+' × '+c.id);}return{hits,overlaps:ov};});
await m.screenshot({path:OUT+'/review-mobile.jpg',quality:70});
fs.writeFileSync(OUT+'/review-probe.json',JSON.stringify(res,null,1));console.log(JSON.stringify(res,null,1).slice(0,4000));await b.close();
