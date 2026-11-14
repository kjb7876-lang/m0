// R840 서사별 NPC 퀘스트 — 사용자 2026-11-12 "적당한 npc들 2-3정도는 각 서사마다 등장하게 해줘 (맵말고 짧은서사) 서사에 따라서 서사는 바꾸지는 말고
//  간단한 몹처치 퀘스트나 특정장소가서 악에 물든 조형물 처치하면 단서템을 떨구는 이런 시스템, 길잡이는 이러한 퀘스트도 항상 올바르게 수행하도록, 영화모드랑도 잘해결해야해 버그없게끔".
//  · 서사(짧은 이야기 한 편)마다 인물 2~3명: R790 핵심 NPC(앳된 남자·고블린 두목 …)에 더해, 그 서사의 지역 들머리에 부탁하는 인물이 한 명씩 선다.
//  · 두 가지 부탁 — purge: 가는 길 곁에 드러나는 악에 물든 조형물을 세 번 쳐서 부수면 단서가 떨어진다 / kill: 정해진 몹을 정해진 수만큼 잡으면 단서가 떨어진다.
//    단서를 주우면 쪽지 모음(R169)에 정본 문장 그대로 한 장이 들어가고 패시브 포인트 2점(R62, 한 번만)을 받는다.
//  · 서사는 바꾸지 않는다: 곁일이라 R78 진행(문·보스·제단)과 R790 관문을 막지 않고, 단서 글·창의 인용은 정본(hapil-canon-r106-improved) 문장 그대로다. 대사는 짓지 않고 장면 묘사만 쓴다.
//    정본 34·35장은 주민 처치를 목표로 삼지 않으므로 불면귀 편은 조형물 부수기만 쓴다.
//  · 길잡이·영화 모드: 창 없이 스스로 한다(창이 뜨면 자동 진행이 멈춘다). 들머리에서 NPC → 조형물 → 단서 순서로 가고, 적이 8칸 안이면 원래 길잡이(전투)에 넘긴다.
//    처치 부탁은 받기만 하고 싸움은 원래 길잡이가 몬다(집결실에서 남은 몹이 다 모인다). 몹이 모자라면 필요한 수가 줄어든다.
//    길이 안 나오거나 6초 동안 가까워지지 못하면 그 자리에서 대신 마친다(막히지 않게). 서사 창·모달·불러오는 중·보스전에는 쉰다.
//  · 조형물·단서·NPC 는 모두 solid:false 라 길찾기와 충돌이 그대로다. 자리는 들머리→집결실 길에서 계산한다(맵 구조가 바뀌어도 따라간다).
//  · 그림: 불면귀 편은 Dots 주민 숨쉬기 시트(R763)·부적 말뚝·꺼진 등롱대(R810), 고블린 편은 R75 피난민 그림·v290 오염된 사당. 조형물의 검은 기운은 코드로 얹은 임시 표시다
//    (Dots 전용 NPC·기운 시트가 오면 바꾼다 — 최종 아트로 보고하지 않는다).
//  · 세이브 raw.questR840={version:1,rooms:{'STORY:last302':{s:'on'|'drop'|'done',k:처치 수}}}. 무한 생존·협동·EGO 재방문·사몽 층·R78 밖 지역은 건드리지 않는다.
//  · R1035(사용자 2026-11-14 "npc 상호작용 제거하는거 미션 맵 왼쪽 오른쪽 둘다 가도록 유도 배치해서 맵전역을 돌아다니게"): 넓은 맵(바닥 칸이 있고 화면 가로 폭 36칸 이상)이면
//    악에 물든 조형물을 화면 왼쪽 끝 쪽·오른쪽 끝 쪽 두 곳에 하나씩 세운다(들머리에서 이어진 칸만, 보스 구역·문턱·등·다른 조형물 곁은 피함). 둘 다 부숴야 단서가 떨어진다.
//    부순 곳은 세이브 k 의 비트(1 = 왼쪽, 2 = 오른쪽)로 남는다. 좁은 맵(사몽 작은 구역 등)은 예전처럼 길 곁 한 곳. 끄기 {"spread":false}.
//  끄기: localStorage['storyworld.r840.quest']='{"on":false}'. 점검: window.__STORYWORLD_QUEST_R840__.inspect()
(()=>{'use strict';
if(window.__STORYWORLD_QUEST_R840__)return;
const REV='R840-story-quest-1+R843-dots-art+R1035-spread',KEY='storyworld.r840.quest';
let prefs={on:true,spread:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s==='object'){if(typeof s.on==='boolean')prefs.on=s.on;if(typeof s.spread==='boolean')prefs.spread=s.spread;}}catch(_){}
const stats={placed:0,offers:0,taken:0,auto:0,hits:0,broken:0,kills:0,drops:0,done:0,walks:0,fallback:0,draws:0,errors:0};let lastError=null;const events=[];
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const T=()=>typeof time==='number'&&Number.isFinite(time)?time:0;
const note=(kind,d={})=>{events.push({kind,at:+T().toFixed(2),...d});if(events.length>40)events.shift();};
const REACH=2.4,GUIDE_REACH=2.2,HIT_REACH=1.9,PICKUP=1.35,ORB_DELAY=.55,HIT_GAP=.2,GUIDE_HIT=.35,STALL=6,POINTS=2,ORB_ART='assets/vfx/v31315/spirit-orb.webp';
const VIL='assets/r763/villagers/',N75='assets/r75/npcs.png';
const sheet=(path,vis)=>Object.freeze({path,w:256,h:256,px:128,py:234.67,vis,scale:1.3,frames:6,fps:5,faces:'right',sheetW:1536,sheetH:256});
const still=(x,y,w,h,px,py,vis)=>Object.freeze({path:N75,x,y,w,h,px,py,vis,scale:1.1,frames:1,sheetW:1536,sheetH:1024});
// R790 의료진 숨쉬기 시트(Dots CX-0073SN) — ep1a09 문밖의 의료진. 간호사·의사는 R843 부터 전용 그림.
const medic=()=>Object.freeze({path:'assets/r790/npc/medic-idle6.webp',w:384,h:384,px:192,py:352,vis:284,scale:1.35,frames:6,fps:5,faces:'right',sheetW:2304,sheetH:384});
// 사몽(기억 속) 인물의 임시 그림: R75 주민 그림의 색을 뺀 창백한 '잔영'(사몽 맵이 어두워 어둡게 하면 안 보인다 — 헤드리스 실측). 인물 전용 그림(Dots CX-0077SN)이 오면 sheet() 로 바꾼다 — 최종 아트 아님.
const shade=(x,y,w,h,px,py,vis)=>Object.freeze({path:N75,x,y,w,h,px,py,vis,scale:1.3,frames:1,sheetW:1536,sheetH:1024,shade:true});
// R843 Dots 그림(CX-0076QN 불면귀 마을 · CX-0077SN 사몽·의목사A, 7분야 이미지 심사 7.86~8.07 → 게임 파생본 scripts/r843-npc-art.py). 서 있기 6칸, 칸 가운데·Dots 발 기준선.
const R843='assets/r843/';
const dots=(file,cell,py,vis,scale,fps)=>Object.freeze({path:R843+file,w:cell,h:cell,px:cell/2,py,vis,scale,frames:6,fps:fps||5,faces:'right',sheetW:cell*6,sheetH:cell,dots:true});
const SN=(file,vis,scale)=>dots(file,384,352,vis,scale||1.3);
// 오염 기운(발밑 8칸 고리, CX-0076QN 2a) — 악에 물든 조형물 발치. 그림이 아직 안 실렸으면 예전 코드 기운으로 그린다.
const AURA=Object.freeze({path:R843+'aura-loop8.webp',w:256,h:256,px:130,py:236,vis:134,frames:8,fps:9,sheetW:2048,sheetH:256});
// 지역마다 부탁하는 인물 하나. episode = 서사 묶음(짧은 이야기 한 편). lore·clue.text 는 정본 문장 그대로(검사가 정본과 대조한다).
const DEFS=Object.freeze({
 last302:Object.freeze({episode:'한약과 불면귀',npc:Object.freeze({kind:'fisher',name:'잠들지 못한 어부',label:'잠들지 못한 어부 · 가리키는 곳',sub:'포구 · 그물을 멘 어부',sprite:Object.freeze({...dots('fisher-idle6.webp',256,236,190,1.3),fps:4}),bust:R843+'fisher-bust.webp',
   body:'그물을 멘 어부가 충혈된 눈으로 길 가의 붉은 부적 말뚝을 가리킨다. 얼굴의 표정과 몸의 움직임이 어긋나 있다.',lore:'포구 마을에서는 사람들이 살아가는 소리가 들리지 않았다. 주민들은 젖은 한지처럼 납작했고, 눈은 충혈되어 있었다.'}),
  quest:Object.freeze({type:'purge',hits:3,take:'말뚝을 찾아 부순다',hud:'어부가 가리킨 붉은 부적 말뚝 부수기',prop:Object.freeze({path:'assets/r810/talisman-post.webp',height:96,name:'악에 물든 부적 말뚝'})}),
  clue:Object.freeze({icon:R843+'clue-talisman.webp',title:'실 끊긴 붉은 부적',text:'그런 주민들이 보이지 않는 실에 끌리듯 나를 향해 달려왔다. 얼굴의 표정과 몸의 움직임이 어긋나 있었다. 지친 몸이 바라는 것과 그 몸을 움직이는 힘은 달랐다.'})}),
 last303:Object.freeze({episode:'한약과 불면귀',npc:Object.freeze({kind:'herbwife',name:'약방 아낙',label:'약방 아낙 · 돌아보는 곳',sub:'안개 마을 · 약사발을 든 아낙',sprite:dots('herbwife-idle6.webp',256,235,197,1.3,4),bust:R843+'herbwife-bust.webp',
   body:'약사발을 든 아낙이 길 가의 꺼진 등롱대 쪽으로 고개를 돌린다. 찢긴 등롱에 검은 안개가 서려 있다.',lore:'그들은 오랫동안 잠을 잃은 채 버티고 있었다.'}),
  quest:Object.freeze({type:'purge',hits:3,take:'등롱대를 찾아 부순다',hud:'아낙이 돌아본 꺼진 등롱대 부수기',prop:Object.freeze({path:'assets/r810/lantern-post-off.webp',height:104,name:'검은 안개가 서린 등롱대'})}),
  clue:Object.freeze({icon:R843+'clue-lantern.webp',title:'안개 묻은 등롱 조각',text:'그들이 잠들지 못해 느끼는 두려움과 불면귀의 명령은 구분해야 했다.'})}),
 last304:Object.freeze({episode:'고블린 두목과 장미 인장',npc:Object.freeze({kind:'refugee-elder',name:'피난민 노인',label:'피난민 노인 · 바라보는 곳',sub:'중립 지역 · 길 가의 노인',sprite:still(252,15,201,490,82.04,486,482),
   body:'해진 숄을 두른 노인이 숲 쪽을 바라본다. 늑대 울음이 가까이에서 들린다.',lore:'숲에는 슬라임과 늑대, 고블린이 들끓었다.'}),
  quest:Object.freeze({type:'kill',count:5,take:'늑대를 쫓는다',hud:'길 가의 늑대 쫓기',match:e=>/^l304-e2(\b|-|$)/.test(String(e?.nativeId||''))||/늑대/.test(String(e?.name||''))}),
  clue:Object.freeze({icon:R843+'clue-signpost.webp',title:'충돌의 흔적',text:'서로 어울리지 않는 풍경들이 맞붙은 그곳은, 둘째와 셋째의 세계가 충돌하는 중립 지역이었다.'})}),
 last305:Object.freeze({episode:'고블린 두목과 장미 인장',npc:Object.freeze({kind:'refugee-woman',name:'피난민 여인',label:'피난민 여인 · 가리키는 곳',sub:'늑대·고블린 숲 · 길 가의 여인',sprite:still(690,21,183,481,88.34,477,473),
   body:'머릿수건을 쓴 여인이 길 가의 검게 물든 사당을 가리킨다. 피리 소리가 그쪽에서 새어 나온다.',lore:'숲 깊은 곳에서 피리로 늑대를 조종하는 고블린 두목이 길을 막았다.'}),
  quest:Object.freeze({type:'purge',hits:3,take:'사당을 찾아 부순다',hud:'여인이 가리킨 악에 물든 사당 부수기',prop:Object.freeze({path:'assets/props/v290/corrupted_shrine.webp',height:104,name:'악에 물든 사당'})}),
  clue:Object.freeze({icon:R843+'clue-skystone.webp',title:'갈라진 하늘의 날',text:'하늘이 갈라지던 날 무너진 성에 방향을 알 수 없는 문이 열렸고, 그때부터 서쪽과 동쪽, 산 자와 죽은 자가 뒤섞였다는 것이었다.'})}),
 // ── 의목사A(1부 병원, 짧은 이야기 세 편): ① 피로 물든 병원(ep1a08) ② 주사실과 결전의 날(ep1a09) ③ 중독의 도시와 의목사 후보생(ep1a10·ep1a11 — 의료진·의목사는 R790) ──
 ep1a08:Object.freeze({free:true,episode:'피로 물든 병원',npc:Object.freeze({kind:'nurse',name:'주사기를 든 간호사',label:'주사기를 든 간호사 · 다가오는 걸음',sub:'병원 복도 · 주사기를 든 간호사',sprite:SN('nurse-idle6.webp',280),
   body:'주사기를 든 간호사가 복도 끝의 비명 쪽을 돌아본다. 해치려는 것인지 도우려는 것인지 알 수 없다.',lore:'어느새 주사기를 든 간호사가 다가왔다. 몸이 굳었다. 나를 해치려는 것인지 도우려는 것인지 판단할 수 없었다.'}),
  also:Object.freeze([Object.freeze({kind:'doctor',name:'말이 들리지 않는 의사',label:'말이 들리지 않는 의사',sub:'병원 복도 · 다가오는 의사',sprite:SN('doctor-idle6.webp',280),body:'의사가 다가와 무언가 말한다. 입 모양은 보이는데 말은 제대로 들리지 않는다.',lore:'의사가 다가왔지만 그의 말은 제대로 들리지 않았다.'})]),
  quest:Object.freeze({type:'kill',count:5,match:e=>/^a08-s1(\b|-|$)/.test(String(e?.nativeId||''))||/비명잔영/.test(String(e?.name||'')),take:'복도의 비명을 가라앉힌다',hud:'간호사가 돌아본 복도 비명잔영 가라앉히기'}),
  clue:Object.freeze({title:'겹쳐 보인 얼굴',text:'피처럼 보이던 것이 사라지고, 악마의 얼굴 위로 의료진의 얼굴이 겹쳤다.'})}),
 ep1a09:Object.freeze({episode:'주사실과 결전의 날',npc:Object.freeze({kind:'medic-door',name:'문밖의 의료진',label:'문밖의 의료진 · 막아서는 손',sub:'주사실 앞 · 외치는 의료진',sprite:medic(),bust:'assets/r790/npc/medic-bust.webp',
   body:'의료진이 주사실 쪽을 가리키며 외친다. 안쪽에서 지켜보는 것들이 길을 막고 있다.',lore:'문밖에서 의료진이 외치며 나를 막으려 했다.'}),
  also:Object.freeze([Object.freeze({kind:'comrade',name:'쓰러지는 동료의 잔영',label:'쓰러지는 동료의 잔영',sub:'결전의 날 · 적을 막던 동료',sprite:Object.freeze({path:'assets/episode1a/generated-v392/falling_comrade_echo.webp',x:0,y:0,w:418,h:418,px:209,py:400,vis:380,scale:1.1,frames:1,sheetW:418,sheetH:418}),body:'적을 막아서던 동료의 모습이 잠깐 비쳤다 흐려진다.',lore:'동료들이 적을 막는 동안 나는 봉인이 있는 곳으로 달려갔다.'})]),
  quest:Object.freeze({type:'kill',count:5,match:e=>/^a09-o1(\b|-|$)/.test(String(e?.nativeId||''))||/감시환각/.test(String(e?.name||'')),take:'지켜보는 것들을 걷어 낸다',hud:'의료진이 가리킨 주사실 감시환각 걷어 내기'}),
  clue:Object.freeze({title:'작은 유리 뒤',text:'문도 창도, 돌아갈 수 있는 길도 그 작은 유리 뒤에 가려졌다.'})}),
 ep1a10:Object.freeze({episode:'중독의 도시와 의목사 후보생',npc:Object.freeze({kind:'first-self',name:'처음 약을 쓰던 나의 잔영',label:'처음 약을 쓰던 나의 잔영 · 내려다보는 곳',sub:'폐허의 거리 · 달빛 아래의 잔영',sprite:shade(252,15,201,490,82.04,486,482),
   body:'달빛 아래 흐릿한 사람 하나가 발치에 흩어진 주사기 더미를 내려다본다.',lore:'흩어진 주사기들이 달빛을 반사했다.'}),
  quest:Object.freeze({type:'purge',hits:3,take:'주사기 더미를 찾아 부순다',hud:'잔영이 내려다본 주사기 더미 부수기',prop:Object.freeze({path:'assets/r138/props/syringe.webp',height:40,name:'악에 물든 주사기 더미'})}),
  clue:Object.freeze({title:'내려놓은 이름',text:'선택받은 수호자라는 이름을 내려놓자 치료가 필요한 내가 남았다.'})}),
 // ── 사몽 S-05 경성의 밤(짧은 이야기 한 편, 정본 = story-source/hapil-canon-r448-samong-aspect.txt) ──
 'sz115-S05-1':Object.freeze({layer:'DREAM',canon:'r448',episode:'경성의 밤',npc:Object.freeze({kind:'jihyeon',name:'지현의 잔영',label:'지현의 잔영 · 잔을 닦는 손',sub:'전차 지나는 술집 · 붉은 립스틱의 여자',sprite:SN('jihyeon-idle6.webp',281),
   body:'붉은 립스틱의 여자가 마른행주로 잔을 닦다 손을 멈춘다. 시선은 구석 자리의 잔에 머물러 있다.',lore:'핏빛처럼 선명한 붉은 립스틱을 입술에 문지르고, 발목이 가늘어 보이는 굽 높은 구두를 신은 자태가 서글플 만큼 잘 어울리는 여자였다.'}),
  also:Object.freeze([Object.freeze({kind:'barstaff',name:'낯선 점원의 잔영',label:'낯선 점원의 잔영',sub:'전차 지나는 술집 · 앞치마를 두른 점원',sprite:SN('barstaff-idle6.webp',283),body:'앞치마를 두른 점원이 쟁반을 든 채 구석 자리를 흘끗 본다. 지현이 서던 자리다.',lore:'낯선 점원이 내 앞에 차가운 잔을 내려놓았다.'})]),
  quest:Object.freeze({type:'purge',hits:3,take:'잔을 찾아 깨뜨린다',hud:'지현의 잔영이 바라본 인장 번진 잔 깨뜨리기',prop:Object.freeze({path:'assets/r105/drive/prop-glass.webp',height:54,name:'인장이 번진 잔'})}),
  clue:Object.freeze({title:'멎은 손길',text:'마른행주로 잔의 물기를 훔치던 지현의 손길이 찰나간 멎었다.'})}),
 'sz115-S05-3':Object.freeze({layer:'DREAM',canon:'r448',episode:'경성의 밤',npc:Object.freeze({kind:'superior',name:'상관의 잔영',label:'상관의 잔영 · 신문을 짚는 손',sub:'사무실 책상 · 환하게 웃는 상관',sprite:SN('superior-idle6.webp',281),
   body:'환하게 웃는 상관이 책상 위 호외를 손가락으로 짚는다. 군복 소매가 신문지를 스친다.',lore:'나를 개 취급하던 상관이 만면에 기괴할 정도로 환한 미소를 띤 채 걸어 들어와, 내 특진이 상부에서 최종 결정되었노라고 외쳤다.'}),
  quest:Object.freeze({type:'purge',hits:3,take:'호외를 찾아 찢는다',hud:'상관의 잔영이 짚은 인장 찍힌 호외 찢기',prop:Object.freeze({path:R843+'extra-newspaper.webp',height:62,name:'인장이 찍힌 호외'})}),
  clue:Object.freeze({title:'바스락거리는 호외',text:'마른 종이가 바스락거리며 비명 같은 마찰음을 냈다.'})}),
 // R842 디스토피아(사몽 S-06) 세 편 — ① 침공과 기지(S06-2·3) ② 귀환로와 제3 대피소(S06-15) ③ 되풀이되는 실패와 스무 살의 원룸(S06-18·22).
 // R843: S06-2 그녀(앉은 그림)·S06-3 수비대원·S06-22 젊은 날의 나는 Dots 그림. 꾸러미를 든 그녀(S06-15)·엄호하는 그녀(S06-18)·어린 동생은 맞는 자세 그림이 없어 아직 임시 잔영.
 'sz115-S06-2':Object.freeze({layer:'DREAM',canon:'r448',episode:'디스토피아 · 침공과 기지',npc:Object.freeze({kind:'waiting-her',name:'기다리던 그녀의 잔영',label:'기다리던 그녀의 잔영 · 무릎 위의 점검 키트',sub:'방폭 격벽 안 대기실 · 플라스틱 의자의 그녀',sprite:SN('her-seated-idle6.webp',235,1.09),
   body:'플라스틱 의자에 앉은 그녀가 무릎 위에 작은 점검 키트를 올려놓고 복도 쪽을 본다. 발소리를 알아듣고 자리에서 일어난다.',lore:'민간인 대피 구역의 의료 지원반에 소속된 그녀는, 내가 사지(死地)의 작전에 투입되었다가 돌아오는 날이면 언제나 무릎 위에 작은 의료용 점검 키트를 올려놓고 저 자리에서 나를 기다리곤 했다.'}),
  quest:Object.freeze({type:'talk',take:'곁에 앉아 이야기를 듣는다',hud:'기다리던 그녀의 이야기 듣기'}),
  clue:Object.freeze({title:'미지근한 전투식량',text:'그녀는 내 육성 대답을 듣고 나서야 안도하듯 작게 한숨을 내쉬더니, 내 손바닥 위에 자신의 체온으로 미지근하게 데운 전투식량 팩 하나를 살며시 쥐여 주었다.'})}),
 'sz115-S06-3':Object.freeze({layer:'DREAM',canon:'r448',episode:'디스토피아 · 침공과 기지',npc:Object.freeze({kind:'garrison',name:'수비대원의 잔영',label:'수비대원의 잔영 · 밀려나는 진지',sub:'북부 방어선 · 아군 수비대',sprite:SN('garrison-idle6.webp',280),
   body:'피를 흘리는 수비대원이 무너진 엄폐물에 기대어 방어선 너머를 가리킨다.',lore:'내가 중무장을 갖추고 지상의 교전 현장에 도착했을 때, 아군 일반 수비대는 고출력 음파 공진에 고막과 내장이 터져 피를 흘리며 속절없이 밀려나고 있었다.'}),
  quest:Object.freeze({type:'kill',count:5,match:e=>!!e&&!e.r170Tower,take:'방어선으로 밀려드는 것들을 막는다',hud:'수비대원이 가리킨 방어선의 적 막기'}),
  clue:Object.freeze({title:'적색경보',text:'불과 세 시간 뒤, 기지 북쪽의 최전방 방어선에서 귀를 찢는 적색경보가 울려 퍼졌다.'})}),
 'sz115-S06-15':Object.freeze({layer:'DREAM',canon:'r448',episode:'디스토피아 · 귀환로와 제3 대피소',npc:Object.freeze({kind:'parcel-her',name:'꾸러미를 든 그녀의 잔영',label:'꾸러미를 든 그녀의 잔영 · 반쯤 열린 철문',sub:'제3 대피소 · 식량 꾸러미를 든 그녀',sprite:shade(690,21,183,481,88.34,477,473),
   body:'식량 꾸러미를 든 그녀가 반쯤 열린 방폭 철문 앞에 서 있다. 시선은 복도 안쪽 기계 잔해에 가 있다.',lore:'그녀는 모처럼 밝은 표정으로 배급받은 특식 식량을 정성껏 나누어 꾸러미에 챙기고 있었다.'}),
  also:Object.freeze([Object.freeze({kind:'little-sibling',name:'어린 동생의 잔영',label:'어린 동생의 잔영',sub:'제3 대피소 · 좁은 가족 방',sprite:Object.freeze({...shade(252,15,201,490,82.04,486,482),scale:.95}),body:'좁은 가족 방 쪽에 어린 아이의 모습이 잠깐 비쳤다 흐려진다.',lore:'오직 그녀의 부모님과 어린 동생이 모여 앉아 있던 그 좁은 가족 방 하나에만, 무자비한 대구경 기총 사격이 벌집처럼 집중되어 있었다.'})]),
  quest:Object.freeze({type:'purge',hits:3,take:'기계 잔해를 찾아 부순다',hud:'그녀의 잔영이 바라본 제어 서명 남은 기계 잔해 부수기',prop:Object.freeze({path:'assets/r91/floor/remains-machine-cyborg-0.png',height:72,name:'제어 서명이 남은 기계 잔해'})}),
  clue:Object.freeze({title:'익숙한 제어 서명',text:'임무를 마치자마자 동체를 스스로 자폭시켜 버리고 간 기계 잔해 속에서, 너무나도 소름 끼치도록 익숙한 적의 제어 서명이 검출되었다.'})}),
 'sz115-S06-18':Object.freeze({layer:'DREAM',canon:'r448',episode:'디스토피아 · 되풀이되는 실패와 스무 살의 원룸',npc:Object.freeze({kind:'cover-her',name:'엄호하는 그녀의 잔영',label:'엄호하는 그녀의 잔영 · 얼어붙은 능선',sub:'극지방 눈밭 · 소총을 든 그녀',sprite:shade(690,21,183,481,88.34,477,473),
   body:'소총을 든 그녀가 얼어붙은 눈 능선에서 기어오르는 것들을 겨눈다.',lore:'그녀는 내 바로 옆의 얼어붙은 눈 능선에 낮게 엎드려, 포탑의 화망을 뚫고 가까이 기어오르는 생체병기들의 머리 유리관을 침착하게 하나씩 쏘아 깨뜨리고 있었다.'}),
  quest:Object.freeze({type:'kill',count:5,match:e=>!!e&&!e.r170Tower,take:'기어오르는 것들을 함께 막는다',hud:'그녀의 잔영이 겨눈 눈밭의 적 막기'}),
  clue:Object.freeze({title:'엄호 사격',text:'내 등 뒤에서 그녀의 정확한 엄호 사격이 한 박자도 놓치지 않고 내 발걸음을 따라오고 있었다.'})}),
 'sz115-S06-22':Object.freeze({layer:'DREAM',canon:'r448',episode:'디스토피아 · 되풀이되는 실패와 스무 살의 원룸',npc:Object.freeze({kind:'young-self',name:'젊은 날의 나',label:'젊은 날의 나 · 원룸 철문',sub:'스무 살의 원룸 · 헐렁한 평상복 차림',sprite:SN('young-self-idle6.webp',279),
   body:'헐렁한 평상복 차림의 젊은 사람이 문고리를 잡은 채 이쪽 눈동자를 들여다본다.',lore:'젊은 나는 문고리를 잡은 채 한동안 말없이 내 눈동자를 들여다보았다.'}),
  quest:Object.freeze({type:'talk',take:'마주 앉아 이야기를 꺼낸다',hud:'젊은 날의 나와 마주 앉기'}),
  clue:Object.freeze({title:'접이식 의자',text:'나는 좁은 원룸의 책상 맞은편에 놓인 작은 접이식 의자에 마주 앉았다.'})})});
const STATES=['on','drop','done'];let ledger={};
// 지역 열쇠: 본편은 room.id, 사몽(DREAM)은 room.id 가 바탕 지역(예: S-05 는 last302)이라 구역 id(room.samongR103.zone, 'sz115-S05-1')로 가린다.
const zid=r=>{if(!r)return '';if(r.layer==='DREAM')return typeof r.samongR103?.zone==='string'?r.samongR103.zone:'';return typeof r.id==='string'?r.id:'';};
const layerOf=d=>d&&d.layer==='DREAM'?'DREAM':'STORY';
const keyOf=r=>r.layer+':'+zid(r),defOf=r=>{const z=zid(r);if(!z||!Object.prototype.hasOwnProperty.call(DEFS,z))return null;const d=DEFS[z];return layerOf(d)===r.layer?d:null;};
const here=()=>{try{return typeof room!=='undefined'?room:null;}catch(_){return null;}};
const R78=()=>window.__STORYWORLD_WORLD_COMBAT_R78__;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const solo=()=>{try{const m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();return !m||m==='off';}catch(_){return true;}};
function clean(v){/* 순수: 깨진 값은 던지지 않고 버린다 */const out={};if(!v||typeof v!=='object'||v.version!==1||!v.rooms||typeof v.rooms!=='object'||Array.isArray(v.rooms))return out;
 for(const k of Object.keys(v.rooms).slice(0,64)){const m=/^(STORY|DREAM):([\w-]+)$/.exec(k);if(!m||!Object.prototype.hasOwnProperty.call(DEFS,m[2])||layerOf(DEFS[m[2]])!==m[1])continue;const s=v.rooms[k];if(!s||typeof s!=='object'||!STATES.includes(s.s))continue;
  const n=Number(s.k);out[k]={s:s.s,k:Number.isFinite(n)?Math.max(0,Math.min(99,Math.floor(n))):0};}return out;}
const dream=r=>!!r&&r.layer==='DREAM';
function applies(r){try{if(!prefs.on||!r||(r.layer!=='STORY'&&r.layer!=='DREAM')||r.egoVisitId151||!defOf(r))return false;if(window.__STORYWORLD_SURVIVAL_R600__?.active?.())return false;if(!solo())return false;
  if(dream(r))return !!r.samongR103&&!!r.exploration?.entry;/* 사몽 구역: R78 진행이 아니라 구역 목표(단서·처치·버티기)로 넘어간다 */
  if(defOf(r).free)return !!r.exploration?.entry&&!!r.objective;/* R78 뼈대가 아닌 본편 맵(ep1a08 새빛병원 지하): 들머리→목표물 길로 자리를 잡는다 */return !!R78()?.controlled?.(r);}catch(e){fail(e);return false;}}
const stOf=(r=here())=>r&&ledger[keyOf(r)]?.s||'new';
const killsOf=r=>r&&ledger[keyOf(r)]?.k||0;
function zoneDone(r){try{if(dream(r)){const S=window.__STORYWORLD_SAMONG_R103__?.state?.();return Array.isArray(S?.zoneDone)&&S.zoneDone.includes(zid(r));}return typeof completed==='function'&&completed(r.id,'STORY')===true;}catch(_){return false;}}
// 보이는 조건: 받지 않은 채 이미 끝낸 지역에는 다시 세우지 않는다(옛 세이브·재방문에 새 일을 만들지 않음).
const visible=(r=here())=>applies(r)&&(stOf(r)!=='new'||!zoneDone(r));
function phaseOf(r){try{return R78()?.state?.(r)?.phase||null;}catch(e){fail(e);return null;}}
const propsOf=(r=here())=>(r?.props||[]).filter(p=>p&&p.r840Prop);
/* R1035: 조형물이 둘이면 영웅에게 가까운 쪽 */
const propOf=(r=here())=>{const ps=propsOf(r);if(ps.length<2)return ps[0]||null;let pl=null;try{pl=player;}catch(_){}if(!pl||!Number.isFinite(pl.x+pl.y))return ps[0];return ps.reduce((a,b)=>dist(pl,b)<dist(pl,a)?b:a);};
const npc=(r=here())=>r?.props?.find(p=>p&&p.r840NPC)||null,orbOf=(r=here())=>r?.props?.find(p=>p&&p.r840Clue)||null;
// ── 자리(순수) ──
const unit=(a,b)=>{const d=Math.hypot(b.x-a.x,b.y-a.y)||1;return {x:(b.x-a.x)/d,y:(b.y-a.y)/d};};
// 길(점 목록)에서 처음부터 want 칸 간 곳과 그곳의 진행 방향.
function along(pts,want){if(!Array.isArray(pts)||pts.length<2)return null;let acc=0;for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],d=Math.hypot(b.x-a.x,b.y-a.y);if(!(d>0))continue;
  if(acc+d>=want){const u=(want-acc)/d;return {x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u,dir:unit(a,b)};}acc+=d;}return null;}
