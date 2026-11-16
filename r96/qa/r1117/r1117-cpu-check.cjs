// R1117 정적 검사: R171 서사 지도가 사몽 에피소드 방(r103-samong)의 DREAM 지도를 덮지 않게 막았는지.
const fs=require('fs');let n=0,bad=0;const ok=(c,m)=>{n++;if(!c)bad++;console.log((c?'ok  ':'FAIL')+' '+m);};
const js=fs.readFileSync('r96/client-source/story-maps-r171.js','utf8'),rt=fs.readFileSync('r96/runtime-text/story-maps-r171.js','utf8');
ok(js===rt,'runtime 복사본 일치');
ok(/const episodeRoom=id=>/.test(js)&&/r\.exploration\?\.type==='r103-samong'/.test(js),'에피소드 방 판별');
ok(/own\.layout=function\(id,l=[^)]*\)\{if\(l==='DREAM'&&episodeRoom\(id\)\)return EX\.layout\.call\(EX,id,l,\.\.\.a\);if\(eligible\(id,l\)\)/.test(js),'layout 이 에피소드 방이면 원래 지도로 통과');
ok(/dreamMaps/.test(js)&&/storyworld\.r1098b\.dreamMaps/.test(js),'R1098b 일반 DREAM 지도 유지');
console.log(`${n-bad}/${n}`);process.exit(bad?1:0);
