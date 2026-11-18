// R1150 헤드리스 브라우저 검사(그래픽·GPU·실기기 손맛은 미검증): 스토리 회장 보스(ep1b08)를 체력 25%로 → R205 광폭화 →
//  공격력·이동 속도 ×1.66, 받는 피해 ÷1.66, 게임 시간 초당 최대 체력 0.6% 재생, 판정 반지름 그대로, 그림 배율 1.06.
import {chromium,boot,go} from '../r444/lib.mjs';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360}});
let fail=0;const ok=(n,c,d)=>{console.log((c?'PASS ':'FAIL ')+n+(d!==undefined?' '+JSON.stringify(d):''));if(!c)fail++;};
await go(p,'ep1b08');
const s0=await p.evaluate(()=>{const e=room.enemies.find(x=>x.nativeId==='b08-boss');if(!e)return null;e.spawnState='active';room.engaged=true;player.x=e.x+3;player.y=e.y+2.5;player.hp=player.maxHp=1e7;
 window.__b=e;const o={dmg:e.damage,speed:e.speed,radius:e.radius};e.hp=Math.floor(e.maxHp*.25);return o;});
ok('chairman boss present',!!s0,s0);
await p.waitForFunction(()=>!!window.__b.r205Enraged,null,{timeout:120000}).catch(()=>{});
const s1=await p.evaluate(()=>{const e=window.__b;return{en:!!e.r205Enraged,dmg:e.damage,speed:e.speed,radius:e.radius,K:window.__STORYWORLD_BOSS_R205__.constants};});
ok('enraged',s1.en);ok('damage ×1.66',Math.abs(s1.dmg/s0.dmg-1.66)<1e-6,[s0.dmg,s1.dmg]);ok('speed ×1.66',Math.abs(s1.speed/s0.speed-1.66)<1e-6,[s0.speed,s1.speed]);
ok('hit radius unchanged',s1.radius===s0.radius);ok('size constant 1.06',s1.K.ENRAGE_SIZE===1.06);
const s2=await p.evaluate(async()=>{const e=window.__b;e.hp=e.maxHp*.2;const h0=e.hp,t0=time;await new Promise(r=>{const f=()=>time-t0>=2?r():setTimeout(f,50);f();});
 const g=(e.hp-h0)/e.maxHp/(time-t0);const hit=en=>{e.hp=e.maxHp*.2;if(!en)delete e.r205Enraged;const h=e.hp;hitEnemy(e,1000);return h-e.hp;};const en=hit(true),R=e.r205Enraged,calm=hit(false);e.r205Enraged=R;return{regenPerSec:g,ratio:calm/en,en,calm,t:time-t0};});
ok('regen ≈ 0.6% max HP per game second',Math.abs(s2.regenPerSec-.006)<.0008,s2);/* 다른 층(영웅 공격력·777 등)이 피해를 더 곱하므로 같은 보스의 광폭화 전/후 비율로 본다 */ok('defense: same hit takes 1/1.66 while enraged',Math.abs(s2.ratio-1.66)<.01,s2);
const err=await p.evaluate(()=>window.__STORYWORLD_BOSS_R205__.inspect());ok('R205 no errors',err.stats.errors===0,err.lastError);
await b.close();console.log(fail?`R1150 browser: ${fail} failed`:'R1150 browser: all passed');process.exit(fail?1:0);
