// 몹 몸 그림 명령의 style.globalAlpha 를 누가 바꾸는지 호출 스택을 잡는다(진단용).
import {chromium,boot,skip} from '../r444/lib.mjs';
const [z,nm]=process.argv.slice(2);const b=await chromium.launch();
const {p}=await boot(b,{init:{'storyworld.r619.videopause':'{"on":false}','storyworld.r1036.entryvideo':'{"on":false}','storyworld.r309.opening':'{"on":false}','storyworld.r372.rootgate':'{"on":false}'}});
await p.evaluate(async z=>{await window.__STORYWORLD_SAMONG_R103__.goZone(z);},z);
await p.waitForFunction(()=>!loading,null,{timeout:150000});await skip(p);
await p.waitForFunction(nm=>room.enemies.some(q=>String(q.name).includes(nm)),nm,{timeout:40000}).catch(()=>{});
const r=await p.evaluate(nm=>new Promise(res=>{const e=room.enemies.find(q=>String(q.name).includes(nm));if(!e)return res('no enemy');
 const mine=k=>k?.kind==='image'&&k.owner?.kind==='enemy'&&String(k.owner?.id||'').endsWith(':'+e.id);const log=[];
 const trap=k=>{if(k.__t)return;k.__t=1;const stk=()=>new Error().stack.split('\n').slice(2,8).map(s=>s.trim().replace(/https?:\/\/[^/]+\/m0\//,'')).join(' | ');
  const wrapStyle=s=>{if(!s||s.__t)return s;let a=s.globalAlpha;try{Object.defineProperty(s,'globalAlpha',{configurable:true,enumerable:true,get(){return a;},set(x){log.push('set '+x+' '+stk());a=x;}});s.__t=1;}catch(_){}return s;};
  let st=wrapStyle(k.style);log.push('init '+(st&&st.globalAlpha));Object.defineProperty(k,'style',{configurable:true,enumerable:true,get(){return st;},set(x){log.push('replace a='+(x&&x.globalAlpha)+' '+stk());st=wrapStyle(x);}});};
 // 명령 배열에 넣는 순간 잡기: push 감싸기
 const h=window.__STORYWORLD_PHASE1__.controller.state.three;const sc=h.commands;const base=sc.render;let n=0;
 const op=Array.prototype.push;Array.prototype.push=function(...a){for(const k of a)if(mine(k))trap(k);return op.apply(this,a);};
 sc.render=function(cmds){const f=(cmds||[]).find(mine);if(f){f.__t||log.push('untrapped a='+f.style?.globalAlpha);if(++n>2){sc.render=base;Array.prototype.push=op;res({final:f.style?.globalAlpha,log:log.slice(0,12)});}}return base.apply(this,arguments);};
 setTimeout(()=>{Array.prototype.push=op;res({timeout:1,log:log.slice(0,12)});},20000);}),nm);
console.log(JSON.stringify(r,null,1));await b.close();
