// R262 — 맵 모서리 둥글게: 넓히기(R204/R256) 뒤 남은 뾰족한 벽 끝·볼록한 직각 모서리를 바닥으로 깎는다(지형 이어짐 보존).
//  헤드리스(dist00~05): 볼록 모서리 118→62, 96→63, 98→63, 64→52, 78→57 · 튀어나온 벽 끝 26→13, 60→51, 57→49 ·
//  문을 닫은 채(얇은 문판까지 보는 BFS) 입구→중앙 전투실·보스 문 앞 닿음, 보스 전투실은 막힘(6/6).
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');const src=C('cave-r204.js');
const checks=[];const ok=(name,pass,detail)=>checks.push({name,pass:!!pass,detail});
ok('runtime copy matches',RT('cave-r204.js')===src);
ok('rounding runs inside widen(), after widening and before walls are rebuilt (floorCells·floorRects·walls stay together)',src.indexOf('stats.rounded=')>src.indexOf('if(ok)add.add(k);}}')&&src.indexOf('stats.rounded=')<src.indexOf('if(!add.size)return null;'));
ok('cuts only spurs (≥3 floor sides) and convex right-angle corners (two perpendicular floors + their diagonal)',/if\(\(o>=3\|\|\(o===2&&convex\)\)&&simple\(x,y\)\)/.test(src)&&/const convex=\(n&&e&&hasA\(x\+1,y-1\)\)/.test(src));
ok('same safety as widening: never near doors, map edge (2 tiles) or directly behind a long wall',/if\(hasA\(x,y\)\|\|x<2\|\|y<2\|\|x>W-3\|\|y>H-3\|\|nearDoor\(x,y\)\|\|behindLong\(x,y\)\)continue;/.test(src));
// 위상 보존 검사(simple point)를 그대로 떼어 확인
const m=src.match(/const simple=\(x,y\)=>\{[\s\S]*?return seen\.size===idx\.length;\};/);ok('topology guard present',!!m);
if(m){const S=new Set(),key=(x,y)=>x+','+y,ring=[[-1,-1],[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0]],hasA=(x,y)=>S.has(key(x,y));const simple=eval('('+m[0].replace(/^const simple=/,'').replace(/;$/,'')+')');
 // 1칸 두께 벽 사이 두 방: 위(y=0)·아래(y=2) 바닥, 가운데(y=1) 벽 → 가운데 칸을 바꾸면 두 방이 이어진다 → 거부
 for(let x=-1;x<=1;x++){S.add(key(x,0));S.add(key(x,2));}ok('refuses a cell that would join two separate floors (thin wall between rooms)',simple(0,1)===false);
 S.clear();for(const [x,y] of [[0,-1],[1,-1],[1,0]])S.add(key(x,y));ok('accepts a convex corner whose floor neighbours are already connected',simple(0,0)===true);}
ok('can be turned off (storyworld.r204.cave {round:false})',/if\(prefs\.round!==false\)\{/.test(src));
try{new vm.Script(src);ok('syntax',true);}catch(e){ok('syntax',false,String(e));}
const pass=checks.filter(c=>c.pass).length;for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));
console.log(`R262 ${pass}/${checks.length}`);if(pass!==checks.length)process.exit(1);
