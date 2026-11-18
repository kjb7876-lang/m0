'use strict';
// R1155 CPU 검사 — 히든 영웅 EGO·페르소나 전용 효과음(사용자 2026-11-18 "EGO·페르소나 전용 효과음도 음원-생성적용").
//  지금 EGO(환도 몸)는 환도 소리, 페르소나(라우렌 몸)는 라우렌 소리를 그대로 낸다. → 형상이 켜져 있을 때만 이번 sound(kind) 한 번의 종류를
//  전용 소리로 바꾼다: 기본 공격·Q·W·E·R·패시브(묵월·칠묵영·삼협묵희·은빛 거성·심연 왜성·항성 반발 / (진) 천체 공명 다섯 갈래)·연타 틱.
//  환도·라우렌 본인, 형상 아닐 때, 끄기, 소리 파일이 없을 때는 예전 그대로. 엔진·다른 오버레이 파일은 고치지 않는다.
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;
const ok=(c,m,d)=>{n++;if(!c){bad++;console.log('FAIL',m,d!==undefined?JSON.stringify(d).slice(0,400):'');}else console.log('ok  ',m);};
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return'';}};
const N='hidden-hero-sfx-r1155.js',API='__STORYWORLD_HIDDEN_HERO_SFX_R1155__',SRC=rd(path.join(R,'client-source',N));
// ── 연결 ──
ok(SRC.length>0,N+' 있음');
ok(SRC.length>0&&rd(path.join(R,'runtime-text',N))===SRC,N+' runtime-text 사본 = client-source');
{const html=rd(path.join(R,'runtime-text','index.html')),t=x=>html.indexOf('<script src="./'+x+'"></script>');
 ok(t(N)>0&&t(N)>t('sfx-r541.js')&&t(N)>t('ego-celestial-r1145.js')&&t(N)>t('persona-wer-r1144.js')&&t(N)<t('combat-r118.js'),'태그: R541·R1145·R1144 뒤, combat-r118 앞',{n:t(N)});}
