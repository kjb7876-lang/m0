// R905 브라우저(헤드리스 소프트웨어 렌더링 — 그래픽·실기기 검증 아님). 사용: node r96/qa/r905/r905-browser.mjs [zone ...]
//  정적 서버(SW_URL, 기본 http://127.0.0.1:4410/m0/)에 빌드 결과가 올라와 있어야 한다.
import {chromium,boot,go,skip,URL} from '../r444/lib.mjs';
let bad=0,n=0;const ok=(m,c,x)=>{n++;if(c!==true){bad++;console.log('FAIL '+m,x!==undefined?JSON.stringify(x):'');}else console.log('  ok '+m);};
const VP={width:640,height:360},b=await chromium.launch(),errs=[];
const ZONES=process.argv.slice(2).length?process.argv.slice(2):['last302','last303','dist02','kair01','cult03'];
const snap=p=>p.evaluate(()=>{const W=window.__STORYWORLD_WORLD_COMBAT_R78__,M=window.__STORYWORLD_RALLY_WAVES_R905__,f=e=>e.hp>0&&!e.deadRecorded&&e.spawnState!=='dead'&&!e.boss&&!(e.midboss&&!e.wardChampionR81);
 const rows=room.enemies.filter(f);return{phase:W.state(room)?.phase,field:rows.length,active:rows.filter(e=>e.spawnState==='active').length,hidden:rows.filter(e=>e.spawnState==='hidden').length,held:rows.filter(e=>M.held(e)).length,hud:document.getElementById('questText')?.textContent,i:M.inspect(),time};});
const toRally=async p=>{await p.evaluate(()=>{player.hp=player.maxHp=1e9;const g=room.exploration.worldWardR81.gatherAnchor;player.x=g.x;player.y=g.y;});await p.waitForFunction(()=>window.__STORYWORLD_WORLD_COMBAT_R78__.state(room)?.phase==='rally',null,{timeout:180000});};
const waitT=(p,dt)=>p.evaluate(()=>time).then(t0=>p.waitForFunction(([t,d])=>time>t+d||time<t,[t0,dt],{timeout:300000}));
const killActive=p=>p.evaluate(()=>{let k=0;for(const e of [...room.enemies])if(e.hp>0&&e.spawnState==='active'&&!e.boss&&!(e.midboss&&!e.wardChampionR81)){e.hp=0;killEnemy(e);k++;}return k;});
// ── 전(끔): 한 번에 전부 ──
{const {ctx,p}=await boot(b,{vp:VP,init:{'storyworld.r905.rallyWaves':'{"on":false}'}});p.on('pageerror',e=>errs.push(String(e).slice(0,200)));await go(p,'last302');const f0=(await snap(p)).field;await toRally(p);const s=await snap(p);
 console.log('INFO before(off) last302',JSON.stringify({field0:f0,field:s.field,active:s.active,hidden:s.hidden}));ok(`끔(전): last302 집결 때 ${s.active}/${s.field} 전부 깨어 있다`,s.active===s.field&&s.hidden===0&&s.field>=30);await ctx.close();}
