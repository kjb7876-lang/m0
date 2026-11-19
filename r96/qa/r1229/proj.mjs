// R1229 탐침: 발록·검은기둥 근접 전투 중 적 탄(projectiles)·위험지대(hazards) 종류와 그 그림(owner별 그림/도형)
import {chromium,boot,go,skip} from '../r444/lib.mjs';import fs from 'node:fs';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});
await p.evaluate(()=>{player.hero='hunter';});await go(p,'dist06');
await p.evaluate(()=>{for(const e of room.enemies)if(!e.boss&&!e.midboss)e.hp=0;const B=room.enemies.find(e=>e.boss),M=room.enemies.find(e=>e.midboss);player.x=B.x+2.5;player.y=B.y+1.5;room.engaged=true;for(const e of [B,M]){e.spawnState='active';e.visible=true;e.disabled=false;e.hp=e.maxHp=1e8;}
 setInterval(()=>{try{player.hp=maxHP();player.invincible=99;if(modal&&!storyScene)closePanel(true);if(storyScene)advanceScene();}catch(_){}},300);});
const R=await p.evaluate(async()=>{const three=window.__STORYWORLD_PHASE1__.controller.state.three,base=three.render;const own={},pk={},hk={};const t0=time;
 three.render=function(f){try{for(const pr of (typeof projectiles!=='undefined'?projectiles:[])){if(pr.friendly||pr.fromPlayer||pr.owner==='player')continue;const k=[pr.type,pr.kind,pr.asset||pr.sprite||pr.image||'',pr.color||''].join('|');pk[k]=(pk[k]||0)+1;}
  for(const h of (typeof hazards!=='undefined'?hazards:[])){const k=[h.type,h.kind||'',Object.keys(h).filter(x=>/^r\d+/.test(x)).join(',')].join('|');hk[k]=(hk[k]||0)+1;}
  for(const c of f.commands||[]){const ok=c.owner?.kind;if(ok==='hero'||ok==='ground'||ok==='scene'||ok==='prop')continue;const id=String(c.owner?.id||'').replace(/\d+(\.\d+)?/g,'#');const s=c.kind==='image'?String(c.sourcePath||'').replace(/\d{3,}/g,'#').split('/').slice(-1)[0].slice(0,40):c.kind;const k=ok+'|'+id.slice(0,40)+'|'+s;own[k]=(own[k]||0)+1;}}catch(e){}return base.apply(this,arguments);};
 await new Promise(r=>{const g=()=>{if(time-t0>25)return r();setTimeout(g,200);};g();});three.render=base;return {own,pk,hk};});
const top=(o,n=70)=>Object.entries(o).sort((a,b)=>b[1]-a[1]).slice(0,n);
console.log('PROJ',JSON.stringify(top(R.pk)));console.log('HAZ',JSON.stringify(top(R.hk)));
for(const [k,v] of top(R.own,120))if(!/r106fx:(petal|slashline)|aura|passive-aura|shadow:dist06-prop/.test(k))console.log(v,k);
await b.close();