const lengthOf=pts=>{let n=0;for(let i=1;i<(pts?.length||0);i++)n+=Math.hypot(pts[i].x-pts[i-1].x,pts[i].y-pts[i-1].y);return n;};
// 한 점에서 길 옆으로 비켜 선 빈 자리. avoid = [{x,y,min}] 에서 min 칸 안이면 건너뛴다.
function beside(c,isBlocked,avoid,sides){if(!c||!Number.isFinite(c.x+c.y))return null;const t={x:-c.dir.y,y:c.dir.x};
 /* 길 양옆이 다 되면 더 트인 쪽(둘레 16점 가운데 빈 곳이 많은 쪽)에 선다 — 장면 실측: last302 어부가 들머리 문짝 뒤에 서서 반쯤 가렸다. 같으면 앞 후보 그대로. */
 const open=q=>{let n=0;for(let i=0;i<8;i++){const a=i*Math.PI/4;for(const d of [1.2,2.4])if(!isBlocked(q.x+Math.cos(a)*d,q.y+Math.sin(a)*d,.34))n++;}return n;};
 const ok=s=>{const q={x:c.x+t.x*s,y:c.y+t.y*s};if(isBlocked(q.x,q.y,.34))return null;if(avoid.some(a=>Math.hypot(a.x-q.x,a.y-q.y)<a.min))return null;return q;};
 for(let i=0;i<sides.length;i+=2){const a=ok(sides[i]),b=i+1<sides.length?ok(sides[i+1]):null;if(a&&b)return open(b)>open(a)?b:a;if(a||b)return a||b;}return null;}
