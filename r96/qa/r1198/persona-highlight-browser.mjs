// R1198 브라우저 검사(헤드리스 소프트웨어 렌더링 — 그래픽 검증 아님). 실행: node persona-highlight-browser.mjs <출력 폴더>
// 페르소나 형상에서 은빛 거성·심연 왜성·쌍성 소멸을 강제로 내 장면 명령·크기·덧그림을 보고, 라우렌 본인과 비교 장면을 찍는다.
import {chromium,boot,go} from '../r444/lib.mjs';
const OUT=process.argv[2]||'.';let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
const A='__STORYWORLD_PERSONA_HERO_R1113__';
await p.evaluate(async A=>{await ensureImages(heroPaths('lauren'));player.hero='lauren';window[A].setForm(true);},A);
await go(p,'murder01');await p.waitForTimeout(2000);
await p.evaluate(()=>{player.maxHp=player.hp=99999;const T=__STORYWORLD_PHASE1__.controller.state.three,O=T.render;window.__cel=[];
 T.render=function(f){const R=O.apply(this,arguments);try{for(const c of f.commands){const id=String(c?.owner?.id||'');if(!/^r946:/.test(id))continue;const k=id.split(':')[1];
   if(c.kind==='image'){const d=c.dest||c.rect||null;window.__cel.push({k,id,img:String(c.sourcePath||'').replace(/^https?:\/\/[^/]+\//,'').slice(0,80),f:String(c.style?.filter||'none')});}}}catch(e){}return R;};});
const waitT=async dt=>{const t0=await p.evaluate(()=>time);for(let i=0;i<800;i++){if(await p.evaluate(t0=>time-t0,t0)>=dt)return;await p.waitForTimeout(50);}};
const calm=()=>p.evaluate(()=>{const live=room.enemies.filter(e=>e.hp>0).sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y));
 live.forEach((e,i)=>{e.maxHp=e.hp=1e9;e.cd=1e6;e.attack=null;e.speed=0;if(i<4){e.x=player.x+2.6+.6*(i%2);e.y=player.y-1+.7*i;}else{e.x=player.x+30;e.y=player.y+30;}});return live.length;});
async function run(tag,kinds){const out={};for(const [k,shots] of kinds){await calm();await p.evaluate(k=>{window.__cel.length=0;const Z=window.__STORYWORLD_LAUREN_CELESTIAL_R946__;Z.qaReset();Z.qaForce(k);const e=room.enemies.filter(e=>e.hp>0).sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y))[0];hitEnemy(e,1,{kind:'basic',sourceHero:'lauren'});},k);
  let el=0;for(const s of shots){await waitT(s-el);el=s;await p.screenshot({path:`${OUT}/${tag}-${k}-${String(s).replace('.','_')}.png`,clip:{x:130,y:40,width:700,height:440}});}
  await waitT(1.4);out[k]=await p.evaluate(()=>window.__cel.slice());await waitT(1.4);}return out;}
const KINDS=[['red',[.25,.7]],['blue',[.45,.9]],['violet',[.6,.9]]];
await run('warm',[['repulse',[.3]]]);await p.waitForFunction(()=>Object.values(window.__STORYWORLD_LAUREN_CELESTIAL_R946__.sheets()).every(s=>s.ready),null,{timeout:60000}).catch(()=>{});
const P=await run('persona',KINDS);
for(const k of ['red','blue','violet']){const hl=P[k].filter(c=>/:hl:/.test(c.id));ok(hl.length>0,`ⓐ ${k} 페르소나 하이라이트 덧그림이 장면 명령으로 나감 (${hl.length}, 예 ${hl[0]?hl[0].img:'-'})`);
 const tone={red:'eonju',blue:'black',violet:'darkred'}[k];const sh=hl.filter(c=>/r946|r1140/.test(c.img));{const bad=sh.filter(c=>!new RegExp('^r1140:'+tone+':').test(c.img)&&c.f==='none');/* 굽기 예산이 남지 않은 첫 몇 프레임은 필터로 물듦(R1113) */ok(sh.length>0&&bad.length===0,`ⓑ ${k} 덧그림 시트가 페르소나 ${tone} 굽기 (${sh.length}, 예외 ${JSON.stringify(bad.slice(0,2))})`);}}
const H=await p.evaluate(()=>window.__STORYWORLD_LAUREN_CELESTIAL_R946__.highlight());ok(H.persona===true&&H.range===1.5,'ⓒ highlight() 페르소나 켜짐 '+JSON.stringify(H));
const lz=await p.evaluate(()=>window.__STORYWORLD_PERSONA_WER_R1144__.inspect());ok(lz&&lz.on!==false,'ⓓ (진) 레이저 모듈 살아 있음 '+JSON.stringify({dots:lz.dots}).slice(0,120));
await p.evaluate(A=>{window[A].setForm(false);},A);await p.waitForTimeout(500);
const L=await run('lauren',[['red',[.25]],['violet',[.6]]]);
ok([...L.red,...L.violet].every(c=>!/:hl:/.test(c.id)),'ⓔ 라우렌 본인은 덧그림 없음');
const st=await p.evaluate(()=>window.__STORYWORLD_LAUREN_CELESTIAL_R946__.inspect().stats);ok(st.errors===0,'ⓕ R946 오류 0 ('+st.lastError+')');
ok(errs.length===0,'ⓖ 페이지 오류 0 ('+errs.slice(0,2).join(' | ')+')');
console.log(fails?('FAILED '+fails):'ALL PASS (헤드리스)');await b.close();process.exit(fails?1:0);
