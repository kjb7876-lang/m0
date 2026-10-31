// R164 CPU check: 미카엘라 이동 그림 = 드라이브 'Michaela-movement-v1-review' 달리기 8칸 5방향(출처·해시), visual-r119 이 그 경로를 쓴다.
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),A=path.join(R,'runtime-text','assets','r164','michaela');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
ok('visual-r119.js runtime copy matches',fs.readFileSync(path.join(R,'runtime-text','visual-r119.js'),'utf8')===C('visual-r119.js'));
const idx=JSON.parse(fs.readFileSync(path.join(A,'index.json'),'utf8'));
ok('index records the Drive bundle and the reason',idx.driveId==='18S3rWKBmhSnRuq7jHhXJhZs_01ChPEfi'&&/종종걸음/.test(idx.decision)&&/보류/.test(idx.decision));
const bad=[];for(const d of ['s','se','e','ne','n']){const e=idx.run[d];if(!e){bad.push(d+':missing');continue;}const b=fs.readFileSync(path.join(R,'runtime-text',e.path));if(crypto.createHash('sha256').update(b).digest('hex')!==e.sha256)bad.push(d+':hash');if(!(e.cols===8&&e.rows===1&&e.cell[0]===192&&e.cell[1]===256))bad.push(d+':layout');if(!/^[0-9a-f]{64}$/.test(e.sourceSha256))bad.push(d+':source');}
ok('five run sheets (s, se, e, ne, n) match their hashes and the 8×1 192×256 layout',!bad.length,bad.join(' '));
const sb={window:{StoryPhase1:{ThreeRenderer:{prototype:{updateGlows(){}}}}},localStorage:{getItem(){return null;},setItem(){}},imageCache:new Map(),readyImage:()=>null,urlFor:p=>p,cleanPath:p=>p,Image:function(){},Map,Set,Math,JSON,String,Object};
vm.createContext(sb);vm.runInContext(C('visual-r119.js'),sb);
const src=C('visual-r119.js');
ok('michaela walk uses the R164 run sheets, other heroes keep their own walk',/const RUN164=\{michaela:'assets\/r164\/michaela\/run-'\}/.test(src)&&/path:v=>walkPath\(hero,v\)/.test(src)&&/wantArt\(walkPath\(h,d\)\)/.test(src));
ok('setting run164:false restores the old walk',/prefs\.run164!==false/.test(src));
let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
if(fail){console.log(fail+' failed');process.exit(1);}console.log('all '+checks.length+' passed');
