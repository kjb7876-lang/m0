// 지도 자료 뽑기: 지역마다 바닥 칸·입구·목표·문·제단을 json 으로. node dump.mjs story|samong [키…]
import fs from 'node:fs';import {chromium,boot,go,skip} from '../r444/lib.mjs';
const mode=process.argv[2]||'story';const only=process.argv.slice(3);
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:480,height:270}});
const grab=()=>p.evaluate(()=>{const L=room.exploration||{};const pt=o=>o&&Number.isFinite(o.x)?{x:+o.x.toFixed(2),y:+o.y.toFixed(2)}:null;
 return {id:room.id,layer:room.layer,zone:room.samongR103?.zone||null,samong:!!room.samongR103,cells:(L.floorCells||[]).map(c=>c[0]+','+c[1]).join(' '),entry:pt(L.entry),objective:pt(room.objective),altar:pt(room.altar),
  doors:(L.worldR74?.doors||[]).map(pt).filter(Boolean),nodes:(L.nodes||[]).map(n=>({id:n.id,x:n.x,y:n.y,w:n.width,d:n.depth,name:n.name,k:n.storyMapR171||n.kind||null,box:n.box||null,boss:!!n.bossCoreR78,closet:!!n.closetR179})),edges:(L.edges||[]).map(e=>Array.isArray(e)?e:[e.from??e.a,e.to??e.b]),props:(room.props||[]).filter(q=>q.solid).length};});
const out={};const file=`layouts-${mode}.json`;
if(mode==='story'){const ids=only.length?only:await p.evaluate(()=>Object.keys(regionById).filter(i=>!regionById[i].safe));
 for(const id of ids){try{await go(p,id);out[id]=await grab();fs.writeFileSync(file,JSON.stringify(out));console.log(id,out[id].cells.split(' ').length);}catch(e){console.log(id,'ERR',String(e).slice(0,100));}}}
else{const keys=only.length?only:await p.evaluate(()=>window.__STORYWORLD_CHEAT777__.samongSections().map(s=>s.key));
 for(const k of keys){try{await p.evaluate(k=>window.__STORYWORLD_CHEAT777__.goSection(k),k);await p.waitForFunction(()=>!loading&&room?.samongR103,null,{timeout:120000});await skip(p);
   const g=await grab();out[k]=g;fs.writeFileSync(file,JSON.stringify(out));console.log(k,g.zone,g.cells.split(' ').length);}catch(e){console.log(k,'ERR',String(e).slice(0,120));}}}
fs.writeFileSync(file,JSON.stringify(out));await b.close();
