// R955/R954 실제 이름 전수(헤드리스): 모든 지역에 들어가 room.enemies 의 실제 이름(R385 등 런타임 이름 바꾸기 뒤)을 모아
// 일반 몹인데 R955·R954 어느 계열에도 안 잡히는 이름을 찾는다. 사용: node r955-name-sweep.mjs [out.json]
import {chromium,boot,go} from '../r444/lib.mjs';import fs from 'node:fs';
const out=process.argv[2]||'name-sweep.json';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360}});
const ids=await p.evaluate(()=>Object.keys(regionById).filter(k=>!/mammon/i.test(k)));
console.log('zones',ids.length);const rows={};let i=0;
for(const z of ids){i++;try{await go(p,z);await p.evaluate(()=>new Promise(r=>setTimeout(r,2500)));
  const got=await p.evaluate(()=>{const A=window.__STORYWORLD_SFX_R955__,B=window.__STORYWORLD_SFX_R954__,M=window.__STORYWORLD_SFX_R789__,S=window.__STORYWORLD_SFX_R788__;
   return (room.enemies||[]).map(e=>({n:e.name,boss:!!e.boss,mid:!!e.midboss,sum:!!e.summon,ally:!!e.ally,hero:!!e.hero,r955:A?.slugFor(e)||null,r954:B?.slugFor(e)||null,r789:M?.slugOf?.(e.name)||null,r788:S?.slugOf?.(e.name)||null}));});
  for(const g of got){const k=g.n+'|'+g.boss+g.mid+g.sum+g.ally;(rows[k]??={...g,zones:[]}).zones.includes(z)||rows[k].zones.push(z);}
  if(i%10===0)console.log(i,z,Object.keys(rows).length);}catch(e){console.log('ERR',z,String(e).slice(0,120));}}
const list=Object.values(rows);fs.writeFileSync(out,JSON.stringify(list,null,1));
const miss=list.filter(r=>!r.boss&&!r.mid&&!r.sum&&!r.ally&&!r.hero&&!r.r955&&!r.r954);
console.log('names',list.length,'regular-missing',miss.length);for(const m of miss)console.log('MISS',m.n,m.zones.join(','));
const bm=list.filter(r=>r.boss&&!r.r788&&!r.r954);for(const m of bm)console.log('BOSS-MISS',m.n,m.zones.join(','));
const mm=list.filter(r=>r.mid&&!r.boss&&!r.r789&&!r.r954);for(const m of mm)console.log('MID-MISS',m.n,m.zones.join(','));
await b.close();
