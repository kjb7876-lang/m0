// R450 지역 날씨·공기 입자 — 사용자 2026-11-09 참고 그림 6장 "이런 느낌들 거의 유사하게" → 4번 '날씨와 파티클(비·먼지·불꽃이 공기감)'.
//  다른 게임 그림·코드는 쓰지 않는다(원리만: 가는 빗줄기 + 바닥 물튐, 바람에 날리는 눈, 빛 둘레에서만 보이는 먼지).
//  · 지역마다 정본 문장에 근거가 있는 날씨만 고른다(KIND 표의 why = story-source/hapil-canon-r106-improved.txt 문장).
//      비: 사몽 '빗속' 두 구역 · 이슬비: 중립 지역의 재각성("젖은 풀숲에서 눈을 떴다")
//      눈보라: 눈보라 속의 소년 · 생체 부트로더(설원·눈보라), 눈: 사몽 '눈 내리는 골목'·'눈밭' 구역
//      재: 불길이 솟는 1부 잿빛 지역·검은 공방("잿더미") · 먼지: 실내(병원·집)·동굴 — 단 '금이 간 안경'은 "먼지 한 톨 없었다" 그대로 끈다.
//  · 비·눈·재는 하늘이 없는 곳(실내·동굴·기억 공간 — PLACE 표)에서는 절대 내리지 않는다. 먼지는 빛(R451 광원 또는 R92·R91·소품 등불) 둘레에서만 반짝인다.
//  · 그리기: 한 지역에 한 종류만, 3D 장면에 2~3 draw(빗줄기 1 + 물튐 1, 또는 눈송이 1 + 눈보라 줄기 1). 위치는 셰이더가 시간·씨앗으로 계산해
//    매 장면 버퍼를 다시 올리지 않는다(uniform 만 바꿈). 모바일은 개수 절반, 가벼운 화면(lowFx)은 1/3·물튐·먼지 없음, 움직임 줄이기는 내리는 입자 끔.
//  · R300 의 떠도는 재·포자(motes)는 지역 성격에 맞게 색·양을 바꿔 준다(r300() 훅): 병원에 불티가 날리던 것 → 먼지, 늪 → 병든 황록 포자, 눈 지역 → 끔.
// 화면 표현만 바꾼다. 충돌·피해·저장·서사·맵 순서는 그대로. 게임 ctx.filter 는 쓰지 않는다(3D 장면 물체만).
(()=>{'use strict';
if(window.__STORYWORLD_WEATHER_R450__)return;
const REV='R450-weather-4',KEY='storyworld.r450.weather';
const DEFAULTS=Object.freeze({on:true,precip:true,splash:true,dust:true});
let prefs={...DEFAULTS};
try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s)for(const k in DEFAULTS)if(typeof s[k]==='boolean')prefs[k]=s[k];}catch(_){}
const stats={frames:0,kind:'none',drops:0,splashes:0,flakes:0,gusts:0,dust:0,lights:0,builds:0,errors:0};let lastError=null,disposed=false;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};

// ---- 지역 → 날씨(정본 근거) ----------------------------------------------------------------------------------
// why 는 정본 문장 일부. 근거가 없는 지역은 FAMILY 기본값(아주 옅은 공기 입자)만 쓴다 — 지어낸 비·눈은 넣지 않는다.
const ZONES=Object.freeze({
 ep1b06b:{kind:'blizzard',why:'인장이 빛나자 금고의 풍경이 걷히고 눈보라 치는 숲이 드러났다.'},
 ep1b09:{kind:'blizzard',why:'정신을 차리자 검은 태양 아래 설원이 펼쳐져 있었다. … 사이보그 개들이 눈보라를 헤치며 달려들었다.'},
 last304:{kind:'drizzle',why:'젖은 풀숲에서 눈을 떴다.'},
 last303:{kind:'mist',why:'안개 속에서 앳된 남자가 한약 한 잔을 내밀었다.'},
 last301:{kind:'storm',why:'균열 너머에는 폭풍에 휩싸인 성의 잔해와 검은 바다가 있었다.'},
 kair07:{kind:'ash',why:'멈춰 있던 시간과 실패한 시간이 모두 같은 잿더미로 바뀌는 것을 보았다.'},
 ep1b07:{kind:'ash',why:'분노의 귀는 불길 속에서 곰과 늑대, 용의 형상으로 변했다.'},
 dist03:{kind:'ash',why:'그 사이로 불길이 솟았고, 박쥐 날개와 황소의 뿔을 지닌 거대한 형상이 어른거렸다.'},
 dist05:{kind:'ash',why:'가까워질수록 일곱 기둥의 불빛이 짙어졌다. … 불길에 가려 온전한 형체는 보이지 않았다.'},
 dist06:{kind:'ash',why:'나는 불길 속으로 뛰어들어 발록의 가슴에 무기를 꽂았다.'},
 ep1a08:{kind:'dust',why:'눈을 뜨자 차가운 형광등과 소독약 냄새가 나를 맞았다.'},
 ep1b03:{kind:'none',why:'누나의 집에는 먼지 한 톨 없었다.'}
});
// 사몽 구역: 구역 제목(R115 자료)에 날씨 낱말이 있을 때만.
const SAMONG=[[/빗속|비 내리|빗길/,'rain'],[/눈 내리|눈밭|설원|눈보라/,'snow']];
// 근거 없는 지역의 기본(R81 지역 성격): 실내·동굴은 먼지, 그 밖은 R300 공기 입자만(색만 지역에 맞게).
const FAMILY_KIND={clinical:'dust',domestic:'dust',cave:'dust'};
// R300 떠도는 입자 색(지역 성격) — 색채 규칙(SKILL 9·10절): 불 = 따뜻한 재, 늪 = 부패 황록, 실내·돌 = 잿빛, 기계·신경 = 차가운 흰빛.
const MOTE={ash:{color:[1,.62,.32],rise:.35},forge:{color:[1,.6,.3],rise:.4},swamp:{color:[.62,.66,.24],rise:.16,k:.7},garden:{color:[.66,.64,.56],rise:.12,k:.6},
 cave:{color:[.6,.58,.56],rise:.1,k:.5},stone:{color:[.7,.66,.6],rise:.14,k:.6},coast:{color:[.62,.68,.72],rise:.12,k:.6},memory:{color:[.72,.64,.86],rise:.14,k:.6},
 neural:{color:[.62,.78,.9],rise:.14,k:.55}};

