// R972 브라우저 검사(헤드리스, 소프트웨어 렌더): 영웅마다 분류된 스킬을 R972 켜고/끄고 같은 배치로 써서
// ① 나눈 피해가 빠짐없이 들어갔는지(받은 양 = 넣은 양, 켜고/끈 총피해 비는 참고로만 — 같은 씨앗이어도 시전 상태가 달라 ±40% 흔들림) ② 켰을 때 r972 틱·연타가 실제로 들어가는지 ③ 틱 소리 호출 수 ④ 오류 0 을 본다.
import {chromium,boot,go} from '../r444/lib.mjs';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360},init:{'storyworld.r663.skillgrowth':'{"on":false}'}});
await go(p,process.env.ZONE||'dist00');
let fail=0;const ok=(n,c)=>{console.log(c?'PASS':'FAIL',n);if(!c)fail++;};
const A='window.__STORYWORLD_SKILL_STYLE_R972__';
ok('module loaded',await p.evaluate(A+'?.revision==="R972"'));
await p.evaluate(()=>{window.__snd={};const sb=sound;sound=function(k,...a){if(/^r972_/.test(k))window.__snd[k]=(window.__snd[k]||0)+1;return sb.call(this,k,...a);};
 window.__src={};const hb=hitEnemy;hitEnemy=function(e,v,s,...a){const r=hb.call(this,e,v,s,...a);return r;};});
const CASES=[['hwando','q'],['hwando','w'],['seoha','q'],['seoha','r'],['neon','q'],['neon','r'],['michaela','q'],['michaela','r'],['lauren','q'],['hunter','q'],['hunter','w'],['slayer','q'],['slayer','r'],['hwando','e'],['lauren','r']];
const rows=[];
for(const [h,k] of CASES){const res={};
 for(const mode of ['off','on']){
  const r=await p.evaluate(async([h,k,mode,A])=>{const api=eval(A);api.set(mode==='on');let sd=12345;Math.random=()=>{sd|=0;sd=sd+0x6D2B79F5|0;let t=Math.imul(sd^sd>>>15,1|sd);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};api.qaReset();window.__snd={};
   await ensureImages(heroPaths(h));player.hero=h;player.hp=player.maxHp=99999;player.x=15;player.y=15;player.samong=0;player.ego=0;
   const live=room.enemies.filter(e=>!e.boss).slice(0,8);room.enemies.filter(e=>!live.includes(e)).forEach(e=>{e.hp=0;e.dead=true;});
   live.forEach((e,i)=>{const a=i*.6-1.8,rr=1.6+(i%3)*.5;e.x=player.x+Math.cos(a)*rr;e.y=player.y+Math.sin(a)*rr;e.dead=false;e.deadRecorded=false;e.spawnState='active';e.hp=e.maxHp=99999;e.damage=0;e.speed=0;e.moveSpeed=0;e.flash=0;});
   room.engaged=true;player.specialCD=0;if(player.storyWER)player.storyWER.ready={};window.__ids=live.map(e=>e.id);target=live[0].id;
   if(k==='q')special();else window.__STORYWORLD_WER__.cast(k);return time;},[h,k,mode,A]);
  await p.waitForFunction(t0=>time-t0>=4,r,{timeout:240000});
  res[mode]=await p.evaluate(A=>{const api=eval(A),i=api.inspect();const lost=window.__ids.map(id=>99999-room.enemies.find(v=>v.id===id).hp);return {total:lost.reduce((a,b)=>a+b,0),stats:i.stats,snd:{...window.__snd},pending:i.pending};},A);
 }
 rows.push([h,k,res]);const st=res.on.stats,ratio=res.off.total?res.on.total/res.off.total:NaN;
 const expect=(window=>({}))();const styled=!(h==='hwando'&&k==='e')&&!(h==='lauren'&&k==='r');
 console.log(`  ${h} ${k}: off ${Math.round(res.off.total)} on ${Math.round(res.on.total)} ratio ${ratio.toFixed(3)} split ${st.split} ticks ${st.ticks} follow ${st.follow} lethal ${st.lethal} sounds ${JSON.stringify(res.on.snd)} errors ${st.errors}`);
 if(styled){ok(`${h} ${k}: split happened`,st.split>0&&(st.ticks+st.follow)>0);ok(`${h} ${k}: split damage conserved in game (delivered/received ${(st.delivered/st.received).toFixed(4)})`,st.received>0&&Math.abs(st.delivered/st.received-1)<=.01);}
 else ok(`${h} ${k}: unchanged (no split)`,st.split===0);
 ok(`${h} ${k}: no errors, queue drained`,st.errors===0&&res.on.pending===0);
}
await p.evaluate(A=>eval(A).set(true),A);
import fs from 'node:fs';fs.writeFileSync(new URL('./r972-browser-results.json',import.meta.url),JSON.stringify(rows,null,1));
await b.close();process.exit(fail?1:0);
