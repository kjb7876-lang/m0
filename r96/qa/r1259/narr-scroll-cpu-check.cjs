// R1259 서사 글 스크롤바 다듬기 — CPU 검사. 사용자 2026-11-20 "서사텍스트 내릴때 휠나오는 부분개선해줘 디자인".
//  페이드 상태 계산(stateOf)·종이색 읽기(paperOf)의 정상·경계·회귀 사례, 얇은 막대 CSS, 연결 다섯 곳(태그·sync 목록 둘·공개 확인·CI 줄),
//  서사 글·스크롤 동작을 건드리지 않음(글 쓰기·overflow·wheel 막기 없음)을 본다.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'..','..','..'),R=path.join(ROOT,'r96');
let n=0,bad=0;const ok=(m,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m+(d!==undefined&&!c?' :: '+JSON.stringify(d):''));};
const F='narrative-scroll-r1259.js',P=path.join(R,'client-source',F);
const src=fs.existsSync(P)?fs.readFileSync(P,'utf8'):'';
ok('모듈 파일이 있음 (client-source/'+F+')',src.length>0);
// 가짜 문서: style 태그에 들어간 CSS 를 모은다
let cssText='';const styles=[];
const doc={readyState:'complete',getElementById:id=>styles.find(s=>s.id===id)||null,createElement:()=>{const s={id:'',textContent:''};return s;},
 head:{appendChild:s=>{styles.push(s);cssText+=s.textContent;}},documentElement:{appendChild(){}},addEventListener(){},querySelectorAll:()=>[]};