const SPEC=Object.freeze({
 rain:{precip:'rain',count:{pc:620,mobile:300},speed:15,len:1.3,width:1.7,wind:[1.8,.4],color:[.7,.78,.86],alpha:.5,splash:{pc:150,mobile:70},box:[54,10,54]},
 drizzle:{precip:'rain',count:{pc:300,mobile:150},speed:11,len:.8,width:1.3,wind:[.35,0],color:[.72,.78,.84],alpha:.34,splash:{pc:70,mobile:34},box:[54,9,54]},
 snow:{precip:'snow',count:{pc:900,mobile:420},speed:1.05,wind:[.45,-.3],sway:.55,size:[3.4,9.5],color:[.9,.93,.97],alpha:.9,box:[54,8,54]},
 blizzard:{precip:'snow',count:{pc:1300,mobile:600},speed:1.6,wind:[4.5,-3.0],sway:.9,size:[3,9],color:[.9,.93,.97],alpha:.9,box:[56,8,56],fog:{k:1.5,color:[.78,.82,.88]},
  gust:{count:{pc:260,mobile:120},speed:6,len:1.5,width:1.4,wind:[9.5,-6.5],color:[.86,.9,.95],alpha:.2}},
 ash:{precip:'ash',count:{pc:420,mobile:200},speed:.55,wind:[.3,-.12],sway:.7,size:[3.6,8],color:[.58,.55,.52],alpha:.78,box:[54,8,54]},
 dust:{dust:true,count:{pc:420,mobile:200},size:[1.4,2.8],color:[1,.94,.84],alpha:.07,lit:.62,box:[40,4.5,40]},
 storm:{precip:'rain',count:{pc:760,mobile:360},speed:17,len:1.55,width:1.8,wind:[3.6,1.1],color:[.68,.75,.84],alpha:.52,splash:{pc:160,mobile:80},box:[54,10,54],fog:{k:1.3,color:[.46,.5,.56]}},
 mist:{fog:{k:2.1,color:[.56,.58,.56]}},
 none:{}
});

// ---- 환경 ----------------------------------------------------------------------------------------------------
function mobile(){try{const m=window.__STORYWORLD_MOBILE_R63__;if(typeof m?.isMobile==='function')return !!m.isMobile();}catch(_){}
 try{return typeof matchMedia==='function'&&matchMedia('(pointer:coarse)').matches;}catch(_){return false;}}
const tier=()=>mobile()?'mobile':'pc';
const lowFx=()=>!!(typeof settings!=='undefined'&&settings?.lowFx);
const reduced=()=>!!(typeof settings!=='undefined'&&settings?.reducedMotion);
function familyOf(r){try{const L=r?.exploration;return L?.surface?.art?.r81Environment||L?.worldWardR81?.environment?.family||window.__STORYWORLD_ENVIRONMENT_R81__?.specs?.[r?.id]?.family||(r?.id==='ep1a08'?'clinical':'regional');}catch(_){return 'regional';}}
// 사몽 방의 room.id 는 그 에피소드가 빌린 본편 지역 id 다(samong-r103 id=ep.host) → 구역을 못 찾으면 본편 표(PLACE)·정본 날씨(ZONES)로 잘못 떨어진다.
//  R115 표(zone() — S-02 시범 구역·R162/R173 이 장마다 덧붙인 B·D·G 구역까지) → 자료 파일 → 그래도 없으면 이름만(사몽 구역으로는 다룸). R103 사몽 방도 사몽.
function samongZone(r){const L=r?.exploration,z=L?.samongR115?.zone;if(!z)return L?.samongR103?{id:'samong-r103',title:''}:null;
 try{const q=window.__STORYWORLD_SAMONG_ZONES_R115__?.zone?.(z);if(q)return q;}catch(_){}
 try{const d=window.__STORYWORLD_SAMONG_ZONES_R115_DATA__;for(const zs of Object.values(d?.chapters||{}))for(const q of zs||[])if(q?.id===z)return q;}catch(_){}return{id:String(z),title:''};}
