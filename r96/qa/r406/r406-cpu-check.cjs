// R406 CPU check: 조형물 자리(의자 안쪽·벽 가구 벽 방향)·실내 전구 등·보스 구역 드라이브 StoryProps 후보 24종.
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=path.join(R,'runtime-text');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const F='props-place-r406.js';ok(F+' runtime copy matches',fs.readFileSync(path.join(RT,F),'utf8')===C(F));
const html=fs.readFileSync(path.join(RT,'index.html'),'utf8');
ok('loads right after sin-room-art.js and before combat-r118.js',/<script src="\.\/sin-room-art\.js"><\/script><script src="\.\/props-place-r406\.js"><\/script>/.test(html)&&html.indexOf(F)<html.indexOf('combat-r118.js'));
ok('listed in verify-r96-public.py',fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8').includes("'"+F+"'"));
ok('pages.yml runs this check',fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8').includes('r96/qa/r406/r406-cpu-check.cjs'));
const man=JSON.parse(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8')),M=new Map(man.files.map(f=>[f.path,f.sha256]));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(RT,p))).digest('hex');
const idx=JSON.parse(fs.readFileSync(path.join(RT,'assets/r406/props/index.json'),'utf8'));
const names=Object.keys(idx.props);ok('24 boss props in the index',names.length===24,names.length);
ok('every prop file exists, matches index sha/size and is in the runtime manifest',names.every(n=>{const v=idx.props[n];return fs.existsSync(path.join(RT,v.path))&&sha(v.path)===v.sha256&&fs.statSync(path.join(RT,v.path)).size===v.bytes&&M.get(v.path)===v.sha256;}));
ok('every source PNG hash was checked against its Drive manifest',names.every(n=>idx.props[n].manifestChecked===true&&/^[0-9a-f]{64}$/.test(idx.props[n].pngSHA256)));
ok('props are cropped to at most 384 px',names.every(n=>Math.max(...idx.props[n].size)<=384));
ok('wall props have a wall axis, open-floor props none',names.every(n=>{const v=idx.props[n];return v.mode==='wall'?['x','y'].includes(v.axis):v.mode==='inner'&&v.axis===null;}));
ok('every prop zone is a samong confront zone or the RG-5 empty altar',names.every(n=>/^sz115-(S01-5|S03-7|S04-11|S04-14|S05-6|S06-5|S06-23|RB-6|RC-3|RC-6|RE-3|RF-1|RG-3|RG-5)$/.test(idx.props[n].zone)));
ok('two bulb lamps exist and are in the manifest',Object.values(idx.lights||{}).length===2&&Object.values(idx.lights).every(v=>sha(v.path)===v.sha256&&M.get(v.path)===v.sha256));
// pure helpers in a sandbox
const store={};const sb={window:{},localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;}},fetch:()=>Promise.reject(new Error('no net')),setTimeout:()=>0,Math,JSON,String,Object,Number,Array,Set,Map,WeakMap,Promise,Error};
vm.createContext(sb);vm.runInContext(C(F),sb);const X=sb.window.__STORYWORLD_PROPS_PLACE_R406__;
ok('exports revision',X&&/^R406-/.test(X.revision));
ok('classifies seats, sofa, wall art and fire',X.SEAT.test('assets/world-r80/r80-145.webp')&&X.SEAT.test('assets/world-r80/refined-r85-r80-149.webp')&&X.SOFA.test('assets/world-r80/r80-024.webp')&&X.WALL_ART.test('assets/world-r80/r80-026.webp')&&X.FIRE_SKIN.test('assets/world-r80/r80-022.webp')&&X.FURNACE.test('assets/world-r80/r80-039.webp')&&!X.SEAT.test('assets/world-r80/r80-026.webp'));
ok('R92 fire lamp paths are recognised',X.R92_FIRE.test('assets/r92/lights/lights_stone_03.png')&&!X.R92_FIRE.test('assets/r92/props/lights_stone_03.png'));
ok('indoor samong zones: domestic/clinical/forge unless an outdoor title',X.indoorZone({style:'clinical',title:'13층 후원자'})&&!X.indoorZone({style:'domestic',title:'불탄 거리'})&&!X.indoorZone({style:'garden',title:'재판관'}));
ok('indoorOf: STORY room with worldR74 indoor mode, outdoor otherwise',X.indoorOf({exploration:{worldR74:{mode:'indoor'}}})&&!X.indoorOf({exploration:{worldR74:{mode:'outdoor'}}}));
ok('set() persists switches',(X.set({boss:false}),JSON.parse(store['storyworld.r406.props']).boss===false));
ok('inspect reports no collision or save changes',X.inspect().collisionChanged===false&&X.inspect().savesTouched===false);
ok('boss props are presentation only (solid:false, no interaction)',/solid:false,visible:true,enabled:true,interactive:false,autoTargetEligible6:false,r80PresentationOnly:true,r406Boss/.test(C(F)));
ok('keeps clear of the R169 guide path',/pathCells/.test(C(F))&&/onPath\(r,c\.x,c\.y\)/.test(C(F)));
let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
if(fail){console.log(fail+' failed');process.exit(1);}console.log('all '+checks.length+' passed');
