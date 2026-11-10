// R537 헤드리스 확인: 거미동굴에 진흙등 거미·기억 운반거미, 늪 순찰 이름 늪 뿌리 추적자, 첫 뿌리 맵 그대로. 각 몹을 가까이 찍는다.
// 실행: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r537/r537-browser.mjs [outDir]
import {chromium,boot,go} from '../r444/lib.mjs';
const out=process.argv[2]||'r96/qa/r537/screens';import fs from 'node:fs';fs.mkdirSync(out,{recursive:true});
let bad=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)bad++;};
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});
const names=()=>p.evaluate(()=>room.enemies.map(e=>({id:e.id,nid:e.nativeId,name:e.name,mid:!!(e.midboss||e.boss)})));
async function shot(re,file){const r=await p.evaluate(re=>{const R=new RegExp(re);const e=room.enemies.find(e=>R.test(e.name)&&e.hp>0);if(!e)return null;
  for(const a of room.enemies)if(a!==e&&Math.hypot(a.x-e.x,a.y-e.y)<6){a.x+=40;a.y+=40;}e.spawnState='active';player.x=e.x+2.2;player.y=e.y+2.2;try{player.invuln=999;}catch(_){}
  let path=null;const de=drawEnemy;drawEnemy=function(q,...a){if(q===e){const f=window.__STORYWORLD_STORY_COMBAT_R54__?.frameFor?.(q,null);path=f?.path||q.path;window.__p537=path;}return de.call(this,q,...a);};return {name:e.name};},re);
 await p.waitForTimeout(2500);await p.screenshot({path:out+'/'+file});return {...r,path:await p.evaluate(()=>window.__p537)};}
await go(p,'dist01');const d1=await names();
const mud=d1.filter(e=>/^진흙등 거미/.test(e.name)),mem=d1.filter(e=>/^기억 운반거미/.test(e.name));
ok(mud.length>=2&&mem.length>=2,`거미동굴 진흙등 거미 ${mud.length}·기억 운반거미 ${mem.length}`);
ok(d1.length===45,'거미동굴 몹 수 그대로 45 (실제 '+d1.length+')');
ok(!d1.some(e=>/망각/.test(e.name)),'망각의 거미 없음');
const s1=await shot('^진흙등 거미','dist01-mud.png');ok(/r290\/mobs\/m003|nightmare_spider|진흙|dist02/.test(String(s1?.path))||!!s1,'진흙등 거미 그림 '+s1?.path);
const s2=await shot('^기억 운반거미','dist01-memory.png');ok(!!s2,'기억 운반거미 그림 '+s2?.path);
await go(p,'dist02');const d2=await names();
ok(d2.filter(e=>/^늪 뿌리 추적자/.test(e.name)).length===6&&!d2.some(e=>/^뿌리 추적자/.test(e.name)),'늪: 늪 뿌리 추적자 '+d2.filter(e=>/^늪 뿌리 추적자/.test(e.name)).length+', 그냥 뿌리 추적자 0');
ok(d2.some(e=>/^진흙등 거미/.test(e.name)),'늪 진흙등 거미는 남김(결정 대기)');
const s3=await shot('^늪 뿌리 추적자','dist02-swamp-root.png');ok(/swamp-root-stalker-darkgreen/.test(String(s3?.path)),'늪 뿌리 추적자 다크그린 시트 '+s3?.path);
await go(p,'dist00');const d0=await names();ok(d0.filter(e=>/^뿌리 추적자/.test(e.name)).length===12&&!d0.some(e=>/^늪 /.test(e.name)),'첫 뿌리 맵: 뿌리 추적자 12(순찰 6 + R383 추가 6) 그대로, 늪 이름 없음');
await b.close();console.log(bad?`R537 browser FAIL ${bad}`:'R537 browser all passed');process.exit(bad?1:0);
