// R1275 CPU 검사: 모든 스킬·확률 패시브 레벨 해금 + 확률 패시브 3개 개별 강화 — 사용자 2026-11-20 09:50Z
//  "모든스킬일정레벨이상되면 해금되게 / 확률발동패시브스킬도 일정렙이상되어야 해금 qwer 확률발동 1 23순서임 /
//   그리고 확률발동패시브스킬도 스킬창에 3개각각 업가능하게".
//  ① 문턱: Q→W→E→R→패시브1→2→3 순서(엄격히 오름). 스토리·무한생존 모두 2·3·4·5·77·78·79.
//  ② R663 QWER: 배웠어도 문턱 전이면 잠김(모든 모드·함께하기 포함). 무한생존은 점수 없이 문턱만(생존은 패시브 포인트가 없음).
//     EGO R 소환 영웅(r1157Summon)은 문턱을 묻지 않는다(고유 확률 패시브·스킬 그대로).
//  ③ R1025 패시브 문턱은 R1275 표를 따름(R1275 없으면 예전 5·15·30 / 2·4·7 그대로).
//  ④ R237 자동 레벨업: 문턱 전 칸 때문에 점수를 묶어 두지 않고, 문턱 전 패시브 카드는 사지 않는다.
//  ⑤ R971 → 패시브 1·2·3 카드 3장(각 0~7단계, 비용 = 다음 단계). 갈래별로 따로 확률·재발동 대기 적용. 예전 카드 단계는 세 장 모두로 옮김.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..');
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return'';}};
const C=f=>rd(path.join(R,'client-source',f)),RT=f=>rd(path.join(R,'runtime-text',f));
let pass=0,fail=0;const ok=(n,c,x)=>{if(c){pass++;console.log('PASS',n);}else{fail++;console.log('FAIL',n,x!==undefined?JSON.stringify(x).slice(0,300):'');}};
const near=(a,b,e=1e-9)=>Math.abs(a-b)<=e;
const F='skill-unlock-r1275.js',API='__STORYWORLD_SKILL_UNLOCK_R1275__';
const src=C(F);ok(F+' 있음',src.length>0);
ok('runtime-text 사본 = client-source',src.length>0&&RT(F)===src);
try{new vm.Script(src);ok('문법',src.length>0);}catch(e){ok('문법 '+e.message,false);}
const html=RT('index.html');
ok('index.html 태그 한 번',html.split('<script src="./'+F+'"></script>').length===2);
ok('태그는 story-art-r1092 바로 뒤(패시브 컷인 R1033 → R1092 자리는 그대로)',html.includes('<script src="./story-art-r1092.js"></script>\n<script src="./'+F+'"></script>'));
ok('verify-r96-public.py 기대 목록',rd(path.join(ROOT,'scripts/verify-r96-public.py')).includes("'"+F+"'"));
ok('pages.yml CPU 검사 줄',rd(path.join(ROOT,'.github/workflows/pages.yml')).includes('node r96/qa/r1275/r1275-cpu-check.cjs'));
ok('runtime-manifest·inputs 등록',rd(path.join(R,'runtime-manifest.json')).includes(F)&&rd(path.join(R,'runtime-inputs.json')).includes(F));
for(const f of ['skill-growth-r663.js','passive-growth-r971.js','passive-unlock-r1025.js','auto-levelup-r237.js','hwando-ink-r945.js','slayer-blood-passive-r947.js','gunner-veil-r953.js','hunter-squad-r952.js','lauren-celestial-r946.js'])
 ok(f+': runtime-text 사본 = client-source',C(f).length>0&&RT(f)===C(f));

