// R1207 CPU 검사: 특수 확률 발동 패시브 확률 상향 + 고정 피해 비례 감소 (사용자 2026-11-19 07:17Z
//  "특수확률발동패시브 최대확률 77.7프로까지 상향해줘 그에맞게 11.1프로가 기본해서 7단계 77.7프로로 비례해서 데미지는 줄여줘(체력비례뎀은 유지)", "모든영웅임").
//  · 한 굴림 합계 확률 = 0단계 11.1% → 7단계 77.7% 직선(단계마다 +9.514%p). 지금 확률이 이 곡선보다 높으면(환도 27%·슬레이어 32%·기억사수 20%) 낮추지 않고 그대로 둔다.
//  · 고정 피해 배율 = 예전 확률 ÷ 새 확률(같은 단계 기준, 1 이하). 한 번 굴림당 기대 피해(확률×피해)는 예전과 같다. 체력 비례 피해(페르소나 레이저 보스 최대체력 7%·일반몹 즉사)는 그대로.
//  · 개별 보정(근처 적 수, 페르소나 은빛 거성, 사몽 배율)은 비율대로 같이 오르되 굴림 합계 77.7% 상한.
//  · 10명 모두: 기본 8명 + EGO(환도 수묵 + 천체 공명 EGO 갈래) + 페르소나(라우렌 천체 공명 틀).
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..');
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return'';}};
const C=f=>rd(path.join(R,'client-source',f)),RT=f=>rd(path.join(R,'runtime-text',f));
let pass=0,fail=0;const ok=(n,c)=>{if(c){pass++;console.log('PASS',n);}else{fail++;console.log('FAIL',n);}};
const near=(a,b,e=1e-9)=>Number.isFinite(a)&&Math.abs(a-b)<=e;
const F='passive-growth-r971.js',API='__STORYWORLD_PASSIVE_GROWTH_R971__',ID='heroPassiveR971';
const src=C(F);
const MIN=.111,MAX=.777,curve=r=>MIN+(MAX-MIN)*r/7;
const BASE={hwando:.27,lauren:.10,slayer:.32,michaela:.11,seoha:.05,neon:.09,hunter:.09,gunner:.20,ego:.10};
const oldT=(b,r)=>Math.min(b*(1+.07*r),Math.max(b,.40));
const newT=(b,r)=>Math.min(MAX,Math.max(oldT(b,r),curve(r)));
ok('pages.yml CPU 검사 줄',rd(path.join(ROOT,'.github/workflows/pages.yml')).includes('node r96/qa/r1207/r1207-cpu-check.cjs'));

function mk(){const ranks={},defs=[],listeners={};
 const ctx={console,JSON,Math,Number,Object,Array,String,Set,WeakMap,Map,isFinite,player:{hero:'hwando',hp:100,points:40},window:{}};
 const W=ctx.window;W.window=W;W.addEventListener=(t,f)=>{(listeners[t]=listeners[t]||[]).push(f);};
 W.__STORYWORLD_PROGRESSION_R62__={defs,ranks:(id,p)=>{const P=p||ctx.player;return (P.__ranks||ranks)[id]||0;}};
 vm.createContext(ctx);let err=null;try{vm.runInContext(src,ctx);}catch(e){err=e;}
 return{ctx,W,ranks,defs,err,api:W[API]};}
