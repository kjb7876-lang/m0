// R788 브라우저 확인(헤드리스, 소리를 직접 듣는 검증은 아님): 실제 엔진에서 보스 피격·사망·공격 시작이 r788 보스별 파일로 재생되는지, 일반 몹은 그대로인지, 파일 해독.
import {chromium,boot,go} from '../r444/lib.mjs';
let n=0,bad=0;const ok=(c,m)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m);};const errs=[];
const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});const {p}=await boot(b,{vp:{width:640,height:360}});p.on('pageerror',e=>errs.push(String(e)));
await go(p,'dist06');
const r=await p.evaluate(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),A=window.__STORYWORLD_SFX_R788__;try{await unlockAudio();}catch(_){}settings.sound=true;settings.volume=1;await wait(2500);
 const C=window.__STORYWORLD_SFX_COMFORT__,plays=()=>C.inspect().audit.filter(x=>x.kind==='play'),since=s=>plays().filter(x=>!s.has(x.id)).map(x=>x.path.split('/').pop()),mark=()=>new Set(plays().map(x=>x.id));
 const out={api:!!A,names:{}};
 // 실제 지역 표의 보스 이름이 모두 알아보이는지
 for(const reg of Object.values(regionById))for(const bs of reg.bosses||reg.def?.bosses||[])if(bs?.name)out.names[bs.name]=A.slugOf(bs.name);
 const src=room.enemies.find(e=>e.hp>0);if(!src)return {...out,noEnemy:true};
 // 일반 몹 피격
 let m0=mark();room.engaged=true;const plain=room.enemies.find(e=>e.hp>5&&!e.boss);if(plain){hitEnemy(plain,1);await wait(700);}out.plainHit=since(m0);
 // 보스로 바꾼 적(이름만 발록) — 판정은 엔진 그대로
 const e=room.enemies.find(x=>x.nativeId==='dist06-boss');if(!e)return {...out,noBoss:true};out.bossName=e.name;e.spawnState='active';room.engaged=true;player.hp=99999;e.speed=0;e.moveSpeed=0;e.hp=Math.max(e.hp,500);await wait(1200);
 m0=mark();hitEnemy(e,3);await wait(700);out.hit=since(m0);
 m0=mark();hitEnemy(e,3);await wait(300);out.hit2=since(m0);
 m0=mark();try{bossVolley(e);}catch(x){out.volleyErr=x.message;}await wait(700);out.atk=since(m0);
 m0=mark();e.hp=1;hitEnemy(e,5);await wait(900);out.die=since(m0);
 out.stats=A.inspect().stats;
 out.decoded=await Promise.all(Object.entries(soundProfiles).filter(([k])=>/^r788/.test(k)).flatMap(([k,v])=>v.map(async row=>{try{const bf=await audioBuffer(row.path);return [row.path.split('/').pop(),bf?+bf.duration.toFixed(3):0];}catch(_){return [row.path,0];}})));
 return out;});
console.log(JSON.stringify({names:r.names,plain:r.plainHit,hit:r.hit,hit2:r.hit2,atk:r.atk,die:r.die,stats:r.stats,volleyErr:r.volleyErr}));
ok(r.api&&!r.noEnemy&&!r.noBoss,'API·실제 발록 보스('+r.bossName+')');
const nm=Object.entries(r.names||{}),known=nm.filter(([k,v])=>v);ok(known.length>=26,'실제 지역 보스 이름 중 26종 이상 알아봄('+known.length+'/'+nm.length+', 모름: '+nm.filter(([k,v])=>!v).map(x=>x[0]).join('·')+')');
ok(!r.plainHit.some(f=>/^(hit|die|atk)-(root|balrog|lucifer|sloth|leviathan|beelzebub|seoyun|satan|chairman|bootloader|controller|goblin|knight|gate0[1246]|gravekeeper|arbelia|siren|nightmare|bluelight|choir|hanrian|baekion|cultleader)-\d\.ogg$/.test(f)),'일반 몹 피격엔 보스 소리 없음('+r.plainHit+')');
ok(r.hit.some(f=>/^hit-balrog-[1-3]\.ogg$/.test(f)),'보스 피격 → hit-balrog('+r.hit+')');
ok(!r.hit2.some(f=>/^hit-balrog/.test(f)),'0.9초 안 두 번째 피격엔 보스 소리 없음('+r.hit2+')');
ok(r.atk.some(f=>/^atk-balrog-[1-2]\.ogg$/.test(f)),'bossVolley → atk-balrog('+r.atk+')');
ok(r.die.some(f=>/^die-balrog-[1-2]\.ogg$/.test(f)),'보스 처치 → die-balrog('+r.die+')');
ok(r.decoded.length===182&&r.decoded.every(d=>d[1]>0),'182개 모두 해독됨('+r.decoded.length+')');ok(r.stats.errors===0,'오버레이 오류 0');ok(errs.length===0,'페이지 오류 0 '+errs.slice(0,2));
console.log('\nR788 browser: '+(n-bad)+'/'+n);await b.close();process.exit(bad?1:0);
