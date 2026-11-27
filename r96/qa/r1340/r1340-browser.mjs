// R1340 헤드리스(그래픽·GPU 검증 아님): 실제 게임에서 근접 몹이 영웅을 칠 때 무엇이 재생되는지 R1340 끔/켬으로 잰다.
//  지역마다 일반 근접 몹 5마리를 영웅 1.2칸 둘레에 두고(영웅 체력 무한·제자리) 게임 시간 SECS 초.
//  사용: SW_URL=http://127.0.0.1:4411/m0/ [SECS=10] [ZONES=dist01,ep1b05] node r96/qa/r1340/r1340-browser.mjs
import {chromium,boot,go} from '../r444/lib.mjs';
const SECS=+(process.env.SECS||10),ZONES=(process.env.ZONES||'dist01,ep1b05,cult03').split(',');
let n=0,bad=0;const ok=(c,m,d)=>{n++;if(!c)bad++;console.log((c?'ok  ':'FAIL')+' '+m+(d!==undefined?': '+JSON.stringify(d).slice(0,500):''));};
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360}});const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,300)));
async function run(zone,on){await p.evaluate(on=>window.__STORYWORLD_MELEE_HITFX_R1340__.set({on}),on);await p.evaluate(()=>{if(room?.id!=='hub')enterRegion('hub',null,{layer:'STORY',restore:true});});await p.waitForFunction(()=>!loading&&room?.id==='hub',null,{timeout:150000});await go(p,zone);
 return p.evaluate(async([secs])=>{auto=false;guide=false;command=null;route=[];
  const A=window.__STORYWORLD_MELEE_HITFX_R1340__;const ms=room.enemies.filter(e=>e.hp>0&&!e.boss&&!e.midboss&&!e.persona&&e.ai==='melee').slice(0,5);
  room.enemies.filter(e=>!ms.includes(e)).forEach(e=>{e.hp=0;e.spawnState='dead';});
  const px=player.x,py=player.y;ms.forEach((e,i)=>{const a=i/5*6.28;e.x=px+Math.cos(a)*1.2;e.y=py+Math.sin(a)*1.2;e.spawnState='active';e.hp=e.maxHp=1e8;});room.engaged=true;
  const sh0=window.__STORYWORLD_EGO_CLOUD_R1286__.inspect().stats.hitShadows;const s169=()=>({...window.__STORYWORLD_PLAY_R169__.inspect().stats}),s=()=>({...A.inspect().stats});const a0=s169(),b0=s(),bl0=window.__STORYWORLD_BLOOD_R190__.inspect().stats.draws;
  const kinds={};for(const e of ms)kinds[e.name.replace(/\s+(\d+|증원|추격대)$/,'')]=A.classify(e);
  const plays={};const PX=window.__STORYWORLD_PIXELFX_R163__;let hurts=0;const hk={melee:0,other:0};const H0=hurt;hurt=function(d,src,...a){const m=!!(src&&src.attack&&src.attack.committed&&src.lastAttackKind==='melee');const b4=player.hp;const r=H0.call(this,d,src,...a);if(player.hp<b4){hk[m?'melee':'other']++;if(m){const k='k_'+window.__STORYWORLD_MELEE_HITFX_R1340__.classify(src);hk[k]=(hk[k]||0)+1;}}return r;};
  const t0=time;await new Promise(r=>{const f=()=>{if(player.hp<1e9)hurts++;player.hp=player.maxHp=1e9;player.x=px;player.y=py;for(const nm of PX.inspect().active)plays[nm]=(plays[nm]||0)+1;if(time>t0+secs)r();else setTimeout(f,50);};f();});
  hurt=H0;const a1=s169(),b1=s();const sh1=window.__STORYWORLD_EGO_CLOUD_R1286__.inspect().stats.hitShadows;const d=(x,y)=>Object.fromEntries(Object.keys(y).map(k=>[k,(y[k]||0)-(x[k]||0)]));
  return {zone:room.id,kinds,hurts,hk,r169:{pixel:a1.mobPixel-(a0.mobPixel||0),routed:(a1.mobRouted||0)-(a0.mobRouted||0)},r1340:d(b0,b1),shadows1286:sh1-sh0,bloodDraws:window.__STORYWORLD_BLOOD_R190__.inspect().stats.draws-bl0,activeSeen:plays,err:A.inspect().stats.errors};},[SECS]);}
for(const z of ZONES){const off=await run(z,false);console.log('끔',JSON.stringify(off));const on=await run(z,true);console.log('켬',JSON.stringify(on));
 const kinds=Object.values(on.kinds),hasCut=kinds.includes('bleed'),hasImp=kinds.includes('impact'),hasG=kinds.includes('ground');
 ok(on.err===0,z+': 오류 0');if(!/^ep1b0[2-8]$/.test(z))ok(off.r169.pixel>0,z+': 끔이면 예전처럼 칠 때마다 지역 시트',off.r169);else console.log(z+' 참고: 7대죄 지역은 끔에서도 R169 칠 때 시트가 원래 안 나옴',off.r169);
 ok(!hasG?on.r169.pixel===0:on.r169.pixel>0,z+': 켬 — 땅 치는 몹이 없으면 칠 때 시트 0',on.r169);
 if(hasCut&&on.hk.k_bleed>0)ok(on.r1340.slash>0&&(on.activeSeen['mob-r1340-slash']||0)>0&&on.bloodDraws===0,z+': 베기·찌르기 몹이 맞히면 할퀴기 시트가 영웅 자리에 재생(피 튐 없음)',{slash:on.r1340.slash,seen:on.activeSeen['mob-r1340-slash'],blood:on.bloodDraws});
 if(hasImp&&on.hk.k_impact>0)ok(on.r1340.impact>0&&(on.activeSeen['mob-r1340-impact']||0)>0,z+': 그 밖 몹이 맞히면 작은 타격 시트 재생',{impact:on.r1340.impact,seen:on.activeSeen['mob-r1340-impact']});
 ok(off.shadows1286>0,z+': 끔이면 맞을 때 R1286 세 봉우리 균열',off.shadows1286);ok(hasG?true:on.shadows1286<=on.hk.other,z+': 켬 — 땅 치는 몹이 없으면 균열은 원거리 적중 몫만(근접 적중엔 0)',{sh:on.shadows1286,hk:on.hk});
 ok(!on.activeSeen['mob-stone']||hasG,z+': 땅 치는 몹 없이 돌 시트가 보이지 않음',on.activeSeen);
 ok(!on.activeSeen['mob-r1340-stone']||hasG,z+': 땅 치는 몹 없이 D05 돌 시트가 보이지 않음',on.activeSeen);
 if(hasG&&on.r1340.routedGround>0)ok((on.activeSeen['mob-r1340-stone']||0)>0,z+': 땅 치는 몹이 치면 Dots D05 돌 시트(mob-r1340-stone) 재생',on.activeSeen);}
ok(errs.length===0,'페이지 오류 0',errs.slice(0,3));console.log(`R1340 browser: ${n-bad}/${n}`);await b.close();process.exit(bad?1:0);
