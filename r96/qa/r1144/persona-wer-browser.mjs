// R1144 브라우저 검사(헤드리스 소프트웨어 렌더링 — 그래픽 검증 아님). 실행: node persona-wer-browser.mjs <출력 폴더>
import {chromium,boot,go} from '../r444/lib.mjs';
const OUT=process.argv[2]||'.';let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
const A='__STORYWORLD_PERSONA_HERO_R1113__',Z='__STORYWORLD_PERSONA_WER_R1144__';
await p.evaluate(async A=>{await ensureImages(heroPaths('lauren'));player.hero='lauren';window[A].setForm(true);},A);
await go(p,'murder01');await p.waitForTimeout(2000);
await p.evaluate(()=>{const P=window.__STORYWORLD_PROGRESSION_R62__,st=P.state(player);for(const s of 'QWER')st.ranks['skill'+s+'R663']=1;player.maxHp=player.hp=99999;
 const T=__STORYWORLD_PHASE1__.controller.state.three,O=T.render;window.__fx=[];
 T.render=function(f){const R=O.apply(this,arguments);try{for(const c of f.commands){const id=String(c?.owner?.id||'');if(!/^r1144:/.test(id)||c.kind!=='image')continue;window.__fx.push({k:id.split(':')[1]+(/:shade$/.test(id)?':shade':''),img:String(c.sourcePath||'').replace(/^https?:\/\/[^/]+\//,'').slice(0,70),f:c.style?.filter||'none'});}}catch(e){}return R;};
 const hb=hitEnemy;window.__hits=[];hitEnemy=function(e,v,s){if(s&&s.r1144)window.__hits.push({k:s.r1144,v:+(v/attackPower()).toFixed(3),id:e.id});return hb.apply(this,arguments);};});
const waitT=async dt=>{const t0=await p.evaluate(()=>time);for(let i=0;i<900;i++){if(await p.evaluate(t0=>time-t0,t0)>=dt)return;await p.waitForTimeout(50);}};
const calm=()=>p.evaluate(()=>{const live=room.enemies.filter(e=>e.hp>0).sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y));
 live.forEach((e,i)=>{e.maxHp=e.hp=1e9;e.cd=1e6;e.attack=null;e.speed=0;if(i<4){const a=i*1.57+.4;e.x=player.x+Math.cos(a)*1.5;e.y=player.y+Math.sin(a)*1.5;}else{e.x=player.x+30;e.y=player.y+30;}});player.storyWER.ready={};return Math.min(4,live.length);});
const st=()=>p.evaluate(Z=>window[Z].inspect(),Z);
ok((await st()).active===true,'ⓐ 형상일 때 켜짐');
async function castAt(slot,dts,tag){const n=await calm();await p.evaluate(()=>{window.__fx.length=0;window.__hits.length=0;});const r=await p.evaluate(s=>window.__STORYWORLD_WER__.cast(s),slot);let last=0,i=0;for(const dt of dts){await waitT(dt-last);last=dt;await p.screenshot({path:`${OUT}/${tag}-${slot}-${i++}.png`,clip:{x:230,y:90,width:520,height:330}});}
 return {n,r,hits:await p.evaluate(()=>window.__hits.slice()),fx:await p.evaluate(()=>window.__fx.slice())};}
const cnt=(a,k)=>a.filter(x=>x.k===k).length;
{const r=await castAt('w',[.3,1.5,2.2],'persona');const c=r.hits.filter(h=>h.k==='chain');
 ok(r.r===true&&c.length>=r.n&&c.every(h=>Math.abs(h.v-.6)<.12),`ⓑ W: 표식 적 ${r.n}마리에게 연쇄 번개 피해 (${c.length}번, 배율 ${[...new Set(c.map(h=>h.v))].join('/')})`);
 const top=r.fx.filter(x=>x.k==='chain'),sh=r.fx.filter(x=>x.k==='chain:shade');
 ok(top.length>0&&top.filter(x=>/^r1140:eonju:.*neon-chain/.test(x.img)).length/top.length>=.8,'ⓑ 번개 그림 = 네온 연쇄 번개 시트를 언주로 ('+top.length+'개, 예 '+(top.at(-1)?.img)+' / '+(top.at(-1)?.f)+')');
 ok(sh.length>0&&sh.every(x=>/neon-chain/.test(x.img)&&!/^r1140:/.test(x.img)&&/brightness\(0\)/.test(x.f)),'ⓑ 번개 밑그림 = 흑(brightness(0)) ('+sh.length+'개, 예 '+(sh.at(-1)?.img)+' / '+(sh.at(-1)?.f)+')');}
{const r=await castAt('e',[.3,.6,2.2],'persona');const o=r.hits.filter(h=>h.k==='orb'),bn=r.hits.filter(h=>h.k==='burn');
 ok(r.r===true&&o.length>=1&&o.length<=4&&o.every(h=>Math.abs(h.v-.6)<.12),`ⓒ E: 주변 적에게 구슬 (${o.length}발, 배율 ${[...new Set(o.map(h=>h.v))].join('/')})`);
 ok(bn.length>=o.length&&bn.every(h=>h.v<=.08),'ⓒ 맞은 적은 화상 도트 ('+bn.length+'틱, 틱당 '+[...new Set(bn.map(h=>h.v))].join('/')+')');
 const bf=r.fx.filter(x=>x.k==='burn'),of=r.fx.filter(x=>x.k==='orb');ok(bf.length>0&&bf.filter(x=>/^r1140:eonju:.*hunter-burn/.test(x.img)).length/bf.length>=.8,'ⓒ 화상 그림 = 헌터 화상 시트를 언주로 ('+bf.length+'개, 예 '+bf.at(-1)?.img+')');
 ok(of.length>0&&of.every(x=>/lauren-red/.test(x.img)),'ⓒ 구슬 그림 = 은빛 거성 구 시트 ('+of.length+'개, 예 '+of.at(-1)?.img+')');}
{const r=await castAt('r',[.5,1.6,3.6],'persona');const o=r.hits.filter(h=>h.k==='orbit');
 ok(r.r===true&&o.length>=3&&o.every(h=>Math.abs(h.v-.35)<.08),`ⓓ R: 도는 구슬에 닿은 적 피해 (${o.length}번, 배율 ${[...new Set(o.map(h=>h.v))].join('/')})`);
 const per={};for(const h of o)per[h.id]=(per[h.id]||0)+1;ok(Object.values(per).every(n=>n<=6),'ⓓ 적마다 3초에 6번 이하 ('+JSON.stringify(Object.values(per))+')');
 ok(r.hits.some(h=>h.k==='burn'),'ⓓ 닿은 적은 화상 도트');ok((await st()).orbit===false,'ⓓ 3초 뒤 구슬이 사라짐');
 const of=r.fx.filter(x=>x.k==='orbit');ok(of.length>0&&of.filter(x=>/^r1140:eonju:.*lauren-red/.test(x.img)).length/of.length>=.8,'ⓓ 도는 구슬 = 언주 ('+of.length+'개)');}
{await calm();await p.evaluate(()=>{window.__hits.length=0;const live=room.enemies.filter(e=>e.hp>0).sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y));live.slice(0,4).forEach((e,i)=>{e.x=player.x+2.4+1.2*i;e.y=player.y+(i%2?.2:-.2);});
  const Z=window.__STORYWORLD_LAUREN_CELESTIAL_R946__;Z.qaReset();Z.qaForce('violet');hitEnemy(live[0],1,{kind:'basic',sourceHero:'lauren'});});await waitT(.9);await p.screenshot({path:`${OUT}/persona-laser.png`,clip:{x:230,y:90,width:520,height:330}});await waitT(.8);
 const L=await p.evaluate(()=>window.__hits.filter(h=>h.k==='laser')),S=(await st()).stats;ok(S.lasers>=1&&L.length>=1&&(S.laserKills||0)>=1,'ⓗ (진) 쌍성 소멸 레이저: 부채꼴 안 일반 몹 즉사 ('+(S.laserKills||0)+'마리, 보스 '+(S.laserBoss||0)+')');}
const s1=await st();ok(s1.stats.errors===0&&!(await p.evaluate(A=>window[A].inspect().lastError,A)),'ⓔ 오류 0 ('+s1.stats.lastError+'), 시트 그림 '+s1.stats.sheetDraws+'번·임시 그림 '+s1.stats.tempDraws+'번');
// 라우렌 본인
await p.evaluate(A=>{window[A].setForm(false);},A);await p.waitForTimeout(400);const before=(await st()).stats;
for(const s of ['w','e','r']){const r=await castAt(s,[.6],'lauren');ok(r.r===true&&r.hits.length===0&&r.fx.length===0,'ⓕ 라우렌 본인 '+s.toUpperCase()+': 덧효과 없음');}
const after=(await st()).stats;ok(JSON.stringify(after.casts)===JSON.stringify(before.casts),'ⓕ 라우렌일 때는 세지도 않음');
ok(errs.length===0,'ⓖ 페이지 오류 0 ('+errs.slice(0,2).join(' | ')+')');
console.log(fails?('FAILED '+fails):'ALL PASS (헤드리스)');await b.close();process.exit(fails?1:0);
