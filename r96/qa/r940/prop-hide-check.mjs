// 사진 비교는 qa/r940/prop-hide-diff.py 로. R940 조형물 숨김이 화면에 실제로 닿는지(헤드리스): 조형물 종류별(엔진 dist00-prop·R80/R81 장면 조형물) 한 점씩 숨기고 그 자리 화면 조각이 바뀌는지 잰다.
import {chromium,boot,go} from '../r444/lib.mjs';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});await go(p,process.env.ZONE||'dist00');
await p.evaluate(()=>{window.__SLOW=1e-4;const tb=tick;tick=function(dt,...a){return tb.call(this,dt*window.__SLOW,...a);};for(const e of room.enemies)if(!e.boss){e.hp=0;e.dead=true;}});
const list=await p.evaluate(()=>window.__STORYWORLD_LAUREN_CELESTIAL_R940__.qaProps());
const kinds={};for(const v of list){const k=v.id.replace(/[:\-]?\d+$/,'').replace(/:dist00.*$/,'');if(!kinds[k])kinds[k]=v;}
let bad=0;const OUT=process.env.OUT||'.';
for(const [k,v] of Object.entries(kinds)){await p.evaluate(([x,y])=>{player.x=x-1.2;player.y=y+1.2;},[v.x,v.y]);await p.waitForTimeout(1500);
 const q=await p.evaluate(([x,y])=>{const q=project(x,y);const c=document.querySelector('canvas');const r=c.getBoundingClientRect();return {x:q.x*r.width/W+r.left,y:q.y*r.height/H+r.top};},[v.x,v.y]);
 const clip={x:Math.max(0,q.x-30),y:Math.max(0,q.y-70),width:60,height:70};const tag=k.replace(/[^a-z0-9]/gi,'_');const a=await p.screenshot({clip,path:OUT+'/ph-'+tag+'-a.png'});
 await p.evaluate(id=>{const a=room.props.find(v=>v.id===id);a.__v=a.visible;a.visible=false;},v.id);await p.waitForTimeout(1500);const bb=await p.screenshot({clip,path:OUT+'/ph-'+tag+'-b.png'});
 await p.evaluate(id=>{const a=room.props.find(v=>v.id===id);a.visible=a.__v;},v.id);
 console.log('SAVED',tag,v.id,v.path.split('/').pop());}
await b.close();process.exit(0);
