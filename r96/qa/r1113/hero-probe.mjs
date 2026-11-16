// 주의(11-16 QA): 이 탐색 스크립트의 walk 값은 라우렌 heroArt.lauren.walk(엔진 영웅 그림 표)이다 — 페르소나 걷기 시트가 아니다(대개 null). 페르소나 걷기 연결은 select-probe.mjs 의 walk_* 와 inspect().stats.walkSwaps 로 본다.
import {chromium,boot,skip} from '../r444/lib.mjs';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});
await p.evaluate(async()=>{await ensureImages(heroPaths('lauren'));player.hero='lauren';player.direction='front';refreshIcons();});
await p.evaluate(()=>{const R=__STORYWORLD_PHASE1__.controller.state.three,O=R.render;R.render=function(f){const r=O.apply(this,arguments);try{window.__cap=f.commands.filter(c=>c.kind==='image'&&c.owner&&/hero/.test(String(c.owner.id||c.owner.kind))).map(c=>({oid:c.owner.id,okind:c.owner.kind,keys:Object.keys(c.owner).join(','),path:String(c.sourcePath).slice(0,140),sr:c.sourceRect,h:Math.abs(c.points[3][1]-c.points[0][1]).toFixed(1),w:Math.abs(c.points[1][0]-c.points[0][0]).toFixed(1),filter:c.style?.filter}));}catch(e){window.__capErr=String(e)}return r;};});
await p.waitForTimeout(1500);
console.log(JSON.stringify(await p.evaluate(()=>({cap:window.__cap,err:window.__capErr,dir:player.direction,hero:player.hero,heroes:Object.keys(HEROES),art:Object.keys(heroArt.lauren||{}),walk:JSON.stringify(heroArt.lauren?.walk||heroArt.lauren?.run||null).slice(0,300)})),null,1));
await p.evaluate(()=>{player.moving=true;});await p.keyboard.down('KeyA');await p.waitForTimeout(1200);
console.log(JSON.stringify(await p.evaluate(()=>window.__cap)));await p.keyboard.up('KeyA');
await b.close();
