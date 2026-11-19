// R1217 ① 헤드리스 비교(GPU·실기기 아님): 같은 순간(시간 멈춤)에 흑백 사본 방식과 셰이더 방식을 번갈아 찍어 화면 차이를 잰다.
//  OUT 폴더에 copy.png / shader.png / diff 수치. 영웅·이펙트는 두 방식 모두 컬러, 세계는 흑백이어야 같다.
import {createRequire} from 'node:module';import fs from 'node:fs';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.URL||'http://127.0.0.1:4410/m0/',OUT=process.env.OUT||'.';fs.mkdirSync(OUT,{recursive:true});
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
const skip=()=>p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
const waitG=s=>p.evaluate(s=>new Promise(res=>{const t0=time;const f=()=>{if(modal)closePanel(true);time>=t0+s?res():setTimeout(f,25);};f();}),s);
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip();
await p.evaluate(z=>enterRegion(z,null,{layer:'DREAM',restore:true}),process.env.ZONE||'dist01');await p.waitForFunction(()=>!loading&&layer==='DREAM',null,{timeout:150000});await skip();
await p.evaluate(()=>{player.hp=player.maxHp=1e7;auto=true;window.__SLOW=1;const tb=tick;tick=function(dt,...a){return tb.call(this,dt*(window.__SLOW??1),...a);};});
await waitG(2);await p.evaluate(()=>{player.samongCD=0;awaken('story');});await waitG(2.2);
await p.evaluate(()=>{window.__SLOW=1e-6;document.getElementById('cutin')?.classList.remove('on');});await p.waitForTimeout(600);
const shot=async name=>{await p.waitForTimeout(500);return p.screenshot({path:OUT+'/'+name+'.png'});};
await p.evaluate(()=>window.__STORYWORLD_PLAY_R111__.set({samongShader:true}));const A=await shot('shader');
await p.evaluate(()=>window.__STORYWORLD_PLAY_R111__.set({samongShader:false}));const B=await shot('copy');
await p.evaluate(()=>window.__STORYWORLD_PLAY_R111__.set({samongShader:true}));const C=await shot('shader2');
const st=await p.evaluate(()=>window.__STORYWORLD_PLAY_R111__.inspect().samong);
const diff=await p.evaluate(async([a,b,c])=>{const load=s=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src='data:image/png;base64,'+s;});const [ia,ib,ic]=await Promise.all([load(a),load(b),load(c)]);
 const px=i=>{const cv=document.createElement('canvas');cv.width=i.width;cv.height=i.height;const g=cv.getContext('2d');g.drawImage(i,0,0);return g.getImageData(0,0,i.width,i.height).data;};
 const da=px(ia),db=px(ib),dc=px(ic);const cmp=(x,y)=>{let s=0,big=0;for(let k=0;k<x.length;k+=4){const d=(Math.abs(x[k]-y[k])+Math.abs(x[k+1]-y[k+1])+Math.abs(x[k+2]-y[k+2]))/3;s+=d;if(d>24)big++;}return{mean:+(s/(x.length/4)).toFixed(2),bigPct:+(100*big/(x.length/4)).toFixed(2)};};
 return{shaderVsCopy:cmp(da,db),shaderVsShader:cmp(da,dc)};},[A.toString('base64'),B.toString('base64'),C.toString('base64')]);
console.log(JSON.stringify({diff,samong:{on:st.on,shaderDraws:st.shaderDraws,grayImages:st.grayImages},errs}));await b.close();
