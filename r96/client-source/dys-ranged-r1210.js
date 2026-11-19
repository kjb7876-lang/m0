// R1210 — 사몽 S-06 디스토피아 일반 몹의 미래형 원거리 공격(레이저·방사능·음파).
//  사용자 2026-11-19 07:25Z "디스토피아 적들이 레어지공격이나 방사능공격 음파공격등 미래기술에 맞는 원거리 공격들을 사용하도록 이펙트없으면 닷츠에게 요청협업"
//  07:31Z 범위 확장(기계·귀신·마법 계열) — 이 파일은 그 1단계(기계 계열 중 디스토피아). 종류 표(KINDS)·이름 표(NAMES)에 줄을 더해 넓힌다.
//  · 종류: 레이저 = 겨누기(조준선 예고) 뒤 고정된 방향으로 곧은 빛줄기 / 방사능 = 영웅 발밑으로 포낭 투척 → 독빛 웅덩이(0.5초마다) / 음파 = 앞 부채꼴로 퍼지는 파동 고리.
//  · 근접형(ai melee) 몹: 3~7칸이면 겨누기(제자리) → 발사. 쿨다운 6초대·동시 3마리까지·방에 들어선 뒤 0.8~2.4초 지연.
//  · 원거리형(ai hybrid·ranged) 몹: 엔진 ranged3(기본 탄) 차례를 같은 종류의 미래형 공격으로 바꾼다(추가 사격 없음, 횟수 그대로).
//  · 피해: 한 번 ≤ 근접 피해 e.damage×0.8, 방사능은 0.25×최대 3번. 근접형에 붙는 원거리 압박은 엔진 원거리 몹의 절반 이하(qa/r1210).
//  · 그림(임시, Dots 시트 오기 전): 레이저 = R600 빛줄기 시트(sw0011 쪽 나눔)·시작·명중 섬광, 방사능 = R562 독안개·독웅덩이 시트, 음파 = R438 충격파 시트 + 먹선 부채꼴.
//    예고는 먹선 + 차가운 계열 색(주황 예고 도형 금지 #712). 보스·중간보스는 건드리지 않는다.
//  R1213(11-19): 기계 계열 나머지 지역(ep1b09·u201~u206·cult02·05·06 등)으로 넓히고 4번째 종류 '폭탄'(던진 통이 떨어진 자리에서 한 번 터짐)을 더한다.
//    사용자 07:41Z "일반몹은 하나의 원거리 공격만해 / 각몹에맞게" → 몹마다 한 종류. 07:56Z "최대한 다채롭게" → 몹 이름마다 시트 색조를 조금씩 돌린다(hue-rotate, 차가운 계열 안).
//    폭탄 터짐 = R411 hit-explosion 24칸을 청보라 플라스마로 다시 칠한 시트 + Dots 먹 흩어짐 12칸, 예고·통 = Dots CX-0167RA r1 ROUGH(bomb-warning8·orb-flight8).
//    방사능 예고·포낭 = Dots green-warning8·capsule-flight8, 음파 모으기 = Dots sonic-charge6(scripts/r1213-bomb-sheet.py).
//  R1214(11-19): 귀신 계열 — 공포(시선 부채꼴, 비키면 피함)·암흑(곧게 나는 먹 구체)·그림자(발밑 그림자 손)·촉수(땅 갈라짐 줄 따라 먹 촉수).
//    병원·호텔·살인사건·마을·교단·환도 지역과 사몽 귀신 에피소드 몹에 한 종류씩. 시트는 Dots CX-0167RA r1 ROUGH ghost-* 8장.
//  R1214b(사용자 11-19 09:47Z "근접몹 원거리몹 확실히 나눠줘 이미지와 공격방식토대로 / 한두번만 원거리공격하고 다 돌진해서 오는거 같아서 특히 디스토피아몹들"):
//    몹마다 역할(ROLE)을 그림·무기로 정한다. 원거리 몹 = 엔진 ai 'ranged' + 거리 유지(3.2칸 안이면 물러섬, 3.2~6.5칸이면 다가오지 않음) + 근접 공격 안 함 → 계속 쏜다.
//    근접 몹 = 엔진 ai 'melee', 원거리 공격 없음(종류는 그 맵 보스가 쓰는 목록에만 남김).
//  끄기: localStorage['storyworld.r1210.dys']='{"on":false}'. 점검: window.__STORYWORLD_DYS_RANGED_R1210__.inspect()
(()=>{'use strict';
if(window.__STORYWORLD_DYS_RANGED_R1210__)return;
const REV='R1231-lean',KEY='storyworld.r1210.dys';
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={aims:0,fires:{laser:0,radiation:0,sonic:0,bomb:0,fear:0,dark:0,shadow:0,tentacle:0,fire:0},engine:0,hits:{laser:0,radiation:0,sonic:0,bomb:0,fear:0,dark:0,shadow:0,tentacle:0,fire:0},contact:0,cancels:0,drawn:{},tele:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.stack||e).slice(0,300);};
const G=n=>{try{return Function('return typeof '+n+"!=='undefined'?"+n+':undefined')();}catch(_){return undefined;}};
const T=()=>{const t=G('time');return typeof t==='number'?t:0;};
const hash=s=>{let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return (h>>>0)/4294967296;};
// ---- 표 ----
const TUNE=Object.freeze({
 laser:Object.freeze({min:3,max:7,windup:.7,dmg:.8,cd:6.2,width:.42,len:7.5,life:.32}),
 radiation:Object.freeze({min:3,max:6.5,windup:.6,dmg:.25,ticks:3,cd:7.2,radius:1.15,flight:.55,pool:2.2,gap:.5}),
 sonic:Object.freeze({min:2.6,max:5.5,windup:.55,dmg:.7,cd:6.0,speed:6,band:.45,half:.62,reach:6}),
 bomb:Object.freeze({min:3,max:6.5,windup:.65,dmg:.85,cd:6.8,radius:1.2,flight:.7,blast:.9}),
 /* R1214 귀신 계열 */
 fear:Object.freeze({min:2.6,max:6,windup:.7,dmg:.75,cd:6.6,half:.3,reach:6.5,life:.7}),
 dark:Object.freeze({min:3,max:7,windup:.6,dmg:.75,cd:6.2,speed:5.5,hitR:.5,reach:7.5,impact:.45}),
 /* R1227 마법 계열 불(추락 dist06 먼저): 곧게 나는 불덩이, 맞으면 진홍 폭발. 암흑과 같은 판정 */
 fire:Object.freeze({min:3,max:7,windup:.65,dmg:.75,cd:6.4,speed:6,hitR:.5,reach:7.5,impact:.55}),
 shadow:Object.freeze({min:2.8,max:6.5,windup:.75,dmg:.8,cd:6.8,radius:1.05,delay:.3,rise:.9}),
 tentacle:Object.freeze({min:2.6,max:6,windup:.7,dmg:.8,cd:6.6,width:.45,len:5.5,delay:.3,rise:.8})});
const NAMES=Object.freeze({
 '프리즘 저격병':'laser','중장 광선포병':'laser','외계 침공군':'laser','전선 절단자 · 짙은 형상':'laser','낫팔 잠복체':'laser',
 '두족류 생체기계 침공병':'radiation','변이된 사냥개 괴수':'radiation','포낭 곡사체':'radiation','배양 공병':'radiation',
 '폐선로 태엽 군단병':'sonic','펄스 척후병':'sonic','막익 급습체':'sonic','방벽 돌진체':'sonic','원반 포획체':'sonic','심해 연산거수 · 짙은 형상':'sonic',
 /* R1213 기계 계열 — 몸·이름에 맞게 한 종류(드론·관측·결정 = 레이저, 공명·주파수·개 = 음파, 점액·거미·공허 = 방사능, 소형 로봇·수집가·압축 = 폭탄) */
 // ep1b09 생체 부트로더
 '강철 턱의 사이보그 개':'sonic','걸어다니는 소형 로봇':'bomb','설원 잠복 보행기':'laser','태엽 수집자':'bomb',
 // u201 방어의 군단 · u202 잔인한 구원
 '전쟁기억 정찰드론':'laser','전쟁기계사냥개':'radiation','참호 공명기사':'sonic',
 '기계화 망각거미':'radiation','복종 봉인구':'laser','감옥 공명기사':'sonic','가짜 자비 수집가':'bomb',
 // u204 시스템의 거부권 · u205 관리자 권한 · u206 중앙 코어 이주실 · u203 기억의 문
 '기계화 첫 기억 청람잔영':'laser','기계화 기억 공백 망령':'sonic','기계화 문턱 관측거미':'radiation',
 '학대기록 공허체':'radiation','관리자 추적견':'laser','역전기록 수집가':'bomb',
 '기계화 기억이주 연결자':'laser','기계화 공명술사':'sonic','입양기억 청람잔영':'radiation',
 '이동문 청람잔영':'laser','이동문 공허잔영':'radiation','최종문 공명기사':'sonic',
 // cult02 교주가 기다리는 전쟁 · cult05 돌아오는 현실의 기억 · cult06 처음 세웠던 목표
 '신경 케이블 포식체':'laser','합일 주파수 결정':'sonic','과열 시냅스 점액체':'radiation','기계화 제8단계 자비 교정관':'bomb',
 'ID 배양 점액체':'radiation','생체기계 악몽':'bomb','본능 추출 결정':'laser','설원 아래의 기계 다리':'sonic',
 'SUPER EGO 판결인장':'laser','기계재판 연결자':'sonic','죄책감 압축결정':'bomb',
 // 다른 지역에 섞여 나오는 기계 몹(kair07·cult01·ep1b08)
 '기계화 감옥 공명기사':'sonic','기계화 복종 봉인구':'laser','전극기계수호기사':'laser',
 // 사몽 기계 에피소드(RD·RE)
 '서로의 결말을 먹는 도시':'radiation','다음 자리를 노리는 사격':'laser',
 /* R1214 귀신 계열 — 비명·가면·시선·감시 = 공포, 망령·잔향·핵 = 암흑, 그림자·잔영·발자국 = 그림자, 뱀·실·위장·점액·연결자 = 촉수 */
 // 병원 ep1a08~11
 '격리실 감염 의료인':'shadow','백의 구속자':'tentacle','복도 비명잔영':'fear','안정화 집행체':'dark',
 '갈망의 약병핵':'dark','오만의 흰 가면':'fear','유리 망령':'shadow','주사실 감시환각':'fear',
 '부정의 잔영':'shadow','암시장의 수상한 자':'dark','약을 갈망하는 자':'tentacle','중독의 폐허핵':'dark',
 '거짓천국 근위천사':'dark','초자아 잠식체':'tentacle','치료거부의 가면':'fear',
 // 호텔 ep1b01~08(맘몬 ep1b06 은 손대지 않음)
 '검은 실의 외부 신호':'tentacle','이름 없던 공포':'fear','일흔두 번째 인장 잔류체':'dark',
 '곰팡이와 오물 봉투':'tentacle','살아 움직이는 쓰레기들':'dark',
 '긴 뱀의 그림자':'tentacle','질투로 얼룩진 망령':'dark','추녀의 한탄':'fear',
 '끓어오르는 검은 소화액':'shadow','버려진 최고급 식재료':'dark','살아 있는 거대한 위장':'tentacle',
 '공중을 가르는 립스틱 탄환':'dark','붉은 하이힐 칼날':'shadow','얼굴 없는 남자의 박수':'fear',
 '개와 늑대의 시간':'shadow','분노의 사냥개':'fear','불길 속의 늑대':'dark','불길 속의 용':'dark',
 '육망성의 흑마술 실험체':'shadow','흑마법사의 저주창':'dark',
 // 살인사건 murder01~04
 '끊어진 통화의 인과 잔향':'fear','빗속 횡단보도의 기억 잔향':'shadow','새빛호텔 화재 기록의 잔향':'dark','지워진 CCTV 기록의 잔향':'fear',
 '반복된 추락의 인과 잔향':'shadow','옥상으로 돌아온 기억 잔향':'dark','공실 표기 잔재':'shadow','은폐기록 연결체':'tentacle','제출되지 못한 문장':'dark',
 // 마을 last302·303
 '잠식된 소복 처녀':'fear','잠식된 약방 아낙':'dark','잠식된 어부':'tentacle','불면귀의 안개 잔영':'shadow',
 // 교단 cult01·03·04
 '세뇌 신호 점액체':'tentacle','흑장미 귀막은 신도':'dark','흑장미 눈가린 신도':'fear',
 'EGO 구속 연결자':'tentacle','ID 잔류 점액체':'shadow','SUPER EGO 절개결정':'dark','소환좌 칩 수호체':'dark','아마겟돈 계산결정':'fear',
 // 환도 hando01~03
 '성벽 침식 봉인병':'shadow','악몽 정찰체':'fear','의존 신호 포식자':'tentacle',
 '기억절제 연결자':'tentacle','무명 검흔':'shadow','붕괴선 파수병':'dark','코어 운반 집행자':'dark',
 'EGO 탈취 연결자':'tentacle','백은 없는 그림자':'shadow','환수검 모조체':'dark',
 // 사몽 귀신 에피소드(S-01·02·04·05·07·RA·RB·RC·RF·RG)
 '뿌리에서 쏟아진 잔영':'shadow','얼굴 없는 학생':'fear','규칙을 어기지 않는 마네킹':'dark','찢긴 호외의 잔향':'dark','여섯 물건의 그림자':'shadow',
 '붉은 교정 표시':'tentacle','정해진 시각에 도착하지 못한 발자국':'shadow','관람석의 시선':'fear','종이 형상':'dark','막힌 이름들':'tentacle',
 // 사몽 R380 이 바꿔 다는 이름(그림 기준)
 '발소리 추적 잔영':'shadow','검은 뿌리 포획체':'tentacle','봉합 정원사 인형':'tentacle','결말 접합체':'radiation','허위 승전 훈장막':'laser','금박 유리관 수확기':'fear',
 '재주문 도장체':'dark','세 번째 잔의 강요체':'fear','녹슨 개찰구 수집체':'tentacle','인과 고리충':'dark','비극 계량체':'fear',
 /* R1227 추락(dist06, 사용자 11-19 10:51Z "추락일반몹 원거리공격및 스킬 도형으로나오는문제 개선") — 지옥·악마 지역이라 불. 주문사·화염술사 = 원거리, 파수악마·타락천사 = 근접(타격 자국만 불 시트) */
 '검은기둥 주문사':'fire','검은기둥 화염술사':'fire','지옥문 파수악마':'fire','소환진 타락천사':'fire'});
/* R1214b 역할: 그림에 총·포·캐논·통·주문·눈이 있으면 원거리, 칼·낫·발톱·이빨·돌진 몸이면 근접. 여기 없는 이름은 원거리 */
const MELEE=Object.freeze(new Set(['지옥문 파수악마','소환진 타락천사',
 // S-06 디스토피아(dys-bulwark·scythe·membrane·cleaver·behemoth 그림 = 돌진·낫·날개 급습·집게·거대 팔)
 '방벽 돌진체','낫팔 잠복체','막익 급습체','전선 절단자 · 짙은 형상','심해 연산거수 · 짙은 형상','변이된 사냥개 괴수','폐선로 태엽 군단병','외계 침공군',
 // 기계
 '강철 턱의 사이보그 개','전쟁기계사냥개','기계화 망각거미','기계화 기억 공백 망령','관리자 추적견','입양기억 청람잔영','이동문 공허잔영',
 '신경 케이블 포식체','ID 배양 점액체','설원 아래의 기계 다리','기계재판 연결자','전극기계수호기사',
 // 귀신
 '격리실 감염 의료인','백의 구속자','갈망의 약병핵','약을 갈망하는 자','중독의 폐허핵','거짓천국 근위천사','일흔두 번째 인장 잔류체','곰팡이와 오물 봉투',
 '질투로 얼룩진 망령','버려진 최고급 식재료','붉은 하이힐 칼날','분노의 사냥개','불길 속의 늑대','빗속 횡단보도의 기억 잔향','새빛호텔 화재 기록의 잔향',
 '반복된 추락의 인과 잔향','은폐기록 연결체','잠식된 어부','세뇌 신호 점액체','ID 잔류 점액체','소환좌 칩 수호체','성벽 침식 봉인병','무명 검흔','붕괴선 파수병',
 '코어 운반 집행자','환수검 모조체','규칙을 어기지 않는 마네킹','정해진 시각에 도착하지 못한 발자국','막힌 이름들',
 '검은 뿌리 포획체','결말 접합체','금박 유리관 수확기','녹슨 개찰구 수집체','인과 고리충']));
function roleFor(name){const n=norm(name);return NAMES[n]?(MELEE.has(n)?'melee':'ranged'):null;}
const KEEP=Object.freeze({min:3.2,max:6.5,back:1.0});
/* 원거리 몹은 근접을 안 하므로 쏘는 간격을 절반으로(다 합친 압박은 엔진 원거리 몹의 절반 아래) */
const RANGED_CD=.5;
const FIRST=Object.freeze([.8,2.4]),MAXLIVE=3,FIRE_HOLD=.25;
// 보스(사용자 11-19 07:56Z): 그 맵 일반 몹들의 원거리 공격을 동시에, 이펙트·범위 1.66배. 피해는 종류별 0.6배라 세 종류를 다 맞아도 보스 근접 1.5대 이하.
const BOSS=Object.freeze({scale:1.66,dmgK:.6,cd:7.5,windup:.9,min:2.5,max:10,cap:1.4});
/* R1213: 종류가 넷이면 0.6배로도 합이 1.5대를 넘는다 → 다 맞은 합이 보스 근접 1.4대가 되도록 줄인다(셋 이하는 0.6 그대로) */
const totalOf=k=>TUNE[k].dmg*(TUNE[k].ticks||1);
function bossK(kinds){const sum=(kinds||[]).reduce((a,k)=>a+(TUNE[k]?totalOf(k):0),0);return sum>0?Math.min(BOSS.dmgK,BOSS.cap/sum):BOSS.dmgK;}
/* 몹 이름마다 시트 색조를 조금 돌린다(-35°~+35°) — 같은 종류라도 지역·몹마다 달라 보이게. 보스는 원색 */
const hueOf=name=>Math.round((hash('hue:'+norm(name))-.5)*70);
const SCALED_KEYS=['width','len','radius','band','reach','speed','hitR'];
function scaled(kind,k=BOSS.scale){const u=TUNE[kind],o={...u};for(const key of SCALED_KEYS)if(key in o)o[key]=u[key]*k;return Object.freeze(o);}
/* 이름 끝 번호·'우두머리·증원·추격대·후속 증원' 꼬리는 떼고 찾는다(R1213: 지역 몹은 꼬리를 단 채로 나온다) */
const TAIL=/\s+(?:\d+|우두머리|증원|추격대|후속 증원)$/;
const norm=n=>{let s=String(n??'').trim();for(let i=0;i<4&&TAIL.test(s);i++)s=s.replace(TAIL,'').trim();return s;};
function kindFor(name){const k=NAMES[norm(name)];return k||null;}
const major=e=>!!(e&&(e.boss||e.midboss||e.persona||e.cosmic||e.trial||e.samongBoss||e.combatProfile?.major));
/* 맘몬 지역(ep1b06·mammon)은 사용자 지시로 손대지 않는다 */
const banned=()=>{try{return /^ep1b06$|mammon/i.test(String(G('room')?.id||''));}catch(_){return false;}};
/* R1230 연동: 제자리 고정 적(탑·소환진·조형물)은 이 오버레이가 쏘거나 움직이지 않는다 */
const fixedFoe=e=>!!(e&&(e.r75Tower||e.r251Circle||e.r170Tower||e.prop||e.object||e.stationary));
function eligible(e){return !!(e&&!fixedFoe(e)&&effRole(e)==='ranged'&&!banned()&&e.hp>0&&e.spawnState==='active'&&!e.disabled&&!major(e)&&kindFor(e.name));}
const bossLike=e=>!!(e&&(e.boss||e.midboss));
// 그 맵(방)의 일반 몹 종류 — 죽은 몹도 센다(보스전 땐 몹이 다 죽어 있을 수 있음). 방마다 캐시.
const mapCache=new WeakMap();
function mapKinds(room){if(!room)return [];const c=mapCache.get(room);/* 이름이 바뀌어도(R200·R380) 다시 셈 */const n=(room.enemies||[]).map(e=>e&&!major(e)?norm(e.name):'').join('|');if(c&&c.n===n)return c.k;const set=new Set();for(const e of room.enemies||[]){if(!e||major(e))continue;const k=kindFor(e.name);if(k)set.add(k);}const k=[...set];mapCache.set(room,{n,k});return k;}
function bossEligible(e,room){return !!(e&&!banned()&&bossLike(e)&&e.hp>0&&e.spawnState==='active'&&!e.disabled&&!e.persona&&mapKinds(room).length);}
// ---- 판정(순수) ----
function laserHits(ox,oy,a,len,px,py,w){const dx=px-ox,dy=py-oy,c=Math.cos(a),s=Math.sin(a),t=dx*c+dy*s;if(t<0||t>len)return false;return Math.abs(-dx*s+dy*c)<=w;}
const angDiff=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));
function waveHits(ox,oy,a,r,px,py,band,half){const d=Math.hypot(px-ox,py-oy);if(Math.abs(d-r)>band)return false;if(d<1e-6)return true;return angDiff(Math.atan2(py-oy,px-ox),a)<=half;}
function poolHits(cx,cy,r,px,py){return Math.hypot(px-cx,py-cy)<=r;}
// ---- 상태 ----
let live=[];const log=[];// 날아가는·남아 있는 공격: {kind,owner,dmg,...}
/* R200·R380 은 나온 뒤 이름을 바꾼다 → 이름이 바뀌면 종류를 다시 정한다(겨누는 중이면 그 공격은 그대로) */
const S=e=>{const s=e.r1210;if(s){if(!s.boss&&s.name!==e.name&&!s.mode){s.name=e.name;s.kind=kindFor(e.name);}return s;}return (e.r1210={name:e.name,kind:kindFor(e.name),mode:null,t0:0,count:0,next:T()+FIRST[0]+hash(e.id||e.name)*(FIRST[1]-FIRST[0]),windup:0});};
const P=()=>G('player');
function solo(){let m=null;try{m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();}catch(_){}return !m||m==='off';}
function paused(){return !G('started')||G('loading')||G('modal')||G('storyScene')||!P()||!(P().hp>0)||!G('room');}
function sees(e){try{const cl=G('clearLine');return typeof cl!=='function'||!!cl(e,P());}catch(_){return false;}}
function hurtP(d,src){try{const h=G('hurt');if(typeof h==='function'&&d>0)h(d,src);}catch(err){fail(err);}}
function face(e){try{const f=G('facing'),p=P();if(typeof f==='function'){const d=f(p.x-e.x,p.y-e.y);e.direction=d==='front'||d==='back'?((p.x-p.y)<(e.x-e.y)?'left':'right'):d;}}catch(_){}}
function busy(){let n=0;for(const e of G('room')?.enemies||[]){if(e?.r1210?.boss)continue;const m=e?.r1210?.mode;if(m==='windup'||m==='fire')n++;}return n;}
function startWindup(e,s,now){const p=P();s.mode='windup';s.t0=now;s.windup=s.boss?BOSS.windup:TUNE[s.kind].windup;s.hx=e.x;s.hy=e.y;
 const a=Math.atan2(p.y-e.y,p.x-e.x);s.aim={x:p.x,y:p.y,a};face(e);e.r230At=now;e.nav=[];stats.aims++;}
