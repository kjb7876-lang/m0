/* R105: 서사 기반 사몽·사몽역행 맵 + 777 전체 이동.
 * R103 의 에피소드 순환(생존 666 → 손전등 미로 → 상승 보스)은 그대로 두고, 에피소드·단계마다
 * 지형 형태(고리·사각·팔각·사거리·다리·승강장·나선·직선), 실내/실외, 소품, 원문 구간 기록 표식을
 * 청사진(BP)으로 정한다. samong-r103.js 는 layoutFor / buildRoom / use 에서 이 모듈을 먼저 묻는다.
 * 777 코드 패널에는 16 에피소드 × 3 단계와 원문 43 구간으로 바로 가는 선택이 붙는다.
 * 원문 본문은 samong-text-r103.js 의 문단만 보여 주며 새 지명·보스 설정은 만들지 않는다.
 * 저장: samongMapsR105 {version, read[]} 를 더할 뿐 기존 필드는 건드리지 않는다.
 * Canonical source; copied to runtime-text by scripts/sync-r99.py. */
(()=>{'use strict';
 if(window.__STORYWORLD_SAMONG_MAPS_R105__)return;
 const REV='R105-samong-maps-1',VERSION=1;
 const TEXT=()=>window.__STORYWORLD_SAMONG_TEXT_R103__?.sections||{};
 const SM=()=>window.__STORYWORLD_SAMONG_R103__;
 let failures=0,lastError=null;const fail=e=>{failures++;lastError=String(e?.stack||e).slice(0,400);};
 const hash=t=>{let h=2166136261;for(const c of String(t))h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return h||1;};
 function rng(seed){let a=seed>>>0||1;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
 const K=(x,y)=>x+':'+y;
 const esc=s=>typeof escapeHTML==='function'?escapeHTML(String(s)):String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const say=(t,s)=>{try{if(typeof toast==='function')toast(t,s);}catch(e){}};

 // ---- 청사진 (docs/r105-narrative-map.md 의 표와 같은 순서) -------------------------------------
 // survival: shape circle|ring|square|octagon|cross|bridge|platform|field. maze: cols/rows/straight(긴 복도 비율)/braid(되돌이 길)/rooms(방).
 // ascent: variant zigzag|straight|spiral|bridge. outdoor: {family, water, trees, wall(낮은 담 높이; null=그대로)}.
 // props: [[StoryArtR74 소품, 개수]]. records: 원문 구간 표식 {key, at(0~1 또는 'last')|sub(문단 시작 문자열), n(문단 수), label, prop}.
 const BP={
  P:{ascent:{title:'코어 아래의 뿌리길',variant:'zigzag',props:[['obelisk',4],['stump',5],['brazier',2]],
   records:[{key:'prelude',at:0,n:3,label:'서문 · 주인 없는 자장가'},{key:'prelude',at:'last',n:2,label:'서문 · 잠든 사람'},{key:'threshold',at:0,n:2,label:'문턱 · 코어 아래로'}]}},
  'S-01':{
   survival:{title:'뿌리 밑동의 광장',style:'forge',shape:'ring',inner:3.5,pillars:0,props:[['stump',6],['obelisk',3],['brazier',4]],
    records:[{key:'threshold',sub:'뿌리를 무너뜨리자',n:2,label:'문턱 · 666의 잔영'}]},
   maze:{title:'빛이 닿는 만큼 생기는 복도',style:'forge',cols:8,rows:8,straight:.8,braid:.12,rooms:1,props:[['brazier',3],['crate',2]],
    records:[{key:'threshold',sub:'모든 적을 없애고 나서 움직일 수는',n:2,label:'문턱 · 복도'},{key:'threshold',at:'last',n:3,label:'계단 위의 여섯 물건',objects:['인형','젖은 출석부','검게 물든 도복 조각','배달 영수증','붉은 입술 자국이 남은 잔','날짜 없는 탄피']}]},
   ascent:{title:'찻잔 속의 집 · 정원과 긴 식탁',style:'domestic',variant:'spiral',props:[['ferns',6],['statue',1],['workbench',6],['well',1],['cabinet',1],['brazier',2]],
    records:[{key:'S-01',at:0,n:3,label:'꿰맨 장미의 집 · 들어서며'},{key:'S-01',sub:'그때 식탁의 안주인이',n:2,label:'식탁의 안주인'},{key:'S-01',at:'last',n:2,label:'종이 울릴 때',prop:'cabinet'}]}},
  'S-02':{
   survival:{title:'자정 1분 전의 운동장',shape:'square',radius:17,pillars:4,outdoor:{family:'stone',trees:'dead',wall:1.2},props:[['brazier',6],['statue',2]],
    records:[{key:'S-02',at:0,n:3,label:'교문이 닫히기 전'}]},
   maze:{title:'자정 1분 전의 학교 복도',style:'clinical',cols:9,rows:8,straight:.9,braid:.1,rooms:5,props:[['workbench',10],['cabinet',4],['empty-bed',2],['brazier',2]],
    records:[{key:'S-02',at:.2,n:2,label:'교무실 · 출석부',prop:'cabinet'},{key:'S-02',at:.4,n:2,label:'음악실 · 피아노 한 음',prop:'workbench'},{key:'S-02',sub:'복도 끝에서 열쇠가',n:2,label:'자료실 문',prop:'cabinet'},{key:'S-02',at:.65,n:2,label:'보건실 · 벽에서 시작하는 발자국',prop:'empty-bed'}]},
   ascent:{title:'방송실로 오르는 계단',style:'clinical',variant:'straight',props:[['cabinet',3],['brazier',3],['crate',2]],
    records:[{key:'S-02',sub:'방송실이 위층에',n:2,label:'방송실 계단'},{key:'S-02',at:'last',n:2,label:'자정의 종',prop:'cabinet'}]}},
  'S-03':{
   survival:{title:'대련장과 관람석',shape:'octagon',radius:19,pillars:0,props:[['statue',4],['crate',8],['brazier',4]],
    records:[{key:'S-03',at:0,n:3,label:'흰 도복의 대련장'},{key:'S-03',at:.3,n:2,label:'관람석의 치료사'}]},
   maze:{title:'시험장 천막 뒤편 · 23년 전 빗속 골목',cols:8,rows:8,straight:.6,braid:.25,rooms:2,outdoor:{family:'stone',trees:null,wall:null},props:[['crate',6],['brazier',4],['stump',2]],
    records:[{key:'S-03',sub:'손전등을 낮추자',n:2,label:'천막 뒤편'},{key:'S-03',at:.55,n:2,label:'23년 전의 비 오는 골목'}]},
   ascent:{title:'검은 고리 장치가 있는 천막 뒤',variant:'zigzag',props:[['workbench',2],['statue',2],['brazier',3]],
    records:[{key:'S-03',sub:'빗소리가 잦아들자',n:2,label:'비가 그친 뒤'},{key:'S-03',at:'last',n:2,label:'열여섯',prop:'workbench'}]}},
  'S-04':{
   survival:{title:'감정의 탑 로비',shape:'square',radius:18,pillars:9,props:[['cabinet',2],['statue',4],['brazier',4]],
    records:[{key:'S-04',at:0,n:3,label:'로비 · 하늘과 류찬'}]},
   maze:{title:'열여섯 층의 복도',cols:9,rows:9,straight:.7,braid:.15,rooms:6,props:[['statue',6],['cabinet',4],['workbench',3],['empty-bed',2],['brazier',3]],
    records:[{key:'S-04',at:.15,n:2,label:'4층 식당 · 규칙을 지키는 마네킹',prop:'statue'},{key:'S-04',at:.3,n:2,label:'2층 경비실 · 멈춘 시계',prop:'cabinet'},{key:'S-04',sub:'나는 탈출이 아니라 배달을',n:2,label:'무너지는 복도'},{key:'S-04',at:.5,n:2,label:'5층 · 초상화 갤러리',prop:'cabinet'},{key:'S-04',at:.62,n:2,label:'8층 · 기록',prop:'cabinet'},{key:'S-04',at:.72,n:2,label:'12층 · 박수 홀',prop:'statue'}]},
   ascent:{title:'13층에서 16층으로',variant:'spiral',props:[['crate',16],['cabinet',2],['brazier',4]],
    records:[{key:'S-04',sub:'엘리베이터는 4층으로',n:2,label:'엘리베이터'},{key:'S-04',sub:'13층에서 강재헌을',n:3,label:'13층 · 강재헌'},{key:'S-04',at:'last',n:2,label:'열여섯 개의 의자와 거울',prop:'cabinet'}]}},
  'S-05':{
   survival:{title:'눈 내리는 돌길 사거리',shape:'cross',radius:19,street:3.5,outdoor:{family:'snow',trees:null,wall:null},props:[['brazier',8],['crate',6],['stump',2]],
    records:[{key:'S-05',at:0,n:3,label:'술집 · 잭앤코크와 전차 불빛'},{key:'S-05',at:.3,n:2,label:'지현'}]},
   maze:{title:'눈 내리는 골목',cols:9,rows:9,straight:.55,braid:.3,rooms:3,outdoor:{family:'snow',trees:null,wall:null},props:[['crate',8],['brazier',6],['cabinet',2]],
    records:[{key:'S-05',sub:'처음에는 추위를 피해',n:2,label:'골목의 추위'},{key:'S-05',at:.55,n:2,label:'사무실 · 보고서',prop:'cabinet'},{key:'S-05',at:.7,n:2,label:'지현의 사진이 실린 신문'}]},
   ascent:{title:'관사 · 불빛이 다시 켜지는 집',variant:'straight',props:[['brazier',6],['cabinet',2],['crate',3]],
    records:[{key:'S-05',sub:'신문은 재가 되지 않았다',n:2,label:'검은 재의 거리'},{key:'S-05',at:'last',n:2,label:'기차 안내 방송',prop:'cabinet'}]}},
  'S-06':{
   survival:{title:'만조 요새의 끊어진 다리',shape:'bridge',radius:20,width:7,outdoor:{family:'coast',water:'sea',trees:null,wall:.8},props:[['obelisk',4],['crate',4],['brazier',3]],
    records:[{key:'NS-01',at:0,n:3,label:'2189 네오 서울 · 케이블의 한강'},{key:'NS-01',at:.5,n:2,label:'거꾸로 선 전함과 폐환승역'},{key:'NS-02',at:0,n:3,label:'2174 네오 도쿄 해변 공원'},{key:'NS-03',at:0,n:3,label:'2189 · 병원이 된 은신처'}]},
   maze:{title:'도시의 밑면 · 작은 방',cols:9,rows:9,straight:.75,braid:.15,rooms:4,props:[['workbench',2],['cabinet',5],['crate',6],['brazier',4]],
    records:[{key:'NS-03',at:.5,n:2,label:'유예관 · 공중에 멈춘 탄환'},{key:'NS-04',at:0,n:3,label:'2196 · 매달린 빗방울'},{key:'NS-05',sub:'문을 열자 작은 방이',n:3,label:'시간 없는 작은 방 · 책상 아래',prop:'workbench'},{key:'NS-05',at:.5,n:2,label:'세 개의 달력',prop:'cabinet'},{key:'NS-06',at:0,n:3,label:'나루 · 유예관'},{key:'NS-07',at:0,n:3,label:'모든 창에 비친 같은 방'}]},
   ascent:{title:'통제실 · 열일곱 개의 고리',variant:'spiral',props:[['obelisk',8],['brazier',4],['cabinet',2]],
    records:[{key:'NS-07',at:'last',n:2,label:'날개가 열리다'},{key:'NS-08',at:0,n:3,label:'미명천사'},{key:'NS-09',at:0,n:3,label:'날짜 없는 서울 · 빈 의자 둘',prop:'crate'},{key:'NS-10',at:0,n:3,label:'환승역 반대편 · 환도',prop:'crate'}]}},
  'S-07':{
   survival:{title:'손님 자리 하나뿐인 식탁',shape:'ring',inner:4,pillars:0,props:[['workbench',8],['crate',6],['brazier',4],['statue',1]],
    records:[{key:'S-07',at:0,n:3,label:'페르소나 · 내 얼굴을 쓴 자'},{key:'S-07',sub:'탁자 위에 여섯 물건이',n:2,label:'탁자 위의 여섯 물건'}]},
   maze:{title:'식탁 뒤의 복도',cols:7,rows:7,straight:.6,braid:.2,rooms:2,props:[['cabinet',3],['crate',4],['brazier',3]],
    records:[{key:'S-07',sub:'나는 그것들이 전부',n:2,label:'더 깨끗한 가면'}]},
   ascent:{title:'거울상 앞의 단',variant:'straight',props:[['statue',2],['cabinet',2],['brazier',4]],
    records:[{key:'S-07',sub:'나는 페르소나를 베었다',n:2,label:'멈춤'},{key:'S-07',sub:'그때 EGO가 각성했다',n:2,label:'EGO 각성',prop:'cabinet'}]}},
  RA:{
   survival:{title:'어제가 도착하는 승강장',style:'clinical',shape:'platform',radius:19,width:10,pillars:6,props:[['obelisk',6],['workbench',1],['crate',3],['brazier',4]],
    records:[{key:'R-00',at:0,n:3,label:'미술관 · 어제가 도착하는 승강장'},{key:'R-00',at:.5,n:2,label:'눈을 가린 화가'},{key:'R-01',at:0,n:3,label:'도겸의 독백'},{key:'R-01',at:'last',n:2,label:'이젤의 뒷면',prop:'workbench'}]},
   maze:{title:'검은 태양 아래 설원 · 침대 고랑',cols:9,rows:8,straight:.5,braid:.3,rooms:3,outdoor:{family:'snow',trees:'dead',wall:1},props:[['empty-bed',12],['brazier',3],['crate',2]],
    records:[{key:'R-02',at:0,n:3,label:'검은 태양 아래의 학교'},{key:'R-02',sub:'손전등으로 창문을 비추자',n:2,label:'창문의 별'},{key:'R-02',at:.6,n:2,label:'31번째 책상 아래의 신발',prop:'crate'}]},
   ascent:{title:'학교와 병원 사이의 이송로',variant:'straight',outdoor:{family:'ash',trees:'dead',wall:1},props:[['empty-bed',6],['brazier',4],['stump',2]],
    records:[{key:'R-02',sub:'나는 순찰자의 길을 막았다',n:2,label:'순찰자의 길'},{key:'R-02',at:'last',n:2,label:'검은 태양의 균열'}]}},
  RB:{
   survival:{title:'대기실 · 두 의자와 세 잔',shape:'square',radius:17,pillars:4,props:[['crate',5],['cabinet',2],['brazier',4],['well',1]],
    records:[{key:'R-03',at:0,n:3,label:'녹아내린 시계의 승강장'},{key:'R-03',at:.45,n:2,label:'두 의자와 세 잔의 물'},{key:'R-03',at:'last',n:2,label:'열네 개의 어두운 창'}]},
   maze:{title:'녹아내린 승강장 · 호텔 주방',cols:8,rows:8,straight:.65,braid:.2,rooms:4,props:[['workbench',6],['cabinet',4],['crate',4],['brazier',3]],
    records:[{key:'R-03',sub:'초침은 철로에',n:2,label:'철로 위의 초침'},{key:'R-04',at:0,n:3,label:'밖은 경성 술집, 안은 호텔 주방',prop:'workbench'},{key:'R-04',at:.5,n:2,label:'공실 장부 식탁보',prop:'cabinet'}]},
   ascent:{title:'호텔 계단 · 7층 방화문',variant:'spiral',props:[['cabinet',4],['brazier',6],['crate',2]],
    records:[{key:'R-04',sub:'지현을 비추던 은빛 면에',n:2,label:'거울의 손'},{key:'R-04',at:'last',n:2,label:'천장에 돋는 관람석'}]}},
  RC:{
   survival:{title:'여섯 번 접힌 대련장',shape:'octagon',radius:19,pillars:0,props:[['statue',6],['crate',6],['brazier',4]],
    records:[{key:'R-05',at:0,n:3,label:'흑백의 청색재판'},{key:'R-05',at:.4,n:2,label:'흰 도복과 검은 도복'}]},
   maze:{title:'접히는 재판정',cols:8,rows:8,straight:.6,braid:.2,rooms:3,props:[['statue',4],['cabinet',3],['crate',4],['brazier',3]],
    records:[{key:'R-05',sub:'재판관이 망치를 내리칠',n:2,label:'재판관의 망치'},{key:'R-05',sub:'내가 그런 결말을 받아들이지 않자',n:2,label:'거절'},{key:'R-05',at:'last',n:2,label:'열여섯 금박 의자의 추락'}]},
   ascent:{title:'지하에 매달린 꼭대기 층',style:'forge',variant:'spiral',props:[['brazier',8],['crate',16],['obelisk',2],['cabinet',2]],
    records:[{key:'R-06',at:0,n:3,label:'밀랍 샹들리에의 층'},{key:'R-06',at:.45,n:2,label:'맘몬의 금고 · 종이 왕',prop:'obelisk'},{key:'R-06',at:'last',n:2,label:'물이 된 바닥'}]}},
  RD:{
   survival:{title:'늪의 다리 · 붉은 교각',shape:'bridge',radius:20,width:7,outdoor:{family:'swamp',water:'swamp',trees:'dead',wall:.8},props:[['ferns',10],['brazier',6],['stump',2]],
    records:[{key:'R-07',at:0,n:3,label:'잠들지 못하는 마을의 다리'},{key:'R-07',sub:'처음 발을 디뎠을 때에는',n:2,label:'가짜 문과 진짜 길'}]},
   maze:{title:'수련 아래의 불면병동',style:'clinical',cols:9,rows:9,straight:.7,braid:.15,rooms:5,props:[['empty-bed',10],['cabinet',4],['workbench',6],['crate',6],['brazier',3]],
    records:[{key:'R-07',at:.7,n:2,label:'물속 학교의 보건실',prop:'empty-bed'},{key:'R-08',at:0,n:3,label:'잠긴 교실',prop:'workbench'},{key:'R-08',at:'last',n:2,label:'모든 액자가 돌아서다',prop:'crate'}]},
   ascent:{title:'일곱 기둥의 대성당',style:'forge',variant:'straight',props:[['obelisk',7],['brazier',6],['cabinet',2]],
    records:[{key:'R-09',at:0,n:3,label:'첫 번째 나팔 · 열리는 지붕'},{key:'R-09',sub:'하늘에서 나팔 소리가',n:2,label:'나팔 소리'},{key:'R-09',at:'last',n:2,label:'빈 원고의 제단',prop:'cabinet'}]}},
  RE:{
   survival:{title:'천장을 뚫고 온 열차',shape:'platform',radius:19,width:9,pillars:6,props:[['crate',10],['brazier',6],['statue',2]],
    records:[{key:'R-10',at:0,n:3,label:'밤마다 다른 객차'},{key:'R-10',at:.25,n:2,label:'승전식의 메달 인형',prop:'statue'}]},
   maze:{title:'관람석이 붙은 탈출로',cols:9,rows:7,straight:.9,braid:.15,rooms:3,props:[['crate',8],['statue',4],['brazier',4]],
    records:[{key:'R-10',sub:'빠른 사람은 느린 사람에게',n:2,label:'빠른 사람과 느린 사람'},{key:'R-10',sub:'천장에는 관람석이',n:2,label:'관람석'}]},
   ascent:{title:'마지막 객차 · 두 사람의 의자',variant:'straight',props:[['brazier',6],['workbench',1],['crate',4]],
    records:[{key:'R-10',sub:'백색 사수는 다시 총을',n:2,label:'백색 사수'},{key:'R-10',at:'last',n:2,label:'설계도만 집어 들다',prop:'workbench'}]}},
  RF:{
   survival:{title:'표지가 쌓인 미술관 홀',shape:'square',radius:18,pillars:9,props:[['cabinet',8],['crate',4],['brazier',4]],
    records:[{key:'R-11',at:0,n:3,label:'스토리텔러 · 손목의 붉은 선'},{key:'R-11',at:.35,n:2,label:'낚싯바늘 문장'}]},
   maze:{title:'책의 등 안쪽',cols:8,rows:8,straight:.75,braid:.1,rooms:2,props:[['cabinet',8],['crate',3],['brazier',3]],
    records:[{key:'R-11',sub:'그때 다섯 번째 나팔이',n:2,label:'다섯 번째 나팔'},{key:'R-11',at:.6,n:2,label:'의자·방석·그릇',prop:'crate'}]},
   ascent:{title:'작은 탁자가 있는 자리',variant:'spiral',props:[['cabinet',4],['brazier',4],['workbench',1]],
    records:[{key:'R-11',sub:'스토리텔러는 그렇게',n:2,label:'종이 얼굴'},{key:'R-12',at:0,n:3,label:'도겸의 휴식 · 빈 의자를 다시 그리다',prop:'workbench'},{key:'R-12',at:'last',n:2,label:'작은 서명'}]}},
  RG:{
   survival:{title:'무너진 미술관 벽 · 일곱 기둥',shape:'field',radius:20,pillars:0,outdoor:{family:'ash',trees:'dead',wall:1},props:[['obelisk',7],['stump',4],['brazier',4]],
    records:[{key:'R-13',at:0,n:3,label:'일곱 번째 나팔 · 무너지는 벽'},{key:'R-13',at:.25,n:2,label:'겹쳐진 세계'}]},
   maze:{title:'여백의 전쟁터',cols:9,rows:9,straight:.5,braid:.3,rooms:4,outdoor:{family:'ash',trees:'dead',wall:1},props:[['obelisk',4],['stump',6],['crate',4],['brazier',4]],
    records:[{key:'R-13',sub:'도겸이 들어 올린 여백이',n:2,label:'들어 올린 여백'},{key:'R-13',at:.55,n:2,label:'그러므로 뒤의 문장'}]},
   ascent:{title:'회전 고리가 있는 기둥',style:'forge',variant:'straight',props:[['obelisk',6],['brazier',6],['cabinet',1]],
    records:[{key:'R-13',sub:'나팔의 몸통은 빈 소매를',n:2,label:'빈 소매의 나팔'},{key:'R-14',at:0,n:3,label:'도겸의 휴식 · 일곱 번째 의자',prop:'cabinet'},{key:'R-14',at:'last',n:2,label:'실로 그린 문'}]}},
  M:{
   survival:{title:'궁전 정원 · 쓰러진 악마 나무',shape:'field',radius:20,pillars:0,outdoor:{family:'garden',trees:'living',wall:1},props:[['stump',3],['crate',6],['ferns',6],['brazier',4]],
    records:[{key:'R-15',at:0,n:3,label:'분리된 세계들'},{key:'R-15',at:.5,n:2,label:'두 사람의 성 · 두드리고 기다리기'},{key:'R-16',at:0,n:3,label:'두 겹의 발자국'},{key:'R-16',at:'last',n:2,label:'열네 개의 조명'},{key:'R-17',at:0,n:3,label:'궁전 정원 · 서명 없는 별',prop:'stump'},{key:'R-17',at:'last',n:3,label:'문턱의 여섯 물건'}]},
   maze:{title:'상담실로 밀려온 성벽',cols:7,rows:7,straight:.6,braid:.2,rooms:2,props:[['obelisk',4],['cabinet',3],['crate',3],['brazier',4]],
    records:[{key:'M1',at:0,n:2,label:'마지막에 남은 사람'},{key:'M1',sub:'그녀를 향해 다가갈수록',n:2,label:'성벽과 시곗바늘'}]},
   ascent:{title:'상담실',variant:'straight',props:[['cabinet',4],['crate',4],['brazier',4]],
    records:[{key:'M1',at:.5,n:2,label:'연결을 하나씩 끊다'},{key:'M1',sub:'그녀는 모든 문을 혼자',n:2,label:'모든 문을 혼자'},{key:'M2',at:0,n:2,label:'엔딩 · 정신과 의사(처치 뒤 연출)'},{key:'M3',at:0,n:2,label:'엔딩 · 코어에 남은 사람(처치 뒤 연출)'},{key:'epilogue',at:0,n:2,label:'종장(처치 뒤 연출)'},{key:'record',at:0,n:2,label:'진료기록(처치 뒤 연출)'}]}}
 };
 const STAGE_NAME={survival:'생존 · 666',maze:'손전등 미로',ascent:'상승 · 보스'};
 const stageName=s=>STAGE_NAME[s]||s;

 // ---- 원문 구간 → 에피소드·단계 (777 구간 이동용) ----------------------------------------------
 const SECTIONS=[];
 function buildSections(){SECTIONS.length=0;const eps=SM()?.episodes||[];const seen=new Set();
  eps.forEach((ep,i)=>{for(const stage of['survival','maze','ascent']){const bp=BP[ep.key]?.[stage];if(!bp)continue;for(const rec of bp.records||[]){if(seen.has(rec.key))continue;seen.add(rec.key);SECTIONS.push({key:rec.key,ep:i,stage,title:TEXT()[rec.key]?.title||rec.key});}}});
  // 청사진에 표식이 없는 구간은 에피소드 본문 키에서 찾아 그 에피소드의 생존(0은 상승) 단계로 보낸다.
  for(const key of Object.keys(TEXT())){if(seen.has(key))continue;const i=Math.max(0,eps.findIndex(e=>e.text?.includes(key)));seen.add(key);SECTIONS.push({key,ep:i,stage:i===0?'ascent':'survival',title:TEXT()[key]?.title||key,fallback:true});}
  return SECTIONS;}

 // ---- 지형 생성 -------------------------------------------------------------------------------
 // R106: 생존 맵은 뱀서류처럼 넓고 트인 벌판(청사진 크기의 SURVIVAL_SCALE배). 모양(고리·사각·팔각·사거리·다리·승강장·벌판)은 그대로.
 const SURVIVAL_SCALE=2.6,MAZE_SCALE=1.75;
 function arena(id,ep,bp,api){const KS=SURVIVAL_SCALE,R=Math.round((bp.radius||20)*KS),S=bp.size||2*R+7,cx=Math.floor(S/2),cy=cx,shape=bp.shape||'circle',cells=new Set(),r=rng(hash(id)),add=(x,y)=>cells.add(K(x,y)),del=(x,y)=>cells.delete(K(x,y));
  const w=Math.round((bp.width||(shape==='bridge'?6:9))*KS*(shape==='bridge'||shape==='platform'?1.25:.85)),inner=(bp.inner||4)*KS,st=(bp.street||3.5)*KS*.9;
  const inside=(x,y)=>{const dx=x+.5-cx,dy=y+.5-cy,d2=dx*dx+dy*dy,ax=Math.abs(dx),ay=Math.abs(dy);
   if(shape==='ring')return d2<=R*R&&d2>inner*inner;
   if(shape==='square')return ax<=R&&ay<=R;
   if(shape==='octagon')return Math.max(ax,ay)<=R&&ax+ay<=R*1.38;
   if(shape==='cross'){const o=R*.6,b=1.4*KS,c=3*KS;return(ax<=st&&ay<=R)||(ay<=st&&ax<=R)||(Math.abs(ax-o)<=b&&ay<=o+b)||(Math.abs(ay-o)<=b&&ax<=o+b)||(Math.abs(ax-o)<=c&&Math.abs(ay-o)<=c);}
   if(shape==='bridge'||shape==='platform')return ay<=w/2&&ax<=R;
   return d2<=R*R;};
  for(let y=1;y<S-1;y++)for(let x=1;x<S-1;x++)if(inside(x,y))add(x,y);
  if(shape==='bridge'){// 끊어진 경간: 양쪽 가장자리를 번갈아 물어뜯되 가운데는 늘 넓게 남긴다.
   const step=Math.round(6*KS),bite=Math.round(3*KS);let n=0;for(let gx=cx-R+8;gx<cx+R-10;gx+=step,n++){const side=n%2?1:-1;for(let k=0;k<Math.floor(w/2)-3;k++){const y=cy+side*(Math.floor(w/2)-k);for(let x=gx;x<gx+bite;x++)del(x,y);}}}
  const strip=shape==='bridge'||shape==='platform',entry=strip?{x:cx+R-6+.5,y:cy+.5}:shape==='ring'?{x:cx+.5,y:cy+Math.round((inner+R)/2)+.5}:{x:cx+.5,y:cy+Math.round(R*.22)+.5};
  const centre=shape==='ring'?{x:cx+.5,y:cy+Math.round(inner)+3}:strip?{x:cx-R+8+.5,y:cy+.5}:{x:cx+.5,y:cy+.5};
  // 엄폐 기둥·바위: 청사진 수의 몇 배 + 넓이에 맞춘 흩어진 장애물(2~3칸). 시작·중앙·서로 사이는 비운다.
  const pillars=[],base=bp.pillars??(shape==='circle'||shape==='square'||shape==='octagon'?9:0),np=Math.round(base*KS*1.6)+Math.round(cells.size/260);
  const clear=(px,py,sz)=>Math.hypot(px-entry.x,py-entry.y)>6&&Math.hypot(px-centre.x,py-centre.y)>7&&!pillars.some(([qx,qy])=>Math.hypot(qx-px,qy-py)<sz+4);
  if(shape==='platform'){const nps=Math.max(2,Math.round(base*KS));for(let k=0;k<nps;k++){const px=cx-R+8+Math.round(k*(2*R-16)/Math.max(1,nps-1));for(const py of[cy-Math.floor(w/2)+2,cy+Math.floor(w/2)-3])if(clear(px,py,2)){pillars.push([px,py]);for(let y=py;y<py+2;y++)for(let x=px;x<px+2;x++)del(x,y);}}}
  for(let k=0,tries=0;k<np&&tries<np*8;tries++){const px=Math.floor(cx-R+3+r()*(2*R-6)),py=Math.floor(cy-R+3+r()*(2*R-6)),sz=2+(r()<.35?1:0);
   let ok=clear(px,py,sz);for(let y=py-1;ok&&y<py+sz+1;y++)for(let x=px-1;ok&&x<px+sz+1;x++)if(!cells.has(K(x,y)))ok=false;if(!ok)continue;
   pillars.push([px,py]);for(let y=py;y<py+sz;y++)for(let x=px;x<px+sz;x++)del(x,y);k++;}
  for(const p of[entry,centre])for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)add(Math.floor(p.x)+dx,Math.floor(p.y)+dy);
  const nodes=[{id:0,x:entry.x,y:entry.y,radius:3,shape:'round'},{id:1,x:centre.x,y:centre.y,radius:6,shape:'round'}];
  return api.build(id,ep,cells,{nodes,edges:[[0,1,4]],entry:{...entry,node:0},bounds:[0,0,S,S],wallHeight:bp.outdoor?(bp.outdoor.wall??1):2.7,extra:{kind:'survival',centre,pillars,shape,r106Scale:KS}});}

 // R106: 손전등 미로는 훨씬 복잡하게 — 칸 수 MAZE_SCALE배, 곁가지를 더 내고(직선 비율↓) 되돌이 길을 줄여 막다른 길을 늘린다.
 function maze(id,ep,bp,seed,api){const C=Math.min(18,Math.round((bp.cols||8)*MAZE_SCALE)),R=Math.min(18,Math.round((bp.rows||bp.cols||8)*MAZE_SCALE)),SZ=bp.cell||5,CW=bp.cw||3,LW=bp.lw||2,r=rng(seed||hash(id)),open=new Set(),k=(a,b)=>a+','+b;
  const nb=(x,y)=>[[x+1,y],[x-1,y],[x,y+1],[x,y-1]].filter(([a,b])=>a>=0&&b>=0&&a<C&&b<R);
  const ek=(a,b)=>a[0]<b[0]||a[1]<b[1]?k(...a)+'|'+k(...b):k(...b)+'|'+k(...a),link=(a,b)=>open.add(ek(a,b)),linked=(a,b)=>open.has(ek(a,b));
  const start=[0,R-1],seen=new Set([k(...start)]),stack=[start],straight=Math.min(.6,bp.straight??.5)*.75;
  // 성장 나무: straight 만큼 최신 칸을 이어 긴 복도를, 나머지는 임의 칸에서 곁가지를 낸다.
  while(stack.length){const at=r()<straight?stack.length-1:Math.floor(r()*stack.length),c=stack[at],n=nb(...c).filter(p=>!seen.has(k(...p)));if(!n.length){stack.splice(at,1);continue;}const p=n[Math.floor(r()*n.length)];link(c,p);seen.add(k(...p));stack.push(p);}
  const braid=(bp.braid??.18)*.55;for(let y=0;y<R;y++)for(let x=0;x<C;x++){const deg=nb(x,y).filter(p=>linked([x,y],p)).length;if(deg===1&&r()<braid){const c=nb(x,y).filter(p=>!linked([x,y],p));if(c.length)link([x,y],c[Math.floor(r()*c.length)]);}}
  const dist=new Map([[k(...start),0]]),q=[start],prev=new Map();while(q.length){const c=q.shift();for(const p of nb(...c))if(linked(c,p)&&!dist.has(k(...p))){dist.set(k(...p),dist.get(k(...c))+1);prev.set(k(...p),c);q.push(p);}}
  let exit=start,best=-1;for(const[key,d]of dist){const[a,b]=key.split(',').map(Number);if(d>best&&(a>C/2||b<R/2)){best=d;exit=[a,b];}}
  const path=[];for(let c=exit;c;c=prev.get(k(...c)))path.unshift(c);
  // 방: 시작·출구를 뺀 칸을 벽 한 칸을 남기고 넓힌다(교무실·식당·병동 같은 자리).
  const roomSet=new Set();{const pool=[];for(let y=0;y<R;y++)for(let x=0;x<C;x++)if(!(x===0&&y===R-1)&&!(x===exit[0]&&y===exit[1]))pool.push([x,y]);pool.sort((a,b)=>(hash(id+':room:'+a)%997)-(hash(id+':room:'+b)%997));for(const c of pool.slice(0,Math.round((bp.rooms||0)*1.6)))roomSet.add(k(...c));}
  const cells=new Set(),add=(x,y)=>cells.add(K(x,y));
  const cell=(x,y)=>{const room=roomSet.has(k(x,y)),n=room?SZ-1:CW;for(let b=0;b<n;b++)for(let a=0;a<n;a++)add(x*SZ+1+a,y*SZ+1+b);};
  const off=Math.floor((CW-LW)/2);
  for(let y=0;y<R;y++)for(let x=0;x<C;x++){cell(x,y);if(x+1<C&&linked([x,y],[x+1,y]))for(let b=0;b<LW;b++)for(let a=x*SZ+1+CW;a<(x+1)*SZ+1;a++)add(a,y*SZ+1+off+b);if(y+1<R&&linked([x,y],[x,y+1]))for(let b=y*SZ+1+CW;b<(y+1)*SZ+1;b++)for(let a=0;a<LW;a++)add(x*SZ+1+off+a,b);}
  const centre=([x,y])=>({x:x*SZ+1+CW/2,y:y*SZ+1+CW/2}),nodes=[];
  for(let y=0;y<R;y++)for(let x=0;x<C;x++){const deg=nb(x,y).filter(p=>linked([x,y],p)).length;nodes.push({id:nodes.length,...centre([x,y]),radius:1.5,shape:'square',width:3,depth:3,cell:[x,y],degree:deg});}
  const deadEnds=nodes.filter(n=>n.degree===1&&k(...n.cell)!==k(...start)&&k(...n.cell)!==k(...exit));
  const save=path[Math.floor(path.length/2)],onPath=new Set(path.map(c=>k(...c))),pool=deadEnds.length>=3?deadEnds:[...deadEnds,...nodes.filter(n=>!onPath.has(k(...n.cell))&&!deadEnds.includes(n))],chests=pool.sort((a,b)=>(hash(id+a.id)%997)-(hash(id+b.id)%997)).slice(0,3).map(n=>({x:n.x,y:n.y}));
  const rooms=[...roomSet].map(s=>{const[x,y]=s.split(',').map(Number);return{x:x*SZ+1+(SZ-1)/2,y:y*SZ+1+(SZ-1)/2,cell:[x,y]};});
  return api.build(id,ep,cells,{nodes,edges:[],entry:{...centre(start),node:(R-1)*C},bounds:[0,0,C*SZ+1,R*SZ+1],wallHeight:bp.outdoor?(bp.outdoor.wall??2.7):2.7,extra:{kind:'maze',exit:centre(exit),save:centre(save),pathLength:path.length,cols:C,rows:R,chests,seed,path:path.map(centre),rooms,deadEnds:deadEnds.map(n=>({x:n.x,y:n.y}))}});}

 function ascent(id,ep,bp,api,i){const variant=bp.variant||'zigzag';if(variant==='zigzag')return api.ascentLayout(i,ep);
  const cells=new Set(),add=(x,y)=>cells.add(K(x,y)),fill=(x0,y0,x1,y1)=>{for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)add(x,y);};
  // 보스 단은 원래 30격자 안(보스 탄막이 3..27 로 잠긴다). 입구는 화면 아래(x+y 큰 쪽)에서 위로 오른다.
  const dais={x:15,y:15};for(let y=6;y<25;y++)for(let x=6;x<25;x++)if(Math.hypot(x+.5-15,y+.5-15)<9.4)add(x,y);
  const V={straight:[[44,44],[37,37],[30,30]],spiral:[[44,44],[42,31],[31,42],[33,24],[23,33],[27,21]],bridge:[[45,24],[37,24],[29,24]]}[variant]||[[44,44],[37,37],[30,30]];
  const brush=(x,y,w)=>{const h=Math.floor(w/2);for(let b=-h;b<=h;b++)for(let a=-h;a<=h;a++)add(Math.round(x)+a,Math.round(y)+b);};
  const seg=(a,b,w)=>{const n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])*2));for(let t=0;t<=n;t++)brush(a[0]+(b[0]-a[0])*t/n,a[1]+(b[1]-a[1])*t/n,w);};
  const landings=[];for(let n=0;n<V.length;n++){const[x,y]=V[n];fill(x-3,y-3,x+3,y+3);landings.push({x:x+.5,y:y+.5});if(n>0)seg(V[n-1],V[n],3);}
  seg(V[V.length-1],[15,15],3);
  const nodes=landings.map((p,n)=>({id:n,...p,radius:3,shape:'square',width:6,depth:6}));nodes.push({id:nodes.length,...dais,radius:9,shape:'round'});
  const e=landings[0];return api.build(id,ep,cells,{nodes,edges:nodes.slice(1).map((n,j)=>[j,j+1,3]),entry:{x:e.x,y:e.y+1,node:0},bounds:[0,0,49,49],wallHeight:bp.outdoor?(bp.outdoor.wall??1):3.4,extra:{kind:'ascent',dais,landings:landings.slice(1),variant}});}

 // 실외: R74 모드·낮은 담·R98 장면 표식. R99 가 바닥 원화와 나무를, 이 모듈이 물결 면을 맡는다.
 function outdoor(L,bp,ep){const o=bp.outdoor;if(!o)return;if(L.worldR74)L.worldR74.mode='outdoor';const wall=o.wall??null;if(wall!=null)for(const w of L.walls||[]){if(!Number.isFinite(w.height))continue;w.r98BaseHeight=w.height;w.height=wall;}
  L.r98Scene={id:ep.host,mode:'outdoor',style:o.family,open:true,wall,family:o.family,applied:true,version:1,r105:{family:o.family,water:o.water||null,trees:o.trees||null}};
  L.voidCover={tint:o.water?'#06090d':'#0d100f',opacity:1,theme:o.family,r105:true};}

 function layoutFor(i,stage,ep,seed,api){const bp=BP[ep?.key]?.[stage];if(!bp||!api?.build)return null;const id=api.sid(i,stage),epx={...ep,style:bp.style||ep.style};
  let L=null;if(stage==='survival')L=arena(id,epx,bp,api);else if(stage==='maze')L=maze(id,epx,bp,seed,api);else L=ascent(id,epx,bp,api,i);
  if(!L)return null;L.samongR105={rev:REV,ep:ep.key,stage,title:bp.title||'',outdoor:bp.outdoor?{...bp.outdoor}:null,style:epx.style};outdoor(L,bp,ep);return L;}

 // ---- 소품·기록 표식 배치 -----------------------------------------------------------------------
 function spots(L,{gap=3,avoid=[],edge=true,limit=64}={}){const cells=new Set(L.floorCells.map(([x,y])=>K(x,y))),has=(x,y)=>cells.has(K(x,y)),cand=[],out=[];
  for(const[x,y]of L.floorCells){const e=!has(x+1,y)||!has(x-1,y)||!has(x,y+1)||!has(x,y-1);if(edge?!e:e)continue;cand.push({x:x+.5,y:y+.5,k:hash(L.id+':'+x+':'+y)});}
  cand.sort((a,b)=>a.k-b.k);
  for(const p of cand){if(out.length>=limit)break;if(avoid.some(q=>q&&Math.hypot(q.x-p.x,q.y-p.y)<(q.r||3)))continue;if(out.some(q=>Math.hypot(q.x-p.x,q.y-p.y)<gap))continue;out.push(p);}return out;}
 const near=(p,list,d)=>list.some(q=>q&&Math.hypot(q.x-p.x,q.y-p.y)<(q.r||d));
 function recordSpots(L,stage,avoid){const x=L.samongR103,out=[];
  if(stage==='maze'){for(const q of x.rooms||[])if(!near(q,avoid,3))out.push({x:q.x,y:q.y});const P=x.path||[];for(const f of[.18,.36,.52,.68,.84,.95]){const q=P[Math.min(P.length-1,Math.floor(f*(P.length-1)))];if(q&&!near(q,avoid,3)&&!out.some(o=>Math.hypot(o.x-q.x,o.y-q.y)<3))out.push({x:q.x+1,y:q.y+1});}}
  else if(stage==='ascent'){for(const q of x.landings||[])out.push({x:q.x+2,y:q.y-2});out.push({x:21.5,y:21.5},{x:9.5,y:21.5},{x:21.5,y:9.5},{x:15.5,y:22.5});}
  else{const e=L.entry,s=spots(L,{gap:4.5,avoid,limit:40}).sort((a,b)=>Math.hypot(a.x-e.x,a.y-e.y)-Math.hypot(b.x-e.x,b.y-e.y));out.push(...s);}
  return out.length?out:[{x:L.entry.x+1,y:L.entry.y}];}
 function marker(ep,stage,rec,at,n){const label=rec.label||TEXT()[rec.key]?.title||rec.key;return{id:'r105:rec:'+ep.key+':'+stage+':'+n,x:at.x,y:at.y,solid:false,autoTargetEligible6:false,visible:true,samongR103:'record',r74Prop:rec.prop||'crate',label,r105Record:{key:rec.key,at:rec.at??0,sub:rec.sub||null,n:rec.n||3,label}};}
 function dress(r,i,stage,ep,api){const L=r.exploration,bp=BP[ep?.key]?.[stage],x=L?.samongR103;if(!bp||!L?.samongR105||!x)return;
  if(L.samongR105.outdoor)delete r.r99Trees;// R99 가 길가에 나무를 심는다.
  const avoid=[{...L.entry,r:3.5},x.exit&&{...x.exit,r:3.5},x.save&&{...x.save,r:3},x.centre&&{...x.centre,r:2.5},x.dais&&{...x.dais,r:10.5},...(x.chests||[]).map(c=>({...c,r:2.2}))].filter(Boolean);
  const recs=[];for(const rec of bp.records||[]){if(rec.objects)rec.objects.forEach((label,n)=>recs.push({...rec,label,objectIndex:n}));else recs.push(rec);}
  const rs=recordSpots(L,stage,avoid);let n=0;for(const rec of recs){const at=rs[Math.min(n,rs.length-1)];n++;if(!at)continue;r.props.push(marker(ep,stage,rec,at,n));avoid.push({...at,r:2.2});}
  const wide=stage==='survival'?SURVIVAL_SCALE:stage==='maze'?MAZE_SCALE:1,deco=spots(L,{avoid,gap:wide>1?4:2.8,limit:Math.round(96*wide)});let d=0;for(const[cell,count0]of bp.props||[]){const count=Math.round(count0*wide);for(let k=0;k<count;k++){const at=deco[d++];if(!at)break;r.props.push({id:'r105:'+cell+':'+d,x:at.x,y:at.y,solid:false,autoTargetEligible6:false,visible:true,r74Prop:cell,r105Prop:cell});}}
  let a=0;try{a=window.__STORYWORLD_DRIVE_ART_R105__?.place?.(r,i,stage,ep,{deco:deco.slice(d),dais:x.dais})||0;}catch(e){fail(e);}// R105 드라이브 원화 조형물
  r.samongR105={title:bp.title||'',records:recs.length,props:d+a,art:a,outdoor:L.samongR105.outdoor};}

 // ---- 기록 표식 읽기 (원문 문단만, 해설 없음) -----------------------------------------------------
 let S5={version:VERSION,read:[]};const clean=v=>({version:VERSION,read:Array.isArray(v?.read)?v.read.filter(x=>typeof x==='string').slice(-256):[]});
 function rows(R){const s=TEXT()[R.key];if(!s)return[];const all=s.blocks.flatMap(b=>b.paras.map(t=>({t,n:b.narrator})));if(!all.length)return[];const n=Math.max(1,R.n||3);let at=0;
  if(R.sub){at=all.findIndex(v=>v.t.startsWith(R.sub));if(at<0)at=all.findIndex(v=>v.t.includes(R.sub));if(at<0)at=0;}
  else if(R.at==='last')at=Math.max(0,all.length-n);else if(typeof R.at==='number')at=R.at<=1?Math.floor(R.at*Math.max(0,all.length-n)):Math.min(all.length-1,R.at);
  return all.slice(at,at+n);}
 function use(p){const R=p?.r105Record;if(!R)return false;const list=rows(R);const s=TEXT()[R.key];if(!list.length||!s)return false;
  const SMo=SM(),i=typeof room!=='undefined'?room?.samongR103?.ep:null,ep=SMo?.episodes?.[i??-1]||{title:s.title,chapter:'',host:room?.id};
  const sc={id:ep.host,record:{title:ep.title,narrator:list[0].n,chapter:ep.chapter},part:'body',text:list.map(v=>v.t).join('\n\n'),title:s.title+(R.label&&R.label!==s.title?' · '+R.label:''),narrator:list[0].n?'〈'+list[0].n+'〉':'',chapter:ep.chapter,key:'DREAM:sm105:'+R.key+':'+p.id};
  const flag=R.key+':'+p.id;if(!S5.read.includes(flag)){S5.read.push(flag);if(S5.read.length>256)S5.read.shift();}
  try{if(typeof storyScene!=='undefined'&&storyScene&&Array.isArray(storyQueue))storyQueue.push(sc);else if(typeof playScenes==='function')playScenes([sc],null);else return false;}catch(e){fail(e);return false;}
  return true;}

 // ---- 777: 에피소드·단계·구간 이동 --------------------------------------------------------------
 const cheat=()=>window.__STORYWORLD_CHEAT777__?.active?.()===true;
 async function settle(){for(let t=0;t<80;t++){if(typeof loading==='undefined'||!loading)break;await new Promise(r=>setTimeout(r,100));}}
 function placeNear(p){if(typeof player==='undefined'||!player||typeof blocked!=='function')return false;for(const[dx,dy]of[[1.3,0],[-1.3,0],[0,1.3],[0,-1.3],[1,1],[-1,-1],[1,-1],[-1,1],[2,0],[0,2]]){const x=p.x+dx,y=p.y+dy;if(!blocked(x,y,.3,room)){player.x=x;player.y=y;try{cam={x,y};}catch(e){}return true;}}return false;}
 async function goStage(i,stage,opt={}){const SMo=SM();if(!SMo)return false;if(!cheat()&&!opt.force){say('777 코드를 먼저 적용하세요.',3);return false;}
  i=Math.max(0,Math.min(SMo.episodes.length-1,Number(i)|0));if(i===0)stage='ascent';if(!['survival','maze','ascent'].includes(stage))stage='survival';
  try{if(typeof modal!=='undefined'&&modal&&typeof closePanel==='function')closePanel(true);}catch(e){}
  let ok=false;try{ok=await SMo.go(i,stage);}catch(e){fail(e);}
  if(!ok){say('사몽 단계로 들어가지 못했습니다. 장면·전투가 끝난 뒤 다시 시도하세요.',4);return false;}
  await settle();
  if(opt.section){const p=(room?.props||[]).find(q=>q.r105Record?.key===opt.section)||null;if(p){placeNear(p);try{use(p);}catch(e){fail(e);}}}
  return true;}
 async function goSection(key){if(!SECTIONS.length)buildSections();const s=SECTIONS.find(v=>v.key===key);if(!s){say('알 수 없는 구간입니다: '+key,3);return false;}return goStage(s.ep,s.stage,{section:key});}
 function panelHTML(){const SMo=SM();if(!SMo)return'';if(!SECTIONS.length)buildSections();const eps=SMo.episodes;
  let h='<div class="divider"></div><div class="eyebrow">777 / 사몽·사몽역행 이동</div><p class="small">에피소드·단계로 바로 들어가거나, 원문 구간이 놓인 자리로 갑니다. 누적 처치·미로 씨앗·저장 규칙은 사몽 그대로이며 777 저장 슬롯에만 기록됩니다.</p>';
  h+='<label for="r105Ep">에피소드</label> <select id="r105Ep">'+eps.map((e,i)=>'<option value="'+i+'">'+i+' · '+esc(e.title)+'</option>').join('')+'</select> <select id="r105Stage"><option value="survival">생존 · 666</option><option value="maze">손전등 미로</option><option value="ascent">상승 · 보스</option></select> <button id="r105Go">사몽 단계 이동</button>';
  h+='<br><label for="r105Sec">원문 구간</label> <select id="r105Sec">'+SECTIONS.map(s=>'<option value="'+esc(s.key)+'">'+esc(s.key)+' · '+esc(s.title)+' — '+esc(eps[s.ep]?.title||'')+' / '+stageName(s.stage)+'</option>').join('')+'</select> <button id="r105SecGo">구간으로 이동</button>';
  h+='<p class="small">사몽 '+eps.length+' 에피소드 × 3단계(0 은 보스 단계만), 원문 '+SECTIONS.length+' 구간. 지역 선택은 위의 Story·Dream 목록을 씁니다.</p>';return h;}
 function inject(){try{const panel=document.getElementById('panel');if(!panel||document.getElementById('r105Cheat')||!document.getElementById('codeMap'))return;const div=document.createElement('div');div.id='r105Cheat';div.innerHTML=panelHTML();panel.appendChild(div);
   const q=id=>document.getElementById(id);q('r105Go').onclick=()=>goStage(q('r105Ep').value,q('r105Stage').value);q('r105SecGo').onclick=()=>goSection(q('r105Sec').value);}catch(e){fail(e);}}

 // ---- 실외 물결 면 (끊어진 다리·늪의 다리) --------------------------------------------------------
 function installWater(){const A=window.StoryPhase1,C=A?.ThreeRenderer?.prototype;if(!C||typeof C.render!=='function')return false;
  const DIR='assets/r99/outdoor/',FILE={swamp:'water-swamp',sea:'water-swamp',canal:'water-canal'},TINT={swamp:0xb8c4b0,sea:0x9cb4c8,canal:0xc4c4b4},DRIFT={swamp:[.006,.0035],sea:[.009,.005],canal:[.012,.002]};
  function drop(r){if(r.r105Water){try{r.spatialRoot?.remove(r.r105Water);r.r105Water.geometry?.dispose();}catch(e){}}r.r105Water=null;r.r105WaterKey=null;}
  function sync(r,frame){const o=frame?.exploration?.samongR105?.outdoor,kind=o?.water,T=r.T;if(!kind||!T||!r.spatialRoot){if(r.r105Water)r.r105Water.visible=false;return;}
   const key=frame.exploration.id+':'+kind;if(r.r105WaterKey!==key){drop(r);const b=frame.exploration.bounds,w=(b[2]-b[0])+140,h=(b[3]-b[1])+140;
    const tex=new T.TextureLoader().load(DIR+FILE[kind]+'.webp');tex.colorSpace=T.SRGBColorSpace;tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(w/7,h/7);
    const m=new T.MeshBasicMaterial({map:tex,color:TINT[kind],side:T.DoubleSide,toneMapped:false,depthWrite:false});m.name='r105-water-'+kind;
    const mesh=new T.Mesh(new T.PlaneGeometry(w,h),m);mesh.rotation.x=-Math.PI/2;mesh.position.set((b[0]+b[2])/2,-.08,(b[1]+b[3])/2);mesh.renderOrder=-3;mesh.name='r105-water';mesh.layers.set(2);mesh.userData={presentationOnly:true,r105Water:kind,collisionChanged:false};
    r.spatialRoot.add(mesh);r.spatialResources?.add(tex);r.spatialResources?.add(m);r.r105Water=mesh;r.r105WaterKey=key;stats.water++;}
   const mesh=r.r105Water;mesh.visible=true;const s=performance.now()/1000,d=DRIFT[kind];mesh.material.map.offset.set((s*d[0])%1,(s*d[1]+Math.sin(s*.35)*.004)%1);}
  const renderBase=C.render;C.render=function(frame){try{sync(this,frame);}catch(e){fail(e);}return renderBase.call(this,frame);};
  const clearBase=C.clearScene;C.clearScene=function(...a){try{drop(this);}catch(e){fail(e);}return clearBase.apply(this,a);};return true;}
 const stats={water:0};

 // ---- 설치 -----------------------------------------------------------------------------------
 let water=false;
 function install(){
  if(typeof openPanel==='function'){const b=openPanel;openPanel=function(html,...a){const r=b.call(this,html,...a);try{if(typeof html==='string'&&html.includes('id="codeMap"'))inject();}catch(e){fail(e);}return r;};}
  if(typeof serializeSave==='function'){const b=serializeSave;serializeSave=function(...a){const d=b.apply(this,a);try{d.samongMapsR105=JSON.parse(JSON.stringify(S5));}catch(e){fail(e);}return d;};}
  if(typeof restoreSave==='function'){const b=restoreSave;restoreSave=async function(raw,...a){const prior=S5;S5=clean(raw?.samongMapsR105);try{const r=await b.call(this,raw,...a);if(r===false)S5=prior;return r;}catch(e){S5=prior;throw e;}};}
  if(typeof newGame==='function'){const b=newGame;newGame=async function(...a){const prior=S5;S5=clean(null);try{return await b.apply(this,a);}catch(e){S5=prior;throw e;}};}
  // 777 객체는 동결되어 있어 같은 모양으로 다시 감싼다(기존 필드는 모두 유지).
  const native=window.__STORYWORLD_CHEAT777__;if(native&&!native.samongR105){try{window.__STORYWORLD_CHEAT777__=Object.freeze({...native,samongR105:true,goSamong:goStage,goSection,samongSections:()=>buildSections().map(s=>({...s}))});}catch(e){fail(e);}}
  try{water=installWater();}catch(e){fail(e);}
 }
 try{install();}catch(e){fail(e);}
 function inspect(){return{revision:REV,failures,lastError,water,stats:{...stats},state:JSON.parse(JSON.stringify(S5)),sections:buildSections().length,blueprints:Object.keys(BP).length,current:typeof room!=='undefined'?room?.samongR105||null:null};}
 window.__STORYWORLD_SAMONG_MAPS_R105__=Object.freeze({revision:REV,blueprints:BP,sections:buildSections,layoutFor,dress,use,rows,goStage,goSection,panelHTML,inspect,stageName,state:()=>S5});
})();
