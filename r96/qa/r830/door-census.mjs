// R830 지역별 문 장면 찍기(Dots 참고·적용 전후 비교). SW_URL 로 대상 사이트, ZONES 로 지역 목록(쉼표).
import {chromium,boot,go,skip} from '../r444/lib.mjs';import fs from 'node:fs';
const OUT=process.env.OUT||'/tmp/r830-doors';fs.mkdirSync(OUT,{recursive:true});
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});
const zones=(process.env.ZONES||'').split(',').filter(Boolean);const rows=[];
if(process.env.READY)await p.evaluate(r=>{for(const f of r.split(','))window.__STORYWORLD_DOOR_THEME_R830__?.READY.add(f);},process.env.READY);
for(const z of zones){try{await go(p,z);
 const info=await p.evaluate(()=>{const L=room.exploration,ds=(room.props||[]).filter(q=>q.r74Door);const d=ds.find(q=>q.r74Door.id==='door-1')||ds[0];if(!d)return{zone:room.id,style:L?.worldR74?.style,doors:0};
  const D=d.r74Door,ax=D.axis==='x',off=(ax?D.width:D.depth)/2+2.2;const cand=[[D.x+(ax?off:0),D.y+(ax?0:off)],[D.x-(ax?off:0),D.y-(ax?0:off)]];
  let at=cand.find(([x,y])=>!window.StoryPhase1?.explorationBlocked?.(L,x,y,.35))||cand[0];player.x=at[0];player.y=at[1];cam={x:(D.x+at[0])/2,y:(D.y+at[1])/2};for(const e of room.enemies||[])if(Math.hypot(e.x-D.x,e.y-D.y)<9)e.spawnState='hidden';
  return{zone:room.id,style:L?.worldR74?.style,mode:L?.worldR74?.mode,doors:ds.length,door:D.id,axis:D.axis,w:+(ax?D.depth:D.width).toFixed(2),wallArt:L.surface?.art?.path,fit:window.__STORYWORLD_WORLD_DOORS_R83__?.geometry?.(D,false)?.fit};});
 await p.waitForTimeout(2500);await skip(p);await p.screenshot({path:`${OUT}/${z}${process.env.TAG?'-'+process.env.TAG:''}.png`});rows.push(info);console.log(JSON.stringify(info));}catch(e){console.log(JSON.stringify({zone:z,error:String(e).slice(0,160)}));}}
fs.writeFileSync(OUT+'/doors.json',JSON.stringify(rows,null,1));await b.close();
