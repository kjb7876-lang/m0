// R1383e 탐색: 보스방 문 자리와 뿌리 묶음 땅 자리(그리기 호출이 받은 값)를 같이 적는다.
import {chromium,boot,go} from '../r444/lib.mjs';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});
await go(p,'dist00');
await p.evaluate(()=>{const e=room.enemies.find(x=>x.nativeId==='dist00-boss');room.engaged=true;e.spawnState='active';e.hidden=false;e.x=player.x+4.5;e.y=player.y-2.5;for(const m of room.enemies)if(m!==e)m.hp=0;window.__boss=e;
 window.__rec=[];const X=window.__STORYWORLD_ROOT_BIND_R1383__;const base=drawAssetFrame3;drawAssetFrame3=function(path,fr,x,y,h,...r){if(path===X.sheet.path){const g=X.ground(x,y);window.__rec.push({x:+g.x.toFixed(2),y:+g.y.toFixed(2),wall:X.onWall(x,y)||X.behindDoor(x,y)});}return base.call(this,path,fr,x,y,h,...r);};});
const t0=await p.evaluate(()=>time);
await p.waitForFunction(a=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);player.hp=Math.max(player.hp,maxHP()*.9);const e=window.__boss;e.hp=Math.max(e.hp,e.maxHp*.8);return time>a+25&&window.__rec.length>200;},t0,{timeout:500000});
const out=await p.evaluate(()=>{const L=__STORYWORLD_EXPLORATION__?.layout?.(room.id)||room.exploration;const D=(room.worldR74?.doors||L?.worldR74?.doors||[]).map(d=>({id:d.id,x:d.x,y:d.y,open:d.open,axis:d.axis,w:d.width,o:d.orientation}));
 const seen={};for(const r of window.__rec){const k=Math.round(r.x)+','+Math.round(r.y)+(r.wall?'W':'');seen[k]=(seen[k]||0)+1;}
 return {skipped:window.__STORYWORLD_ROOT_BIND_R1383__.inspect().doors,doors:D,player:[player.x,player.y],cells:seen,doorKeys:Object.keys(room.worldR74?.doors?.[0]||{})};});
console.log(JSON.stringify(out));await b.close();
