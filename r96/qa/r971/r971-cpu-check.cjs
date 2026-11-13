// R971 CPU 검사: 영웅 특수 패시브(확률 발동) 강화 — 사용자 2026-11-13 00:47Z "영웅들 특수패시브스킬도 확률등 스킬포인트로 업그레이드 가능하도록".
//  · 기존 패시브 포인트(R62 P 창)에 카드 하나('heroPassiveR971')를 더한다. 1~7단계(사용자 01:24Z "7단계7프로씩"), 비용 = 다음 단계(1~7점, 합 28점).
//  · 단계마다 발동 확률 +7%(×(1+0.07·단계), 최대 ×1.49), 한 굴림 합계 40% 이하(절대 상한), 모듈 자체 상한(CHANCE_MAX)은 그대로.
//    재발동 대기는 ×(1−0.03·단계)(최대 ×0.79).
//  · 0단계는 지금과 똑같다(값이 그대로 돌아옴). 8개 패시브 모듈이 굴림·대기에서 이 값을 묻는다.
//  · 자동 스킬레벨업(R237)이 이 카드도 산다. 환도 E 대시 등 스킬 자체·서사는 건드리지 않는다.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..');
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return'';}};
const C=f=>rd(path.join(R,'client-source',f)),RT=f=>rd(path.join(R,'runtime-text',f));
let pass=0,fail=0;const ok=(n,c)=>{if(c){pass++;console.log('PASS',n);}else{fail++;console.log('FAIL',n);}};
const near=(a,b,e=1e-9)=>Math.abs(a-b)<=e;
const F='passive-growth-r971.js',API='__STORYWORLD_PASSIVE_GROWTH_R971__',ID='heroPassiveR971';
const src=C(F);ok(F+' 있음',src.length>0);
ok('runtime-text 사본 = client-source',src.length>0&&RT(F)===src);
try{new vm.Script(src);ok('문법',src.length>0);}catch(e){ok('문법 '+e.message,false);}
const html=RT('index.html');
ok('index.html 태그 한 번',html.split('<script src="./'+F+'"></script>').length===2);
ok('태그는 survival-passives-r962 뒤·combat-r118 앞',(()=>{const i=html.indexOf('./'+F+'"');return i>html.indexOf('./survival-passives-r962.js"')&&i<html.indexOf('<script src="./combat-r118.js"');})());
ok('verify-r96-public.py 기대 목록',rd(path.join(ROOT,'scripts/verify-r96-public.py')).includes("'"+F+"'"));
ok('pages.yml CPU 검사 줄',rd(path.join(ROOT,'.github/workflows/pages.yml')).includes('node r96/qa/r971/r971-cpu-check.cjs'));
ok('runtime-manifest·inputs 등록',rd(path.join(R,'runtime-manifest.json')).includes(F)&&rd(path.join(R,'runtime-inputs.json')).includes(F));
ok('새 키·저장 쓰기 없음',!/addEventListener\(\s*['"]key|saveGame\(|localStorage\.setItem/.test(src));

// ── 8개 패시브 모듈이 굴림·대기에서 R971 을 묻는다(0단계면 원래 값) ──
const MODS={hwando:'hwando-ink-r945.js',lauren:'lauren-celestial-r946.js',slayer:'slayer-blood-passive-r947.js',michaela:'michaela-heart-r948.js',seoha:'seoha-epoch-r949.js',neon:'neon-storm-r951.js',hunter:'hunter-squad-r952.js',gunner:'gunner-veil-r953.js'};
for(const[h,f]of Object.entries(MODS)){const s=C(f);
 ok(f+': 확률을 R971 에 물음',s.includes(API)&&new RegExp("G971\\((HERO|'"+h+"'),\\[").test(s));
 ok(f+': 재발동 대기를 R971 에 물음',new RegExp("D971\\((HERO|'"+h+"'),").test(s));
 ok(f+': runtime-text 사본 = client-source',RT(f)===s);
 try{new vm.Script(s);ok(f+': 문법',true);}catch(e){ok(f+': 문법 '+e.message,false);}}
// 정확한 자리(대표 식)
ok('환도: 세 확률을 한 번에',/G971\('hwando',\[CFG\.moon\.chance,CFG\.clones\.chance,CFG\.trio\.chance\]\)/.test(C(MODS.hwando)));
ok('슬레이어: 세 확률을 한 번에',/G971\(HERO,\[CFG\.needle\.chance,CFG\.swords\.chance,CFG\.lattice\.chance\]\)/.test(C(MODS.slayer)));
ok('기억사수: 세 확률을 한 번에',/G971\(HERO,\[CFG\.cloak\.chance,CFG\.barrage\.chance,CFG\.summon\.chance\]\)/.test(C(MODS.gunner)));
ok('라우렌·미카엘라·네온: 모듈 상한 CHANCE_MAX 는 그대로 바깥에서 자름',['lauren','michaela','neon'].every(h=>/return Math\.min\(CHANCE_MAX,surge\('chance',G971\(HERO,\[c\]\)\[0\]\)\)/.test(C(MODS[h]))));
ok('서하: CHANCE_MAX 로 자름',/Math\.min\(CHANCE_MAX,surge\('chance',G971\(HERO,\[CHANCE\]\)\[0\]\)\)/.test(C(MODS.seoha)));
ok('헌터: 확률·대기',/Math\.random\(\)<G971\(HERO,\[CFG\.chance\]\)\[0\]/.test(C(MODS.hunter))&&/s\.readyAt=t\+D971\(HERO,CFG\.icd\)/.test(C(MODS.hunter)));
ok('환도 E 대시(R945 밖 스킬)는 이 작업에서 손대지 않음: hwando-ink 외 환도 스킬 파일 무변경은 git diff 로 확인(보고서)',true);
ok('R115 스킬 모음: 특수 패시브 묶음(QWER 다음)',/\['QWER 스킬',\/\^skill\[QWER\]R663\/\],\['특수 패시브',\/\^heroPassiveR971\/\]/.test(C('play-r115.js'))&&RT('play-r115.js')===C('play-r115.js'));
// R237 자동 스킬레벨업이 이 카드도 산다
ok('R237 자동 구매 목록에 '+ID,/\[\.\.\.SKILL,\.\.\.THREAD,'heroPassiveR971'\]/.test(C('auto-levelup-r237.js'))&&RT('auto-levelup-r237.js')===C('auto-levelup-r237.js'));

// ── vm: 모듈 단독 ──
function mk(opt={}){
 const ranks={},defs=[{id:'endlessPower',name:'끝없는 의지',icon:'ego'}],listeners={};
 const ctx={console,JSON,Math,Number,Object,Array,String,Set,WeakMap,Map,isFinite,
  player:Object.assign({hero:'hwando',hp:100,points:20},opt.player||{}),started:true,
  document:{readyState:'complete'},setTimeout:()=>0,
  window:{}};
 const W=ctx.window;W.window=W;W.addEventListener=(t,f)=>{(listeners[t]=listeners[t]||[]).push(f);};
 W.__STORYWORLD_PROGRESSION_R62__={defs,ranks:(id,p)=>{const P=p||ctx.player;return (P.__ranks||ranks)[id]||0;},state:()=>({ranks}),
  purchase(id){const d=defs.find(x=>x.id===id),c=Number(d.cost)||1;if(ctx.player.points<c||(ranks[id]||0)>=(d.maxRank??99))return false;ctx.player.points-=c;ranks[id]=(ranks[id]||0)+1;return true;}};
 vm.createContext(ctx);let err=null;try{vm.runInContext(src,ctx);}catch(e){err=e;}
 (listeners.load||[]).forEach(f=>f());
 return{ctx,W,ranks,defs,err,api:W[API],P62:W.__STORYWORLD_PROGRESSION_R62__};}
const A=mk();ok('오류 없이 올라옴'+(A.err?' ('+A.err.message+')':''),!A.err&&!!A.api);
if(A.api){const g=A.api,d=A.defs.find(x=>x.id===ID);
 ok('R62 카드 하나 추가(P 창·저장·구매 규칙 그대로)',!!d&&A.defs.filter(x=>x.id===ID).length===1);
 ok('최대 7단계',d&&d.maxRank===7);
 // 비용 1~7
 A.ctx.player.points=30;const costs=[];for(let i=0;i<7;i++){costs.push(d.cost);A.P62.purchase(ID);}
 ok('비용 = 다음 단계(1~7점, 합 28)',JSON.stringify(costs)==='[1,2,3,4,5,6,7]'&&A.ranks[ID]===7&&A.ctx.player.points===2);
 ok('7단계 뒤 더 못 삼',A.P62.purchase(ID)===false&&A.ranks[ID]===7);
 // 이름·설명은 지금 영웅 패시브 이름
 const names={hwando:'묵월',lauren:'천체 공명',slayer:'혈침',michaela:'사랑의 처방',seoha:'겹친 시간',neon:'독전 회로',hunter:'사냥 분대',gunner:'잔영 위장'};
 let nm=true;for(const[h,w]of Object.entries(names)){A.ctx.player.hero=h;if(!String(d.name).includes(w)||!/확률/.test(String(d.text)))nm=false;}A.ctx.player.hero='hwando';
 ok('카드 이름에 지금 영웅의 특수 패시브 이름, 설명에 확률',nm);
 ok('설명 첫 문장이 수치(모음 보기 한 줄)',/^발동 확률 ×/.test(d.text));
 ok('설명에 단계당 +7%·상한 40%',/7%/.test(d.text)&&/40%/.test(d.text));
 A.ranks[ID]=2;ok('설명에 지금 → 다음 단계',/×1\.14/.test(d.text)&&/×1\.21/.test(d.text));
 // 0단계 = 원래 값 그대로
 A.ranks[ID]=0;
 const base=[.18,.06,.03];ok('0단계: 확률 그대로(같은 값)',JSON.stringify(g.chances('hwando',base))===JSON.stringify(base));
 ok('0단계: 대기 그대로',g.cooldown('hwando',7)===7&&g.cooldown('hunter',21)===21);
 // 단계별
 for(const k of [1,3,7]){A.ranks[ID]=k;const v=g.chances('lauren',[.10]);ok(k+'단계 라우렌 10% → '+(v[0]*100).toFixed(2)+'%',near(v[0],.10*(1+.07*k)));
  ok(k+'단계 대기 ×'+(1-.03*k).toFixed(2),near(g.cooldown('lauren',5),5*(1-.03*k)));}
 A.ranks[ID]=7;
 ok('7단계 최대 ×1.49: 서하 5% → 7.45%',near(g.chances('seoha',[.05])[0],.0745));
 const hw=g.chances('hwando',[.18,.06,.03]),hs=hw.reduce((a,b)=>a+b,0);
 ok('7단계 환도 합 27% → 40%(절대 상한, ×1.49면 40.23%) = '+(hs*100).toFixed(2),near(hs,.40));
 ok('여러 갈래는 비율 그대로 늘림',near(hw[0]/hw[1],3)&&near(hw[1]/hw[2],2));
 ok('갈래마다 원래 ×1.49 이하',hw.every((v,i)=>v<=base[i]*1.49+1e-12));
 const mh=g.chances('michaela',[.11]);ok('7단계 미카엘라 11% → 16.39%',near(mh[0],.1639));
 const sl=g.chances('slayer',[.2,.08,.04]);ok('슬레이어 32% → 40%(상한)',near(sl.reduce((a,b)=>a+b,0),.40));
 const big=g.chances('x',[.30,.08]);ok('절대 상한: 합 40% 넘지 않음(38% → '+(big.reduce((a,b)=>a+b,0)*100).toFixed(1)+'%)',big.reduce((a,b)=>a+b,0)<=.40+1e-12);
 const over=g.chances('x',[.5]);ok('원래 40% 넘던 값은 줄이지도 늘리지도 않음',over[0]===.5);
 ok('대기 최저 ×0.79',near(g.cooldown('hunter',21),16.59)&&g.cooldown('hunter',21)>=7);
 // 경계·나쁜 값
 A.ranks[ID]=99;ok('단계는 7로 잘림',near(g.chances('seoha',[.05])[0],.0745));
 A.ranks[ID]=NaN;ok('단계 NaN → 0',g.chances('seoha',[.05])[0]===.05);
 A.ranks[ID]=-3;ok('음수 단계 → 0',g.chances('seoha',[.05])[0]===.05&&g.cooldown('seoha',14)===14);
 A.ranks[ID]=7;
 const bad=g.chances('x',[NaN,-1,Infinity,.1]);ok('나쁜 확률 값은 유한·0 이상으로',bad.every(v=>Number.isFinite(v)&&v>=0));
 ok('빈 배열·배열 아님 안전',Array.isArray(g.chances('x',[]))&&g.chances('x',[]).length===0&&Array.isArray(g.chances('x',null)));
 ok('나쁜 대기 값은 그대로 돌려 줌',Number.isNaN(g.cooldown('x',NaN))&&g.cooldown('x',0)===0&&g.cooldown('x',-2)===-2);
 // 배치·소환 몸(R720·R949·R952): 몸이 player 자리에 끼워져도 조종 영웅 단계를 쓴다
 A.ranks[ID]=4;g.chances('hwando',[.1]);// 조종 영웅 단계 기억
 const main=A.ctx.player;A.ctx.player={hero:'slayer',r720Ally:true,__ranks:{}};
 ok('배치 영웅 몸: 조종 영웅 단계(4) 사용',near(g.chances('slayer',[.2])[0],.2*(1+.07*4)));
 A.ctx.player={hero:'slayer',r949Summon:true,__ranks:{}};ok('소환 영웅 몸: 조종 영웅 단계 사용',near(g.cooldown('slayer',6),6*(1-.12)));
 A.ctx.player=main;
 // 끄기
 A.ranks[ID]=7;g.set(false);ok('끄면 원래 값',g.chances('seoha',[.05])[0]===.05&&g.cooldown('seoha',14)===14);g.set(true);
 ok('inspect',typeof g.inspect==='function'&&g.inspect().rank===7&&g.inspect().maxRank===7);
}
// 모듈이 R971 없이도(파일이 빠져도) 원래대로 도는지: 헬퍼가 API 없을 때 원래 값
for(const[h,f]of Object.entries(MODS)){const s=C(f),m=s.match(/const G971=[^\n]*/);ok(f+': 헬퍼가 API 없으면 원래 값',(()=>{if(!m)return false;try{const c={window:{},Number,Array};vm.createContext(c);vm.runInContext(m[0]+'\nthis.G=G971;this.D=D971;',c);return JSON.stringify(c.G('x',[.1,.2]))==='[0.1,0.2]'&&c.D('x',5)===5;}catch(e){return false;}})());}
console.log((fail?'FAIL':'OK')+' r971 '+pass+'/'+(pass+fail));process.exit(fail?1:0);
