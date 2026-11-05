// R290 몹 손그림 적용(m001·m003·m004·m005·m014) — R248 임시 픽셀 시트 대신 assets/r290/mobs/ 무손실 시트, 원래 임시 시트는 그대로, 끄기 키.
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(name,pass,detail)=>checks.push({name,pass:!!pass,detail});
const src=C('mob-art-r290.js'),r248=C('mob-unique-r248.js'),dsrc=C('mob-unique-r248-data.js');
const A=path.join(R,'runtime-text','assets','r290','mobs'),idx=JSON.parse(fs.readFileSync(path.join(A,'index.json'),'utf8'));
const old=JSON.parse(fs.readFileSync(path.join(R,'runtime-text','assets','r248','mobs','index.json'),'utf8'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function webpSize(b){if(b.toString('ascii',0,4)!=='RIFF'||b.toString('ascii',8,12)!=='WEBP')return null;const t=b.toString('ascii',12,16);
 if(t==='VP8L'){const v=b.readUInt32LE(21);return{w:(v&0x3fff)+1,h:((v>>14)&0x3fff)+1,lossless:true};}if(t==='VP8X')return{w:b.readUIntLE(24,3)+1,h:b.readUIntLE(27,3)+1,lossless:b.includes(Buffer.from('VP8L'))};return{w:0,h:0,lossless:false};}
const ids=['m001','m003','m004','m005','m014'];
ok('index: five entries, not temporary, approval note, drive ids, reason, per-frame source hashes and foot/body',ids.every(id=>{const m=idx.mobs[id];return m&&m.temporary===false&&m.approval==='dots 생성 후보 → 사용자 승인 2026-11-04'&&/^[\w-]{25,}$/.test(m.drive?.id||'')&&m.reason&&m.frames?.length===12&&m.frames.every(f=>f.foot>=290&&f.foot<=302&&f.body>100)&&(m.frames.every(f=>/^[0-9a-f]{64}$/.test(f.sha256||''))||(m.source?.files?.length===1&&/^[0-9a-f]{64}$/.test(m.source.files[0].sha256)));})&&Object.keys(idx.mobs).filter(k=>!['R359','R363'].includes(idx.mobs[k].revision)).length===ids.length,Object.keys(idx.mobs));/* R359 줄은 r96/qa/r359 가 본다 */
ok('drive ids are the reviewed bundles',idx.mobs.m001.drive.id==='1ymldWAc1t0p0ZvyiYiogv_TIf1wYveP4'&&idx.mobs.m003.drive.id==='11X3JvpCprrxlWbCCrOFSYDEZYrSSz1N_'&&idx.mobs.m004.drive.id==='1pvHhvh7jbCkiD8suFzAdXPuAMgGHKevK'&&idx.mobs.m005.drive.id==='1dyITGlrvnTSPNk1XZp3FH78wiCbeontr'&&idx.mobs.m014.drive.id==='1MnlSxqbsy8MNxoxKFMRsmffEB2JOu-Ql');
ok('sheets exist, sha256/bytes match the index, lossless WebP 1024×960 (4×3 of 256×320)',ids.every(id=>{const m=idx.mobs[id],p=path.join(A,m.file);if(!fs.existsSync(p))return false;const b=fs.readFileSync(p),s=webpSize(b);return sha(b)===m.sha256&&b.length===m.bytes&&s&&s.w===1024&&s.h===960&&s.lossless;}),ids.map(id=>webpSize(fs.readFileSync(path.join(A,idx.mobs[id].file)))));
ok('originals kept: R248 temporary sheets still exist with their recorded sha256 (not overwritten)',ids.every(id=>{const o=old.mobs[id],p=path.join(R,'runtime-text','assets','r248','mobs',o.file);return fs.existsSync(p)&&sha(fs.readFileSync(p))===o.sha256&&idx.mobs[id].replaces.sha256===o.sha256;}));
// overlay in a sandbox with R248
function mk(store={}){const drawn=[],scales=[];const ctx={save(){},restore(){},translate(){},scale(x,y){scales.push([x,y]);},drawImage(im,...a){drawn.push({src:im.src,a});},scope(meta,f){f();},filter:'',globalAlpha:1};
 const ls={getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;}};
 const sb={console,Math,JSON,Object,Array,Set,Map,WeakMap,Number,String,Promise,Date,localStorage:ls,window:{__STORYWORLD_FX_SPRITES_R106__:{on:()=>true,draw(){},along(){}}},
  time:10,layer:'STORY',ctx,project:(x,y)=>({x:(x-y)*10,y:(x+y)*5}),actorHeight:()=>60,effects:[],player:{x:10,y:10,hp:100},room:{enemies:[]},
  readyImage:p=>({image:{src:p}}),ensureImages:()=>Promise.resolve(),tick(){},drawEffect(){},drawEnemy(){return 'base';}};
 vm.createContext(sb);vm.runInContext(dsrc,sb);vm.runInContext(r248,sb);vm.runInContext(src,sb);return {sb,drawn,scales};}
const D=(()=>{const s={window:{}};vm.createContext(s);vm.runInContext(dsrc,s);return s.window.__STORYWORLD_MOB_UNIQUE_R248_DATA__;})();
{const {sb}=mk();const M=sb.window.__STORYWORLD_MOB_ART_R290__;
 ok('overlay table = index.json (file, body) and names match the R248 sheet rows',ids.every(id=>M.art[id].file===idx.mobs[id].file&&M.art[id].body===idx.mobs[id].body&&D.sheets[id].name===M.art[id].name&&idx.mobs[id].name===M.art[id].name)&&Object.keys(M.art).length===Object.keys(idx.mobs).length);
 ok('applied to exactly the listed ids (R290 five first, then R359 rows)',JSON.stringify(M.inspect().applied.slice(0,ids.length))===JSON.stringify(ids)&&JSON.stringify(M.inspect().applied)===JSON.stringify(Object.keys(M.art)),M.inspect());}
for(const id of ids){const {sb,drawn,scales}=mk();const name=D.sheets[id].name,e={id:'e'+id,name:name+' 증원',x:12,y:10,hp:10};sb.drawEnemy(e);
 const d=drawn.find(x=>/assets\/r2\d\d\/mobs\//.test(x.src)),k=scales.at(-1)?.[1];const s248=old.mobs[id];
 const KS={plant:1,spider:.85,human:1}[s248.kind],size=Math.min(60*KS,60*1.3),onNew=k*idx.mobs[id].body,onOld=size/s248.body*s248.body;
 ok(`${id} ${name}: drawn from assets/r290/mobs/${id}.webp, R248 cell layout (walk cell, 256×320, pivot 128,300)`,d&&d.src==='assets/r290/mobs/'+id+'.webp'&&d.a[2]===256&&d.a[3]===320&&d.a[4]===-128&&d.a[5]===-300&&d.a[1]%320===0&&d.a[0]%256===0,d);
 ok(`${id}: on-screen body height = R248 size rule (k·body = size, same as the temp art)`,KS&&Math.abs(onNew-onOld)<0.01,{onNew,onOld,k});
 // 마주보기: 영웅이 왼쪽/오른쪽 → 좌우 뒤집기, 공격 칸 8..11
 const f1=scales.at(-1)[0];sb.player.x=20;sb.player.y=0;sb.time=11;e.x=12.5;sb.drawEnemy(e);const f2=scales.at(-1)[0];
 e.attack={elapsed:.3,angle:0,shape154:{windup:.45,active:.15,recovery:.35}};sb.time=12;drawn.length=0;sb.drawEnemy(e);const a=drawn.find(x=>/r290/.test(x.src)).a;
 ok(`${id}: facing flips with the hero side; attack plays the attack row (cells 8..11)`,Math.sign(f1)!==Math.sign(f2)&&a[1]===640,{f1,f2,a});}
{const store={'storyworld.r290.mobArt':'{"on":false}'};const {sb,drawn}=mk(store);const e={id:'x',name:D.sheets.m003.name,x:12,y:10,hp:10};sb.drawEnemy(e);
 ok('toggle off (localStorage storyworld.r290.mobArt {"on":false}) → the R248 temporary sheet and body come back',drawn.some(x=>x.src==='assets/r248/mobs/m003.webp')&&!drawn.some(x=>/r290/.test(x.src))&&D.sheets.m003.body===146&&sb.window.__STORYWORLD_MOB_ART_R290__.inspect().applied.length===0);
 const {sb:s2}=mk();const M=s2.window.__STORYWORLD_MOB_ART_R290__;M.set({on:false});const e2={id:'y',name:D.sheets.m001.name,x:12,y:10,hp:10};
 ok('set({on:false}) restores the R248 row for new mobs; other ids untouched (m002 still R248)',s2.window.__STORYWORLD_MOB_UNIQUE_R248__.sheetFor(e2).path==='assets/r248/mobs/m001.webp'&&s2.window.__STORYWORLD_MOB_UNIQUE_R248__.sheetFor({id:'z',name:D.sheets.m002.name}).path==='assets/r248/mobs/m002.webp');}
// 연결
const html=RT('index.html'),man=JSON.parse(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8')),inp=JSON.parse(fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8'));
ok('runtime copies match (overlay, R248 with the path hook)',RT('mob-art-r290.js')===src&&RT('mob-unique-r248.js')===r248&&/path:s\.path\|\|DATA\.dir\+s\.file/.test(r248));
ok('loaded once, after mob-unique-r248 and stranded-r280, before combat-r118',html.split('"./mob-art-r290.js"').length===2&&html.indexOf('"./mob-unique-r248.js"')<html.indexOf('"./mob-art-r290.js"')&&html.indexOf('"./stranded-r280.js"')<html.indexOf('"./mob-art-r290.js"')&&html.indexOf('"./mob-art-r290.js"')<html.indexOf('"./combat-r118.js"'));
ok('in verify list and CI',fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8').includes("'mob-art-r290.js'")&&fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8').includes('r96/qa/r290/r290-cpu-check.cjs'));
ok('runtime manifest/inputs list the overlay and every sheet + index.json with matching hashes',['mob-art-r290.js','assets/r290/mobs/index.json',...ids.map(id=>'assets/r290/mobs/'+id+'.webp')].every(p=>{const row=man.files.find(r=>r.path===p);return inp.textPaths.includes(p)&&row&&row.sha256===sha(fs.readFileSync(path.join(R,'runtime-text',p)));}));
const pass=checks.filter(c=>c.pass).length;for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail).slice(0,400)));
console.log(`R290 ${pass}/${checks.length}`);if(pass!==checks.length)process.exit(1);