// ── 후: 지역마다 ──
{const {ctx,p}=await boot(b,{vp:VP});p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
 for(const z of ZONES){await go(p,z);const f0=(await snap(p)).field;await toRally(p);const s=await snap(p),pl=s.i.plan;console.log('INFO '+z,JSON.stringify({field0:f0,active:s.active,hidden:s.hidden,plan:pl,hud:s.hud}));
  ok(`${z}: 집결 직후 깨어 있는 적 ${s.active} = 첫 묶음 ${pl?.sizes[0]}, 전체 ${s.field}=${f0} 그대로, 묶음 ${pl?.sizes.length} (${pl?.sizes})`,!!pl&&s.field===f0&&s.active===pl.sizes[0]&&s.hidden===f0-pl.sizes[0]&&pl.sizes.length>=2&&pl.sizes.length<=6&&pl.sizes.reduce((a,c)=>a+c,0)===f0);
  ok(`${z}: HUD 남은 수는 전체 그대로 (${s.hud})`,new RegExp('· '+f0+'$').test(s.hud||''));
  // 시간으로: 아무도 안 잡고 지역 간격의 1.3배+2초 기다림 → 상한을 넘지 않는다
  await waitT(p,pl.style.gap*1.3+2);const t1=await snap(p);ok(`${z}: 안 잡고 기다려도 깨어 있는 적 ${t1.active} ≤ 상한 ${pl.cap}+중간보스, 단계 rally 유지`,t1.phase==='rally'&&t1.active<=pl.cap+4&&t1.field===f0,t1.i.plan);
  // 처치로: 깨어 있는 적을 다 잡으면 다음 묶음, 끝까지
  let rounds=0,last=t1;for(;rounds<12;rounds++){const k=await killActive(p);await waitT(p,1.2);last=await snap(p);if(last.phase!=='rally'||last.field===0)break;if(last.active===0&&last.hidden>0){await waitT(p,1.5);last=await snap(p);if(last.active===0){break;}}}
  ok(`${z}: 깨어 있는 적을 잡을 때마다 다음 묶음이 나와 끝까지 간다 → 단계 ${last.phase}, 남은 적 ${last.field}, 깨운 횟수 ${last.i.stats.releases}`,last.phase==='door'&&last.field===0&&last.held===0,last.i);}
 const i=(await snap(p)).i;ok('모듈 오류 0',i.stats.errors===0,i);
 // 맘몬의 금고는 그대로
 await go(p,'ep1b06');await toRally(p);const m=await snap(p);ok(`ep1b06 맘몬의 금고: 전부 한 번에(${m.active}/${m.field}) — 손대지 않음`,m.active===m.field&&m.hidden===0);
 // 불러오기: 집결 도중 저장 → 불러오기 → 다시 나뉘고 끝까지
 await go(p,'dist04');await toRally(p);const a=await snap(p);const r=await p.evaluate(async()=>{const raw=JSON.parse(JSON.stringify(serializeSave()));await restoreSave(raw);return true;});await p.waitForFunction(()=>!loading,null,{timeout:120000});await skip(p);await p.evaluate(()=>{player.hp=player.maxHp=1e9;});await waitT(p,1.5);
 const c=await snap(p);console.log('INFO restore dist04',JSON.stringify({before:{active:a.active,hidden:a.hidden},after:{phase:c.phase,active:c.active,hidden:c.hidden,field:c.field},plan:c.i.plan}));
 ok(`불러온 뒤: 단계 rally, 전체 ${c.field}=${a.field}, 깨어 있는 적 ${c.active} ≤ 절반+1`,c.phase==='rally'&&c.field===a.field&&c.active<=Math.ceil(c.field/2)+1&&c.hidden>0,c.i.plan);
 let last=c;for(let k=0;k<12;k++){await killActive(p);await waitT(p,1.3);last=await snap(p);if(last.phase!=='rally')break;}ok(`불러온 뒤에도 끝까지 → ${last.phase}`,last.phase==='door'&&last.field===0);
 // 길잡이 실전(영화 모드 아님): 영웅이 직접 싸워서 집결을 끝낸다 — 멈춤 없는지
 await go(p,'last305');await p.evaluate(()=>{player.hp=player.maxHp=1e9;guide=true;});await toRally(p);const g0=await snap(p);let g=g0,stall=0,prev=g0.field,t0=g0.time;
 for(let k=0;k<90&&g.phase==='rally';k++){await waitT(p,4);await p.evaluate(()=>{player.hp=player.maxHp;if(storyScene||modal){for(let i=0;i<50&&storyScene;i++)advanceScene();if(modal)closePanel(true);}});g=await snap(p);if(g.field===prev)stall++;else{stall=0;prev=g.field;}if(stall>=12)break;}
 console.log('INFO guide last305',JSON.stringify({start:g0.i.plan?.sizes,end:{phase:g.phase,field:g.field,active:g.active,hidden:g.hidden,gameSec:Math.round(g.time-t0)},stats:g.i.stats}));
 ok(`길잡이 실전 last305: 영웅이 싸워 집결을 끝낸다(단계 ${g.phase}, 남은 ${g.field}, 게임 ${Math.round(g.time-t0)}초) — 48초 넘게 처치 없는 멈춤 없음`,g.phase!=='rally'&&stall<12,g.i);
 await ctx.close();}
// ── 영화 모드: 그대로(나누지 않음) ──
{const ctx=await b.newContext({viewport:VP,deviceScaleFactor:1});await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
 await p.goto(URL);await p.locator('#cinemaStartR461').click({timeout:180000});const sc=p.locator('#slotConfirmR73');if(await sc.isVisible().catch(()=>false))await sc.click();await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await skip(p);
 const cin=await p.evaluate(()=>window.__STORYWORLD_CINEMA_RUN_R461__.active());ok('영화 모드로 시작됨',cin===true);
 await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip(p);await go(p,'last302');const f0=(await snap(p)).field;await toRally(p);const s=await snap(p);
 console.log('INFO cinema last302',JSON.stringify({field0:f0,active:s.active,hidden:s.hidden,plan:s.i.plan,cin:s.i.cinema}));ok(`영화 모드 last302: 집결 때 전부 깨어 있다(${s.active}/${s.field}) — 동작 그대로`,s.i.cinema===true&&s.hidden===0&&s.active===s.field&&s.field>=20);
 await waitT(p,6);const s2=await snap(p);ok('영화 모드: 6초 뒤에도 숨긴 적 0·모듈 오류 0',s2.hidden===0&&s2.i.stats.errors===0);await ctx.close();}
ok('페이지 오류 0',errs.length===0,errs.slice(0,3));
console.log(`R905 browser ${n-bad}/${n} pass (headless software rendering)`);await b.close();process.exit(bad?1:0);
