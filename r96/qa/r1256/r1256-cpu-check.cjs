// R1256 CPU 검사: 서사 영상(r880 선화 컷신·입장 영상)에서 '음성 앞으로 끄기'(R1223) 단추가 '건너뛰기'와 겹치면 옆으로 비켜 서는 자리 계산.
//  실행: node r96/qa/r1256/r1256-cpu-check.cjs   (브라우저 실측은 r1256-browser.mjs)
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const SRC=fs.readFileSync(path.join(__dirname,'../../client-source/memory-voice-r1223.js'),'utf8');
const res=[];const check=(n,ok,d='')=>{res.push({n,ok:!!ok});console.log((ok?'PASS ':'FAIL ')+n+(d!==''?' :: '+d:''));};
const ctx={console,Math,JSON,Object,Array,String,Number,Error,Event:function(t){this.type=t;},performance:{now:()=>0},localStorage:{getItem:()=>null,setItem(){}},setInterval(){}};ctx.window=ctx;
vm.createContext(ctx);try{vm.runInContext(SRC,ctx,{filename:'memory-voice-r1223.js'});}catch(e){check('모듈 실림',false,String(e));}
const P=ctx.__STORYWORLD_MEMORY_VOICE_R1223__?.place;
check('자리 계산 함수가 있음(place)',typeof P==='function');
const box=(l,t,w,h)=>({left:l,top:t,right:l+w,bottom:t+h,width:w,height:h});
const hit=(a,b,g=0)=>a.left<b.right+g&&b.left<a.right+g&&a.top<b.bottom+g&&b.top<a.bottom+g;
const inView=(a,vw,vh)=>a.left>=0&&a.top>=0&&a.right<=vw&&a.bottom<=vh;
function run(n,sk,bw,bh,vw,vh,want){if(typeof P!=='function')return check(n,false,'no place');const r=P(sk,bw,bh,vw,vh);const b=r&&box(r.left,r.top,bw,bh);
 const ok=!!b&&Number.isFinite(r.left)&&Number.isFinite(r.top)&&!hit(b,sk,4)&&inView(b,vw,vh)&&(!want||want(b,r));check(n,ok,JSON.stringify(r));return b;}
// 정상: r880 실측(1280×720, 건너뛰기 오른쪽 위 101×36, 음성 단추 131×26) → 같은 줄 왼쪽
run('① 1280×720 오른쪽 위 건너뛰기 → 같은 줄 왼쪽에 섬',box(1141,17,101,36),131,26,1280,720,(b)=>b.right<=1141-4&&Math.abs((b.top+b.bottom)/2-35)<=1);
run('① 812×375 모바일 가로 → 같은 줄 왼쪽',box(687,12,101,36),131,26,812,375,(b)=>b.right<=687-4&&b.top<48);
run('① 1920×1080 → 같은 줄 왼쪽',box(1762,26,100,36),131,27,1920,1080,(b)=>b.right<=1762-4);
// 경계: 왼쪽 자리가 모자라면 아래로(위쪽 건너뛰기), 위로(아래쪽 건너뛰기)
run('② 좁은 화면(240 폭) 위쪽 건너뛰기 → 아래로 비킴',box(120,12,101,36),131,26,240,400,(b)=>b.top>=48+4);
run('② 좁은 화면 아래쪽 건너뛰기 → 위로 비킴',box(120,352,101,36),131,26,240,400,(b)=>b.bottom<=352-4);
run('② 왼쪽 끝 딱 맞는 폭(여백 6) → 왼쪽 자리 씀',box(6+131+8,12,101,36),131,26,400,300,(b)=>b.left>=6&&b.top<48);
run('② 왼쪽 1px 모자람 → 아래로',box(6+131+7,12,101,36),131,26,400,300,(b)=>b.top>=48+4);
// 회귀: 값이 이상해도 NaN/Infinity 를 내지 않음
if(typeof P==='function'){const r=P(box(NaN,NaN,0,0),131,26,0,0);check('③ 잘못된 값이면 null(자리 안 바꿈)',r===null,JSON.stringify(r));
 const r2=P(box(10,10,50,20),0,0,800,600);check('③ 단추 크기 0 이면 null',r2===null,JSON.stringify(r2));}
// 회귀: 건너뛰기·음성 DOM 순서(R1223 ⑥ 검사 '건너뛰기 옆')는 그대로 — 소스에 insertBefore(button(),sk) 남음
check('④ 단추는 여전히 건너뛰기 바로 앞에 끼움',/r\.insertBefore\(button\(\),sk\|\|null\)/.test(SRC));
check('④ 겹칠 때만 옮김(겹치지 않는 입장 영상은 원래 자리)',/function unclash\(/.test(SRC)&&/unclash\(/.test(SRC.slice(SRC.indexOf('function step(')))) ;
const failed=res.filter(r=>!r.ok).length;console.log(JSON.stringify({total:res.length,failed}));process.exit(failed?1:0);
