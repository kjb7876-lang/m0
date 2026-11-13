'use strict';
// R993 효과음 전수 점검·믹스 정리 — CPU 검사(브라우저 없이).
//  ① 빌드 연결(오버레이 사본·태그 위치·verify 목록·pages.yml·manifest)
//  ② 잘림 고친 파생본 3개(해시·길이 상한 안 본체 에너지·피크·딸깍·모노·디코딩 메모리)
//  ③ 범주 분류: 게임에 있는 효과음 종류 전부 + 병합 대기 종류(R972·R975)가 10범주 중 하나
//  ④ 음량 맞춤: 측정표(1,232줄)에 오버레이의 trimDb 를 적용하면 범주별 목표 ±2.5dB 안 95% 이상, 범주 안 폭(p90−p10) 4dB 이하
//  ⑤ K 가중 음량 함수(1kHz 사인·무음·NaN), trimDb 의 clamp·피크 보호·NaN
//  ⑥ 변주: 범위·연속 같은 값 없음·평균 1·NaN 없음
//  ⑦ 동시 재생: 몹 소리 폭주(300ms 에 몹 피격·사망·공격 60번) 속에서 몹 층 동시 2 이하, 영웅 타격·피격은 입장 거절·몹에게 빼앗김 0
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;
const ok=(c,m)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('ok  ',m);};
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return'';}};
const NAME='sfx-mix-r993.js',src=rd(path.join(R,'client-source',NAME));
// ① 빌드 연결
ok(src.length>0,NAME+' 존재');
ok(src.length>0&&rd(path.join(R,'runtime-text',NAME))===src,'runtime-text 사본 = client-source');
const html=rd(path.join(R,'runtime-text/index.html')),tag='<script src="./'+NAME+'"></script>';
ok(html.includes(tag)&&html.indexOf(tag)>html.indexOf('combat-sfx-r967.js')&&html.indexOf(tag)<html.indexOf('<script src="./combat-r118.js">'),'index.html 태그(R967 뒤·combat-r118 앞)');
const verify=rd(path.join(ROOT,'scripts/verify-r96-public.py'));ok(verify.includes("'"+NAME+"'")&&verify.includes("'assets/r993/'"),'verify-r96-public.py 기대 목록(오버레이·assets/r993/)');
ok(rd(path.join(ROOT,'.github/workflows/pages.yml')).includes('node r96/qa/r993/r993-cpu-check.cjs'),'pages.yml CPU 검사 줄');
const man=rd(path.join(R,'runtime-manifest.json'));ok(man.includes('"'+NAME+'"')||man.includes(NAME),'runtime-manifest 에 오버레이');
// ② 파생본
let idx={files:{}};try{idx=JSON.parse(rd(path.join(R,'runtime-text/assets/r993/sfx/index.json')));}catch(_){}
const F=idx.files||{},names=Object.keys(F);ok(names.length===3,'파생본 index.json 3개('+names.length+')');
ok(idx.params&&idx.params.channels===1&&idx.params.sampleRate===44100,'모노 44.1kHz');
let derivedBytes=0;
for(const k of names){const f=F[k];let b=null;try{b=fs.readFileSync(path.join(R,'runtime-text',f.path));}catch(_){}
 ok(!!b&&b.length===f.bytes&&crypto.createHash('sha256').update(b).digest('hex')===f.sha256&&man.includes(f.path),k+': 해시·크기·manifest');derivedBytes+=f.bytes||0;
 ok(f.sourceEnergyWithinRoleCap<.6&&f.energyWithinRoleCap>=.85,k+': 역할 길이 상한 안 본체 에너지 '+f.sourceEnergyWithinRoleCap+' → '+f.energyWithinRoleCap+'(≥.85)');
 ok(f.duration<=f.roleCapSeconds&&f.duration>=.5,k+': 길이 '+f.duration+'s ≤ 상한 '+f.roleCapSeconds);
 ok(f.peakDb<=-6&&f.peakDb>=-14,k+': 피크 −6~−14dB('+f.peakDb+')');
 ok(f.startAbs<.01&&f.endAbs<.005,k+': 시작·끝 딸깍 없음('+f.startAbs+','+f.endAbs+')');
 ok(f.lowShare150<=.10&&f.hfShare5k<=.05,k+': 150Hz 아래 10%·5kHz 위 5% 이하('+f.lowShare150+','+f.hfShare5k+')');
 ok(f.decodedBytes44kMono<f.sourceDecodedBytes48kStereo*.5,k+': 디코딩 메모리 절반 이하('+f.decodedBytes44kMono+' < '+f.sourceDecodedBytes48kStereo+')');}