// 발사: aim 은 겨누기 시작 때(근접형) 또는 엔진 겨눔 각(원거리형)으로 고정 — 예고를 보고 옆으로 비키면 피한다.
function fire(e,s,now){const kinds=s.boss?s.kinds:[s.kind];s.mode='fire';s.t0=now;s.count++;
 log.push([String(e.name||''),kinds.join('+'),+now.toFixed(2),s.count]);if(log.length>60)log.shift();
 s.next=now+(s.boss?BOSS.cd:TUNE[s.kind].cd*RANGED_CD)+hash((e.id||'')+':'+s.count)*.8;for(const k of kinds)launch(e,s,k,now);}
function launch(e,s,kind,now){const k=s.boss?BOSS.scale:1,u=s.boss?scaled(kind):TUNE[kind],p=P(),dmg=(Number(e.damage)||0)*u.dmg*(s.boss?bossK(s.kinds):1),a=s.aim.a,src={x:e.x,y:e.y,owner:e.id,r1210:kind};
 stats.fires[kind]++;const base={kind,owner:e.id,scale:k,u,ox:e.x,oy:e.y,a,t0:now,dmg,src,hue:s.boss?0:hueOf(e.name)};
 if(kind==='laser'){live.push({...base,len:u.len,life:u.life});if(laserHits(e.x,e.y,a,u.len,p.x,p.y,u.width)){hurtP(dmg,src);stats.hits.laser++;}}
 else if(kind==='sonic')live.push({...base,life:u.reach/u.speed,hit:false});
 else if(kind==='fear'){/* 시선: 쏘는 순간 부채꼴(겨눈 쪽 ±half, reach 안)에 있으면 맞음 */const d=Math.hypot(p.x-e.x,p.y-e.y),hit=d<=u.reach&&angDiff(Math.atan2(p.y-e.y,p.x-e.x),a)<=u.half&&sees(e);
  live.push({...base,life:u.life,hit,px:p.x,py:p.y});if(hit){hurtP(dmg,src);stats.hits.fear++;}}
 else if(kind==='dark'||kind==='fire')live.push({...base,life:u.reach/u.speed+u.impact,hit:false,end:null});
 else if(kind==='shadow'||kind==='tentacle'){const d=Math.min(Math.hypot(s.aim.x-e.x,s.aim.y-e.y),s.boss?BOSS.max:u.max);live.push({...base,tx:e.x+Math.cos(a)*d,ty:e.y+Math.sin(a)*d,life:u.delay+u.rise,hit:false});}
 else{const d=Math.min(Math.hypot(s.aim.x-e.x,s.aim.y-e.y),s.boss?BOSS.max:u.max),tx=e.x+Math.cos(a)*d,ty=e.y+Math.sin(a)*d;
  if(kind==='bomb')live.push({...base,tx,ty,life:u.flight+u.blast,hit:false});else live.push({...base,tx,ty,life:u.flight+u.pool,ticks:0,lastTick:-9});}}
