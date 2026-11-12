// R790 서사 핵심 NPC 상호작용 — 사용자 2026-11-11 "서사마다 중요엔피시를 넣어서 상호작용해서 진행하는방식 너무많이는말고 중요포인트만,
//  특히 불면귀쪽은 귀비탕을 얻어야 불면귀 퇴치가 가능하도록유도".
//  첫 묶음 = 불면귀(last303 한약과 불면귀). 정본 35장 "안개 속에서 앳된 남자가 한약 한 잔을 내밀었다. 냄새를 맡자 귀비탕 계열의 안신 처방이 떠올랐다 …
//  약을 마시자 흐트러지던 정신이 가라앉았다. 달려들던 주민들도 멈춰 섰다." + 교단 약방의 기록 영상 "귀비탕을 달여 마신 수련생 · 악몽저항 · 그 안쪽의 어두운 핵이 드러난다고 하지요".
//  · 들판의 주민을 멈춰 세우면(R78 phase 'door') 보스 구역 문 앞 안개 속에서 앳된 남자가 약사발을 들고 나타난다.
//  · 그에게 말을 걸어(문 앞에서 눌러도 그가 먼저 사발을 내민다) 귀비탕을 받아 마셔야 보스 문의 기억(R78 doorStory = 정본 35장 앞부분)이 시작되고 불면귀가 나온다.
//  · 귀비탕 없이는 불면귀의 핵이 드러나지 않는다: 어떤 길로든 귀비탕 전에 불면귀를 쓰러뜨리려 하면 체력이 남고 이유를 알린다(핵 봉인).
//  · 대사·서사 글은 새로 짓지 않는다(본편 재집필 중지). 창 글은 장면 묘사와 영상의 기록 한 줄뿐이고, 이어지는 서사는 기존 doorStory 그대로.
//  · 길잡이·영화 모드는 창 없이 바로 받아 마신다(창이 뜨면 자동 진행이 멈춘다 — R272 MODAL-LOOP 와 같은 까닭).
//  · 옛 세이브: 이미 보스 단계·완료면 마신 것으로 본다. 무한 생존·협동·EGO 재방문·사몽 층·다른 지역은 건드리지 않는다.
//  · 그림: 그림 스레드가 ElevenLabs(seedream-5.5)로 만든 CX-0072NP 손질본(assets/r790/npc, 384칸·발 (192,352)·키 286). 한 장이라 숨쉬기만 코드로 얹는다.
//    Dots idle6·offer6 시트가 오면 그것으로 바꾼다(지금 것은 최종 시트가 아님).
//  판정·피해·보스 체력·생성 지점·R760 그림은 그대로. 다른 서사의 NPC 는 DEFS 에 한 줄씩 더한다(배치표 docs/story-npc-r790.md).
//  · R791 둘째 묶음 = 고블린 두목과 장미 인장(last305, 정본 32장 "싸움이 끝난 뒤, 패배한 두목을 통해 … 그가 남긴 장미 인장을 칼 가까이 가져가자 공명이 일었다").
//    보스(고블린 추장)를 쓰러뜨리면 쓰러진 자리(기억 제단 곁)에 패배한 두목이 서고, 장미 인장을 받아야 뒷이야기(제단의 서사·출구 문의 기억 = 정본 32장 뒷부분)가 시작된다. 그림은 이미 있는 보스 그림 그대로.
//    헤드리스 실측: 출구 단계에서는 길잡이(R101 wardStep)가 출구 문보다 먼저 제단(room.objective)에서 뒷이야기를 읽는다 → 출구 문만 막으면 인장 없이 서사가 먼저 나온다. 그래서 제단과 출구 문을 함께 건다.
//  · R792 셋째 묶음 = Dots 정식 시트. 앳된 남자는 CX-0072NP idle6(숨쉬기)·offer6(영웅이 다가오면 사발을 내밀고 멈춤)·흉상으로 바꾼다(ElevenLabs 대체 한 장은 더 쓰지 않음).
//    병원 1막 두 사람(CX-0073SN): ep1a10 의료진 '도움을 청한다' · ep1a11 의목사(침대 곁 의자) '이야기를 듣는다'. 둘 다 보스를 쓰러뜨린 뒤 제단 곁, 뒷이야기 앞. 처치 막기 없음.
//  · R793 = 서윤(ep1b05). 보스 문 옆에 서 있고 '허락을 구한다' 를 골라야 보스 문의 기억이 시작된다(처치 막기 없음). 한이경(murder04)은 온 그림이 정본과 달라(남자로 그려짐) 넣지 않았다.
//  · R794 = 한이경(murder04). 여자판 그림(CX-0073SN 04 r2)이 와서 보스 문 옆에 세운다. '사실을 밝히자고 전한다' 를 골라야 보스 문의 기억이 시작된다.
//  · R796 = 주고받는 한두 마디(사용자 2026-11-12 "서사대화할때 한두마디정도 주고받을 수 있는 2-3개 선택지 … 답변 잘못고르면 npc가 질책하면서 몹이 몇마리소환되고 다시 대화를 해야하는, 서사를 바꾸지는 말고").
//    인물이 한마디 건네고 답 셋 가운데 하나를 고른다. 맞는 답은 지금까지의 받기와 같다(서사·단계·세이브 그대로). 틀린 답이면 인물이 꾸짖고 그 지역 일반 몹 셋이 몰려오며, 물리친 뒤 다시 말을 걸어야 한다.
//    글은 정본 문장을 옮긴 것(틀린 답 = 정본 속 '나'의 옛 믿음·변명, 꾸짖음 = 정본에 적힌 사실). 갈래·결말은 늘지 않는다. 길잡이·영화 모드는 창 없이 맞는 답으로 지나간다.
//  끄기: localStorage['storyworld.r790.npc']='{"on":false}'. 점검: window.__STORYWORLD_NPC_R790__.inspect()
(()=>{'use strict';
if(window.__STORYWORLD_NPC_R790__)return;
const REV='R796-story-npc-talk-1',KEY='storyworld.r790.npc';
let prefs={on:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s==='object'&&typeof s.on==='boolean')prefs.on=s.on;}catch(_){}
const stats={placed:0,offers:0,taken:0,auto:0,sealed:0,draws:0,errors:0,wrong:0,summoned:0,busy:0,expired:0};let lastError=null;const events=[];
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const T=()=>typeof time==='number'&&Number.isFinite(time)?time:0;
const note=(kind,d={})=>{events.push({kind,at:+T().toFixed(2),...d});if(events.length>40)events.shift();};
// 지역마다 핵심 인물 하나. flag = 세이브에 남는 낱말, phase = 나타나고 관문이 걸리는 R78 단계('door' 보스 문 앞 · 'exit' 보스를 쓰러뜨린 뒤 출구 문 앞).
//  sprite = 한 칸 그림(칸 크기·발 기준점·보이는 키·영웅 키 대비 배율), bust = 창에 넣을 그림(없으면 sprite), seal = 받기 전에는 보스가 쓰러지지 않게.
const DEFS=Object.freeze({last303:Object.freeze({talk:Object.freeze({ask:'드십시오. 흐트러지던 정신이 가라앉을 겁니다.',wrong:Object.freeze([Object.freeze({at:0,t:'약은 필요 없다. 달려드는 주민부터 쓰러뜨린다',scold:'쓰러뜨리는 것만으로는 이 마을의 일을 멈출 수 없습니다.'}),Object.freeze({at:2,t:'사발을 밀어낸다',scold:'약 없이는 주민들이 다시 달려들 겁니다.'})])}),kind:'youth',flag:'gwibitang',phase:'door',
 sprite:Object.freeze({path:'assets/r790/npc/youth-idle6.webp',w:384,h:384,px:192,py:352,vis:284,scale:1.06,frames:6,fps:5,offer:Object.freeze({path:'assets/r790/npc/youth-offer6.webp',frames:6,fps:7})}),bust:'assets/r790/npc/youth-bust-d.webp',bustPos:'50% 30%',bustFit:'cover',name:'앳된 남자',label:'앳된 남자 · 한약 한 잔',sub:'안개 속 · 한약 한 잔',
 body:'김이 오르는 약사발을 두 손으로 내밀고 있다. 귀비탕 계열 안신 처방의 냄새가 난다.',lore:'교단 약방의 기록 — 귀비탕을 달여 마신 이에게는 악몽저항이 깃들고, 불면귀 안쪽의 어두운 핵이 드러난다.',
 take:'받아 마신다',wait:'아직',done:'귀비탕 · 악몽저항 — 흐트러지던 정신이 가라앉고, 불면귀의 핵이 드러날 수 있습니다.',toDoor:'보스 구역 문 앞에서 기억을 확인하세요.',
 hud:'안개 속 앳된 남자 · 한약 한 잔(귀비탕) 받기',seal:'핵이 드러나지 않습니다 · 귀비탕 없이는 불면귀를 쓰러뜨릴 수 없습니다.',
 boss:e=>String(e?.nativeId||'')==='l303-boss'||(!!e?.boss&&/^불면귀/.test(String(e?.name||'')))}),
 last305:Object.freeze({talk:Object.freeze({ask:'우리는 침략자가 아니다. 두 세계의 충돌을 피해 온 난민이다.',wrong:Object.freeze([Object.freeze({at:0,t:'침략자의 말은 듣지 않는다',scold:'우리도 터전을 잃었다. 듣지 않겠다면 숲이 답할 것이다.'}),Object.freeze({at:2,t:'인장을 빼앗는다',scold:'빼앗는 손에는 공명이 일지 않는다.'})])}),kind:'chief',flag:'roseSeal',phase:'exit',
 sprite:Object.freeze({path:'assets/r99/clean/assets/generated-v31224/actors-normalized/a43f2c5d3855_Monster_GoblinFluteKing.webp',w:672,h:384,px:300,py:361,vis:338,scale:1.45}),bust:'assets/r790/npc/chief-bust.webp',bustPos:'50% 50%',bustFit:'cover',labelBelow:true,
 name:'고블린 두목',label:'고블린 두목 · 장미 인장',sub:'패배한 두목 · 장미 인장',
 body:'싸움에서 진 두목이 장미 인장을 남긴다. 그는 환도가 무너진 성과 이어져 있음을 알고 있다.',lore:'장미 인장 — 칼 가까이 가져가면 공명이 일고, 무너진 성으로 가는 균열이 열린다.',
 take:'인장을 받는다',wait:'아직',done:'장미 인장 — 환도와 공명합니다.',toDoor:'출구 문 앞에서 기억을 확인하세요.',first:'패배한 두목에게서 장미 인장을 먼저 받으세요.',hud:'패배한 고블린 두목 · 장미 인장 받기',seal:null,boss:null}),
 // R792 병원 1막. 정본 10장 끝 "그래도 나는 의료진에게 도움을 청했다" · 11장 끝 "침대 옆에는 검은 성직복 위에 흰 가운을 걸친 남자가 앉아 있었다 … 그에게서 현세와 몽세, 내세에 관해 배웠다".
 ep1a10:Object.freeze({talk:Object.freeze({ask:'치료를 받으시겠습니까?',wrong:Object.freeze([Object.freeze({at:0,t:'마음만 먹으면 혼자 끊을 수 있다',scold:'그 믿음이 여기까지 데려온 겁니다.'}),Object.freeze({at:1,t:'이번이 마지막이다. 치료는 필요 없다',scold:'그 말은 이미 여러 번 하셨습니다.'})])}),kind:'medic',flag:'askedHelp',phase:'exit',
 sprite:Object.freeze({path:'assets/r790/npc/medic-idle6.webp',w:384,h:384,px:192,py:352,vis:284,scale:1.04,frames:6,fps:5}),bust:'assets/r790/npc/medic-bust.webp',bustPos:'50% 30%',bustFit:'cover',labelBelow:true,
 name:'의료진',label:'의료진 · 도움 청하기',sub:'병원 복도 · 의료진',
 body:'차트를 든 의료진이 복도에 서 있다.',lore:'선택받은 수호자라는 이름을 내려놓자 치료가 필요한 내가 남았다.',
 take:'도움을 청한다',wait:'아직',done:'의료진에게 도움을 청했습니다.',toDoor:'기억의 제단에서 뒷이야기를 확인하세요.',first:'의료진에게 먼저 도움을 청하세요.',hud:'복도의 의료진 · 도움 청하기',seal:null,boss:null}),
 ep1a11:Object.freeze({talk:Object.freeze({ask:'루시퍼는 사라진 것이 아니라 잠시 물러났을 뿐입니다.',wrong:Object.freeze([Object.freeze({at:1,t:'내가 그를 영원히 없앴다',scold:'갈망과 오만, 수치심은 다시 찾아올 수 있습니다.'}),Object.freeze({at:2,t:'이제 혼자서도 충분하다',scold:'혼자가 되지 않는 쪽을 고르는 것이 싸움입니다.'})])}),kind:'physician',flag:'heardWorlds',phase:'exit',
 sprite:Object.freeze({path:'assets/r790/npc/physician-idle6.webp',w:384,h:384,px:192,py:352,vis:227,scale:.85,frames:6,fps:4}),bust:'assets/r790/npc/physician-bust.webp',bustPos:'50% 30%',bustFit:'cover',labelBelow:true,
 name:'의목사',label:'의목사 · 세 세계 이야기',sub:'침대 곁 · 의사이면서 목사',
 body:'검은 성직복 위에 흰 가운을 걸친 남자가 침대 곁 의자에 앉아 있다. 청진기와 오래된 은제 J인장이 함께 걸려 있다.',lore:'현세와 몽세, 내세 — 사람이 살아가는 현실, 정신과 무의식이 펼쳐지는 곳, 선과 악의 본질이 존재하는 세계.',
 take:'이야기를 듣는다',wait:'아직',done:'의목사에게서 현세와 몽세, 내세에 관해 배웠습니다.',toDoor:'기억의 제단에서 뒷이야기를 확인하세요.',first:'의목사의 이야기를 먼저 들으세요.',hud:'침대 곁 의목사 · 이야기 듣기',seal:null,boss:null}),
 // R793 붉은 하이힐. 정본 17장 "서윤의 미소는 완벽했다. 그러나 아무도 보지 않을 때면 표정이 텅 비었다. 나는 그녀의 허락을 받고 몽세에 들어갔다."
 ep1b05:Object.freeze({talk:Object.freeze({ask:'제 몽세에 들어오시겠다고요?',wrong:Object.freeze([Object.freeze({at:0,t:'허락은 필요 없다. 그냥 들어간다',scold:'묻지 않고 들어온 사람은 이미 많았어요.'}),Object.freeze({at:2,t:'웃고 있으니 괜찮은 줄 알았다',scold:'아무도 보지 않을 때의 얼굴은 못 보셨군요.'})])}),kind:'seoyun',flag:'permission',phase:'door',sideFirst:-1/* 문 오른쪽은 앞 벽에 가린다(헤드리스 장면) → 왼쪽부터 */,
 sprite:Object.freeze({path:'assets/r790/npc/seoyun-idle6.webp',w:384,h:384,px:192,py:352,vis:284,scale:1.04,frames:6,fps:5}),bust:'assets/r790/npc/seoyun-bust.webp',bustPos:'50% 30%',bustFit:'cover',
 name:'서윤',label:'서윤 · 허락 구하기',sub:'붉은 조명 아래 · 서윤',
 body:'서윤의 미소는 완벽하다. 그러나 아무도 보지 않을 때면 표정이 텅 빈다.',lore:'나는 그녀의 허락을 받고 몽세에 들어갔다.',
 take:'허락을 구한다',wait:'아직',done:'서윤의 허락을 받았습니다.',toDoor:'보스 구역 문 앞에서 기억을 확인하세요.',first:'서윤에게 먼저 허락을 구하세요.',hud:'문 앞의 서윤 · 허락 구하기',seal:null,boss:null}),
 // R794 고서진과 청록빌라. 정본 54장 "나는 민재의 수첩에서 한이경의 주소를 찾아 청록빌라로 향했다 … 나는 이제라도 사실을 밝혀야 한다는 뜻을 전했다."
 murder04:Object.freeze({talk:Object.freeze({ask:'7층 일을 들추러 온 건가요?',wrong:Object.freeze([Object.freeze({at:0,t:'장부에 공실이라고 적은 건 당신이다',scold:'경보를 꺼 둔 채 퇴근한 사람이 할 말인가요.'}),Object.freeze({at:1,t:'내 잘못은 없다',scold:'자기 책임은 끝내 인정하지 못하는군요.'})])}),kind:'yigyeong',flag:'toldTruth',phase:'door',sideFirst:-1/* 문 오른쪽은 앞 건물 벽에 가린다 */,
 sprite:Object.freeze({path:'assets/r790/npc/yigyeong-idle6.webp',w:384,h:384,px:192,py:352,vis:286,scale:1.04,frames:6,fps:4}),bust:'assets/r790/npc/yigyeong-bust.webp',bustPos:'50% 30%',bustFit:'cover',
 name:'한이경',label:'한이경 · 사실을 밝히자고 전하기',sub:'청록빌라 · 한이경',
 body:'한이경은 하람이 사고를 당한 횡단보도 옆 청록빌라에 살고 있다. 구겨진 종이를 쥐고 있다.',lore:'민재의 죽음도, 새빛호텔에서 있었던 일도 더는 감출 수 없다고 생각했다.',
 take:'사실을 밝히자고 전한다',wait:'아직',done:'이제라도 사실을 밝혀야 한다는 뜻을 전했습니다.',toDoor:'보스 구역 문 앞에서 기억을 확인하세요.',first:'한이경에게 먼저 뜻을 전하세요.',hud:'청록빌라의 한이경 · 사실을 밝히자고 전하기',seal:null,boss:null})});
const ORDER=['route','rally','door','doorStory','boss','exit','exitStory','done'],OFFER_REACH=3.4,REACH=2.4,DOOR_REACH=3.2,OBJ_REACH=2.7,FADE=1.6;
const after=(d,ph)=>ORDER.indexOf(ph)>ORDER.indexOf(d.phase),shown=(d,ph)=>ORDER.indexOf(ph)>=ORDER.indexOf(d.phase)&&ORDER.includes(ph);
let ledger={};
const keyOf=r=>r.layer+':'+r.id,defOf=r=>r&&typeof r.id==='string'&&Object.prototype.hasOwnProperty.call(DEFS,r.id)?DEFS[r.id]:null;
const R78=()=>window.__STORYWORLD_WORLD_COMBAT_R78__;
const here=()=>{try{return typeof room!=='undefined'?room:null;}catch(_){return null;}};
function clean(v){/* 순수: 깨진 값은 던지지 않고 버린다(이 기록이 없어도 단계로 다시 판단할 수 있다) */const out={};if(!v||typeof v!=='object'||v.version!==1||!v.rooms||typeof v.rooms!=='object'||Array.isArray(v.rooms))return out;
 for(const k of Object.keys(v.rooms).slice(0,64)){const m=/^STORY:([\w-]+)$/.exec(k);if(!m||!Object.prototype.hasOwnProperty.call(DEFS,m[1]))continue;const d=DEFS[m[1]],s=v.rooms[k];if(s&&typeof s==='object'&&s[d.flag]===true)out[k]={[d.flag]:true};}return out;}
function applies(r){try{if(!prefs.on||!r||r.layer!=='STORY'||r.egoVisitId151||!defOf(r))return false;if(window.__STORYWORLD_SURVIVAL_R600__?.active?.())return false;return !!R78()?.controlled?.(r);}catch(e){fail(e);return false;}}
function phaseOf(r){try{return R78()?.state?.(r)?.phase||null;}catch(e){fail(e);return null;}}
function taken(r=here()){const d=defOf(r);if(!d)return false;if(ledger[keyOf(r)]?.[d.flag]===true)return true;if(after(d,phaseOf(r)))return true;try{return typeof completed==='function'&&completed(r.id,'STORY')===true;}catch(_){return false;}}
const gate=(r=here())=>applies(r)&&phaseOf(r)===defOf(r).phase&&!taken(r);
// 관문이 걸리는 문: 문 단계 인물은 보스 구역 문, 출구 단계 인물은 출구 문(door-2).
const gateDoor=r=>{const d=defOf(r),id=d?.phase==='exit'?'door-2':r?.exploration?.bossDoorId;return r?.exploration?.worldR74?.doors?.find(x=>x.id===id)||null;};
const npc=(r=here())=>r?.props?.find(p=>p&&p.r790NPC)||null;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
// 순수: 한 점(제단) 둘레 1.9칸에서 빈 자리. 오른쪽 아래부터 돌며 찾는다.
function around(c,isBlocked,avoid=[]){if(!c||!Number.isFinite(c.x+c.y))return null;for(const rad of [1.9,2.2,1.6])for(let i=0;i<12;i++){const a=.35+i*Math.PI/6,q={x:c.x+Math.cos(a)*rad,y:c.y+Math.sin(a)*rad};
  if(isBlocked(q.x,q.y,.34))continue;if(avoid.some(v=>Math.hypot(v.x-q.x,v.y-q.y)<1.5))continue;return q;}return null;}
// 순수: 문에서 영웅이 다가오는 쪽으로 2.3칸, 옆으로 1.9칸(통로 가운데 줄은 비움). 막혔으면 가까운 빈 자리, 끝내 없으면 null.
//  inward=false 보스 문(영웅은 보스 구역 바깥에서 옴) · true 출구 문(영웅은 보스 구역 안에서 옴).
function spot(door,bounds,isBlocked,avoid=[],inward=false,sideSign=1){if(!door||!Number.isFinite(door.x+door.y))return null;const b=Array.isArray(bounds)&&bounds.length===4?bounds:[door.x-1,door.y-1,door.x+1,door.y-1],cx=(b[0]+b[2])/2,cy=(b[1]+b[3])/2;
 const ny=door.axis==='y',sg=inward?-1:1,n=ny?{x:0,y:(door.y>=cy?1:-1)*sg}:{x:(door.x>=cx?1:-1)*sg,y:0},t={x:n.y?1:0,y:n.x?1:0};
 for(const out of [2.3,2.7,1.9,2.9])for(const side0 of [1.9,-1.9,1.6,-1.6,1.3,-1.3]){const side=side0*(sideSign<0?-1:1),q={x:door.x+n.x*out+t.x*side,y:door.y+n.y*out+t.y*side};
  if(Math.hypot(q.x-door.x,q.y-door.y)>=DOOR_REACH-.05)continue;if(isBlocked(q.x,q.y,.34))continue;if(avoid.some(a=>Math.hypot(a.x-q.x,a.y-q.y)<1.5))continue;return q;}return null;}
function ensure(r=here()){if(!r||!Array.isArray(r.props))return null;const d=defOf(r),want=!!d&&applies(r)&&shown(d,phaseOf(r)),cur=npc(r);
 if(!want){if(cur)r.props=r.props.filter(p=>!p.r790NPC);return null;}if(cur)return cur;const door=gateDoor(r);if(!door)return null;
 const isB=(x,y,rad)=>blocked(x,y,rad,r),solids=r.props.filter(p=>p&&p.solid!==false&&Number.isFinite(p.x+p.y));
 // 문 단계 인물은 보스 문 옆, 출구 단계 인물(쓰러뜨린 보스)은 쓰러진 자리 = 기억 제단 곁.
 const q=d.phase==='exit'?around(r.objective,isB,solids):spot(door,r.exploration?.worldWardR81?.bossBounds,isB,solids,false,d.sideFirst||1);if(!q)return null;
 // 문 단계에 막 들어와 나타날 때만 안개 속에서 서서히(이미 지난 단계의 세이브는 바로 또렷하게)
 const p={id:'r790:npc:'+r.id+':'+d.kind,x:q.x,y:q.y,home:{...q},r790NPC:d.kind,solid:false,visible:true,autoTargetEligible6:false,appearAt:phaseOf(r)===d.phase&&!taken(r)?T():-99,side:Math.sign(q.x-(d.phase==='exit'?r.objective.x:door.x))||1};
 try{img(d.sprite.path);if(d.sprite.offer)img(d.sprite.offer.path);}catch(e){fail(e);}/* 설 때 그림을 미리 청한다 */
 r.props.push(p);stats.placed++;note('placed',{zone:r.id,x:+q.x.toFixed(2),y:+q.y.toFixed(2)});return p;}
const target=(p,d)=>({id:p.id,kind:'npc',label:d.label,point:{x:p.x,y:p.y},reach:REACH});
function canUse(t,pl){const r=here(),p=npc(r);pl=pl||player;return !!p&&t?.id===p.id&&gate(r)&&!loading&&pl?.hp>0&&dist(pl,p)<=REACH;}
const autoRun=()=>{try{return typeof guide!=='undefined'&&!!guide;}catch(_){return false;}};
function take(r,args){const d=defOf(r);(ledger[keyOf(r)]??={})[d.flag]=true;stats.taken++;note('taken',{zone:r.id,flag:d.flag});try{if(modal)closePanel(true);}catch(e){fail(e);}
 try{saveGame(false);}catch(e){fail(e);}const door=gateDoor(r),near=(!!door&&dist(player,door)<DOOR_REACH)||(d.phase==='exit'&&!!r.objective&&dist(player,r.objective)<OBJ_REACH);try{toast(near?d.done:d.done+' '+d.toDoor,4.5);}catch(e){fail(e);}
 if(near)try{interact.apply(null,args||[]);}catch(e){fail(e);}return true;}
// ── R796 주고받는 한두 마디 ──
// 순수: 답 줄. 맞는 답(받기 글 그대로, 단추 id 도 그대로) 하나 + 틀린 답들을 정해 둔 자리에 끼운다(인물마다 맞는 답 자리가 다르다).
function choices(d){const rows=[{id:'npcTakeR790',t:d.take,ok:true}];if(d&&d.talk)d.talk.wrong.forEach((w,i)=>rows.splice(Math.max(0,Math.min(rows.length,w.at)),0,{id:'npcWrongR796'+'ab'[i],t:w.t,ok:false,scold:w.scold}));return rows;}
const SUMMON=3,SUMMON_HP=.6,SUMMON_LIFE=45,RING=[3.6,4.4,5.2,3];
const mine796=e=>!!e&&e.r796Summon===true,liveSummon=(r=here())=>(r?.enemies||[]).filter(e=>mine796(e)&&e.hp>0&&!e.deadRecorded&&e.spawnState!=='dead');
const plainMob=e=>!!e&&!e.boss&&!e.midboss&&!e.wardChampionR81&&!e.persona&&!e.trial&&!e.cosmic&&!!e.profile&&Number(e.maxHp)>0;
// 순수: 영웅 둘레에서 빈 자리(영웅까지 곧게 걸어올 수 있는 곳만 — 닫힌 문 너머에 서면 물리칠 수 없다).
function ring(c,i,n,isBlocked){if(!c||!Number.isFinite(c.x+c.y))return null;for(const rad of RING)for(let k=0;k<8;k++){const a=(i/n)*Math.PI*2+k*Math.PI/4+.4,q={x:c.x+Math.cos(a)*rad,y:c.y+Math.sin(a)*rad};if(isBlocked(q.x,q.y,.42)||isBlocked(q.x,q.y,.3)||isBlocked(q.x,q.y,.27))continue;/* 헤드리스 실측: 엔진 blocked 는 반지름에 단조롭지 않다(.42 는 빈 자리인데 .3 은 막힘) → 세 반지름 모두 */
  let clear=true;for(let s=1;s<10&&clear;s++)if(isBlocked(c.x+(q.x-c.x)*s/10,c.y+(q.y-c.y)*s/10,.3))clear=false;if(clear)return q;}return null;}
function cloneMob(src,q,r,n){const c={...src};c.id='r796:'+r.id+':'+n+':'+Math.round(T()*100);c.r796Summon=true;c.r796At=T();c.name=String(src.name||'').replace(/\s+\d+$/,'');
 try{if(src.combatProfile)c.combatProfile={...(typeof structuredClone==='function'?structuredClone(src.combatProfile):JSON.parse(JSON.stringify(src.combatProfile))),aggro:80};}catch(_){c.combatProfile={...src.combatProfile,aggro:80};}
 for(const k of Object.keys(c))if(/^rc1\d\d|^r208|^r363Seen|^r384|Cache/.test(k))delete c[k];
 Object.assign(c,{x:q.x,y:q.y,homeX:q.x,homeY:q.y,hp:Math.max(1,Math.round((Number(c.maxHp)||1)*SUMMON_HP)),deadRecorded:false,deadAt:null,spawnState:'active',nav:[],attack:null,aim:null,state:'idle',stuck:0,flash:0,tell:0,rangedWindup:0,
  storyPreparedCast150:null,personaPreparedCast150:null,personaPendingShots150:[],explorationLeash:null,graceUntil:T()+.8,cd:1.2,phaseStage:'active',squadLeaderR373:false});return c;}
// 헤드리스 실측: 쓰러진 일반 몹은 방 목록에서 빠진다(들판을 정리한 door 단계에는 보스만 남는다) → 살아 있을 때 본을 떠 둔다(방마다 넷까지, 2초마다 새로).
const molds=new WeakMap();let moldAt=-99,lastSpots=[];
function remember(r){const t=T();if(t-moldAt<2&&t>=moldAt&&molds.has(r))return;const src=(r.enemies||[]).filter(e=>plainMob(e)&&!mine796(e)&&e.hp>0&&!e.deadRecorded&&e.spawnState==='active');if(!src.length)return;moldAt=t;
 const base=src.filter(e=>!e.squadLeaderR373&&!e.r384Respawn),rows=(base.length?base:src).slice(0,4).map(e=>({...e}));molds.set(r,rows);}
function summon(r){const src=(r.enemies||[]).filter(e=>plainMob(e)&&!mine796(e));const base=src.filter(e=>!e.squadLeaderR373&&!e.r384Respawn);const pool=base.length?base:src.length?src:(molds.get(r)||[]);if(!pool.length)return 0;let made=0;
 const isB=(x,y,rad)=>blocked(x,y,rad,r);lastSpots=[];for(let i=0;i<SUMMON;i++){const q=ring(player,i,SUMMON,isB);if(!q)continue;const c=cloneMob(pool[(i*7+stats.wrong)%pool.length],q,r,stats.summoned+1);r.enemies.push(c);stats.summoned++;made++;lastSpots.push({x:+q.x.toFixed(2),y:+q.y.toFixed(2)});
  try{if(typeof fx==='function')fx('burst',q.x,q.y,{asset:(typeof VFX!=='undefined'&&VFX?VFX.burst:undefined),size:1.1,life:.5});}catch(_){}}return made;}
function scold(r,c){const d=defOf(r);stats.wrong++;try{if(modal)closePanel(true);}catch(e){fail(e);}let n=0;try{n=summon(r);}catch(e){fail(e);}note('scold',{zone:r.id,pick:c.id,summoned:n,spots:lastSpots.slice()});{const p=npc(r);if(p){p.say=c.scold;p.sayUntil=T()+5;}}/* 꾸짖는 말은 인물 머리 위에도 5초(아래 알림은 싸우는 중에 놓치기 쉽다) */
 try{toast(d.name+' — “'+c.scold+'”'+(n?' 몰려든 적을 물리치고 다시 말을 거세요.':' 다시 말을 거세요.'),5);}catch(e){fail(e);}return true;}
// 틀린 답으로 불러낸 몹이 남아 있으면 다시 말을 걸 수 없다. 끝내 못 잡는 자리에 섰을 때를 대비해 45초 뒤에는 물러난다.
function summonBusy(r){const L=liveSummon(r);if(!L.length)return false;const t=T(),old=L.filter(e=>t-(Number(e.r796At)||0)>SUMMON_LIFE);if(old.length){r.enemies=r.enemies.filter(e=>!old.includes(e));stats.expired+=old.length;note('expired',{zone:r.id,n:old.length});}return liveSummon(r).length>0;}
function offer(r,args){const d=defOf(r);stats.offers++;if(autoRun()){stats.auto++;return take(r,args);}
 const esc=typeof escapeHTML==='function'?escapeHTML:s=>String(s);
 openPanel('<h2>'+esc(d.name)+'</h2><p>'+esc(d.sub)+'</p><div class="npcR790" style="display:flex;gap:16px;align-items:center;justify-content:flex-start;flex-wrap:wrap;margin:10px 0 14px">'
  +'<img src="./'+(d.bust||d.sprite.path)+'" alt="" width="148" height="148" style="width:148px;height:148px;object-fit:'+d.bustFit+';object-position:'+d.bustPos+';border-radius:10px;border:1px solid rgba(255,190,110,.35);background:#0d1018">'
  +'<div style="max-width:360px;text-align:left"><p style="margin:0 0 8px">'+esc(d.body)+'</p><p style="margin:0;opacity:.72;font-size:.92em">'+esc(d.lore)+'</p></div></div>'
  +(d.talk?'<p class="npcAskR796" style="margin:0 0 12px;text-align:left;color:#f1cf9a">“'+esc(d.talk.ask)+'”</p>':'')
  +'<div class="actions" style="flex-wrap:wrap">'+choices(d).map(c=>'<button id="'+c.id+'">'+esc(c.t)+'</button>').join('')+'<button id="npcWaitR790">'+esc(d.wait)+'</button></div>');
 for(const c of choices(d))button(c.id,()=>{const now=here();if(now!==r||!gate(r))return closePanel(true);if(c.ok)take(r,args);else scold(r,c);});button('npcWaitR790',()=>closePanel(true));return true;}
function tryUse(args){const r=here();if(!gate(r))return false;const d=defOf(r),p=ensure(r),door=gateDoor(r),nearDoor=!!door&&dist(player,door)<DOOR_REACH;
 if(summonBusy(r)){const close=(p&&dist(player,p)<=REACH)||nearDoor||(d.phase==='exit'&&!!r.objective&&dist(player,r.objective)<OBJ_REACH);if(!close)return false;if(autoRun())return false;stats.busy++;try{toast('몰려든 적을 먼저 물리치세요.',2.5);}catch(e){fail(e);}return true;}
 if((p&&dist(player,p)<=REACH)||(d.phase==='exit'?!!r.objective&&dist(player,r.objective)<OBJ_REACH:nearDoor)){offer(r,args);return true;}
 // 출구 단계: 인물은 제단 곁에 있다. 출구 문에서 누르면 먼저 받으라고 알린다(길잡이는 멈추지 않게 바로 받는다).
 if(nearDoor){if(autoRun()){stats.auto++;return take(r,args);}try{toast(d.first,3);}catch(e){fail(e);}stats.first=(stats.first||0)+1;return true;}return false;}
// ── 엔진에 얹기 ──
if(typeof interact==='function'){const base=interact;interact=function(...a){try{if(started&&!modal&&!loading&&player?.hp>0&&tryUse(a))return true;}catch(e){fail(e);}return base.apply(this,a);};}
if(typeof tick==='function'){const base=tick;let seen=null,seenPhase=null;tick=function(...a){const r0=base.apply(this,a);try{const r=here();if(r&&defOf(r)){if(applies(r)&&!taken(r))remember(r);const ph=phaseOf(r);if(r!==seen||ph!==seenPhase||(shown(defOf(r),ph)&&!npc(r))){seen=r;seenPhase=ph;ensure(r);}}}catch(e){fail(e);}return r0;};}
if(typeof killEnemy==='function'){const base=killEnemy;let toldAt=-99;killEnemy=function(e,...a){try{const r=here(),d=defOf(r);if(d&&d.seal&&e&&d.boss(e)&&applies(r)&&!taken(r)){e.hp=Math.max(1,(Number(e.maxHp)||1)*.1);stats.sealed++;
   if(T()-toldAt>=4){toldAt=T();note('sealed',{zone:r.id});try{toast(d.seal,3.5);}catch(_){}}return false;}}catch(err){fail(err);}return base.apply(this,[e,...a]);};}
if(typeof updateHUD==='function'){const base=updateHUD;updateHUD=function(...a){const r0=base.apply(this,a);try{const r=here();if(started&&gate(r)){const el=$('questText');if(el)el.textContent=liveSummon(r).length?defOf(r).name+' · 몰려든 적을 물리치고 다시 말 걸기':defOf(r).hud;}}catch(e){fail(e);}return r0;};}
function img(p){try{const r=typeof readyImage==='function'?readyImage(p):null;if(r&&r.ready!==false&&r.image)return r.image;}catch(_){}try{if(typeof addImage==='function')addImage(p,'R790 서사 NPC');}catch(_){}return null;}
// 순수: 시트 칸 고르기. 돌기(loop)는 시간으로, 한 번 재생(once)은 시작 시각부터 끝 칸까지 가서 멈춘다.
const frameAt=(t,frames,fps,since)=>{const n=Math.max(1,frames|0);if(n<2)return 0;if(Number.isFinite(since))return Math.max(0,Math.min(n-1,Math.floor((t-since)*fps+1e-6)));return ((Math.floor(t*fps)%n)+n)%n;};
function draw(p){const r=here(),SPRITE=DEFS[String(p.id).split(':')[2]]?.sprite;if(!SPRITE||!img(SPRITE.path))return false;const t=T(),q=project(p.x,p.y),a=Math.max(.12,Math.min(1,(t-(Number(p.appearAt)||-99))/FADE));
 // 내미는 시트: 관문이 걸려 있고 영웅이 3.4칸 안에 오면 첫 칸부터 끝 칸까지 가서 내민 채 멈춘다. 멀어지면 숨쉬기로 돌아간다.
 let path=SPRITE.path,f=0;const off=SPRITE.offer,near=!!off&&gate(r)&&!!player&&dist(player,p)<=OFFER_REACH&&!!img(off.path);
 if(near){if(!Number.isFinite(p.offerAt))p.offerAt=t;path=off.path;f=frameAt(t,off.frames,off.fps,p.offerAt);}else{p.offerAt=null;f=frameAt(t,SPRITE.frames||1,SPRITE.fps||5);}
 const rect=[f*SPRITE.w,0,SPRITE.w,SPRITE.h],fr={path,assetFrame:{sourceRect:rect,pivot:[SPRITE.px,SPRITE.py],visibleHeight:SPRITE.vis},sourceAlphaCore:rect,metricThreshold:16,sourcePixelsEdited:false};
 // 한 장 그림만 코드로 숨쉬기(키 ±0.8%)를 얹는다. 시트는 그림이 숨쉰다.
 const h=actorHeight()*SPRITE.scale*((SPRITE.frames||1)>1?1:1+.008*Math.sin(t*1.7)),paint=()=>drawAssetFrame3(path,fr,q.x,q.y,h,{angle:0,alpha:a,flip:p.side>0});stats.draws++;
 const res=ctx?.scope?ctx.scope({id:'prop:'+p.id,kind:'prop',x:p.x,y:p.y,bodyPath:path,alive:true},paint):paint();
 // 관문이 걸려 있는 동안만 머리 위 이름(보스 이름표와 같은 글씨) — 어두운 통로에서 누구에게 가야 하는지 보이게.
 try{if(a>.6&&typeof ctx?.fillText==='function'&&gate(here())){ctx.save?.();ctx.font='11px "Malgun Gothic",sans-serif';ctx.textAlign='center';ctx.fillStyle='#f1cf9a';ctx.shadowColor='#000';ctx.shadowBlur=4;ctx.fillText(DEFS[here().id].name,q.x,DEFS[here().id].labelBelow?q.y+16:q.y-h-8);if(p.say&&t<(Number(p.sayUntil)||0)){ctx.font='bold 13px "Malgun Gothic",sans-serif';ctx.fillStyle='#ffe2b0';ctx.fillText('“'+p.say+'”',q.x,q.y-h-(DEFS[here().id].labelBelow?10:26));stats.says=(stats.says||0)+1;}
  ctx.shadowBlur=0;ctx.restore?.();stats.labels=(stats.labels||0)+1;}}catch(e){fail(e);}
 return res;}
if(typeof drawProp==='function'){const base=drawProp;drawProp=function(p,...a){if(!p||!p.r790NPC)return base.apply(this,[p,...a]);try{return draw(p);}catch(e){fail(e);}};}
(function world(){const w=window.__STORYWORLD_WORLD_R74__;if(!w||typeof w.interactions!=='function')return;const mine=t=>{const p=npc();return !!p&&t?.id===p.id;};
 window.__STORYWORLD_WORLD_R74__=Object.freeze({...w,interactions(){const rows=w.interactions();try{const r=here(),p=gate(r)?npc(r):null;if(p)return rows.concat(target(p,defOf(r)));}catch(e){fail(e);}return rows;},
  canUse(t,pl,...a){return mine(t)?canUse(t,pl):w.canUse(t,pl,...a);},use(t,...a){if(!mine(t))return w.use(t,...a);try{if(!canUse(t))return false;offer(here(),[]);return true;}catch(e){fail(e);return false;}}});})();
if(typeof serializeSave==='function'){const base=serializeSave;serializeSave=function(...a){const raw=base.apply(this,a);try{if(raw&&typeof raw==='object')raw.npcR790={version:1,rooms:JSON.parse(JSON.stringify(ledger))};}catch(e){fail(e);}return raw;};}
if(typeof restoreSave==='function'){const base=restoreSave;restoreSave=async function(raw,...a){const prior=ledger;let next={};try{next=clean(raw?.npcR790);}catch(e){fail(e);}ledger=next;
  try{const r=await base.call(this,raw,...a);if(r===false)ledger=prior;else try{ensure();}catch(e){fail(e);}return r;}catch(e){ledger=prior;throw e;}};}
if(typeof newGame==='function'){const base=newGame;newGame=async function(...a){const prior=ledger,before=typeof player!=='undefined'?player:null;ledger={};
  try{const r=await base.apply(this,a);if(r===false||(before&&player===before&&r!==true))ledger=prior;return r;}catch(e){ledger=prior;throw e;}};}
try{for(const d of Object.values(DEFS)){/* 시트는 작다(칸 6개 70KB 안팎) — 미리 읽어 둔다 */if(d.sprite.frames>1)img(d.sprite.path);if(d.sprite.offer)img(d.sprite.offer.path);}}catch(_){}
window.__STORYWORLD_NPC_R790__=Object.freeze({rev:REV,taken,ensure,pure:Object.freeze({spot,around,clean,choices,ring}),talk:id=>{const d=DEFS[id];return d&&d.talk?{ask:d.talk.ask,choices:choices(d).map(c=>({...c}))}:null;},summoned:()=>liveSummon().length,zones:()=>Object.keys(DEFS),
 inspect:()=>{const r=here(),p=npc(r);return {rev:REV,prefs:{...prefs},zone:r?.id||null,applies:applies(r),phase:phaseOf(r),taken:taken(r),gate:gate(r),npc:p?{id:p.id,x:p.x,y:p.y}:null,ledger:JSON.parse(JSON.stringify(ledger)),summoned:liveSummon(r).length,stats:{...stats},events:[...events],lastError,browserVerified:false};}});
})();
