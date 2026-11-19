// R1221 CPU 검사: 몹 공격 돌진 빈도 낮추기(사용자 2026-11-19 10:04Z "이제 이동모션 대부분 몹에 있는데 공격하면서 돌진하는거 없애던가 빈도수 낮춰줘").
// 돌진 원인 두 곳을 엔진과 같은 규칙의 작은 세계로 흉내 낸다.
//  ① 엔진 R52 근접 돌진(스토리 지역 R54 확장, 일반 근접 몹 8.8초·보스 7.7초마다, 2.75~7.1칸, 최대 3.7/4.6칸 이동)
//  ② R286 attack-only 몹 돌진(2.2초마다 최대 3.2칸)
// 기대: 일반 몹 R52 돌진 ≥4배 드물게, 보스 R52 는 유지하되 절반, R286 ≥5배 드물게, 원거리 역할 몹(R1214b roleFor)은 돌진 0,
//  보스 근접 휘두르기(2칸 안)는 막지 않음, e.rest 원래 값 그대로, 끄면 원래대로, NaN 시간에도 안 깨짐, 나중에 R52 가 바뀌어도 다시 감쌈.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const F='mob-dash-r1221.js',SRC=path.join(R,'client-source',F);
let pass=0,fail=0;const ok=(n,c)=>{if(c){pass++;console.log('PASS',n);}else{fail++;console.log('FAIL',n);}};
const exists=fs.existsSync(SRC);ok(F+' exists',exists);
if(exists){const code=fs.readFileSync(SRC,'utf8');
 try{new vm.Script(code);ok('syntax',true);}catch(e){ok('syntax '+e.message,false);}
 const rt=path.join(R,'runtime-text',F);ok('runtime copy matches source',fs.existsSync(rt)&&fs.readFileSync(rt,'utf8')===code);
 const html=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');ok('script tag once in index.html',html.split('src="./'+F+'"').length===2);
 ok('verify-r96-public lists it',fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8').includes(F));
 ok('pages.yml runs this check',fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8').includes('r96/qa/r1221/mob-dash-cpu-check.cjs'));
 function env({ranged=[],ls={}}={}){const g={localStorage:{_s:{...ls},getItem(k){return this._s[k]??null;},setItem(k,v){this._s[k]=String(v);}},console,Math,JSON,Number,String,Object,Array,WeakMap,Map,Set,Infinity,NaN,isFinite,setTimeout:()=>0};g.window=g;vm.createContext(g);
  vm.runInContext(`var time=0,zone="ep1b05",player={x:20,y:16,hp:1000},room={id:"ep1b05",enemies:[]};var log=[];
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  // 엔진 R52 의 시작 문(gate)·간격을 그대로: 공격 중·cd·rest 면 안 함, 2.75~7.1칸이면 nextCharge 마다 돌진, 보스는 2칸 안 휘두르기
  (function(){const st=new WeakMap();function s(e){let v=st.get(e);if(!v){v={nextCharge:time+1.8,nextSwing:time};st.set(e,v);}return v;}
   function tickEnemy(e,dt){if(!(e.ai==='melee'||e.boss))return false;const S=s(e);
    if(e.attack){e.attack.t+=dt;if(e.attack.t>1.2){e.attack=null;e.cd=1.45;}return true;}
    if(e.attack||e.rangedWindup>0||e.cd>0||e.rest>0)return false;const d=distance(e,player);
    if(time>=S.nextCharge&&d>=2.75&&d<=7.1){e.attack={r52Charge:true,t:0,id:Math.random()};S.nextCharge=time+(e.boss?7.7:8.8);log.push({id:e.id,kind:'charge',t:time});return true;}
    if(e.boss&&time>=S.nextSwing&&d<=2.0){S.nextSwing=time+1;e.attack={r52Charge:false,t:0,id:Math.random()};log.push({id:e.id,kind:'swing',t:time});return true;}return false;}
   window.__STORYWORLD_HOSPITAL_CHARGE_R52__=Object.freeze({tickEnemy,action:e=>e.attack,bodyPose:()=>null,clear(){},inspect:()=>({})});})();
  // R286 attack-only 돌진 흉내: e.r286 이 없으면 만들고 nextDash 가 되면 0.69초 돌진 후 2.2초 뒤 다음
  window.__STORYWORLD_MOB_MOTION_R286__={kindOf:e=>e.kind286||'full'};
  function r286step(){const now=time;for(const e of room.enemies){if(!(e.hp>0)||e.kind286!=='attack-only'||e.boss)continue;const s=e.r286||(e.r286={mode:null,t0:0,nextDash:now+.3,nextShot:now+3,side:1});
   if(s.mode){if(now-s.t0>=.69){s.mode=null;s.nextDash=now+2.2;}continue;}if(now>=s.nextDash&&!e.attack){s.mode='charge';s.t0=now;log.push({id:e.id,kind:'r286',t:now});}}}
  function tickEnemies(dt){for(const e of room.enemies){e.cd=Math.max(0,(e.cd||0)-dt);if(window.__STORYWORLD_HOSPITAL_CHARGE_R52__?.tickEnemy(e,dt))continue;}}
  function tick(dt){time+=dt;tickEnemies(dt);r286step();}`,g);
  g.window.__STORYWORLD_DYS_RANGED_R1210__={roleFor:n=>ranged.includes(String(n))?'ranged':'melee'};
  vm.runInContext(code,g);return g;}
 const mob=(g,o)=>{const e={id:o.id,name:o.name||o.id,hp:100,maxHp:100,x:20+(o.d||4),y:16,ai:'melee',cd:0,rest:o.rest,boss:!!o.boss,kind286:o.kind286||'full',spawnState:'active',...o.extra};g.room.enemies.push(e);return e;};
 const run=(g,secs)=>{for(let i=0;i<secs*30;i++)g.tick(1/30);};
 const cnt=(g,id,k)=>g.log.filter(r=>r.id===id&&r.kind===k).length;
 // 기준(오버레이 없는 같은 세계)
 const base=(()=>{const g=env({ls:{'storyworld.r1221.dash':'{"on":false}'}});mob(g,{id:'m'});mob(g,{id:'b',boss:true});mob(g,{id:'a',kind286:'attack-only',d:9});run(g,180);return {m:cnt(g,'m','charge'),b:cnt(g,'b','charge'),a:cnt(g,'a','r286')};})();
 ok('baseline (off) keeps original rhythm: ordinary R52 charges ≥15 in 180s ('+base.m+')',base.m>=15);
 ok('baseline boss charges ≥18 ('+base.b+')',base.b>=18);ok('baseline R286 dashes ≥50 ('+base.a+')',base.a>=50);
 const g=env({ranged:['원거리몹']});const m=mob(g,{id:'m'}),b=mob(g,{id:'b',boss:true}),a=mob(g,{id:'a',kind286:'attack-only',d:9}),r=mob(g,{id:'r',name:'원거리몹'}),ra=mob(g,{id:'ra',name:'원거리몹',kind286:'attack-only',d:9});
 run(g,180);const M=cnt(g,'m','charge'),B=cnt(g,'b','charge'),A=cnt(g,'a','r286');
 ok('ordinary R52 charge ≥4x rarer ('+M+' vs '+base.m+')',M*4<=base.m);ok('ordinary R52 charge not zero (rare, kept) '+M,M>=1);
 ok('boss R52 charge kept but about half ('+B+' vs '+base.b+')',B>=Math.floor(base.b*.35)&&B<=Math.ceil(base.b*.6));
 ok('R286 dash ≥5x rarer ('+A+' vs '+base.a+')',A*5<=base.a&&A>=1);
 ok('ranged-role mob never R52-charges',cnt(g,'r','charge')===0);ok('ranged-role mob never R286-dashes',cnt(g,'ra','r286')===0);
 // R1231: 근접 몹이 물러나 쏘는 단계(effRole==='ranged')에는 돌진하지 않는다(effRole 이 없으면 이름 역할만)
 {const h=env();h.window.__STORYWORLD_DYS_RANGED_R1210__={roleFor:()=> 'melee',effRole:e=>e.phaseRanged?'ranged':'melee'};mob(h,{id:'ph',extra:{phaseRanged:true}});mob(h,{id:'pa',kind286:'attack-only',d:9,extra:{phaseRanged:true}});mob(h,{id:'pm'});run(h,180);
  ok('effRole ranged phase never R52-charges',cnt(h,'ph','charge')===0);ok('effRole ranged phase never R286-dashes',cnt(h,'pa','r286')===0);ok('effRole melee still charges rarely ('+cnt(h,'pm','charge')+')',cnt(h,'pm','charge')>=1);}
 {const h=env();h.window.__STORYWORLD_DYS_RANGED_R1210__={roleFor:()=> 'melee',effRole:e=>e.phaseRanged?'ranged':'melee'};const q=mob(h,{id:'pq',kind286:'attack-only',d:9,extra:{phaseRanged:true}});run(h,30);q.phaseRanged=false;run(h,120);ok('R286 dashes again after ranged phase ends ('+cnt(h,'pq','r286')+')',cnt(h,'pq','r286')>=1);}
 // 회귀(헤드리스 ep1b05): 이름만 '중간보스 ·' 이고 midboss 표시가 없는 몹도 보스 간격(절반)으로
 {const h=env();mob(h,{id:'mn',name:'중간보스 · 붉은 하이힐 칼날'});run(h,180);const c=cnt(h,'mn','charge');ok('name-only midboss uses boss gap ('+c+')',c>=Math.floor(base.m*.35)&&c<=Math.ceil(base.m*.6));}
 // 경계: 보스 2칸 안 휘두르기는 막지 않음
 {const sw=on=>{const h=env(on?{}:{ls:{'storyworld.r1221.dash':'{"on":false}'}});mob(h,{id:'bb',boss:true,d:1.5});run(h,20);return cnt(h,'bb','swing');};const a=sw(true),b=sw(false);ok('boss close swing (≤2칸) untouched: '+a+' == off '+b,a===b&&b>=5);}
 // e.rest 원래 값 보존
 {const h=env();const u=mob(h,{id:'u'}),v=mob(h,{id:'v',rest:0});run(h,5);ok('e.rest stays undefined',!('rest' in u)||u.rest===undefined);ok('e.rest 0 stays 0',v.rest===0);}
 // 끄기
 {const h=env();h.window.__STORYWORLD_MOB_DASH_R1221__.set({on:false});const u=mob(h,{id:'u'});run(h,180);ok('set({on:false}) restores original rhythm ('+cnt(h,'u','charge')+')',cnt(h,'u','charge')>=15);}
 // NaN 시간
 {const h=env();mob(h,{id:'n'});let threw=false;try{h.time=NaN;h.tick(1/30);h.time=0;run(h,3);}catch(e){threw=true;}ok('NaN time does not throw',!threw);}
 // 나중에 R52 객체가 바뀌어도 다시 감싼다
 {const h=env();const o=h.window.__STORYWORLD_HOSPITAL_CHARGE_R52__;h.window.__STORYWORLD_HOSPITAL_CHARGE_R52__=Object.freeze({...o,tickEnemy(e,dt){return o.tickEnemy(e,dt);}});const u=mob(h,{id:'u'});run(h,180);ok('re-wraps replaced R52 ('+cnt(h,'u','charge')+')',cnt(h,'u','charge')*4<=base.m);}
 const I=g.window.__STORYWORLD_MOB_DASH_R1221__.inspect();ok('inspect has revision and stats',/R1221/.test(I.revision)&&I.stats&&I.stats.r52Blocked>0);
}
console.log(`R1221 mob-dash: ${pass} passed, ${fail} failed`);process.exit(fail?1:0);
