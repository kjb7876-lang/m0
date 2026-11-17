import {chromium,boot} from '../r444/lib.mjs';
const b=await chromium.launch();
const {p}=await boot(b,{vp:{width:640,height:360}});
const A='__STORYWORLD_PERSONA_HERO_R1113__';
await p.evaluate(async A=>{await ensureImages(heroPaths('lauren'));player.hero='lauren';window[A].unlock('silent');window[A].setForm(true);},A);
await p.evaluate(()=>{const T=__STORYWORLD_PHASE1__.controller.state.three;const O=T.render;window.__seen=new Map();T.render=function(f){const R=O.apply(this,arguments);try{for(const c of f.commands){if(!c||c.kind!=='image')continue;const o=c.owner||{};const sp=String(c.sourcePath||'').replace(/\d+/g,'#').slice(0,70);const k=(o.kind||'?')+'|'+String(o.id||'').replace(/\d+/g,'#').slice(0,40)+'|'+sp+'|'+(c.r1113?'R':'')+(c.r1113tint?'T':'');if(o.kind==='enemy'||o.kind==='tile'||o.kind==='prop')continue;window.__seen.set(k,(window.__seen.get(k)||0)+1);}}catch(e){}return R;};});
await p.waitForTimeout(2000);
const out={};
for(const key of ['KeyA','KeyS','KeyD','KeyW','KeyQ','KeyE','KeyR','KeyF']){await p.evaluate(()=>window.__seen.clear());await p.keyboard.down(key);await p.waitForTimeout(150);await p.keyboard.up(key);await p.waitForTimeout(2500);out[key]=await p.evaluate(()=>[...window.__seen].map(([k,v])=>k+' x'+v));}
await p.evaluate(()=>window.__seen.clear());await p.keyboard.down('ArrowRight');await p.waitForTimeout(3000);await p.keyboard.up('ArrowRight');
out.walk=await p.evaluate(()=>[...window.__seen].map(([k,v])=>k+' x'+v));
out.inspect=await p.evaluate(A=>window[A].inspect(),A);
out.keys=await p.evaluate(()=>{try{return JSON.stringify(typeof keybinds!=='undefined'?keybinds:null)}catch(e){return null}});
console.log(JSON.stringify(out,null,1));await b.close();