ok(derivedBytes>0&&derivedBytes<120000,'파생본 합계 120KB 미만('+derivedBytes+')');
// ③~⑦ 오버레이 함수
const T=JSON.parse(rd(path.join(__dirname,'sfx-table.json'))||'{}');
const ctx={window:{},console,Math,Number,JSON,Object,Array,Map,Set,WeakMap,WeakSet,Float32Array,performance:{now:()=>0},localStorage:{getItem:()=>null,setItem:()=>{}},
 document:{readyState:'loading',addEventListener(){}},setTimeout:()=>0,setInterval:()=>0,addEventListener(){}};ctx.window=ctx;
let api=null;try{vm.createContext(ctx);vm.runInContext(src,ctx,{filename:NAME});api=ctx.__STORYWORLD_SFX_MIX_R993__;}catch(e){console.log('load error',String(e).slice(0,200));}
ok(!!api&&['category','trimDb','loudness','vary','admit','targets','remap'].every(k=>k in api),'오버레이 API(category·trimDb·loudness·vary·admit·targets·remap)');
if(!api){console.log(`\nR993 CPU: ${n-bad}/${n}`);process.exit(1);}
const CATS=['타격','적피격','영웅피격','스킬','투사체','보스','일반몹','패시브·회복','UI·보상','환경'];
// ③ 분류
const allKinds=[...Object.keys(T.kinds||{}),...(T.pendingKinds||[])];const miss=allKinds.filter(k=>{const c=api.category(k);return !c||!CATS.includes(c.cat);});
ok(allKinds.length>=500&&miss.length===0,'모든 종류 분류('+allKinds.length+'개, 빠짐 '+miss.length+' '+miss.slice(0,5)+')');
ok(api.category(null)===null&&api.category(undefined)===null&&api.category(42)===null,'이상한 종류 이름은 null(던지지 않음)');
ok(api.category('r955Hit_spider').cls==='low'&&api.category('hurt').cls==='impact'&&api.category('r546Atk_hwando').cls==='high'&&api.category('r788BDie_root').cls==='impact','등급(몹 low·피격 impact·영웅 타격 high·보스 사망 impact)');
// ④ 음량 맞춤
const remapped=new Set(Object.values(api.remap||{}).length?Object.keys(api.remap):[]);
const pct=(a,p)=>{const s=[...a].sort((x,y)=>x-y);return s[Math.min(s.length-1,Math.floor(p*s.length))];};
const byCat={},beforeCat={};let rows=0;
for(const L of T.levels||[]){if(remapped.has(L.path))continue;const c=api.category(L.kind);if(!c)continue;const base=L.lufs+20*Math.log10(L.rowGain*L.roleGain*T.busGain);
 const t=api.trimDb(L.kind,L.lufs,L.rowGain,L.roleGain,L.peakDb);(byCat[c.cat]=byCat[c.cat]||[]).push({after:base+t,target:c.target,sub:c.sub});(beforeCat[c.cat]=beforeCat[c.cat]||[]).push(base);rows++;}
