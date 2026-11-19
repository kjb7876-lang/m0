// 지역 정의 roster 로 actor3 를 새로 만든 몹(= 보스 소환이 만드는 몹)과, 방을 만들 때 덧씌우기가 바꿔 둔 같은 종류 일반 몹의 차이 전수
import {chromium,boot,go} from '../r444/lib.mjs';import fs from 'node:fs';
const out=process.argv[2];const b=await chromium.launch();const {p}=await boot(b,{vp:{width:480,height:270},init:{'storyworld.r790.npc':'{"on":false}'}});
const zones=await p.evaluate(()=>Object.values(regions).map(r=>r.id).filter(id=>!/^sz(115|162|173)/.test(id)));const res={};
for(const z of zones){try{await go(p,z);}catch(err){res[z]={err:String(err).slice(0,80)};continue;}
 res[z]=await p.evaluate(()=>{const def=regionById[room.id];const roster=def.roster||[];const mobs=room.enemies.filter(e=>!(e.boss||e.midboss)&&!e.r61Summoned);
  const strip=n=>String(n||'').replace(/^중간보스\s*·\s*/,'').replace(/\s*(우두머리|증원|추격대|후속 증원|후속)$/,'').replace(/\s*\d+$/,'').trim();
  const out=[];for(const pr of roster){let f=null;try{f=actor3(pr,room.id+':r61-summon:probe',player.x,player.y,false,room.layer,def,false);}catch(err){out.push({pid:pr.id,err:String(err).slice(0,80)});continue;}
   const same=mobs.filter(m=>m.profile?.id===pr.id);const names=[...new Set(same.map(m=>strip(m.name)))];
   const flags=k=>Object.keys(k).filter(x=>/^r\d+/.test(x)&&!/^r(61|74|75|81)/.test(x)).sort().join(',');
   out.push({pid:pr.id,fresh:strip(f.name),freshPath:f.path,room:names,roomPaths:[...new Set(same.map(m=>m.path))].slice(0,3),n:same.length,freshFlags:flags(f),roomFlags:[...new Set(same.map(flags))].slice(0,2)});}
  const rosterIds=new Set(roster.map(r=>r.id));const extra=[...new Set(mobs.filter(m=>!rosterIds.has(m.profile?.id)).map(m=>(m.profile?.id||'?')+'|'+strip(m.name)))];
  return {rows:out,extra};});
 console.log(z,res[z].rows.filter(r=>r.room&&r.room.length&&!(r.room.length===1&&r.room[0]===r.fresh)||r.n===0).map(r=>r.pid+':'+r.fresh+'→'+(r.room||[]).join('/')).join(' | '));}
fs.writeFileSync(out,JSON.stringify(res));await b.close();
