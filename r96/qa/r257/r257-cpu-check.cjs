// R257 — 드라이브 11-03 각도·배치 변형본을 조형물에: 같은 방 두 번째 사슬·수초는 다른 각도, 오두막 창은 붙는 벽(-x)에 맞는 사선, 원본이 있는 지역에 새 바닥 소품 셋.
//  헤드리스: dist02 수초(2번째 weed-opp)·dist03 사슬(2번째 chain-end)·dist04 갑옷·ep1b04 유기질 주방 바닥·ep1b06b 창(뒷벽 → 원본)·ep1b09 눈 케이블, 배치 실패 0, 그림 읽힘.
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');const src=C('drive-props-r138.js');
const checks=[];const ok=(name,pass,detail)=>checks.push({name,pass:!!pass,detail});
ok('runtime copy matches',RT('drive-props-r138.js')===src);
const idx=JSON.parse(RT('assets/r257/props/index.json'));const items=Object.entries(idx.items);
ok('6 derived images with provenance (Drive id, zip/original/derived SHA-256, status, use)',items.length===6&&items.every(([,v])=>v.driveId&&v.zipSHA256&&v.originalSHA256&&v.derivedSHA256&&v.status&&v.use));
ok('derived files exist and match their recorded SHA-256 / bytes',items.every(([,v])=>{const b=fs.readFileSync(path.join(R,'runtime-text',v.path));return b.length===v.derivedBytes&&crypto.createHash('sha256').update(b).digest('hex')===v.derivedSHA256;}));
ok('every ART path added by R257 points at a derived file',['chain-end','weed-opp','cwindow-obl','armor','kitchen','cable'].every(k=>new RegExp("'?"+k+"'?:\\{path:'assets/r257/props/"+k+"\\.webp'").test(src)));
ok('second chain / waterweed in a room use the other angle; cabin window on a -x wall uses the oblique view',/const ALT=\{chain:'chain-end',weed:'weed-opp'\},WALL_ALT=\{cwindow:\{'-1,0':'cwindow-obl'\}\};/.test(src)&&/const alt=\(i%2===1&&ALT\[kind\]\)\|\|WALL_ALT\[kind\]\?\.\[spot\.dx\+','\+spot\.dy\]/.test(src));
ok('new floor props only in the canon regions named by their bundles (dist04 armor, ep1b04 kitchen, ep1b09 cable)',/const PLAN257=\{dist04:\[\['armor',1\]\],ep1b04:\[\['kitchen',1\]\],ep1b09:\[\['cable',1\]\]\};/.test(src)&&/const plan=\[\.\.\.\(PLAN\[r\.id\]\|\|\[\]\),\.\.\.\(PLAN257\[r\.id\]\|\|\[\]\)\];/.test(src)&&idx.items.armor.region==='dist04'&&idx.items.kitchen.region==='ep1b04'&&idx.items.cable.region==='ep1b09');
ok('all still non-colliding presentation props',/solid:false,visible:true,enabled:true,interactive:false/.test(src));
try{new vm.Script(src);ok('syntax',true);}catch(e){ok('syntax',false,String(e));}
const pass=checks.filter(c=>c.pass).length;for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));
console.log(`R257 ${pass}/${checks.length}`);if(pass!==checks.length)process.exit(1);