ok(rows>=1200,'측정표 '+rows+'줄 적용');
for(const cat of CATS){const a=byCat[cat]||[];if(!a.length){ok(cat==='환경'||cat==='패시브·회복','범주 '+cat+' 측정 없음');continue;}
 const inside=a.filter(r=>Math.abs(r.after-r.target)<=2.5).length/a.length,vals=a.map(r=>r.after),b=beforeCat[cat];
 ok(inside>=.95,cat+': 목표 ±2.5dB 안 '+(inside*100).toFixed(1)+'% (전 폭 '+(pct(b,.9)-pct(b,.1)).toFixed(1)+'dB)');
 for(const sub of [...new Set(a.map(r=>r.sub))]){const v=a.filter(r=>r.sub===sub).map(r=>r.after),bv=(T.levels||[]).filter(L=>!remapped.has(L.path)&&api.category(L.kind)?.cat===cat&&api.category(L.kind)?.sub===sub).map(L=>L.lufs+20*Math.log10(L.rowGain*L.roleGain*T.busGain));
  ok(pct(v,.9)-pct(v,.1)<=4,cat+'/'+sub+': 같은 쓰임 안 폭 p90−p10 '+(pct(bv,.9)-pct(bv,.1)).toFixed(1)+' → '+(pct(v,.9)-pct(v,.1)).toFixed(1)+'dB ≤ 4');}}
// 범주 사이 위계: 영웅 피격·타격·스킬이 몹 층보다 크게
const med=c=>pct((byCat[c]||[]).map(r=>r.after),.5);
ok(med('영웅피격')>med('일반몹')+6&&med('타격')>med('일반몹')+5&&med('스킬')>med('투사체')+3,'위계: 영웅 피격·타격·스킬 > 투사체·몹 층');
// ⑤ 음량 함수·trim 안전
const fsr=44100,sine=new Float32Array(fsr);for(let i=0;i<fsr;i++)sine[i]=.1*Math.sin(2*Math.PI*1000*i/fsr);
const l1=api.loudness([sine],fsr);ok(Number.isFinite(l1)&&Math.abs(l1-(-23.0))<=.8,'1kHz 사인 0.1 → K 가중 약 −23 LUFS('+(l1&&l1.toFixed(2))+')');
ok(api.loudness([new Float32Array(4000)],fsr)===null,'무음 → null');
const nanSig=Float32Array.from(sine);nanSig[10]=NaN;nanSig[20]=Infinity;const l2=api.loudness([nanSig],fsr);ok(Number.isFinite(l2),'NaN·Infinity 표본 → 유한 값');
ok(api.trimDb('r955Hit_spider',null,1,.3,-10)===0&&api.trimDb('r955Hit_spider',NaN,1,.3,-10)===0&&api.trimDb('r955Hit_spider',-20,NaN,.3,-10)===0,'측정 없음·NaN → trim 0');
ok(api.trimDb('nonexistent_kind_x',-30,1,.3,-10)===0,'모르는 종류 → trim 0');
const big=api.trimDb('hurt',-80,1,.3,-10),small=api.trimDb('r955Hit_spider',0,1,.3,-1);ok(big<=18&&small>=-12,'trim clamp −12~+18dB('+big+','+small+')');
const guard=api.trimDb('hurt',-60,1,.34,-1);ok(Math.pow(10,-1/20)*.34*Math.pow(10,guard/20)<=.6+1e-9,'피크 보호: 원본 피크×배율×trim ≤ 0.6('+guard.toFixed(2)+'dB)');
// ⑥ 변주
let seed=12345;const rnd=()=>{seed=(seed*1103515245+12345)%2147483648;return seed/2147483648;};
for(const k of ['r546Atk_hwando','r955Hit_spider','r788BHit_root','hurt','r544Click','r972_slash']){const c=api.category(k),rates=[],gains=[];let prev=null,same=0,bad2=0;
 for(let i=0;i<1000;i++){const v=api.vary(k,rnd);if(!Number.isFinite(v.rate)||!Number.isFinite(v.gainDb))bad2++;rates.push(v.rate);gains.push(v.gainDb);if(prev!=null&&Math.abs(prev-v.rate)<1e-9&&c.rateVar>0)same++;prev=v.rate;}
 const mean=rates.reduce((a,b)=>a+b,0)/rates.length;
 ok(!bad2&&Math.min(...rates)>=1-c.rateVar-1e-9&&Math.max(...rates)<=1+c.rateVar+1e-9&&Math.abs(mean-1)<.01&&same===0&&Math.max(...gains.map(Math.abs))<=c.gainVar+1e-9,
  k+': 변주 속도 ±'+c.rateVar+'·음량 ±'+c.gainVar+'dB·연속 같은 값 '+same+'·평균 '+mean.toFixed(4));}