const A=mk();ok('R971 오류 없이 올라옴'+(A.err?' ('+A.err.message+')':''),!A.err&&!!A.api);
const g=A.api||{};
ok('API 에 damage(영웅) 있음',typeof g.damage==='function');
ok('API 에 total(영웅) 있음(지금 단계 굴림 합계)',typeof g.total==='function');
if(typeof g.damage==='function'&&typeof g.total==='function'){
 const sum=a=>a.reduce((x,y)=>x+y,0);
 // 곡선: 11.1% → 77.7%
 A.ranks[ID]=0;ok('0단계 서하 5% → 11.1%',near(sum(g.chances('seoha',[.05])),.111));
 ok('0단계 서하 고정 피해 ×'+(g.damage('seoha')).toFixed(4)+' (= 5/11.1)',near(g.damage('seoha'),.05/.111));
 A.ranks[ID]=7;ok('7단계 서하 → 77.7%',near(sum(g.chances('seoha',[.05])),.777));
 ok('7단계 서하 고정 피해 = 7.45/77.7',near(g.damage('seoha'),.0745/.777));
 for(let r=0;r<=7;r++){A.ranks[ID]=r;ok(r+'단계 곡선 '+(curve(r)*100).toFixed(2)+'% (네온 9%)',near(sum(g.chances('neon',[.09])),curve(r))&&near(g.total('neon'),curve(r)));}
 // 10명 모두: 단계별 합계·피해·기대값
 let mono=true,cap=true,ev=true,dm=true,tb=true;
 for(const[h,b]of Object.entries(BASE)){let prev=-1;for(let r=0;r<=7;r++){A.ranks[ID]=r;const t=g.total(h),d=g.damage(h);
  if(!near(t,newT(b,r)))tb=false;if(t<prev-1e-12)mono=false;prev=t;if(t>MAX+1e-12)cap=false;if(!(d>0&&d<=1))dm=false;if(!near(t*d,oldT(b,r),1e-9))ev=false;}}
 ok('10명 굴림 합계 = max(예전, 곡선), 77.7% 이하',tb);ok('단계 오를수록 줄지 않음',mono);ok('77.7% 상한',cap);ok('고정 피해 배율 0~1',dm);
 ok('굴림당 기대 피해(확률×피해) = 예전과 같음(10명·0~7단계)',ev);
 A.ranks[ID]=7;for(const h of Object.keys(BASE))ok('7단계 '+h+' 합계 77.7%',near(g.total(h),.777));
 // 지금 곡선보다 높은 영웅은 낮추지 않음
 A.ranks[ID]=0;const hw=g.chances('hwando',[.18,.06,.03]);ok('0단계 환도 27% 그대로(낮추지 않음), 피해 ×1',near(sum(hw),.27)&&near(g.damage('hwando'),1));
 A.ranks[ID]=7;const hw7=g.chances('hwando',[.18,.06,.03]);ok('7단계 환도 77.7%, 갈래 비율 그대로 3:1 → '+hw7.map(v=>(v*100).toFixed(2)).join('/'),near(sum(hw7),.777)&&near(hw7[0]/hw7[1],3)&&near(hw7[1]/hw7[2],2));
 ok('7단계 환도 피해 = 40/77.7',near(g.damage('hwando'),.40/.777));
 A.ranks[ID]=3;ok('3단계 슬레이어 = 곡선 39.64%(예전 38.72%보다 큼)',near(sum(g.chances('slayer',[.2,.08,.04])),curve(3)));
 A.ranks[ID]=0;ok('0단계 기억사수 20% 그대로',near(sum(g.chances('gunner',[.10,.07,.03])),.20));
 // 개별 보정은 비율대로, 77.7% 상한
 A.ranks[ID]=0;ok('라우렌 근처 적 보너스 14% → 15.54%',near(g.chances('lauren',[.14])[0],.14*1.11));
 ok('페르소나 은빛 거성 보정 13% → 14.43%',near(g.chances('lauren',[.13])[0],.13*1.11));
 ok('EGO 천체 공명(ego) 10% → 11.1%',near(g.chances('ego',[.10])[0],.111));
 A.ranks[ID]=7;ok('7단계 라우렌 근처 보너스도 77.7%에서 자름',near(g.chances('lauren',[.14])[0],.777));
 ok('7단계 페르소나 보정 77.7%',near(g.chances('lauren',[.13])[0],.777));
 A.ranks[ID]=0;ok('부분 해금(갈래 일부 0)은 남은 갈래만 비율대로',near(sum(g.chances('slayer',[.2,0,0])),.2*(.32/.32)));
 // 모르는 영웅: 넘어온 합계를 기준으로
 A.ranks[ID]=0;ok('모르는 영웅 5% → 11.1%',near(g.chances('zzz',[.05])[0],.111));
 // 경계·나쁜 값
 A.ranks[ID]=99;ok('단계 99 → 7로 잘림',near(g.total('seoha'),.777));
 A.ranks[ID]=NaN;ok('단계 NaN → 0단계',near(g.total('seoha'),.111));
 A.ranks[ID]=-2;ok('음수 단계 → 0단계',near(g.total('seoha'),.111));
 A.ranks[ID]=7;const bad=g.chances('seoha',[NaN,-1,Infinity,.05]);ok('나쁜 확률 값 유한·0 이상',bad.every(v=>Number.isFinite(v)&&v>=0));
 ok('빈 배열 안전',Array.isArray(g.chances('x',[]))&&g.chances('x',[]).length===0);
 ok('모르는 영웅 피해 배율 유한',Number.isFinite(g.damage('zzz'))&&g.damage('zzz')>0&&g.damage('zzz')<=1);
 // 대기 ×(1−.03·단계) 그대로
 A.ranks[ID]=7;ok('재발동 대기 7단계 ×0.79 그대로',near(g.cooldown('hunter',21),21*.79));
 // 몸(r720Ally) 은 조종 영웅 단계
 A.ranks[ID]=4;g.total('seoha');const main=A.ctx.player;A.ctx.player={hero:'slayer',r720Ally:true,__ranks:{}};
 ok('배치 몸: 조종 영웅 단계(4) 곡선',near(g.total('seoha'),curve(4)));A.ctx.player=main;
 // 끄기
 A.ranks[ID]=7;g.set(false);ok('끄면 원래 확률·피해 ×1',g.chances('seoha',[.05])[0]===.05&&g.damage('seoha')===1);g.set(true);
 // 카드 설명
 A.W.dispatch=0;(()=>{})();
}
// 카드 설명: 지금 단계 확률·다음 단계·피해 배율
{const B=mk();B.ctx.player.hero='seoha';const d=B.W.__STORYWORLD_PROGRESSION_R62__.defs.find(x=>x&&x.id===ID);
 B.ranks[ID]=0;ok('카드 설명: 11.1% → 20.6%·77.7%·고정 피해',!!d&&/11\.1%/.test(d.text)&&/20\.6%/.test(d.text)&&/77\.7%/.test(d.text)&&/고정 피해/.test(d.text)&&/체력 비례/.test(d.text));
 B.ranks[ID]=7;ok('카드 설명 7단계: 77.7% (최대)',!!d&&/77\.7%/.test(d.text)&&/최대/.test(d.text));}

