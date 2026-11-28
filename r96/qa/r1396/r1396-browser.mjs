// R1396 브라우저 확인: 사람 기본값(navigator.webdriver=false)으로 3D 키 하나를 끄고/켜고 지역에 들어가 몹마다 3D 로 그려지는지를 대조.
//  끔(기본) = 3D 0, 켬 = R1389 사용자 지정표(scope-decision.json)와 같음, 2D 지역 4곳은 켜도 0.
// 사용: SW_URL=http://127.0.0.1:4410/m0/ MODE=off|on node r96/qa/r1396/r1396-browser.mjs <out> zone ...
import {chromium,boot,go,skip} from '../r444/lib.mjs';import fs from 'node:fs';
const OUT=process.argv[2],ZONES=process.argv.slice(3);fs.mkdirSync(OUT,{recursive:true});
const dec=JSON.parse(fs.readFileSync(new URL('../r1389/scope-decision.json',import.meta.url)));const want={};for(const m of dec.mobs)for(const k of m.kinds)want[k]=m.decision;
const MODS=['__STORYWORLD_MOB3D_R1312__','__STORYWORLD_MOB3D_R1315__','__STORYWORLD_MOB3D_R1316__','__STORYWORLD_MOB3D_R1317__','__STORYWORLD_MOB3D_R1322__','__STORYWORLD_BOSS3D_R1322C__','__STORYWORLD_MOB3D_R1329__','__STORYWORLD_MOB3D_R1330__','__STORYWORLD_BALROG3D_R1338__','__STORYWORLD_MOB3D_R1343__','__STORYWORLD_MOB3D_R1382__'];
const TAG=k=>({MOB3D_R1312:'r1312',MOB3D_R1315:'r1315',BOSS3D_R1322C:'r1322c',BALROG3D_R1338:'r1338'}[k]||k.replace('MOB3D_R','r').toLowerCase());
let bad=0,checked=0;const rep={};
for(const z of ZONES){const b=await chromium.launch();try{
 const nc=b.newContext.bind(b);b.newContext=async o=>{const c=await nc(o);await c.addInitScript(()=>{Object.defineProperty(Navigator.prototype,'webdriver',{get:()=>false});});return c;};
 const {p}=await boot(b,{vp:{width:960,height:540},init:{'storyworld.r619.videopause':'{"on":false}','storyworld.r1036.entryvideo':'{"on":false}','storyworld.r309.opening':'{"on":false}','storyworld.r372.rootgate':'{"on":false}',...(process.env.MODE?{'storyworld.r1396.mob3d':process.env.MODE}:{})}});
 await go(p,z);await skip(p);
 await p.evaluate(()=>{player.hp=player.maxHp=1e9;player.invincible=1e9;const seen=new Map();for(const e of room.enemies){if(!(e.hp>0))continue;const id=String(e.nativeId||e.name);if(!seen.has(id))seen.set(id,e);}
  const R=[...seen.values()].slice(0,8);window.__R85=R;R.forEach((e,i)=>{e.spawnState='active';e.hidden=false;e.hp=e.maxHp=1e8;e.engaged=true;e.__a=i/R.length*Math.PI*2;});
  const ctl=()=>{for(const e of window.__R85){e.speed=0;e.attackCooldown=99;e.cooldown=99;e.attack=null;e.x=player.x+Math.cos(e.__a)*3;e.y=player.y+Math.sin(e.__a)*3;}requestAnimationFrame(ctl);};ctl();});
 for(let i=0;i<16;i++){await p.waitForTimeout(1500);await skip(p);}
 const r=await p.evaluate(M=>{const o={rule:window.__STORYWORLD_MOB3D_MASTER_R1396__?.inspect?.(),inst:{},kinds:{}};for(const k of M){const m=window[k];if(!m)continue;try{for(const it of m.inspect().instances||[])if(it.visible)(o.inst[k.replace(/__STORYWORLD_|__/g,'')]||(o.inst[k.replace(/__STORYWORLD_|__/g,'')]=new Set())).add(it.kind);}catch(_){}
   try{for(const e of window.__R85){const kk=m.kindOf?.(String(e.id));if(kk)(o.kinds[k.replace(/__STORYWORLD_|__/g,'')]||(o.kinds[k.replace(/__STORYWORLD_|__/g,'')]=new Set())).add(kk);}}catch(_){}}
  for(const k in o.inst)o.inst[k]=[...o.inst[k]];for(const k in o.kinds)o.kinds[k]=[...o.kinds[k]];return o;},MODS);
 await p.screenshot({path:`${OUT}/${z}.png`});
 const shown=new Set(Object.entries(r.inst).flatMap(([m,ks])=>ks.map(k=>TAG(m)+':'+k)));
 const seen=new Set(Object.entries(r.kinds).flatMap(([m,ks])=>ks.map(k=>TAG(m)+':'+k)));
 const lines=[];for(const k of seen){if(!(k in want))continue;checked++;const on=process.env.MODE==='on'&&!['u204','u205','last302','last303'].includes(z);const ok=on?(want[k]==='3d')===shown.has(k):!shown.has(k);if(!ok)bad++;lines.push(`${ok?'ok ':'BAD'} ${k} 판정 ${want[k]} 화면 ${shown.has(k)?'3d':'2d'}`);}
 rep[z]={rule:r.rule,lines};console.log(z,JSON.stringify(r.rule));for(const l of lines)console.log('  '+l);
}catch(e){console.log('ERR',z,String(e).slice(0,200));bad++;}finally{await b.close();}}
fs.writeFileSync(OUT+'/report.json',JSON.stringify(rep,null,1));console.log(bad?`R1396 BROWSER FAIL ${bad}/${checked}`:`R1396 BROWSER OK ${checked}`);process.exit(bad?1:0);