function advanceLive(now){const p=P(),alive=new Set();for(const e of G('room')?.enemies||[])if(e&&e.hp>0)alive.add(e.id);
 /* 쏜 몹이 죽으면 남은 공격도 사라짐(엔진 cleanupOwner3 와 같게) */live=live.filter(x=>{const age=now-x.t0;if(age>x.life)return false;if(x.owner!=null&&x.owner!=='demo'&&!alive.has(x.owner))return false;
 if(x.kind==='sonic'&&!x.hit){const u=x.u,r=age*u.speed;if(waveHits(x.ox,x.oy,x.a,r,p.x,p.y,u.band,u.half)){x.hit=true;hurtP(x.dmg,x.src);stats.hits.sonic++;}}
 else if((x.kind==='dark'||x.kind==='fire')&&!x.end){const u=x.u,fl=Math.min(age,u.reach/u.speed)*u.speed,qx=x.ox+Math.cos(x.a)*fl,qy=x.oy+Math.sin(x.a)*fl;
  if(Math.hypot(p.x-qx,p.y-qy)<=u.hitR){x.hit=true;x.end={x:qx,y:qy,t:now};hurtP(x.dmg,x.src);stats.hits[x.kind]++;}else if(age>=u.reach/u.speed)x.end={x:qx,y:qy,t:now};}
 else if((x.kind==='shadow'||x.kind==='tentacle')&&!x.hit){const u=x.u;if(age>=u.delay){x.hit=true;const h=x.kind==='shadow'?poolHits(x.tx,x.ty,u.radius,p.x,p.y):laserHits(x.ox,x.oy,x.a,u.len,p.x,p.y,u.width);if(h){hurtP(x.dmg,x.src);stats.hits[x.kind]++;x.struck=true;}}}
 else if(x.kind==='bomb'&&!x.hit){if(age>=x.u.flight){x.hit=true;if(poolHits(x.tx,x.ty,x.u.radius,p.x,p.y)){hurtP(x.dmg,x.src);stats.hits.bomb++;}}}
 else if(x.kind==='radiation'){const u=x.u;if(age>=u.flight&&x.ticks<u.ticks&&now-x.lastTick>=u.gap-1e-6&&poolHits(x.tx,x.ty,u.radius,p.x,p.y)){x.ticks++;x.lastTick=now;hurtP(x.dmg,x.src);stats.hits.radiation++;}}
 return true;});}
