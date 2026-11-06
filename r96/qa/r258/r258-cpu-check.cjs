// R258 — 초반 스토리 맵(R171 템플릿) 보스 문 앞 중앙 전투실(집결)을 16×8 → 24×12 로 넓힌다.
//  측정(헤드리스, dist00~05): 집결하는 몹 33~40마리 · 집결 자리 18 → 45 · 겹침 0 · dist02 가장 가까운 몹 사이 평균 2.55칸.
const fs=require('fs'),path=require('path');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');const src=C('story-maps-r171.js');
const checks=[];const ok=(name,pass,detail)=>checks.push({name,pass:!!pass,detail});
ok('runtime copy matches',RT('story-maps-r171.js')===src);
const m=src.match(/GATHER=\{x:(\d+),y:(\d+),w:(\d+),h:(\d+)\}/);const G=m&&{x:+m[1],y:+m[2],w:+m[3],h:+m[4]};
ok('gathering room is 24×12 (was 16×8)',G&&G.w===24&&G.h===12,G);
let spots=0;if(G)for(let y=G.y+1.5;y<G.y+G.h-1;y+=2.2)for(let x=G.x+1.5;x<G.x+G.w-1;x+=2.4)spots++;
ok('rally spots ≥ 40 so every survivor (up to 40 measured) gets its own spot',spots>=40,spots);
const band=src.match(/BAND=(?:WIDE\?)?\{S:\{x0:(\d+),y0:(\d+).*?E:\{x0:(\d+),y0:(\d+)/)/* R376: 넓힌 띠(WIDE)도 S y0·E x0 는 같다 */;
ok('stays inside the map and clear of the south band (y≥42) and east band (x≥30)',G&&band&&G.x>=1&&G.y+G.h<=+band[2]&&G.x+G.w<=+band[3],{G,band:band&&band.slice(1)});
const BL=src.match(/BOSSLINK=\{x:(\d+),y:(\d+),w:(\d+),h:(\d+)\}/);ok('still touches the boss link corridor (17..23 × 20..30)',G&&BL&&G.y<=+BL[2]+ +BL[4]&&G.x<=+BL[1]&&G.x+G.w>=+BL[1]+ +BL[3]);
const pass=checks.filter(c=>c.pass).length;for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));
console.log(`R258 ${pass}/${checks.length}`);if(pass!==checks.length)process.exit(1);