// ── 공통 가짜 게임 ──
function mk(opt={}){
 const listeners={},store=Object.assign({},opt.ls||{});
 const state={version:1,ranks:Object.assign({},opt.ranks||{}),clears:{},pointDropClaimsR64:{'r64:skillgrowth-r663':true}};
 const defs=[{id:'endlessPower',name:'끝없는 의지',icon:'haste',cost:1,maxRank:5}];
 const ctx={console,JSON,Math,Number,Object,Array,String,Set,WeakMap,Map,isFinite,Date,
  started:true,modal:null,loading:false,storyScene:null,time:0,layer:'STORY',UPGRADES:[],rank:()=>0,
  player:Object.assign({hero:'hwando',hp:100,level:1,points:0,storyWER:{ready:{},buffs:{}}},opt.player||{}),visited:new Set(),progress:{STORY:{},DREAM:{}},
  HEROES:{hwando:{special:'정화 연참'}},toasts:[],toast(m){ctx.toasts.push(m);},updateHUD(){},saveGame(){},
  localStorage:{getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v);}},
  document:{readyState:'complete',getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>({style:{},classList:{add(){},remove(){},toggle(){}}}),head:{appendChild(){}},body:{classList:{contains:()=>false}}},
  setTimeout:()=>0,setInterval:()=>0,window:{}};
 const W=ctx.window;W.window=W;W.addEventListener=(t,f)=>{(listeners[t]=listeners[t]||[]).push(f);};ctx.addEventListener=W.addEventListener;
 const surv={on:!!opt.survival,lv:opt.survLv||1};
 W.__STORYWORLD_SURVIVAL_R600__={here:()=>surv.on,active:()=>surv.on,state:()=>surv.on?{lv:surv.lv}:null};
 if(opt.coop)W.__STORYWORLD_COOP_SIM_R62__={mode:()=>'host'};
 W.__STORYWORLD_WER__=Object.freeze({defs:{hwando:{w:['월섬 회천',5],e:['백은 유영보',4.5],r:['EGO 환수검',13]}},cast(){return true;}});
 const ranks=id=>Number(state.ranks[id])||0;
 W.__STORYWORLD_PROGRESSION_R62__=Object.freeze({defs,state:()=>state,ranks,purchase(id){const d=defs.find(x=>x.id===id);if(!d)return false;const c=Number(d.cost)||1;if(ctx.player.points<c||ranks(id)>=(d.maxRank??99))return false;ctx.player.points-=c;state.ranks[id]=ranks(id)+1;return true;}});
 W.__STORYWORLD_UPGRADES_R169__={buyTalent:()=>false};
 vm.createContext(ctx);
 vm.runInContext('var special=function(){return true;};var tick=function(){};var hitEnemy=function(){};var fx=function(){};var makeShot=function(){};var delay=function(){};var moveActor=function(){},clearLine=function(){},blocked=function(){},findPath=function(){},killEnemy=function(){};var serializeSave=function(){return {};};',ctx);
 const errs=[];
 for(const f of (opt.files||['passive-growth-r971.js','passive-unlock-r1025.js',F,'skill-growth-r663.js','auto-levelup-r237.js'])){try{vm.runInContext('var window=this.window;'+C(f),ctx,{filename:f});}catch(e){errs.push(f+': '+e.message);}}
 (listeners.load||[]).forEach(f=>{try{f();}catch(e){errs.push('load: '+e.message);}});
 return{ctx,W,state,surv,errs,api:W[API],u:W.__STORYWORLD_PASSIVE_UNLOCK_R1025__,g:W.__STORYWORLD_PASSIVE_GROWTH_R971__,s:W.__STORYWORLD_SKILL_GROWTH_R663__,a:W.__STORYWORLD_AUTOLEVEL_R237__,defs};}