let lastT=-1;
function step(){if(!prefs.on||paused())return;const now=T();if(!(now>lastT)){lastT=now;return;}lastT=now;
 /* Dots 협동 검수(11-19 11:10Z): 협동으로 바뀌면 남은 겨누기·날아가는 공격을 지우고 원래 ai 로 돌린다(협동은 엔진 기본 탄만) */
 if(!solo()){if(live.length)live=[];for(const e of G('room')?.enemies||[]){if(e?.r1210?.mode)e.r1210.mode=null;if(e&&e.r1214Ai!==undefined&&e.ai!==e.r1214Ai){e.ai=e.r1214Ai;}}return;}
 advanceLive(now);const p=P(),room=G('room');let n=busy();
 for(const e of room.enemies||[]){if(!e)continue;const s=e.r1210;
  if(solo()&&!bossLike(e)&&!major(e)&&e.hp>0&&!banned())roleTick(e,p);
  if(s?.mode){if(!(s.boss?bossEligible(e,room):eligible(e))||e.attack||(s.boss&&(e.rest>0||e.rangedWindup>0))){s.mode=null;stats.cancels++;continue;}
   const age=now-s.t0;
   if(s.mode==='windup'){e.x=s.hx;e.y=s.hy;e.moving=false;e.nav=[];e.r230At=now;if(!s.boss)e.cd=Math.max(Number(e.cd)||0,s.windup-age+.3);face(e);if(age>=s.windup)fire(e,s,now);}
   else if(s.mode==='fire'){if(age>=FIRE_HOLD)s.mode=null;else{e.moving=false;e.r230At=now;}}
   continue;}
  if(solo()&&bossEligible(e,room)&&!e.attack&&!(e.rangedWindup>0)&&!(e.rest>0)){const st=e.r1210||(e.r1210={boss:true,kinds:mapKinds(room),mode:null,t0:0,count:0,next:now+FIRST[1]+hash(e.id||e.name)*1.5,windup:0});st.boss=true;st.kinds=mapKinds(room);st.kind=st.kinds[0];warm();
   const d=Math.hypot(p.x-e.x,p.y-e.y);if(now>=st.next&&d>=BOSS.min&&d<=BOSS.max&&sees(e))startWindup(e,st,now);continue;}
  if(!solo()||!eligible(e)||e.ai==='hybrid'||e.ai==='ranged'||e.attack||e.rangedWindup>0||e.r286?.mode||e.rest>0)continue;
  const st=S(e);if(!st.kind)continue;warm();if(now<st.next||n>=MAXLIVE)continue;const u=TUNE[st.kind],d=Math.hypot(p.x-e.x,p.y-e.y);
  /* 벽에 몰려 더 못 물러나는 원거리 몹은 1칸 거리까지 쏜다 */
  if(d<(e.r1214Stuck?1:u.min)||d>u.max||!sees(e))continue;startWindup(e,st,now);n++;}}
/* R1214b 역할 지키기: 원거리 몹은 ai 'ranged'·거리 유지·근접 안 함, 근접 몹은 ai 'melee'(원거리 없음). 원래 ai 는 e.r1214Ai 에 둔다 */
let lastRoleT=-1;const roleStats={ranged:0,melee:0,backs:0,holds:0,meleeCancels:0,toClose:0,toRange:0,swings:0};
/* R1231 경향(사용자 11-19 11:22Z, 피로물든병원 안정화 집행체 규칙): 원거리 몹 = 쏘기 3번 → 다가가 근접 1번 → 다시 물러나 쏘기.
   근거리 몹(원거리 종류가 있는 몹) = 근접 3번 → 물러나 쏘기 1번 → 다시 근접. 순환이 막히면(못 닿음·못 쏨) 제한 시간 뒤 원래 경향으로 돌아간다 */
const LEAN=Object.freeze({shots:3,swings:3,closeMax:6,rangeMax:7,meleeMax:10});
function effRole(e){const r=roleFor(e?.name);if(!r)return null;const L=e.r1231;return L&&L.lean===r?L.phase:r;}
function leanTick(e,r,now){let L=e.r1231;if(!L||L.lean!==r)L=e.r1231={lean:r,phase:r,t0:now,c0:e.r1210?.count||0,swings:0,atk:null};
 const cnt=e.r1210?.count||0,set=(ph)=>{L.phase=ph;L.t0=now;L.c0=cnt;L.swings=0;e.r1214P=null;e.r1214Close=null;e.r1214Stuck=false;if(ph==='melee')roleStats.toClose++;else roleStats.toRange++;};
 const a=e.attack;if(a&&!a.r1210Fake&&a!==L.atk){L.atk=a;if(L.phase==='melee'){L.swings++;roleStats.swings++;}}
 if(r==='ranged'){if(L.phase==='ranged'){if(cnt-L.c0>=LEAN.shots&&!e.r1210?.mode)set('melee');}
  else if((L.swings>=1&&!e.attack)||now-L.t0>LEAN.closeMax)set('ranged');}
 else if(!kindFor(e.name)){L.phase='melee';}
 else if(L.phase==='melee'){/* 근접 공격을 못 하는 몹(시전형 등)도 10초 지나면 한 번 쏜다 */if((L.swings>=LEAN.swings&&!e.attack)||(now-L.t0>LEAN.meleeMax&&!e.attack)){set('ranged');const s=S(e);s.next=Math.min(s.next,now+.6);}}
 else if((cnt>L.c0&&!e.r1210?.mode)||now-L.t0>LEAN.rangeMax)set('melee');
 return L.phase;}
