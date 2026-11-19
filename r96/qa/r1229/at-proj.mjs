// R1229 탐침: 적 탄이 날아가는 화면 자리에 그려진 명령이 무엇인지(owner·종류·그림)
import {chromium,boot,go,skip} from '../r444/lib.mjs';
const [zone,re]=process.argv.slice(2);
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});
await p.evaluate(()=>{player.hero='hunter';});await go(p,zone);
await p.evaluate(re=>{const R=new RegExp(re);const keep=room.enemies.filter(e=>R.test(e.name||''));for(const e of room.enemies)if(!keep.includes(e))e.hp=0;const e=keep[0];player.x=e.x+4;player.y=e.y+1;room.engaged=true;for(const k of keep){k.spawnState='active';k.visible=true;k.hp=k.maxHp=1e8;}setInterval(()=>{try{player.hp=maxHP();player.invincible=99;}catch(_){}},300);},re);
const R=await p.evaluate(async()=>{const three=window.__STORYWORLD_PHASE1__.controller.state.three,base=three.render;const out=[];const t0=time;
 three.render=function(f){try{if(out.length<6){const pr=(projectiles||[]).find(x=>!x.friendly&&x.age>.1);if(pr){const q=project(pr.x,pr.y);const hit=[];for(const c of f.commands||[]){const P=c.points;let inside=false;if(P&&P.length){const xs=P.map(v=>v[0]),ys=P.map(v=>v[1]);inside=q.x>=Math.min(...xs)-30&&q.x<=Math.max(...xs)+30&&q.y>=Math.min(...ys)-60&&q.y<=Math.max(...ys)+30;}else if(c.bounds){inside=true;}
   if(inside&&c.owner?.kind!=='ground'&&c.owner?.kind!=='scene')hit.push([c.owner?.kind,String(c.owner?.id).slice(0,50),c.kind,String(c.sourcePath||'').split('/').slice(-2).join('/'),Object.keys(c).filter(k=>!['owner','style','points','image','clips'].includes(k)).join(',').slice(0,120)]);}
   out.push({pr:{type:pr.type,asset:String(pr.asset?.src||pr.asset||''),r116:!!pr.r116,keys:Object.keys(pr).join(',').slice(0,300)},q,hit:hit.slice(0,25)});}}}catch(e){out.push(String(e));}return base.apply(this,arguments);};
 await new Promise(r=>{const g=()=>{if(out.length>=6||time-t0>12)return r();setTimeout(g,200);};g();});three.render=base;return out;});
console.log(JSON.stringify(R.slice(0,3),null,0).slice(0,5000));await b.close();