const A=mk();ok('다섯 모듈이 오류 없이 올라옴',A.errs.length===0&&!!A.api,A.errs);
if(A.api){const L=A.api;
 // ① 문턱
 const ORDER=['q','w','e','r','p1','p2','p3'];
 ok('순서 Q→W→E→R→패시브1→2→3',JSON.stringify(L.order())===JSON.stringify(ORDER));
 const st=L.levels('story'),sv=L.levels('survival');
 ok('스토리 문턱 2·3·4·5·77·78·79',JSON.stringify(ORDER.map(k=>st[k]))==='[2,3,4,5,77,78,79]',st);
 ok('무한생존 문턱 2·3·4·5·30·31·32(사용자 11-21)',JSON.stringify(ORDER.map(k=>sv[k]))==='[2,3,4,5,30,31,32]',sv);
 for(const m of ['story','survival']){const t=L.levels(m);ok(m+': 문턱이 엄격히 오름(같은 레벨에 둘이 열리지 않음)',ORDER.every((k,i)=>i===0||t[k]>t[ORDER[i-1]]));}
 ok('패시브 문턱 묶음: 스토리 [77,78,79] · 생존 [30,31,32]',JSON.stringify(L.passiveLevels('story'))==='[77,78,79]'&&JSON.stringify(L.passiveLevels('survival'))==='[30,31,32]');
 ok('at(): 생존 p1 30 · 스토리 p1 77',L.at('p1','survival')===30&&L.at('p1','story')===77);
 const lk=(lv,s)=>{A.ctx.player.level=lv;return L.locked(s);};
 ok('스토리 Lv1: Q 잠김',lk(1,'q')===true);
 ok('스토리 Lv2: Q 열림·W 잠김',lk(2,'q')===false&&lk(2,'w')===true);
 ok('스토리 Lv4: E 열림·R 잠김 / Lv5 R 열림',lk(4,'e')===false&&lk(4,'r')===true&&lk(5,'r')===false);
 ok('스토리 Lv76: 패시브1 잠김 / Lv77 열림',lk(76,'p1')===true&&lk(77,'p1')===false);
 ok('스토리 Lv77·78·79 경계',lk(77,'p2')===true&&lk(78,'p2')===false&&lk(78,'p3')===true&&lk(79,'p3')===false);
 ok('스토리 Lv777: 모두 열림',ORDER.every(s=>lk(777,s)===false));
 ok('이상한 칸 이름은 잠그지 않음',lk(1,'zz')===false);
 A.ctx.player.level=1;A.ctx.player.r1157Summon=true;ok('EGO R 소환 영웅 몸(r1157Summon)은 문턱 없음',ORDER.every(s=>L.locked(s)===false));delete A.ctx.player.r1157Summon;
 // ② R663 결합
 A.state.ranks.skillWR663=1;A.state.ranks.skillQR663=1;
 A.ctx.player.level=2;ok('R663: W 를 배웠어도 Lv2 면 잠김',A.s.locked('w')===true&&A.s.locked('q')===false);
 A.ctx.player.level=3;ok('R663: Lv3 이면 배운 W 열림',A.s.locked('w')===false);
 ok('R663: Lv3 이라도 안 배운 E 는 잠김(스토리는 점수로 배움 그대로)',A.s.locked('e')===true);
 A.ctx.player.level=1;ok('R663: Lv1 이면 배운 Q 도 잠김',A.s.locked('q')===true);
 ok('R663 scale(): 잠긴 칸은 locked',A.s.scale('q').locked===true);
}
// 회귀: 새 게임 표식(R663 settle)은 문턱보다 먼저 — Lv1 새 게임이 Lv2 에서 '예전 저장'으로 오인돼 QWER 를 공짜로 받지 않음(헤드리스에서 찾은 버그)
{const N=mk({player:{level:1}});N.state.pointDropClaimsR64={};N.s.locked('q');N.ctx.player.level=2;N.s.locked('w');
 ok('새 게임 Lv1 → Lv2: W·E·R 를 공짜로 받지 않음',!(N.state.ranks.skillWR663>0)&&!(N.state.ranks.skillRR663>0)&&N.state.pointDropClaimsR64['r64:skillgrowth-r663']===true,N.state.ranks);
 const O=mk({player:{level:9}});O.state.pointDropClaimsR64={};O.s.locked('q');ok('예전 저장(Lv9) 은 그대로 QWER 1단계 이어받음',O.state.ranks.skillRR663===1);}
