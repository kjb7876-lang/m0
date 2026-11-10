// R535 장면 찍기(헤드리스): 헌터로 몹 무리 앞에서 Q·Z·C 를 하나씩 쓰고 연계가 한창일 때 게임 시간을 멈춰 찍는다. OUT=폴더
import {chromium,boot,go} from '../r444/lib.mjs';
const out=process.env.OUT||'.',off=!!process.env.SW_OFF;
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:1280,height:720},init:off?{'storyworld.r535.hunter':'{"on":false}'}:null});await go(p,process.env.ZONE||'dist01');
await p.evaluate(()=>{showHeroes();});await p.waitForTimeout(500);await p.evaluate(()=>{document.querySelector('[data-hero="hunter"]')?.click();});await p.waitForTimeout(400);
await p.evaluate(()=>{const btn=[...document.querySelectorAll('#panel button')].find(x=>/선택|확인|시작|변경|출전/.test(x.textContent));btn?.click();});
await p.waitForFunction(()=>!loading,null,{timeout:90000});await p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
await p.evaluate((D)=>{player.hp=99999;const L=room.enemies.filter(e=>e.hp>0&&!e.boss).slice(0,7);for(const e of room.enemies)if(!L.includes(e)){e.hp=0;e.dead=true;}
 L.forEach((e,i)=>{e.x=player.x+D+(i%3)*1.1;e.y=player.y-1+(Math.floor(i/3))*1.2+(i%2)*.3;e.homeX=e.x;e.homeY=e.y;e.speed=0;e.moveSpeed=0;e.damage=0;e.hp=e.maxHp=1e7;e.spawnState='active';});
 window.__SLOW=1;const tb=tick;tick=function(dt,...a){return tb.call(this,dt*window.__SLOW,...a);};
 window.__cast=s=>document.getElementById('story-wer-'+s)?.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));},+(process.env.DIST||3.6));
const I=()=>p.evaluate(()=>window.__STORYWORLD_HUNTER_ARROWS_R535__.inspect().stats);
async function snap(name,cond,timeout=60000){await p.waitForFunction(cond,null,{timeout,polling:30}).catch(()=>console.log('timeout',name));await p.evaluate(()=>{window.__SLOW=1e-4;});await p.waitForTimeout(700);await p.screenshot({path:out+'/'+name+'.png'});await p.evaluate(()=>{window.__SLOW=1;});}
async function settle(){await p.evaluate(async()=>{const t=time;while(time<t+3)await new Promise(r=>setTimeout(r,100));});}
if(process.env.ONLYC){await p.evaluate(()=>{player.storyWER&&(player.storyWER.ready={});__cast('r');});await snap('c-lance',()=>projectiles.some(x=>x.r535==='lance'&&x.age>.15));await snap('c-blast',()=>{const b=window.__STORYWORLD_HUNTER_ARROWS_R535__.inspect().lastBlast;return b&&time-b.at>(+window.__BT||.18);});await snap('c-petals',()=>projectiles.filter(x=>x.r535==='petal'&&x.age>.12).length>=6);console.log(JSON.stringify(await I()));await b.close();process.exit(0);}
// Q: 화살 6발 이상 날 때
await p.evaluate(()=>{player.specialCD=0;special();});await snap('q-storm',()=>projectiles.filter(x=>x.friendly&&x.owner==='hero').length>=6);await settle();
// Z: 가시가 날 때
await p.evaluate(()=>{player.storyWER&&(player.storyWER.ready={});__cast('w');});await snap('z-split',()=>projectiles.some(x=>x.r535==='shard')||time>0&&false);await settle();
// Z 불: 불타는 중
await p.evaluate(()=>{player.storyWER&&(player.storyWER.ready={});__cast('w');});await snap('z-burn',()=>window.__STORYWORLD_HUNTER_ARROWS_R535__.inspect().burning>=2);await settle();
// C: 가시살 비행 → 폭발 → 꽃잎
await p.evaluate(()=>{player.storyWER&&(player.storyWER.ready={});__cast('r');});await snap('c-lance',()=>projectiles.some(x=>x.r535==='lance'));
await snap('c-blast',()=>{const b=window.__STORYWORLD_HUNTER_ARROWS_R535__.inspect().lastBlast;return b&&time-b.at>(+window.__BT||.18);});await snap('c-petals',()=>projectiles.filter(x=>x.r535==='petal').length>=6);
console.log(JSON.stringify(await I()));await b.close();