// NPC: 들머리에서 가는 길로 6칸쯤 들어가 길 옆 1.7칸. 길이 없으면 집결실 쪽 직선으로 같은 계산.
//  (헤드리스 장면 실측: 이 캠페인 맵은 들머리 3칸 안쪽에 방 목록에 없는 화로·촛대가 서 있어 3칸 자리는 그림이 겹쳤다 → 여섯 후보를 찍어 보고 6칸·+1.7 로 정함.)
function npcSpot(entry,goal,pts,isBlocked,avoid=[]){if(!entry||!Number.isFinite(entry.x+entry.y))return null;const line=[entry,goal&&Number.isFinite(goal.x+goal.y)?goal:{x:entry.x-1,y:entry.y-1}];
 for(const path of [pts,line])for(const want of [6,5.2,4.4,3.4]){const c=along(path,want);if(!c)continue;const q=beside(c,isBlocked,avoid,[1.7,-1.7,2.2,-2.2,1.3,-1.3]);if(q&&Math.hypot(q.x-entry.x,q.y-entry.y)<=8)return q;}
 /* 좁은 복도 맵(ep1a08 새빛병원 지하 — 헤드리스 실측: 들머리 6칸 안쪽 길 옆이 다 막혀 간호사가 못 섰다): 길을 더 들어가서, 길에 더 붙어서 다시 찾는다. */
 for(const path of [pts,line])for(const want of [7.5,9,10.5,12,4.4,3.4]){const c=along(path,want);if(!c)continue;const q=beside(c,isBlocked,avoid,[1.3,-1.3,.9,-.9,1.7,-1.7]);if(q&&Math.hypot(q.x-entry.x,q.y-entry.y)<=13)return q;}return null;}
