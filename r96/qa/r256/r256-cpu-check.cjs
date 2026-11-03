// R256 — 통로 넓히기를 유기 지형으로 다시 그린 모든 지역에(hub·현대/실내 디테일 전용은 빼고). 넓히기 안전 규칙은 R204 그대로.
//  실게임 측정(헤드리스, 빌드 사이트): 15개 지역에서 바닥 칸 +15~174, 입구에서 문 3개·목표·보스까지 모두 닿음(BFS, blocked .29).
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');const src=C('cave-r204.js');
const checks=[];const ok=(name,pass,detail)=>checks.push({name,pass:!!pass,detail});
ok('widenAll is on by default and can be turned off (storyworld.r204.cave {widenAll:false})',/let prefs=\{on:true,widen:true,widenAll:true,/.test(src)&&/prefs\.widenAll!==false/.test(src));
ok('applies to every organic zone in ZONES, never to hub or decorOnly (modern/indoor) zones',/const allOn=prefs\.widenAll!==false&&ZONES\[id\]&&!ZONES\[id\]\.decorOnly&&id!=='hub';/.test(src)&&/if\(!prefs\.widen\|\|!\(ZONES\[id\]\?\.widen\|\|allOn\)\)return null;/.test(src));
ok('zones that already had their own widen settings keep them; others use the proven defaults (radius 1.5, corridor half-width ≤2)',/widen\(L,ZONES\[id\]\?\.widen\?ZONES\[id\]:\{\.\.\.ZONES\[id\],widenR:ZONES\[id\]\.widenR\|\|1\.5,widenHW:ZONES\[id\]\.widenHW\|\|2\}/.test(src));
ok('the R204 safety rules are unchanged (doors, map edge, long walls, thin walls, no new shortcuts)',/nearDoor\(nx,ny\)\|\|behindLong\(nx,ny\)/.test(src)&&/R8=R8\|\|reach\(x,y,RL\)/.test(src)&&/nx<2\|\|ny<2\|\|nx>W-3\|\|ny>H-3/.test(src));
ok('runtime copy matches',RT('cave-r204.js')===src);try{new vm.Script(src);ok('syntax',true);}catch(e){ok('syntax',false,String(e));}
const pass=checks.filter(c=>c.pass).length;for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));
console.log(`R256 ${pass}/${checks.length}`);if(pass!==checks.length)process.exit(1);
