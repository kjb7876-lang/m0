// R1179 브라우저 검사(헤드리스 소프트웨어 렌더링 — 그래픽·실기기 검증 아님): 무한생존 사몽 S-06 디스토피아에서 '외계 침공군'의
//  실제 몸 그림 명령(drawEnemy 뒤 기록기 commands)이 R1179 손그림 시트이고 R248 임시 픽셀 시트가 아닌지, 끄면 예전으로 돌아가는지 본다.
//  SW_URL(기본 http://127.0.0.1:4410/m0/), SHOTS=폴더(전후 스크린샷).
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/',SHOTS=process.env.SHOTS||'';
let fail=0,n=0;const ok=(m,c,x)=>{n++;console.log(c?'PASS':'FAIL',m,x!==undefined?JSON.stringify(x).slice(0,300):'');if(!c)fail++;};
const b=await chromium.launch();
async function run(off,stage='sm1006:S-06',rx='외계 침공군',id='m077'){const ctx=await b.newContext({viewport:{width:960,height:540}});
 if(off)await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r1179.mobArt','{"on":false}');});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
 await p.goto(URL,{timeout:240000});await p.locator('#campaignNew54').waitFor({timeout:240000});const A=(f,a)=>p.evaluate(f,a);
 const ins=await A(()=>window.__STORYWORLD_MOB_ART_R1179__?.inspect?.());
 if(!off)ok('R1179 이 실려 있고 '+id+' 를 얹음(태그가 R248 표보다 앞이라 DOMContentLoaded 에)',!!ins&&ins.applied.includes(id),ins);
 await A(async([stage,rx])=>{window.__rx=new RegExp(rx);const Z=window.__STORYWORLD_SURVIVAL_R600__;await Z.start('hwando','normal');await Z.qaGo(Z.stageIds().indexOf(stage));
  window.__seen={};const base=drawEnemy;drawEnemy=function(e,...a){const C=ctx&&ctx.commands,n0=C?C.length:0;const r=base.call(this,e,...a);if(C&&e&&!e.boss&&window.__rx.test(e.name||'')){for(const q of C.slice(n0))if(q&&q.kind==='image'){const im=q.image;const id=String(q.sourcePath||im?.src||im?.__storyworldStaticTint?.path||im?.__storyworldStaticSource?.path||'').replace(/^https?:\/\/[^/]+\/m0\//,'');window.__seen[id]=(window.__seen[id]||0)+1;}}return r;};},[stage,rx]);
 for(let k=0;k<40;k++){const c=await A(()=>{const Z=window.__STORYWORLD_SURVIVAL_R600__;try{Z.skipNarration();}catch(_){}try{const b=document.getElementById('r600Pick0');if(b&&modal)b.click();}catch(_){}player.hp=maxHP();try{auto=false;settings.autoSkill=false;}catch(_){}
   let j=0;for(const e of room.enemies)if(e.hp>0&&!e.deadRecorded&&window.__rx.test(e.name||'')&&j<4){e.speed=0;e.x=player.x+1.5+j*.9;e.y=player.y+.6;j++;}return Object.values(window.__seen).reduce((a,b)=>a+b,0);});if(c>60)break;await p.waitForTimeout(700);}
 const seen=await A(()=>window.__seen);if(SHOTS)await p.screenshot({path:SHOTS+'/'+id+'-'+(off?'before':'after')+'.jpg',quality:85,clip:{x:280,y:130,width:460,height:300}});
 const keys=Object.keys(seen);
 if(off)ok('끄면 예전 R248 임시 시트로 그림(스위치 동작)',keys.some(k=>k.includes('assets/r248/mobs/'+id)),seen);
 else{ok(stage+' '+rx+' 몸 그림 = assets/r1179/mobs/'+id+'.webp',keys.some(k=>k.includes('assets/r1179/mobs/'+id+'.webp')),seen);
  ok(rx+': R248 임시 픽셀 시트는 그리지 않음',!keys.some(k=>/assets\/r248\/mobs\//.test(k)),seen);}
 ok((off?'끔':'켬')+': 페이지 오류 없음',errs.length===0,errs);await ctx.close();}
await run(false);await run(true);await run(false,'sm1006:S-07','여섯 물건의 그림자','m081');await run(true,'sm1006:S-07','여섯 물건의 그림자','m081');await b.close();
console.log(`R1179 browser ${n-fail}/${n}`);process.exit(fail?1:0);