// 조형물: 길의 35%쯤(12~34칸) 간 곳, 길 옆 1.8칸. NPC 에서 8칸 넘게 떨어지고 문턱·다른 조형물과 겹치지 않게.
function propSpot(entry,goal,pts,isBlocked,avoid=[],from=null,near=false){/* near: 사몽 구역처럼 작은 맵 — 길 5칸부터, NPC 에서 4칸 넘게(헤드리스 실측: S05-3 은 길이 짧아 12칸 규칙으로는 자리가 없어 바로 단서로 넘어갔다) */const LO=near?5:12,FAR=near?4:8,MINL=near?6:10;if(!entry||!Number.isFinite(entry.x+entry.y))return null;const g=goal&&Number.isFinite(goal.x+goal.y)?goal:{x:entry.x-30,y:entry.y-30},line=[entry,g];
 for(const path of [pts,line]){const L=lengthOf(path);if(!(L>MINL))continue;for(const f of [.35,.45,.27,.55,.2,.65]){const want=Math.max(LO,Math.min(34,L*f));if(want>L-(near?1.5:4))continue;const c=along(path,want);if(!c)continue;
   const q=beside(c,isBlocked,avoid,[1.8,-1.8,2.3,-2.3,1.4,-1.4]);if(q&&(!from||Math.hypot(q.x-from.x,q.y-from.y)>=FAR))return q;}}return null;}
// 사몽 구역의 길 끝: 들머리에서 가장 먼 원문 단서(그 구역에서 영웅이 어차피 가는 곳). 단서가 없으면 구역 목표물.
function dreamGoal(r,entry){let best=null,bd=-1;for(const p of r.props||[]){if(!p||!p.r115Clue||!Number.isFinite(p.x+p.y))continue;const dd=entry?Math.hypot(p.x-entry.x,p.y-entry.y):0;if(dd>bd){bd=dd;best=p;}}return best?{x:best.x,y:best.y}:r.objective;}
// R1035 넓은 맵: 화면 왼쪽(x−y 가 작은 쪽) 끝과 오른쪽(x−y 가 큰 쪽) 끝에 하나씩. 들머리에서 걸어서 이어진 바닥 칸만(BFS, 칸 중심 .34), 보스 구역 +3칸·들머리 14칸 안·avoid 는 뺀다.
//  각 쪽 끝 16% 띠에서 둘레가 가장 트인 칸들 가운데 가장 끝 칸(같으면 가운데 깊이에 가까운 칸). 화면 가로 폭이 36칸 아래거나 두 곳이 40칸 안이면 null(예전처럼 한 곳).
const SIDE_SPAN=36,SIDE_BAND=.16,SIDE_GAP=40,SIDE_ENTRY=14;
const openness=(q,isBlocked)=>{let n=0;for(let i=0;i<8;i++){const a=i*Math.PI/4;for(const d of [1.2,2.4])if(!isBlocked(q.x+Math.cos(a)*d,q.y+Math.sin(a)*d,.34))n++;}return n;};
function sideSpots(ex,isBlocked,avoid=[]){const cells=ex?.floorCells,entry=ex?.entry;if(!Array.isArray(cells)||cells.length<200||!entry||!Number.isFinite(entry.x+entry.y))return null;
 const set=new Set();for(const c of cells){const x=c?.x??c?.[0],y=c?.y??c?.[1];if(Number.isInteger(x)&&Number.isInteger(y))set.add(x+','+y);}
 const bb=ex.worldWardR81?.bossBounds,inBoss=(x,y)=>Array.isArray(bb)&&bb.length===4&&x>=bb[0]-3&&x<=bb[2]+3&&y>=bb[1]-3&&y<=bb[3]+3;
 const sx=Math.floor(entry.x),sy=Math.floor(entry.y),seen=new Set([sx+','+sy]),queue=[[sx,sy]],live=[];
 for(let h=0;h<queue.length&&h<20000;h++){const [x,y]=queue[h];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=nx+','+ny;if(seen.has(k)||!set.has(k))continue;seen.add(k);if(isBlocked(nx+.5,ny+.5,.34))continue;queue.push([nx,ny]);live.push({x:nx+.5,y:ny+.5});}}
 const cand=live.filter(q=>!inBoss(q.x,q.y)&&Math.hypot(q.x-entry.x,q.y-entry.y)>=SIDE_ENTRY&&!avoid.some(a=>Math.hypot(a.x-q.x,a.y-q.y)<a.min));if(cand.length<2)return null;
 let lo=Infinity,hi=-Infinity;for(const q of live){const v=q.x-q.y;if(v<lo)lo=v;if(v>hi)hi=v;}if(!(hi-lo>=SIDE_SPAN))return null;
 const depths=live.map(q=>q.x+q.y).sort((a,b)=>a-b),mid=depths[depths.length>>1];
 const pick=sign=>{const edge=sign<0?lo:hi,band=(hi-lo)*SIDE_BAND,pool=cand.filter(q=>Math.abs((q.x-q.y)-edge)<=band);if(!pool.length)return null;
  for(const q of pool)q.o=openness(q,isBlocked);const best=Math.max(...pool.map(q=>q.o)),top=pool.filter(q=>q.o>=Math.min(best,14));
  top.sort((a,b)=>sign*((b.x-b.y)-(a.x-a.y))||Math.abs(a.x+a.y-mid)-Math.abs(b.x+b.y-mid)||a.x-b.x||a.y-b.y);return {x:top[0].x,y:top[0].y};};
 const L=pick(-1),R=pick(1);if(!L||!R||Math.hypot(L.x-R.x,L.y-R.y)<SIDE_GAP)return null;return [L,R];}