/* 둘 다 엔진 ai 는 'melee' 로 둔다(엔진 기본 탄 ranged3 는 안 쏨). 원거리 몹은 이 오버레이가 겨누기 예고(Dots 시트)와 함께 RANGED_CD 배 짧은 간격으로 쏘고, 거리를 지킨다 */
function roleTick(e,p){if(fixedFoe(e))return;const r=roleFor(e.name);if(!r)return;if(e.r1214Ai===undefined)e.r1214Ai=e.ai;
 if(e.ai!=='melee'){e.ai='melee';roleStats[r]++;}
 /* R1231: 지금 순환 단계로 움직인다(근접 단계면 엔진 근접 AI 그대로) */if(leanTick(e,r,T())==='melee')return;
 if(e.spawnState!=='active')return;const now=T(),dt=Math.min(.1,Math.max(0,now-(e.r1214T??now)));e.r1214T=now;
 if(e.attack&&!e.attack.r1210Fake&&!e.attack.storyWorldPose5){e.attack=null;roleStats.meleeCancels++;}
 const d=Math.hypot(p.x-e.x,p.y-e.y);
 /* 엔진이 매 틱 근접 공격을 시작하지 않도록 근접 쿨다운을 조금 걸어 둔다(겨누기는 이 오버레이가 따로 셈) */
 e.cd=Math.max(Number(e.cd)||0,.25);
 if(d>=KEEP.min){e.r1214Stuck=false;e.r1214Close=null;}else if(e.r1214Close==null)e.r1214Close=now;
 if(d<KEEP.min&&dt>0){let moved=false;const v={x:(e.x-p.x)/(d||1),y:(e.y-p.y)/(d||1)},sp=(Number(e.speed)||1.5)*KEEP.back*dt,bl=G('blocked');
  for(const [ax,ay] of [[v.x,v.y],[v.x-v.y*.7,v.y+v.x*.7],[v.x+v.y*.7,v.y-v.x*.7]]){const nx=e.x+ax*sp,ny=e.y+ay*sp;let ok=true;try{ok=typeof bl!=='function'||!bl(nx,ny,e.radius||.3);}catch(_){}if(ok){e.x=nx;e.y=ny;e.nav=[];roleStats.backs++;moved=true;break;}}/* 벽에 막혔거나 1.5초 넘게 못 떼어 내면(영웅이 더 빠름) 가까이서도 쏜다 */e.r1214Stuck=!moved||now-e.r1214Close>1.5;}
 /* 한 틱 걸음(0.5칸 미만)만 되돌린다 — 순간이동·넉백·블링크는 그대로 둔다 */
 else if(d<=KEEP.max&&e.r1214P&&Math.hypot(e.x-e.r1214P.x,e.y-e.r1214P.y)<.5){const pd=Math.hypot(p.x-e.r1214P.x,p.y-e.r1214P.y);if(d<pd-1e-6){e.x=e.r1214P.x;e.y=e.r1214P.y;e.nav=[];e.moving=false;roleStats.holds++;}}
 e.r1214P={x:e.x,y:e.y};}
// 엔진 원거리 차례(hybrid·ranged): 기본 탄 대신 같은 종류 미래형 공격(겨눔 각은 엔진 rangedAim).
const R3=G('ranged3');
if(typeof R3==='function'){const base=R3;const wrapped=function(e,...a){try{if(prefs.on&&solo()&&eligible(e)){const s=S(e),p=P(),ang=Number.isFinite(e.rangedAim)?e.rangedAim:Math.atan2(p.y-e.y,p.x-e.x),d=Math.hypot(p.x-e.x,p.y-e.y);
   s.aim={x:e.x+Math.cos(ang)*d,y:e.y+Math.sin(ang)*d,a:ang};stats.engine++;warm();fire(e,s,T());arm();return;}}catch(err){fail(err);}return base.apply(this,[e,...a]);};
 try{Function('f','ranged3=f')(wrapped);}catch(err){fail(err);}}
// ---- 그리기 ----
/* 레이저 = Dots CX-0167RA r1 ROUGH(scripts/r1210-laser-sheets.py). 방사능은 MR-05~07 오기 전 R562 독안개·독웅덩이 재사용, 음파 고리는 R438 충격파를 청회색으로 다시 칠한 것 */
const SH=Object.freeze({laserAim:'assets/r1210/laser-aim6.webp',laserCharge:'assets/r1210/laser-charge8.webp',laserBody:'assets/r1210/laser-body8.webp',laserHit:'assets/r1210/laser-impact8.webp',
 ring:'assets/r1210/sonic-ring.webp',blast:'assets/r1213/bomb-blast24.webp',
 /* R1213: Dots CX-0167RA r1 ROUGH 기계 시트(가로 한 줄) */bombWarn:'assets/r1213/bomb-warning8.webp',inkBurst:'assets/r1213/ink-dispersal12.webp',orb:'assets/r1213/orb-flight8.webp',capsule:'assets/r1213/capsule-flight8.webp',greenWarn:'assets/r1213/green-warning8.webp',sonicCharge:'assets/r1213/sonic-charge6.webp',
 /* R1227 불 계열 Dots 시트 */fireball:'assets/r1227/fireball-flight8.webp',crimson:'assets/r1227/crimson-impact12.webp',castTell:'assets/r1227/cast-tell8.webp',
 /* R1214 귀신 계열 Dots 시트 */gaze:'assets/r1214/fear-gaze12.webp',fearMark:'assets/r1214/fear-status8.webp',darkOrb:'assets/r1214/dark-orb-flight8.webp',darkHit:'assets/r1214/dark-impact8.webp',
 handWarn:'assets/r1214/shadow-hand-warning8.webp',handRise:'assets/r1214/shadow-rise12.webp',fissure:'assets/r1214/fissure-warning8.webp',inkRise:'assets/r1214/ink-rise10.webp',mist:'assets/r562/neon-toxic-mist.webp',pool:'assets/r562/dots/neon-toxic-pool.webp'});
const COL=Object.freeze({ink:'rgba(12,14,20,.62)',laser:'#a8f4ff',rad:'#9be37a',sonic:'#c9d6f2',bomb:'#b8a6ff',ghost:'#b9b2c8',dark:'#8a74b8'});
function img(path){try{const r=G('readyImage')?.(path),im=r?.image;if(!r)want(path);return im&&(im.naturalWidth||im.width)>0?im:null;}catch(_){return null;}}
/* 엔진은 지역을 옮길 때 그 지역에 안 쓰는 그림을 imageCache 에서 내린다(R912) → 없으면 다시 부른다(부팅 중엔 부르지 않음). 디스토피아 몹을 처음 보면 미리 부른다. */
function want(path){try{if(G('loading')||!G('started'))return;const ad=G('addImage');if(typeof ad==='function')ad(path);}catch(err){fail(err);}}
let warmAt=-9;function warm(){const now=T();if(now-warmAt<2&&now>=warmAt)return;warmAt=now;for(const q of Object.values(SH))if(!G('readyImage')?.(q))want(q);}
function grid(path,f,x,y,w,h,alpha){const im=img(path);if(!im)return false;const c=G('ctx'),cw=(im.naturalWidth||im.width)/6,ch=(im.height||im.naturalHeight)/4,i=((f%24)+24)%24;
 c.save();c.globalAlpha=alpha;c.drawImage(im,(i%6)*cw,Math.floor(i/6)*ch,cw,ch,x-w/2,y-h/2,w,h);c.restore();return true;}
function strip(path,n,cell,f,x,y,size,alpha,h){const im=img(path);if(!im)return false;const c=G('ctx'),hh=h||size;c.save();c.globalAlpha=alpha;c.drawImage(im,(Math.max(0,Math.min(n-1,f)))*cell,0,cell,cell,x-size/2,y-hh/2,size,hh);c.restore();return true;}
/* 가로 한 줄 시트, 칸 cw×ch, 바닥 기준(bottom=true 면 y 가 칸 아래 끝) */
function cell(path,n,f,x,y,w,h,alpha,bottom){const im=img(path);if(!im)return false;const c=G('ctx'),cw=(im.naturalWidth||im.width)/n,ch=im.naturalHeight||im.height,i=Math.max(0,Math.min(n-1,f));c.save();c.globalAlpha=alpha;c.drawImage(im,i*cw,0,cw,ch,x-w/2,bottom?y-h:y-h/2,w,h);c.restore();return true;}
/* 먹 시트는 어두운 바닥에 묻힌다 → 밑에 옅은 종이빛 번짐을 깐다(수묵의 흰 바탕) */
function halo(c,x,y,rx,ry,alpha){ell(c,{x,y},rx,ry,'#e9e4f0',alpha*.3,true);ell(c,{x,y},rx*.72,ry*.72,'#f4f0f8',alpha*.38,true);ell(c,{x,y},rx*.45,ry*.45,'#fbf9fd',alpha*.3,true);}
/* 월드 반지름 r 원은 아이소 화면에서 가로 √2·r·TILE, 세로 그 절반 — 예고 원을 판정 원과 맞춘다(Codex 리뷰 PR 841 지적) */
const ISO=Math.SQRT2;
const unit=()=>(Number(G('TILE'))||32)*(Number(G('zoom'))||1);
const AH=()=>{try{return G('actorHeight')?.()||60;}catch(_){return 60;}};
function line(c,a,b,w,col,alpha){c.save();c.globalAlpha=alpha;c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();c.restore();}
function ell(c,q,rx,ry,col,alpha,fill,lw){c.save();c.globalAlpha=alpha;c.beginPath();c.ellipse?.(q.x,q.y,Math.max(1,rx),Math.max(1,ry),0,0,Math.PI*2);if(fill){c.fillStyle=col;c.fill();}else{c.strokeStyle=col;c.lineWidth=lw||2;c.stroke();}c.restore();}
function arcs(c,o,a,r,half,col,alpha,w){/* 아이소 화면에서 부채꼴 고리: 월드 점을 이어 그린다 */const pr=G('project');c.save();c.globalAlpha=alpha;c.strokeStyle=col;c.lineWidth=w;c.beginPath();
 for(let i=0;i<=12;i++){const t=a-half+2*half*i/12,q=pr(o.x+Math.cos(t)*r,o.y+Math.sin(t)*r);if(i)c.lineTo(q.x,q.y-AH()*.35);else c.moveTo(q.x,q.y-AH()*.35);}c.stroke();c.restore();}
