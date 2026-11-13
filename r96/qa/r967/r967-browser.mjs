// R967 브라우저 확인(헤드리스, 귀로 듣는 검증은 아님): 실제 엔진의 ep1a08 집도의·ep1a09 주사기 환영체·ep1b07 분노의 귀가
// 피격·공격·사망에 R967(사탄은 R788) 소리를 내는지, 14개 모두 해독되는지.
import {chromium,boot,go} from '../r444/lib.mjs';
let n=0,bad=0;const ok=(c,m)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m);};const errs=[];
const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});const {p}=await boot(b,{vp:{width:640,height:360}});p.on('pageerror',e=>errs.push(String(e)));
const PRE=`const wait=ms=>new Promise(r=>setTimeout(r,ms)),A=window.__STORYWORLD_SFX_R967__;try{await unlockAudio();}catch(_){}settings.sound=true;settings.volume=1;await wait(2500);
 const C=window.__STORYWORLD_SFX_COMFORT__,plays=()=>C.inspect().audit.filter(x=>x.kind==='play'),since=s=>plays().filter(x=>!s.has(x.id)).map(x=>x.path.split('/').pop()),mark=()=>new Set(plays().map(x=>x.id));
 modal=null;player.hp=99999;`;
const T=(name)=>`
 const e=room.enemies.find(x=>(x.name||'').includes(${JSON.stringify(name)}));if(!e)return {missing:room.enemies.map(x=>x.name).slice(0,15)};
 e.spawnState='active';e.speed=0;e.moveSpeed=0;e.hp=Math.max(e.hp,5000);room.enemies=room.enemies.filter(x=>x===e||!(x.boss||x.midboss));await wait(1200);
 const out={t:A.targetFor(e)?.[1],flags:[!!e.boss,!!e.midboss]};
 let m0=mark();hitEnemy(e,3);await wait(800);out.hit=since(m0);
 await wait(1400);m0=mark();A.tick();e.attack={id:'r967-'+Math.random()};A.tick();await wait(800);out.atk=since(m0);
 m0=mark();e.hp=1;hitEnemy(e,5);await wait(1200);out.die=since(m0);out.dead=!!e.deadRecorded;out.stats=A.inspect().stats;return out;`;
const run=(z,name)=>go(p,z).then(()=>p.evaluate(new Function(`return (async()=>{${PRE}${T(name)}})()`)));
for(const [z,name,re] of [['ep1a08','병원 심부의 집도의','surgeon'],['ep1a09','주사기 환영체','syringe'],['ep1b07','분노의 귀','satan']]){
 const r=await run(z,name);console.log(z,JSON.stringify(r));const rx=k=>new RegExp('^'+k+'-'+re+'-\\d\\.ogg$');
 ok(!r.missing,z+' 실제 '+name+' 있음'+(r.missing?' '+r.missing:''));
 ok((r.hit||[]).some(f=>rx('hit').test(f)),z+' 피격 → hit-'+re+'('+r.hit+')');
 ok((r.atk||[]).some(f=>rx('atk').test(f)),z+' 공격 시작 → atk-'+re+'('+r.atk+')');
 ok(r.dead&&(r.die||[]).some(f=>rx('die').test(f)),z+' 처치 → die-'+re+'('+r.die+')');}
const dec=await p.evaluate(async()=>Promise.all(Object.entries(soundProfiles).filter(([k])=>/^r967/.test(k)).flatMap(([k,v])=>v.map(async row=>{try{const bf=await audioBuffer(row.path);return bf?bf.duration:0;}catch(_){return 0;}}))));
ok(dec.length===14&&dec.every(d=>d>0),'14개 모두 해독('+dec.length+')');
ok(!errs.length,'페이지 오류 0 '+errs.slice(0,2));
console.log(`\nR967 browser: ${n-bad}/${n}`);await b.close();process.exit(bad?1:0);
