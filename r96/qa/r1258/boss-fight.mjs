// R1258 헤드리스 보스전 실측: node boss-fight.mjs <지역 ep1b02|ep1b03> <영웅 gunner|ego|…> <게임초>. 필드 정리 → 보스 문 → 보스방(R78 흐름) 뒤 공격 키를 누르며 적중·소환 몹 그림·투척 기록, 투척 장면 찍기.
import fs from 'node:fs';
import {chromium,boot,go,skip} from '../r444/lib.mjs';
const Z=process.argv[2]||'ep1b02',HERO=process.argv[3]||'gunner',DUR=+(process.argv[4]||40);
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540},init:{'storyworld.r790.npc':'{"on":false}'}});
await go(p,Z);await p.waitForTimeout(1500);await skip(p);
await p.evaluate(({HERO})=>{window.__KEEP=1;
 const AM=window.__AM=new WeakMap();const FX=/r251\/atlas|pixelfx|\/fx[\/-]|effect|vfx|\bring\b|circle|sigil|shadow|aura|blood|flame|r572|r571|dissol|burn|smoke|\bash\b|ink-bleed|r106fx/i;
 const de=drawEnemy;drawEnemy=function(e,...a){const c=ctx,st0=Array.isArray(c?.commands)?c.commands.length:-1;const r=de.call(this,e,...a);if(e)e.__ld=time;if(st0>=0&&e)AM.set(e,c.commands.slice(st0).filter(k=>k?.kind==='image'&&Array.isArray(k.points)&&k.points.length>=4));return r;};
 window.__drawOf=e=>{const R=AM.get(e);if(!R)return null;let best=null,ba=0;for(const k of R){const s=String(k.sourcePath||k.image?.src||'').replace(/^.*\/m0\//,'');if(FX.test(s))continue;const P=k.points,ar=Math.abs((P[1][0]-P[0][0])*(P[3][1]-P[0][1]));if(ar>ba){ba=ar;best=s;}}return best;};
 window.__base=new Set(room.enemies);window.__seen=new Map();
 window.__hits=[];const he=hitEnemy;hitEnemy=function(e,v){const r=he.apply(this,arguments);try{if(r!==false)__hits.push({n:e.name,id:e.id,ld:+(time-(e.__ld??-99)).toFixed(2),drawn:!!__AM.get(e),vis:typeof isVisibleEnemy==="function"?null:null,x:+e.x,y:+e.y,ss:e.spawnState,hidden:!!e.hidden,boss:!!e.boss,st:(new Error().stack||'').split('\n').slice(2,5).map(s=>s.trim().replace(/https?:\/\/[^/]+\/m0\//,'').slice(0,80)).join('|')});}catch(_){}return r};
 window.__fx=[];const of=fx;fx=function(t,x,y,o){try{if(t!=='text'&&t!=='bloodR52')__fx.push({t,x:+x,y:+y,a:String(o&&o.asset||'').slice(-30),st:(new Error().stack||'').split('\n').slice(2,4).map(s=>s.trim().replace(/https?:\/\/[^/]+\/m0\//,'').slice(0,80)).join('|')});}catch(_){}return of.apply(this,arguments)};
 if(HERO==='ego'){player.hero='hwando';try{const G=window.__STORYWORLD_EGO_SOVEREIGN_R1046__;G.unlock('t');G.setForm(true);}catch(_){} }else player.hero=HERO;const B=room.enemies.find(e=>e.boss);window.__B=B;
 if(!window.__KEEP)for(const e of room.enemies)if(!(e.boss||e.midboss)){e.x=-999;e.y=-999;e.speed=0;e.hidden=true;}
 player.hp=9e8;player.maxHp=9e8;player.invincible=1e9;
},{HERO});
await p.evaluate(()=>{for(let k=0;k<20;k++){const r=room.enemies.filter(e=>e.hp>0&&!e.deadRecorded&&!e.boss&&!e.midboss);if(!r.length)break;for(const e of r){e.hp=0;killEnemy(e);}for(let i=0;i<30;i++)tick(.05);}player.x=room.objective.x+.5;player.y=room.objective.y+.5;interact();});await skip(p);
await p.evaluate(()=>{for(let i=0;i<40;i++)tick(.05);});await skip(p);
await p.evaluate(()=>{for(const e of room.enemies.filter(e=>(e.midboss)&&e.hp>0&&e.spawnState==='active')){e.hp=0;killEnemy(e);}for(let i=0;i<60;i++)tick(.05);});await skip(p);
console.log('stage',await p.evaluate(()=>[room.encounterStage,room.enemies.filter(e=>e.hp>0).map(e=>e.name+':'+e.spawnState).join(',')]));
await p.evaluate(()=>{const X=room.exploration,d=(X.worldR74?.doors||[]).find(d=>d.id===X.bossDoorId);window.__dd=d&&[d.id,d.x,d.y];if(d){player.x=d.x+.6;player.y=d.y+.6;interact();}});await skip(p);await p.waitForTimeout(500);await skip(p);
await p.evaluate(()=>{const X=room.exploration;const b=X.bossBounds||X.worldR74?.bossBounds;window.__bb=b;if(b){player.x=(b[0]+b[2])/2;player.y=(b[1]+b[3])/2;}for(let i=0;i<10;i++)tick(.05);window.__sum=[room.encounterStage,JSON.stringify(window.__STORYWORLD_WORLD_COMBAT_R78__.state()?.phase)];window.__base=new Set(room.enemies.filter(e=>!e.boss));});await skip(p);
console.log('stage2',await p.evaluate(()=>[room.encounterStage,room.engaged,__B.spawnState,__B.x,__B.y,window.__sum,window.__dd,window.__bb]));
const keys=['j','s','d','q','f'];let n=0;
const t0=await p.evaluate(()=>time);let last=t0;
while(true){const t=await p.evaluate(()=>{try{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);}catch(_){}
  player.hp=9e8;const B=window.__B;if(B.hp<B.maxHp*.3)B.hp=B.maxHp*.8;if(Math.hypot(player.x-B.x,player.y-B.y)>6){player.x=B.x-3;player.y=B.y+.4;}
  for(const x of room.enemies)if(!__base.has(x)&&x.hp>0&&!__seen.get(x)?.art)__seen.set(x,{n:x.name,nid:x.nativeId,path:String(x.path),art:__drawOf(x),r61:x.r61Summoned?.kind||x.r61Summoned||null,x:x.x,y:x.y});
  return time;});
 if(t>t0+DUR)break;await p.keyboard.press(n%6===0?keys[(n/6|0)%keys.length]:'j');n++;
 {const fl=await p.evaluate(()=>(window.__STORYWORLD_SLOTH_THROW_R1258__?.inspect().flying||[]).map(f=>f.key+':'+f.u.toFixed(2)+':'+(f.landed?1:0)).join(','));const m=fl.match(/(heap|fridge|sofa|bed):0\.[3-7]\d:0/);if(m&&!globalThis['_s'+m[1]]){globalThis['_s'+m[1]]=1;await p.screenshot({path:`shot9-${Z}-${m[1]}.png`});}if(/:1(,|$)/.test(fl)&&!globalThis._land){globalThis._land=1;await p.screenshot({path:`shot9-${Z}-land.png`});}if(n%80===79)await p.screenshot({path:`shot9-${Z}-${HERO}-a${n}.png`});}await p.waitForTimeout(150);}
await p.screenshot({path:`shot-${Z}-${HERO}-b.png`});
const r=await p.evaluate(()=>({B:{x:__B.x,y:__B.y,hp:__B.hp},pl:[player.x,player.y],hits:__hits,fx:__fx,seen:[...__seen.values()],thr:window.__STORYWORLD_CANON_THROW_R471__?.inspect().stats,sf:window.__STORYWORLD_SUMMON_FOLLOW_R1224__?.inspect(),st:window.__STORYWORLD_SLOTH_THROW_R1258__?.inspect(),sum:room.enemies.filter(e=>e.r61Summoned).slice(0,6).map(e=>({n:e.name,pid:e.profile?.id,f:e.r1224Follow,sm:e.r61Summoned}))}));
fs.writeFileSync(`p9-${Z}-${HERO}.json`,JSON.stringify(r,null,1));
console.log('hits',r.hits.length,'fx',r.fx.length,'new',r.seen.length,'thr',JSON.stringify(r.thr));await b.close();
