// R660 브라우저 측정(헤드리스 640×360, 소프트웨어 렌더링): 사몽 S-01 광장에서 길잡이+반자동으로 싸우며 게임 1초당 색 보정 캔버스(spriteTintCache3) 생성·텍스처 업로드 화소를 몹 죽음 연출 켬/끔으로 잰다. GPU·실기기 아님.
import {chromium,boot,skip} from '../r444/lib.mjs';import fs from 'node:fs';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360}});
await p.evaluate(()=>{const C=HTMLCanvasElement.prototype;window.__gl={tex:0,texPx:0,sub:0,subPx:0,tint:0,tintPx:0,keys:new Map()};
 for(const G of [WebGLRenderingContext.prototype,WebGL2RenderingContext.prototype]){const ti=G.texImage2D,ts=G.texSubImage2D;
  G.texImage2D=function(...a){__gl.tex++;const s=a.find(x=>x&&typeof x==='object'&&'width'in x);if(s)__gl.texPx+=s.width*s.height;return ti.apply(this,a)};
  G.texSubImage2D=function(...a){__gl.sub++;const s=a.find(x=>x&&typeof x==='object'&&'width'in x);if(s)__gl.subPx+=s.width*s.height;return ts.apply(this,a)};}
 const set=Map.prototype.set;spriteTintCache3.set=function(k,v){__gl.tint++;__gl.tintPx+=v.width*v.height;const f=k.split('|')[1];__gl.keys.set(f,(__gl.keys.get(f)||0)+1);return set.call(this,k,v)};});
await p.evaluate(()=>window.__STORYWORLD_SAMONG_R103__.go(1,'survival',{zone:'sz162-S-01-B'}));
await p.waitForFunction(()=>!loading&&layer==='DREAM',null,{timeout:180000});await skip(p);
const keep=()=>p.evaluate(()=>{if(modal&&!loading)closePanel(true);if(storyScene)for(let i=0;i<50&&storyScene;i++)advanceScene();player.invincible=99999;guide=true;auto=true;settings.autoSkill=true;});
for(let i=0;i<8;i++){await p.waitForTimeout(4000);await keep();}
const win=async(label)=>{await p.evaluate(()=>{for(const k of['tex','texPx','sub','subPx','tint','tintPx'])__gl[k]=0;__gl.keys.clear();window.__t0=time;window.__r0=performance.now();window.__k0=room.kills||0;});
 for(let i=0;i<4;i++){await p.waitForTimeout(4000);await keep();}
 return p.evaluate(l=>{const g=time-__t0,r=(performance.now()-__r0)/1000;return{l,game:+g.toFixed(2),fps:null,real:+r.toFixed(1),perGame:Object.fromEntries(['tex','texPx','sub','subPx','tint','tintPx'].map(k=>[k,Math.round(__gl[k]/g)])),topFilters:[...__gl.keys].sort((a,b)=>b[1]-a[1]).slice(0,6)}},label);};
const out=[];out.push(await win('on'));await p.evaluate(()=>window.__STORYWORLD_MOB_DEATH_R462__.set({on:false}));out.push(await win('off'));
await p.evaluate(()=>window.__STORYWORLD_MOB_DEATH_R462__.set({on:true}));out.push(await win('on'));
console.log(JSON.stringify(out,null,1));await b.close();
