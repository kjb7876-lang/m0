// R1025 CPU 검사: 영웅 특수 패시브(확률 발동) 레벨별 순차 해금 — 사용자 2026-11-14 01:43Z
//  "영웅별 특수확률발동패시브 어느정도 레벨올랐을때 순차적 풀리도록 특히 영웅소환하는 패시브들 서하같은경우 영웅이미지가 그대로 나오고
//   모션도 똑같이 해야함 그리고 아직 영웅서사가 진행되지 않은경우에는 그영웅이 소환안되도록 해줘
//   (무한생존모드는 서사진행안되도 풀려도됨 ... 비교적 빠른레벨에 풀리게)".
//  · 영웅마다 갈래 3단(흔한 것 → 드문 것). 스토리(영화 모드 포함)는 영웅 레벨 5·15·30, 무한생존은 생존 레벨 2·4·7.
//  · 잠긴 갈래는 굴리지 않는다(갈래별 확률이면 0, 한 확률+비중 뽑기면 확률 × 열린 비중 몫, 열린 갈래 안에서만 뽑기).
//  · 소환되는 영웅(서하 평행세계 소집의 영웅들·헌터 혈맹 호출의 슬레이어)은 스토리에서 그 영웅 서사 지역에 들어선 뒤에만.
//    서사 지역 = 영화 모드(R461) 화자→영웅 규칙과 같음: 의목사 A → 헌터·슬레이어, 미카엘라의 기억, 의목사 B → 기억사수, 환도의 기억, 윤서하의 기억.
//    화자가 아닌 라우렌은 처음 이름이 나오는 지역, 정본에 없는 네온은 스토리에서 소환하지 않는다. 무한생존은 늘 열림.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..');
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return'';}};
const C=f=>rd(path.join(R,'client-source',f)),RT=f=>rd(path.join(R,'runtime-text',f));
let pass=0,fail=0;const ok=(n,c)=>{if(c){pass++;console.log('PASS',n);}else{fail++;console.log('FAIL',n);}};
const near=(a,b,e=1e-9)=>Math.abs(a-b)<=e;
const F='passive-unlock-r1025.js',API='__STORYWORLD_PASSIVE_UNLOCK_R1025__';
const src=C(F);ok(F+' 있음',src.length>0);
ok('runtime-text 사본 = client-source',src.length>0&&RT(F)===src);
try{new vm.Script(src);ok('문법',src.length>0);}catch(e){ok('문법 '+e.message,false);}
const html=RT('index.html');
ok('index.html 태그 한 번',html.split('<script src="./'+F+'"></script>').length===2);
ok('태그는 passive-growth-r971 바로 뒤',html.includes('<script src="./passive-growth-r971.js"></script>\n<script src="./'+F+'"></script>'));
ok('verify-r96-public.py 기대 목록',rd(path.join(ROOT,'scripts/verify-r96-public.py')).includes("'"+F+"'"));
ok('pages.yml CPU 검사 줄',rd(path.join(ROOT,'.github/workflows/pages.yml')).includes('node r96/qa/r1025/r1025-cpu-check.cjs'));
ok('runtime-manifest·inputs 등록',rd(path.join(R,'runtime-manifest.json')).includes(F)&&rd(path.join(R,'runtime-inputs.json')).includes(F));
ok('새 키·저장 쓰기 없음',!/addEventListener\(\s*['"]key|saveGame\(|localStorage\.setItem/.test(src));

// ── 8개 패시브 모듈이 굴림·뽑기에서 해금을 묻는다 ──
const MODS={hwando:'hwando-ink-r945.js',lauren:'lauren-celestial-r946.js',slayer:'slayer-blood-passive-r947.js',michaela:'michaela-heart-r948.js',seoha:'seoha-epoch-r949.js',neon:'neon-storm-r951.js',hunter:'hunter-squad-r952.js',gunner:'gunner-veil-r953.js'};
for(const[h,f]of Object.entries(MODS)){const s=C(f);
 ok(f+': 해금 API 를 물음(U1025·S1025 중 하나로 굴림)',s.includes(API)&&/(U1025|S1025)\(HERO|U1025\('hwando'/.test(s));
 ok(f+': runtime-text 사본 = client-source',RT(f)===s);
 try{new vm.Script(s);ok(f+': 문법',true);}catch(e){ok(f+': 문법 '+e.message,false);}}
ok('환도·슬레이어·기억사수: 갈래별 확률에 해금 곱(잠기면 0)',
 /U1025\('hwando',G971\('hwando',\[CFG\.moon\.chance,CFG\.clones\.chance,CFG\.trio\.chance\]\),\['moon','clones','trio'\]\)/.test(C(MODS.hwando))&&
 /U1025\(HERO,G971\(HERO,\[CFG\.needle\.chance,CFG\.swords\.chance,CFG\.lattice\.chance\]\),\['needle','swords','lattice'\]\)/.test(C(MODS.slayer))&&
 /U1025\(HERO,G971\(HERO,\[CFG\.cloak\.chance,CFG\.barrage\.chance,CFG\.summon\.chance\]\),\['cloak','barrage','summon'\]\)/.test(C(MODS.gunner)));
ok('라우렌·미카엘라·네온·서하: 확률 × 열린 비중 몫(S1025)',['lauren','michaela','neon','seoha'].every(h=>/S1025\(HERO\)/.test(C(MODS[h]))));
ok('라우렌·미카엘라·네온·서하: 뽑기는 열린 갈래만(W1025)',['lauren','michaela','neon','seoha'].every(h=>/W1025\(/.test(C(MODS[h]))));
ok('라우렌: 쌍성 소멸(violet) 연계도 해금 뒤에만',/comboOf\(s,t\)&&A1025\(HERO,'violet'\)/.test(C(MODS.lauren)));
ok('헌터: 확률 × 열린 몫, 단계 뽑기는 열린 단계만',/S1025\(HERO\)/.test(C(MODS.hunter))&&/pickTier1025\(/.test(C(MODS.hunter)));
ok('헌터: 슬레이어 서사 전이면 슬레이어 없이(기러기진만)',/O1025\(ALLY\)/.test(C(MODS.hunter)));
ok('서하: 소집 영웅은 서사 열린 영웅만(O1025)',/O1025\(/.test(C(MODS.seoha))&&/function others\(\)\{[^}]*O1025\(k\)/.test(C(MODS.seoha)));
ok('서하: 미리 고른 셋(trio)도 서사 확인을 거침',/pool=\[\.\.\.trio\.filter\(k=>O1025\(k\)\)/.test(C(MODS.seoha)));
ok('서하·헌터: 소환 몸은 진짜 영웅 그리기(drawHero) 그대로',/as\(s,\(\)=>drawHero\(\)\)/.test(C(MODS.seoha))&&/as\(u,\(\)=>drawHero\(\)\)/.test(C(MODS.hunter)));

// ── vm: 모듈 단독 ──
function mk(opt={}){
 const listeners={};
 const ctx={console,JSON,Math,Number,Object,Array,String,Set,WeakMap,Map,isFinite,
  player:Object.assign({hero:'hwando',hp:100,level:1},opt.player||{}),visited:new Set(opt.visited||[]),progress:{STORY:{},DREAM:{}},layer:'STORY',zone:'dist00',
  toast:m=>{ctx.toasts.push(m);},toasts:[],document:{readyState:'complete'},setTimeout:()=>0,localStorage:{getItem:k=>opt.ls?.[k]??null},window:{}};
 const W=ctx.window;W.window=W;W.addEventListener=(t,f)=>{(listeners[t]=listeners[t]||[]).push(f);};
 const surv={on:!!opt.survival,lv:opt.survLv||1};
 W.__STORYWORLD_SURVIVAL_R600__={here:()=>surv.on,active:()=>surv.on,state:()=>surv.on?{lv:surv.lv}:null};
 vm.createContext(ctx);let err=null;try{vm.runInContext(src,ctx);}catch(e){err=e;}
 (listeners.load||[]).forEach(f=>f());
 return{ctx,W,err,surv,api:W[API]};}
const A=mk();ok('오류 없이 올라옴'+(A.err?' ('+A.err.message+')':''),!A.err&&!!A.api);
const HEROES=['hwando','lauren','slayer','michaela','seoha','neon','hunter','gunner'];
const TIERS={hwando:[['moon'],['clones'],['trio']],lauren:[['repulse'],['red','blue'],['meteor','violet']],slayer:[['needle'],['swords'],['lattice']],
 michaela:[['volley'],['tower'],['bloom']],seoha:[['collapse'],['heroes'],['arbelia']],neon:[['lance'],['fog'],['storm']],hunter:[['call'],['shade'],['squad']],gunner:[['cloak'],['barrage'],['summon']]};
if(A.api){const u=A.api;
 ok('문턱: 스토리 5·15·30, 무한생존 2·4·7',JSON.stringify(u.levels('story'))==='[5,15,30]'&&JSON.stringify(u.levels('survival'))==='[2,4,7]');
 ok('무한생존 문턱이 단마다 스토리보다 낮음',u.levels('survival').every((v,i)=>v<u.levels('story')[i]));
 ok('갈래 표(8명×3단, 흔한 것→드문 것)',HEROES.every(h=>JSON.stringify(u.tiers(h))===JSON.stringify(TIERS[h])));
 // 스토리 레벨 경계
 const at=(lv,h,k)=>{A.ctx.player.level=lv;A.ctx.player.hero=h;return u.unlocked(h,k);};
 ok('스토리 Lv1: 다 잠김',HEROES.every(h=>TIERS[h].flat().every(k=>!at(1,h,k))));
 ok('스토리 Lv4 잠김 / Lv5 1단만',!at(4,'hwando','moon')&&at(5,'hwando','moon')&&!at(5,'hwando','clones')&&!at(5,'hwando','trio'));
 ok('스토리 Lv14 2단 잠김 / Lv15 열림',!at(14,'neon','fog')&&at(15,'neon','fog')&&!at(15,'neon','storm'));
 ok('스토리 Lv29 3단 잠김 / Lv30 열림',!at(29,'gunner','summon')&&at(30,'gunner','summon'));
 ok('스토리 Lv777: 모두 열림',HEROES.every(h=>TIERS[h].flat().every(k=>at(777,h,k))));
 ok('라우렌 2단은 은빛 거성·심연 왜성 둘 다',!at(14,'lauren','red')&&at(15,'lauren','red')&&at(15,'lauren','blue')&&!at(15,'lauren','violet'));
 ok('모르는 갈래는 막지 않음(다른 파일 호환)',at(1,'hwando','zzz')===true);
 ok('레벨이 NaN·음수여도 오류 없이 잠김',(()=>{try{return !at(NaN,'hwando','moon')&&!at(-5,'hwando','moon');}catch(_){return false;}})());
 // 확률 마스크
 A.ctx.player.level=5;A.ctx.player.hero='hwando';
 const m=u.mask('hwando',[.18,.06,.03],['moon','clones','trio']);ok('갈래별 확률: 잠긴 갈래 0 (Lv5)',near(m[0],.18)&&m[1]===0&&m[2]===0);
 A.ctx.player.level=30;const m2=u.mask('hwando',[.18,.06,.03],['moon','clones','trio']);ok('갈래별 확률: Lv30 원래 값',near(m2[0],.18)&&near(m2[1],.06)&&near(m2[2],.03));
 ok('mask 는 길이·순서 유지, 이상값은 0',(()=>{const v=u.mask('hwando',[NaN,-1,.1],['moon','clones','trio']);return v.length===3&&v[0]===0&&v[1]===0&&near(v[2],.1);})());
 // 비중 몫
 A.ctx.player.hero='michaela';A.ctx.player.level=5;ok('비중 몫: 미카엘라 Lv5 = .55',near(u.share('michaela'),.55,1e-9));
 A.ctx.player.level=15;ok('비중 몫: 미카엘라 Lv15 = .85',near(u.share('michaela'),.85,1e-9));
 A.ctx.player.level=30;ok('비중 몫: Lv30 = 1',near(u.share('michaela'),1));
 A.ctx.player.level=1;ok('비중 몫: Lv1 = 0',u.share('michaela')===0);
 A.ctx.player.hero='hunter';A.ctx.player.level=5;ok('헌터 Lv5 몫 = .6',near(u.share('hunter'),.6));
 A.ctx.player.hero='lauren';A.ctx.player.level=5;ok('라우렌 Lv5 몫 = .28(항성 반발)',near(u.share('lauren'),.28));
 A.ctx.player.hero='neon';A.ctx.player.level=15;ok('네온 Lv15 몫 = .88',near(u.share('neon'),.88));
 A.ctx.player.hero='seoha';A.ctx.player.level=15;ok('서하 Lv15 몫 = .8',near(u.share('seoha'),.8));
 ok('weights: 잠긴 갈래 빼고 비중 그대로',JSON.stringify(u.weights('seoha',[['collapse',.5],['heroes',.3],['arbelia',.2]]))==='[["collapse",0.5],["heroes",0.3]]');
 // 서사 지역(스토리)
 A.ctx.player.hero='seoha';A.ctx.player.level=777;
 ok('서사 지역 표',JSON.stringify(u.storyGate())===JSON.stringify({hunter:'dreamRest',slayer:'dreamRest',michaela:'restEp1b',gunner:'u201',hwando:'restU2',seoha:'kair01',lauren:'hando01',neon:'hando01'}));
 ok('새 여정: 모든 영웅 소환 잠김',HEROES.every(h=>!u.summonOpen(h)));
 A.ctx.visited.add('STORY:dreamRest');ok('의목사 A 지역 뒤: 헌터·슬레이어만 열림',u.summonOpen('slayer')&&u.summonOpen('hunter')&&!u.summonOpen('gunner')&&!u.summonOpen('lauren'));
 for(const z of ['restEp1b','u201','restU2','kair01'])A.ctx.visited.add('STORY:'+z);
 ok('쌍둥이몽세(hando01) 전: 라우렌·네온만 잠김',HEROES.filter(h=>h!=='neon'&&h!=='lauren').every(h=>u.summonOpen(h))&&!u.summonOpen('neon')&&!u.summonOpen('lauren'));
 A.ctx.visited.add('STORY:hando01');ok('쌍둥이몽세(hando01) 뒤: 네온·라우렌 포함 모두 열림',HEROES.every(h=>u.summonOpen(h)));
 A.ctx.visited.clear();A.ctx.progress.STORY.u201=true;ok('완료 기록(progress)도 서사 진행으로',u.summonOpen('gunner'));
 A.ctx.progress.STORY={};A.ctx.visited.add('DREAM:kair01');ok('사몽(DREAM) 층 방문도 인정',u.summonOpen('seoha'));
}
// 무한생존: 서사와 무관, 생존 레벨 기준
const S=mk({survival:true,survLv:1,player:{level:1}});
if(S.api){const u=S.api;
 ok('생존 판정',u.mode()==='survival');
 S.surv.lv=1;ok('생존 Lv1 잠김',!u.unlocked('hwando','moon'));
 S.surv.lv=2;ok('생존 Lv2 1단',u.unlocked('hwando','moon')&&!u.unlocked('hwando','clones'));
 S.surv.lv=4;ok('생존 Lv4 2단',u.unlocked('hwando','clones')&&!u.unlocked('hwando','trio'));
 S.surv.lv=7;ok('생존 Lv7 3단',u.unlocked('hwando','trio'));
 S.surv.lv=1;S.ctx.player.level=500;ok('생존은 이어 온 스토리 레벨이 아니라 생존 레벨',!u.unlocked('hwando','moon'));
 ok('생존: 서사 없어도 소환 열림(네온 포함)',HEROES.every(h=>u.summonOpen(h)));
}
// 배치·소환 몸이 player 자리일 때: 조종 영웅의 레벨을 씀
const B=mk({player:{level:30,hero:'hwando'}});
if(B.api){const u=B.api;ok('조종 영웅 Lv30 읽기',u.unlocked('hwando','trio'));
 B.ctx.player={hero:'slayer',level:1,r720Ally:true};ok('몸(r720Ally)일 땐 마지막 조종 영웅 레벨',u.unlocked('slayer','lattice'));}
// 해금 알림: 레벨이 문턱을 넘을 때 조종 영웅 갈래 이름으로 한 번
const N=mk({player:{level:4,hero:'hwando'}});
if(N.api){const u=N.api;u.tick();N.ctx.player.level=5;u.tick();u.tick();
 ok('해금 알림 한 번(묵월)',N.ctx.toasts.length===1&&/묵월/.test(N.ctx.toasts[0]));
 N.ctx.player.level=40;u.tick();ok('여러 단 넘으면 각각',N.ctx.toasts.length===3&&/칠묵영/.test(N.ctx.toasts[1])&&/삼협묵희/.test(N.ctx.toasts[2]));}
// 끄기: 모두 열림(원래 동작)
const O=mk({ls:{'storyworld.r1025.unlock':'0'},player:{level:1}});
if(O.api)ok('끄기(localStorage storyworld.r1025.unlock=0): 모두 열림·소환 열림',O.api.unlocked('hwando','trio')&&O.api.summonOpen('neon')&&O.api.share('hwando')===1);

// ── 소환 수: 레벨마다 하나씩, 최대 7명, 서사 순(사용자 02:19Z "영웅소환수 레벨올리면 하나씩 증가 ... 서사순으로", "최대 7영웅") ──
{const Q=mk({player:{level:1,hero:'seoha'}});const u=Q.api;
 if(u){ok('서사 순서 표',JSON.stringify(u.storyOrder())===JSON.stringify(['hunter','slayer','michaela','gunner','hwando','seoha','lauren','neon']));
  const cnt=lv=>{Q.ctx.player.level=lv;return u.summonCount('seoha');};
  ok('스토리: Lv14 0명 / Lv15 1명 / Lv24 1명 / Lv25 2명',cnt(14)===0&&cnt(15)===1&&cnt(24)===1&&cnt(25)===2);
  ok('스토리: Lv75 7명, Lv777 도 7명(상한)',cnt(75)===7&&cnt(777)===7&&cnt(74)===6);
  ok('소환 수는 NaN 레벨에도 0',cnt(NaN)===0);
  Q.ctx.player.level=777;ok('서사 전: 목록 비어 있음',u.summonList('seoha',['seoha']).length===0);
  Q.ctx.visited.add('STORY:dreamRest');Q.ctx.visited.add('STORY:u201');
  ok('열린 영웅만 서사 순(헌터·슬레이어·기억사수)',JSON.stringify(u.summonList('seoha',['seoha']))==='["hunter","slayer","gunner"]');
  for(const z of ['restEp1b','restU2','kair01','hando01'])Q.ctx.visited.add('STORY:'+z);
  ok('모두 열림 Lv777: 자기 빼고 7명 서사 순',JSON.stringify(u.summonList('seoha',['seoha']))==='["hunter","slayer","michaela","gunner","hwando","lauren","neon"]');
  Q.ctx.player.level=25;ok('Lv25: 앞의 2명(헌터·슬레이어)',JSON.stringify(u.summonList('seoha',['seoha']))==='["hunter","slayer"]');
  ok('exclude 로 조종 영웅 뺌',!u.summonList('seoha',['seoha','hunter']).includes('hunter'));}
 const V=mk({survival:true,survLv:1});const v=V.api;
 if(v){const c=lv=>{V.surv.lv=lv;return v.summonCount('seoha');};
  ok('생존: Lv3 0 / Lv4 1 / Lv6 2 / Lv16 7 / Lv99 7 (2레벨마다 하나)',c(3)===0&&c(4)===1&&c(5)===1&&c(6)===2&&c(16)===7&&c(15)===6&&c(99)===7);
  V.surv.lv=16;ok('생존: 서사 없어도 7명 서사 순',JSON.stringify(v.summonList('seoha',['seoha']))==='["hunter","slayer","michaela","gunner","hwando","lauren","neon"]');}
}
ok('서하: 소환 목록을 R1025 summonList 로(서사 순·레벨별 수)',/summonList\('seoha'/.test(C(MODS.seoha))||/L1025\(/.test(C(MODS.seoha)));
// 서사 지역 표 = 정본 화자 + R461 규칙에서 다시 만든 값
{const W={};const c={window:W};vm.createContext(c);try{vm.runInContext(C('story-canon-r106-data.js'),c);}catch(_){}
 const d=W.__STORYWORLD_STORY_CANON_R106__,order=JSON.parse(rd(path.join(ROOT,'story-source/catalog-r75.json'))||'{}').portalOrder||[];
 const ALIAS={'의목사 A':['hunter','slayer'],'의목사 B':['gunner'],'미카엘라':['michaela'],'환도':['hwando'],'윤서하':['seoha']};
 const first={};if(d)for(const id of order){const z=d.zones[id];if(!z)continue;const s=JSON.stringify(z);for(const m of s.match(/〈([^〉]*)의 기억〉/g)||[]){const n=m.slice(1,-5);for(const h of ALIAS[n]||[])if(!first[h])first[h]=id;}if(s.includes('라우렌')&&!first.lauren){const ch=z.chapter||(JSON.stringify(z).match(/제6부[^"]*/)||[''])[0];const z0=order.find(q=>d.zones[q]&&JSON.stringify(d.zones[q]).includes('제6부'));first.lauren=first.neon=s.includes('제6부')?z0:id;}}
 ok('정본에서 다시 만든 서사 지역 = 표('+JSON.stringify(first)+')',A.api&&HEROES.every(h=>(first[h]||null)===A.api.storyGate()[h]));}
// NaN 방지·성능: 굴림 질의는 가볍게
if(A.api){const t0=Date.now();for(let i=0;i<20000;i++)A.api.mask('hwando',[.18,.06,.03],['moon','clones','trio']);ok('질의 2만 번 < 300ms',Date.now()-t0<300);}
console.log('\nR1025 passive-unlock CPU:',pass,'pass,',fail,'fail');process.exit(fail?1:0);