// ── 모듈: 상한·피해 배율 연결 ──
const MODS={hwando:'hwando-ink-r945.js',lauren:'lauren-celestial-r946.js',slayer:'slayer-blood-passive-r947.js',michaela:'michaela-heart-r948.js',seoha:'seoha-epoch-r949.js',neon:'neon-storm-r951.js',hunter:'hunter-squad-r952.js',gunner:'gunner-veil-r953.js'};
for(const[h,f]of Object.entries(MODS)){const s=C(f);const m=s.match(/const M1207=[^\n]*/);
 ok(f+': M1207 피해 배율 헬퍼',!!m);
 ok(f+': 헬퍼가 API 없으면 ×1',(()=>{if(!m)return false;try{const c={window:{},Number,Math};vm.createContext(c);vm.runInContext(m[0]+'\nthis.M=M1207;',c);return c.M(h)===1;}catch(_){return false;}})());
 ok(f+': 헬퍼가 API 값을 0~1 로',(()=>{if(!m)return false;try{const c={window:{[API]:{damage:()=>.4}},Number,Math};vm.createContext(c);vm.runInContext(m[0]+'\nthis.M=M1207;',c);const a=c.M(h);c.window[API]={damage:()=>7};const b=c.M(h);c.window[API]={damage:()=>NaN};return a===.4&&b===1&&c.M(h)===1;}catch(_){return false;}})());
 ok(f+': runtime-text 사본 = client-source',RT(f)===s);
 try{new vm.Script(s);ok(f+': 문법',true);}catch(e){ok(f+': 문법 '+e.message,false);}}
const S=k=>C(MODS[k]);
ok('환도 strike 고정 피해 × M1207',/const dmg=base\*mult\*M1207\('hwando'\);/.test(S('hwando')));
ok('슬레이어 strike × M1207',/const dmg=base\*mult\*M1207\(HERO\);/.test(S('slayer')));
ok('기억사수 strike × M1207',/const dmg=base\*mult\*M1207\(HERO\);/.test(S('gunner')));
for(const k of ['michaela','seoha','neon'])ok(k+' deal × M1207',/hitEnemy\(e,v\*M1207\(HERO\),/.test(S(k)));
ok('서하 소집 영웅 공격력 × M1207',/v\*HERO_K\*M1207\(HERO\)/.test(S('seoha')));
ok('헌터 분대 몸 공격력 × M1207',/v\*\(\+p\.r952Mul\|\|1\)\*M1207\(HERO\)/.test(S('hunter')));
ok('헌터 혈영 베기 × M1207',/c\.power\*CFG\.shade\.mul\*M1207\(HERO\)/.test(S('hunter')));
ok('라우렌 확률 발동 fire 에 powerScale M1207(EGO 는 ego)',/fire\(kind,o,e&&Number\.isFinite\(e\.x\)\?\{x:e\.x,y:e\.y\}:null,\{powerScale:M1207\(ego\?'ego':HERO\)\}\)/.test(S('lauren')));
ok('라우렌 EGO 갈래도 R971(ego) 확률',/G971\('ego',\[CHANCE\+\(n>=CROWD_N\?CROWD_BONUS:0\)\]\)/.test(S('lauren')));
for(const k of ['lauren','michaela','neon','seoha'])ok(k+' CHANCE_MAX = .777',/CHANCE_MAX=\.777\b/.test(S(k)));
ok('페르소나 레이저 체력 비례(보스 최대체력 배율·즉사)는 M1207 없음',(()=>{const s=C('persona-wer-r1144.js');return /\(Number\(e\.maxHp\)\|\|Number\(e\.hp\)\|\|0\)\*TUNE\.laser\.bossK:\(Number\(e\.hp\)\|\|0\)\+1/.test(s)&&!/M1207/.test(s);})());
ok('EGO R 직접 기술(egoCast)은 확률 패시브 아님: powerScale sc0 그대로',/\{egoTint:'wr',powerScale:sc0\}/.test(S('lauren')));
console.log((fail?'FAIL':'OK')+' r1207 '+pass+'/'+(pass+fail));process.exit(fail?1:0);
