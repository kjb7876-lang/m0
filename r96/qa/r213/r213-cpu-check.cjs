// R213 CPU check: 돌 유적 계열 야외 지역 4곳(ep1b01·ep1b08·kair01·kair04)에 R204 유기 지형 — 넓히기 없음, 기존 그림만.
const fs=require('fs'),path=require('path');
const R=path.join(__dirname,'..','..'),src=fs.readFileSync(path.join(R,'client-source','cave-r204.js'),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
ok('runtime copy matches',src===fs.readFileSync(path.join(R,'runtime-text','cave-r204.js'),'utf8'));
const block=src.slice(src.indexOf('const ZONES={'),src.indexOf('const R=4,M=8;'));
const zone=z=>{const i=block.indexOf('\n '+z+':{');if(i<0)return '';const j=block.indexOf('\n // ',i+1);return block.slice(i,j<0?undefined:j);};/* 지역 설정은 여러 줄 */
for(const z of ['ep1b01','ep1b08','kair01','kair04'])ok(z+' present, widen:false, small bulge (built stone) and its own decal mix',/widen:false/.test(zone(z))&&+(/bulge:([\d.]+)/.exec(zone(z))||[])[1]<=.9&&/decalMix:/.test(zone(z)),zone(z).slice(0,90));
ok('textures exist',[...block.matchAll(/'(assets\/[^']+\.(?:webp|png))'/g)].every(m=>fs.existsSync(path.join(R,'runtime-text',m[1]))));
ok('modern / machine / huge-layout regions stay out (hospital, city, hotel, villa, neural, memory, hando)',!/\n (ep1a0[89]|ep1a09b|ep1a1[01]|ep1b0[2-5]|ep1b06|ep1b09|murder0\d|cult0\d|u20\d|hando0\d|last301):\{/.test(block));
ok('tuft/tree sprites follow the R24 sight mask (Codex #134)',/function spriteSight\(st\)/.test(src)&&/S\.pointVisible\(sp\.position\.x,sp\.position\.z\)\?4:0/.test(src)&&/heroUniform\(r,frame\);spriteSight\(st\);/.test(src));
ok('in the CI workflow',/qa\/r213\/r213-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
if(fail){console.log(fail+' failed');process.exit(1);}console.log('all '+checks.length+' passed');