ok(rd(path.join(ROOT,'.github/workflows/pages.yml')).includes('node r96/qa/r1155/r1155-cpu-check.cjs'),'pages.yml CPU 검사 줄');
ok(/'hidden-hero-sfx-r1155\.js'/.test(rd(path.join(ROOT,'scripts','verify-r96-public.py'))),'공개 확인 목록');
ok(rd(path.join(R,'runtime-inputs.json')).includes(N),'runtime-inputs 에 새 파일');
ok(!/\btick\s*=\s*function/.test(SRC),'tick 은 직접 감싸지 않음');
ok(!/addEventListener\(\s*['"]key/.test(SRC),'새 키 없음');
ok(!/elevenlabs/i.test(SRC.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g,'')),'코드에 유료 생성 호출 없음');
// 소리 파일: 표에 있는 모든 경로가 실제로 있고 작다
const TABLE=(()=>{try{const g={window:{},localStorage:{getItem:()=>null}};g.window=g;vm.createContext(g);vm.runInContext(SRC,g);return g[API]?.table||null;}catch(e){return {err:String(e)};}})();
ok(TABLE&&!TABLE.err&&Object.keys(TABLE).length>=31,'전용 종류 31개 이상',TABLE&&Object.keys(TABLE).length);
const ROWS=TABLE&&!TABLE.err?Object.entries(TABLE):[];
{const miss=[],big=[],foreign=[];for(const[k,list]of ROWS)for(const r of list){const f=path.join(R,'runtime-text',r.path);if(!fs.existsSync(f))miss.push(r.path);else if(fs.statSync(f).size>60000)big.push(r.path);if(!/^assets\/r1155\/sfx\//.test(r.path))foreign.push(r.path);}
 ok(ROWS.length&&!miss.length,'모든 소리 파일 있음',miss.slice(0,5));ok(!big.length,'파일마다 60KB 이하',big);ok(!foreign.length,'전용 폴더(assets/r1155/sfx)만 씀 — 환도·라우렌 파일 재사용 없음',foreign);}
{const need=['r546Atk_ego','r546Atk_persona','r546Sp_ego_q','r546Sp_ego_w','r546Sp_ego_e','r546Sp_ego_r','r546Sp_persona_q','r546Sp_persona_w','r546Sp_persona_e','r546Sp_persona_r',
  'r546Sp_ego_moon','r546Sp_ego_violet','r546Sp_ego_clones','r546Sp_ego_trio','r546Sp_ego_trioHit','r546Sp_ego_star','r546Sp_ego_abyss','r546Sp_ego_repulse',
  'r546Sp_persona_repulse','r546Sp_persona_star','r546Sp_persona_abyss','r546Sp_persona_violetCharge','r546Sp_persona_violetFire','r546Sp_persona_meteor',
  'r972_egoSlash','r972_egoSlashEnd','r972_perGravity','r785Hit_ego','r785HitBig_ego','r785Hit_persona','r785HitBig_persona'];const miss=need.filter(k=>!TABLE||!TABLE[k]?.length);ok(!miss.length,'필요한 종류 모두 표에 있음',miss);
 ok(TABLE&&TABLE.r546Atk_ego?.length>=2&&TABLE.r546Atk_persona?.length>=2&&TABLE.r972_egoSlash?.length>=2,'자주 나는 소리(기본 공격·연타)는 변주 2개 이상');}
// ── 가짜 엔진 ──
function env({hero='hwando',form=null,off=false,profiles=true,hooks=true,innerR785=false}={}){
 const played=[],floats=[];const store={};if(off)store['storyworld.r1155.sfx']='0';
 const g={console,Math,JSON,Object,Array,Map,Set,WeakMap,Number,String,Promise,queueMicrotask:f=>g.__mq.push(f),__mq:[],played,floats,
  localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}},performance:{now:()=>g.__now},__now:1000,
  document:{readyState:'complete',addEventListener(){}},addEventListener(){}};g.window=g;vm.createContext(g);
 vm.runInContext(`var time=10,started=true,modal=null,loading=false,storyScene=null;var player={hero:${JSON.stringify(hero)},x:0,y:0,specialCD:0,storyWER:{ready:{}}};
  var soundProfiles={attack:[{path:'a.ogg'}],special:[{path:'s.ogg'}],r546Atk_hwando:[{path:'h.ogg'}],r546Atk_lauren:[{path:'l.ogg'}],r546Sp_lauren:[{path:'ls.ogg'}],r972_slash:[{path:'x'}],r972_gravity:[{path:'x'}],r975Ilseom3:[{path:'x'}],r975Ilseom7:[{path:'x'}]};
  function sound(kind,modalOk){played.push(kind);return kind;}
  if(${innerR785}){soundProfiles.r785Hit_hwando=[{path:'assets/r785/sfx/hit-hwando-1.ogg'}];soundProfiles.r785Hit_lauren=[{path:'assets/r785/sfx/hit-lauren-1.ogg'}];soundProfiles.r785HitBig_hwando=[{path:'hb'}];var __s0=sound;soundProfiles.r785HitBig_lauren=[{path:'hbl'}];sound=function(kind){if(kind==='enemyHit')kind=(globalThis.__big?'r785HitBig_':'r785Hit_')+player.hero;played.push(kind+'|'+((soundProfiles[kind]||[])[0]||{}).path);return kind;};}
  function floatText(t,x,y,c){floats.push(String(t));}
  function setupAudio(){return 'audio';}`,g);
 g.__STORYWORLD_SFX_COMFORT__={aliases:{}};
 const fa=(field,base)=>({field,base,formActive:()=>!!(form&&g.player.hero===base&&g.player[field]===true)});
 g.__STORYWORLD_EGO_SOVEREIGN_R1046__=fa('egoSovereignR1046','hwando');g.__STORYWORLD_PERSONA_HERO_R1113__=fa('personaHeroR1113','lauren');
 if(form==='ego')g.player.egoSovereignR1046=true;if(form==='persona')g.player.personaHeroR1113=true;
 g.__acts=[];g.__STORYWORLD_LAUREN_CELESTIAL_R946__={inspect:()=>({acts:g.__acts.map(a=>({...a}))})};
 g.__STORYWORLD_HWANDO_INK_R945__={config:{trio:{strikeAt:1.2}}};
 g.__hooks=[];if(hooks)g.__STORYWORLD_POST_HOOKS__={register:(mark,h)=>{if(h.tick)g.__hooks.push(h.tick);}};
 if(!profiles)vm.runInContext('soundProfiles=undefined',g);
 vm.runInContext(SRC,g);
 const A=g[API];const tick=()=>{for(const f of g.__hooks)f();};const flush=()=>{const q=g.__mq.splice(0);for(const f of q)f();};
 const S=(k)=>{g.played.length=0;vm.runInContext('sound('+JSON.stringify(k)+')',g);return g.played[g.played.length-1];};
 const set=(js)=>vm.runInContext(js,g);
 return {g,A,tick,flush,S,set};}
const sec=(name,f)=>{try{f();}catch(e){ok(false,name+' 실행 오류',String(e).slice(0,200));}};
// ── ① 기본 공격·형상 판별 ──
sec('블록',()=>{const E=env({form:'ego'});ok(!!E.A,'API '+API);
 ok(E.S('attack')==='r546Atk_ego','EGO 기본 공격 → r546Atk_ego',E.g.played);
 ok(E.g.soundProfiles.r546Atk_ego?.length>=2&&E.g.soundProfiles.r546Atk_ego.every(r=>/^assets\/r1155\/sfx\//.test(r.path)),'프로필 등록(전용 경로)');
 ok(E.g.__STORYWORLD_SFX_COMFORT__.aliases.r546Atk_ego==='attack'&&E.g.__STORYWORLD_SFX_COMFORT__.aliases.r546Sp_ego_q==='special'&&E.g.__STORYWORLD_SFX_COMFORT__.aliases.r972_egoSlash==='special','쾌적 계층 역할 별칭(공격·스킬)',E.g.__STORYWORLD_SFX_COMFORT__.aliases);
 ok(E.S('r546Atk_hwando')==='r546Atk_ego','EGO 때 이미 환도 평타로 바뀐 종류도 EGO 것으로');
 ok(E.S('hurt')==='hurt'&&E.S('blink')==='blink','관계없는 종류(피격·구르기)는 그대로');
 E.set('player.egoSovereignR1046=false');ok(E.S('attack')==='attack','EGO 형상을 끄면(환도 본인) 예전 그대로');});
sec('블록',()=>{const P=env({hero:'lauren',form:'persona'});ok(P.S('attack')==='r546Atk_persona','페르소나 기본 공격 → r546Atk_persona');
 P.set('player.personaHeroR1113=false');ok(P.S('attack')==='attack','라우렌 본인은 그대로');});
sec('블록',()=>{const H=env({hero:'hwando'});ok(H.S('attack')==='attack'&&H.S('special')==='special','형상 없는 환도는 그대로');});
sec('블록',()=>{const H=env({hero:'neon',form:'ego'});ok(H.S('attack')==='attack','다른 영웅은 그대로(형상 판정은 몸 영웅까지 확인)');});
// ── ② Q·W·E·R: 쿨다운이 막 걸린 칸으로 판별, 아니면 그대로(다른 체계의 special) ──
sec('블록',()=>{const E=env({form:'ego'});E.tick();
 E.set('player.specialCD=9.5');ok(E.S('special')==='r546Sp_ego_q','Q: specialCD 가 막 걸림 → ego_q');
 E.tick();ok(E.S('special')==='special','쿨다운 변화 없는 special(소환·적 탄 등) → 그대로');
 for(const s of ['w','e','r']){E.tick();E.set(`player.storyWER.ready['hwando:${s}']=time+8`);ok(E.S('special')==='r546Sp_ego_'+s,s.toUpperCase()+': ready 가 막 걸림 → ego_'+s);}
 E.tick();E.set(`player.storyWER.ready['hwando:w']=time+1e6`);ok(E.S('special')==='special','잠긴 칸(time+1e6 밀어 올림)은 시전으로 안 봄');
 E.tick();E.set(`player.storyWER.ready['hwando:e']=time+7`);E.S('special');ok(E.S('special')==='special','한 시전은 한 번만 바꿈(같은 프레임 두 번째 special 은 그대로)');});
sec('블록',()=>{const P=env({hero:'lauren',form:'persona'});P.tick();P.set('player.specialCD=9');ok(P.S('special')==='r546Sp_persona_q','페르소나 Q');
 P.tick();P.set(`player.storyWER.ready['lauren:r']=time+20`);ok(P.S('special')==='r546Sp_persona_r','페르소나 R');});
sec('블록',()=>{const E=env({form:'ego',hooks:false});E.set('player.specialCD=0');E.S('hurt');E.set('player.specialCD=9.5');ok(E.S('special')==='r546Sp_ego_q','POST_HOOKS 없어도 소리 호출마다 기준값을 새로 잡아 Q 판별');});
// ── ③ 환도 계보 패시브(R945): 이름 글자 바로 뒤 소리 ──
sec('블록',()=>{const E=env({form:'ego'});E.tick();
 const said=(t,k)=>{E.set('floatText('+JSON.stringify(t)+',0,0)');const r=E.S(k);E.flush();return r;};
 ok(said('묵월','special')==='r546Sp_ego_moon','묵월 → ego_moon');
 ok(said('칠묵영','blink')==='r546Sp_ego_clones','칠묵영 → ego_clones');
 ok(said('삼협묵희','ego')==='r546Sp_ego_trio','삼협묵희 → ego_trio');
 E.set('time+=1.25');E.tick();ok(E.S('special')==='r546Sp_ego_trioHit','삼협묵희 1.2초 뒤 일격 special → ego_trioHit');
 E.set('time+=5');E.tick();ok(E.S('special')==='special','일격 시간이 지나면 그대로');
 E.set('floatText("묵월",0,0)');E.flush();ok(E.S('special')==='special','이름 글자와 소리가 다른 차례(작업)면 묶지 않음');
 const H=env({hero:'hwando'});H.set('floatText("묵월",0,0)');ok(H.S('special')==='special','환도 본인의 묵월은 예전 소리');});
// ── ④ 천체 공명(R946): 방금 생긴 act 종류로 갈래 판별 ──
sec('블록',()=>{const E=env({form:'ego'});const cast=(kind,age,k)=>{E.g.__acts=[{kind,t0:E.g.time-age}];return E.S(k);};
 ok(cast('red',0,'r546Atk_lauren')==='r546Sp_ego_star','EGO 은빛 거성 → ego_star');
 ok(cast('blue',0,'r546Atk_lauren')==='r546Sp_ego_abyss','EGO 심연 왜성 → ego_abyss');
 ok(cast('repulse',0,'r546Atk_lauren')==='r546Sp_ego_repulse','EGO 항성 반발 → ego_repulse');
 ok(cast('violet',.5,'r546Sp_lauren')==='r546Sp_ego_violet','EGO 쌍성 소멸(R1094 EGO판) → ego_violet — 라우렌 소리 아님');
 E.g.__acts=[];ok(E.S('r546Atk_lauren')==='r546Sp_ego_star','act 를 못 읽으면 EGO 천체 기본값(은빛 거성) — 라우렌 소리는 안 남');});
sec('블록',()=>{const P=env({hero:'lauren',form:'persona'});const cast=(acts,k)=>{P.g.__acts=acts;return P.S(k);};const t=()=>P.g.time;
 ok(cast([{kind:'repulse',t0:t()}],'r546Atk_lauren')==='r546Sp_persona_repulse','(진) 항성 반발');
 ok(cast([{kind:'red',t0:t()}],'r546Atk_lauren')==='r546Sp_persona_star','(진) 은빛 거성');
 ok(cast([{kind:'blue',t0:t()}],'r546Atk_lauren')==='r546Sp_persona_abyss','(진) 심연 왜성');
 ok(cast([{kind:'violet',t0:t()}],'r546Sp_lauren')==='r546Sp_persona_violetCharge','(진) 쌍성 소멸 시작 → 충전');
 ok(cast([{kind:'violet',t0:t()-.5}],'r546Sp_lauren')==='r546Sp_persona_violetFire','(진) 쌍성 소멸 발사(레이저 7줄) → 발사');
 ok(cast([{kind:'meteor',t0:t()}],'r546Sp_lauren')==='r546Sp_persona_meteor','(진) 유성 궤도');
 const L=env({hero:'lauren'});L.g.__acts=[{kind:'red',t0:L.g.time}];ok(L.S('r546Atk_lauren')==='r546Atk_lauren','라우렌 본인 천체 공명은 예전 소리');});
// ── ⑤ 연타 틱 ──
sec('블록',()=>{const E=env({form:'ego'});ok(E.S('r972_slash')==='r972_egoSlash','EGO 연참 틱');ok(E.S('r975Ilseom3')==='r972_egoSlash'&&E.S('r975Ilseom7')==='r972_egoSlashEnd','EGO 일섬 7연(1~6 / 7타)');
 const P=env({hero:'lauren',form:'persona'});ok(P.S('r972_gravity')==='r972_perGravity','페르소나 중력 틱');
 const H=env({hero:'hwando'});ok(H.S('r972_slash')==='r972_slash','환도 본인 틱 그대로');});
// ── ⑤-2 적중음(R785 가 enemyHit 을 영웅별 r785Hit_<영웅> 으로 바꾼 뒤) ──
sec('적중음',()=>{const E=env({form:'ego'});ok(E.S('r785Hit_hwando')==='r785Hit_ego'&&E.S('r785HitBig_hwando')==='r785HitBig_ego','EGO 적중음·큰 적중음');
 ok(E.S('r785Kill')==='r785Kill'&&E.S('enemyHit')==='enemyHit','처치 마무리·바뀌기 전 enemyHit 은 그대로');
 const P=env({hero:'lauren',form:'persona'});ok(P.S('r785Hit_lauren')==='r785Hit_persona'&&P.S('r785HitBig_lauren')==='r785HitBig_persona','페르소나 적중음·큰 적중음');
 const H=env({hero:'hwando'});ok(H.S('r785Hit_hwando')==='r785Hit_hwando','환도 본인 적중음 그대로');
 ok(E.g.__STORYWORLD_SFX_COMFORT__.aliases.r785Hit_ego==='enemyHit','적중음 역할 별칭 enemyHit');
 ok(TABLE&&TABLE.r785Hit_ego?.length>=4&&TABLE.r785Hit_persona?.length>=4,'적중음 변주 4개');});
// R785 가 안쪽(먼저 감싼 쪽)이면 이쪽은 'enemyHit' 만 본다 → 그 한 번 동안 r785Hit(Big)_<원래 영웅> 프로필을 전용 줄로 바꿔 끼웠다가 되돌린다
sec('안쪽 R785',()=>{const E=env({form:'ego',innerR785:true});E.g.played.length=0;E.set('sound("enemyHit")');
 ok(E.g.played.some(x=>x==='r785Hit_hwando|assets/r1155/sfx/ego-hit-1.ogg'),'EGO: 안쪽 R785 가 고른 환도 적중 줄 → 전용 파일로 울림',E.g.played);
 ok(E.g.soundProfiles.r785Hit_hwando[0].path==='assets/r785/sfx/hit-hwando-1.ogg','호출 뒤 환도 적중 프로필 되돌림');
 E.g.played.length=0;E.g.__big=true;E.set('sound("enemyHit")');ok(E.g.played.some(x=>/^r785HitBig_hwando\|assets\/r1155\/sfx\/ego-hitbig-/.test(x)),'EGO 큰 적중도',E.g.played);
 ok(E.g.soundProfiles.r785HitBig_hwando[0].path==='hb','큰 적중 프로필도 되돌림');
 const P=env({hero:'lauren',form:'persona',innerR785:true});P.g.played.length=0;P.set('sound("enemyHit")');
 ok(P.g.played.some(x=>x==='r785Hit_lauren|assets/r1155/sfx/per-hit-1.ogg')&&P.g.soundProfiles.r785Hit_lauren[0].path==='assets/r785/sfx/hit-lauren-1.ogg','페르소나: 라우렌 적중 줄 → 전용, 뒤에 되돌림',P.g.played);
 const H=env({hero:'hwando',innerR785:true});H.g.played.length=0;H.set('sound("enemyHit")');ok(H.g.played.some(x=>x==='r785Hit_hwando|assets/r785/sfx/hit-hwando-1.ogg'),'환도 본인은 환도 적중 파일',H.g.played);});
// 감싸기가 두 겹이어도(로드 뒤 바깥에 한 번 더) 안쪽에서 바뀐 종류를 다시 본다
sec('두 겹',()=>{const E=env({form:'ego'});E.set('var __b=sound;sound=function(k){return __b(k==="enemyHit"?"r785Hit_hwando":k);}');E.g.__STORYWORLD_HIDDEN_HERO_SFX_R1155__;
 E.set('sound.__r1155=false');E.g.played.length=0;E.set('sound("enemyHit")');ok(E.g.played[E.g.played.length-1]==='r785Hit_ego','바깥 오버레이가 바꾼 종류도 안쪽 감싸기가 전용으로',E.g.played);});
// ── ⑥ 끄기·안전 ──
sec('블록',()=>{const O=env({form:'ego',off:true});ok(O.S('attack')==='attack'&&O.A.inspect().on===false,'끄기 storyworld.r1155.sfx=0 → 그대로');});
sec('블록',()=>{const E=env({form:'ego'});delete E.g.soundProfiles.r546Atk_ego;ok(E.S('attack')==='attack','프로필이 없으면(파일 못 받음 등) 원래 종류로');});
sec('블록',()=>{const E=env({form:'ego',profiles:false});let thrown=false;try{E.S('attack');}catch(_){thrown=true;}ok(!thrown,'soundProfiles 없는 상태에서도 오류 없음');});
sec('블록',()=>{const E=env({form:'ego'});E.S('attack');E.S('attack');const st=E.A.inspect();ok(st.stats.mapped>=2&&st.stats.errors===0,'통계: mapped·errors',st.stats);});
console.log('\n'+(n-bad)+'/'+n+(bad?' — 실패 '+bad:' — 모두 통과'));process.exit(bad?1:0);