// ---- 실내·실외(사용자 2026-11-09 "실내 실외구분도 잘해야해") ---------------------------------------------------------------
// 본편 63곳을 정본 장면 문장·지역 이름·지도 양식(sourceEnvironmentKey)으로 하나씩 가렸다. R406 indoorOf 는 worldR74.mode 만 봐서
//  병원(ep1a08)·미카엘라 쉼터 셋·흑장미단 성당 등이 '바깥'으로 잡혔다 → 날씨(R450)·조명(R451)·길가 장식(R452)은 이 표를 쓴다(사몽 구역은 R406 판정 그대로).
//  out 바깥(하늘 아래: 날씨·달빛·풀) · in 건물 안(비·눈 없음, 불꽃 대신 전구, 풀 없음) · cave 동굴(하늘 없음, 횃불은 그대로, 돌·이끼만) · void 기억·신경 공간(날씨·풀 없음)
const PLACE=Object.freeze({
 hub:['out','악마가 점령한 세계 · 둥근 정원'],dist00:['out','악마화 나무의 정원'],dist01:['cave','거미동굴 — 천장'],dist02:['out','검은 늪지대 — 하늘'],
 dist03:['out','무너진 성 · 무너진 대로'],dist04:['out','시체들이 되살아난 밤 · 묘지'],dist05:['out','일곱 기둥 순례길'],dist06:['out','지옥의 소환진 — 하늘'],
 ep1a08:['in','피로 물든 병원 — 복도·병실·형광등'],ep1a09:['in','주사실'],ep1a09b:['out','과거 궁전 안뜰'],ep1a10:['out','중독의 도시 — 거리·달빛·폐허'],
 ep1a11:['in','천사의 가면 — 진료소 복도·창문·침대'],dreamRest:['in','쉼터 — 예배당 지하'],ep1b01:['in','솔로몬의 봉인식 — 예배당'],ep1b02:['in','나태의 집'],
 ep1b03:['in','누나의 집'],ep1b04:['in','탐식의 주방'],ep1b05:['in','붉은 하이힐 무대'],ep1b06b:['out','눈보라 치는 숲'],ep1b07:['in','불타는 호텔 계단'],
 ep1b08:['in','교만의 성당'],ep1b09:['out','검은 태양 아래 설원'],restEp1b:['in','사라진 귀환자의 쉼터'],u201:['out','방어의 군단 — 찢어진 땅'],
 u202:['out','잔인한 구원 — 높아지는 기계 성벽'],u204:['void','첫 번째 기억의 문'],u205:['in','관리자 권한 방'],u206:['in','중앙 코어 이주실'],u203:['void','기억의 문'],
 restU2:['in','미카엘라의 쉼터'],last304:['out','중립 지역 — 들판·숲'],last305:['out','고블린 피리숲'],last301:['out','폭풍에 휩싸인 성의 잔해와 검은 바다'],
 last302:['out','잠들지 못하는 항구 마을'],last303:['out','불면귀의 검은 안개'],restLast3:['in','쉼터 — 멈춘 벽시계'],kair01:['in','카이로스 아카데미움'],
 kair04:['out','수문장 폐허 광장'],kair05:['out','시간의 숲'],kair06:['out','오염된 수로 — 폐허와 시간의 숲'],kair07:['in','검은 공방'],kair08:['void','뉴런 게이트'],
 kair09:['out','망각의 묘지'],kair10:['out','붕괴 의식장 — 검은 모래 기둥'],kair02:['in','아르벨리아 봉인 회랑'],kair03:['in','세이렌의 시간 코어'],
 restKairo:['out','재작성된 최초명령 정원'],hando01:['out','소환된 성벽'],hando02:['out','무너진 에고 성채 성벽'],hando03:['in','주인의 권한 회랑'],
 restHando:['in','쉼터 — 입단 기록'],murder01:['out','비 그친 교차로'],murder02:['in','새빛호텔 계단'],murder04:['in','청록빌라 계단'],murder03:['out','순환의 옥상'],
 cult01:['in','흑장미단 관문 성당'],cult02:['in','뉴런 합창실'],cult05:['in','융합 제단 배양조'],cult06:['in','초자아 기계 법정'],cult03:['in','삼중 에고 추출실'],
 cult04:['in','교주의 옥좌'],village:['out','완료된 꿈의 마을 광장']});
// 불타는 호텔은 실내지만 정본이 불길 속이라 재·불티는 그대로 날린다.
const INDOOR_ASH=new Set(['ep1b07']);
// 검은 공방(kair07)은 실내라 재는 내리지 않지만, 화덕이 정본 불길(R451 도 불꽃을 그대로 두는 곳)이라 R300 화덕 불티(오르는 불씨)는 남긴다
//  — 정본 재('같은 잿더미로')를 실내 규칙이 '없음'으로 바꾼 것을 "먼지 한 톨 없었다"(ep1b03)와 같이 읽어 불티까지 꺼지던 것(독립 심사 지적, main 에는 불티가 있었다).
const EMBER_IN=new Set(['kair07']);
function placeOf(r){if(!r)return{kind:'out',why:'',source:'none'};const sz=samongZone(r);
 if(!sz&&PLACE[r.id])return{kind:PLACE[r.id][0],why:PLACE[r.id][1],source:'table'};
 let ind=false;try{const f=window.__STORYWORLD_PROPS_PLACE_R406__?.indoorOf;if(typeof f==='function')ind=!!f(r);else ind=r?.exploration?.worldR74?.mode==='indoor';}catch(_){}
 return{kind:ind?'in':'out',why:sz?'사몽 구역 「'+(sz.title||sz.id)+'」':'',source:sz?'samong-r406':'r406'};}
