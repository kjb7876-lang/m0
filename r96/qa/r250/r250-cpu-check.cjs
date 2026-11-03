// R250 — 촉수 공격은 영웅 자리에 모인다(사용자 2026-11-03 "모든 촉수공격들이 영웅을 타깃으로해서 영웅이있는곳에 나와야해 적들쪽에 나오는게 아니라").
const fs=require('fs'),path=require('path');const R=path.join(__dirname,'..','..');const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(name,pass,detail)=>checks.push({name,pass:!!pass,detail});
const s103=C('samong-r103.js'),s162=C('samong-play-r162.js'),s170=C('combat-r170.js');
const m=s103.match(/if\(kind==='tentacles'\)\{const pts=\[\];(?:\/\*[\s\S]*?\*\/)?(\[\[[^\]]*\](?:,\[[^\]]*\])*\])\.forEach/);
const rings=m?JSON.parse(m[1]):null;
ok('R162 boss tentacles: one under the hero and rings no farther than 2.2 tiles (was 1.3/2.7/4.1, outer ring among the enemies)',rings&&rings[0][0]===0&&rings[0][1]===1&&Math.max(...rings.map(r=>r[0]))<=2.2,rings);
ok('every tentacle point is placed around player.x/player.y (hero), not the boss',/px=player\.x\+Math\.cos\(a\)\*R,py=player\.y\+Math\.sin\(a\)\*R/.test(s103));
ok('R162 plays a blood tendril sheet on every point (bigger at the hero)',/if\(kind==='tentacles'\)data\.pts\.forEach\(\(p,k\)=>\{X\.play\('tendrils-blood',p\.x,p\.y,\{delay:p\.warn-\.12,rate:2\.2,k:p\.ring===0\?1\.35/.test(s162));
ok('R170 hexagram tentacles: cast at the hero position, burst sheet bigger at the hero',/const px=player\.x,py=player\.y,warn=1\.3/.test(s170)&&/X\?\.play\('tendrils-blood',h\.x,h\.y,\{k:1\.7\}\)/.test(s170));
ok('runtime copies match',['samong-r103.js','samong-play-r162.js','combat-r170.js'].every(f=>RT(f)===C(f)));
const pass=checks.filter(c=>c.pass).length;for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));
console.log(`R250 ${pass}/${checks.length}`);if(pass!==checks.length)process.exit(1);
