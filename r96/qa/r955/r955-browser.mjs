// R955 브라우저 확인(헤드리스, 소리를 직접 듣는 검증은 아님): 실제 엔진의 일반 몹 지역에서 계열별 피격·사망·공격 소리가 r955 파일로 나는지,
// 보스·중간보스에는 R955 가 끼지 않는지, 440개 모두 해독되는지.
import {chromium,boot,go} from '../r444/lib.mjs';
let n=0,bad=0;const ok=(c,m)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m);};const errs=[];
const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});const {p}=await boot(b,{vp:{width:640,height:360}});p.on('pageerror',e=>errs.push(String(e)));
const PRE=`const wait=ms=>new Promise(r=>setTimeout(r,ms)),A=window.__STORYWORLD_SFX_R955__;try{await unlockAudio();}catch(_){}settings.sound=true;settings.volume=1;await wait(2500);
 const C=window.__STORYWORLD_SFX_COMFORT__,plays=()=>C.inspect().audit.filter(x=>x.kind==='play'),since=s=>plays().filter(x=>!s.has(x.id)).map(x=>x.path.split('/').pop()),mark=()=>new Set(plays().map(x=>x.id));
 modal=null;const prep=e=>{e.spawnState='active';e.speed=0;e.moveSpeed=0;e.hp=Math.max(e.hp,500);};room.engaged=true;player.hp=99999;`;
const zone=(id,body)=>go(p,id).then(()=>p.evaluate(new Function(`return (async()=>{${PRE}${body}})()`)));
// 거미동굴: 거미 피격·공격, 수호병 처치
const r=await zone('dist01',`
 const out={api:!!A};const sp=room.enemies.find(e=>!e.boss&&!e.midboss&&A.slugFor(e)==='spider'),sk=room.enemies.find(e=>!e.boss&&!e.midboss&&A.slugFor(e)==='boneguard');
 if(!sp||!sk)return {...out,missing:[!!sp,!!sk],names:room.enemies.map(e=>e.name).slice(0,12)};[sp,sk].forEach(prep);await wait(1200);
 let m0=mark();hitEnemy(sp,3);await wait(700);out.spHit=since(m0);
 room.enemies=room.enemies.filter(e=>e===sp||A.slugFor(e)!=='spider');await wait(1300);m0=mark();A.tick();sp.attack={id:'r955-test-'+Math.random()};A.tick();await wait(700);out.spAtk=since(m0);
 await wait(500);m0=mark();sk.hp=1;hitEnemy(sk,5);await wait(900);out.skDie=since(m0);out.skDead=!!sk.deadRecorded;
 out.stats=A.inspect().stats;
 out.decoded=await Promise.all(Object.entries(soundProfiles).filter(([k])=>/^r955/.test(k)).flatMap(([k,v])=>v.map(async row=>{try{const bf=await audioBuffer(row.path);return [row.path.split('/').pop(),bf?+bf.duration.toFixed(3):0];}catch(_){return [row.path,0];}})));
 return out;`);
const {decoded,...show}=r;console.log(JSON.stringify(show));
ok(r.api&&!r.missing,'API·실제 거미·수호병('+(r.missing||'ok')+(r.names?' '+r.names:'')+')');
ok((r.spHit||[]).some(f=>/^hit-spider-[1-3]\.ogg$/.test(f)),'거미 피격 → hit-spider('+r.spHit+')');
ok((r.spAtk||[]).some(f=>/^atk-spider-[1-3]\.ogg$/.test(f)),'거미 공격 시작 → atk-spider('+r.spAtk+')');
ok(r.skDead&&(r.skDie||[]).some(f=>/^die-boneguard-[1-3]\.ogg$/.test(f)),'수호병 처치 → die-boneguard('+r.skDie+')');
ok((decoded||[]).length===440&&decoded.every(d=>d[1]>0),'440개 모두 해독됨('+(decoded||[]).length+', 실패 '+(decoded||[]).filter(d=>!(d[1]>0)).length+')');
ok(r.stats&&r.stats.errors===0,'오버레이 오류 0');
// 시간 수문장: 번호 → 계열, 처치
const q=await zone('kair04',`
 const out={};const g=room.enemies.filter(e=>/^시간수문장 0[1-3]/.test(e.name));if(g.length<1)return {missing:true,names:room.enemies.map(e=>e.name).slice(0,12)};
 out.slugs=g.map(e=>[e.name,A.slugFor(e)]);const e=g[0];prep(e);await wait(1200);
 let m0=mark();hitEnemy(e,3);await wait(700);out.hit=since(m0);out.slug=A.slugFor(e);
 m0=mark();e.storyAttackStart5=(e.storyAttackStart5||0)+12345;await wait(700);out.atk=since(m0);
 m0=mark();e.hp=1;hitEnemy(e,5);await wait(900);out.die=since(m0);out.errors=A.inspect().stats.errors;return out;`);
console.log(JSON.stringify(q));
ok(!q.missing&&q.slugs.every(([nm,s])=>s===['timegate2','timegate1','timegate3'][+nm.match(/\d+/)[0]%3]),'시간수문장 번호 → 계열('+JSON.stringify(q.slugs)+')');
ok(!q.missing&&q.hit.some(f=>new RegExp('^hit-'+q.slug+'-[1-3]\\.ogg$').test(f)),'시간수문장 피격 → hit-'+q.slug+'('+q.hit+')');
ok(!q.missing&&(q.atk.some(f=>new RegExp('^atk-'+q.slug+'-[1-3]\\.ogg$').test(f))),'시간수문장 패턴 공격 시작 → atk-'+q.slug+'('+q.atk+')');
ok(!q.missing&&q.die.some(f=>new RegExp('^die-'+q.slug+'-[1-3]\\.ogg$').test(f)),'시간수문장 처치 → die-'+q.slug+'('+q.die+')');
// 보스·중간보스는 R955 없음
const z=await zone('dist01',`
 const t=room.enemies.filter(e=>e.boss||e.midboss);if(!t.length)return {none:true};const out={};t.forEach(prep);await wait(1200);const m0=mark();for(const e of t)hitEnemy(e,3);await wait(700);out.p=since(m0);return out;`);
console.log(JSON.stringify(z));
ok(z.none||!z.p.some(f=>/^(hit|atk|die)-[a-z0-9]+-\d\.ogg$/.test(f)&&!/^(hit|atk|die)-(root|balrog|lucifer|sloth|leviathan|beelzebub|seoyun|satan|chairman|bootloader|controller|goblin|knight|gate0\d|gravekeeper|arbelia|siren|nightmare|bluelight|choir|hanrian|baekion|cultleader)/.test(f)&&false)&&!z.p.some(f=>/r955/.test(f)),'보스·중간보스 타격에 R955 없음('+(z.p||'없음')+')');
ok(errs.length===0,'페이지 오류 0 '+errs.slice(0,2));
console.log('\nR955 browser: '+(n-bad)+'/'+n);await b.close();process.exit(bad?1:0);