let A=null;if(src){try{const win={};const ctx={window:win,document:doc,console,setTimeout(){},setInterval(){},getComputedStyle:()=>({})};ctx.globalThis=ctx;vm.createContext(ctx);vm.runInContext(src,ctx);A=win.__STORYWORLD_NARR_SCROLL_R1259__;}catch(e){ok('모듈이 가짜 문서에서 읽힘',false,String(e));}}
ok('API __STORYWORLD_NARR_SCROLL_R1259__ 이 있음',!!A);
const st=A&&A.stateOf,pp=A&&A.paperOf;
ok('stateOf·paperOf 함수가 있음',typeof st==='function'&&typeof pp==='function');
if(typeof st==='function'){
 const E=(sh,ch,t)=>({scrollHeight:sh,clientHeight:ch,scrollTop:t});
 ok('넘치지 않으면 페이드 없음',st(E(200,200,0))==='');
 ok('경계: 2px 이하로 넘치면 페이드 없음(반올림 흔들림)',st(E(202,200,0))==='');
 ok('경계: 3px 넘치면 맨 위에서 아래 페이드',st(E(203,200,0))==='bot');
 ok('맨 위 → 아래 페이드만',st(E(600,200,0))==='bot');
 ok('가운데 → 위·아래',st(E(600,200,150))==='both');
 ok('맨 아래 → 위 페이드만',st(E(600,200,400))==='top');
 ok('경계: 끝에서 1px 모자람 → 위 페이드만',st(E(600,200,399))==='top');
 ok('경계: 위에서 2px 내려옴 → 아직 아래만',st(E(600,200,2))==='bot');
 ok('회귀: 끝을 넘은 scrollTop(관성 튐) → 위 페이드만',st(E(600,200,430))==='top');
 ok('회귀: 음수 scrollTop(iOS 당김) → 아래 페이드만',st(E(600,200,-30))==='bot');
 ok('회귀: NaN 값 → 던지지 않고 빈 값',(()=>{try{return st(E(NaN,200,NaN))==='';}catch(_){return false;}})());
}
if(typeof pp==='function'){
 ok('바탕 없음(투명·그림 없음) → null(mask 페이드)',pp({backgroundColor:'rgba(0, 0, 0, 0)',backgroundImage:'none'})===null);
 ok('불투명 배경색 → 그 색',pp({backgroundColor:'rgb(233, 228, 216)',backgroundImage:'none'})==='rgb(233,228,216)');
 ok('쪽지 종이 그라데이션 → 마지막 불투명 색',pp({backgroundColor:'rgba(0, 0, 0, 0)',backgroundImage:'linear-gradient(172deg, rgb(239, 228, 207), rgb(217, 197, 166))'})==='rgb(217,197,166)');
 ok('회귀: 끝이 투명한 얼룩(먹 번짐) 뒤의 불투명 색을 고름',pp({backgroundColor:'rgba(0, 0, 0, 0)',backgroundImage:'radial-gradient(rgba(89, 94, 101, 0.18), rgba(89, 94, 101, 0)), rgb(18, 22, 28)'})==='rgb(18,22,28)');
 ok('경계: 반투명 배경색(.5)만 있으면 바탕 없음으로',pp({backgroundColor:'rgba(10, 8, 10, 0.5)',backgroundImage:'none'})===null);
 ok('색 공백 구분(rgb(1 2 3 / .9)) 도 읽음',pp({backgroundColor:'rgb(1 2 3 / 0.9)',backgroundImage:'none'})==='rgb(1,2,3)');
}
// CSS
ok('얇은 막대 CSS 가 들어감(4px)',/::-webkit-scrollbar\{width:4px/.test(cssText),cssText.slice(0,120));
ok('막대 바탕(트랙) 투명',/::-webkit-scrollbar-track\{background:transparent/.test(cssText));
ok('화살표 단추 없앰',/::-webkit-scrollbar-button\{display:none/.test(cssText));
ok('막대 대상에 쪽지 창·한 장·서사 창·창 안쪽이 모두 들어감',['#r177Doc','#r177Doc .pg','#panel','#panel *'].every(s=>A&&A.BAR.includes(s)));
ok('페이드 대상에 쪽지 한 장·한 번에 보기·서사 창이 들어감',['#r177Doc .pg','#r177Doc:not(.r182pages)','#panel .storyText'].every(s=>A&&A.FADE.includes(s)));
ok('창(#panel) 자체에는 페이드를 주지 않음(제목·단추 보호)',A&&!A.FADE.includes('#panel'));
ok('수묵 UI(R1085) 막대 규칙보다 우선순위가 높음(id 3개)',/html:not\(#r1259a\):not\(#r1259b\):not\(#r1259c\)/.test(cssText));
ok('밝은 종이·한지 바탕은 먹색 막대',/r1086Hanji[^{]*#panel\{--r1259thumb:rgba\(40,30,22/.test(cssText)||/#r177Doc\.note[^{]*\{--r1259thumb:rgba\(40,30,22/.test(cssText));
ok('파이어폭스용 얇은 표준 막대(웹킷 없는 곳만)',/@supports not selector\(::-webkit-scrollbar\)\{[^}]*scrollbar-width:thin/.test(cssText));
ok('종이 칸 페이드는 자리 차지 없음(height:0 + border-image)',/::before,[^{]*::after\{[^}]*height:0[^}]*border-image-slice:0 fill/.test(cssText));
// 건드리지 않음
const code=src.replace(/\/\/[^\n]*/g,'');
ok('서사 글을 쓰지 않음(스타일 태그 말고는 textContent=·innerHTML 없음)',!/innerHTML/.test(code)&&(code.match(/textContent\s*=/g)||[]).length===(code.match(/\bs\.textContent\s*=/g)||[]).length);
ok('overflow·크기를 바꾸지 않음',!/overflow\s*:|max-height|maxHeight|\.height\s*=/.test(code));
ok('휠·터치를 막지 않음(preventDefault·wheel·touch 없음)',!/preventDefault|'wheel'|touch/.test(code));
ok('스크롤 위치를 바꾸지 않음(scrollTop= 없음)',!/scrollTop\s*=[^=]/.test(code));
// 연결 다섯 곳
const rd=p=>{try{return fs.readFileSync(path.join(ROOT,p),'utf8');}catch(_){return '';}};
const html=rd('r96/runtime-text/index.html');const lines=html.split('\n');const i=lines.findIndex(l=>l.trim()==='<script src="./'+F+'"></script>');
ok('index.html 에 태그가 있음',i>=0);
ok('태그가 narrative-corner-r1141.js 바로 다음 줄',i>0&&lines[i-1].trim()==='<script src="./narrative-corner-r1141.js"></script>',lines[i-1]);
ok('runtime-inputs.json 에 들어감',rd('r96/runtime-inputs.json').includes(F)||rd('r96/runtime-text/runtime-inputs.json').includes(F)||rd('runtime-inputs.json').includes(F));
ok('runtime-manifest.json 에 들어감',rd('r96/runtime-manifest.json').includes(F)||rd('r96/runtime-text/runtime-manifest.json').includes(F)||rd('runtime-manifest.json').includes(F));
ok('공개 확인 목록(verify-r96-public.py)에 들어감',rd('scripts/verify-r96-public.py').includes("'"+F+"'"));
ok('CI(pages.yml)에 이 검사 줄이 있음',rd('.github/workflows/pages.yml').includes('node r96/qa/r1259/narr-scroll-cpu-check.cjs'));
console.log(`${n-bad}/${n} 통과`);process.exit(bad?1:0);
