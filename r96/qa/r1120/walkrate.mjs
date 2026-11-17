import {chromium,boot} from '../r444/lib.mjs';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360}});
const A='__STORYWORLD_PERSONA_HERO_R1113__';
await p.evaluate(async A=>{await ensureImages(heroPaths('lauren'));player.hero='lauren';window[A].unlock('silent');},A);
await p.evaluate(()=>{const T=__STORYWORLD_PHASE1__.controller.state.three;const O=T.render;window.__log=[];T.render=function(f){const R=O.apply(this,arguments);try{const h=f.commands.filter(c=>c&&c.kind==='image'&&c.owner?.kind==='hero').sort((a,b)=>Math.abs(b.points[3][1]-b.points[0][1])-Math.abs(a.points[3][1]-a.points[0][1]))[0];if(h)window.__log.push([time,String(h.sourcePath).slice(-40)+'@'+(h.sourceRect||[]).join(','),player.x,player.y]);}catch(e){}return R;};});
const out={};
for(const form of [false,true]){await p.evaluate(([A,f])=>window[A].setForm(f),[A,form]);await p.waitForTimeout(800);await p.evaluate(()=>{window.__log=[];});
 await p.keyboard.down('ArrowRight');await p.waitForTimeout(6000);await p.keyboard.up('ArrowRight');await p.keyboard.down('ArrowLeft');await p.waitForTimeout(6000);await p.keyboard.up('ArrowLeft');
 const L=await p.evaluate(()=>window.__log);let ch=0,prev=null,t0=null,t1=null,d=0,pp=null;for(const [t,k,x,y] of L){if(/walk/.test(k)){if(t0==null)t0=t;t1=t;if(prev!=null&&k!==prev)ch++;prev=k;if(pp)d+=Math.hypot(x-pp[0],y-pp[1]);pp=[x,y];}else{prev=null;pp=null;}}
 out[form?'persona':'lauren']={frameChanges:ch,gameSec:+(t1-t0).toFixed(2),fps:+(ch/(t1-t0)).toFixed(2),dist:+d.toFixed(2),speed:+(d/(t1-t0)).toFixed(2),renders:L.length,sample:L.slice(5,9).map(r=>r[1])};}
console.log(JSON.stringify(out,null,1));await b.close();