/* 가로 스트립 시트 칸 하나를 두 점 사이에 늘여 그린다(레이저 조준선·몸통) */
function band(path,n,f,from,to,h,alpha){const im=img(path);if(!im)return false;const c=G('ctx'),cw=(im.naturalWidth||im.width)/n,ch=im.naturalHeight||im.height,len=Math.hypot(to.x-from.x,to.y-from.y),an=Math.atan2(to.y-from.y,to.x-from.x),i=((f%n)+n)%n;
 if(!(len>1))return false;c.save();c.globalAlpha=alpha;c.translate(from.x,from.y);c.rotate(an);c.drawImage(im,i*cw,0,cw,ch,0,-h/2,len,h);c.restore();return true;}
function drawTele(c,e,kind,u01,aim,k=1){stats.tele++;const pr=G('project'),ah=AH(),q=pr(e.x,e.y),chest={x:q.x,y:q.y-ah*.45},g=Math.max(0,Math.min(1,u01)),now=T();
 if(kind==='laser'){const L=TUNE.laser.len*k,end=pr(e.x+Math.cos(aim.a)*L,e.y+Math.sin(aim.a)*L),to={x:end.x,y:end.y-ah*.35};
  /* Dots MR-04 조준선(6칸 반복) + MR-01 총구 충전(8칸, 겨누기 진행에 맞춰) */
  /* 조준선 시트는 칸(32px) 안 선이 가늘어 수묵 필터 아래 묻힌다 → 먹 밑선 + 시트 두 겹 */
  line(c,chest,to,(2+2*g)*k,COL.ink,.3+.3*g);if(band(SH.laserAim,6,Math.floor(now*14),chest,to,Math.max(10,ah*.3)*k,.6+.4*g))band(SH.laserAim,6,Math.floor(now*14)+3,chest,to,Math.max(6,ah*.16)*k,.5+.5*g);else line(c,chest,to,1.5,COL.laser,.3+.5*g);
  strip(SH.laserCharge,8,128,Math.floor(g*7.99),chest.x,chest.y,ah*(.45+.4*g)*k,.65+.35*g);}
 else if(kind==='sonic'){const half=TUNE.sonic.half;for(let j=0;j<3;j++){const r=(.5+j*.45+g*.3)*k;arcs(c,e,aim.a,r,half,COL.ink,.3*(1-j*.25),4*k);arcs(c,e,aim.a,r,half,COL.sonic,(.25+.5*g)*(1-j*.25),1.5*k);}grid(SH.ring,Math.floor(g*9.99),chest.x,chest.y,ah*.7*k,ah*.45*k,.25+.3*g);strip(SH.sonicCharge,6,128,Math.floor(g*5.99),chest.x,chest.y,ah*(.5+.35*g)*k,.6+.4*g);}
 else if(kind==='fear'){/* 머리 위에 눈이 뜨고(0~5칸) 겨눈 쪽으로 옅은 먹 부채꼴 */const u=TUNE.fear;halo(c,q.x,q.y-ah*1.25,ah*.5*k,ah*.3*k,.5+.5*g);cell(SH.gaze,12,Math.floor(g*5.99),q.x,q.y-ah*1.25,ah*1.1*k,ah*1.1*k,.7+.3*g);
  for(const sd of [-1,1]){const t=aim.a+sd*u.half,end=pr(e.x+Math.cos(t)*u.reach*k,e.y+Math.sin(t)*u.reach*k);line(c,chest,{x:end.x,y:end.y-ah*.35},2*k,COL.ink,.18+.25*g);}
  arcs(c,e,aim.a,u.reach*k*(.3+.7*g),u.half,COL.ghost,.2+.3*g,1.5*k);}
 else if(kind==='fire'){/* 발밑 시전 고리(Dots TL03) + 손에 불덩이가 커짐 — 코드 선·원 없이 시트만 */cell(SH.castTell,8,Math.floor(g*7.99),q.x,q.y,ah*1.3*k,ah*.65*k,.75+.25*g);cell(SH.fireball,8,Math.floor(now*14)%8,chest.x,chest.y,ah*(.45+.45*g)*k,ah*(.45+.45*g)*.75*k,.6+.4*g);}
 else if(kind==='dark'){const u=TUNE.dark,end=pr(e.x+Math.cos(aim.a)*u.reach*k,e.y+Math.sin(aim.a)*u.reach*k);line(c,chest,{x:end.x,y:end.y-ah*.35},(2+2*g)*k,COL.ink,.2+.3*g);
  line(c,chest,{x:end.x,y:end.y-ah*.35},1.5*k,COL.dark,.25+.35*g);cell(SH.darkOrb,8,Math.floor(now*14)%8,chest.x,chest.y,ah*(.5+.4*g)*k,ah*(.5+.4*g)*k,.7+.3*g);}
 else if(kind==='shadow'){const u=TUNE.shadow,d=Math.min(Math.hypot(aim.x-e.x,aim.y-e.y),k>1?BOSS.max:u.max),t=pr(e.x+Math.cos(aim.a)*d,e.y+Math.sin(aim.a)*d),R=u.radius*k*unit()*ISO;
  ell(c,t,R,R*.5,COL.ghost,.35+.3*g,false,2);cell(SH.handWarn,8,Math.floor(g*7.99),t.x,t.y,R*2.6,R*1.3,.7+.3*g);}
 else if(kind==='tentacle'){/* 겨눈 줄을 따라 땅이 갈라짐(8칸) */const u=TUNE.tentacle,L=u.len*k,o=pr(e.x,e.y),end=pr(e.x+Math.cos(aim.a)*L,e.y+Math.sin(aim.a)*L);
  line(c,o,end,(10+6*g)*k,'#e9e4f0',.1+.12*g);line(c,o,end,(2+g)*k,COL.ghost,.3+.3*g);band(SH.fissure,8,Math.floor(g*7.99),o,end,Math.max(10,ah*.32)*k,.7+.3*g);}
 else if(kind==='bomb'){/* 떨어질 자리: 먹 테 + 보라 테, 음파 고리 시트를 거꾸로 돌려 조여드는 고리 */const u=TUNE.bomb,d=Math.min(Math.hypot(aim.x-e.x,aim.y-e.y),k>1?BOSS.max:u.max),t=pr(e.x+Math.cos(aim.a)*d,e.y+Math.sin(aim.a)*d),R=u.radius*k*unit()*ISO;
  /* Dots 먹 고리가 감겨 닫히는 8칸(시트 원 지름 ≈ 칸의 0.68) *//* 먹 테는 늘 깐다(밝은 바닥에서도 읽히게) */ell(c,t,R,R*.5,COL.ink,.6,false,4);ell(c,t,R,R*.5,COL.bomb,.35+.4*g,false,1.5);strip(SH.bombWarn,8,256,Math.floor(g*7.99),t.x,t.y,R*2/.68,.75+.25*g,R/.68);ell(c,{x:chest.x,y:chest.y},ah*.08*k,ah*.08*k,COL.bomb,.4+.5*g,true);}
 else{const t=pr(aim.x,aim.y),R=TUNE.radiation.radius*k*unit()*ISO;/* Dots 녹색으로 차오르는 원 8칸 */ell(c,t,R,R*.5,COL.ink,.6,false,4);ell(c,t,R,R*.5,COL.rad,.35+.4*g,false,1.5);strip(SH.greenWarn,8,256,Math.floor(g*7.99),t.x,t.y,R*2/.68,.7+.3*g,R/.68);grid(SH.mist,Math.floor(g*23.99),chest.x,chest.y,ah*(.4+.3*g)*k,ah*(.4+.3*g)*k,.5+.5*g);}}
