// R954 브라우저 확인(헤드리스, 소리를 직접 듣는 검증은 아님): 실제 엔진의 불면귀 구역(last302·last303)에서 종류별 피격·사망·공격 소리가 r954 파일로 나는지,
// R763 주민 신음과 같은 타격엔 R954 피격음이 물러나는지, 불면귀 보스 공격엔 R954 가 끼지 않는지(R762 몫), 51개 해독.
import {chromium,boot,go} from '../r444/lib.mjs';
let n=0,bad=0;const ok=(c,m)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m);};const errs=[];
const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});const {p}=await boot(b,{vp:{width:640,height:360}});p.on('pageerror',e=>errs.push(String(e)));
const PRE=`const wait=ms=>new Promise(r=>setTimeout(r,ms)),A=window.__STORYWORLD_SFX_R954__;try{await unlockAudio();}catch(_){}settings.sound=true;settings.volume=1;await wait(2500);
 const C=window.__STORYWORLD_SFX_COMFORT__,plays=()=>C.inspect().audit.filter(x=>x.kind==='play'),since=s=>plays().filter(x=>!s.has(x.id)).map(x=>x.path.split('/').pop()),mark=()=>new Set(plays().map(x=>x.id));
 modal=null;const prep=e=>{e.spawnState='active';e.speed=0;e.moveSpeed=0;e.hp=Math.max(e.hp,500);};room.engaged=true;player.hp=99999;`;
await go(p,'last303');
const r=await p.evaluate(new Function(`return (async()=>{${PRE}
 const out={api:!!A};
 const boss=room.enemies.find(e=>e.boss&&e.name==='불면귀'),herb=room.enemies.find(e=>!e.boss&&e.name==='잠식된 약방 아낙'),rem=room.enemies.find(e=>/안개 잔영/.test(e.name)),fish=room.enemies.find(e=>/^잠식된 어부 \\d$/.test(e.name));
 if(!boss||!herb||!rem||!fish)return {...out,missing:[!!boss,!!herb,!!rem,!!fish]};[boss,herb,rem,fish].forEach(prep);await wait(1200);
 let m0=mark();hitEnemy(boss,3);await wait(700);out.bossHit=since(m0);
 m0=mark();try{bossVolley(boss);}catch(x){out.volleyErr=x.message;}await wait(700);out.bossAtk=since(m0);
 const g0=A.inspect().stats.hitYield;m0=mark();hitEnemy(herb,3);await wait(500);out.herbHit1=since(m0);
 m0=mark();hitEnemy(herb,3);await wait(600);out.herbHit2=since(m0);out.yield=A.inspect().stats.hitYield-g0;
 m0=mark();hitEnemy(rem,3);await wait(600);out.remHit=since(m0);
 m0=mark();rem.attack={id:'r954-test-'+Math.random()};await wait(700);out.remAtk=since(m0);
 m0=mark();fish.hp=1;hitEnemy(fish,5);await wait(900);out.fishDie=since(m0);
 // R790: 귀비탕을 마시기 전엔 불면귀가 쓰러지지 않는다(봉인) → 이 확인에서만 '이야기 완료'로 답하게 해 봉인을 푼다.
 const oc=completed;completed=(id,k)=>k==='STORY'&&id===room.id?true:oc(id,k);m0=mark();boss.hp=1;hitEnemy(boss,5);completed=oc;out.bossDead=!!boss.deadRecorded;await wait(900);out.bossDie=since(m0);
 out.stats=A.inspect().stats;
 out.decoded=await Promise.all(Object.entries(soundProfiles).filter(([k])=>/^r954/.test(k)).flatMap(([k,v])=>v.map(async row=>{try{const bf=await audioBuffer(row.path);return [row.path.split('/').pop(),bf?+bf.duration.toFixed(3):0];}catch(_){return [row.path,0];}})));
 return out;})()`));
const {decoded,...show}=r;console.log(JSON.stringify(show));
ok(r.api&&!r.missing,'API·실제 불면귀·약방 아낙·안개 잔영·어부('+(r.missing||'ok')+')');
ok(r.bossHit.some(f=>/^hit-bulmyeongwi-[1-3]\.ogg$/.test(f)),'불면귀 피격 → hit-bulmyeongwi('+r.bossHit+')');
ok(!r.bossAtk.some(f=>/bulmyeongwi/.test(f)&&/^atk-/.test(f)),'불면귀 bossVolley 에 R954 공격음 없음(R762 몫)('+r.bossAtk+')');
ok(r.herbHit1.concat(r.herbHit2).some(f=>/^hit-herbwoman-[1-3]\.ogg$/.test(f))||r.yield>0,'약방 아낙 피격 → hit-herbwoman 또는 R763 신음에 양보('+r.herbHit1+' / '+r.herbHit2+', 양보 '+r.yield+')');
ok(!r.herbHit1.some(f=>/^hit-herbwoman/.test(f))||!r.herbHit1.some(f=>/[Gg]roan|groan/i.test(f)),'같은 타격에 신음과 R954 피격음이 겹치지 않음');
ok(r.remHit.some(f=>/^hit-mistremnant-[1-3]\.ogg$/.test(f)),'안개 잔영 피격 → hit-mistremnant('+r.remHit+')');
ok(r.remAtk.some(f=>/^atk-mistremnant-[1-3]\.ogg$/.test(f)),'안개 잔영 공격 시작 → atk-mistremnant('+r.remAtk+')');
ok(r.fishDie.some(f=>/^die-fisherman-[1-3]\.ogg$/.test(f)),'어부 처치 → die-fisherman('+r.fishDie+')');
ok(r.bossDie.some(f=>/^die-bulmyeongwi-[1-3]\.ogg$/.test(f)),'불면귀 처치 → die-bulmyeongwi('+r.bossDie+')');
ok(decoded.length===51&&decoded.every(d=>d[1]>0),'51개 모두 해독됨('+decoded.length+')');ok(r.stats.errors===0,'오버레이 오류 0');
await go(p,'last302');
const q=await p.evaluate(new Function(`return (async()=>{${PRE}
 const e=room.enemies.find(x=>x.midboss&&/검은 안개 심장/.test(x.name));if(!e)return {missing:true};prep(e);await wait(1200);const out={};
 let m0=mark();hitEnemy(e,3);await wait(700);out.hit=since(m0);m0=mark();try{bossVolley(e);}catch(x){out.volleyErr=x.message;}await wait(700);out.atk=since(m0);
 m0=mark();e.hp=1;hitEnemy(e,5);await wait(900);out.die=since(m0);out.errors=A.inspect().stats.errors;return out;})()`));
console.log(JSON.stringify(q));
ok(!q.missing&&q.hit.some(f=>/^hit-mistheart-[1-3]\.ogg$/.test(f)),'검은 안개 심장 피격 → hit-mistheart('+q.hit+')');
ok(!q.missing&&q.atk.some(f=>/^atk-mistheart-[1-3]\.ogg$/.test(f)),'검은 안개 심장 bossVolley → atk-mistheart('+q.atk+')');
ok(!q.missing&&q.die.some(f=>/^die-mistheart-[1-3]\.ogg$/.test(f)),'검은 안개 심장 처치 → die-mistheart('+q.die+')');
ok(q.errors===0&&errs.length===0,'오버레이·페이지 오류 0 '+errs.slice(0,2));
console.log('\nR954 browser: '+(n-bad)+'/'+n);await b.close();process.exit(bad?1:0);