function spots(r){/* 방마다 한 번 계산해 둔다(같은 구조면 같은 자리) */if(r.r840Spots&&r.r840Spots.props===r.exploration)return r.r840Spots;const d=defOf(r),ex=r.exploration||{},entry=ex.entry,goal=dream(r)?dreamGoal(r,entry):ex.worldWardR81?.gatherAnchor||r.objective;
 const isB=(x,y,rad)=>{try{return !!blocked(x,y,rad,r);}catch(_){return true;}};let pts=null;
 try{if(entry&&goal&&typeof findPath==='function'){const p=findPath(entry,goal,r,.31);if(Array.isArray(p)&&p.length)pts=[{x:entry.x,y:entry.y},...p];}}catch(e){fail(e);}
 const doors=(ex.worldR74?.doors||[]).filter(v=>v&&Number.isFinite(v.x+v.y)).map(v=>({x:v.x,y:v.y,min:3.2})),solids=(r.props||[]).filter(p=>p&&!p.r840NPC&&!p.r840Amb&&!p.r840Prop&&!p.r840Clue&&Number.isFinite(p.x+p.y)).map(p=>({x:p.x,y:p.y,min:1.3}));
 /* 길 가 세움 등(R92)·벽 등(R91)은 방 소품 목록에 없다 → 그 자리 목록을 받아 4.5칸 안에는 놓지 않는다(장면 실측: last303 조형물이 석등 바로 옆에 섰다). */
 let lamps=[];try{lamps=[...(window.__STORYWORLD_VISUAL_R92__?.lightPoints?.()||[]),...(window.__STORYWORLD_VISUAL_R91__?.lightPoints?.()||[])].filter(v=>v&&Number.isFinite(v.x+v.y)).map(v=>({x:v.x,y:v.y,min:4.5}));}catch(e){fail(e);}
 const n=npcSpot(entry,goal,pts,isB,[...doors.map(v=>({...v,min:dream(r)?2.2:5.5/* 사몽 구역은 방이 작고 문이 방마다 있다 — 들머리 문짝 그림(본편 door-1)이 없으니 겹치지만 않게 */})),...solids,...lamps.map(v=>({...v,min:1.6}))])/* NPC 는 등 곁에 서도 된다(겹치지만 않게). 들머리 문짝(door-1)에서는 5.5칸 — 문짝 그림이 길어 가까우면 몸이 가린다(last302 실측 4.3칸에서 가림). */,q=d.quest.type==='purge'?propSpot(entry,goal,pts,isB,[...doors.map(v=>dream(r)?{...v,min:2.2}:v),...solids,...lamps],n,dream(r)):null;
 let sides=null;if(d.quest.type==='purge'&&prefs.spread&&d.quest.spread!==false){try{sides=sideSpots(ex,isB,[...doors,...solids.map(v=>({...v,min:2.6}))/* 장면 실측: 1.3칸이면 끝자리 석등·나무에 붙어 섰다 */,...lamps,...(n?[{x:n.x,y:n.y,min:8}]:[])]);}catch(e){fail(e);sides=null;}}
 /* 곁에 서 있기만 하는 인물(also): 길로 더 들어간 곳(10칸쯤)·퀘스트 NPC 에서 3칸 넘게. 자리가 없으면 세우지 않는다. */
 const amb=[];for(const a of d.also||[]){let got=null;const av=[...doors.map(v=>({...v,min:dream(r)?2.2:5.5})),...solids,...lamps.map(v=>({...v,min:1.6})),...(n?[{x:n.x,y:n.y,min:3}]:[]),...(q?[{x:q.x,y:q.y,min:3}]:[]),...amb.filter(Boolean).map(v=>({x:v.x,y:v.y,min:3}))];
  for(const want of [10.5,9.5,12,8.5,13.5]){const c=along(pts||[entry,goal||entry],want);if(!c)continue;got=beside(c,isB,av,[-1.7,1.7,-2.2,2.2]);if(got)break;}amb.push(got);}
 return r.r840Spots={props:r.exploration,npc:n,prop:q,sides,amb,pathed:!!pts,lamps:lamps.length};}
/* 조형물 자리는 퀘스트를 받는 순간(방 소품·등이 다 놓인 뒤)에 다시 잰다 — 방에 막 들어온 때는 다른 오버레이가 가구를 아직 덜 놓았을 수 있다. NPC 자리는 그대로 둔다. */
function respot(r){const keep=r.r840Spots?.npc||null,ka=r.r840Spots?.amb||null;r.r840Spots=null;const sp=spots(r);if(keep)sp.npc=keep;if(ka)sp.amb=ka;return sp;}
function img(p){try{const r=typeof readyImage==='function'?readyImage(p):null;if(r&&r.ready!==false&&r.image)return r.image;}catch(_){}try{if(typeof addImage==='function')addImage(p,'R840 서사 퀘스트');}catch(_){}return null;}
// ── 방에 놓기: 상태에 맞게 NPC·조형물·단서를 맞춘다(여러 번 불러도 같음) ──
function dropAt(r,pt){const cur=orbOf(r);if(cur)return cur;const ic=defOf(r)?.clue?.icon;if(ic)try{img(ic);}catch(e){fail(e);}const o={id:'r840:clue:'+zid(r),x:pt.x,y:pt.y,path:ic||ORB_ART,height:ic?38:30,solid:false,visible:true,autoTargetEligible6:false,r840Clue:{at:T()}};r.props.push(o);stats.drops++;note('drop',{zone:zid(r),x:+pt.x.toFixed(2),y:+pt.y.toFixed(2)});return o;}
function freeNear(r,pt){try{if(pt&&Number.isFinite(pt.x+pt.y)&&!blocked(pt.x,pt.y,.3,r))return {x:pt.x,y:pt.y};}catch(_){}return {x:player.x,y:player.y};}
function ensure(r=here()){if(!r||!Array.isArray(r.props))return null;try{if(typeof storyScene!=='undefined'&&storyScene&&!npc(r))return null;}catch(_){}/* R841: 서사 창이 떠 있는 동안에는 새로 세우지 않는다(새 여정 첫 화면의 병원 소품 목록을 건드리지 않게, 창이 닫힌 뒤 첫 틱에 선다) */const want=visible(r),st=stOf(r),d=defOf(r);
 if(!want){if(r.props.some(p=>p&&(p.r840NPC||p.r840Amb||p.r840Prop||p.r840Clue)))r.props=r.props.filter(p=>!p.r840NPC&&!p.r840Amb&&!p.r840Prop&&!p.r840Clue);return null;}
 let sp=spots(r);if(st==='on'&&d.quest.type==='purge'&&!propOf(r)&&!sp.fresh){sp=respot(r);sp.fresh=true;}let n=npc(r);
 if(!n&&sp.npc){n={id:'r840:npc:'+zid(r)+':'+d.npc.kind,x:sp.npc.x,y:sp.npc.y,home:{...sp.npc},r840NPC:d.npc.kind,solid:false,visible:true,autoTargetEligible6:false};try{img(d.npc.sprite.path);}catch(e){fail(e);}r.props.push(n);stats.placed++;note('placed',{zone:zid(r),x:+n.x.toFixed(2),y:+n.y.toFixed(2)});}
 (d.also||[]).forEach((a,i)=>{const at=sp.amb?.[i];if(!at||r.props.some(p=>p&&p.r840Amb===a.kind))return;try{img(a.sprite.path);}catch(e){fail(e);}r.props.push({id:'r840:amb:'+zid(r)+':'+a.kind,x:at.x,y:at.y,r840Amb:a.kind,solid:false,visible:true,autoTargetEligible6:false});});
 const sides=st==='on'&&d.quest.type==='purge'&&Array.isArray(sp.sides)?sp.sides:null,wantProp=st==='on'&&d.quest.type==='purge'&&!!(sides||sp.prop);
 const mk=(id,at,idx)=>{try{img(d.quest.prop.path);}catch(e){fail(e);}r.props.push({id,x:at.x,y:at.y,r840Art:d.quest.prop.path,height:d.quest.prop.height,solid:false,visible:true,autoTargetEligible6:false,r840Prop:{hits:0,at:T(),lastHit:-99,...(idx===null?{}:{idx})}});};
 if(!wantProp){if(propsOf(r).length)r.props=r.props.filter(p=>!p.r840Prop);}
 else if(sides){/* R1035: 왼쪽(0)·오른쪽(1) — 부순 쪽(k 비트)은 다시 세우지 않는다. 예전 한 곳짜리 조형물이 남아 있으면 걷는다. */const k=killsOf(r);r.props=r.props.filter(p=>!p.r840Prop||(Number.isInteger(p.r840Prop.idx)&&!(k&(1<<p.r840Prop.idx))));
  sides.forEach((at,i)=>{if(k&(1<<i))return;if(!propsOf(r).some(p=>p.r840Prop.idx===i))mk('r840:prop:'+zid(r)+':'+i,at,i);});}
 else{if(propsOf(r).some(p=>Number.isInteger(p.r840Prop.idx)))r.props=r.props.filter(p=>!p.r840Prop);if(!propOf(r))mk('r840:prop:'+zid(r),sp.prop,null);}
 if(st==='on'&&d.quest.type==='purge'&&!sp.prop&&!sides){/* 놓을 자리를 못 찾은 맵: 막히지 않게 바로 단서를 떨어뜨린다 */stats.fallback++;setState(r,'drop');dropAt(r,freeNear(r,n||player));return n;}
 if(st==='drop'){if(!orbOf(r))dropAt(r,sp.prop||freeNear(r,player));}else if(orbOf(r))r.props=r.props.filter(p=>!p.r840Clue);
 return n;}