function drawLive(c,now){const pr=G('project'),ah=AH(),U=unit();
 for(const x of live){const age=now-x.t0,K=x.scale||1;stats.drawn[x.kind]=(stats.drawn[x.kind]||0)+1;
  const tint=x.hue?'hue-rotate('+x.hue+'deg)':'';if(tint){c.save();try{c.filter=tint;}catch(_){}}try{
  if(x.kind==='laser'){const k=Math.max(0,1-age/x.life),o=pr(x.ox,x.oy),e=pr(x.ox+Math.cos(x.a)*x.len,x.oy+Math.sin(x.a)*x.len),from={x:o.x,y:o.y-ah*.45},to={x:e.x,y:e.y-ah*.35},bh=Math.max(16,ah*.5)*K;
   /* Dots MR-02 몸통(8칸 반복, 먹 번짐 테두리 포함) */
   if(!band(SH.laserBody,8,Math.floor(age*24),from,to,bh,.5+.5*k))line(c,from,to,3,COL.laser,k);
   const fr=Math.min(7,Math.floor(age/x.life*8)),fs=ah*.8*K;
   strip(SH.laserCharge,8,128,7,from.x,from.y,fs*.8,k);strip(SH.laserHit,8,128,fr,to.x,to.y,fs,1);}
  else if(x.kind==='sonic'){const u=x.u,r=age*u.speed,k=Math.max(0,1-age/x.life);
   for(let j=0;j<3;j++){const rr=Math.max(.2,r-j*.35*K);arcs(c,{x:x.ox,y:x.oy},x.a,rr,u.half,COL.ink,.55*k*(1-j*.3),8*K);arcs(c,{x:x.ox,y:x.oy},x.a,rr,u.half,COL.sonic,.9*k*(1-j*.3),3*K);}
   if(age<.4){const o=pr(x.ox,x.oy);grid(SH.ring,Math.floor(age*30),o.x,o.y-ah*.2,U*2.2*K,U*1.4*K,.8*(1-age/.4));}}
  else if(x.kind==='fear'){const u=x.u,v=Math.min(1,age/u.life),o=pr(x.ox,x.oy);halo(c,o.x,o.y-ah*1.25,ah*.5*K,ah*.3*K,1-v);cell(SH.gaze,12,6+Math.floor(v*5.99),o.x,o.y-ah*1.25,ah*1.1*K,ah*1.1*K,1-v*.3);
   arcs(c,{x:x.ox,y:x.oy},x.a,u.reach*(.4+.6*v),u.half,COL.ink,.35*(1-v),5*K);arcs(c,{x:x.ox,y:x.oy},x.a,u.reach*(.4+.6*v),u.half,COL.ghost,.5*(1-v),2*K);
   if(x.hit){const P0=P(),q=pr(P0.x,P0.y);halo(c,q.x,q.y-ah*1.15,ah*.35,ah*.3,1);cell(SH.fearMark,8,Math.floor(age*12)%8,q.x,q.y-ah*1.15,ah*.55,ah*.55,.9);}}
  else if(x.kind==='fire'){const u=x.u;if(!x.end){const fl=age*u.speed,q=pr(x.ox+Math.cos(x.a)*fl,x.oy+Math.sin(x.a)*fl),sx=Math.cos(x.a)-Math.sin(x.a);/* 시트 불덩이는 오른쪽으로 날아가는 그림 → 화면 진행 방향이 왼쪽이면 좌우 반전 */
    if(sx<0){c.save();c.translate(q.x,0);c.scale(-1,1);cell(SH.fireball,8,Math.floor(age*16)%8,0,q.y-ah*.45,U*2.6*K,U*1.95*K,1);c.restore();}else cell(SH.fireball,8,Math.floor(age*16)%8,q.x,q.y-ah*.45,U*2.6*K,U*1.95*K,1);}
   else{const pa=now-x.end.t,q=pr(x.end.x,x.end.y);cell(SH.crimson,12,Math.min(11,Math.floor(pa/u.impact*12)),q.x,q.y+U*.3*K,U*2.6*K,U*2.6*K,1,true);}}
  else if(x.kind==='mhit'){/* 근접 불 몹 타격 자국(R248 선·불꽃 도형 대신) */const v=Math.min(1,age/x.life),q=pr(x.tx,x.ty);cell(SH.crimson,12,Math.min(11,Math.floor(v*12)),q.x,q.y+ah*.15,ah*1.5,ah*1.5,1,true);}
  else if(x.kind==='dark'){const u=x.u;if(!x.end){const fl=age*u.speed,q=pr(x.ox+Math.cos(x.a)*fl,x.oy+Math.sin(x.a)*fl);cell(SH.darkOrb,8,Math.floor(age*16)%8,q.x,q.y-ah*.45,U*1.4*K,U*1.4*K,1);ell(c,q,6*K,3*K,COL.ink,.3,true);}
   else{const pa=now-x.end.t,q=pr(x.end.x,x.end.y);cell(SH.darkHit,8,Math.min(7,Math.floor(pa/u.impact*8)),q.x,q.y-ah*.4,U*1.6*K,U*1.6*K,1);}}
  else if(x.kind==='shadow'){const u=x.u,q=pr(x.tx,x.ty),R=u.radius*U*ISO;if(age<u.delay)cell(SH.handWarn,8,7,q.x,q.y,R*2.6,R*1.3,1);
   else{const pa=age-u.delay;cell(SH.handWarn,8,7,q.x,q.y,R*2.6,R*1.3,Math.max(0,1-pa/u.rise));cell(SH.handRise,12,Math.min(11,Math.floor(pa/u.rise*12)),q.x,q.y+R*.15,R*2.4,R*2.4*256/192,1,true);}}
  else if(x.kind==='tentacle'){const u=x.u,o=pr(x.ox,x.oy),e2=pr(x.ox+Math.cos(x.a)*u.len,x.oy+Math.sin(x.a)*u.len);band(SH.fissure,8,7,o,e2,Math.max(10,ah*.32)*K,age<u.delay?1:Math.max(0,1-(age-u.delay)/u.rise));
   if(age>=u.delay){const pa=age-u.delay,f=Math.min(9,Math.floor(pa/u.rise*10));for(let j=1;j<=4;j++){const t=j/4.4,w=pr(x.ox+Math.cos(x.a)*u.len*t,x.oy+Math.sin(x.a)*u.len*t);cell(SH.inkRise,10,Math.max(0,f-(j-1)),w.x,w.y,ah*.6*K,ah*.6*K*256/192,1,true);}}}
  else if(x.kind==='bomb'){const u=x.u;
   if(age<u.flight){/* 던진 통: 먹 몸 + 깜박이는 보라 심지, 포물선 */const v=age/u.flight,wx=x.ox+(x.tx-x.ox)*v,wy=x.oy+(x.ty-x.oy)*v,q=pr(wx,wy),lift=ah*(.45+1.3*v*(1-v)*2),blink=(Math.floor(age*14)%2)?1:.45;
    if(!strip(SH.orb,8,96,Math.floor(age*16)%8,q.x,q.y-lift,U*.75*K,1)){ell(c,{x:q.x,y:q.y-lift},U*.2*K,U*.16*K,COL.ink,.7,true);ell(c,{x:q.x,y:q.y-lift-U*.1*K},U*.07*K,U*.07*K,COL.bomb,blink,true);}ell(c,q,6*K,3*K,COL.ink,.3,true);
    const t=pr(x.tx,x.ty),R=u.radius*U*ISO;if(!strip(SH.bombWarn,8,256,7,t.x,t.y,R*2/.68,.8,R/.68))ell(c,t,R,R*.5,COL.ink,.45,false,3);ell(c,t,R*(1-v*.6),R*.5*(1-v*.6),COL.bomb,.5,false,1.5);}
   else{const pa=age-u.flight,q=pr(x.tx,x.ty),R=u.radius*U*ISO,f=Math.floor(pa/u.blast*24);
    if(!grid(SH.blast,Math.min(23,f),q.x,q.y-R*1.05,R*2.6,R*2.6,1))ell(c,q,R,R*.5,COL.bomb,.6*(1-pa/u.blast),true);
    /* Dots 먹 흩어짐 12칸 — 터짐 위에 땅바닥 먹물 */strip(SH.inkBurst,12,256,Math.min(11,Math.floor(pa/u.blast*12)),q.x,q.y,R*2.4,.9,R*1.4);}}
  else{const u=x.u;
   if(age<u.flight){const v=age/u.flight,wx=x.ox+(x.tx-x.ox)*v,wy=x.oy+(x.ty-x.oy)*v,q=pr(wx,wy),lift=ah*(.45+1.1*v*(1-v)*2);grid(SH.mist,Math.floor(age*20),q.x,q.y-lift,U*1.1*K,U*1.1*K,.6);if(!strip(SH.capsule,8,96,Math.floor(age*16)%8,q.x,q.y-lift,U*.8*K,1)){ell(c,{x:q.x,y:q.y-lift},U*.22*K,U*.22*K,COL.ink,.55,true);ell(c,{x:q.x,y:q.y-lift},U*.1*K,U*.1*K,COL.rad,.9,true);}ell(c,q,5*K,2.5*K,COL.ink,.3,true);}
   else{const pa=age-u.flight,k=Math.min(1,pa/.2)*Math.min(1,(u.pool-pa)/.4),q=pr(x.tx,x.ty),R=u.radius*U*ISO;
    grid(SH.pool,Math.floor(pa*12.5),q.x,q.y,R*2.3,R*1.25,.85*k);grid(SH.mist,Math.floor(pa*12.5)+7,q.x,q.y-R*.35,R*1.4,R*1.2,.55*k);}}
  }finally{if(tint)c.restore();}}}
