// R1358 모든 보스 고유 특수 스킬 + 보스 낙인(상태이상) — 사용자 2026-11-27 05:00Z "탐식 위장 꿈틀처럼 모든보스들 고유 특수스킬 사용하도록 닷츠와협업",
//  05:02Z "보스들 고유 특수스킬 사용-영웅에게 초당 체력6프로의 도트뎀+방어무시 =상태이상취급= 공명으로해결(d키)".
//  ① 고유 스킬이 없던 중간보스 33명·상위수문장 12명에게 각자 다른 모양 × 다른 프레임 시트의 고유 특수 스킬(R1346 시그니처 틀을 register 로 씀).
//     그림은 저장소 Dots 시트를 쓴 임시본. Dots 요청서 SW-R1358(보스마다 한 장)이 오면 DOTS 표에 넣어 그 보스만 정식 시트로 바뀐다.
//     본보스 16명(R1346 시그니처)도 같은 DOTS 표로 정식 시트를 받는다. 메테오·바닥 고리는 그대로(R241), 바닥 예고·도형 투사체 없음.
//  ② 보스 낙인: 보스 고유 특수 스킬(R1346·R1358 시그니처, 루시퍼 가면·제72문 그림자·나태 던지기·7대죄 스킬·색욕 입맞춤·질투 유리·탐식 위장)에 맞으면
//     영웅 최대 체력의 초당 6% 지속 피해, 방어·보호막·무적 시간 무시. 상태이상(타락 아이콘)으로 보이고 공명 방어(D키)를 누르는 순간 풀린다.
//     다시 맞으면 겹치지 않고 시간만 새로(초당 6% 그대로). 6초 뒤 저절로 끝(사용자 11-27 06:01Z '낙인은 6초감'). 낙인만으로는 체력 1 아래로 떨어지지 않는다(죽음은 보스의 직접 타격만).
//     패링(D 직후 짧은 순간)·무적 회피로 막은 타격은 낙인도 없다. 창·로딩·서사 장면 중에는 멈춘다.
//  맘몬 지역(b06·b06b·금고 장부감시자·겨울숲 가시파수)은 사용자 승인 전 손대지 않는다. 질투·탐식 본보스·중간보스(b03·b04·mb-ep1b03·04)는 다른 스레드 몫.
//  끄기: localStorage['storyworld.r1358.unique']='{"on":false}' (고유 스킬) / '{"mark":false}' (낙인만).
(()=>{'use strict';
if(window.__STORYWORLD_BOSS_UNIQUE_R1358__)return;
const REV='R1358-unique-1',KEY='storyworld.r1358.unique';
let prefs={on:true,mark:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const G=k=>{try{return Function('return typeof '+k+'!=="undefined"?'+k+':undefined')();}catch(_){return undefined;}};
const T=()=>{const t=G('time');return typeof t==='number'&&Number.isFinite(t)?t:0;};
const ID=window.__STORYWORLD_BOSS_IDENTITY_R1346__;
const stats={registered:0,dots:0,afflicted:0,refreshed:0,cleansed:0,expired:0,ticks:0,damage:0,floored:0,skipped:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const B='boss-';
// ---- ① 고유 특수 스킬 표: id → [모양, 임시 시트, 이름(지금 패턴·이름에서), Dots 요청 번호] ----
const NEW={
 // 중간보스
 'mb-dist01':['zigzag','enemy-curse-brand','보라검 거미줄 절단','SW-R1358-17'],
 'mb-dist02':['expand','enemy-poison-mist','독수렁 포위환','SW-R1358-18'],
 'mb-dist03':['chase',B+'corpse-explosion','피 묻은 발자국','SW-R1358-19'],
 'mb-dist04':['line','black-burst','두 번째 죽음의 검','SW-R1358-20'],
 'mb-dist05':['cross',B+'gravity-well','마지막 유언 교차','SW-R1358-21'],
 'mb-dist06':['ring',B+'fire-wall','검은기둥 봉쇄','SW-R1358-22'],
 'mb-ep1a08':['wall',B+'lightning-strike','형광등 안정화선','SW-R1358-23'],
 'mb-ep1a08s':['wall',B+'corpse-explosion','집도의 절개선','SW-R1358-62'],// 병원 심부의 집도의(안정화 감독과 이름표가 같아 따로 나눔)
 'mb-ep1a09':['rain',B+'infection-mark','주사실 기억역류','SW-R1358-24'],// 게임 안에서는 '중독을 부르는 주사기 환영체'
 'mb-ep1a10':['expand',B+'bone-spikes','자기파괴 낙하','SW-R1358-25'],
 'mb-ep1a11':['orbit','black-flare','웃는 초천사의 광륜','SW-R1358-26'],
 'mb-ep1b02':['spiral','enemy-poison-mist','달팽이 허무환','SW-R1358-27'],
 'mb-ep1b05':['cross','enemy-curse-brand','붉은 하이힐 절단','SW-R1358-28'],
 'mb-ep1b07':['zigzag',B+'fire-wall','곰·늑대·용의 불길','SW-R1358-29'],
 'mb-ep1b08':['line',B+'bone-spikes','성당 창 솟음','SW-R1358-30'],
 'mb-ep1b09':['orbit',B+'lightning-strike','생체부트로더 복제 방전','SW-R1358-31'],
 'u201-mid':['wall',B+'infection-mark','관측 표식 주사','SW-R1358-32'],
 'u202-mid':['ring',B+'bone-spikes','진압선 압착','SW-R1358-33'],
 'u203-mid':['spiral',B+'gravity-well','공허 기억흡입','SW-R1358-34'],
 'u204-mid':['rain','enemy-curse-brand','호출부호 검열','SW-R1358-35'],
 'u205-mid':['chase','black-burst','삭제 목록 포화','SW-R1358-36'],
 'u206-mid':['expand',B+'tentacle-bind','중앙이주 코어 촉수','SW-R1358-37'],
 'mb-hando01':['cross','black-flare','위조 귀환좌표','SW-R1358-38'],
 'mb-hando02':['line','enemy-poison-mist','백은 봉인선','SW-R1358-39'],
 'mb-hando03':['zigzag','black-flare','환수검 모사','SW-R1358-40'],
 'mb-murder01':['chase','enemy-cold-wave','파란불 역주행','SW-R1358-41'],
 'mb-murder02':['wall','enemy-curse-brand','공실장부 말소','SW-R1358-42'],
 'mb-murder03':['rain',B+'gravity-well','낙하 원인역전','SW-R1358-43'],
 'murder04-mid':['orbit','enemy-curse-brand','인과 고리 역전환','SW-R1358-44'],
 'c101-mid':['cross',B+'fire-wall','칩 제단 방화벽','SW-R1358-45'],
 'c103-mid':['ring',B+'infection-mark','삼중자아 회로 · 황금 격자','SW-R1358-46'],
 'c104-mid':['rain','black-burst','극지 잔해 염동포화','SW-R1358-47'],
 'c105-mid':['spiral',B+'infection-mark','ID 생체조 꿈틀','SW-R1358-48'],
 'c106-mid':['line',B+'lightning-strike','기계재판 집행','SW-R1358-49'],
 // 상위수문장(카이로노미콘) — 번호마다 다른 모양·그림
 'kair-elite-49':['orbit',B+'bone-spikes','수문장 49 · 시간 톱니','SW-R1358-50'],
 'kair-elite-50':['zigzag',B+'gravity-well','수문장 50 · 역행 모래','SW-R1358-51'],
 'kair-elite-51':['expand',B+'lightning-strike','수문장 51 · 정오의 종','SW-R1358-52'],
 'kair-elite-52':['wall','enemy-cold-wave','수문장 52 · 멈춘 초침','SW-R1358-53'],
 'kair-elite-53':['ring',B+'tentacle-bind','수문장 53 · 태엽 사슬','SW-R1358-54'],
 'kair-elite-54':['chase',B+'ground-fissure','수문장 54 · 금 간 시계판','SW-R1358-55'],
 'kair-elite-55':['spiral','black-flare','수문장 55 · 검은 해시계','SW-R1358-56'],
 'kair-elite-56':['cross',B+'corpse-explosion','수문장 56 · 붉은 시침','SW-R1358-57'],
 'kair-elite-57':['zigzag',B+'infection-mark','수문장 57 · 흐르는 숫자판','SW-R1358-58'],
 'kair-elite-58':['expand',B+'ground-fissure','수문장 58 · 무너지는 탑시계','SW-R1358-59'],
 'kair-elite-59':['line',B+'corpse-explosion','수문장 59 · 핏빛 진자','SW-R1358-60'],
 'kair-elite-60':['orbit','enemy-poison-mist','수문장 60 · 안개 시곗바늘','SW-R1358-61']};
// R1346 본보스 시그니처 16명의 Dots 요청 번호(그림만 바꿈; 모양·이름은 R1346 그대로)
const MAIN_DOTS={'dist00-boss':'SW-R1358-01','u203-boss':'SW-R1358-02','l301-boss':'SW-R1358-03','l303-boss':'SW-R1358-04','l305-boss':'SW-R1358-05',
 'kair-great-01':'SW-R1358-06','kair-great-02':'SW-R1358-07','kair-great-03':'SW-R1358-08','kair-great-04':'SW-R1358-09','kair-great-05':'SW-R1358-10','kair-great-06':'SW-R1358-11',
 'k103-boss':'SW-R1358-12','h103-boss':'SW-R1358-13','c102-boss':'SW-R1358-14','c103-boss':'SW-R1358-15','c104-boss':'SW-R1358-16'};
// Dots 정식 시트(받아서 7분야 심사를 넘은 것만). 보스 id → {path, cell, n, fps, py(바닥 접점 y)}. 가로 한 줄 시트.
const DOTS={
 // SW-R1352 D10(Dots, 11-27) → R1358 로 넘겨받음. 24칸 6144×256, 기준점 칸 가운데(128,128), 가장 큰 칸 9~11.
 // 그림이 칸의 40~53%만 차지해(R411 시트보다 작음) scale 1.7 로 다른 보스 스킬과 비슷한 크기로.
 'mb-dist01':{path:'assets/r1358/mb-dist01-violet-sword-cleave.webp',cell:256,n:24,fps:16,py:128,scale:1.7},// D10-01 보라검 한 번 베기·조각 흩어짐
 'c106-mid':{path:'assets/r1358/c106-mid-judgment-core-claw.webp',cell:256,n:24,fps:16,py:128,scale:1.7},// D10-02 기계 심판 코어 세 갈퀴·흑연·청동 파편
 'mb-ep1a09':{path:'assets/r1358/mb-ep1a09-syringe-wisp.webp',cell:256,n:24,fps:16,py:128,scale:1.7},// D10-03 비취 먹물 줄기·종이 티끌
 // SW-R1358-01~12(Dots, 11-27 06:18Z) 본보스 12명: 모양·이름은 R1346 그대로. 바닥에서 솟는 그림이라 접점 (128,200), 칸의 72~77% 를 채워 R411 시트와 같은 크기(scale 1).
 'dist00-boss':{path:'assets/r1358/dist00-boss-black-root-thrust.webp',cell:256,n:24,fps:16,py:200,scale:1},// 01 검은 뿌리 한 갈래
 'u203-boss':{path:'assets/r1358/u203-boss-memory-erasure.webp',cell:256,n:24,fps:16,py:200,scale:1},// 02 청회색 기억 소거 연기
 'l301-boss':{path:'assets/r1358/l301-boss-six-form-blades.webp',cell:256,n:24,fps:16,py:200,scale:1},// 03 여섯 갈래 검은 칼날
 'l303-boss':{path:'assets/r1358/l303-boss-sleepless-eye.webp',cell:256,n:24,fps:16,py:200,scale:1},// 04 잠들 수 없는 눈
 'l305-boss':{path:'assets/r1358/l305-boss-earth-quake.webp',cell:256,n:24,fps:16,py:200,scale:1},// 05 흙덩이 땅울림
 'kair-great-01':{path:'assets/r1358/kair-great-01-time-bone-spikes.webp',cell:256,n:24,fps:16,py:200,scale:1},// 06 모래빛 시간 가시
 'kair-great-02':{path:'assets/r1358/kair-great-02-split-wall.webp',cell:256,n:24,fps:16,py:200,scale:1},// 07 갈라진 돌벽
 'kair-great-03':{path:'assets/r1358/kair-great-03-suspended-clock.webp',cell:256,n:24,fps:16,py:200,scale:1},// 08 멈춘 시계 고리
 'kair-great-04':{path:'assets/r1358/kair-great-04-collapse-furnace.webp',cell:256,n:24,fps:16,py:200,scale:1},// 09 붕괴 화로 핏빛 기둥
 'kair-great-05':{path:'assets/r1358/kair-great-05-merciful-verdict.webp',cell:256,n:24,fps:16,py:200,scale:1},// 10 이끼빛 결론 덩어리
 'kair-great-06':{path:'assets/r1358/kair-great-06-reverse-telekinesis.webp',cell:256,n:24,fps:16,py:200,scale:1},// 11 역행 먹 소용돌이
 'k103-boss':{path:'assets/r1358/k103-boss-siren-wave-fan.webp',cell:256,n:24,fps:16,py:200,scale:1}};// 12 세이렌 파도 마루
const MAMMON=new Set(['b06-boss','b06b-boss','mb-ep1b06','mb-ep1b06b']);
const SKIP=new Set(['b03-boss','b04-boss','mb-ep1b03','mb-ep1b04','mb-ep1b01']);// 다른 스레드 몫·이미 고유 스킬(제72문 72 그림자)
function useDots(id,v){if(!ID?.addSheet||!ID.spec||MAMMON.has(id))return false;const key='r1358-'+id;const sh=ID.addSheet(key,v);if(!sh)return false;
 const cur=ID.table().find(s=>s.id===id);if(!cur||!cur.sig)return false;ID.register(id,{sig:{...cur.sig,sheet:key,dots:true}});stats.dots++;return true;}
function install(){if(!ID?.register)return;
 for(const [id,[shape,sheet,why,req]] of Object.entries(NEW)){if(MAMMON.has(id)||SKIP.has(id))continue;if(ID.register(id,{sig:{shape,sheet,why,req,temp:true}}))stats.registered++;}
 for(const [id,v] of Object.entries(DOTS))useDots(id,v);}
if(prefs.on)try{install();}catch(err){fail(err);}
// ---- ② 보스 낙인(상태이상) ----
const MARK=Object.freeze({rate:.06,dur:6,floor:1,icon:'curse',iconRefresh:.3});
const KINDS=/^(r1346-signature|r1042-kiss|r1239-masks|r1241-shadow|r1258-sloth-throw|r1263-|r1343-glass|r1345-gut)/;
let mark=null;// {until, src, t}
function ownerId(src){const o=src?.source||src?.enemy||src?.enemySource;if(o&&typeof o==='object')return String(o.nativeId||o.id||'');const id=src?.owner??src?.ownerId;if(id==null)return '';
 try{const e=(G('room')?.enemies||[]).find(x=>x&&x.id===id);return e?String(e.nativeId||e.id||''):String(id);}catch(_){return String(id);}}
function isUnique(src){if(!src||typeof src!=='object')return false;const k=String(src.kind||src.type||'');if(!(KINDS.test(k)||src.r1239===true))return false;return !MAMMON.has(ownerId(src));}
function maxHp(){const f=G('maxHP');let m=typeof f==='function'?Number(f()):NaN;if(!(m>0)){const p=G('player');m=Number(p?.maxHp)||Number(p?.hpMax)||0;}return m>0&&Number.isFinite(m)?m:0;}
function afflict(src){if(!prefs.mark)return false;const p=G('player');if(!p||!(p.hp>0))return false;const now=T();
 if(mark&&now<mark.until){mark.until=now+MARK.dur;mark.src=ownerId(src);stats.refreshed++;}else{mark={until:now+MARK.dur,src:ownerId(src),t:now,last:now,acc:0,shown:now};stats.afflicted++;}
 iconOn(p);return true;}
function cleanse(why){if(!mark)return false;mark=null;if(why==='guard'){stats.cleansed++;try{G('floatText')?.('낙인 해제 · 공명',G('player')?.x,G('player')?.y,'#c9b8ff');}catch(_){}}else stats.expired++;return true;}
function iconOn(p){try{window.__STORYWORLD_DOTS_STATUS_R1153__?.mark?.(p,MARK.icon,MARK.iconRefresh);}catch(err){fail(err);}}
let hinted=false;
function step(){if(!mark)return;const now=T(),dt=Math.max(0,Math.min(.25,Math.min(now,mark.until)-mark.last));mark.last=now;const p=G('player');
 if(!p||!(p.hp>0)){mark=null;return;}
 if(p.guard){cleanse('guard');return;}// 공명 방어(D)를 누르는 순간 풀림
 if(now>=mark.until){cleanse('expire');return;}
 if(G('modal')||G('loading')||G('storyScene')||!dt)return;
 const m=maxHp();if(!m)return;let d=MARK.rate*m*dt;const room=p.hp-MARK.floor;if(d>room){d=Math.max(0,room);if(d<MARK.rate*m*dt)stats.floored++;}
 if(d>0){p.hp-=d;mark.acc+=d;stats.damage+=d;}stats.ticks++;iconOn(p);
 if(now-mark.shown>=.5&&mark.acc>=1){try{G('floatText')?.('-'+Math.round(mark.acc)+' 낙인',p.x,p.y,'#b89ad8');}catch(_){}mark.acc=0;mark.shown=now;}
 if(!hinted){hinted=true;try{G('toast')?.('보스 낙인 · 초당 체력 6% — 공명 방어(D)로 풀 수 있어요',2.6);}catch(_){}}}
const HU=G('hurt');if(typeof HU==='function'){const base=HU;try{Function('f','hurt=f')(function(damage,source,...a){const r=base.apply(this,[damage,source,...a]);
 try{if((r==='hit'||r==='blocked')&&isUnique(source))afflict(source);else if(isUnique(source))stats.skipped++;}catch(err){fail(err);}return r;});}catch(err){fail(err);}}
const TK=G('tick');if(typeof TK==='function'){const base=TK;try{Function('f','tick=f')(function(...a){const r=base.apply(this,a);try{step();}catch(err){fail(err);}return r;});}catch(err){fail(err);}}
function set(v){prefs={...prefs,...(v&&typeof v==='object'?v:{on:v!==false})};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}if(!prefs.mark)mark=null;return {...prefs};}
window.__STORYWORLD_BOSS_UNIQUE_R1358__=Object.freeze({revision:REV,table:()=>({...NEW}),mainDots:{...MAIN_DOTS},dots:()=>({...DOTS}),useDots,afflict,cleanse,isUnique,
 markRule:MARK,mammon:[...MAMMON],skip:[...SKIP],set,state:()=>mark?{until:mark.until,src:mark.src,left:Math.max(0,mark.until-T())}:null,
 inspect:()=>({revision:REV,prefs:{...prefs},...stats,active:!!mark,lastError,browser:false,GPU:false})});
})();
