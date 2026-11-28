// R1385 심사용 장면: 지역마다 몹을 한 줄(같은 발 줄)로 세우고 규칙 끔(지금)·켬(바뀐 뒤)을 같은 카메라로 찍는다. 배경 장면(몹 치움)도 찍어 몸 영역을 차분으로 잰다.
// 사용: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r1385/r1385-shots.mjs <out> zone ...
import {chromium,boot,go,skip} from '../r444/lib.mjs';import fs from 'node:fs';
const sk=async p=>{await skip(p);try{const l=p.locator('text=건너뛰기');for(let i=0;i<4&&await l.count();i++){await l.first().click({timeout:1500});await p.waitForTimeout(300);}}catch(_){}await skip(p);};
const OUT=process.argv[2],ZONES=process.argv.slice(3);fs.mkdirSync(OUT,{recursive:true});
const dec=JSON.parse(fs.readFileSync(new URL('./decision.json',import.meta.url)));
const names=new Map();for(const m of dec.mobs)for(const n of m.names||[])names.set(n,m);
const meta={};
for(const z of ZONES)for(const mode of ['off','on']){const b=await chromium.launch();try{
 const nc=b.newContext.bind(b);b.newContext=async o=>{const c=await nc(o);await c.addInitScript(()=>{Object.defineProperty(Navigator.prototype,'webdriver',{get:()=>false});});return c;};
 const {p}=await boot(b,{vp:{width:1280,height:720},init:{'storyworld.r619.videopause':'{"on":false}','storyworld.r1036.entryvideo':'{"on":false}','storyworld.r309.opening':'{"on":false}','storyworld.r372.rootgate':'{"on":false}','storyworld.r1385.dimrule':mode}});
 await go(p,z);await sk(p);
 const got=await p.evaluate(NM=>{player.hp=player.maxHp=1e9;player.invincible=1e9;const seen=new Map();
  for(const e of room.enemies){if(!(e.hp>0))continue;const id=String(e.name||e.nativeId);if(!seen.has(id))seen.set(id,e);}
  let R=[...seen.values()].sort((a,b)=>(NM.includes(b.name)?1:0)-(NM.includes(a.name)?1:0)).slice(0,6);
  for(const e of room.enemies)if(!R.includes(e)){e.x=player.x+400;e.y=player.y+400;e.speed=0;}
  window.__R85=R;const n=R.length;R.forEach((e,i)=>{e.spawnState='active';e.hidden=false;e.hp=e.maxHp=1e8;e.engaged=true;e.__dx=(i-(n-1)/2)*1.7;});
  window.__R85away=false;window.__SLOW=1;const tb=tick;tick=function(dt,...a){const r=tb.call(this,dt*window.__SLOW,...a);for(const e of window.__R85){e.speed=0;e.attackCooldown=99;e.cooldown=99;e.attack=null;e.x=player.x+e.__dx+1.3;e.y=player.y-e.__dx+1.3+(window.__R85away?300:0);}return r;};
  for(const k of ['projectiles','enemyProjectiles','effects','particles','hazards','floatTexts','damageTexts'])try{const v=eval(k);if(Array.isArray(v))v.length=0;}catch(_){}
  window.__SLOW=0.05;
  return R.map(e=>({name:e.name,boss:!!e.boss}));},[...names.keys()]);
 for(let i=0;i<14;i++){await p.waitForTimeout(1500);await sk(p);}
 const ms=await p.evaluate(()=>{const M=Object.keys(window).filter(k=>/^__STORYWORLD_(MOB3D|BOSS3D|BALROG3D)_R13/.test(k));return window.__R85.map(e=>{for(const k of M){try{const ids=new Set((window[k].inspect?.().instances||[]).map(i=>String(i.id)));let id=null;for(const v of Object.values(e)){if((typeof v==='string'||typeof v==='number')&&ids.has(String(v))){id=String(v);break;}}if(id==null)continue;const r=window[k].measure?.(id);if(r&&r.count)return {mod:k,h:Math.round(r.h),target:r.target!=null?Math.round(r.target):null,kind:r.kind};}catch(_){}}return null;});});
 await p.screenshot({path:`${OUT}/${z}-${mode}.png`});
 if(mode==='off'){await p.evaluate(()=>{window.__R85away=true;});for(let i=0;i<5;i++){await p.waitForTimeout(1500);await sk(p);}await p.screenshot({path:`${OUT}/${z}-bg.png`});}
 meta[z]=meta[z]||got.map(g=>({...g}));got.forEach((g,i)=>{meta[z][i]['m3d_'+mode]=ms[i];});console.log(z,mode,got.map(g=>g.name).join(' | '));
}catch(e){console.log('ERR',z,mode,String(e).slice(0,200));}finally{await b.close();}
 fs.writeFileSync(OUT+'/meta.json',JSON.stringify(meta,null,1));}
