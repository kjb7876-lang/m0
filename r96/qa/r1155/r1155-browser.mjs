// R1155 브라우저 검사(헤드리스 소프트웨어 렌더링·소리 장치 없음 — 귀로 들은 검증 아님). 실행: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r1155/r1155-browser.mjs
//  실제 빌드에서 ① 오버레이가 가장 바깥 sound 감싸기인지 ② 31개 파일이 모두 받아지고 해독되는지 ③ EGO·페르소나 형상에서 실제 기술(기본 공격·W/E/R 시전·
//  천체 공명 강제 발동)이 전용 경로를 울리는지 ④ 환도·라우렌 본인은 예전 경로인지 ⑤ 페이지 오류 0 을 본다.
import {chromium,boot,go} from '../r444/lib.mjs';
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});const {p}=await boot(b,{vp:{width:960,height:540}});
const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
const A='__STORYWORLD_HIDDEN_HERO_SFX_R1155__';
// 소리 경로 기록: 엔진 sound() 가 프로필 줄을 고른 뒤 부르는 audioBuffer(path)
await p.evaluate(()=>{window.__paths=[];const base=audioBuffer;audioBuffer=function(path){try{window.__paths.push(String(path));}catch(_){}return base.apply(this,arguments);};
 window.__kinds=[];const S=sound.__r1155base;});
const info=await p.evaluate(A=>{const i=window[A].inspect();return {outer:i.outermost,on:i.on,profiles:Object.values(i.profiles).flat().length,errors:i.stats.errors};},A);
ok(info.on,'① 켜짐 (가장 바깥 감싸기 여부 '+info.outer+' — 바깥 오버레이가 바꾼 종류는 안쪽 감싸기가 봄) '+JSON.stringify(info));
ok(info.profiles===43,'② 프로필 경로 43개 등록 ('+info.profiles+')');
const dec=await p.evaluate(async A=>{const T=window[A].table,out=[];for(const rows of Object.values(T))for(const r of rows){try{const buf=await audioBuffer(r.path);out.push({p:r.path,d:buf&&buf.duration||0});}catch(e){out.push({p:r.path,d:0,e:String(e).slice(0,80)});}}return out;},A);
const bad=dec.filter(x=>!(x.d>.1&&x.d<1.25));ok(dec.length===43&&!bad.length,'② 43개 파일 받기·해독(길이 .1~1.25초) '+(bad.length?JSON.stringify(bad.slice(0,3)):''));
const waitT=async dt=>{const t0=await p.evaluate(()=>time);for(let i=0;i<800;i++){if(await p.evaluate(t0=>time-t0,t0)>=dt)return;await p.waitForTimeout(40);}};
const calm=()=>p.evaluate(()=>{player.maxHp=player.hp=99999;const live=room.enemies.filter(e=>e.hp>0).sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y));
 live.forEach((e,i)=>{e.maxHp=e.hp=1e9;e.cd=1e6;e.attack=null;e.speed=0;if(i<4){e.x=player.x+1.6+.5*(i%2);e.y=player.y-.8+.6*i;}else{e.x=player.x+30;e.y=player.y+30;}});return live.length;});
const grab=()=>p.evaluate(()=>{const r=window.__paths.splice(0);return r;});
async function heroAs(hero,formKey){await p.evaluate(async([hero,formKey])=>{await ensureImages(heroPaths(hero));player.hero=hero;
 const E=window.__STORYWORLD_EGO_SOVEREIGN_R1046__,Pz=window.__STORYWORLD_PERSONA_HERO_R1113__;player.egoSovereignR1046=false;player.personaHeroR1113=false;
 if(formKey==='ego')E.setForm(true);if(formKey==='persona')Pz.setForm(true);
 player.progressionR62=player.progressionR62||{ranks:{}};player.progressionR62.ranks=player.progressionR62.ranks||{};for(const s of ['W','E','R'])player.progressionR62.ranks['skill'+s+'R663']=1;
 player.storyWER=player.storyWER||{ready:{},buffs:{}};},[hero,formKey]);await p.waitForTimeout(300);}
async function play(tag){const res={};
 await calm();await grab();
 // 기본 공격(엔진 공격 키) — 실제 입력
 for(let i=0;i<3;i++){await p.keyboard.down('KeyA');await waitT(.2);await p.keyboard.up('KeyA');await waitT(.35);}res.attack=await grab();
 // W·E·R 시전(엔진 cast)
 for(const s of ['w','e','r']){await calm();await p.evaluate(s=>{player.storyWER.ready[player.hero+':'+s]=0;try{__STORYWORLD_WER__.cast(s);}catch(e){window.__castErr=String(e);}},s);await waitT(.6);res[s]=await grab();}
 // Q(특수기 키)
 await calm();await grab();await p.evaluate(()=>{player.specialCD=0;special();});await waitT(.6);res.q=await grab();
 // 천체 공명 강제 발동
 for(const k of (tag==='persona'||tag==='lauren')?['repulse','red','blue','violet','meteor']:['red','blue']){await calm();
  await p.evaluate(k=>{const Z=window.__STORYWORLD_LAUREN_CELESTIAL_R946__;Z.qaReset();if(player.egoSovereignR1046&&Z.egoCast){const e=room.enemies.filter(e=>e.hp>0)[0];Z.egoCast(k,e);}else{Z.qaForce(k);const e=room.enemies.filter(e=>e.hp>0).sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y))[0];if(e)hitEnemy(e,1,{friendly:true,owner:'hero',sourceHero:player.hero});}},k);
  await waitT(k==='violet'?1.4:.8);res['cel_'+k]=await grab();}
 return res;}