// 무한생존: 점수 없이 문턱만
{const S=mk({survival:true,survLv:1,player:{level:40}});
 ok('생존: 모듈 올라옴',S.errs.length===0,S.errs);
 ok('생존 Lv1: Q 잠김(이어 온 영웅 레벨 40 이 아니라 생존 레벨)',S.s.locked('q')===true);
 S.surv.lv=5;ok('생존 Lv5: 점수 0·배우기 0 이어도 Q·W·E·R 열림',['q','w','e','r'].every(s=>S.s.locked(s)===false)&&S.ctx.player.points===0);
 S.surv.lv=3;ok('생존 Lv3: E·R 잠김',S.s.locked('e')===true&&S.s.locked('r')===true&&S.s.locked('w')===false);
 S.surv.lv=30;ok('생존 Lv30: 패시브1 해금 / Lv31 2 / Lv32 3 (R1025 문턱이 R1275 표)',S.u.unlocked('hwando','moon')&&!S.u.unlocked('hwando','clones'));
 S.surv.lv=31;ok('생존 Lv31: 패시브2',S.u.unlocked('hwando','clones')&&!S.u.unlocked('hwando','trio'));
 S.surv.lv=32;ok('생존 Lv32: 패시브3',S.u.unlocked('hwando','trio'));
 S.surv.lv=29;ok('생존 Lv29: 패시브 모두 잠김',!S.u.unlocked('hwando','moon'));
 S.surv.lv=29;ok('생존 Lv29: 패시브1 카드 잠김(locked p1)',S.api.locked('p1')===true&&S.api.locked('r')===false);
 S.surv.lv=30;ok('생존 Lv30: 패시브1 카드 열림·2 잠김',S.api.locked('p1')===false&&S.api.locked('p2')===true);
 S.surv.lv=777;ok('생존 Lv777: 모두 열림',['q','w','e','r','p1','p2','p3'].every(k=>S.api.locked(k)===false));
 S.surv.lv=40;S.surv.on=false;S.ctx.player.level=40;ok('회귀: 생존 아닐 때 Lv40 은 스토리 문턱이라 패시브1 잠김',S.api.locked('p1')===true&&!S.u.unlocked('hwando','moon'));S.surv.on=true;}
// 함께하기(방장)도 문턱은 적용
{const H=mk({coop:true,player:{level:1}});ok('함께하기: Lv1 Q 잠김',H.s.locked('q')===true);H.ctx.player.level=5;ok('함께하기: Lv5 이면 점수 규칙 없이 열림(R663 은 혼자만 점수 규칙)',H.s.locked('r')===false);}
// ③ R1025 문턱이 R1275 를 따름
{const S=mk({player:{level:5}});ok('스토리 Lv5: 패시브1 아직 잠김(예전엔 Lv5 해금)',!S.u.unlocked('hwando','moon'));S.ctx.player.level=77;ok('스토리 Lv77: 패시브1 해금',S.u.unlocked('hwando','moon')&&!S.u.unlocked('hwando','clones'));
 ok('R1025 levels() 가 R1275 표를 보고함',JSON.stringify(S.u.levels('story'))==='[77,78,79]');
 const solo=mk({files:['passive-unlock-r1025.js']});ok('R1275 없으면 R1025 예전 문턱 그대로',JSON.stringify(solo.u.levels('story'))==='[5,15,30]'&&JSON.stringify(solo.u.levels('survival'))==='[2,4,7]');
 S.ctx.player.level=1;S.ctx.player.r1157Summon=true;S.ctx.player.r720Ally=true;ok('R1025: EGO R 소환 몸은 갈래 모두 열림',S.u.unlocked('hunter','squad')&&S.u.unlocked('seoha','arbelia'));}
