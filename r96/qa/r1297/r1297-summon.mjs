// R1297 소환 영웅(R1157) 고리·소용돌이 전후 촬영(헤드리스 소프트웨어 렌더 — GPU·실기기 미검증). SW_URL=<주소> node r1297-summon.mjs <폴더> <접두어>
import {chromium,boot,go} from '../r444/lib.mjs';
const OUT=process.argv[2]||'.',TAG=process.argv[3]||'x';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
await go(p,'murder01');await p.waitForTimeout(1500);
await p.evaluate(()=>{window.__k=1;const tb=tick;tick=function(dt,...a){return tb.call(this,dt*window.__k,...a);};player.hp=99999;
 for(const e of room.enemies){e.hp=0;}
 const t=window.__STORYWORLD_PHASE1__.controller.state.three;const rb=t.render;t.render=function(f){try{window.__last=f.commands.filter(c=>/^r1157:(ring|gate)/.test(String(c.owner?.id))).map(c=>({id:String(c.owner.id).split(':')[1],src:String(c.sourcePath).replace(/^.*\//,''),a:+(+c.style?.globalAlpha).toFixed(3),op:c.style?.globalCompositeOperation}));}catch(_){}return rb.apply(this,arguments);};
 const E=window.__STORYWORLD_EGO_SOVEREIGN_R1046__;player.hero='hwando';E?.unlock?.();try{E?.setForm?.(true);}catch(_){}player.egoSovereignR1046=true;
 const S=window.__STORYWORLD_EGO_SUMMON_R1157__;S.qaRandom(()=>.1);window.__ok=S.qaSummon();});
async function at(t){await p.evaluate(()=>{window.__k=1;});await p.waitForFunction(t=>{if(time>=t){window.__k=1e-4;return true;}return false;},t,{timeout:120000,polling:'raf'});await p.waitForTimeout(400);}
// 그림 읽힐 시간: 처음 소환은 버리고 다시
await p.waitForTimeout(12000);await p.evaluate(()=>{window.__k=1;});
const t0=await p.evaluate(()=>time);const res=[];
for(const dt of [.25,1.5]){await at(t0+dt);res.push({dt,cmds:await p.evaluate(()=>window.__last||[])});await p.screenshot({path:`${OUT}/${TAG}-summon-${dt}.png`,clip:{x:240,y:60,width:480,height:400}});}
console.log('SUMMON',JSON.stringify({ok:await p.evaluate(()=>window.__ok),res}));console.log('ERRORS',errs.length,errs.join(' | '));await b.close();
