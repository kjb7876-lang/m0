// R1375 정적 검사: 교주의 사몽(STORY) 지배 연결 대수문장 6마리 동시 소환 덧씌우기 연결(브라우저 동작은 cosmic-six-browser.mjs).
const fs=require('fs');let n=0,bad=0;const ok=(c,m)=>{n++;if(!c)bad++;console.log((c?'ok  ':'FAIL')+' '+m);};
const js=fs.readFileSync('r96/client-source/cosmic-six-r1375.js','utf8'),html=fs.readFileSync('r96/runtime-text/index.html','utf8');
const tags=[...html.matchAll(/<script src="\.\/([^"]+)"/g)].map(m=>m[1]);
ok(tags.filter(t=>t==='cosmic-six-r1375.js').length===1,'index.html 에 스크립트 태그 1개');
ok(tags.indexOf('cosmic-six-r1375.js')>tags.indexOf('finale-r950.js')&&tags.indexOf('finale-r950.js')>=0,'R950(spawnCosmic3 감싸기) 뒤');
ok(/R1375-cosmic-six-1/.test(js)&&/storyworld\.r1375\.cosmicSix/.test(js),'개정·끄기 키');
ok(/spawnCosmic3/.test(js)&&/finishEncounter/.test(js)&&/killEnemy/.test(js),'spawnCosmic3·finishEncounter·killEnemy 감싸기');
ok(/layer==='STORY'/.test(js)&&!/layer==='DREAM'/.test(js),'STORY 층만(DREAM 시련은 R1114)');
ok(/runtime-inputs/.test('runtime-inputs')&&/cosmic-six-r1375\.js/.test(fs.readFileSync('r96/runtime-inputs.json','utf8')),'runtime-inputs 에 들어감');
ok(/'cosmic-six-r1375\.js'/.test(fs.readFileSync('scripts/verify-r96-public.py','utf8')),'공개 검사 목록');
// 자리: R950 신경선 방향 6갈래, 반지름 5.6 → 이웃 간격 5.6
const R=5.6;let md=1e9;const P=[...Array(6)].map((_,i)=>{const a=-Math.PI/2+i*Math.PI/3+.35;return[Math.cos(a)*R,Math.sin(a)*R];});
for(let i=0;i<6;i++)for(let j=i+1;j<6;j++)md=Math.min(md,Math.hypot(P[i][0]-P[j][0],P[i][1]-P[j][1]));
ok(/RADIUS=5\.6/.test(js)&&md>=4,'기본 자리 서로 4칸 이상 ('+md.toFixed(2)+')');
console.log(`${n-bad}/${n}`);process.exit(bad?1:0);
