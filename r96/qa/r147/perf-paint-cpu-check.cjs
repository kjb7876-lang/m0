// R147 CPU check: full-screen layers stop repainting every frame (torch/pool only on change, fog by transform, pulse by opacity,
// embers 30/s and idle-skip), mobile drops the full-screen CSS filter, light positions and enemy-box measurements are cached.
const fs=require('fs'),path=require('path');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
for(const f of['dark-r123.js','cinema-r114.js','play-r115.js','attack-anim-r143.js'])ok(f+' runtime copy matches',fs.readFileSync(path.join(R,'runtime-text',f),'utf8')===C(f));
const d=C('dark-r123.js'),c=C('cinema-r114.js'),p=C('play-r115.js'),a=C('attack-anim-r143.js');
ok('torchlight repaints at most 15/s and only when the gradient changes',/t-torchAt>=1\/15/.test(d)&&/css!==torchCss/.test(d));
ok('fog moves by transform (compositor), not background-position',/@keyframes darkR123Fog\{from\{transform:translate3d\(0,0,0\)\}to\{transform:translate3d\(768px,96px,0\)\}\}/.test(d)&&!/background-position:768px/.test(d)&&/data-d=\\?"fogi\\?"/.test(d));
ok('embers draw every other frame and skip the empty canvas',/emberTick=\(emberTick\+1\)%2/.test(d)&&/embersClear/.test(d));
ok('wall-torch spots cached per region shape',/wallCache\.set\(r\.exploration/.test(d));
ok('light pool repaints only on change (4px steps)',/css!==poolCss/.test(c)&&/Math\.round\(px\/4\)\*4/.test(c));
ok('low-HP pulse animates opacity only',/pl\.dataset\.r147/.test(c)&&/pl\.style\.opacity=\(a\/\.32\)/.test(c));
ok('mobile: no full-screen CSS filter on the 3D canvas',/c\.style\.filter=mob\?'':/.test(c));
ok('enemy opaque-box cache holds 2000 entries',/m\.size>2000/.test(p)&&!/m\.size>48\)/.test(p));
ok('hero overlay reads R119 state at most 4/s',/r119At>250/.test(a)&&!/__STORYWORLD_VISUAL_R119__\?\.inspect\?\.\(\)\?\.stats\?\./.test(a));
ok('workflow runs this check',fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8').includes('r96/qa/r147/perf-paint-cpu-check.cjs'));
const fail=checks.filter(x=>!x.pass);console.log(JSON.stringify({status:fail.length?'FAIL':'PASS',passed:checks.length-fail.length,total:checks.length,fail},null,1));process.exit(fail.length?1:0);
