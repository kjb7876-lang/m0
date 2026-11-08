// R410 CPU check: 남은 R248 임시 픽셀 몹 40종 → 드라이브 손그림 후보 시트, 추락 화염술사→검은기둥 주문사·일곱 기둥 호위병 출현 빼기(R385 표).
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const R=path.join(__dirname,'..','..'),RT=path.join(R,'runtime-text'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const F='mob-art-r410.js',src=C(F);ok(F+' runtime copy matches',fs.readFileSync(path.join(RT,F),'utf8')===src);
const html=fs.readFileSync(path.join(RT,'index.html'),'utf8');
ok('loads once, after props-place-r406 and before combat-read-r409',/<script src="\.\/props-place-r406\.js"><\/script><script src="\.\/mob-art-r410\.js"><\/script>/.test(html)&&html.split(F).length===2&&html.indexOf(F)<html.indexOf('combat-read-r409.js')&&html.indexOf('mob-unique-r248.js')<html.indexOf(F));
ok('listed in verify-r96-public.py',fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8').includes("'"+F+"'"));
ok('pages.yml runs this check',fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8').includes('r96/qa/r410/r410-cpu-check.cjs'));
const man=JSON.parse(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8')),M=new Map(man.files.map(f=>[f.path,f.sha256]));
const H=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(RT,p))).digest('hex');
ok('runtime-manifest hash matches',M.get(F)===H(F));
const idx=JSON.parse(fs.readFileSync(path.join(RT,'assets/r410/mobs/index.json'),'utf8'));
const ids=Object.keys(idx.mobs);ok('40 sheets in index',ids.length===40,ids.length);
let bad=[];for(const [id,m] of Object.entries(idx.mobs)){const p='assets/r410/mobs/'+m.file;if(!fs.existsSync(path.join(RT,p))||H(p)!==m.sha256||M.get(p)!==m.sha256)bad.push(id);}
ok('every sheet exists, hash = index = manifest',!bad.length,bad.join(','));
ok('every sheet 1024x960, body 80..280, walk feet near pivot 300',Object.values(idx.mobs).every(m=>m.size[0]===1024&&m.size[1]===960&&m.body>=80&&m.body<=280&&m.foot[1]<=CH_MAX(m)),'');
function CH_MAX(){return 320;}
ok('R248 originals kept',Object.values(idx.mobs).every(m=>fs.existsSync(path.join(RT,m.replaces.file))));
// 덧씌우기 동작: 이름이 같은 줄만 path·body 를 바꾸고 끄면 되돌린다.
const D={dir:'assets/r248/mobs/',sheets:{}};for(const [id,m] of Object.entries(idx.mobs))D.sheets[id]={file:id+'.webp',body:111,name:m.name};D.sheets.m009.name='다른 이름';
const store={};const win={__STORYWORLD_MOB_UNIQUE_R248_DATA__:D};
vm.runInNewContext(src,{window:win,localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;}}});
const A=win.__STORYWORLD_MOB_ART_R410__;ok('api',A&&A.revision.startsWith('R410'));
ok('applied 39 (name mismatch m009 left alone)',A.inspect().applied.length===39&&D.sheets.m009.path===undefined,A.inspect().applied.length);
ok('path/body set from index',D.sheets.m033.path==='assets/r410/mobs/m033.webp'&&D.sheets.m033.body===idx.mobs.m033.body);
A.set(false);ok('off restores',D.sheets.m033.path===undefined&&D.sheets.m033.body===111);A.set(true);
ok('ART table = index',ids.every(id=>A.art[id]&&A.art[id].body===idx.mobs[id].body&&A.art[id].name===idx.mobs[id].name));
ok('no m010 (escort removed) / m012 (renamed to 주문사)',!A.art.m010&&!A.art.m012);
// R385 표: dist06-m1 → 검은기둥 주문사, dist05-s1 → 검은기둥 가고일 수호자
const mv=C('mob-moves-r385.js');
ok('R385 dist06-m1 → dist05-m1 검은기둥 주문사',/\['dist06',e=>\/\^dist06-m1\(\\b\|-\)\/\.test\(String\(e\.nativeId\|\|''\)\),\['dist05','dist05-m1'\],'검은기둥 주문사'\]/.test(mv));
ok('R385 dist05-s1 → dist05-c1 검은기둥 가고일 수호자',/\['dist05',e=>\/\^dist05-s1\(\\b\|-\)\/\.test\(String\(e\.nativeId\|\|''\)\),\['dist05','dist05-c1'\],'검은기둥 가고일 수호자'\]/.test(mv));
const re=/^dist06-m1(\b|-)/;ok('regex picks m1 and its waves, not m10',re.test('dist06-m1')&&re.test('dist06-m1-w2-4')&&!re.test('dist06-m10'));
const pass=checks.filter(c=>c.pass).length;for(const c of checks)if(!c.pass)console.log('FAIL',c.name,c.detail||'');
console.log(`R410 CPU ${pass}/${checks.length}`);process.exit(pass===checks.length?0:1);
