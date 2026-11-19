// R1225 헤드리스 브라우저 검사(그래픽·GPU·실기기 손맛은 미검증): 스토리 지역(ep1b08)에서 실제 hitEnemy 사슬 전체를 지나
//  같은 적이 같은 값을 맞을 때 R1225 켜짐/꺼짐 비율이 0.5(일반 몹·보스), 일반 몹 즉사(쌍성 소멸 레이저 hp+1)는 그대로 죽음, 사몽 에피소드 방은 그대로.
import {chromium,boot,go} from '../r444/lib.mjs';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360}});
let fail=0;const ok=(n,c,d)=>{console.log((c?'PASS ':'FAIL ')+n+(d!==undefined?' '+JSON.stringify(d):''));if(!c)fail++;};
await go(p,'ep1b08');
const r=await p.evaluate(()=>{const A=window.__STORYWORLD_STORY_HALF_DMG_R1225__;if(!A)return null;room.engaged=true;
 const foes=room.enemies.filter(e=>e.hp>0);const boss=foes.find(e=>e.boss),mob=foes.find(e=>!e.boss&&!e.midboss&&!e.persona);
 const take=(e,on,v=100,src)=>{A.set({on});const hp0=e.maxHp*.8;e.hp=hp0;e.spawnState='active';hitEnemy(e,v,src);return hp0-e.hp;};
 const out={story:A.storyMode(mob),wrapped:A.inspect().wrapped};
 if(mob){out.mobOn=take(mob,true);out.mobOff=take(mob,false);}
 if(boss){out.bossOn=take(boss,true,1000);out.bossOff=take(boss,false,1000);}
 A.set({on:true});
 if(mob){mob.hp=mob.maxHp*.8;hitEnemy(mob,mob.hp+1,{kind:'r1144-laser',friendly:true,owner:'hero'});out.instakillHp=mob.hp;}
 // 사몽 에피소드 방 표시를 잠시 붙여 그대로인지
 const m2=foes.find(e=>e!==mob&&!e.boss&&e.hp>0)||boss;room.samongR103={zone:'test'};out.epiOn=take(m2,true);delete room.samongR103;out.epiStory=take(m2,true);
 out.inspect=A.inspect();return out;});
ok('R1225 loaded in story region',!!r&&r.story===true&&r.wrapped===true,r&&{story:r.story,wrapped:r.wrapped});
if(r){
 ok('normal mob: on/off damage ratio 0.5',r.mobOn>0&&Math.abs(r.mobOn/r.mobOff-.5)<1e-6,[r.mobOn,r.mobOff]);
 ok('boss: on/off damage ratio 0.5',r.bossOn>0&&Math.abs(r.bossOn/r.bossOff-.5)<1e-6,[r.bossOn,r.bossOff]);
 ok('normal mob instakill (laser hp+1) still kills',!(r.instakillHp>0),r.instakillHp);
 ok('samong episode room flag → not halved (2× the story value)',Math.abs(r.epiOn/r.epiStory-2)<1e-6,[r.epiOn,r.epiStory]);
 ok('R1225 no errors',r.inspect.stats.errors===0,r.inspect.lastError);}
await b.close();console.log(fail?`R1225 browser: ${fail} failed`:'R1225 browser: all passed');process.exit(fail?1:0);
