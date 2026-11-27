// R1376 정적 검사: 교만의 사이보그 교주(c104-boss) 그림 일관성 덧씌우기 연결(브라우저 동작은 cult-consist-browser.mjs).
const fs=require('fs');let n=0,bad=0;const ok=(c,m)=>{n++;if(!c)bad++;console.log((c?'ok  ':'FAIL')+' '+m);};
const js=fs.readFileSync('r96/client-source/cult-consist-r1376.js','utf8'),html=fs.readFileSync('r96/runtime-text/index.html','utf8');
const tags=[...html.matchAll(/<script src="\.\/([^"]+)"/g)].map(m=>m[1]);
ok(tags.filter(t=>t==='cult-consist-r1376.js').length===1,'index.html 에 스크립트 태그 1개');
ok(tags.indexOf('cult-consist-r1376.js')>tags.indexOf('bosses-r104.js')&&tags.indexOf('bosses-r104.js')>=0,'R104 열쇠 자세 뒤(그 drawImage 감싸기 안쪽에서 바꿈)');
ok(/R1376-cult-consist-1/.test(js)&&/storyworld\.r1376\.cultConsist/.test(js),'개정·끄기 키');
ok(/c104-boss-p'\+i\+'\.webp/.test(js)&&/ID='c104-boss'/.test(js),'교주 v17 자세 4장만 대상');
ok(/HOLD=\.18/.test(js),'자세 최소 유지 0.18초');
ok(!/drop-shadow|blur\(/.test(js),'Three.js 기록기에서 안 되는 CSS filter 없음(drop-shadow·blur)');
ok(/presentationOnly:true/.test(js)&&!/\.hp\s*=[^=]|\.maxHp\s*=[^=]|\.attack\s*=[^=]/.test(js),'그리기만(체력·공격 값 안 바꿈)');
ok(/cult-consist-r1376\.js/.test(fs.readFileSync('r96/runtime-inputs.json','utf8')),'runtime-inputs 에 들어감');
ok(/'cult-consist-r1376\.js'/.test(fs.readFileSync('scripts/verify-r96-public.py','utf8')),'공개 검사 목록');
for(let i=1;i<=4;i++)ok(fs.existsSync('r96/runtime-text/assets/r104/bosses/c104-boss-p'+i+'.webp')||/c104-boss-p/.test(fs.readFileSync('r96/runtime-manifest.json','utf8')),'자세 그림 p'+i+' 있음');
console.log(`${n-bad}/${n}`);process.exit(bad?1:0);
