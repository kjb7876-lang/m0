// R212 CPU check: 유기 지형 지역 디테일 — 장식판 4×3(쇠사슬·물결·늪 웅덩이·이끼), 지역별 장식 비율·밀도, 절벽 밑 풀 덤불.
const fs=require('fs'),path=require('path');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const src=C('cave-r204.js');
ok('runtime copy matches',RT('cave-r204.js')===src);
ok('decal atlas is 4×3 and uv rows use thirds',/c\.width=1024;c\.height=768;/.test(src)&&/v0=Math\.floor\(k\/4\)\/3/.test(src)&&/1-v0-1\/3/.test(src));
ok('new slots: chain(8), ripple(9), puddle(10), moss(11) drawn',/put\(ims\.chain,8\)/.test(src)&&/,9\);\}/.test(src)&&/ox=2\*256,oy=2\*256/.test(src)&&/ox=3\*256,oy=2\*256/.test(src));
ok('chain/ripple/weed come from existing r138 props (files present)',['chain','ripple','weed'].every(n=>fs.existsSync(path.join(R,'runtime-text','assets','r138','props',n+'.webp'))));
const block=src.slice(src.indexOf('const ZONES={'),src.indexOf('const R=4,M=8;'));
const zone=z=>(new RegExp('\\n '+z+':\\{([^\\n]*)').exec(block)||[])[1]||'';
ok('every organic zone except the cave has its own decal mix',['hub','dist00','dist02','dist03','dist04','dist05','dist06'].every(z=>/decalMix:\{near:\[/.test(zone(z))),['hub','dist00','dist02','dist03','dist04','dist05','dist06'].filter(z=>!/decalMix/.test(zone(z))));
ok('swamp has puddles+ripples, castle has chains, graveyard has bones',/\[10,\d/.test(zone('dist02'))&&/\[9,\d/.test(zone('dist02'))&&/\[8,/.test(zone('dist03'))&&/\[1,\d/.test(zone('dist04')));
ok('grass tufts only in planted/outdoor zones (garden, swamp, graveyard, cloister), not cave/castle/pillars/fall',['hub','dist00','dist02','dist04'].every(z=>/tufts:\[/.test(zone(z)))&&!['dist01','dist03','dist05','dist06'].some(z=>/tufts:\[/.test(zone(z))));
ok('tufts avoid doors and props; two in three on the floor at cliff feet, one in three on mossy plateau tops',/function tuftSprites[\s\S]*?if\(top\?\(fv>-\.9\|\|fv<-3\):\(fv<\.2\|\|fv>1\.0\)\)continue;[\s\S]*?if\(avoid\.some/.test(src));
ok('puddles only in open floor (f ≥ 1.6)',/if\(k===10&&fv<1\.6\)continue;/.test(src));
const wf=fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8');ok('in the CI workflow',/qa\/r212\/r212-cpu-check\.cjs/.test(wf));
let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
if(fail){console.log(fail+' failed');process.exit(1);}console.log('all '+checks.length+' passed');
