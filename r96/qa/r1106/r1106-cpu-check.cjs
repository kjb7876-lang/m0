'use strict';
// R1106 폰 화면 영웅 선택창: 영웅 줄을 무대 위·한 줄 가로 띠로(작은 화면만). 빌드 연결 + CSS·이동 규칙 정적 검사.
const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;
const ok=(c,m,d)=>{n++;if(!c){bad++;console.log('FAIL',m,d!==undefined?JSON.stringify(d).slice(0,240):'');}else console.log('ok  ',m);};
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return'';}};
const N='hero-row-r1106.js';
const html=rd(path.join(R,'runtime-text/index.html')),man=rd(path.join(R,'runtime-manifest.json')),inp=rd(path.join(R,'runtime-inputs.json')),src=rd(path.join(R,'client-source',N));
ok(src.length>0,N+' 존재');ok(src.length>0&&rd(path.join(R,'runtime-text',N))===src,N+' runtime-text 사본 = client-source');
ok(rd(path.join(ROOT,'scripts/verify-r96-public.py')).includes("'"+N+"'"),N+' verify-r96-public.py 기대 목록');ok(man.includes(N)&&inp.includes(N),N+' runtime-manifest·inputs');
const t=x=>html.indexOf('<script src="./'+x+'"></script>');
ok(t(N)>t('ego-secret-r1057.js')&&t('ego-secret-r1057.js')>0&&t(N)<t('boot-lean-r1038.js')&&t(N)<t('nav-r176.js'),'index.html: ego-secret-r1057 뒤, boot-lean-r1038·nav-r176 앞(R176 순서 검사: nav 뒤에는 정해진 파일만)');
ok(rd(path.join(ROOT,'.github/workflows/pages.yml')).includes('node r96/qa/r1106/r1106-cpu-check.cjs'),'pages.yml CPU 검사 줄');
// 규칙
ok(/\(max-height:620px\),\(max-width:700px\)/.test(src),'작은 화면 조건: 높이 620px 이하 또는 폭 700px 이하');
ok(/flex-wrap:nowrap/.test(src)&&/overflow-x:auto/.test(src),'영웅 줄 한 줄 가로 띠 + 줄 안 가로 스크롤');
ok(!/display:none[^}]*data-hero|data-hero[^{]*\{[^}]*display:none/.test(src),'영웅 칸을 숨기지 않음');
ok(/row\.after\(st\)/.test(src)&&/row\.before\(st\)/.test(src),'작은 화면은 무대를 줄 뒤로, 큰 화면은 원래 자리로');
ok(!/drop-shadow|blur\(/.test(src),'게임 ctx.filter 금지 필터 안 씀');
console.log(`\nR1106 cpu: ${n-bad}/${n} 통과`);process.exit(bad?1:0);