await go(p,'dist02');await p.waitForTimeout(1500);
const has=(arr,rx)=>arr.some(x=>rx.test(x)),none=(arr,rx)=>!arr.some(x=>rx.test(x));
await heroAs('hwando','ego');const E=await play('ego');console.log('EGO',JSON.stringify(E).slice(0,900));
ok(has(E.attack,/r1155\/sfx\/ego-atk-/)&&none(E.attack,/r546\/sfx\/atk-hwando/),'③ EGO 기본 공격 → ego-atk (환도 평타 소리 없음)');
for(const s of ['w','e','r'])ok(has(E[s],new RegExp('r1155/sfx/ego-'+s+'-1')),'③ EGO '+s.toUpperCase()+' 시전 → ego-'+s);
console.log('EGO q',JSON.stringify(E.q));
ok(has(Object.values(E).flat(),/r1155\/sfx\/ego-hit/)&&none(Object.values(E).flat(),/r785\/sfx\/hit(big)?-hwando/),'③ EGO 적중음 → ego-hit (환도 적중음 없음)');
ok(has(E.q,/r1155\/sfx\/ego-q-1/),'③ EGO Q(special()) → ego-q');
ok(has(E.cel_red,/ego-star-1/)&&has(E.cel_blue,/ego-abyss-1/)&&none([...E.cel_red,...E.cel_blue],/r546\/sfx\/(atk|sp)-lauren/),'③ EGO 은빛 거성·심연 왜성 → ego-star·ego-abyss (라우렌 소리 없음)');
await heroAs('lauren','persona');const P=await play('persona');console.log('PERSONA',JSON.stringify(P).slice(0,900));
ok(has(P.attack,/r1155\/sfx\/per-atk-/)&&none(P.attack,/r546\/sfx\/atk-lauren/),'③ 페르소나 기본 공격 → per-atk (라우렌 평타 소리 없음)');
for(const s of ['w','e','r'])ok(has(P[s],new RegExp('r1155/sfx/per-'+s+'-1')),'③ 페르소나 '+s.toUpperCase()+' 시전 → per-'+s);
console.log('PER q',JSON.stringify(P.q));ok(has(P.q,/r1155\/sfx\/per-q-1/),'③ 페르소나 Q(special()) → per-q');
ok(has(Object.values(P).flat(),/r1155\/sfx\/per-hit/)&&none(Object.values(P).flat(),/r785\/sfx\/hit(big)?-lauren|r1026\/sfx\/r785-hit(big)?-lauren/),'③ 페르소나 적중음 → per-hit (라우렌 적중음 없음)');
ok(has(P.cel_repulse,/per-repulse-1/)&&has(P.cel_red,/per-star-1/)&&has(P.cel_blue,/per-abyss-1/)&&has(P.cel_meteor,/per-meteor-1/),'③ 페르소나 (진) 항성 반발·은빛 거성·심연 왜성·유성 궤도');
ok(has(P.cel_violet,/per-violet-(charge|fire)-1/),'③ 페르소나 (진) 쌍성 소멸 → 충전/발사 '+JSON.stringify(P.cel_violet.filter(x=>/r1155/.test(x))));
ok(none(Object.values(P).flat(),/r546\/sfx\/(atk|sp)-lauren/),'③ 페르소나 동안 라우렌 r546 소리 0');
await heroAs('lauren',null);const L=await play('lauren');
ok(none(Object.values(L).flat(),/r1155\//),'④ 라우렌 본인 → 전용 소리 0');
await heroAs('hwando',null);await calm();await grab();for(let i=0;i<3;i++){await p.keyboard.down('KeyA');await waitT(.2);await p.keyboard.up('KeyA');await waitT(.35);}const H=await grab();
ok(none(H,/r1155\//),'④ 환도 본인 기본 공격 → 전용 소리 0');
const st=await p.evaluate(A=>window[A].inspect(),A);console.log('stats',JSON.stringify(st.stats),st.lastError||'');
ok(st.stats.errors===0,'⑤ 오버레이 오류 0');ok(errs.length===0,'⑤ 페이지 오류 0 '+errs.slice(0,2).join(' | '));
console.log(fails?('FAILED '+fails):'ALL PASS (헤드리스)');await b.close();process.exit(fails?1:0);
