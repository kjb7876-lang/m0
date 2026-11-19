'use strict';
// R1240 영웅 변경창 맞춤: 영웅 칸·확정 단추가 큰 무대 아래로 밀려 안 보이던 문제. 빌드 연결 + 순수 높이 계산 + 규칙 정적 검사.
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;
const ok=(c,m,d)=>{n++;if(!c){bad++;console.log('FAIL',m,d!==undefined?JSON.stringify(d).slice(0,240):'');}else console.log('ok  ',m);};
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return'';}};
const N='hero-fit-r1240.js';
const html=rd(path.join(R,'runtime-text/index.html')),man=rd(path.join(R,'runtime-manifest.json')),inp=rd(path.join(R,'runtime-inputs.json')),src=rd(path.join(R,'client-source',N));
ok(src.length>0,N+' 존재');ok(src.length>0&&rd(path.join(R,'runtime-text',N))===src,N+' runtime-text 사본 = client-source');
ok(rd(path.join(ROOT,'scripts/verify-r96-public.py')).includes("'"+N+"'"),N+' verify-r96-public.py 기대 목록');ok(man.includes(N)&&inp.includes(N),N+' runtime-manifest·inputs');
const t=x=>html.indexOf('<script src="./'+x+'"></script>');
ok(t(N)>t('hero-row-r1106.js')&&t('hero-row-r1106.js')>0&&t(N)<t('boot-lean-r1038.js')&&t(N)<t('nav-r176.js'),'index.html: hero-row-r1106 뒤, boot-lean-r1038·nav-r176 앞');
ok(rd(path.join(ROOT,'.github/workflows/pages.yml')).includes('node r96/qa/r1240/r1240-cpu-check.cjs'),'pages.yml CPU 검사 줄');
// 순수 함수: 창 없이 실행
const win={localStorage:{getItem:()=>null,setItem(){}},addEventListener(){},innerWidth:1366,innerHeight:640};win.window=win;
vm.runInNewContext(src,{window:win,localStorage:win.localStorage,setInterval(){},setTimeout(){},document:undefined,getComputedStyle(){return{};}});
const F=win.__STORYWORLD_HERO_FIT_R1240__;ok(!!F&&typeof F.nextHeight==='function','API 와 순수 nextHeight');
if(F){const h=F.nextHeight;
 ok(h(300,300,100)===194,'넘친 100px → 무대 300 → 194(여유 6px)',h(300,300,100));
 ok(h(300,300,400)===F.MIN,'크게 넘쳐도 최저 높이('+F.MIN+'px) 아래로는 줄이지 않음',h(300,300,400));
 ok(h(300,F.MIN,50)===null,'이미 최저면 더 줄이지 않음(→ 한 줄 띠 단계로 넘어감)',h(300,F.MIN,50));
 ok(h(300,300,0)===null&&h(300,300,-500)===null,'넘치지 않고 원래 크기면 그대로',[h(300,300,0),h(300,300,-500)]);
 ok(h(300,200,-10)===null,'남는 자리가 조금(24px 이하)이면 키우지 않음(흔들림 방지)',h(300,200,-10));
 ok(h(300,200,-60)===248&&h(300,200,-500)===300,'자리가 넉넉하면 키우되 원래 크기까지만',[h(300,200,-60),h(300,200,-500)]);
 ok([h(0,200,10),h(300,0,10),h(300,200,NaN),h(NaN,200,10)].every(v=>v===null),'NaN·0 입력은 손대지 않음');}
// 규칙
ok(!/display:none[^}]*data-hero|\[data-hero\][^{]*\{[^}]*display:none/.test(src)&&!/\.remove\(\)/.test(src),'영웅 칸·무대를 숨기거나 지우지 않음');
ok(/#chooseHero/.test(src)&&/#slotConfirmR73/.test(src),'확정 단추(변경·시작)도 창 안에 들어오게 잼');
ok(!/player\.hero\s*=|showHeroes\s*=/.test(src),'영웅 바꾸는 일(엔진·EGO·페르소나)은 건드리지 않음');
ok(!/drop-shadow|blur\(/.test(src),'게임 ctx.filter 금지 필터 안 씀');
ok(/storyworld\.r1240\.heroFit/.test(src),'끄기 열쇠');
// 히든 영웅 확정 경쟁(창이 다시 그려져 히든 칸이 잠깐 없는 순간 확정): EGO·페르소나 의도 + 기본 영웅 선택이면 히든 영웅으로
{const e=rd(path.join(R,'client-source/ego-sovereign-r1046.js')),q=rd(path.join(R,'client-source/persona-hero-r1113.js'));
 ok(/\[data-ego-r1046\]\.selected'\)\|\|\(want&&document\.querySelector\('#panel \[data-hero="'\+P\.base\+'"\]\.selected'\)\)/.test(e),'R1046: EGO 칸이 다시 끼워지기 전 확정해도 EGO(want+환도 선택)');
 ok(/\[data-persona-r1113\]\.selected'\)\|\|\(want&&document\.querySelector\('#panel \[data-hero="'\+BASE\+'"\]\.selected'\)\)/.test(q),'R1113: 페르소나 칸이 다시 끼워지기 전 확정해도 페르소나(want+라우렌 선택)');}
{const v=rd(path.join(R,'client-source/nav-r176.js'));ok(/hadBar=!!\(was&&document\.getElementById\('r176Nav'\)\)/.test(v)&&/else if\(hadBar&&!current&&stack\.length&&ready\(\)&&!story\(\)\)bar\(\);/.test(v),'R176: 뒤로·앞으로 줄이 있던 창을 제자리에서 다시 그리면 줄을 다시 붙임(영웅 칸 누를 때 창 내용이 위로 튀지 않음)');}
console.log(`\nR1240 cpu: ${n-bad}/${n} 통과`);process.exit(bad?1:0);
