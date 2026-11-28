// R1383 투명도 실측(헤드리스): Three 명령 장면(render)이 실제로 받은 뿌리 시트 명령의 globalAlpha 를 잰다.
//  R1369(이펙트 투명도 규칙)가 있으면 위험 그림 ≤.7, 안에 선 몸 자리(r1369in 클립 행) ≤.3 인지 본다. 없으면 맨값을 보고한다.
import {chromium,boot,go} from '../r444/lib.mjs';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});await go(p,'dist00');
await p.evaluate(()=>{const e=room.enemies.find(x=>x.nativeId==='dist00-boss');room.engaged=true;e.spawnState='active';e.hidden=false;e.x=player.x+3;e.y=player.y-1;for(const m of room.enemies)if(m!==e)m.hp=0;window.__boss=e;
 window.__al={n:0,max:0,inner:0,innerMax:0,edgeMax:0,r1369:!!window.__STORYWORLD_FX_ALPHA_R1369__,cls:{}};const S=window.__STORYWORLD_PHASE1__.controller.state.three.commands;const fn=S.render;
 S.render=function(c){const r=fn.apply(this,arguments);try{const A=window.__STORYWORLD_FX_ALPHA_R1369__;for(const x of c||[]){if(!/r1383\/root-bind24/.test(String(x.sourcePath||x.image?.src||x.path||'')))continue;const a=x.style?.globalAlpha??1,W=window.__al;W.n++;
   if(x.owner?.r1369edge||/r1369in/.test(String(x.key||''))){W.inner++;W.innerMax=Math.max(W.innerMax,a);}else W.edgeMax=Math.max(W.edgeMax,a);W.max=Math.max(W.max,a);if(a>.7){const k=String(x.owner?.id||x.key||"").slice(0,60)+"|"+x.kind;W.hi=W.hi||{};W.hi[k]=(W.hi[k]||0)+1;}if(A?.classify){const k=A.classify(x)||'-';W.cls[k]=(W.cls[k]||0)+1;}}}catch(_){}return r;};});
const t0=await p.evaluate(()=>time);
await p.waitForFunction(t0=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);player.hp=Math.max(player.hp,maxHP()*.9);const e=window.__boss;e.hp=Math.max(e.hp,e.maxHp*.8);return time>=t0+14;},t0,{timeout:900000,polling:200});
console.log(JSON.stringify(await p.evaluate(()=>window.__al)));await b.close();