const PRECIP=new Set(['rain','drizzle','snow','blizzard','ash']);
const pickCache=new WeakMap();
// 지금 방의 날씨 { kind, why, source, indoor, family }
function pick(r){if(!r)return{kind:'none',why:'',source:'none'};const L=r.exploration;let c=pickCache.get(r);if(c&&c.L===L)return c.v;
 const fam=familyOf(r),pl=placeOf(r),ind=pl.kind!=='out',sz=samongZone(r);let kind='none',why='',source='family';
 if(sz){const t=String(sz.title||'');for(const[re,k]of SAMONG)if(re.test(t)){kind=k;why='사몽 구역 「'+t+'」';source='samong-title';break;}}
 else if(ZONES[r.id]){kind=ZONES[r.id].kind;why=ZONES[r.id].why;source='canon';}
 if(kind==='none'&&source==='family'&&FAMILY_KIND[fam]&&pl.kind!=='out')kind=FAMILY_KIND[fam];   // 바깥(사몽 정원·거리 등 병원·집 양식이라도)은 먼지 대신 R300 입자 그대로
 if(ind&&PRECIP.has(kind)&&!(kind==='ash'&&INDOOR_ASH.has(r.id))){kind=kind==='ash'||pl.kind==='void'?'none':'dust';why=(why?why+' — ':'')+'하늘이 없는 곳('+pl.why+')이라 내리는 입자 대신 '+(kind==='dust'?'먼지':'없음');}
 if(source==='family'&&kind==='none'&&(pl.kind==='in'||pl.kind==='cave'))kind='dust';
 const v={kind,why,source,indoor:ind,place:pl.kind,placeWhy:pl.why,family:fam,zone:sz?.id||r.id};pickCache.set(r,{L,v});return v;}

// ---- 빛 자리(먼지·빗줄기가 빛 둘레에서 반짝이게) — R451 이 있으면 그 광원, 없으면 R92·R91 등불과 소품 불빛 ----------------
function lightsNear(r,x,y,cap){let list=[];
 try{const R=window.__STORYWORLD_LOCAL_LIGHT_R451__;if(R?.lights){list=R.lights()||[];}}catch(e){fail(e);}
 if(!list.length){try{for(const p of window.__STORYWORLD_VISUAL_R92__?.lightPoints?.()||[])list.push({x:p.x,y:p.y,r:4.2,color:p.color||[1,.74,.45]});
  for(const p of window.__STORYWORLD_VISUAL_R91__?.lightPoints?.()||[])list.push({x:p.x,y:p.y,r:3.6,color:[1,.66,.38]});
  const A=window.__STORYWORLD_LIGHT_ATMOS_R300__;if(A?.isLight)for(const p of r.props||[])if(A.isLight(p)&&Number.isFinite(p.x+p.y))list.push({x:p.x,y:p.y,r:3.6,color:[1,.66,.38]});}catch(e){fail(e);}}
 return list.map(l=>[l,(l.x-x)**2+(l.y-y)**2]).sort((a,b)=>a[1]-b[1]).slice(0,cap).map(a=>a[0]);}

// ---- 셰이더 -------------------------------------------------------------------------------------------------
const NL=8;
const LIGHT_GLSL='uniform vec4 lts['+NL+'];uniform vec3 ltc['+NL+'];uniform int ltn;'+
 'vec3 litAt(vec2 p){vec3 s=vec3(0.);for(int i=0;i<'+NL+';i++){if(i>=ltn)break;float d=length(p-lts[i].xy)/max(.1,lts[i].z);s+=ltc[i]*lts[i].w*(1.-smoothstep(0.,1.,d));}return s;}';
// 빗줄기(눈보라 줄기도 같은 것): 사각형 하나 = 빗방울 하나. 머리·꼬리를 투영해 화면에서 폭(px)만큼 넓힌다.
// 화면에서 꼬리(위)→머리(아래) 순서라 감는 방향이 뒤집힌다 → 양면(DoubleSide)으로 그려야 뒷면 버리기에 안 걸린다(물튐 고리도 바닥에 누워 같은 까닭).
const STREAK_VS=LIGHT_GLSL+
 'attribute vec4 seed;uniform float t;uniform vec3 center;uniform vec3 box;uniform float speed;uniform vec2 wind;uniform float len;uniform float widthPx;uniform vec2 res;uniform float alpha;uniform float lit;'+
 'varying float vA;varying vec2 vQ;varying vec3 vL;'+
 'void main(){float sp=speed*(.82+.36*seed.w);float fall=box.y/sp;float u=t/fall+seed.y;float ph=fract(u);float k=floor(u);'+
 'vec2 j=fract(vec2(seed.x+k*.6180339,seed.z+k*.7548776));vec3 lo=center-box*.5;'+
 'vec2 xz=mod(j*box.xz+wind*(ph*fall)-lo.xz,box.xz)+lo.xz;'+
 'vec3 head=vec3(xz.x,box.y*(1.-ph),xz.y);vec3 v=normalize(vec3(wind.x,-sp,wind.y));vec3 tail=head-v*len*(.75+.5*seed.w);'+
 'vec4 c0=projectionMatrix*viewMatrix*vec4(head,1.);vec4 c1=projectionMatrix*viewMatrix*vec4(tail,1.);'+
 'vec2 s0=c0.xy/c0.w*res*.5,s1=c1.xy/c1.w*res*.5;vec2 d=s0-s1;float l=length(d);vec2 n=l>1e-3?vec2(-d.y,d.x)/l:vec2(1.,0.);'+
 'vec4 c=mix(c1,c0,position.y);c.xy+=n*position.x*widthPx/res*c.w;'+
 'float edge=1.-smoothstep(.72,1.,length((xz-center.xz)/(box.xz*.5)));'+
 'vA=alpha*(.55+.45*seed.w)*smoothstep(0.,.06,ph)*edge;vQ=position.xy;vL=litAt(xz)*lit;gl_Position=c;}';
const STREAK_FS='uniform vec3 color;varying float vA;varying vec2 vQ;varying vec3 vL;'+
 'void main(){float a=vA*(1.-smoothstep(.45,1.,abs(vQ.x)))*(.2+.8*vQ.y);gl_FragColor=vec4(color+vL,a);}';