function setState(r,s){const cur=ledger[keyOf(r)]||{s:'new',k:0};ledger[keyOf(r)]={s,k:cur.k||0};}
// ── 진행 ──
const autoRun=()=>{try{return typeof guide!=='undefined'&&!!guide;}catch(_){return false;}};
function matching(r){const d=defOf(r);return (r.enemies||[]).filter(e=>{try{return e&&d.quest.match(e);}catch(_){return false;}});}
const aliveOf=e=>e.hp>0&&e.spawnState!=='dead'&&!e.deadRecorded;
function need(r=here()){const d=defOf(r);if(!d||d.quest.type!=='kill')return 0;const k=killsOf(r);if(stOf(r)!=='on')return Math.max(k,stOf(r)==='new'?d.quest.count:k);return Math.min(d.quest.count,k+matching(r).filter(aliveOf).length);}
function take(r){const d=defOf(r);if(stOf(r)!=='new')return false;ledger[keyOf(r)]={s:'on',k:0};stats.taken++;note('taken',{zone:zid(r),type:d.quest.type});try{if(modal)closePanel(true);}catch(e){fail(e);}
 if(d.quest.type==='kill')for(const e of matching(r))if(!aliveOf(e))e.r840Seen=true;/* 받기 전에 쓰러진 몹은 세지 않는다 */
 if(d.quest.type==='talk'){/* R842 이야기만 듣는 곁일: 받는 순간 단서가 발치에 떨어진다 */setState(r,'drop');dropAt(r,freeNear(r,player));}
 ensure(r);try{toast(d.quest.hud+(propsOf(r).length>1?' · 맵 왼쪽과 오른쪽 두 곳':''),3.5);}catch(e){fail(e);}try{saveGame(false);}catch(e){fail(e);}try{if(typeof updateHUD==='function')updateHUD();}catch(e){fail(e);}return true;}
/* 창 초상(148칸): 흉상(bust)이 있으면 흉상, 없으면 서 있기 첫 칸을 위쪽 중심으로 잘라 얼굴·윗몸이 보이게(R843). 임시 잔영은 흐린 실루엣. */
function face(n){const s=n.sprite,box='width:148px;height:148px;display:flex;justify-content:center;border-radius:10px;border:1px solid rgba(255,190,110,.35);background:#0d1018;overflow:hidden';
 if(n.bust)return '<div style="'+box+'"><div style="width:148px;height:148px;background:url(./'+n.bust+') 50% 30%/cover no-repeat"></div></div>';
 if(s.dots){const k=148/(s.vis*.62),top=s.py-s.vis;/* 머리부터 몸 62% 를 창에 */return '<div style="'+box+'"><div style="width:'+Math.round(s.w*k)+'px;height:148px;flex:none;background-image:url(./'+s.path+');background-repeat:no-repeat;background-size:'+Math.round(s.sheetW*k)+'px '+Math.round(s.sheetH*k)+'px;background-position:0 '+(-Math.round((top-6)*k))+'px"></div></div>';}
 const k=148/s.h,bw=Math.round(s.w*k),bg='background-image:url(./'+s.path+');background-repeat:no-repeat;background-size:'+Math.round(s.sheetW*k)+'px '+Math.round(s.sheetH*k)+'px;background-position:'+(-Math.round((s.x||0)*k))+'px '+(-Math.round((s.y||0)*k))+'px'+(s.shade?';filter:grayscale(1) brightness(1.5) contrast(.62) blur(1.1px);opacity:.78':'');
 return '<div style="'+box+'"><div style="width:'+bw+'px;height:148px;'+bg+'"></div></div>';}
function offer(r){const d=defOf(r);stats.offers++;if(autoRun()){stats.auto++;return take(r);}
 const esc=typeof escapeHTML==='function'?escapeHTML:s=>String(s);
 openPanel('<h2>'+esc(d.npc.name)+'</h2><p>'+esc(d.npc.sub)+'</p><div class="questR840" style="display:flex;gap:16px;align-items:center;justify-content:flex-start;flex-wrap:wrap;margin:10px 0 14px">'
  +face(d.npc)
  +'<div style="max-width:360px;text-align:left"><p style="margin:0 0 8px">'+esc(d.npc.body)+'</p><p style="margin:0 0 8px;opacity:.72;font-size:.92em">'+esc(d.npc.lore)+'</p><p style="margin:0;color:#f1cf9a;font-size:.92em">곁일 · '+esc(d.quest.hud)+' → 단서</p></div></div>'
  +'<div class="actions"><button id="questTakeR840">'+esc(d.quest.take)+'</button><button id="questWaitR840">나중에</button></div>');
 button('questTakeR840',()=>{const now=here();if(now===r&&visible(r)&&stOf(r)==='new')take(r);else closePanel(true);});button('questWaitR840',()=>closePanel(true));return true;}
/* R1035: 남은 조형물의 방향(영웅 기준 화면 왼쪽/오른쪽) */
function where(r){let ps=0;try{ps=player.x-player.y;}catch(_){}const w=new Set();for(const q of propsOf(r))w.add(q.x-q.y<ps?'왼쪽':'오른쪽');return ['왼쪽','오른쪽'].filter(v=>w.has(v)).join('·');}
function hit(r,all,target){const q=target&&target.r840Prop?target:propOf(r),d=defOf(r);if(!q||stOf(r)!=='on')return false;const s=q.r840Prop;if(!all&&T()-s.lastHit<HIT_GAP)return true;s.lastHit=T();s.hits=all?d.quest.hits:s.hits+1;stats.hits++;
 try{if(typeof fx==='function'&&typeof VFX!=='undefined'&&VFX.burst)fx('burst',q.x,q.y,{asset:VFX.burst,size:.7,life:.3});}catch(_){}try{if(typeof sound==='function')sound('attack');}catch(_){}
 if(s.hits>=d.quest.hits&&Number.isInteger(s.idx)){/* R1035: 두 곳 가운데 하나 — 비트를 남기고, 남은 곳이 있으면 단서는 아직 */const cur=ledger[keyOf(r)];cur.k=(cur.k|0)|(1<<s.idx);r.props=r.props.filter(p=>p!==q);stats.broken++;note('broken',{zone:zid(r),idx:s.idx});
  const left=propsOf(r).length;if(left>0){try{toast(d.quest.prop.name+'이(가) 부서졌습니다 · 남은 '+left+'곳('+where(r)+')',3);}catch(e){fail(e);}try{saveGame(false);}catch(e){fail(e);}try{if(typeof updateHUD==='function')updateHUD();}catch(e){fail(e);}return true;}
  const pt={x:q.x,y:q.y};setState(r,'drop');dropAt(r,pt);try{toast(d.quest.prop.name+'이(가) 모두 부서졌습니다 · 떨어진 단서를 주우세요.',3);}catch(e){fail(e);}try{saveGame(false);}catch(e){fail(e);}return true;}
 if(s.hits>=d.quest.hits){const pt={x:q.x,y:q.y};r.props=r.props.filter(p=>p!==q);setState(r,'drop');stats.broken++;note('broken',{zone:zid(r)});dropAt(r,pt);
  try{if(typeof sound==='function')sound(typeof soundProfiles!=='undefined'&&soundProfiles.r542Crush?.length?'r542Crush':'attack');}catch(_){}try{toast(d.quest.prop.name+'이(가) 부서졌습니다 · 떨어진 단서를 주우세요.',3);}catch(e){fail(e);}try{saveGame(false);}catch(e){fail(e);}}return true;}
function finish(r){const d=defOf(r);if(stOf(r)!=='drop')return false;setState(r,'done');r.props=r.props.filter(p=>!p.r840Clue);stats.done++;note('done',{zone:zid(r)});
 try{window.__STORYWORLD_PLAY_R169__?.collect?.({key:'quest:r840:'+zid(r),title:'단서 · '+d.clue.title,narr:d.npc.name,place:d.episode,text:d.clue.text});}catch(e){fail(e);}
 let pts=false;try{pts=!!window.__STORYWORLD_PROGRESSION_R62__?.awardPointDrop?.(POINTS,'r64:r840quest:'+r.layer+':'+zid(r),player);}catch(e){fail(e);}
 try{toast('단서 · '+d.clue.title+' — 쪽지 모음에 넣었습니다.'+(pts?' 패시브 포인트 '+POINTS+'점.':''),4);}catch(e){fail(e);}try{if(typeof sound==='function')sound('upgrade');}catch(_){}
 try{if(typeof updateHUD==='function')updateHUD();}catch(e){fail(e);}try{saveGame(false);}catch(e){fail(e);}return true;}