function drawFx(){const c=G('ctx'),room=G('room');if(!c||!room||typeof G('project')!=='function')return;
 /* R1214: 앞 효과가 합성 방식·필터를 남기면(스토리 지역) 우리 그림이 바닥 밑으로 깔린다 → 그리는 동안 기본값으로 */
 /* 스토리 지역 기록기는 주인(owner) 없는 그림을 'scene' 으로 보고, R350 영웅 가림 옅게가 영웅 상자를 덮는 그림을 85%까지 지운다 → 적 공격 주인으로 감싼다 */
 const run=()=>{c.save();try{c.globalCompositeOperation='source-over';c.globalAlpha=1;try{c.filter='none';}catch(_){}drawFxInner(c,room);}finally{c.restore();}};
 if(typeof c.scope==='function'&&Array.isArray(c.commands))c.scope({id:'r1210-enemy-ranged',kind:'effect',enemy:true,pxfSide:'enemy',x:SENT.x,y:SENT.y},run);else run();}
function drawFxInner(c,room){const now=T();
 for(const e of room.enemies||[]){if(!e||!(e.hp>0))continue;const s=e.r1210;
  if(s?.mode==='windup'&&s.aim){for(const k of (s.boss?s.kinds:[s.kind]))drawTele(c,e,k,(now-s.t0)/s.windup,s.aim,s.boss?BOSS.scale:1);}
  else if(e.rangedWindup>0&&prefs.on&&solo()&&eligible(e)){const k=kindFor(e.name),p=P(),a=Number.isFinite(e.rangedAim)?e.rangedAim:Math.atan2(p.y-e.y,p.x-e.x),d=Math.hypot(p.x-e.x,p.y-e.y);drawTele(c,e,k,1-e.rangedWindup/.55,{a,x:e.x+Math.cos(a)*d,y:e.y+Math.sin(a)*d});}}
 drawLive(c,now);}
/* enemy·pxfSide: R350 영웅 가림 옅게(영웅 상자를 덮는 '영웅 쪽' 이펙트를 85%까지 옅게)가 적 공격을 빼도록 — 안 달면 영웅 위·발밑에 닿는 그림자 손·암흑 구체·공포 표식이 사라졌다(헤드리스 실측) */
const SENT={type:'r1210-fx',x:0,y:0,age:0,life:Infinity,enemy:true,pxfSide:'enemy'};
/* R1214: 스토리 지역 3D 기록기는 효과 명령의 깊이를 효과의 월드 자리(fx.x,y)로 정한다 → 표지를 (0,0)에 두면 바닥·벽 뒤로 묻힌다. 영웅 앞쪽에 둔다 */
function place(){try{const p=P();if(p){SENT.x=p.x+.6;SENT.y=p.y+.6;}}catch(_){}}
function arm(){place();try{const fx=G('effects');if(Array.isArray(fx)&&!fx.includes(SENT)){SENT.age=0;fx.push(SENT);}}catch(_){}}
const DE=G('drawEffect');if(typeof DE==='function'){const base=DE;try{Function('f','drawEffect=f')(function(fx,...a){if(fx&&fx.type==='r1210-fx'){try{if(prefs.on)drawFx();}catch(err){fail(err);}return;}return base.apply(this,[fx,...a]);});}catch(err){fail(err);}}
const TK=G('tick');if(typeof TK==='function'){const base=TK;try{Function('f','tick=f')(function(...a){const r=base.apply(this,a);try{step();const room=G('room');if(prefs.on&&(live.length||room?.enemies?.some(e=>e?.r1210?.mode||(e?.rangedWindup>0&&kindFor(e.name)))))arm();}catch(err){fail(err);}return r;});}catch(err){fail(err);}}
// 겨누기·쏘기 동안 몸 그림은 공격 자세(R286 과 같은 방식: 그릴 때만 가짜 attack, 판정은 그대로)
const DEN=G('drawEnemy');if(typeof DEN==='function'){const base=DEN;try{Function('f','drawEnemy=f')(function(e,...a){let saved=null;
 try{const s=e?.r1210;if(prefs.on&&s&&!s.boss&&(s.mode==='windup'||s.mode==='fire')&&!e.attack&&e.hp>0){const sh=e.combatProfile?.attackShape||{},w=Math.max(.05,Number(sh.windup)||.3),act=Math.max(.05,Number(sh.active)||.12),age=Math.max(0,T()-s.t0);
  const el=s.mode==='windup'?Math.min(.98,age/Math.max(.05,s.windup))*w:w+Math.min(.98,age/FIRE_HOLD)*act;saved={attack:e.attack,moving:e.moving};
  e.attack={elapsed:el,angle:s.aim?.a??0,committed:s.mode==='fire',struckQuality:true,id:-1210,shape154:sh,origin154:{x:e.x,y:e.y},r1210Fake:true};e.moving=false;}}catch(err){fail(err);saved=null;}
 try{return base.apply(this,[e,...a]);}finally{if(saved){e.attack=saved.attack;e.moving=saved.moving;}}});}catch(err){fail(err);}}
// 방을 옮기면 남은 공격을 지운다
/* 사몽 각성 감속(R75): 느려진 몹은 겨누기·쿨다운·날아가는 공격도 같이 늦춘다(Codex 리뷰 PR 841) */
try{(window.__STORYWORLD_ENEMY_CLOCKS_R75__??=[]).push((e,shift)=>{const s=e?.r1210;if(s)shift(s,['t0','next']);for(const x of live)if(x.owner===e.id)shift(x,['t0']);});}catch(err){fail(err);}
let lastRoom=null;if(typeof setInterval==="function")setInterval(()=>{try{const r=G('room');if(r!==lastRoom){/* 떠난 방의 겨누기도 취소 — 돌아왔을 때 예고 없이 쏘지 않게 */for(const e of lastRoom?.enemies||[])if(e?.r1210){e.r1210.mode=null;}lastRoom=r;live=[];}}catch(_){}},500);
function set(v){prefs={...prefs,...(v&&typeof v==='object'?v:{on:v!==false})};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}if(!prefs.on){live=[];for(const e of G('room')?.enemies||[])if(e?.r1210)e.r1210.mode=null;}return {...prefs};}
window.__STORYWORLD_DYS_RANGED_R1210__=Object.freeze({revision:REV,set,kindFor,eligible,bossEligible,mapKinds,scaled,bossScale:BOSS.scale,boss:BOSS,laserHits,waveHits,poolHits,bossK,hueOf,tune:TUNE,names:NAMES,maxLive:MAXLIVE,firstDelay:FIRST,
 /* 장면 확인용: 영웅 앞에 그 종류 공격을 하나 띄운다(피해 없음) */demo:(kind,dx=3,dy=-1)=>{try{const p=P();if(!TUNE[kind]||!p)return false;const u=TUNE[kind],ox=p.x+dx,oy=p.y+dy,a=Math.atan2(p.y-oy,p.x-ox),now=T();live.push({kind,owner:'demo',scale:1,u,ox,oy,a,t0:now,dmg:0,src:{r1210:kind},hue:0,tx:p.x,ty:p.y,life:(u.flight||u.delay||.3)+(u.pool||u.blast||u.rise||u.impact||u.life||.5)+1,hit:false,ticks:0,lastTick:-9,end:null,px:p.x,py:p.y});arm();return true;}catch(err){fail(err);return false;}},
 roleFor,effRole,lean:LEAN,melee:MELEE,keep:KEEP,rangedCd:RANGED_CD,
 /* R1227: R248 근접 타격 도형(선·불꽃) 대신 Dots 불 시트 타격 자국 — 불 계열 근접 몹만. 처리했으면 true(R248 은 자기 도형을 안 그림) */
 contactFx:(e,tx,ty)=>{try{if(!prefs.on||!e||fixedFoe(e)||kindFor(e.name)!=='fire'||effRole(e)!=='melee'||banned())return false;if(live.filter(x=>x.kind==='mhit').length>=6)return false;
  live.push({kind:'mhit',owner:e.id,scale:1,u:null,ox:e.x,oy:e.y,a:0,t0:T(),dmg:0,src:null,hue:hueOf(e.name),tx,ty,life:.6});stats.contact++;warm();arm();return true;}catch(err){fail(err);return false;}},inspect:()=>({revision:REV,roleStats:{...roleStats},prefs:{...prefs},stats:JSON.parse(JSON.stringify(stats)),live:live.length,liveDetail:live.map(x=>({kind:x.kind,owner:x.owner,scale:x.scale})),log:log.slice(-30),lastError})});
})();
