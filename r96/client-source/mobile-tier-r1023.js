// R1023 휴대폰 그래픽 자동 단계(사용자 2026-11-14 "모바일에서는 현재를 최저사향으로 해서 좋은환경일때는 피시급그래픽까지 올리도록 동시에 렉개선까지").
//  단계(휴대폰에서만, PC 는 그대로). 엔진은 휴대폰이면 부팅 때 늘 '가벼운 효과'(settings.lowFx)를 켜고 화면 배율을 1로 둔다:
//   0 낮음  = 지금 공개본 그대로(lowFx, 배율 1, 50만 화소 이상 그림 절반 사본 R1000, 빛·날씨 모바일 예산).
//   1 보통  = 200만 화소 이상 그림만 절반 사본(그 아래 그림은 원본 해상도), 나머지는 낮음과 같다.
//   2 높음  = lowFx 끔(빛 웅덩이·먼지·안개·필름 노이즈·투사체 상한 보통), 배율 ≤1.25, 200만 화소 이상만 절반.
//   3 PC급  = 절반 사본 없음, 배율 ≤1.5(PC 와 같은 상한), 빛·날씨 입자 PC 예산.
//  자동(기본): 시작은 늘 0. 플레이 중(서사·창·로딩·숨김 아님) 장면 간격을 1초마다 본다.
//   · 올림: 20초 넘게 '넉넉'(1초 중앙값 ≤20ms, 상위 10% ≤34ms)이고 메모리 신호가 괜찮으면 한 단계. 내린 뒤 2분은 다시 올리지 않는다.
//   · 내림: 4초 넘게 느리면(1초 중앙값 >28ms, R150 '렉 줄이기'와 같은 기준) 한 단계. JS 힙이 한도의 70% 를 넘으면 바로 0.
//     같은 단계에서 두 번 내려오면 그 판에서는 그 아래까지만 올린다.
//   · 최고 자동 단계: 기기 메모리(navigator.deviceMemory, 안드로이드 크롬, 8 이 최대값)가 8GB 면 3, 6GB 2, 4GB 1, 그보다 작으면 0.
//     모르면(아이폰 사파리 등) 올리지 않는다(지금 공개본 그대로, 높은 단계는 설정에서 직접 고른다). 헤드리스 측정에서 1단계만 올려도
//     그래픽 프로세스 메모리가 약 +170MB(700→871MB) 늘었고, 아이폰 13 미니는 0단계 상당에서도 꺼진 적이 있어서다.
//   · 꺼짐 방지: 1단계 이상에서 탭이 깨끗하게 닫히지 않고(페이지 숨김·닫힘 신호 없이) 다시 열리면 꺼진 것으로 보고 자동 최고 단계를 그 아래로 묶는다(저장).
//  PC(사용자 2026-11-14 "피시에서도 최저사양 설정 추가"): 기본은 지금 그대로(PC급, 아무것도 바꾸지 않음). 설정 › '그래픽 단계 낮음·보통·높음·PC급(기본)'에서
//   낮은 단계를 고르면 휴대폰과 같은 값(lowFx·배율·절반 사본·빛·날씨 예산)을 쓴다. PC 는 자동 판정·꺼짐 감지를 하지 않는다. PC급으로 돌아오면 원래 lowFx 로 되돌린다.
//  수동: 설정 › 간이설정 '휴대폰 그래픽 단계 자동·낮음·보통·높음·PC급'. 수동 단계는 느려져도 바꾸지 않는다. storyworld.r1023.mobileTier 에 저장.
//  자동 시험 브라우저(navigator.webdriver)는 그래픽 카드 없이 그려 장면 간격이 실제와 무관하므로 자동 판정을 하지 않는다(qa({auto:true}) 로만, 간격은 _feed).
//  표시(해상도·배율·꾸밈 입자)만 바꾼다. 판정·피해·저장·그림 원본 파일·세 모드 공통 코드는 그대로다.
(()=>{'use strict';
if(window.__STORYWORLD_MOBILE_TIER_R1023__)return;
const REV='R1023-mobile-tier-1',KEY='storyworld.r1023.mobileTier';
const GOOD_MED=20,GOOD_P90=34,SLOW_MED=28,UP_MS=20000,DOWN_MS=4000,COOL_MS=120000,HEAP_DROP=.7,HEAP_UP=.5,EVAL_MS=1000;
const TOP=3,HALF_MIN=[5e5,2e6,2e6,Infinity],DPR_CAP=[1,1,1.25,1.5],LOWFX=[true,true,false,false],NAMES=['낮음','보통','높음','PC급'],PREFS={low:0,mid:1,high:2,pc:3},PREF_KEYS=['auto','low','mid','high','pc'];
// 렉: 엔진 R63 isMobile 등 여러 오버레이가 장면마다 matchMedia(같은 문자열)를 새로 만든다(헤드리스 휴대폰 무한생존 40게임초 프로파일에 약 220ms).
//  MediaQueryList 는 살아 있는 객체(matches 가 저절로 바뀜)라 같은 문자열이면 처음 만든 것을 돌려줘도 값이 같다. PC·휴대폰 모두.
try{if(typeof window.matchMedia==='function'&&!window.matchMedia.r1023Cached){const mm=window.matchMedia,memo=new Map();
 const c=function(q){const k=String(q);let v=memo.get(k);if(!v){v=mm.call(window,k);if(memo.size<64)memo.set(k,v);}return v;};Object.defineProperty(c,'r1023Cached',{value:true});window.matchMedia=c;}}catch(_){}
let saved={};try{saved=JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch(_){saved={};}
let pref=PREF_KEYS.includes(saved.pref)?saved.pref:'auto';
let cap=Number.isInteger(saved.cap)&&saved.cap>=0&&saved.cap<=TOP?saved.cap:TOP,crashGuard=false;
const stats={evals:0,ups:0,downs:0,heapDrops:0,applies:0,resizes:0,errors:0};let lastError=null,lastChange='';
const fail=e=>{stats.errors++;lastError=String(e?.stack||e).slice(0,240);};
const automated=!!(typeof navigator!=='undefined'&&navigator.webdriver);
const qaState={auto:false,deviceMemory:undefined,heapRatio:undefined};
function mobile(){try{const m=window.__STORYWORLD_MOBILE_R63__;if(typeof m?.isMobile==='function')return !!m.isMobile();}catch(_){}
 try{return typeof matchMedia==='function'&&matchMedia('(pointer:coarse)').matches;}catch(_){return false;}}
const active=()=>mobile();
let pcTouched=false,pcLowFxBase=null;/* PC: 사람이 낮은 단계를 고른 적이 있는가, 그 전 lowFx */
const pcDefault=()=>!mobile()&&tier>=TOP&&!pcTouched;
function deviceMemory(){if(qaState.deviceMemory!==undefined)return qaState.deviceMemory;try{const v=navigator.deviceMemory;return Number.isFinite(v)&&v>0?v:null;}catch(_){return null;}}
function heapRatio(){if(qaState.heapRatio!==undefined)return qaState.heapRatio;try{const m=performance.memory;if(m&&m.jsHeapSizeLimit>0&&Number.isFinite(m.usedJSHeapSize))return m.usedJSHeapSize/m.jsHeapSizeLimit;}catch(_){}return null;}
function maxAuto(){const m=deviceMemory();const byMem=m==null?0:m>=8?3:m>=6?2:m>=4?1:0;return Math.min(byMem,cap,sessionCap);}
// 꺼짐 감지: 지난번에 1단계 이상이었는데 깨끗하게 닫히지 않았다.
try{if(mobile()&&saved.live&&Number.isInteger(saved.live.tier)&&saved.live.tier>=1){cap=Math.max(0,Math.min(cap,saved.live.tier-1));crashGuard=true;}}catch(_){}
let tier=mobile()?0:TOP,sessionCap=TOP;
function save(){try{localStorage.setItem(KEY,JSON.stringify({pref,cap,live:mobile()&&tier>=1&&!hiddenNow?{tier,at:Date.now()}:null}));}catch(_){}}
let hiddenNow=false;
// ---- 적용 ----
function wantedDpr(){try{if(typeof settings!=='undefined'&&settings?.lowFx)return 1;}catch(_){}return Math.min(devicePixelRatio||1,DPR_CAP[tier]);}
// lowFx 는 단계가 바뀔 때만 단계 값으로 맞춘다(그 사이 사람이 R114 그래픽 품질을 바꾸면 그 값을 따른다).
function applyLowFx(){try{if(typeof settings!=='undefined'&&settings){if(!mobile()){if(pcLowFxBase===null)pcLowFxBase=!!settings.lowFx;settings.lowFx=tier>=TOP?pcLowFxBase:LOWFX[tier];}else settings.lowFx=LOWFX[tier];}}catch(e){fail(e);}}
function applyDpr(){try{if(typeof dpr==='undefined'||typeof canvas==='undefined'||!canvas||typeof W!=='number'||typeof H!=='number')return;
 const d=wantedDpr();if(!Number.isFinite(d)||d<=0)return;if(d!==dpr||canvas.width!==Math.round(W*d)){dpr=d;canvas.width=Math.round(W*d);canvas.height=Math.round(H*d);stats.resizes++;}}catch(e){fail(e);}}
function apply(){if(pcDefault())return;/* PC 기본: 지금 그대로 */stats.applies++;
 try{const M=window.__STORYWORLD_MOBILE_MEMORY_R980__;if(M){if(typeof M.setHalfMin==='function'&&Number.isFinite(HALF_MIN[tier]))M.setHalfMin(HALF_MIN[tier]);if(typeof M.setTierHalf==='function')M.setTierHalf(tier<TOP,!mobile()&&tier<TOP);}}catch(e){fail(e);}
 applyLowFx();
 try{if(typeof resize==='function')resize();else applyDpr();}catch(e){fail(e);}
 save();rowRefresh();}
function setTier(t,why){t=Math.max(0,Math.min(TOP,t|0));if(t===tier&&why!=='init')return;const from=tier;tier=t;lastChange=(from+'→'+t)+' '+why;if(t>from)stats.ups++;else if(t<from)stats.downs++;apply();}
// 엔진 resize 뒤에 단계 배율을 다시 맞춘다(엔진은 휴대폰 1.25·PC 1.5 상한으로 정한다).
let resizeWrapped=false;
function wrapResize(){if(resizeWrapped||typeof resize!=='function')return;const base=resize;
 const w=function(){const r=base.apply(this,arguments);try{if(!pcDefault())applyDpr();}catch(e){fail(e);}return r;};
 try{resize=w;resizeWrapped=resize===w;}catch(e){fail(e);}}
// ---- 판정 ----
let clock=0,goodFor=0,slowFor=0,cooldownUntil=0,sinceEval=0;const samples=[];const drops=[0,0,0,0];
function q(a,p){const s=a.slice().sort((x,y)=>x-y);return s[Math.min(s.length-1,Math.floor((s.length-1)*p))];}
function sample(ms){if(!(typeof ms==='number'&&Number.isFinite(ms)&&ms>0&&ms<1000))return;clock+=ms;samples.push([clock,ms]);while(samples.length&&samples[0][0]<clock-EVAL_MS)samples.shift();
 sinceEval+=ms;if(sinceEval>=EVAL_MS){const step=sinceEval;sinceEval=0;evaluate(step);}}
function evaluate(step){stats.evals++;if(pref!=='auto'||!active())return;const g=samples.map(s=>s[1]);if(g.length<5)return;
 const med=q(g,.5),p90=q(g,.9),h=heapRatio();stats.median=Math.round(med*10)/10;stats.p90=Math.round(p90*10)/10;stats.heap=h==null?null:Math.round(h*100)/100;
 if(h!=null&&h>=HEAP_DROP&&tier>0){stats.heapDrops++;cooldownUntil=clock+COOL_MS;goodFor=slowFor=0;setTier(0,'heap '+Math.round(h*100)+'%');return;}
 if(med>SLOW_MED){slowFor+=step;goodFor=0;}else slowFor=0;
 if(med<=GOOD_MED&&p90<=GOOD_P90)goodFor+=step;else if(med>GOOD_MED)goodFor=0;
 if(slowFor>=DOWN_MS&&tier>0){const from=tier;drops[from]++;if(drops[from]>=2)sessionCap=Math.min(sessionCap,from-1);cooldownUntil=clock+COOL_MS;slowFor=goodFor=0;setTier(from-1,'slow median '+stats.median+'ms');return;}
 if(tier>=maxAuto())goodFor=0;/* 최고 단계에서는 넉넉한 시간을 쌓아 두지 않는다(허용이 늘면 다시 20초) */
 if(goodFor>=UP_MS&&clock>=cooldownUntil&&tier<maxAuto()&&(h==null||h<HEAP_UP)){goodFor=0;setTier(tier+1,'good median '+stats.median+'ms');}}
const playing=()=>{try{return typeof started!=='undefined'&&started&&!modal&&!loading&&!storyScene&&!document.hidden;}catch(_){return false;}};
let last=0;
function loop(t){try{const play=playing();if(play&&last&&t-last<1000&&(qaState.auto?false:!automated)&&pref==='auto'&&active())sample(t-last);last=play?t:0;}catch(e){fail(e);}requestAnimationFrame(loop);}
// ---- 설정 줄 ----
function css(){if(document.getElementById('mobileTierR1023Css'))return;const s=document.createElement('style');s.id='mobileTierR1023Css';
 s.textContent='#mobileTierRowR1023 .r1023-now{opacity:.75;font-size:.9em;margin-left:4px}';document.head.appendChild(s);}
const LBL={auto:'자동',low:'낮음',mid:'보통',high:'높음',pc:'PC급'};
function rowRefresh(){try{const row=document.getElementById('mobileTierRowR1023');if(!row)return;row.querySelectorAll('[data-r1023-tier]').forEach(x=>{const on=x.dataset.r1023Tier===pref||(!mobile()&&pref==='auto'&&x.dataset.r1023Tier==='pc');x.classList.toggle('active',on);x.setAttribute('aria-pressed',String(on));});
 const n=row.querySelector('.r1023-now');if(n)n.textContent=!mobile()?'':'(지금: '+NAMES[tier]+(pref==='auto'&&maxAuto()<TOP?' · 자동 최고 '+NAMES[maxAuto()]:'')+')';}catch(e){fail(e);}}
function settingsSection(){const host=document.getElementById('quickSettingsR114');if(!host||document.getElementById('mobileTierRowR1023'))return;css();
 const row=document.createElement('div');row.id='mobileTierRowR1023';row.className='r114-row';row.setAttribute('role','radiogroup');const pc=!mobile();row.setAttribute('aria-label',pc?'그래픽 단계':'휴대폰 그래픽 단계');
 row.innerHTML=(pc?'그래픽 단계 ':'휴대폰 그래픽 단계 ')+Object.keys(LBL).filter(k=>!(pc&&k==='auto')).map(k=>'<button type="button" data-r1023-tier="'+k+'" aria-pressed="false">'+(pc&&k==='pc'?'PC급(기본)':LBL[k])+'</button>').join(' ')+'<span class="r1023-now"></span>';
 const after=document.getElementById('perfRowR150')||host.querySelector(':scope>.r114-row');if(after)after.after(row);else host.appendChild(row);
 row.querySelectorAll('[data-r1023-tier]').forEach(b=>b.onclick=()=>setPref(b.dataset.r1023Tier));rowRefresh();}
function setPref(p){if(!PREF_KEYS.includes(p))return pref;pref=p;goodFor=slowFor=0;if(!mobile()&&p!=='auto'&&p!=='pc')pcTouched=true;
 if(p==='auto')setTier(mobile()?0:TOP,'pref auto');else setTier(PREFS[p],'pref '+p);save();rowRefresh();return pref;}
// ---- 시작 ----
function onHide(){hiddenNow=true;save();}
function onShow(){if(document.visibilityState==='visible'){hiddenNow=false;save();}}
function start(){try{wrapResize();css();
 if(pref!=='auto')tier=PREFS[pref];if(!mobile()&&tier<TOP)pcTouched=true;setTier(tier,'init');
 if(typeof showSettings==='function'){const b=showSettings;showSettings=function(...a){const r=b.apply(this,a);try{settingsSection();}catch(e){fail(e);}return r;};}
 window.addEventListener('pagehide',onHide);document.addEventListener('visibilitychange',()=>document.visibilityState==='hidden'?onHide():onShow());
 requestAnimationFrame(loop);}catch(e){fail(e);}}
if(document.readyState==='complete')start();else window.addEventListener('load',start,{once:true});
window.__STORYWORLD_MOBILE_TIER_R1023__=Object.freeze({revision:REV,storageKey:KEY,tier:()=>tier,pcGrade:()=>tier>=TOP,active,setPref,maxAuto,
 inspect:()=>({revision:REV,active:active(),pcDefault:pcDefault(),pcTouched,tier,pref,cap,sessionCap,maxAuto:maxAuto(),crashGuard,automated,deviceMemory:deviceMemory(),heap:heapRatio(),goodFor,slowFor,
  cooldownLeft:Math.max(0,cooldownUntil-clock),lastChange,halfMinPx:HALF_MIN[tier],dprCap:DPR_CAP[tier],stats:{...stats},lastError,presentationOnly:true,gameplayChanged:false}),
 qa(o){if(o&&typeof o==='object'){if('auto'in o)qaState.auto=!!o.auto;if('deviceMemory'in o)qaState.deviceMemory=o.deviceMemory;if('heapRatio'in o)qaState.heapRatio=o.heapRatio;}return {...qaState};},
 _feed(ms,sec){const n=Math.max(0,Math.round((Number(sec)||0)*1000/(Number.isFinite(ms)&&ms>0?ms:16.7)));for(let i=0;i<n&&i<1e5;i++)sample(ms);return this.inspect();}});
})();