// ④ R237 자동 레벨업
{const S=mk({player:{level:2,points:3},ranks:{skillQR663:1}});
 const c=S.a.candidates().map(x=>x.id);ok('R237: W 가 Lv 문턱 전이면 점수를 묶어 두지 않음(다른 후보 있음)',!c.includes('skillWR663')&&c.length>0,c);
 S.ctx.player.level=3;const c2=S.a.candidates().map(x=>x.id);ok('R237: Lv3 이면 W 배우기 하나만 후보',c2.join()==='skillWR663',c2);
 S.ctx.player.level=76;S.state.ranks.skillWR663=1;S.state.ranks.skillER663=1;S.state.ranks.skillRR663=1;S.ctx.player.points=50;
 const c3=S.a.candidates().map(x=>x.id);ok('R237: Lv76 이면 패시브 카드 후보 없음',!c3.some(id=>/heroPassive/.test(id)),c3);
 S.ctx.player.level=77;const c4=S.a.candidates().map(x=>x.id);ok('R237: Lv77 이면 패시브1 카드만 후보(2·3 은 잠김)',c4.includes('heroPassiveT1R1275')&&!c4.includes('heroPassiveT2R1275')&&!c4.includes('heroPassiveT3R1275'),c4);
 ok('R237: 예전 통합 카드(heroPassiveR971)는 사지 않음',!c4.includes('heroPassiveR971'));}
// Every hero reads the same threshold in Story, DREAM, 777 and survival.
for(const [mode,layer] of [['story','STORY'],['story','DREAM'],['777','STORY'],['survival','STORY']]){
 const S=mk({survival:mode==='survival',player:{level:222}});
 S.ctx.layer=layer;
 if(mode==='777')S.W.__STORYWORLD_CHEAT777__={active:()=>true};
 const heroes=['hwando','lauren','slayer','michaela','seoha','neon','hunter','gunner'];
 const base=mode==='survival'?30:77;
 for(const lv of [base-1,base,base+1,base+2]){
  if(mode==='survival')S.surv.lv=lv;else S.ctx.player.level=lv;
  const expected=Array.from({length:3},(_,i)=>lv>=base+i?1:0);
  ok(`${mode}/${layer} ${lv} 확률 갈래`,heroes.every(hero=>S.u.tiers(hero).every((tier,i)=>tier.every(kind=>S.u.mask(hero,[1],[kind])[0]===expected[i]))));
 }
}
// A locked card must neither spend a point nor clear investment from a prior save.
{
 const ids=['heroPassiveT1R1275','heroPassiveT2R1275','heroPassiveT3R1275'];
 const S=mk({player:{hero:'gunner',level:76,points:20},ranks:{heroPassiveR971:3}});
 S.api.migrate();const buy=id=>S.W.__STORYWORLD_PROGRESSION_R62__.purchase(id);
 ok('Lv76 기존 투자 보존, 구매 거부',ids.every(id=>S.state.ranks[id]===3&&!buy(id))&&S.ctx.player.points===20&&!buy('heroPassiveR971'),S.state.ranks);
 S.ctx.player.level=77;ok('Lv77 기존 랭크 재활성, 갈래1 구매만 승인',buy(ids[0])&&!buy(ids[1])&&S.state.ranks[ids[0]]===4&&S.state.ranks[ids[1]]===3&&S.ctx.player.points===16,S.state.ranks);
 ok('Lv77: 기억사수 은신만 굴림에 남음',JSON.stringify(S.u.mask('gunner',[.1,.07,.03],['cloak','barrage','summon']))==='[0.1,0,0]');
 const A=mk({coop:true,player:{level:90,points:20}}),peer={level:76,points:20};
 ok('함께하기: 방장 레벨로 동료의 잠긴 카드 구매를 승인하지 않음',!A.W.__STORYWORLD_PROGRESSION_R62__.purchase(ids[0],peer)&&peer.points===20);
}