// 물튐: 바닥에 누운 사각형(고리). 빗방울과 같은 씨앗·주기라 떨어진 자리·때에 맞춰 퍼진다. 바닥 칸이 아니면(벽 위·허공) 숨긴다.
const SPLASH_VS=LIGHT_GLSL+
 'attribute vec4 seed;uniform float t;uniform vec3 center;uniform vec3 box;uniform float speed;uniform vec2 wind;uniform float alpha;uniform float lit;'+
 'uniform sampler2D floorMap;uniform vec4 floorBox;varying float vA;varying vec2 vQ;varying float vT;varying vec3 vL;'+
 'void main(){float sp=speed*(.82+.36*seed.w);float fall=box.y/sp;float u=t/fall+seed.y;float ph=fract(u);float k=floor(u)-1.;'+
 'vec2 j=fract(vec2(seed.x+k*.6180339,seed.z+k*.7548776));vec3 lo=center-box*.5;vec2 xz=mod(j*box.xz+wind*fall-lo.xz,box.xz)+lo.xz;'+
 'float tau=ph*fall;float life=.34;vT=clamp(tau/life,0.,1.);'+
 'vec2 fuv=(xz-floorBox.xy)/floorBox.zw;float onFloor=(fuv.x<0.||fuv.y<0.||fuv.x>1.||fuv.y>1.)?0.:texture2D(floorMap,fuv).r;'+
 'float rad=mix(.06,.34,sqrt(vT))*(.7+.5*seed.w);vec3 p=vec3(xz.x+position.x*rad,.025,xz.y+position.y*rad);'+
 'float edge=1.-smoothstep(.62,.95,length((xz-center.xz)/(box.xz*.5)));'+
 'vA=alpha*(1.-vT)*step(tau,life)*onFloor*edge;vQ=position.xy;vL=litAt(xz)*lit;gl_Position=projectionMatrix*viewMatrix*vec4(p,1.);}';
const SPLASH_FS='uniform vec3 color;varying float vA;varying vec2 vQ;varying float vT;varying vec3 vL;'+
 'void main(){float d=length(vQ);float w=mix(.18,.07,vT);float ring=smoothstep(1.-w*2.,1.-w,d)*(1.-smoothstep(1.-w,1.,d));float dot=(1.-smoothstep(0.,.32,d))*(1.-smoothstep(0.,.3,vT));'+
 'float a=vA*max(ring,dot*.9);if(a<.003)discard;gl_FragColor=vec4(color+vL,a);}';
// 눈송이·재·먼지: 점. 눈 = 흔들리며 바람 따라, 재 = 뒤집히며(크기 깜빡) 천천히, 먼지 = 거의 제자리에서 맴돌고 빛 둘레에서만 보임.
const FLAKE_VS=LIGHT_GLSL+
 'attribute vec4 seed;uniform float t;uniform vec3 center;uniform vec3 box;uniform float speed;uniform vec2 wind;uniform float sway;uniform vec2 size;uniform float px;uniform float alpha;uniform float lit;uniform float mode;'+
 'varying float vA;varying vec3 vL;'+
 'void main(){vec3 lo=center-box*.5;float sp=speed*(.7+.6*seed.w);'+
 'float y=mod(seed.y*box.y-t*sp,box.y);'+
 'vec2 sw=vec2(sin(t*(.6+seed.w)+seed.x*6.283),cos(t*(.5+seed.z)+seed.z*6.283))*sway*(.5+seed.w);'+
 'vec2 xz=mod(seed.xz*box.xz+wind*t*(.75+.5*seed.w)+sw-lo.xz,box.xz)+lo.xz;'+
 'vec3 p=vec3(xz.x,y,xz.y);float s=mix(size.x,size.y,seed.w*seed.w);'+
 'if(mode>1.5){s*=.35+.65*abs(sin(t*(1.3+seed.x*2.)+seed.z*9.));}'+
 'float edge=1.-smoothstep(.7,1.,length((xz-center.xz)/(box.xz*.5)));'+
 'float fade=smoothstep(0.,.6,y)*(1.-smoothstep(box.y*.8,box.y,y));'+
 'vec3 L=litAt(xz);float l=max(L.r,max(L.g,L.b));'+
 'vA=alpha*edge*fade*(.55+.45*fract(seed.x*13.7+seed.z*7.1));'+
 'if(mode>2.5){vA=edge*fade*(alpha+lit*l)*(.35+.65*fract(seed.x*13.7+seed.z*7.1));vL=L/max(.001,l)*min(1.,l*1.4);}else vL=L*lit;'+
 'gl_PointSize=s*px;gl_Position=projectionMatrix*viewMatrix*vec4(p,1.);}';
const FLAKE_FS='uniform vec3 color;uniform float mode;varying float vA;varying vec3 vL;'+
 'void main(){vec2 q=gl_PointCoord-.5;float d=length(q);float a=vA*(1.-smoothstep(mode>1.5&&mode<2.5?.22:.12,.5,d));if(a<.003)discard;'+
 'vec3 c=mode>2.5?mix(color,vL,.6):color+vL;if(mode<1.5)c*=.8+.28*clamp(.5-(q.x+q.y)*1.6,0.,1.);gl_FragColor=vec4(c,a);}';

