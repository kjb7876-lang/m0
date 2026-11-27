// R1333 CPU 검사: 일반(잡몹) 근접 몹의 첫 돌진 없애기(사용자 2026-11-26 08:47Z "근접몹 처음에 돌진하는거 없애봐쫌").
// R1221 이 일반 몹 돌진을 45초에 한 번(첫 돌진은 처음 본 뒤 22~45초)으로 줄였지만, 처음 본 시각은 방에 들어온 때라
//  방을 22~45초 돌아다닌 뒤 새로 발견한 근접 몹은 발견하자마자 돌진했다(= '처음에 돌진').
// 사용자 2026-11-26 09:17Z "모든몹돌진없애줘" → 보스·중간보스·페르소나까지 모든 몹.
// 기대: 모든 몹 R52 돌진·R286 돌진 0번(첫 번째·이후 모두), 걷기·근접 공격·보스 2칸 안 휘두르기는 그대로.
//  다른 돌진 출처(R268 보스 빠른 돌진 → 블링크, R114 환영 돌진, R205 보스 환영 쪽 이동, R116 수호 챔피언 돌진)도 R1333 에 묻는다. 끄면 R1221 리듬으로 돌아감. e.rest 원래 값 보존. NaN 시간 안전.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const F='mob-nodash-r1333.js',SRC=path.join(R,'client-source',F),SRC1221=path.join(R,'client-source','mob-dash-r1221.js');
let pass=0,fail=0;const ok=(n,c)=>{if(c){pass++;console.log('PASS',n);}else{fail++;console.log('FAIL',n);}};
const exists=fs.existsSync(SRC);ok(F+' exists',exists);
const code1221=fs.readFileSync(SRC1221,'utf8');
ok('R1221 asks R1333 before allowing an R52 dash',/__STORYWORLD_MOB_NODASH_R1333__/.test(code1221));
ok('R1221 asks R1333 for bosses too (no major exemption in noDash)',/function noDash\(e\)\{try\{/.test(code1221));
// 다른 돌진 출처가 시작 문에서 R1333 에 묻는다(각 파일 자체 검사는 R1333 을 안 읽으니 원래대로 통과해야 함)
const SRCS={'mob-gaze-r268.js':/if\(B&&!nodashR1333\(e\)\)\{e\.r268Dash=/,'combat-r114.js':/if\(len>\.2&&!nodashR1333\(e\)\)\{row\.dash=/,'boss-r205.js':/a\.r205Move=true;if\(nodashR1333\(e\)\)\{[^}]*continue;\}/,'mobs-tune-r116.js':/!e\.attack&&!nodashR1333\(e\)&&/};
for(const [f,re] of Object.entries(SRCS)){const c=fs.readFileSync(path.join(R,'client-source',f),'utf8');ok(f+' gates its dash on R1333',re.test(c)&&/__STORYWORLD_MOB_NODASH_R1333__/.test(c));
 const rtf=path.join(R,'runtime-text',f);ok(f+' runtime copy matches source',fs.existsSync(rtf)&&fs.readFileSync(rtf,'utf8')===c);}
if(exists){const code=fs.readFileSync(SRC,'utf8');
 try{new vm.Script(code);ok('syntax',true);}catch(e){ok('syntax '+e.message,false);}
 const rt=path.join(R,'runtime-text',F);ok('runtime copy matches source',fs.existsSync(rt)&&fs.readFileSync(rt,'utf8')===code);
 const rt1221=path.join(R,'runtime-text','mob-dash-r1221.js');ok('R1221 runtime copy matches source',fs.existsSync(rt1221)&&fs.readFileSync(rt1221,'utf8')===code1221);
 const html=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');ok('script tag once in index.html',html.split('src="./'+F+'"').length===2);
 ok('verify-r96-public lists it',fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8').includes("'"+F+"'"));
 ok('pages.yml runs this check',fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8').includes('r96/qa/r1333/r1333-cpu-check.cjs'));
 // R1221 검사와 같은 작은 세계(엔진 R52 시작 문·간격, R286 attack-only 돌진 흉내) + 근접 걷기·휘두르기(2칸 안)
 function env({ls={},with1333=true}={}){const g={localStorage:{_s:{...ls},getItem(k){return this._s[k]??null;},setItem(k,v){this._s[k]=String(v);}},console,Math,JSON,Number,String,Object,Array,WeakMap,Map,Set,Infinity,NaN,isFinite,setTimeout:()=>0};g.window=g;vm.createContext(g);
  vm.runInContext(`var time=0,player={x:20,y:16,hp:1000},room={id:"ep1b05",enemies:[]};var log=[];
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  (function(){const st=new WeakMap();function s(e){let v=st.get(e);if(!v){v={nextCharge:time+1.8,nextSwing:time};st.set(e,v);}return v;}
   function tickEnemy(e,dt){if(!(e.ai==='melee'||e.boss))return false;const S=s(e);
    if(e.attack){e.attack.t+=dt;if(e.attack.t>1.2){e.attack=null;e.cd=1.45;}return true;}
    if(e.attack||e.rangedWindup>0||e.cd>0||e.rest>0)return false;const d=distance(e,player);
    if(time>=S.nextCharge&&d>=2.75&&d<=7.1){e.attack={r52Charge:true,t:0,id:Math.random()};S.nextCharge=time+(e.boss?7.7:8.8);log.push({id:e.id,kind:'charge',t:time});return true;}
    if(e.boss&&time>=S.nextSwing&&d<=2.0){S.nextSwing=time+1;e.attack={r52Charge:false,t:0,id:Math.random()};log.push({id:e.id,kind:'swing',t:time});return true;}return false;}
   window.__STORYWORLD_HOSPITAL_CHARGE_R52__=Object.freeze({tickEnemy,action:e=>e.attack,bodyPose:()=>null,clear(){},inspect:()=>({})});})();
  window.__STORYWORLD_MOB_MOTION_R286__={kindOf:e=>e.kind286||'full'};
  function r286step(){const now=time;for(const e of room.enemies){if(!(e.hp>0)||e.kind286!=='attack-only'||e.boss)continue;const s=e.r286||(e.r286={mode:null,t0:0,nextDash:now+.3,nextShot:now+3,side:1});
   if(s.mode){if(now-s.t0>=.69){s.mode=null;s.nextDash=now+2.2;}continue;}if(now>=s.nextDash&&!e.attack){s.mode='charge';s.t0=now;log.push({id:e.id,kind:'r286',t:now});}}}
  // 엔진 근접 AI(돌진이 아니면): 영웅 쪽으로 걷고 1.1칸 안이면 휘두르기
  function walk(e,dt){if(e.noWalk||e.boss||e.ai!=='melee'||e.attack||e.r286?.mode)return;const d=distance(e,player);if(d>1.1){const v=1.6*dt;e.x+=(player.x-e.x)/d*v;e.y+=(player.y-e.y)/d*v;}else if(!(e.cd>0)){e.cd=1.2;log.push({id:e.id,kind:'melee',t:time});}}
  function tickEnemies(dt){for(const e of room.enemies){e.cd=Math.max(0,(e.cd||0)-dt);if(window.__STORYWORLD_HOSPITAL_CHARGE_R52__?.tickEnemy(e,dt))continue;walk(e,dt);}}
  function tick(dt){time+=dt;tickEnemies(dt);r286step();}`,g);
  g.window.__STORYWORLD_DYS_RANGED_R1210__={roleFor:()=> 'melee'};
  vm.runInContext(code1221,g);if(with1333)vm.runInContext(code,g);return g;}
 const mob=(g,o)=>{const e={id:o.id,name:o.name||o.id,hp:100,maxHp:100,x:20+(o.d||4),y:16,ai:'melee',cd:0,rest:o.rest,boss:!!o.boss,kind286:o.kind286||'full',spawnState:'active',...o.extra};g.room.enemies.push(e);return e;};
 const run=(g,secs)=>{for(let i=0;i<secs*30;i++)g.tick(1/30);};
 const cnt=(g,id,k)=>g.log.filter(r=>r.id===id&&r.kind===k).length;
  // 기준: R1221 만(이 오버레이 없음) — 일반 몹 첫 돌진이 실제로 생기는 세계
 const only1221=(()=>{const g=env({with1333:false});const m=mob(g,{id:'m',extra:{noWalk:true}});
  // 22~45초 기다린 뒤 발견 상황: 처음엔 멀리(돌진 거리 밖) 두었다가 46초에 4칸으로
  m.x=40;run(g,46);m.x=24;m.y=16;const before=cnt(g,'m','charge');const t0=g.time;
  for(let i=0;i<30*3;i++){g.tick(1/30);}const after=g.log.filter(r=>r.id==='m'&&r.kind==='charge'&&r.t>=t0);return {before,first:after.length,firstAt:after[0]?after[0].t-t0:null};})();
 ok('baseline R1221-only: late-spotted mob dashes on first sight ('+only1221.first+' dash, at +'+(only1221.firstAt==null?'-':only1221.firstAt.toFixed(2))+'s)',only1221.first>=1&&only1221.firstAt<1);
 // 1) 같은 상황에서 R1333 켜면 첫 돌진 없음
 {const g=env();const m=mob(g,{id:'m',extra:{noWalk:true}});m.x=40;run(g,46);m.x=24;m.y=16;const t0=g.time;run(g,3);const c=g.log.filter(r=>r.id==='m'&&r.kind==='charge'&&r.t>=t0).length;
  ok('late-spotted ordinary melee mob does NOT dash on first sight ('+c+')',c===0);}
 // 2) 처음부터 돌진 거리 안: 0~180초 동안 0번(첫 번째·이후 모두), 대신 걸어와 휘두름
 {const g=env();mob(g,{id:'m',extra:{noWalk:true}});mob(g,{id:'w'});run(g,180);ok('ordinary melee R52 dash = 0 in 180s, held in dash range ('+cnt(g,'m','charge')+')',cnt(g,'m','charge')===0);ok('ordinary mob still walks in and melee-swings ('+cnt(g,'w','melee')+')',cnt(g,'w','melee')>=20);}
 {const g=env({with1333:false});mob(g,{id:'m',extra:{noWalk:true}});run(g,180);ok('baseline R1221-only: held mob does dash ('+cnt(g,'m','charge')+')',cnt(g,'m','charge')>=1);}
 // 경계: 돌진 거리 경계 2.75·7.1칸에서 시작해도 0
 for(const d of [2.75,7.1]){const g=env();const m=mob(g,{id:'e',d,extra:{noWalk:true}});run(g,60);ok('edge distance '+d+' → no dash ('+cnt(g,'e','charge')+')',cnt(g,'e','charge')===0);}
 // 3) R286 attack-only 돌진 0
 {const g=env();mob(g,{id:'a',kind286:'attack-only',d:9});run(g,180);ok('R286 attack-only dash = 0 in 180s ('+cnt(g,'a','r286')+')',cnt(g,'a','r286')===0);}
 // 4) 보스·이름만 중간보스·페르소나도 돌진 0(끄면 R1221 리듬 ≥5 — 측정이 의미 있음)
 const bossCount=(w,o)=>{const g=env({with1333:w});mob(g,{...o,extra:{...(o.extra||{}),noWalk:true}});run(g,180);return cnt(g,o.id,'charge');};
 for(const [label,o] of [['boss',{id:'b',boss:true}],['midboss flag',{id:'md',extra:{midboss:true}}],['name-only midboss',{id:'mn',name:'중간보스 · 붉은 하이힐 칼날'}],['persona',{id:'p',extra:{persona:true}}]]){
  const a=bossCount(true,o),b=bossCount(false,o);ok(label+' R52 dash = 0 ('+a+', without R1333 '+b+')',a===0&&b>=5);}
 {const sw=w=>{const g=env({with1333:w});mob(g,{id:'bb',boss:true,d:1.5});run(g,20);return cnt(g,'bb','swing');};const a=sw(true),b=sw(false);ok('boss close swing untouched ('+a+' == '+b+')',a===b&&b>=5);}
 // 5) 끄기: R1221 리듬으로(일반 몹 드문 돌진 ≥1, R286 ≥1)
 {const g=env({ls:{'storyworld.r1333.nodash':'{"on":false}'}});mob(g,{id:'m',extra:{noWalk:true}});mob(g,{id:'a',kind286:'attack-only',d:9});run(g,180);
  ok('off → R1221 rare ordinary dash comes back ('+cnt(g,'m','charge')+')',cnt(g,'m','charge')>=1);ok('off → R1221 rare R286 dash comes back ('+cnt(g,'a','r286')+')',cnt(g,'a','r286')>=1);}
 {const g=env({ls:{'storyworld.r1333.nodash':'{"on":false}'}});mob(g,{id:'b',boss:true,extra:{noWalk:true}});run(g,180);ok('off → boss R52 dash comes back ('+cnt(g,'b','charge')+')',cnt(g,'b','charge')>=5);}
 // 회귀(Codex P2): R1221 을 끈 플레이어(storyworld.r1221.dash {"on":false})도 R1333 은 따로 적용 — R52·R286 돌진 0
 {const g=env({ls:{'storyworld.r1221.dash':'{"on":false}'}});mob(g,{id:'m',extra:{noWalk:true}});mob(g,{id:'a',kind286:'attack-only',d:9});mob(g,{id:'b',boss:true,extra:{noWalk:true}});run(g,60);
  ok('R1221 off + R1333 on: R52 dash 0 ('+cnt(g,'m','charge')+'/'+cnt(g,'b','charge')+')',cnt(g,'m','charge')===0&&cnt(g,'b','charge')===0);ok('R1221 off + R1333 on: R286 dash 0 ('+cnt(g,'a','r286')+')',cnt(g,'a','r286')===0);}
 // 둘 다 끄면 원래 리듬(R286 2.2초 간격)
 {const g=env({ls:{'storyworld.r1221.dash':'{"on":false}','storyworld.r1333.nodash':'{"on":false}'}});mob(g,{id:'a',kind286:'attack-only',d:9});run(g,30);ok('both off: original R286 rhythm ('+cnt(g,'a','r286')+')',cnt(g,'a','r286')>=8);}
 // R1221 끈 채 R1333 을 도중에 끄면 R286 이 돌아온다
 {const g=env({ls:{'storyworld.r1221.dash':'{"on":false}'}});mob(g,{id:'a',kind286:'attack-only',d:9});run(g,10);g.window.__STORYWORLD_MOB_NODASH_R1333__.set({on:false});run(g,10);ok('R1221 off, R1333 on→off: R286 resumes ('+cnt(g,'a','r286')+')',cnt(g,'a','r286')>=2);}
 // blocks(): 모든 몹 true, 빈 값 false, 끄면 false
 {const g=env();const N=g.window.__STORYWORLD_MOB_NODASH_R1333__;ok('blocks(): ordinary/boss/midboss/persona true, null false',N.blocks({name:'x'})===true&&N.blocks({boss:true})===true&&N.blocks({midboss:true})===true&&N.blocks({persona:true})===true&&N.blocks(null)===false);
  N.set({on:false});ok('blocks() false when off',N.blocks({boss:true})===false&&N.blocks({name:'x'})===false);}
 // 켠 채 시작해 도중에 끄면 R286 차례가 R1221 간격으로 돌아온다
 {const g=env();mob(g,{id:'a',kind286:'attack-only',d:9});run(g,30);g.window.__STORYWORLD_MOB_NODASH_R1333__.set({on:false});run(g,60);ok('on→off mid-game: R286 dash resumes ('+cnt(g,'a','r286')+')',cnt(g,'a','r286')>=1);}
 // 6) e.rest 보존·NaN 시간
 {const g=env();const u=mob(g,{id:'u'}),v=mob(g,{id:'v',rest:0});run(g,5);ok('e.rest stays undefined',!('rest' in u)||u.rest===undefined);ok('e.rest 0 stays 0',v.rest===0);}
 {const g=env();mob(g,{id:'n'});let threw=false;try{g.time=NaN;g.tick(1/30);g.time=0;run(g,3);}catch(e){threw=true;}ok('NaN time does not throw',!threw);}
 // 7) 점검
 {const g=env();mob(g,{id:'m'});run(g,20);const I=g.window.__STORYWORLD_MOB_NODASH_R1333__.inspect();ok('inspect has revision and blocked count',/R1333/.test(I.revision)&&I.stats.blocked>0);}
}
console.log(`R1333 mob-nodash: ${pass} passed, ${fail} failed`);process.exit(fail?1:0);