// ⑤ R971 → 카드 3장
{const S=mk({player:{level:777,hero:'hwando'}});const g=S.g,ids=['heroPassiveT1R1275','heroPassiveT2R1275','heroPassiveT3R1275'];
 ok('R62 칸에 패시브 1·2·3 카드 3장',ids.every(id=>S.defs.some(d=>d.id===id&&d.maxRank===7)));
 const d1=S.defs.find(d=>d.id===ids[0]);ok('카드 이름 = 지금 영웅 갈래(환도 패시브1 묵월)',/묵월/.test(d1.name)&&/1/.test(d1.name),d1.name);
 ok('카드 비용 = 다음 단계(0단계 → 1점)',d1.cost===1);S.state.ranks[ids[0]]=3;ok('3단계 → 4점',d1.cost===4);S.state.ranks[ids[0]]=0;
 const base=[.18,.06,.03];
 const same=r=>{for(const id of ids)S.state.ranks[id]=r;return g.chances('hwando',base);};
 const ref=r=>{S.state.ranks={heroPassiveR971:r};const v=g.chances('hwando',base);S.state.ranks={};return v;};
 ok('세 장 같은 단계 = 예전 통합 카드 같은 단계와 똑같음(0·3·7)',[0,3,7].every(r=>{const a=ref(r),b=same(r);return a.every((x,i)=>near(x,b[i],1e-12));}));
 S.state.ranks={[ids[0]]:7};const v=g.chances('hwando',base),k7=ref(7)[0]/.18;
 ok('패시브1만 7단계: 묵월만 오르고 칠묵영·삼협묵희 그대로',near(v[0],.18*k7,1e-12)&&near(v[1],.06)&&near(v[2],.03),v);
 S.state.ranks={[ids[2]]:7};const v3=g.chances('hwando',base);ok('패시브3만 7단계: 삼협묵희만 오름',near(v3[0],.18)&&near(v3[1],.06)&&v3[2]>.03,v3);
 S.state.ranks={[ids[0]]:7};ok('재발동 대기: 패시브1 7단계 → 묵월 ×0.51, 삼협묵희 그대로',near(g.cooldown('hwando',10,'moon'),5.1,1e-9)&&near(g.cooldown('hwando',10,'trio'),10));
 S.state.ranks={heroPassiveR971:4};ok('예전 카드 단계는 세 갈래 모두에 적용(읽기)',JSON.stringify(g.tierRanks())==='[4,4,4]');
 S.api.migrate();ok('예전 카드 단계 → 세 장으로 옮기고 예전 칸 0',S.state.ranks[ids[0]]===4&&S.state.ranks[ids[1]]===4&&S.state.ranks[ids[2]]===4&&!(S.state.ranks.heroPassiveR971>0),S.state.ranks);
 S.state.ranks={heroPassiveR971:2,[ids[1]]:5};S.api.migrate();ok('옮길 때 더 높은 단계를 지킴',S.state.ranks[ids[0]]===2&&S.state.ranks[ids[1]]===5&&S.state.ranks[ids[2]]===2);
 // 한 확률 + 비중 뽑기(미카엘라): 갈래별 실제 확률 = 기본 비중 × 그 갈래 배수
 S.ctx.player.hero='michaela';S.state.ranks={[ids[0]]:7};const c=.11;const tot=g.chances('michaela',[c])[0],sh=S.u.share('michaela');
 const WS=S.u.weights('michaela',[['volley',.55],['tower',.30],['bloom',.15]]);const sum=WS.reduce((n,w)=>n+w[1],0);const k=g.tierMult('michaela','volley');
 const pv=tot*sh*WS[0][1]/sum,pt=tot*sh*WS[1][1]/sum;
 const k0=g.tierMult('michaela','tower');/* 0단계 배수 = R1207 최소 11.1%/기본 11% */
 ok('미카엘라 패시브1 7단계: 하트 세례 확률 = .11×.55×배수, 오르골탑 = .11×.30×0단계 배수 그대로',k>1&&near(k0,.111/.11,1e-12)&&near(pv,c*.55*k,1e-12)&&near(pt,c*.30*k0,1e-12),{pv,pt,k,k0});
 S.state.ranks={};ok('0단계 미카엘라: 갈래 배수 모두 같고 확률은 예전 0단계(11.1%)',near(g.tierMult('michaela','volley'),g.tierMult('michaela','bloom'))&&near(g.chances('michaela',[c])[0],.111,1e-12));
 S.state.ranks={[ids[1]]:7};ok('미카엘라 재발동 대기(한 대기 공유): 갈래 비중 가중 평균 단계로',near(g.cooldown('michaela',10),10*(1-.07*7*.30),1e-9),g.cooldown('michaela',10));
 ok('오류 0',g.inspect().lastError===null&&S.api.inspect().lastError===null,[g.inspect().lastError,S.api.inspect().lastError]);}
