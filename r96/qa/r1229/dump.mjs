import {chromium,boot,go,skip} from '../r444/lib.mjs';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});
await p.evaluate(()=>{player.hero='hunter';});await go(p,'dist06');
const r=await p.evaluate(async()=>{const three=window.__STORYWORLD_PHASE1__.controller.state.three,base=three.render;const R=[];
 three.render=function(f){const c=(f.commands||[]).find(c=>c.owner?.kind==='hero'&&c.kind==='image');if(c&&R.length<40){const o={};for(const k in c){const v=c[k];o[k]=(v&&typeof v==='object')?(k==='image'?String(v.src).slice(-40):Array.isArray(v)?v.map(x=>typeof x==='number'?+x.toFixed(1):x).slice(0,10):Object.keys(v).slice(0,8)):v;}R.push({t:+time.toFixed(2),o});}return base.apply(this,arguments);};
 keys.add('ArrowRight');const t0=time;await new Promise(r=>{const g=()=>{if(time-t0>1.5)return r();setTimeout(g,50);};g();});keys.delete('ArrowRight');three.render=base;return R;});
console.log(JSON.stringify(r[0]));for(const x of r)console.log(x.t,JSON.stringify(x.o.sourceRect),x.o.imageSize,x.o.image.slice(-30));
await b.close();
