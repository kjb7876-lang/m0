// R1124 설정 겹침 정리(표시만): 같은 설정을 두 곳에서 켜던 칸을 한 곳만 보이게. 저장 키·기본값은 그대로.
'use strict';const fs=require('fs'),path=require('path');
const R=path.resolve(__dirname,'..','..');const src=fs.readFileSync(path.join(R,'client-source','perf7-r1043.js'),'utf8');
let n=0,bad=0;const ok=(m,c)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m);};
ok('전투 서로 바라보기 묶음에 #r111-facing 포함',/id:'faceAllR1043'[^\n]*#r111-facing/.test(src));
ok('R111 칸 10개는 R111 구역이 있을 때만 R114 사본을 숨김(dupR111)',/dupR111/.test(src)&&/#r111-'\s*\+|'#r111-'\+/.test(src));
ok('숨기기만 한다(저장·점수·피해 코드 없음)',!/hitEnemy|\.hp\s*=|saveGame\(/.test(src));
ok('런타임 복사본 동일',fs.readFileSync(path.join(R,'runtime-text','perf7-r1043.js'),'utf8')===src);
console.log((bad?'R1124 FAILED ':'R1124 PASSED ')+(n-bad)+'/'+n);process.exit(bad?1:0);
