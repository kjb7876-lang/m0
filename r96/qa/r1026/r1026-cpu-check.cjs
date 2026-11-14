'use strict';
// R1026 적 피격·사망 효과음 또렷하게·생동감 — CPU 검사(브라우저 없이, 귀로 듣는 검증 아님).
// 사용자 2026-11-14 "효과음들 특히 적피격,사망 더 잘들리고 스타,워크등 참고해서 더 생동역동성있게 음향전문가동반해서 전체적인퀄리티업".
//  ① 빌드 연결(사본·태그 위치·verify 목록·pages.yml·manifest·R993 훅 두 줄)
//  ② 음량: R993 측정표(1,232줄)에 R993 trim + R1026 덧보정을 더한 실효 음량 — 몹 사망·몹 피격·적중음이 올라가고, 영웅 피격은 여전히 맨 위
//  ③ 들이기: 몹 폭주(300ms 몹 소리 60번 + 처치 12번 + 영웅 타격 6·피격 2)에서 사망음 자체 길(동시 2·간격 .07초·초당 7 이하)로 R993 때보다 많이 남고,
//     영웅 타격 어택은 거절·빼앗김 0, 전체 동시 4 이하
//  ④ 재생 노드: 가짜 AudioContext 로 onVoice — 피격은 EQ(중저음·존재감 ≤ +3.5dB), 사망은 꼬리(지연 3탭, 탭 이득 < .35, 저역통과), 값 모두 유한
//  ⑤ 몰아 처치: 간격에 걸려 빠진 사망음은 다음 사망음을 +1.5dB(최대 +3dB) 굵게
//  ⑥ 끄기(storyworld.r1026.sfx=0)·이상 입력(NaN·null)에서 던지지 않고 R993 기본 동작으로 돌아감
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;
const ok=(c,m)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('ok  ',m);};
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return'';}};
const NAME='sfx-punch-r1026.js',src=rd(path.join(R,'client-source',NAME)),r993=rd(path.join(R,'client-source','sfx-mix-r993.js'));
// ① 빌드 연결
ok(src.length>0,NAME+' 존재');
ok(src.length>0&&rd(path.join(R,'runtime-text',NAME))===src,'runtime-text 사본 = client-source');
ok(rd(path.join(R,'runtime-text','sfx-mix-r993.js'))===r993,'R993 runtime-text 사본 = client-source');
const html=rd(path.join(R,'runtime-text/index.html')),tag='<script src="./'+NAME+'"></script>';
ok(html.includes(tag)&&html.indexOf(tag)>html.indexOf('<script src="./sfx-mix-r993.js">')&&html.indexOf(tag)<html.indexOf('<script src="./combat-r118.js">'),'index.html 태그(R993 뒤·combat-r118 앞)');
ok(rd(path.join(ROOT,'scripts/verify-r96-public.py')).includes("'"+NAME+"'"),'verify-r96-public.py 기대 목록');
ok(rd(path.join(ROOT,'.github/workflows/pages.yml')).includes('node r96/qa/r1026/r1026-cpu-check.cjs'),'pages.yml CPU 검사 줄');
ok(rd(path.join(R,'runtime-manifest.json')).includes(NAME),'runtime-manifest 에 오버레이');
ok(/__STORYWORLD_SFX_PUNCH_R1026__[^\n]*\.admit\(/.test(r993)&&/__STORYWORLD_SFX_PUNCH_R1026__[^\n]*\.onVoice\(/.test(r993),'R993 훅(admit·onVoice) 두 곳');
// 두 오버레이를 같은 vm 에 올린다
function load(store){const ctx={console,Math,Number,JSON,Object,Array,Map,Set,WeakMap,WeakSet,Float32Array,Float64Array,
 performance:{now:()=>0},localStorage:{getItem:k=>store[k]??null,setItem:()=>{}},document:{readyState:'loading',addEventListener(){}},setTimeout:()=>0,setInterval:()=>0,addEventListener(){}};
 ctx.window=ctx;vm.createContext(ctx);
 try{vm.runInContext(r993,ctx,{filename:'sfx-mix-r993.js'});vm.runInContext(src,ctx,{filename:NAME});}catch(e){console.log('load error',String(e).slice(0,200));}
 return {mix:ctx.__STORYWORLD_SFX_MIX_R993__,P:ctx.__STORYWORLD_SFX_PUNCH_R1026__,ctx};}
const {mix,P}=load({});
ok(!!mix&&!!P&&['admit','onVoice','extraDb','lane','inspect','effectiveTarget'].every(k=>typeof P[k]==='function'),'API(admit·onVoice·extraDb·lane·effectiveTarget·inspect)');
if(!mix||!P){console.log(`\nR1026 CPU: ${n-bad}/${n}`);process.exit(1);}
// ② 음량
const C=k=>mix.category(k);
ok(P.lane(C('r955Die_ghoul'))==='death'&&P.lane(C('r541Death'))==='death'&&P.lane(C('r954Die_x'))==='death','사망 길: r955Die·r541Death·r954Die');
ok(P.lane(C('r955Hit_spider'))==='hit'&&P.lane(C('enemyHit'))==='hit'&&P.lane(C('r785Hit_hwando'))==='hit'&&P.lane(C('r788BHit_root'))==='hit','피격 길: 몹·적중음·보스 피격');
ok(P.lane(C('r546Atk_hwando'))===null&&P.lane(C('hurt'))===null&&P.lane(C('r955Atk_boneguard'))===null&&P.lane(null)===null,'영웅 타격·영웅 피격·몹 공격·null 은 길 없음');
const T=JSON.parse(rd(path.join(R,'qa/r993/sfx-table.json'))||'{}'),remapped=new Set(Object.keys(mix.remap||{}));
const eff={},base={};for(const L of T.levels||[]){if(remapped.has(L.path))continue;const c=C(L.kind);if(!c)continue;const b=L.lufs+20*Math.log10(L.rowGain*L.roleGain*T.busGain)+mix.trimDb(L.kind,L.lufs,L.rowGain,L.roleGain,L.peakDb);
 const key=c.cat+'/'+c.sub;(base[key]=base[key]||[]).push(b);(eff[key]=eff[key]||[]).push(b+P.extraDb(c));}
const med=a=>{const s=[...(a||[])].sort((x,y)=>x-y);return s.length?s[Math.floor(s.length/2)]:NaN;};
const d=k=>med(eff[k])-med(base[k]);
console.log('     실효 중앙값(R993→R1026):',Object.keys(eff).sort().map(k=>k+' '+med(base[k]).toFixed(1)+'→'+med(eff[k]).toFixed(1)).join(' · '));
ok(d('일반몹/die')>=3&&d('일반몹/die')<=6,'몹 사망 +3~6dB ('+d('일반몹/die').toFixed(1)+')');
ok(d('일반몹/hit')>=3&&d('일반몹/hit')<=5,'몹 피격 +3~5dB ('+d('일반몹/hit').toFixed(1)+')');
ok(d('적피격/hit')>=1.5&&d('적피격/hit')<=3.5,'적중음 +1.5~3.5dB ('+d('적피격/hit').toFixed(1)+')');
ok(d('보스/hit')>=1.5&&d('보스/hit')<=3.5,'보스 피격 +1.5~3.5dB ('+d('보스/hit').toFixed(1)+')');
ok(Math.abs(d('영웅피격/hurt'))<.01&&Math.abs(d('타격/atk'))<.01&&Math.abs(d('스킬/cast'))<.01&&Math.abs(d('일반몹/atk'))<.01,'영웅 피격·타격·스킬·몹 공격은 그대로');
ok(med(eff['영웅피격/hurt'])>med(eff['일반몹/die'])+2.5,'위계: 영웅 피격 > 몹 사망 +2.5dB ('+med(eff['영웅피격/hurt']).toFixed(1)+' > '+med(eff['일반몹/die']).toFixed(1)+')');
ok(med(eff['보스/die'])>med(eff['일반몹/die'])+1.5,'위계: 보스 사망 > 몹 사망 +1.5dB');
ok(med(eff['일반몹/die'])>med(eff['일반몹/hit'])+2&&med(eff['일반몹/die'])>med(eff['일반몹/atk'])+3,'위계: 몹 사망 > 몹 피격 +2·몹 공격 +3');
ok(med(eff['일반몹/die'])>=-41&&med(eff['일반몹/die'])<=-39,'몹 사망 실효 −41~−38 ('+med(eff['일반몹/die']).toFixed(1)+')');
// ③ 들이기 모의 (R993 검사와 같은 틀 + 처치 12번)
function sim(withPunch){const {mix:M,P:Q}=withPunch?load({}):load({'storyworld.r1026.sfx':'0'});const live=[],log={heroDrop:0,heroStolen:0,deathIn:0,deathOff:0,deathPeak:0,lowPeak:0,totalPeak:0,deathTimes:[],hitIn:0};const MAX=4;
 const enginePrio=k=>({awake:10,hurt:9,parry:8,boss:8,attack:4,enemyHit:2}[k]||4);
 const ev=[];for(let i=0;i<60;i++)ev.push({t:.3*i/60,k:['r955Hit_spider','r955Atk_ghoul','r955Atk_boneguard','r954Hit_x','r785Hit_hwando'][i%5]});
 for(let i=0;i<12;i++)ev.push({t:.02+.09*i,k:i%3?'r955Die_ghoul':'r541Death',death:true});
 for(let i=0;i<6;i++)ev.push({t:.05+.2*i,k:'r546Atk_hwando',hero:true});ev.push({t:.31,k:'hurt',hero:true});ev.push({t:.71,k:'r544Hurt_hwando',hero:true});ev.sort((a,b)=>a.t-b.t);
 const state=M.admitState();
 for(const e of ev){const t=e.t;for(let i=live.length-1;i>=0;i--)if(live[i].end<=t||live[i].stopping)live.splice(i,1);
  if(!M.admit(state,e.k,t,live)){if(e.hero)log.heroDrop++;if(e.death)log.deathOff++;continue;}
  for(let i=live.length-1;i>=0;i--)if(live[i].stopping)live.splice(i,1);
  const c=M.category(e.k);let pr=enginePrio(e.k);
  if(live.length>=MAX){const low=live.reduce((a,b)=>a.prio<=b.prio?a:b);if(low.prio>pr){if(e.hero)log.heroDrop++;if(e.death)log.deathOff++;continue;}live.splice(live.indexOf(low),1);if(low.hero&&t-low.start<.3){log.heroStolen++;}}
  let prio=c?c.prio:pr;if(withPunch&&c){const v={kind:e.k,priority:prio};Q.onVoice(v,null,c,t,{});prio=v.priority;}
  live.push({k:e.k,kind:e.k,priority:prio,start:t,end:t+(e.death?.6:.4),prio,hero:!!e.hero,death:!!e.death,low:c&&c.cls==='low'});
  if(e.death){log.deathIn++;log.deathTimes.push(t);}if(c&&withPunch&&Q.lane(c)==='hit')log.hitIn++;
  log.deathPeak=Math.max(log.deathPeak,live.filter(v=>v.death).length);log.totalPeak=Math.max(log.totalPeak,live.length);}
 return log;}
const s0=sim(false),s1=sim(true);console.log('     모의(R993만):',JSON.stringify({...s0,deathTimes:undefined}));console.log('     모의(R1026):',JSON.stringify({...s1,deathTimes:undefined}));
ok(s1.deathIn>=s0.deathIn+3&&s1.deathIn>=6,'처치 12번 중 사망음 '+s0.deathIn+' → '+s1.deathIn+' (≥6, +3 이상)');
const gaps=s1.deathTimes.slice(1).map((t,i)=>t-s1.deathTimes[i]);ok(gaps.every(g=>g>=.07-1e-9),'사망음 간격 ≥ .07초 (최소 '+(gaps.length?Math.min(...gaps).toFixed(3):'-')+')');
let perSec=0;for(const t of s1.deathTimes)perSec=Math.max(perSec,s1.deathTimes.filter(x=>x>=t&&x<t+1).length);ok(perSec<=7,'사망음 초당 ≤ 7 ('+perSec+')');
ok(s1.deathPeak<=2,'사망음 동시 ≤ 2 ('+s1.deathPeak+')');
ok(s1.heroDrop===0&&s1.heroStolen===0,'영웅 타격·피격 거절 0·어택 빼앗김 0 (거절 '+s1.heroDrop+'·빼앗김 '+s1.heroStolen+')');
ok(s1.totalPeak<=4,'전체 동시 ≤ 4 ('+s1.totalPeak+')');
// 초당 상한(1.5초 동안 .05초마다 처치)
{const {mix:M,P:Q}=load({}),st=M.admitState();let inN=0;const times=[];for(let i=0;i<30;i++){const t=i*.05;if(M.admit(st,'r955Die_ghoul',t,[])){times.push(t);inN++;}}
 let ps=0;for(const t of times)ps=Math.max(ps,times.filter(x=>x>=t&&x<t+1).length);ok(ps<=7&&inN>=8,'연속 처치 30번(.05초 간격): 초당 ≤ 7 ('+ps+'), 입장 '+inN);}
// 피격 길: 몹 피격은 R993 에서 붐빌 때 다 빠졌지만 이제 .09초에 한 번은 남음
{const {mix:M}=load({}),st=M.admitState();const busy=[{kind:'r546Atk_hwando'},{kind:'hurt'},{kind:'r955Atk_ghoul'}];let inN=0,last=-1,minGap=9;
 for(let i=0;i<40;i++){const t=i*.03;if(M.admit(st,'r955Hit_spider',t,busy)){inN++;if(last>=0)minGap=Math.min(minGap,t-last);last=t;}}
 const {mix:M0}=load({'storyworld.r1026.sfx':'0'}),s0b=M0.admitState();let in0=0;for(let i=0;i<40;i++)if(M0.admit(s0b,'r955Hit_spider',i*.03,busy))in0++;
 ok(inN>=8&&minGap>=.09-1e-9&&in0===0,'붐빌 때(3음) 몹 피격: R993 '+in0+' → '+inN+'번, 간격 ≥ .09 ('+minGap.toFixed(3)+')');}
// ④ 재생 노드(가짜 AudioContext)
function fakeAC(){const made=[];const param=v=>({value:v,setValueAtTime(){},linearRampToValueAtTime(){},cancelScheduledValues(){},exponentialRampToValueAtTime(){}});
 const node=(type,extra)=>{const o={conns:[],connect(x){this.conns.push(x);return x;},disconnect(){this.conns=[];},...extra,nodeType:type};made.push(o);return o;};
 const ac={currentTime:1,made,createGain:()=>node('gain',{gain:param(1)}),createBiquadFilter:()=>node('biquad',{frequency:param(350),Q:param(1),gain:param(0)}),createDelay:()=>node('delay',{delayTime:param(0)})};return ac;}
function voice(kind){const ac=fakeAC(),trim=ac.createGain(),vg=ac.createGain(),src={context:ac,buffer:{duration:.6},conns:[],connect(x){this.conns.push(x);return x;},disconnect(){this.conns=[];},playbackRate:{value:1},addEventListener(){}};
 trim.gain.value=.5;src.connect(trim);trim.connect(vg);const v={kind,priority:1,gain:vg,source:src,r993:{trim,lin:.5,trimDb:-6}};return {ac,v,src,trim};}
{const {ac,v,src,trim}=voice('r955Hit_spider');P.onVoice(v,src,C('r955Hit_spider'),1,{level:.2,master:ac.createGain()});
 const bq=ac.made.filter(x=>x.nodeType==='biquad');ok(bq.length>=2&&bq.every(b=>Number.isFinite(b.gain.value)&&b.gain.value<=3.5&&b.gain.value>=0&&Number.isFinite(b.frequency.value)),'피격 EQ '+bq.map(b=>b.frequency.value+'Hz +'+b.gain.value+'dB').join(', '));
 ok(bq.some(b=>b.frequency.value>=150&&b.frequency.value<=320)&&bq.some(b=>b.frequency.value>=1200&&b.frequency.value<=2600),'피격 EQ: 중저음(150~320Hz)·존재감(1.2~2.6kHz)');
 ok(src.conns.length===1&&src.conns[0].nodeType==='biquad','소스 → EQ → trim 으로 다시 이음');
 ok(P.eqCompDb('hit')>0&&P.eqCompDb('hit')<=1.5&&Math.abs(trim.gain.value-.5*Math.pow(10,(P.extraDb(C('r955Hit_spider'))-P.eqCompDb('hit'))/20))<1e-6&&Math.abs(v.r993.lin-trim.gain.value)<1e-9,'trim 덧보정(EQ 몫 '+P.eqCompDb('hit')+'dB 뺌) 반영·더킹 기준(lin)도 같이');
 ok(v.priority===2,'몹 피격 우선순위 2 ('+v.priority+')');}
{const {ac,v,src}=voice('r955Die_ghoul');const master=ac.createGain();P.onVoice(v,src,C('r955Die_ghoul'),1,{level:.2,master});
 const dl=ac.made.filter(x=>x.nodeType==='delay'),taps=ac.made.filter(x=>x.nodeType==='gain'&&x.r1026Tap);
 ok(dl.length===3&&dl.every(x=>x.delayTime.value>=.04&&x.delayTime.value<=.3),'사망 꼬리 지연 3탭 '+dl.map(x=>x.delayTime.value).join(','));
 ok(taps.length===3&&taps.every(x=>Number.isFinite(x.gain.value)&&x.gain.value>0&&x.gain.value<.35)&&taps[0].gain.value>taps[2].gain.value,'꼬리 탭 이득 < .35·점점 작게 '+taps.map(x=>x.gain.value.toFixed(3)).join(','));
 ok(ac.made.some(x=>x.nodeType==='biquad'&&x.r1026Lp&&x.frequency.value>=800&&x.frequency.value<=2200),'꼬리 저역통과(0.8~2.2kHz)');
 ok(ac.made.some(x=>x.conns&&x.conns.includes(master)),'꼬리는 목소리 엔벨로프 밖(마스터)으로 → 소리가 끝나도 꼬리가 남음');
 ok(v.priority===4,'사망 우선순위 4 ('+v.priority+')');
 const before=ac.made.length,trim2=ac.createGain(),vg2=ac.createGain(),src2={context:ac,buffer:{duration:.6},conns:[],connect(x){this.conns.push(x);return x;},disconnect(){this.conns=[];},playbackRate:{value:1},addEventListener(){}};src2.connect(trim2);
 P.onVoice({kind:'r955Die_ghoul',priority:1,gain:vg2,source:src2,r993:{trim:trim2,lin:.5}},src2,C('r955Die_ghoul'),1.2,{level:.2,master});const add=ac.made.slice(before+2);
 ok(add.filter(x=>x.nodeType==='delay').length===0&&add.filter(x=>x.nodeType==='gain').length===1&&add.filter(x=>x.nodeType==='biquad').length===2,'두 번째 사망음: 꼬리 지연망은 함께 씀(새 지연 0·보내기 1·EQ 2)');
 ok(src.playbackRate.value<=1&&src.playbackRate.value>=.9,'사망 재생 속도 살짝 낮게(무게) '+src.playbackRate.value);}
{const {ac,v,src}=voice('r546Atk_hwando');const before=ac.made.length;P.onVoice(v,src,C('r546Atk_hwando'),1,{level:.2,master:ac.createGain()});ok(ac.made.length===before+1&&v.priority===1,'영웅 타격은 손대지 않음');}
// 저사양(settings.lowFx, 모바일 기본): EQ 하나(존재감)만
{const {mix:M,P:Q,ctx}=load({});ctx.settings={lowFx:true,volume:1};const {ac,v,src}=voice('r955Hit_spider');Q.onVoice(v,src,M.category('r955Hit_spider'),1,{level:.2,master:ac.createGain()});
 const bq=ac.made.filter(x=>x.nodeType==='biquad');ok(bq.length===1&&bq[0].frequency.value>=1200,'저사양: 피격 EQ 1개(존재감 '+(bq[0]&&bq[0].frequency.value)+'Hz)');}
// ⑤ 몰아 처치
{const {mix:M,P:Q}=load({}),st=M.admitState();M.admit(st,'r955Die_ghoul',0,[]);const dropped=!M.admit(st,'r955Die_ghoul',.02,[])&&!M.admit(st,'r955Die_ghoul',.04,[])&&!M.admit(st,'r955Die_ghoul',.05,[]);
 const b=Q.pendingBoostDb();ok(dropped&&b>=1.5&&b<=3,'빠진 처치 3번 → 다음 사망음 +'+b+'dB (1.5~3)');
 M.admit(st,'r955Die_ghoul',.2,[]);const {ac,v,src,trim}=voice('r955Die_ghoul');Q.onVoice(v,src,M.category('r955Die_ghoul'),1,{level:.2,master:ac.createGain()});
 ok(Math.abs(20*Math.log10(trim.gain.value/.5)-(Q.extraDb(M.category('r955Die_ghoul'))-Q.eqCompDb('death')+b))<.01&&Q.pendingBoostDb()===0,'굵게 한 번 쓰고 0 으로');}
// ⑥ 끄기·이상 입력
{const {mix:M,P:Q}=load({'storyworld.r1026.sfx':'0'});ok(Q&&Q.enabled()===false&&Q.admit(M.category('r955Die_ghoul'),0,[])===undefined,'끄기: admit 결정 안 함(R993 기본)');
 const {ac,v,src}=voice('r955Die_ghoul');const b=ac.made.length;Q.onVoice(v,src,M.category('r955Die_ghoul'),1,{level:.2,master:ac.createGain()});ok(ac.made.length===b+1&&v.priority===1,'끄기: 노드·우선순위 그대로');}
// ⑦ 영웅 소리 직전 걷히는 소리 정리(엔진이 걷히는 소리 때문에 영웅 소리를 버리지 않게)
{const {mix:M,P:Q,ctx}=load({});const ac={currentTime:2};const g=()=>({value:.3,setValueAtTime(){},linearRampToValueAtTime(){},cancelScheduledValues(){}});let stops=0;const mk=(kind,stopping)=>({kind,stopping,gain:{gain:g()},source:{context:ac,stop(){stops++;}}});
 ctx.sfxLive=[mk('r955Die_ghoul',true),mk('r546Atk_hwando',false),mk('r955Hit_spider',true),mk('hurt',false)];vm.runInContext('void 0',ctx);
 const n1=Q.beforePlay(M.category('r546Atk_hwando'));ok(n1===2&&ctx.sfxLive.length===2&&ctx.sfxLive.every(v=>!v.stopping)&&stops===2,'영웅 타격 직전: 걷히는 소리 2개 정리·멈춤 ('+n1+', 남은 '+ctx.sfxLive.length+')');
 ctx.sfxLive.push(mk('r955Die_x',true));const n2=Q.beforePlay(M.category('r955Hit_spider'));ok(n2===0&&ctx.sfxLive.length===3,'몹 소리 직전에는 정리 안 함');
 ok(Q.beforePlay(null)===0&&Q.beforePlay(M.category('hurt'))===1,'null 은 0·영웅 피격은 정리');
 ctx.sfxLive.push(mk('r955Hit_y',true));ok(Q.beforePlay(M.category('r955Die_ghoul'))===1,'사망음 직전에도 정리(엔진이 사망음을 버리지 않게)');}
{const {mix:M,P:Q,ctx}=load({'storyworld.r1026.sfx':'0'});ctx.sfxLive=[{kind:'x',stopping:true}];ok(Q.beforePlay(M.category('hurt'))===0&&ctx.sfxLive.length===1,'끄기: 정리 안 함');}
ok(/__STORYWORLD_SFX_PUNCH_R1026__[^\n]*\.beforePlay\(/.test(r993),'R993 훅(beforePlay)');
let threw=false;try{P.admit(null,NaN,null);P.admit(C('r955Die_ghoul'),NaN,undefined);P.onVoice(null,null,null,NaN,null);P.onVoice({kind:'r955Die_ghoul'},{},C('r955Die_ghoul'),NaN,{level:NaN});P.extraDb(null);P.beforePlay(undefined);P.beforePlay({cls:'high'});}catch(e){threw=String(e);}
ok(!threw,'이상 입력에 던지지 않음 '+(threw||''));
ok(Number.isFinite(P.extraDb(null))&&P.extraDb(null)===0,'extraDb(null)=0');
console.log(`\nR1026 CPU: ${n-bad}/${n}`);process.exit(bad?1:0);
