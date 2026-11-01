// R210 CPU check: 1부 나머지 야외 지역(dist02~06)에 R204 유기 지형을 켜되 통로 넓히기는 하지 않는다(맵 레이아웃 그대로).
const fs=require('fs'),path=require('path');
const R=path.join(__dirname,'..','..'),src=fs.readFileSync(path.join(R,'client-source','cave-r204.js'),'utf8'),rt=fs.readFileSync(path.join(R,'runtime-text','cave-r204.js'),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
ok('runtime copy matches',src===rt);
const block=src.slice(src.indexOf('const ZONES={'),src.indexOf('const R=4,M=8;'));
for(const z of ['dist02','dist03','dist04','dist05','dist06']){const m=new RegExp('\\n '+z+':\\{([^\\n]*)').exec(block);
 ok(z+' zone present with widen:false and its own textures',!!m&&/widen:false/.test(m[1])&&new RegExp(' '+z+':\\{[\\s\\S]*?tex:\\{floorA:').test(block),m&&m[1].slice(0,80));}
ok('earlier zones unchanged (hub/dist00/dist01 still present, dist01 widen:true)',/\n hub:\{/.test(block)&&/\n dist00:\{/.test(block)&&/\n dist01:\{[^\n]*widen:true/.test(block));
ok('modern-building maps (school/hotel episodes) are not in the organic zone list',!/\n (ep1a08|ep1b03|ep1b04|ep1b05|u20\d):\{/.test(block));
ok('textures referenced by the new zones exist',[...block.matchAll(/'(assets\/[^']+\.webp)'/g)].every(m=>fs.existsSync(path.join(R,'runtime-text',m[1]))));
const wf=fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8');ok('in the CI workflow',/qa\/r210\/r210-cpu-check\.cjs/.test(wf));
let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
if(fail){console.log(fail+' failed');process.exit(1);}console.log('all '+checks.length+' passed');