ok(api.category('r544Click').rateVar<=.01,'UI 클릭은 음높이 거의 고정(≤1%)');
const vz=api.vary(null,()=>NaN);ok(vz&&vz.rate===1&&vz.gainDb===0,'이상 입력 → 변주 없음');
// ⑦ 동시 재생 모의: 쾌적 계층(MAX 4, 낮은 우선순위부터 빼앗기)과 같은 규칙으로 1.2초를 돈다
function sim(useR993){const live=[],log={heroDrop:0,heroStolen:0,lowPeak:0,totalPeak:0,admittedLow:0,stolenBy:{}};let t=0;const MAX=4;
 const enginePrio=k=>({awake:10,hurt:9,parry:8,boss:8,attack:4,enemyHit:2}[k]||4);
 const ev=[];for(let i=0;i<60;i++)ev.push({t:.3*i/60,k:['r955Hit_spider','r955Die_ghoul','r955Atk_boneguard','r954Hit_x','r785Hit_hwando'][i%5]});
 for(let i=0;i<6;i++)ev.push({t:.05+.2*i,k:'r546Atk_hwando',hero:true});ev.push({t:.31,k:'hurt',hero:true});ev.push({t:.71,k:'r544Hurt_hwando',hero:true});ev.sort((a,b)=>a.t-b.t);
 const state=useR993?api.admitState():null;
 for(const e of ev){t=e.t;for(let i=live.length-1;i>=0;i--)if(live[i].end<=t)live.splice(i,1);
  if(useR993&&!api.admit(state,e.k,t,live)){if(e.hero)log.heroDrop++;continue;}
  let pr=enginePrio(e.k);if(useR993){const c=api.category(e.k);if(c&&c.inPrio!=null)pr=c.inPrio;}
  if(live.length>=MAX){const low=live.reduce((a,b)=>a.prio<=b.prio?a:b);if(low.prio>pr){if(e.hero)log.heroDrop++;continue;}live.splice(live.indexOf(low),1);if(low.hero){log.heroStolen++;log.stolenBy[e.k]=(log.stolenBy[e.k]||0)+1;}}
  const c=api.category(e.k),prio=useR993&&c?c.prio:pr;live.push({k:e.k,end:t+.4,prio,hero:!!e.hero,low:c&&c.cls==='low'});if(c&&c.cls==='low')log.admittedLow++;
  log.lowPeak=Math.max(log.lowPeak,live.filter(v=>v.low).length);log.totalPeak=Math.max(log.totalPeak,live.length);}
 return log;}
const b0=sim(false),b1=sim(true);console.log('     모의(R993 없음):',JSON.stringify(b0));console.log('     모의(R993):',JSON.stringify(b1));
ok(b1.lowPeak<=2,'몹 층 동시 재생 ≤ 2 ('+b1.lowPeak+', 전 '+b0.lowPeak+')');
ok(b1.heroDrop===0&&b1.heroStolen===0,'영웅 타격·피격 거절 0·몹에게 빼앗김 0 (전 거절 '+b0.heroDrop+'·빼앗김 '+b0.heroStolen+')');
ok(b1.totalPeak<=4&&b1.admittedLow>=2,'전체 동시 ≤ 4·몹 소리도 계속 남(입장 '+b1.admittedLow+')');
let threw=false;try{api.admit(api.admitState(),undefined,NaN,null);api.admit(null,'r955Hit_x',0,[]);}catch(_){threw=true;}ok(!threw,'admit 이상 입력에도 던지지 않음');
console.log(`\nR993 CPU: ${n-bad}/${n}`);process.exit(bad?1:0);
