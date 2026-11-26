// R1340 근접 몹 타격 이펙트를 공격 종류별로 — 사용자 2026-11-26 13:24Z
//  "근접몹이 공격했을때 무조건 돌프레임애니메이션이펙트가 나오는게 아니라 땅을 치거나 하는 몹일때 나오게하고 찌르기류는 그냥 출혈모션 나오는 식으로
//   그냥 기본공격에 맞으면 확실하지만 너무화려하지는 않은방식으로".
//  원인: R169(R175·R1177d)가 근접 몹이 칠 때마다 지역 모양 시트를 무조건 재생했다 — 동굴·석조 지역(첫 맵·거미동굴·카이로 등)은 솟는 돌가시(mob-stone).
//  바꿈(판정·피해·타이밍은 그대로, 그림만):
//   ① 분류 classify(e) — 몹 이름 표(TABLE, 전수 조사) → 이름 낱말 → 무기(e.weapon) 순.
//      ground(땅을 치는 몹: heavy 무기·망치·철퇴·골렘·바위·거인 등) / bleed(찌르기·베기: blade·cleave·claw, 칼·창날·발톱·메스 등) / impact(그 밖·애매함).
//      몸이 없는 것(혼령·망령·점액·그림자·나방 등)은 할퀴어도 impact. '검은'·'창백한' 같은 낱말은 칼·창으로 보지 않는다(낱말 단위 목록만).
//   ② R169 이 칠 때 묻는다(route): ground = 어느 지역이든 돌 시트(mob-stone)를 그 자리에(예전 위치·크기·색), bleed·impact = 칠 때는 아무것도 재생하지 않는다.
//      보스 땅 균열(R169/R240 quake)도 ground 보스만.
//   ③ 엔진 hurt 가 근접 몹을 출처로 불렸을 때(= 기본 공격이 실제로 맞았을 때)만:
//      bleed = '버려진 최고급 식재료'(집·주방 지역)가 칠 때 R169 이 허공에 띄우던 Dots 두 번 할퀴기 시트(R1177d mob-domestic)를, 기준점을 그림 무게중심으로 옮겨
//        영웅 발 자리·가슴 높이에 정확히(사용자 13:44Z "허공에말고 영웅쪽에 제대로"). Dots 색 그대로, 크기 .62(보스 .7), 알파 .9. 피 튐은 쓰지 않는다(15세).
//      impact = 작은 타격 시트(Dots R1214 dark-impact8, 8칸)를 그 몹 고유색으로 물들여 영웅 가슴 높이에 작게, 투명 .4(alpha .6 — 스킬 적중 .4 투명 규칙과 같게).
//      ground = 더 그리지 않는다(돌이 이미 보임). 같은 몹 0.25초 안에는 한 번. 화면 덮지 않게 R163·R190 동시 상한 그대로.
//  코드로 그린 선·원 없음(모두 프레임 시트). 끄기 storyworld.r1340.meleeHitFx {"on":false} → R169 예전 그대로.
//  API window.__STORYWORLD_MELEE_HITFX_R1340__ {classify,route,quake,ownsHit,TABLE,set,inspect}.
//  미검증: GPU 실기기·모바일 화면·자연 플레이(헤드리스 전후 비교만).
(()=>{'use strict';
if(window.__STORYWORLD_MELEE_HITFX_R1340__)return;
const REV='R1340-melee-hitfx-2',KEY='storyworld.r1340.meleeHitFx';
let prefs={on:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s.on==='boolean')prefs.on=s.on;}catch(_){}
const stats={routedGround:0,skipped:0,slash:0,impact:0,groundHits:0,ignored:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const T=()=>{try{return typeof time==='number'&&Number.isFinite(time)?time:0;}catch(_){return 0;}};
const H=()=>{try{return typeof actorHeight==='function'?actorHeight():60;}catch(_){return 60;}};
const fin=(v,d=0)=>Number.isFinite(v)?v:d;
// ---- ① 분류 ----------------------------------------------------------------------------------------
// 전수 조사(r96/qa/r1340/census.mjs → mob-attack-kinds.md)에서 이름·무기만으로는 틀리는 몹을 손으로 맞춘 표. 이름은 끝의 번호·'증원'·'추격대'를 뗀 이름.
const TABLE=Object.freeze({
 /*@@TABLE@@*/
 "감옥 공명기사":'ground',
 "검은 소환 기둥":'ground',
 "겨울숲 가시파수":'ground',
 "기계화 제12단계 기억 검열기":'ground',
 "기억의 문 수호 프레임":'ground',
 "나태의 껍데기 파수":'ground',
 "늪 뿌리 추적자":'ground',
 "늪의 뿔악마 군주":'ground',
 "늪의 염소머리 악마":'ground',
 "대수문장":'ground',
 "망각 묘지기 · 삭제된 선택":'ground',
 "뿌리의 문지기":'ground',
 "살아 움직이는 쓰레기들":'ground',
 "살아 있는 거대한 위장":'ground',
 "상위수문장":'ground',
 "생체기계 악몽":'ground',
 "설원 잠복 보행기":'ground',
 "소환진 순례악마":'ground',
 "전극기계수호기사":'ground',
 "제14단계 역전 관리자":'ground',
 "제17단계 중앙이주 코어":'ground',
 "제4단계 전쟁관리자":'ground',
 "제8단계 자비 교정관":'ground',
 "지옥문 파수악마":'ground',
 "참호 공명기사":'ground',
 "최종문 공명기사":'ground',
 "폐기주방 감독":'ground',
 "휴식 수확관 · 과로의 수문장":'ground',
 "흑마법사의 시체경호체":'ground',
 "강철 턱의 사이보그 개":'bleed',
 "개와 늑대의 시간":'bleed',
 "거미줄에 묶인 수호병":'bleed',
 "거짓천국 근위천사":'bleed',
 "검은기둥 가고일 수호자":'bleed',
 "격리실 감염 의료인":'bleed',
 "고슴도치 가시 사탕":'bleed',
 "관리자 추적견":'bleed',
 "기억 운반거미":'bleed',
 "눈보라 속 여우 악마":'bleed',
 "되살아난 방패동료":'bleed',
 "되살아난 수호기사":'bleed',
 "무명 검흔":'bleed',
 "발록 · 지옥의 문지기":'bleed',
 "병원 심부의 집도의":'bleed',
 "보라검 추격천사":'bleed',
 "보라검천사":'bleed',
 "보랏빛 알집지기":'bleed',
 "분노의 사냥개":'bleed',
 "불길 속의 늑대":'bleed',
 "붉은 하이힐 칼날":'bleed',
 "뿌리 추적자":'bleed',
 "뿌리에 묶인 근위의 기억":'bleed',
 "설원 아래의 기계 다리":'bleed',
 "소독등 타락천사":'bleed',
 "소환진 타락천사":'bleed',
 "심장빛 무대감독":'bleed',
 "쓰러진 수호병":'bleed',
 "악마화 나무의 침식 근위":'bleed',
 "이름 잃은 전우":'bleed',
 "전쟁기계사냥개":'bleed',
 "중독을 부르는 주사기 환영체":'bleed',
 "중립초원 늑대":'bleed',
 "진흙등 거미":'bleed',
 "초천사의 웃는 가면":'bleed',
 "칼날이 된 지폐":'bleed',
 "타락천사 기사":'bleed',
 "파란불":'bleed',
 "피냄새 추적자":'bleed',
 "피로 꿰맨 전령":'bleed',
 "핏빛 수호로 추격자":'bleed',
 "환수검 모조체":'bleed',
 "흑마법사의 저주창":'bleed',
 "가짜 자비 수집가":'impact',
 "갈망의 약병핵":'impact',
 "걸어다니는 소형 로봇":'impact',
 "검은 실의 외부 신호":'impact',
 "검은기둥 주문사":'impact',
 "고블린 추장":'impact',
 "곰팡이와 오물 봉투":'impact',
 "공실 표기 잔재":'impact',
 "공실장부 당직감사":'impact',
 "공중을 가르는 립스틱 탄환":'impact',
 "과열 시냅스 점액체":'impact',
 "교만의 사이보그 교주":'impact',
 "교만의 잔향 · 제72문":'impact',
 "금고 장부감시자":'impact',
 "금이 간 비교잔영":'impact',
 "기계재판 연결자":'impact',
 "기계재판 집행핵":'impact',
 "기계화 감옥 공명기사":'impact',
 "기계화 공명술사":'impact',
 "기계화 기억 공백 망령":'impact',
 "기계화 기억이주 연결자":'impact',
 "기계화 망각거미":'impact',
 "기계화 문턱 관측거미":'impact',
 "기계화 복종 봉인구":'impact',
 "기계화 제8단계 자비 교정관":'impact',
 "기계화 첫 기억 청람잔영":'impact',
 "기억절제 연결자":'impact',
 "긴 뱀의 그림자":'impact',
 "꼭두각시 실안개":'impact',
 "끊어진 통화의 인과 잔향":'impact',
 "끓어오르는 검은 소화액":'impact',
 "나태에 잠식된 남자":'impact',
 "낡은 장난감 요요":'impact',
 "네트워크 합창체":'impact',
 "늪에서 되살아난 혼령체":'impact',
 "루시퍼 · 가면 벗은 초천사":'impact',
 "모든 면이 뒷면인 동전":'impact',
 "박제된 여우의 악마":'impact',
 "반복된 추락의 인과 잔향":'impact',
 "백색 정장의 호텔 그룹 회장":'impact',
 "백은 없는 그림자":'impact',
 "백의 구속자":'impact',
 "백의 안정화 감독":'impact',
 "버려진 최고급 식재료":'impact',
 "복도 비명잔영":'impact',
 "복종 봉인구":'impact',
 "본능 추출 결정":'impact',
 "부정의 잔영":'impact',
 "불길 속의 용":'impact',
 "불면귀":'impact',
 "불면귀의 안개 잔영":'impact',
 "불을 지른 청소부 · 분노의 귀":'impact',
 "붉은 하이힐의 서윤":'impact',
 "붕괴선 파수병":'impact',
 "빗속 횡단보도의 기억 잔향":'impact',
 "사이보그 회장 · 생체 부트로더":'impact',
 "새빛호텔 화재 기록의 잔향":'impact',
 "생체부트로더 연산핵":'impact',
 "성벽 침식 봉인병":'impact',
 "세뇌 신호 점액체":'impact',
 "세이렌 모르":'impact',
 "소년이 된 총지배인 · 맘몬":'impact',
 "소환좌 칩 수호체":'impact',
 "소환진 검은기둥":'impact',
 "수렁 주문사":'impact',
 "숨이 끊긴 전령의 그림자":'impact',
 "숲 고블린":'impact',
 "시간수문장":'impact',
 "시간핵의 명령 잔류":'impact',
 "시간핵의 명령 파동":'impact',
 "신경 케이블 포식체":'impact',
 "아르벨리아를 묶은 변조 명령":'impact',
 "아마겟돈 계산결정":'impact',
 "악몽 정찰체":'impact',
 "안정화 집행체":'impact',
 "암시장의 수상한 자":'impact',
 "약을 갈망하는 자":'impact',
 "얼굴 없는 남자의 박수":'impact',
 "역전기록 수집가":'impact',
 "오만의 폐허핵":'impact',
 "오만의 흰 가면":'impact',
 "옥상 인과보관인":'impact',
 "옥상으로 돌아온 기억 잔향":'impact',
 "유리 망령":'impact',
 "육망성의 흑마술 실험체":'impact',
 "은폐기록 연결체":'impact',
 "의존 신호 포식자":'impact',
 "이단의목사 백이온":'impact',
 "이단의목사 한리안":'impact',
 "이동문 공허잔영":'impact',
 "이동문 청람잔영":'impact',
 "이름 없던 공포":'impact',
 "일흔두 번째 인장 잔류체":'impact',
 "입양기억 청람잔영":'impact',
 "잠식된 소복 처녀":'impact',
 "잠식된 약방 아낙":'impact',
 "잠식된 어부":'impact',
 "장미이슬 슬라임":'impact',
 "재 나방":'impact',
 "적그리스도 배양좌":'impact',
 "전쟁기억 정찰드론":'impact',
 "제출되지 못한 문장":'impact',
 "죄책감 압축결정":'impact',
 "주사실 감시환각":'impact',
 "중독의 폐허핵":'impact',
 "중립초원 슬라임":'impact',
 "지워진 CCTV 기록의 잔향":'impact',
 "진술 봉쇄 인과핵":'impact',
 "질투로 얼룩진 망령":'impact',
 "첫 동료의 악마잔영":'impact',
 "초자아 잠식체":'impact',
 "최고급 호텔의 총주방장 · 탐식의 귀 베엘제붑":'impact',
 "최초명령 코어 오염체":'impact',
 "최초명령 훈련파동":'impact',
 "추녀의 한탄":'impact',
 "치료거부의 가면":'impact',
 "칩 제단 방화벽":'impact',
 "컨트롤러 · 기억의 문":'impact',
 "코어 운반 집행자":'impact',
 "태엽 수집자":'impact',
 "파란불 역주행 목격자":'impact',
 "피리 고블린":'impact',
 "학대기록 공허체":'impact',
 "합일 주파수 결정":'impact',
 "호텔 부매니저 · 레비아탄":'impact',
 "호텔 화염기사":'impact',
 "회장에게 고용된 총지배인 · 맘몬":'impact',
 "흑장미 귀막은 신도":'impact',
 "흑장미 눈가린 신도":'impact',
 "EGO 강탈 악몽왕":'impact',
 "EGO 구속 연결자":'impact',
 "EGO 탈취 연결자":'impact',
 "ID 배양 점액체":'impact',
 "ID 생체조 관리자":'impact',
 "ID 잔류 점액체":'impact',
 "SUPER EGO 절개결정":'impact',
 "SUPER EGO 판결인장":'impact',
});
const GROUND_RE=/망치|해머|철퇴|곤봉|몽둥이|도끼|모루|골렘|석상|바위|거인|짓밟|내려찍|내려치|돌덩이|맷돌/;
const BLEED_RE=/칼날|칼|단검|장검|대검|보라검|검객|낫|창병|창날|장창|송곳|바늘|메스|가위|발톱|송곳니|이빨|비수|손톱/;
const SOFT_RE=/혼령|유령|망령|잔영|그림자|점액|슬라임|안개|연기|나방|파동|주파수|결정|구체|눈알|환영|메아리|잔향/;
const WEAPON={heavy:'ground',blade:'bleed',cleave:'bleed',claw:'bleed',claws:'bleed',spear:'bleed',pierce:'bleed'};
const baseName=n=>String(n||'').replace(/^중간보스\s*·\s*/,'').replace(/\s+(\d+|증원|추격대|분신|우두머리|후속)$/,'').replace(/\s+(\d+|증원|추격대|분신|우두머리|후속)$/,'').trim();
function classify(e){try{if(!e||typeof e!=='object')return'impact';const n=baseName(e.name);
  if(n&&TABLE[n])return TABLE[n];
  if(GROUND_RE.test(n))return'ground';if(BLEED_RE.test(n))return'bleed';if(SOFT_RE.test(n))return'impact';
  return WEAPON[String(e.weapon||'')]||'impact';}catch(err){fail(err);return'impact';}}
// ---- ② R169 이 칠 때 묻는다 ------------------------------------------------------------------------
const PX=()=>window.__STORYWORLD_PIXELFX_R163__;
function route(e,name,x,y,o){if(!prefs.on)return null;try{const k=classify(e);
  if(k==='ground'){stats.routedGround++;const X=PX();return{name:X?.has?.('mob-stone')?'mob-stone':name,o:{...(o||{})}};}
  stats.skipped++;return{skip:true,kind:k};}catch(err){fail(err);return null;}}
const quake=e=>!prefs.on||classify(e)==='ground';
// ---- ③ 실제로 맞았을 때 ----------------------------------------------------------------------------
// 작은 타격 시트를 R163 표에 한 줄로 넣는다(엔진 자산 경로는 '..' 를 막으므로 R1177 과 같이 별칭 경로 → 실제 경로).
const IMPACT='mob-r1340-impact',SLASH='mob-r1340-slash'/* 'mob' 낱말: R350 이 영웅 몸 위 적 쪽 이펙트로 보고 옅게 하지 않음(이게 없으면 몸 위에서 85% 옅어져 안 보였다) */,ALIASES={'assets/r163/pixelfx/r1340/dark-impact8.webp':'assets/r1214/dark-impact8.webp','assets/r163/pixelfx/r1340/mob-domestic-dots-12.webp':'assets/r1177/mob-domestic-dots-12.webp'};
const ROW=Object.freeze({file:'r1340/dark-impact8.webp',frame:[128,128],pivot:[64,64],columns:8,frames:8,fps:16,loop:false,r1340:'Dots R1214 dark-impact8(귀신 계열 작은 타격) — 근접 기본 공격 적중'});
// 찌르기·베기(사용자 13:44Z "최고급식재료가 근접공격시 나오는 프레임애니메이션 나오면 될듯, 근데 허공에 말고 영웅쪽에 제대로"): 그 몹(집·주방 지역)이 칠 때 R169 이 띄우던
//  Dots CX-0156SP D house-double-claw12(두 번 할퀴기, R1177d) 시트를 그대로 쓰되, 기준점을 시트 그림의 무게중심(전 칸 알파 가중 평균 158,95)으로 옮긴 행 —
//  영웅 발 자리 + 가슴 높이(z = 키 .5)에 놓으면 할퀸 자국 한가운데가 영웅 몸 한가운데에 온다(R169 원래 행 기준점 73,152 는 자국이 오른쪽 위 허공으로 비켜 남).
const SLASH_ROW=Object.freeze({file:'r1340/mob-domestic-dots-12.webp',frame:[272,179],pivot:[158,95],columns:4,frames:12,fps:18,loop:false,r1340:'Dots CX-0156SP D house-double-claw12(버려진 최고급 식재료 근접) — 기준점 = 그림 무게중심'});
const real=p=>typeof p==='string'&&ALIASES[p]||p;
try{if(typeof readyImage==='function'){const base=readyImage;readyImage=function(p,...a){return base.call(this,real(p),...a);};}
 if(typeof addImage==='function'){const base=addImage;addImage=function(p,...a){return base.call(this,real(p),...a);};}}catch(err){fail(err);}
function register(){try{const m=PX()?.meta?.();if(!m)return;for(const [k,R] of [[IMPACT,ROW],[SLASH,SLASH_ROW]])if(!m[k])m[k]={...R,frame:R.frame.slice(),pivot:R.pivot.slice()};}catch(err){fail(err);}}
let warmed='';
function warm(){try{const id=typeof room==='object'&&room?room.id:'';if(id&&id!==warmed&&PX()?.meta?.()){warmed=id;PX().warm?.(['mob-stone',IMPACT,SLASH]);}}catch(_){}}
const last=new WeakMap();
function palOf(e){try{const p=window.__STORYWORLD_COMBAT_R114__?.palette?.(e);if(p&&p.p)return{a:p.p,b:p.gp||p.p};}catch(_){}return{a:[110,40,44],b:[230,170,150]};}
function meleeSource(src){return !!(src&&typeof src==='object'&&src.attack&&src.attack.committed&&src.lastAttackKind==='melee'&&!src.attack.r52Charge);}
function onHit(src){if(!prefs.on)return;if(!meleeSource(src)){stats.ignored++;return;}const t=T();if(t-fin(last.get(src),-9)<.25)return;last.set(src,t);
 const k=classify(src);if(k==='ground'){stats.groundHits++;return;}
 const p=typeof player==='object'&&player?player:null;if(!p||!Number.isFinite(p.x+p.y))return;const big=!!(src.boss||src.midboss);
 const dx=fin(p.x-fin(src.x,p.x)),flip=dx<0;
 const X=PX();register();if(!X||typeof X.play!=='function')return;
 if(k==='bleed'){X.play(SLASH,p.x,p.y,{k:big?.7:.62,z:H()*.5,alpha:.9,rate:1.2,flip,enemy:true});stats.slash++;return;}
X.play(IMPACT,p.x,p.y,{k:big?.4:.32,z:H()*.45,alpha:.6,rate:1,flip,tint:palOf(src),enemy:true});stats.impact++;}
// R1286 ③ 이 맞을 때 영웅 자리에 세 봉우리 땅 균열을 띄우기 전에 묻는다 — 근접 bleed·impact 적중은 이 파일이 맡는다(땅 치는 몹·원거리는 R1286 그대로).
const ownsHit=src=>{try{return !!(prefs.on&&meleeSource(src)&&classify(src)!=='ground');}catch(err){fail(err);return false;}};
// 엔진 hurt 결과가 비적중('ignored'·'invulnerable'·'parried'·'missed'(R111)·'blocked'(보호막))이면 그리지 않는다(Dots 검수 11-26). 'hit'·'revived'·덧씌운 hurt 의 다른 값은 적중으로 본다.
const NOT_HIT=new Set(['ignored','invulnerable','parried','missed','blocked']);const landed=r=>!NOT_HIT.has(r);
try{if(typeof hurt==='function'){const base=hurt;hurt=function(d,src,...a){const r=base.call(this,d,src,...a);try{if(landed(r))onHit(src);else stats.notHit=(stats.notHit||0)+1;}catch(err){fail(err);}return r;};}}catch(err){fail(err);}
try{if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);try{register();warm();}catch(err){fail(err);}return r;};}}catch(err){fail(err);}
register();
function set(p){prefs={...prefs,...p};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
const sample=Object.entries(TABLE)[0];
window.__STORYWORLD_MELEE_HITFX_R1340__=Object.freeze({revision:REV,classify,route,quake,ownsHit,TABLE,TABLE_SAMPLE:sample?{name:sample[0],kind:sample[1]}:null,set,
 inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError})});
})();
