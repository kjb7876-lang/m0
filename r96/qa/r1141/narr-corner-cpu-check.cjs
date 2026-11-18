// R1141 서사 글 오른쪽 아래 상자 — CPU 검사. 사용자 2026-11-18 "오른쪽아래 초록원그린곳에 서사 텍스트 나오게 나머지부분은 전투화면으로
//  서사텍스트끄기도 설정안에 바로보이게 전투에집중할수있게 개선".
//  상자 자리 계산(place)을 실제 폰·PC 배치 수치로 재고, 연결 다섯 곳(태그·런타임 사본·sync 목록·공개 확인 목록·CI 줄)과 서사 글을 바꾸지 않음을 본다.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'..','..','..'),R=path.join(ROOT,'r96');
let n=0,bad=0;const ok=(m,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m+(d!==undefined&&!c?' :: '+JSON.stringify(d):''));};
const F='narrative-corner-r1141.js',P=path.join(R,'client-source',F);
const src=fs.existsSync(P)?fs.readFileSync(P,'utf8'):'';
ok('모듈 파일이 있음 (client-source/'+F+')',src.length>0);
let A=null;if(src){try{const win={};const ctx={window:win,console,setTimeout(){},setInterval(){},addEventListener(){},localStorage:{getItem:()=>null,setItem(){}}};ctx.globalThis=ctx;vm.createContext(ctx);vm.runInContext(src,ctx);A=win.__STORYWORLD_NARR_CORNER_R1141__;}catch(e){ok('모듈이 문서 없이도 읽힘',false,String(e));}}
ok('API __STORYWORLD_NARR_CORNER_R1141__ 이 있음',!!A);
const place=A&&A.place;ok('자리 계산 함수 place 가 있음',typeof place==='function');
const R_=(l,t,r,b)=>({left:l,top:t,right:r,bottom:b,width:r-l,height:b-t});
const inter=(a,b)=>a.left<b.right&&b.left<a.right&&a.top<b.bottom&&b.top<a.bottom;
const box=(q,vh)=>q?R_(q.left,vh-q.bottom-q.maxHeight,q.left+q.width,vh-q.bottom):null;
if(typeof place==='function'){
 // ① 폰 세로 390×844 (실측: 영웅 카드 8,726~148,797 · 동그라미 322,618~380,744 · H 본진 312,554~382,598 · 아래 안내줄 806)
 const ph={vw:390,vh:844,phone:true,hero:R_(8,726,148,797),btns:[R_(322,618,380,744),R_(312,554,382,598)],shelf:R_(0,806,390,844),stage:R_(0,0,390,806)};
 const q=place(ph),b=box(q,844);
 ok('폰: 상자 자리가 숫자로 나옴',q&&[q.left,q.width,q.bottom,q.maxHeight].every(Number.isFinite),q);
 ok('폰: 상자가 영웅 구슬 카드 오른쪽에서 시작',b&&b.left>=148+4,b);
 ok('폰: 상자가 화면 오른쪽 안에 들어옴',b&&b.right<=390-4,b);
 ok('폰: 상자 바닥이 아래 안내줄 위',b&&b.bottom<=806-2,b);
 ok('폰: 상자가 회피·배치 동그라미와 겹치지 않음',b&&!ph.btns.some(x=>inter(b,x)),b);
 ok('폰: 상자가 영웅 카드와 겹치지 않음',b&&!inter(b,ph.hero),b);
 ok('폰: 사용자가 표시한 오른쪽 아래(가로 절반 오른쪽·세로 아래 1/4)에 있음',b&&(b.left+b.right)/2>390*0.5&&b.top>=844*0.75,b);
 ok('폰: 글 세 줄이 들어갈 높이(44px 이상)',q&&q.maxHeight>=44,q);
 ok('폰: 상자 너비 150px 이상',q&&q.width>=150,q);
 // ② 작은 폰 375×667
 const sm={vw:375,vh:667,phone:true,hero:R_(8,549,148,620),btns:[R_(307,441,365,567)],shelf:R_(0,629,375,667),stage:R_(0,0,375,629)};
 const q2=place(sm),b2=box(q2,667);
 ok('작은 폰: 동그라미·카드와 안 겹치고 안내줄 위',b2&&!sm.btns.some(x=>inter(b2,x))&&!inter(b2,sm.hero)&&b2.bottom<=629-2&&b2.right<=375-4,b2);
 // ③ 폰 가로 844×390: 동그라미 세로줄 아래 자리가 없으면 동그라미 왼쪽으로
 const ls={vw:844,vh:390,phone:true,hero:R_(8,300,148,371),btns:[R_(776,150,834,330),R_(766,90,836,134)],shelf:R_(0,352,844,390),stage:R_(0,0,844,352)};
 const q3=place(ls),b3=box(q3,390);
 ok('폰 가로: 동그라미·카드와 안 겹치고 오른쪽 아래(가로 절반 오른쪽)',b3&&!ls.btns.some(x=>inter(b3,x))&&!inter(b3,ls.hero)&&b3.bottom<=352-2&&(b3.left+b3.right)/2>844*0.5&&q3.maxHeight>=44,b3);
 // ④ PC 1280×720 (실측: 아래 줄 606~ · 단축칸 322~772 · 오른쪽 아래 각성·패시브 강화 1080,633~1262,692)
 const pc={vw:1280,vh:720,phone:false,footer:R_(0,606,1280,720),hotbar:R_(322,624,772,701),footRight:R_(1080,633,1262,692),stage:R_(0,44,1280,720)};
 const q4=place(pc),b4=box(q4,720);
 ok('PC: 상자가 오른쪽 아래 구석(가로 오른쪽 1/3)',b4&&b4.left>=1280*0.6&&b4.right<=1280-8,b4);
 ok('PC: 상자가 아래 단축칸·패시브 강화 줄 위에 있음',b4&&b4.bottom<=606-2&&!inter(b4,pc.hotbar)&&!inter(b4,pc.footRight),b4);
 ok('PC: 상자가 화면 가운데(전투 자리)를 덮지 않음',b4&&!inter(b4,R_(1280*0.3,720*0.2,1280*0.7,720*0.8)),b4);
 ok('PC: 상자 높이가 화면 1/3 이하',q4&&q4.maxHeight<=720/3,q4);
 // ⑤ 경계값: 막는 것 없음·아주 좁은 화면에서도 숫자가 깨지지 않음
 const q5=place({vw:320,vh:480,phone:true,btns:[],stage:R_(0,0,320,480)});
 ok('경계: 막는 것이 없어도 화면 안·숫자 정상',q5&&q5.left>=0&&q5.left+q5.width<=320&&q5.bottom>=0&&q5.maxHeight>=44,q5);
 const q6=place({vw:0,vh:0,phone:true,btns:[]});
 ok('경계: 0 크기 화면에서도 NaN 없음',q6&&[q6.left,q6.width,q6.bottom,q6.maxHeight].every(Number.isFinite),q6);
}
// ⑥ 설정 맨 위 '서사 텍스트' 켜고 끄기: 같은 설정(R1021 subs)을 쓴다 — 새 저장 키를 만들지 않음
ok('설정 맨 위 단추가 R1021 서사 자막 설정을 함께 씀',/__STORYWORLD_UI_COMBAT_R1021__/.test(src)&&/set\(\s*'subs'/.test(src));
ok('설정 단추 글이 \'서사 텍스트\'',/서사 텍스트/.test(src));
ok('설정 단추는 BUTTON 이고 설정 제목 바로 위에 붙음(R1021 스킬창 맨 위 규칙 유지)',/createElement\('button'\)/.test(src)&&/insertBefore\([^)]*h2/.test(src));
// ⑦ 서사 글 자체는 바꾸지 않음: 원래 자막 칸에 글을 쓰지 않는다
ok('원래 자막·곡 소개 칸의 글을 바꾸지 않음',!/(r600Subs|r370Subs|r331BgmNote)[^;\n]*\.(textContent|innerHTML|innerText)\s*=[^=]/.test(src));
ok('원래 칸은 display 가 아니라 visibility 로 감춤(R1021·R1037 끄기 검사 유지)',/visibility:hidden/.test(src)&&!/#r600Subs[^{}]*\{[^}]*display:none/.test(src));
ok('전체 영화 화면(R376)에서는 원래 자막 그대로',/r376cine/.test(src));
// ⑧ 연결 다섯 곳
const rt=path.join(R,'runtime-text',F);ok('런타임 사본이 같음',fs.existsSync(rt)&&fs.readFileSync(rt,'utf8')===src);
const html=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');
ok('index.html 스크립트 태그가 한 번, R1021 바로 다음 줄(R1021 설정 묶음이 먼저 생김) · 끝 태그 규칙(combat-r118 앞)',html.split('"./'+F+'"').length===2&&html.includes('<script src="./ui-combat-r1021.js"></script>\n<script src="./'+F+'"></script>')&&html.indexOf('./'+F+'"')<html.indexOf('<script src="./combat-r118.js">'));
ok('runtime-manifest 에 들어감',fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8').includes('"'+F+'"'));
ok('공개 확인 목록(verify-r96-public.py)에 들어감',fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8').includes("'"+F+"'"));
ok('CI(pages.yml)에서 이 검사를 돌림',fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8').includes('r96/qa/r1141/narr-corner-cpu-check.cjs'));
console.log((bad?'R1141 FAILED ':'R1141 PASSED ')+(n-bad)+'/'+n);process.exit(bad?1:0);
