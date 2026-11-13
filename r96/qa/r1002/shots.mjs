// R1002 장면 찍기(헤드리스): cult04 를 빠르게 진행하며 지배 연결·끊김·꿰매기·결전(고리·코어)·꿰매기 실패를 같은 카메라로 찍는다.
// 사용: node r96/qa/r1002/shots.mjs <outDir> [off]   (off = R1002 시트 끔 → R950 코드 그림, 전후 비교용)
import {chromium,boot,go} from '../r444/lib.mjs';
const out=process.argv[2]||'.',OFF=process.argv[3]==='off';
const init={'storyworld.r790.npc':'{"on":false}'};if(OFF)init['storyworld.r1002.finaleFx']='{"on":false}';
const b=await chromium.launch();const {p}=await boot(b,{init});const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
await go(p,'cult04');
await p.evaluate(()=>{window.__SLOW=1;const tb=tick;tick=function(dt,...a){return tb.call(this,dt*(window.__SLOW??1),...a);};player.invincible=1e9;
 window.__step=n=>{for(let i=0;i<n;i++){for(let k=0;k<60&&storyScene;k++)advanceScene();if(modal&&!storyScene&&typeof closePanel==='function'&&room.encounterStage!=='complete')try{closePanel(true)}catch(_){}tick(.05);}};
 window.__boss=()=>room.enemies.find(e=>(e.boss||e.midboss||e.cosmic)&&e.hp>0&&!e.deadRecorded);
 window.__open=()=>{player.x=room.objective.x+.6;player.y=room.objective.y+.6;interact();};
 window.__kill=e=>{e.hp=Math.min(e.hp,1);hitEnemy(e,1e9,{friendly:true,kind:'qa-r1002',eventId:'qa:'+e.id+':'+time});};
 window.__next=()=>{for(let g=0;g<8;g++){__open();__step(40);const e=__boss();if(!e){__step(20);continue;}for(let i=0;i<60&&e.spawnState!=='active';i++){e.spawnState==='hidden'&&Math.hypot(e.x-player.x,e.y-player.y)>2&&(player.x=e.x-1,player.y=e.y);__step(1);}return{act:room.activeEncounter,id:e.nativeId||e.id};}return null;};});
const shot=async(name,wait=1200)=>{await p.evaluate(()=>{window.__SLOW=1e-4;});await p.waitForTimeout(wait);await p.screenshot({path:`${out}/${name}${OFF?'-off':''}.jpg`,quality:88,type:'jpeg'});
 const ins=await p.evaluate(()=>({fx:window.__STORYWORLD_FINALE_FX_R1002__?.inspect?.(),r950:window.__STORYWORLD_FINALE_R950__?.inspect?.().fx,act:room.activeEncounter,ci:room.cosmicIndex}));console.log(name,JSON.stringify(ins).slice(0,500));await p.evaluate(()=>{window.__SLOW=1;});};
// 배양좌 → 1형태 → 각성까지
let st;for(let i=0;i<6;i++){st=await p.evaluate(()=>__next());console.log('stage',JSON.stringify(st));if(st?.act==='cosmic')break;await p.evaluate(()=>{__step(10);__kill(__boss());__step(30);});}
// 시트가 읽힐 때까지
await p.waitForFunction(()=>{const f=window.__STORYWORLD_FINALE_FX_R1002__;if(!f||!f.on())return true;f.warm();return Object.values(f.inspect().ready).every(Boolean);},null,{timeout:60000});
await p.evaluate(()=>{player.x=room.objective.x+2.2;player.y=room.objective.y+1.6;__step(6);});await shot('1-links');
await p.evaluate(()=>{__kill(__boss());for(let i=0;i<8;i++)tick(.05);});await shot('2-snap');
for(let i=0;i<5;i++){await p.evaluate(()=>{__step(30);});st=await p.evaluate(()=>__next());await p.evaluate(()=>{__step(6);__kill(__boss());});}
await p.evaluate(()=>{__step(30);});st=await p.evaluate(()=>{__open();for(let i=0;i<400&&room.activeEncounter!=='finalBoss';i++)__step(1);const e=room.enemies.find(e=>e.nativeId==='c104-boss'&&e.hp>0);player.x=e.x-2.4;player.y=e.y+1.2;return{act:room.activeEncounter,t:time};});console.log('final',JSON.stringify(st));
await p.evaluate(()=>{const f=window.__STORYWORLD_FINALE_R950__;for(let i=0;i<200&&!f.inspect().fx.includes('stitch');i++)tick(.02);for(let i=0;i<5;i++)tick(.05);});await shot('3-stitch-a');
await p.evaluate(()=>{for(let i=0;i<22;i++)tick(.05);});await shot('3-stitch-b');
await p.evaluate(()=>{__step(70);const e=__boss();player.x=e.x-2.6;player.y=e.y+1.4;__step(4);});await shot('4-duel');
// 처치 직후 마지막 서사 창이 곧바로 열려 게임 시간이 멈춘다(R81 계약) — 꿰매기 실패는 창 뒤에서 실제 시간으로 이어진다. 창을 넘기지 않고 잇달아 찍는다.
await p.evaluate(()=>{const e=__boss();__kill(e);tick(.05);});
for(const n of ['a','b','c','d','e','f'])await shot('5-unstitch-'+n,250);
console.log('frozen',JSON.stringify(await p.evaluate(()=>({scene:!!storyScene,modal:!!modal,t:+time.toFixed(2)}))));
console.log('errors',JSON.stringify(errs));await b.close();
