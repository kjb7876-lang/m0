// R571 오라 장면(헤드리스): 영웅을 골라 새로 시작 → DREAM 거미동굴 → 사몽 발현 → 확대해 한 순간 찍기. 그래픽 검증 아님(소프트웨어 렌더링).
import {chromium,skip,URL} from '../r444/lib.mjs';
import fs from 'node:fs';
const OUT=process.env.SW_OUT||'/tmp/r571';fs.mkdirSync(OUT,{recursive:true});
const heroes=(process.env.SW_HEROES||'hwando,slayer').split(',');
const b=await chromium.launch();
for(const hero of heroes){const ctx=await b.newContext({viewport:{width:960,height:600},deviceScaleFactor:1});
 await ctx.addInitScript(()=>localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false})));
 const p=await ctx.newPage();p.on('pageerror',e=>console.error(hero,'PAGEERR',String(e).slice(0,160)));
 await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});
 try{await p.locator('[data-hero="'+hero+'"]').first().click({timeout:8000});}catch(e){console.error(hero,'no hero button');}
 await p.locator('#slotConfirmR73').click();await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await skip(p);
 await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip(p);
 await p.evaluate(()=>enterRegion('dist01',null,{layer:'DREAM',restore:true}));await p.waitForFunction(()=>!loading&&layer==='DREAM',null,{timeout:150000});await skip(p);
 const got=await p.evaluate(async()=>{player.hp=99999;for(const e of room.enemies){e.hp=0;e.deadRecorded=true;}
  player.samong=0;player.samongCD=0;awaken('story');player.samong=50;
  try{window.__STORYWORLD_CAMERA_R63__?.setZoom?.(1.4);}catch(_){}try{zoom=1.4;}catch(_){}try{if(window.cameraState150)cameraState150.requestedZoom=1.4;}catch(_){}
  const w=s=>new Promise(r=>{const t0=time;const f=()=>time>=t0+s?r():setTimeout(f,40);f();});await w(1.2);return{hero:player.hero,zoom:typeof zoom==='number'?zoom:null};});
 const q=await p.evaluate(()=>{const v=project(player.x,player.y);const c=document.querySelector('canvas');const r=c.getBoundingClientRect();return{x:v.x*r.width/c.width+r.left,y:v.y*r.height/c.height+r.top};});
 for(let i=0;i<3;i++){await p.screenshot({path:OUT+'/aura2-'+hero+'-'+i+'.png',clip:{x:Math.max(0,q.x-170),y:Math.max(0,q.y-300),width:340,height:360}});await p.waitForTimeout(250);}
 await p.evaluate(()=>{player.samong=0;});await p.waitForTimeout(600);await p.screenshot({path:OUT+'/aura2-'+hero+'-off.png',clip:{x:Math.max(0,q.x-170),y:Math.max(0,q.y-300),width:340,height:360}});
 console.log(JSON.stringify({...got,q}));await ctx.close();}
await b.close();
