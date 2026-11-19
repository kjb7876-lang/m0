// R1229 탐침: 지역 들어간 직후 헌터 걷기 몸 그림이 나오는지(게임 시간 기준 기록)
import {chromium,boot,go,skip} from '../r444/lib.mjs';import fs from 'node:fs';
const out=process.argv[2]||'/tmp/r1229';const zone=process.argv[3]||'dist06';fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});
console.log('hero after boot',await p.evaluate(()=>player.hero));
await p.evaluate(()=>{player.hero='hunter';});
await p.evaluate(z=>{enterRegion(z,null,{layer:'STORY',restore:true});},zone);
await p.waitForFunction(z=>!loading&&room?.id===z,zone,{timeout:150000});await skip(p);
const rec=await p.evaluate(async()=>{const three=window.__STORYWORLD_PHASE1__.controller.state.three,base=three.render;const R=[];
 three.render=function(f){try{const c=(f.commands||[]).filter(c=>c.owner?.kind==='hero'&&c.kind==='image');R.push({t:+time.toFixed(2),mv:Math.hypot(player.vx||0,player.vy||0).toFixed(2),x:+player.x.toFixed(2),img:c.map(c=>String(c.image?.src||c.image?.__src||c.src||c.path||'?').split('/').slice(-3).join('/')+'|'+(c.sx??'')+','+(c.sy??'')).slice(0,3)});}catch(e){R.push(String(e));}return base.apply(this,arguments);};
 keys.add('ArrowRight');const t0=time;await new Promise(r=>{const g=()=>{if(time-t0>2.5)return r();setTimeout(g,50);};g();});keys.delete('ArrowRight');three.render=base;return R;});
fs.writeFileSync(out+'/hero-'+zone+'.json',JSON.stringify(rec));
const imgs={};for(const r of rec)for(const s of r.img||[]){const k=s.split('|')[0];imgs[k]=(imgs[k]||0)+1;}
console.log(JSON.stringify(imgs));console.log(JSON.stringify(rec.slice(0,3)));console.log(JSON.stringify(rec.slice(-2)));
await b.close();
