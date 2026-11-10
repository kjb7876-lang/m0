// R531 브라우저 검사(헤드리스): 거미동굴(dist01)에서 보라검천사를 깨우고 R61 부하 소환을 직접 요청 → 소환된 몹 중 '망각의 거미'가 없어야 하고, 거미 자리 소환은 '재 나방' 승인 그림으로 그려져야 한다.
//  SW_OFF=1 이면 R380 을 끈 상태(옛 동작 재현). 소환은 3마리(분신1+부하2)씩, 명단 3종을 돌아가며 고르므로 3번 이상 소환해 거미 자리를 반드시 지나게 한다.
import {chromium,boot,go} from '../r444/lib.mjs';
const off=!!process.env.SW_OFF;
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360},init:off?{'storyworld.r380.mobs':'{"on":false}'}:null});
await go(p,'dist01');
const r=await p.evaluate(async()=>{const R=window.__STORYWORLD_SUMMONS_R61__,e=room.enemies.find(x=>x.nativeId==='mb-dist01');
 for(const x of room.enemies)if(x!==e){x.hp=0;x.deadRecorded=true;x.spawnState='dead';}room.enemies=room.enemies.filter(x=>x===e);
 e.spawnState='active';room.engaged=true;e.speed=0;e.damage=0;player.hp=99999;player.x=e.x+3;player.y=e.y+3;const seen=[];
 for(let k=0;k<4;k++){R.state(e).used=0;R.state(e).nextAt=0;e.attack=null;e.rangedWindup=0;e.r61BusyUntil=0;R.request(e);const t0=time;
  while(time<t0+2.4)await new Promise(r=>setTimeout(r,150));
  for(const x of room.enemies.filter(x=>x.r61Summoned&&x.r61Summoned.kind==='minion'))seen.push({name:x.name,nativeId:x.nativeId,r248Key:x.r248Key||null,art:window.__STORYWORLD_STORY_COMBAT_R54__.frameFor(x,null)?.r380Mob||x.path});
  R.clear('qa');}
 return {owner:e.name,seen,stats:window.__STORYWORLD_APPROVED_MOBS_R380__.inspect().stats};});
let fail=0;const ok=(n,c)=>{console.log(c?'PASS':'FAIL',n);if(!c)fail++;};
console.log(JSON.stringify(r));
const spiderSlot=r.seen.filter(s=>s.nativeId==='dist01-sp1');
ok('소환 몹이 나옴('+r.seen.length+')',r.seen.length>=4);ok('거미 자리 소환을 지남('+spiderSlot.length+')',spiderSlot.length>=1);
if(off)ok('끄면 옛 동작: 망각의 거미',spiderSlot.every(s=>s.name==='망각의 거미'));
else{ok('망각의 거미 소환 없음',r.seen.every(s=>!/망각/.test(s.name)));ok('거미 자리 = 재 나방 + 승인 그림 ash-moth-v2 + R248 키 보존',spiderSlot.every(s=>s.name==='재 나방'&&s.art==='ash-moth-v2'&&s.r248Key==='망각의 거미'));
 ok('다른 부하는 그대로(알집지기·수호병)',r.seen.filter(s=>s.nativeId!=='dist01-sp1').every(s=>/보랏빛 알집지기|거미줄에 묶인 수호병/.test(s.name)));ok('오류 0',r.stats.errors===0);}
await b.close();process.exit(fail?1:0);