function counted(r,e){const d=defOf(r);if(!d||d.quest.type!=='kill'||stOf(r)!=='on'||!e||e.r840Seen||e.hp>0)return;let m=false;try{m=!!d.quest.match(e);}catch(_){}if(!m)return;e.r840Seen=true;ledger[keyOf(r)].k=Math.min(99,killsOf(r)+1);stats.kills++;
 if(killsOf(r)>=need(r)){setState(r,'drop');dropAt(r,freeNear(r,e));try{toast('떨어진 단서를 주우세요.',3);}catch(_){}try{saveGame(false);}catch(er){fail(er);}}try{if(typeof updateHUD==='function')updateHUD();}catch(er){fail(er);}}
let nextCheck=0;
function upkeep(r){/* tick 뒤: 놓기 맞추기, 처치 수 줄이기, 단서 줍기 */if(!r||!defOf(r))return;ensure(r);if(!visible(r))return;const st=stOf(r);
 if(st==='on'&&defOf(r).quest.type==='kill'&&T()>=nextCheck){nextCheck=T()+.5;if(killsOf(r)>=need(r)){setState(r,'drop');dropAt(r,freeNear(r,player));try{saveGame(false);}catch(e){fail(e);}}}
 if(st==='drop'&&player?.hp>0&&!loading){const o=orbOf(r);if(o&&T()-o.r840Clue.at>=ORB_DELAY&&dist(player,o)<=PICKUP)finish(r);}}
const ambOf=(r,p)=>(defOf(r)?.also||[]).find(a=>a.kind===p?.r840Amb)||null;
function look(r,a){/* 곁에 선 인물: 장면 묘사 + 정본 한 줄만. 퀘스트·진행과 무관 */if(autoRun())return true;const esc=typeof escapeHTML==='function'?escapeHTML:s=>String(s);stats.looks=(stats.looks||0)+1;
 openPanel('<h2>'+esc(a.name)+'</h2><p>'+esc(a.sub)+'</p><div class="questR840" style="display:flex;gap:16px;align-items:center;justify-content:flex-start;flex-wrap:wrap;margin:10px 0 14px">'
  +face(a)
  +'<div style="max-width:360px;text-align:left"><p style="margin:0 0 8px">'+esc(a.body)+'</p><p style="margin:0;opacity:.72;font-size:.92em">'+esc(a.lore)+'</p></div></div>'
  +'<div class="actions"><button id="questLookR840">닫기</button></div>');button('questLookR840',()=>closePanel(true));return true;}
function tryUse(){const r=here();if(!visible(r))return false;const st=stOf(r),d=defOf(r),p=npc(r);
 {const ap=(r.props||[]).filter(q=>q&&q.r840Amb).sort((a,b)=>dist(player,a)-dist(player,b))[0];if(ap&&dist(player,ap)<=REACH&&!(p&&st==='new'&&dist(player,p)<=dist(player,ap))){const a=ambOf(r,ap);if(a)return look(r,a);}}
 if(p&&dist(player,p)<=REACH){if(st==='new'){offer(r);return true;}if(st==='on'){try{toast(d.quest.hud+(d.quest.type==='kill'?' '+killsOf(r)+'/'+need(r):''),3);}catch(e){fail(e);}return true;}if(st==='drop'){try{toast('떨어진 단서를 주우세요.',3);}catch(e){fail(e);}return true;}return false;}
 const q=propOf(r);if(st==='on'&&q&&dist(player,q)<=HIT_REACH)return hit(r,false);return false;}
// ── 길잡이 ──
let walk=null,nextNav=0,nextHit=0;
function guideLive(){try{return autoRun()&&started&&!modal&&!loading&&!(typeof storyScene!=='undefined'&&storyScene)&&player&&player.hp>0;}catch(_){return false;}}
function enemyNear(){try{const r=here();if(dream(r)){/* 사몽 탐색 구역에는 움직이지 않는 조형물 몹(R170 '세뇌당한 기억의 조각')과 떠도는 몹이 늘 있다(헤드리스 실측: S05-3 에서 9칸 안에 늘 적이 있어 곁일을 못 받았다) → 조형물 몹은 빼고, 움직이는 몹이 5칸 안일 때만 전투에 넘긴다. */
   return (r.enemies||[]).some(e=>e&&e.hp>0&&!e.r170Tower&&!e.r170&&e.spawnState!=='hidden'&&(!e.boss||r.engaged)&&dist(player,e)<=5);}
  return typeof nearestEnemy==='function'&&!!nearestEnemy(9);}catch(_){return false;}}
function pathTo(pt){try{const r=window.__STORYWORLD_POLISH_R100__?.navPath?.(player,pt);return Array.isArray(r)&&r.length>1?r:null;}catch(e){fail(e);return null;}}
function guideStepR840(){const r=here();if(!visible(r))return false;const st=stOf(r),d=defOf(r);if(st==='done')return false;if(st==='on'&&d.quest.type==='kill')return false;
 const ph=phaseOf(r);if(ph==='boss'||ph==='doorStory'||r.engaged)return false;if(dream(r)){if(r.samongR103?.bossUp)return false;/* 대면이 시작된 뒤에는 곁일로 되돌리지 않는다 */if(r.samongR103?.portal&&st==='new'){const e=r.exploration?.entry;if(!e||dist(player,e)>16)return false;}/* 다음 문이 열린 뒤: 받은 곁일은 마저 하고, 아직 안 받은 것은 들머리 가까이일 때만(미로 구역은 문이 처음부터 열려 있다 — R842) */}else if(d.free){const e=r.exploration?.entry;if(st==='new'&&e&&dist(player,e)>16)return false;/* 이미 안쪽까지 간 뒤 켠 길잡이는 들머리로 되돌아가지 않는다 */}else if(st==='new'&&ph!=='route')return false;/* 뒤늦게 켠 길잡이는 들머리로 되돌아가지 않는다 */
 if(enemyNear()){walk=null;return false;}ensure(r);
 const tgt=st==='new'?npc(r):st==='on'?propOf(r):orbOf(r),reach=st==='new'?GUIDE_REACH:st==='on'?HIT_REACH-.2:.6;
 const act=fb=>{if(fb){stats.fallback++;note('fallback',{zone:zid(r),st});}walk=null;if(st==='new'){stats.offers++;stats.auto++;return take(r);}if(st==='on'){if(fb)return hit(r,true);if(T()>=nextHit){nextHit=T()+GUIDE_HIT;hit(r,false);}return true;}return finishNow(r);};
 if(!tgt)return act(true),true;const dd=dist(player,tgt);
 if(dd<=reach){if(st==='drop'){/* 줍기는 upkeep 이 한다(떨어진 직후 잠깐 기다림) */if(T()-tgt.r840Clue.at>=ORB_DELAY+2)finishNow(r);return true;}act(false);return true;}
 if(!walk||walk.id!==tgt.id)walk={id:tgt.id,best:dd,bestAt:T(),tries:0};if(dd<walk.best-.3){walk.best=dd;walk.bestAt=T();}
 if(T()-walk.bestAt>STALL){act(true);return true;}
 let moving=false;try{moving=typeof route!=='undefined'&&Array.isArray(route)&&route.length>0;}catch(_){}
 if(!moving&&T()>=nextNav){nextNav=T()+.5;const p=pathTo({x:tgt.x,y:tgt.y});if(p){route=p.slice(1).map(v=>({x:v.x,y:v.y}));command=null;stats.walks++;}else if(++walk.tries>=3){act(true);return true;}}
 return true;}
function finishNow(r){const o=orbOf(r);if(o)o.r840Clue.at=-99;return finish(r);}
// ── 엔진에 얹기 ──
// 이 파일은 순서가 고정된 긴 스크립트 줄보다 앞에 실린다(순서 검사 r176 등을 건드리지 않게). 길잡이·상호작용·처치·목표 글은 다른 오버레이(R261·R426·R272 …)보다
//  바깥에서 먼저 봐야 하므로 첫 tick(모든 스크립트가 실린 뒤)에 한 번 얹는다.
let installed=false;function install(){if(installed)return;installed=true;
if(typeof interact==='function'){const base=interact;interact=function(...a){try{if(started&&!modal&&!loading&&player?.hp>0&&tryUse())return true;}catch(e){fail(e);}return base.apply(this,a);};}
for(const name of ['basicAttack','special']){if(typeof window[name]!=='function')continue;const base=window[name];
 window[name]=function(...a){const r0=base.apply(this,a);try{const r=here();if(started&&!modal&&!loading&&player?.hp>0&&visible(r)&&stOf(r)==='on'){const q=propOf(r);if(q&&dist(player,q)<=HIT_REACH+.3)hit(r,false);}}catch(e){fail(e);}return r0;};}
if(typeof killEnemy==='function'){const base=killEnemy;killEnemy=function(e,...a){const r0=base.apply(this,[e,...a]);try{const r=here();if(e&&visible(r))counted(r,e);}catch(err){fail(err);}return r0;};}
if(typeof guideStep==='function'){const base=guideStep;guideStep=function(...a){try{if(guideLive()&&guideStepR840())return;}catch(e){fail(e);}return base.apply(this,a);};}
if(typeof updateHUD==='function'){const base=updateHUD;updateHUD=function(...a){const r0=base.apply(this,a);try{const r=here();if(started&&visible(r)){const st=stOf(r),d=defOf(r),el=$('questText');
   if(el&&(st==='on'||st==='drop')){const many=d.quest.type==='purge'&&Array.isArray(r.r840Spots?.sides)&&propsOf(r).length>0,add=st==='drop'?'떨어진 단서 줍기':d.quest.hud+(d.quest.type==='kill'?' '+killsOf(r)+'/'+need(r):'')+(many?' · 남은 '+propsOf(r).length+'곳('+where(r)+')':'');if(!String(el.textContent).includes(add))el.textContent=String(el.textContent)+' · 곁일: '+add;}}}catch(e){fail(e);}return r0;};}
}
if(typeof tick==='function'){const base=tick;tick=function(...a){const r0=base.apply(this,a);try{install();upkeep(here());}catch(e){fail(e);}return r0;};}
// ── 그리기 ──
function label(text,x,y,color){try{if(typeof ctx?.fillText!=='function')return;ctx.save?.();ctx.font='11px "Malgun Gothic",sans-serif';ctx.textAlign='center';ctx.fillStyle=color||'#f1cf9a';ctx.shadowColor='#000';ctx.shadowBlur=4;ctx.fillText(text,x,y);ctx.shadowBlur=0;ctx.restore?.();}catch(e){fail(e);}}
function drawNPC(p){const r=here(),d=defOf(r);if(!d)return false;const nd=p.r840Amb?ambOf(r,p):d.npc;if(!nd)return false;const s=nd.sprite;if(!img(s.path))return false;const t=T(),q=project(p.x,p.y);
 const f=s.frames>1?((Math.floor(t*s.fps)%s.frames)+s.frames)%s.frames:0,rect=[(s.x||0)+f*(s.frames>1?s.w:0),s.y||0,s.w,s.h],fr={path:s.path,assetFrame:{sourceRect:rect,pivot:[s.px,s.py],visibleHeight:s.vis},sourceAlphaCore:rect,metricThreshold:16,sourcePixelsEdited:false};
 let flip=false;try{if(s.faces==='right'&&player)flip=project(player.x,player.y).x<q.x-4;}catch(_){}
 const h=actorHeight()*s.scale*(s.frames>1?1:1+.008*Math.sin(t*1.7)),paint=()=>drawAssetFrame3(s.path,fr,q.x,q.y,h,{angle:0,alpha:1,flip});stats.draws++;
 let res;const f0=ctx&&typeof ctx.filter==='string'?ctx.filter:null;try{if(f0!==null)ctx.filter=s.shade?'brightness(1.9) saturate(0.15)':'brightness(1.3)';res=ctx?.scope?ctx.scope({id:'prop:'+p.id,kind:'prop',x:p.x,y:p.y,bodyPath:s.path,alive:true},paint):paint();}finally{if(f0!==null)ctx.filter=f0;}
 if(p.r840Amb||stOf(r)==='new')label(nd.name,q.x,q.y-h-8,p.r840Amb?'#c9c2b4':undefined);return res;}