// ---- 3D 물체 ------------------------------------------------------------------------------------------------
function rng(seed){let s=seed>>>0||1;return()=>{s=(s*16807)%2147483647;return s/2147483647;};}
function seeds(n,seed){const a=new Float32Array(n*4),r=rng(seed);for(let i=0;i<a.length;i++)a[i]=r();return a;}
function lightUniforms(T){return{lts:{value:Array.from({length:NL},()=>new T.Vector4())},ltc:{value:Array.from({length:NL},()=>new T.Vector3())},ltn:{value:0}};}
function quadGeo(T,n,seedV,flat){const g=new T.InstancedBufferGeometry();
 const pos=flat?new Float32Array([-1,-1,0, 1,-1,0, 1,1,0, -1,1,0]):new Float32Array([-1,0,0, 1,0,0, 1,1,0, -1,1,0]);
 g.setAttribute('position',new T.BufferAttribute(pos,3));g.setIndex([0,1,2,0,2,3]);g.setAttribute('seed',new T.InstancedBufferAttribute(seeds(n,seedV),4));g.instanceCount=0;
 g.boundingSphere=new T.Sphere(new T.Vector3(),1e6);return g;}
function pointGeo(T,n,seedV){const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(new Float32Array(n*3),3));g.setAttribute('seed',new T.BufferAttribute(seeds(n,seedV),4));
 g.boundingSphere=new T.Sphere(new T.Vector3(),1e6);g.setDrawRange(0,0);return g;}
const MAXN={streak:1400,splash:160,flake:1400,gust:280,dust:440};
function build(r){if(r.__r450)return r.__r450;const T=r.T,o={T};
 const base=()=>({t:{value:0},center:{value:new T.Vector3()},box:{value:new T.Vector3(50,9,50)},speed:{value:10},wind:{value:new T.Vector2()},alpha:{value:.4},lit:{value:0},color:{value:new T.Color(1,1,1)},...lightUniforms(T)});
 const streak=(name,order,max)=>{const m=new T.Mesh(quadGeo(T,max,name==='r450-gust'?0x450b:0x450a,false),new T.ShaderMaterial({uniforms:{...base(),len:{value:1},widthPx:{value:1.2},res:{value:new T.Vector2(1280,720)}},
  vertexShader:STREAK_VS,fragmentShader:STREAK_FS,transparent:true,depthWrite:false,depthTest:true,toneMapped:false,side:T.DoubleSide}));m.name=name;m.renderOrder=order;m.frustumCulled=false;m.layers.set(3);return m;};
 o.rain=streak('r450-rain',9000,MAXN.streak);o.gust=streak('r450-gust',9002,MAXN.gust);
 o.splash=new T.Mesh(quadGeo(T,MAXN.splash,0x450a,true),new T.ShaderMaterial({uniforms:{...base(),floorMap:{value:null},floorBox:{value:new T.Vector4(0,0,1,1)}},
  vertexShader:SPLASH_VS,fragmentShader:SPLASH_FS,transparent:true,depthWrite:false,depthTest:true,toneMapped:false,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4}));
 /* 물튐 고리는 바닥(XZ)에 눕힌다: 정점 xy → 세계 xz (셰이더에서 position.x·position.y 를 바닥 평면에 펼침) */
 o.splash.name='r450-splash';o.splash.renderOrder=-15;o.splash.frustumCulled=false;o.splash.layers.set(2);
 const flake=(name,order,max,sd)=>{const m=new T.Points(pointGeo(T,max,sd),new T.ShaderMaterial({uniforms:{...base(),sway:{value:.5},size:{value:new T.Vector2(2,5)},px:{value:1},mode:{value:1}},
  vertexShader:FLAKE_VS,fragmentShader:FLAKE_FS,transparent:true,depthWrite:false,depthTest:true,toneMapped:false}));m.name=name;m.renderOrder=order;m.frustumCulled=false;m.layers.set(3);return m;};
 o.flake=flake('r450-flake',9001,MAXN.flake,0x450c);o.dust=flake('r450-dust',8990,MAXN.dust,0x450d);
 o.all=[o.rain,o.gust,o.splash,o.flake,o.dust];
 for(const m of o.all){m.visible=false;m.userData={presentationOnly:true,collisionChanged:false,r450:true};}
 o.floorKey=null;o.floorTex=null;o.lightAt=-1;o.lightList=[];stats.builds++;r.__r450=o;return o;}
function attach(r,o){for(const m of o.all)if(m.parent!==r.scene)r.scene.add(m);}
function hideAll(o){if(!o)return;for(const m of o.all)m.visible=false;}
// 바닥 칸 그림(1칸 = 1텍셀): 물튐이 벽 윗면·허공에 생기지 않게. 지역(레이아웃)이 바뀔 때만 다시 만든다.
function floorMap(o,r){const L=r.exploration,cells=L?.floorCells;if(!Array.isArray(cells)||!cells.length)return null;if(o.floorKey===cells)return o.floorBox;
 let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;for(const[a,b]of cells){if(a<x0)x0=a;if(b<y0)y0=b;if(a>x1)x1=a;if(b>y1)y1=b;}
 const w=Math.min(1024,x1-x0+1),h=Math.min(1024,y1-y0+1),data=new Uint8Array(w*h*4);for(const[a,b]of cells){const i=((b-y0)*w+(a-x0));if(i>=0&&i<w*h){data[i*4]=255;data[i*4+3]=255;}}
 const T=o.T;o.floorTex?.dispose?.();const tex=new T.DataTexture(data,w,h,T.RGBAFormat);tex.magFilter=T.NearestFilter;tex.minFilter=T.NearestFilter;tex.needsUpdate=true;
 o.floorTex=tex;o.floorKey=cells;o.floorBox=new T.Vector4(x0,y0,w,h);o.splash.material.uniforms.floorMap.value=tex;o.splash.material.uniforms.floorBox.value.copy(o.floorBox);return o.floorBox;}
