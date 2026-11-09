// R471 브라우저 검사(헤드리스): 나태 보스 조형물 던지기 4번 → 그림 경로가 정본 순서(쓰레기→냉장고→소파→쓰레기)인지, 방 짐수레가 숨지 않는지.
// SW_OFF=1 이면 끈 상태(엔진 기본, 이전 동작). SHOT=경로 이면 두 번째 던지기 들어 올림 순간을 찍는다.
import {chromium,boot,go} from '../r444/lib.mjs';
const off=!!process.env.SW_OFF,shot=process.env.SHOT||'';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540},init:off?{'storyworld.r471.canonThrow':'{"on":false}'}:null});
await go(p,'ep1b02');
await p.evaluate(()=>{const e=room.enemies.find(x=>x.nativeId==='b02-boss');e.spawnState='active';player.x=e.x+3.2;player.y=e.y+2.2;player.hp=player.maxHp=99999;window.__r471boss=e;
 for(const x of room.enemies)if(x!==e){x.hp=0;x.dead=true;}});
const base=await p.evaluate(()=>room.props.filter(q=>/luggage_cart/.test(q.path||'')&&q.visible===false).length);
const rows=[];
for(let i=0;i<4;i++){
 await p.waitForFunction(()=>{const e=window.__r471boss;return !e.r61Action&&!e.attack&&!(e.rangedWindup>0);},null,{timeout:180000});
 const r=await p.evaluate(()=>{const e=window.__r471boss;player.hp=player.maxHp;const a=window.__STORYWORLD_FIELDS_R61__.prepare(e,'prop');return a?{token:a.token,start:time}:null;});
 if(!r){rows.push({i,refused:true});await p.waitForTimeout(800);i--;if(rows.filter(x=>x.refused).length>40)break;continue;}
 await p.waitForFunction(t=>{const a=window.__r471boss.r61Action;return a&&a.token===t&&a.r114;},r.token,{timeout:60000});
 if(shot&&i===1){await p.waitForFunction(()=>{const a=window.__r471boss.r61Action;return !a||time>a.start+(a.releaseAt-a.start)*.8;},null,{timeout:60000});await p.screenshot({path:shot});}
 rows.push(await p.evaluate(t=>{const e=window.__r471boss,a=e.r61Action,inf=window.__STORYWORLD_COMBAT_R114__?.throwInfo?.(t);
  const carts=room.props.filter(q=>/luggage_cart/.test(q.path||''));return {token:t,path:a?.path,kind:inf?.kind,height:inf?.height,cartsHidden:carts.filter(q=>q.visible===false).length};},r.token));
 await p.waitForFunction(t=>{const a=window.__r471boss.r61Action;return !a||a.token!==t;},r.token,{timeout:120000});
}
const st=await p.evaluate(()=>({r471:window.__STORYWORLD_CANON_THROW_R471__?.inspect?.().stats,errs:window.__STORYWORLD_COMBAT_R114__?.stats?.().failures}));
console.log(JSON.stringify({off,rows:rows.filter(x=>!x.refused),refused:rows.filter(x=>x.refused).length,st}));
const got=rows.filter(x=>!x.refused).map(x=>(x.path||'').split('/').pop());
let fail=0;const ok=(n,c)=>{console.log(c?'PASS':'FAIL',n);if(!c)fail++;};
if(off)ok('off = engine default (room prop, not R471 objects)',got.every(x=>!/r80-02[45]|fridge/.test(x)));
else{ok('order heap→fridge→sofa→heap: '+got.join(','),got.join(',')==='r80-025.webp,fridge.webp,r80-024.webp,r80-025.webp');
 ok('no luggage cart hidden by the throws (baseline '+base+')',rows.filter(x=>!x.refused).every(x=>x.cartsHidden===base));ok('R114 adopted as prop throw',rows.filter(x=>!x.refused).every(x=>x.kind==='prop'));}
await b.close();process.exit(fail?1:0);