function aura(p,strength){/* R843: Dots 오염 기운 8칸 고리를 조형물 뒤에 그린다(발 기준). 그림이 안 실렸으면 아래 코드 기운. */
 try{if(typeof drawAssetFrame3==='function'&&img(AURA.path)){const q=project(p.x,p.y),z=typeof zoom==='number'?zoom:1,f=((Math.floor(T()*AURA.fps)%AURA.frames)+AURA.frames)%AURA.frames,rect=[f*AURA.w,0,AURA.w,AURA.h];
   const fr={path:AURA.path,assetFrame:{sourceRect:rect,pivot:[AURA.px,AURA.py],visibleHeight:AURA.vis},sourceAlphaCore:rect,metricThreshold:16,sourcePixelsEdited:false};stats.auras=(stats.auras||0)+1;
   return drawAssetFrame3(AURA.path,fr,q.x,q.y+2*z,Math.max(34,(p.height||90)*.72)*z,{angle:0,alpha:.92*strength,flip:false});}}catch(e){fail(e);}
 try{if(typeof ctx?.createRadialGradient!=='function')return;const q=project(p.x,p.y),z=typeof zoom==='number'?zoom:1,t=T(),a=(.5+.16*Math.sin(t*2.3))*strength,rad=40*z;
  ctx.save();ctx.globalAlpha=a;const g=ctx.createRadialGradient(q.x,q.y-6*z,0,q.x,q.y-6*z,rad);g.addColorStop(0,'rgba(200,24,40,.95)');g.addColorStop(.5,'rgba(96,10,30,.6)');g.addColorStop(1,'rgba(10,4,10,0)');ctx.fillStyle=g;ctx.fillRect(q.x-rad,q.y-6*z-rad*.55,rad*2,rad*1.1);ctx.restore();}catch(e){fail(e);}}
if(typeof drawProp==='function'){const base=drawProp;drawProp=function(p,...a){if(!p||(!p.r840NPC&&!p.r840Amb&&!p.r840Prop&&!p.r840Clue))return base.apply(this,[p,...a]);
  try{if(p.r840NPC||p.r840Amb)return drawNPC(p);const r=here(),d=defOf(r),z=typeof zoom==='number'?zoom:1;
   if(p.r840Prop){aura(p,1);/* 그림 경로는 그리는 동안만 준다: 평소 path 가 없어야 불빛 계통(R123 isLight·R300·R451 — 경로의 lantern·shrine 낱말로 고름)이 '악에 물든' 조형물을 등불로 보지 않는다. */
    let r0;const f0=ctx&&typeof ctx.filter==='string'?ctx.filter:null;p.path=p.r840Art;try{if(f0!==null)ctx.filter='brightness(1.35)';r0=base.apply(this,[p,...a]);}finally{delete p.path;if(f0!==null)ctx.filter=f0;}const q=project(p.x,p.y);if(d)label(d.quest.prop.name+' '+p.r840Prop.hits+'/'+d.quest.hits,q.x,q.y-(p.height||90)*z*.78-8,'#ff9c8a');return r0;}
   const r0=base.apply(this,[p,...a]);const q=project(p.x,p.y);label('단서',q.x,q.y-(24+4*Math.sin(T()*3))*z,'#ffe3a0');return r0;}catch(e){fail(e);}};}
(function world(){const w=window.__STORYWORLD_WORLD_R74__;if(!w||typeof w.interactions!=='function')return;
 const mine=t=>{const id=String(t?.id||'');return id.startsWith('r840:npc:')||id.startsWith('r840:prop:')||id.startsWith('r840:amb:');};
 const canUse=(t,pl)=>{const r=here();pl=pl||player;if(!visible(r)||loading||!(pl?.hp>0))return false;const st=stOf(r),p=npc(r),q=propOf(r);if(p&&t.id===p.id)return st==='new'&&dist(pl,p)<=REACH;const tq=propsOf(r).find(x=>x.id===t.id);if(tq)return st==='on'&&dist(pl,tq)<=HIT_REACH;const ap=(r.props||[]).find(x=>x&&x.r840Amb&&x.id===t.id);if(ap)return dist(pl,ap)<=REACH;return false;};
 window.__STORYWORLD_WORLD_R74__=Object.freeze({...w,interactions(){const rows=w.interactions();try{const r=here();if(visible(r)){const st=stOf(r),d=defOf(r),p=npc(r),q=propOf(r);for(const ap of r.props||[])if(ap&&ap.r840Amb){const am=ambOf(r,ap);if(am)rows.push({id:ap.id,kind:'npc',label:am.label,point:{x:ap.x,y:ap.y},reach:REACH});}
    if(st==='new'&&p)return rows.concat({id:p.id,kind:'npc',label:d.npc.label,point:{x:p.x,y:p.y},reach:REACH});if(st==='on'&&q)return rows.concat(propsOf(r).map(x=>({id:x.id,kind:'npc',label:d.quest.prop.name+' 부수기',point:{x:x.x,y:x.y},reach:HIT_REACH})));}}catch(e){fail(e);}return rows;},
  canUse(t,pl,...a){return mine(t)?canUse(t,pl):w.canUse(t,pl,...a);},use(t,...a){if(!mine(t))return w.use(t,...a);try{if(!canUse(t))return false;const r=here();if(String(t.id).startsWith('r840:npc:'))return offer(r);return hit(r,false,propsOf(r).find(x=>x.id===t.id));}catch(e){fail(e);return false;}}});})();
if(typeof serializeSave==='function'){const base=serializeSave;serializeSave=function(...a){const raw=base.apply(this,a);try{if(raw&&typeof raw==='object'){const rooms={};for(const [k,v] of Object.entries(ledger))if(STATES.includes(v.s))rooms[k]={s:v.s,k:v.k||0};raw.questR840={version:1,rooms};}}catch(e){fail(e);}return raw;};}
if(typeof restoreSave==='function'){const base=restoreSave;restoreSave=async function(raw,...a){const prior=ledger;let next={};try{next=clean(raw?.questR840);}catch(e){fail(e);}ledger=next;walk=null;
  try{const r=await base.call(this,raw,...a);if(r===false)ledger=prior;else try{ensure();}catch(e){fail(e);}return r;}catch(e){ledger=prior;throw e;}};}
if(typeof newGame==='function'){const base=newGame;newGame=async function(...a){const prior=ledger,before=typeof player!=='undefined'?player:null;ledger={};walk=null;
  try{const r=await base.apply(this,a);if(r===false||(before&&player===before&&r!==true&&r!==undefined))ledger=prior;return r;}catch(e){ledger=prior;throw e;}};}
function set(p){if(p&&typeof p.on==='boolean')prefs.on=p.on;if(p&&typeof p.spread==='boolean'){prefs.spread=p.spread;try{const r=here();if(r)r.r840Spots=null;}catch(_){}}try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}try{ensure();}catch(e){fail(e);}return {...prefs};}
window.__STORYWORLD_QUEST_R840__=Object.freeze({rev:REV,set,ensure,zones:()=>Object.keys(DEFS),def:z=>Object.prototype.hasOwnProperty.call(DEFS,z)?DEFS[z]:null,pure:Object.freeze({clean,along,npcSpot,propSpot,sideSpots}),
 inspect:()=>{const r=here(),p=npc(r),q=propOf(r),o=orbOf(r);return {rev:REV,prefs:{...prefs},zone:r?.id||null,applies:applies(r),visible:visible(r),phase:phaseOf(r),state:stOf(r),hits:q?q.r840Prop.hits:0,kills:killsOf(r),need:need(r),
  npc:p?{id:p.id,x:p.x,y:p.y}:null,prop:q?{id:q.id,x:q.x,y:q.y}:null,props:propsOf(r).map(x=>({id:x.id,x:x.x,y:x.y,hits:x.r840Prop.hits})),sides:r?.r840Spots?.sides||null,orb:o?{x:o.x,y:o.y}:null,pathed:r?.r840Spots?.pathed??null,ledger:JSON.parse(JSON.stringify(ledger)),stats:{...stats},events:[...events],lastError,browserVerified:false};}});
})();