function setLights(u,list,gain){for(let i=0;i<NL;i++){const l=list[i];if(!l){u.lts.value[i].set(0,0,1,0);continue;}const c=l.color||[1,.8,.6];u.lts.value[i].set(l.x,l.y,(l.r||4)*1.05,(l.k??1)*gain);u.ltc.value[i].set(c[0],c[1],c[2]);}
 u.ltn.value=Math.min(NL,list.length);}
function common(u,spec,t,cx,cz,box){u.t.value=t;u.center.value.set(cx,0,cz);u.box.value.set(box[0],box[1],box[2]);}

function update(r,frame){const o=r.__r450;if(!o)return;
 const live=!disposed&&prefs.on&&frame&&typeof room!=='undefined'&&room&&typeof player!=='undefined'&&player&&Number.isFinite(player.x+player.y)&&!(typeof storyScene!=='undefined'&&storyScene);
 if(!live){hideAll(o);stats.kind='none';return;}
 const w=pick(room),spec=SPEC[w.kind]||SPEC.none,t=performance.now()/1000,tr=tier(),lf=lowFx(),rm=reduced();stats.frames++;stats.kind=w.kind;
 const px=Math.min(2,r.renderer?.getPixelRatio?.()||1),cx=player.x,cz=player.y;
 if(t-o.lightAt>.4){o.lightAt=t;o.lightList=lightsNear(room,cx,cz,NL);}stats.lights=o.lightList.length;
 const size=r.renderer?.getDrawingBufferSize?.(o.res||(o.res=new o.T.Vector2()));
 let drops=0,spl=0,flakes=0,gusts=0,dust=0;
 // 비·이슬비
 if(spec.precip==='rain'&&prefs.precip&&!rm){const n=Math.round(spec.count[tr]*(lf?.34:1));const u=o.rain.material.uniforms;common(u,spec,t,cx,cz,spec.box);
  u.speed.value=spec.speed;u.wind.value.set(spec.wind[0],spec.wind[1]);u.len.value=spec.len;u.widthPx.value=Math.max(1.3,spec.width*px);if(size)u.res.value.copy(size);u.alpha.value=spec.alpha;u.color.value.setRGB(...spec.color);u.lit.value=.55;setLights(u,o.lightList,1);
  o.rain.geometry.instanceCount=Math.min(MAXN.streak,n);drops=o.rain.geometry.instanceCount;
  if(prefs.splash&&!lf&&floorMap(o,room)){const s=o.splash.material.uniforms;common(s,spec,t,cx,cz,spec.box);s.speed.value=spec.speed;s.wind.value.set(spec.wind[0],spec.wind[1]);s.alpha.value=spec.alpha*1.15;
   s.color.value.setRGB(...spec.color);s.lit.value=.5;setLights(s,o.lightList,1);
   /* 물튐은 앞쪽 빗방울과 같은 씨앗(앞 n개)이라 같은 자리·때에 떨어진다 */o.splash.geometry.instanceCount=Math.min(MAXN.splash,spec.splash[tr]);spl=o.splash.geometry.instanceCount;}}
 // 눈·눈보라·재
 if((spec.precip==='snow'||spec.precip==='ash')&&prefs.precip&&!rm){const n=Math.round(spec.count[tr]*(lf?.34:1));const u=o.flake.material.uniforms;common(u,spec,t,cx,cz,spec.box);
  u.speed.value=spec.speed;u.wind.value.set(spec.wind[0],spec.wind[1]);u.sway.value=spec.sway;u.size.value.set(spec.size[0],spec.size[1]);u.px.value=px;u.alpha.value=spec.alpha;u.color.value.setRGB(...spec.color);
  u.mode.value=spec.precip==='ash'?2:1;u.lit.value=spec.precip==='ash'?.35:.25;setLights(u,o.lightList,1);o.flake.geometry.setDrawRange(0,Math.min(MAXN.flake,n));flakes=Math.min(MAXN.flake,n);
  if(spec.gust&&!lf){const g=spec.gust,v=o.gust.material.uniforms;common(v,g,t,cx,cz,spec.box);v.speed.value=g.speed;v.wind.value.set(g.wind[0],g.wind[1]);v.len.value=g.len;v.widthPx.value=Math.max(1.2,g.width*px);if(size)v.res.value.copy(size);
   v.alpha.value=g.alpha;v.color.value.setRGB(...g.color);v.lit.value=.2;setLights(v,o.lightList,1);o.gust.geometry.instanceCount=Math.min(MAXN.gust,g.count[tr]);gusts=o.gust.geometry.instanceCount;}}
 // 먼지(빛 둘레에서만) — 움직임 줄이기에서는 멈춘 채로 보인다
 if(spec.dust&&prefs.dust&&!lf){const u=o.dust.material.uniforms;common(u,spec,rm?0:t,cx,cz,spec.box);u.speed.value=.06;u.wind.value.set(.05,.03);u.sway.value=.35;
  u.size.value.set(spec.size[0],spec.size[1]);u.px.value=px;u.alpha.value=spec.alpha;u.lit.value=spec.lit;u.color.value.setRGB(...spec.color);u.mode.value=3;setLights(u,o.lightList,1);
  o.dust.geometry.setDrawRange(0,Math.min(MAXN.dust,spec.count[tr]));dust=Math.min(MAXN.dust,spec.count[tr]);}
 o.rain.visible=drops>0;o.splash.visible=spl>0;o.flake.visible=flakes>0;o.gust.visible=gusts>0;o.dust.visible=dust>0;
 Object.assign(stats,{drops,splashes:spl,flakes,gusts,dust});
 attach(r,o);}

