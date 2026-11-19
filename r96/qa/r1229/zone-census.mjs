// R1229 탐침: 지역 하나에서 이름이 맞는 적만 남기고 영웅 곁에서 싸우게 한 뒤, 적 탄·위험지대·효과 그리기를 owner|그림|종류로 센다
// node zone-census.mjs <zone> <이름 정규식> [초]
import {chromium,boot,go,skip} from '../r444/lib.mjs';
const [zone,re,secs='15']=process.argv.slice(2);
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});p.on('console',m=>{if(m.text().startsWith('SAMPLE'))console.log(m.text().slice(0,700));});
await p.evaluate(()=>{player.hero='hunter';});await go(p,zone);
const kept=await p.evaluate(re=>{const R=new RegExp(re);const keep=room.enemies.filter(e=>R.test(e.name||''));for(const e of room.enemies)if(!keep.includes(e))e.hp=0;
 const e=keep[0];if(!e)return [];player.x=e.x+3;player.y=e.y+1;room.engaged=true;for(const k of keep){k.spawnState='active';k.visible=true;k.disabled=false;k.hp=k.maxHp=1e8;}
 setInterval(()=>{try{player.hp=maxHP();player.invincible=99;if(modal&&!storyScene)closePanel(true);if(storyScene)advanceScene();}catch(_){}},300);return keep.map(k=>[k.name,k.ai,k.id]);},re);
console.log('kept',JSON.stringify(kept).slice(0,600));
const R=await p.evaluate(async secs=>{const three=window.__STORYWORLD_PHASE1__.controller.state.three,base=three.render;const own={};const t0=time;const pk={};
 three.render=function(f){const rr=base.apply(this,arguments);try{for(const pr of (typeof projectiles!=='undefined'?projectiles:[])){if(pr.friendly)continue;const k=[pr.type||'',String(pr.asset?.src||pr.asset||'').split('/').slice(-2).join('/')].join('|');pk[k]=(pk[k]||0)+1;}
  for(const c of f.commands||[]){const ok=c.owner?.kind;if(['hero','ground','scene','prop','objective'].includes(ok))continue;const id0=String(c.owner?.id||'');if(/contact/.test(ok+id0)&&!window.__smp){window.__smp=1;console.log('SAMPLE',ok,id0,c.kind,JSON.stringify(c.style),JSON.stringify(c.points||c.path||c.args||'').slice(0,300));}const id=id0.replace(/\d+(\.\d+)?/g,'#');if(/aura|passive-aura|shadow:|rank:|ego-|hero/.test(id))continue;if(ok==='enemy'&&(c.kind==='text'||/mobs\/|bosses\/|actors|float\//.test(String(c.sourcePath))))continue;const s=c.kind==='image'?String(c.sourcePath||'').replace(/^https?:\/\/[^/]+\/m0\//,'').slice(0,60):c.kind;const k=ok+'|'+id.slice(0,44)+'|'+s;own[k]=(own[k]||0)+1;}}catch(e){}return rr;};
 await new Promise(r=>{const g=()=>{if(time-t0>secs)return r();setTimeout(g,200);};g();});three.render=base;return {own,pk};},+secs);
console.log('PROJ',JSON.stringify(R.pk));
for(const [k,v] of Object.entries(R.own).sort((a,b)=>b[1]-a[1]).slice(0,45))console.log(v,k);
await b.close();