// ⑤-2 회귀(PR #928 리뷰, Dots 루프 QA 12:20Z): 예전 통합 카드 4단계·점수 5 에서 이관(700ms 틱)보다 자동 구매가 먼저 돌아도 점수만 쓰이고 단계가 그대로면 안 됨
{const S=mk({player:{level:777,points:5},ranks:{heroPassiveR971:4,skillQR663:1,skillWR663:1,skillER663:1,skillRR663:1}});
 const id='heroPassiveT1R1275',d=S.defs.find(x=>x.id===id);
 ok('이관 전 가격 조회 = 이관 뒤 가격(5점)',d.cost===5);
 ok('가격을 읽는 순간 이관 끝(세 장 4단계, 예전 칸 0)',S.state.ranks[id]===4&&S.state.ranks.heroPassiveT2R1275===4&&!(S.state.ranks.heroPassiveR971>0),S.state.ranks);
 S.ctx.player.points=5;const ok1=S.W.__STORYWORLD_PROGRESSION_R62__.purchase(id);S.api.migrate();
 ok('5점으로 산 뒤 패시브1 = 5단계(순증가 1), 이관을 다시 돌려도 그대로',ok1&&S.state.ranks[id]===5&&S.ctx.player.points===0,S.state.ranks);
 const S2=mk({player:{level:777,points:5},ranks:{heroPassiveR971:4,skillQR663:1,skillWR663:1,skillER663:1,skillRR663:1}});S2.a.step(true);
 const r=S2.state.ranks,tr=[r.heroPassiveT1R1275,r.heroPassiveT2R1275,r.heroPassiveT3R1275];ok('자동 구매가 첫 이관보다 먼저 돌아도 이관이 먼저(예전 칸 0·세 장 ≥4), 산 패시브 카드는 순증가',!(r.heroPassiveR971>0)&&tr.every(v=>v>=4)&&S2.a.inspect().stats.last.filter(x=>/특수 패시브/.test(x)).length===tr.reduce((a,b)=>a+b,0)-12,{r,last:S2.a.inspect().stats.last});}
// ⑥ 패시브 모듈 손질
ok('환도·슬레이어·기억사수: 재발동 대기에 갈래 이름을 넘김',/D971\('hwando',CFG\[k\]\.icd,k\)/.test(C('hwando-ink-r945.js'))&&/D971\(HERO,CFG\[k\]\.icd,k\)/.test(C('slayer-blood-passive-r947.js'))&&/D971\(HERO,CFG\[k\]\.icd,k\)/.test(C('gunner-veil-r953.js')));
ok('세 모듈 D971 헬퍼가 갈래를 cooldown 에 넘김',['hwando-ink-r945.js','slayer-blood-passive-r947.js','gunner-veil-r953.js'].every(f=>/D971=\(h,s,k\)=>\{[^\n]*cooldown\(h,s,k\)/.test(C(f))));
ok('헌터: 단계 뽑기 비중에 갈래 배수(K1275)',/t\[k\]\*K1275\(HERO,k\)/.test(C('hunter-squad-r952.js')));
ok('라우렌: EGO 천체 공명도 패시브1 문턱 뒤에만',/egoOwner\(o\)\)\{if\(!A1025\('hwando','moon'\)\)return 0;/.test(C('lauren-celestial-r946.js')));
console.log((fail?'FAIL':'OK')+' r1275 '+pass+'/'+(pass+fail));process.exit(fail?1:0);