// ---- R300 떠도는 입자·안개 조절 훅 ---------------------------------------------------------------------------
// R300 update 가 부른다. 돌려주는 값: {motes:false | {color,rise,k}, fog:{k,color}} 또는 null(그대로).
function r300(r,samong){try{if(disposed||!prefs.on||!r)return null;const w=pick(r),spec=SPEC[w.kind]||{};const out={};
  if(spec.precip==='snow'||w.kind==='none'&&w.source==='canon'&&!EMBER_IN.has(r.id))out.motes=false;   // 눈 지역은 눈송이가, "먼지 한 톨 없었다"는 아무것도
  else if(spec.dust)out.motes=false;                                                       // 실내·동굴: R300 불티 대신 빛 둘레 먼지
  else if(!samong&&MOTE[w.family])out.motes=MOTE[w.family];
  if(spec.fog)out.fog=spec.fog;
  // R810 불면귀 밤: 깔린 안개 색만 바꾼다(양은 그대로). 마을은 남색 밤안개, 한약 구역(정본 '안개')은 불면귀의 검은 안개 쪽 먹빛 남보라.
  if(!samong&&(!r.layer||r.layer==='STORY')&&Object.prototype.hasOwnProperty.call(NIGHT_FOG_R810,r.id))out.fog={k:out.fog?.k??1,color:NIGHT_FOG_R810[r.id]};
  return out;}catch(e){fail(e);return null;}}
const NIGHT_FOG_R810=Object.freeze({last302:[.3,.37,.52],last303:[.32,.35,.5]});

// ---- 렌더러 감싸기(프로토타입 + 인스턴스, R300 과 같은 방식) ------------------------------------------------------
const wrappedTargets=new WeakSet();
function wrapFn(fn){const w=function(frame){try{if(!disposed&&this?.T&&this.scene&&this.__r450Frame!==frame){this.__r450Frame=frame;build(this);update(this,frame);}}catch(e){fail(e);}
  try{return fn.apply(this,arguments);}finally{if(this)this.__r450Frame=undefined;}};w.__r450=true;return w;}
function wrapOnce(target){if(!target||wrappedTargets.has(target)||typeof target.render!=='function')return;wrappedTargets.add(target);target.render=wrapFn(target.render);}
function wrapAll(){if(disposed)return;try{const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;const proto=r?Object.getPrototypeOf(r):window.StoryPhase1?.ThreeRenderer?.prototype;
 wrapOnce(proto);if(r&&Object.prototype.hasOwnProperty.call(r,'render'))wrapOnce(r);}catch(e){fail(e);}}
function disposeOn(r){try{const o=r?.__r450;if(!o)return;for(const m of o.all){m.parent?.remove(m);m.geometry.dispose();m.material.dispose();}o.floorTex?.dispose?.();r.__r450=null;}catch(_){}}
try{const C=window.StoryPhase1?.ThreeRenderer?.prototype,d=C?.dispose;if(d&&!d.__r450){C.dispose=function(...a){disposeOn(this);return d.apply(this,a);};C.dispose.__r450=true;}}catch(e){fail(e);}
const timer=typeof setInterval==='function'?setInterval(wrapAll,500):0;wrapAll();

// ---- 설정 ----------------------------------------------------------------------------------------------------
function save(){try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
function set(p={}){for(const k in DEFAULTS)if(typeof p[k]==='boolean')prefs[k]=p[k];save();return{...prefs};}
function settingsSection(){const panel=typeof document!=='undefined'&&document.getElementById('panel');if(!panel?.querySelector('#settingsClose')||document.getElementById('weatherR450'))return;
 const s=document.createElement('section');s.id='weatherR450';
 s.innerHTML='<h3>날씨·공기 입자 (R450)</h3><p class="small muted">정본에 비·눈보라·안개·잿더미가 나오는 지역에만 내립니다. 실내에서는 빛 둘레 먼지만 보입니다. 화면 표현만 바꿉니다.</p>'+
  [['on','날씨·공기 입자 전체'],['precip','비·눈·재 내리기'],['splash','빗방울 바닥 물튐'],['dust','빛 둘레 먼지']].map(([k,l])=>'<label><input type="checkbox" data-r450="'+k+'"> '+l+'</label>').join(' ');
 panel.appendChild(s);s.querySelectorAll('[data-r450]').forEach(el=>{el.checked=!!prefs[el.dataset.r450];el.onchange=()=>set({[el.dataset.r450]:el.checked});});}
if(typeof showSettings==='function'){const base=showSettings;showSettings=function(...a){const r=base.apply(this,a);try{if(!disposed)settingsSection();}catch(e){fail(e);}return r;};}

function dispose(){disposed=true;if(timer)clearInterval(timer);try{const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;disposeOn(r);}catch(_){}}
window.__STORYWORLD_WEATHER_R450__=Object.freeze({revision:REV,storageKey:KEY,zones:ZONES,spec:SPEC,budget:Object.freeze({...MAXN}),prefs:()=>({...prefs}),set,pick:r=>({...pick(r||(typeof room!=='undefined'?room:null))}),placeOf:r=>({...placeOf(r||(typeof room!=='undefined'?room:null))}),place:PLACE,r300,dispose,
 inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError,weather:typeof room!=='undefined'&&room?{...pick(room)}:null,collisionChanged:false,gameplayChanged:false,GPUVerified:false})});
})();
