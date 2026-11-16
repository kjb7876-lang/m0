// R1114 정적 검사: 교주 사몽 시련 보스 6마리 동시 소환 덧씌우기가 연결돼 있는지(브라우저 동작은 r1114-browser.mjs).
const fs=require('fs');let n=0,bad=0;const ok=(c,m)=>{n++;if(!c)bad++;console.log((c?'ok  ':'FAIL')+' '+m);};
const js=fs.readFileSync('r96/client-source/cult-six-r1114.js','utf8'),html=fs.readFileSync('r96/runtime-text/index.html','utf8');
const tags=[...html.matchAll(/<script src="\.\/([^"]+)"/g)].map(m=>m[1]);
ok(tags.filter(t=>t==='cult-six-r1114.js').length===1,'index.html 에 스크립트 태그 1개');
ok(tags.indexOf('cult-six-r1114.js')>tags.indexOf('refuge-walls-r713.js'),'엔진·기존 덧씌우기 뒤(가장 바깥)');
ok(/R1114-cult-six-1/.test(js)&&/storyworld\.r1114\.cultSix/.test(js),'개정·끄기 키');
ok(/spawnTrial3/.test(js)&&/finishEncounter/.test(js)&&/trialIndex=5/.test(js),'spawnTrial3·finishEncounter 감싸기');
const m=js.match(/SPOTS=Object\.freeze\((\[\[.*?\]\])\)/);const S=m?JSON.parse(m[1]):[];
ok(S.length===6&&S.every(p=>p.every(Number.isFinite)),'자리 6개·유한');
let md=1e9;for(let i=0;i<6;i++)for(let j=i+1;j<6;j++)md=Math.min(md,Math.hypot(S[i][0]-S[j][0],S[i][1]-S[j][1]));
ok(md>=4,'자리끼리 4칸 이상 ('+md.toFixed(2)+')');
ok(/localStorage\.getItem\(KEY\)!=='0'/.test(js),'끄기 스위치');
ok(!/R1112|r1112/.test(js),'번호 R1114');
console.log(`${n-bad}/${n}`);process.exit(bad?1:0);
