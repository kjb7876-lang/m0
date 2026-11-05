// R363 레거시(Dots legacy-r92) 몹 다시 그림 — 확정 대응 줄만 적용(사용자 2026-11-06 "레거시도써봐").
//  · 공실 표기 잔재(m052, R248 임시 시트) ← M127: R290 ART 표 줄.  · 흑장미 눈가린 신도(c101-e1) ← M128, 시간수문장(kair-guardian-39) ← M102: mob-legacy-r363.js 가
//    R248 시트 그리기에 nativeId+이름 열쇠로 붙임. 같은 이름의 다른 원본 몹·사몽 줄·다른 R290/R359 몹은 그대로.
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(name,pass,detail)=>checks.push({name,pass:!!pass,detail});
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function webpSize(b){if(b.toString('ascii',0,4)!=='RIFF'||b.toString('ascii',8,12)!=='WEBP')return null;const t=b.toString('ascii',12,16);
 if(t==='VP8L'){const v=b.readUInt32LE(21);return{w:(v&0x3fff)+1,h:((v>>14)&0x3fff)+1,lossless:true};}if(t==='VP8X')return{w:b.readUIntLE(24,3)+1,h:b.readUIntLE(27,3)+1,lossless:b.includes(Buffer.from('VP8L'))};return{w:0,h:0,lossless:false};}
const has=f=>fs.existsSync(path.join(R,'client-source',f));
ok('overlay mob-legacy-r363.js exists',has('mob-legacy-r363.js'));
if(!has('mob-legacy-r363.js')){for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name);console.log(`R363 0/${checks.length}`);process.exit(1);}
const r248=C('mob-unique-r248.js'),dsrc=C('mob-unique-r248-data.js'),r290=C('mob-art-r290.js'),src=C('mob-legacy-r363.js');
const A290=path.join(R,'runtime-text','assets','r290','mobs'),A363=path.join(R,'runtime-text','assets','r363','mobs');
const i290=JSON.parse(fs.readFileSync(path.join(A290,'index.json'),'utf8')),i363=JSON.parse(fs.readFileSync(path.join(A363,'index.json'),'utf8'));
const old=JSON.parse(fs.readFileSync(path.join(R,'runtime-text','assets','r248','mobs','index.json'),'utf8'));
const map=JSON.parse(fs.readFileSync(path.join(__dirname,'legacy-mapping.json'),'utf8'));
const APPLIED={m052:{legacy:'M127',dir:A290,row:i290.mobs.m052},L128:{legacy:'M128',dir:A363,row:i363.mobs.L128},L102:{legacy:'M102',dir:A363,row:i363.mobs.L102}};
// 1. 대응표
ok('mapping: 16 legacy packs listed, each confirmed/plausible/none with evidence and a decision',map.rows.length===16&&map.rows.every(r=>['confirmed','plausible','none'].includes(r.status)&&r.evidence.length>0&&r.decision));
ok('mapping: applied rows are exactly the confirmed M102·M127·M128 (plausible never applied)',JSON.stringify(map.rows.filter(r=>r.applied).map(r=>r.legacy).sort())==='["M102","M127","M128"]'&&map.rows.filter(r=>r.applied).every(r=>r.status==='confirmed'));
// 2. 출처(공개 저장소: 묶음 이름·sha256·크기만, 드라이브 id 없음, 조건부 표기)
const DRIVEID=/drive\.google|\b(?=[\w-]*\d)(?=[\w-]*[a-z])(?=[\w-]*[A-Z])[\w-]{25,}\b/;
for(const [id,a] of Object.entries(APPLIED)){const m=a.row;
 ok(`${id} index provenance: R363, conditional, legacy ${a.legacy}, Drive bundle name+sha256+bytes (no id), Dots mean > 7.77, 12 frames`,m&&m.revision==='R363'&&m.conditional===true&&m.temporary===false&&m.legacy===a.legacy&&/^SW-legacy-.*\.zip$/.test(m.drive.bundle)&&/^[0-9a-f]{64}$/.test(m.drive.sha256)&&m.drive.bytes>1e6&&!('id' in m.drive)&&m.dots.mean>7.77&&m.dots.actualPlayback===false&&m.frames.length===12&&/레거시도써봐/.test(m.approval));
 ok(`${id}: no Drive file id anywhere in the row`,!DRIVEID.test(JSON.stringify({...m,drive:{...m.drive,bundle:''}}).replace(/[0-9a-f]{64}/g,'')));
 const p=path.join(a.dir,m.file),b=fs.existsSync(p)?fs.readFileSync(p):null,s=b&&webpSize(b);
 ok(`${id}: sheet exists, sha256/bytes match, lossless WebP 1024×960`,b&&sha(b)===m.sha256&&b.length===m.bytes&&s.w===1024&&s.h===960&&s.lossless);
 const w=m.frames.slice(0,8);ok(`${id}: feet on the pivot band (walk foot 284..304, max >= 294), nothing clipped, body = walk median`,w.every(f=>f.foot>=284&&f.foot<=304)&&Math.max(...w.map(f=>f.foot))>=294&&m.frames.every(f=>f.top>=0&&f.bbox[3]<=319)&&m.body===w.map(f=>f.body).sort((x,y)=>x-y)[4],m.foot);}
ok('mapping/review/index: no Drive file id',[JSON.stringify(map),fs.readFileSync(path.join(__dirname,'review-r363.json'),'utf8')].every(t=>!DRIVEID.test(t.replace(/[0-9a-f]{64}/g,''))));
ok('m052 replaces the R248 temp sheet, which is kept with its sha256',i290.mobs.m052.replaces.sha256===old.mobs.m052.sha256&&sha(fs.readFileSync(path.join(R,'runtime-text','assets','r248','mobs','m052.webp')))===old.mobs.m052.sha256);
ok('walk source recorded: M127/M128 use the game\'s own r92 legacy walk (sha256 of the strip), M102 its own pack walk',i290.mobs.m052.walkSource.kind==='r92-legacy-walk'&&/^[0-9a-f]{64}$/.test(i290.mobs.m052.walkSource.sha256)&&i363.mobs.L128.walkSource.kind==='r92-legacy-walk'&&i363.mobs.L102.walkSource.kind==='pack');
// 3. 실제 그리기(R248 + R290 + R363 을 vm 에서)
function mk(store={},lay='STORY'){const drawn=[],scales=[];const ctx={save(){},restore(){},translate(){},scale(x,y){scales.push([x,y]);},drawImage(im,...a){drawn.push({src:im.src,a});},scope(meta,f){f();},filter:'',globalAlpha:1};
 const ls={getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;}};
 const sb={console,Math,JSON,Object,Array,Set,Map,WeakMap,Number,String,Promise,Date,localStorage:ls,window:{__STORYWORLD_FX_SPRITES_R106__:{on:()=>true,draw(){},along(){}}},
  time:10,layer:lay,ctx,project:(x,y)=>({x:(x-y)*10,y:(x+y)*5}),actorHeight:()=>60,effects:[],player:{x:10,y:10,hp:100},room:{enemies:[]},
  readyImage:p=>({image:{src:p}}),ensureImages:()=>Promise.resolve(),tick(){},drawEffect(){},drawEnemy(){return 'base';}};
 vm.createContext(sb);vm.runInContext(dsrc,sb);vm.runInContext(r248,sb);vm.runInContext(r290,sb);vm.runInContext(src,sb);return {sb,drawn,scales};}
const sheetDrawn=d=>d.find(x=>/assets\/r(2\d\d|363)\/mobs\//.test(x.src));
const CASES=[['m052','공실 표기 잔재','murder04-e1','assets/r290/mobs/m052.webp',179],['L128','흑장미 눈가린 신도 증원','c101-e1','assets/r363/mobs/L128.webp',261],['L102','시간수문장 39','kair-guardian-39','assets/r363/mobs/L102.webp',164],['L102','중간보스 · 시간수문장 39','kair-guardian-39','assets/r363/mobs/L102.webp',164]];
for(const [id,name,nid,p,body] of CASES){const {sb,drawn,scales}=mk();const e={id:'e'+id,name,nativeId:nid,x:12,y:10,hp:10};sb.drawEnemy(e);const d=sheetDrawn(drawn),k=scales.at(-1)?.[1];
 ok(`${name} (${nid}): drawn from ${p}, 256×320 cell, pivot 128,300, k·body = R248 size`,d&&d.src===p&&d.a[2]===256&&d.a[3]===320&&d.a[4]===-128&&d.a[5]===-300&&k>0&&Math.abs(Math.abs(k)*body-60)<0.01,{d,k});
 e.attack={elapsed:.3,angle:0,shape154:{windup:.45,active:.15,recovery:.35}};sb.time=12;drawn.length=0;sb.drawEnemy(e);const a=sheetDrawn(drawn)?.a;
 ok(`${name}: attack plays the new attack row (cells 8..11)`,a&&a[1]===640,a);}
{const {sb,drawn}=mk();const U=sb.window.__STORYWORLD_MOB_UNIQUE_R248__;
 const same=[['시간수문장 44','kair-guardian-44'],['시간수문장 37','kair-guardian-37'],['뿌리 추적자','kair-guardian-39'],['흑장미 귀막은 신도','c101-e2'],['세뇌 신호 점액체','c101-e3']];
 for(const [n,nid] of same){drawn.length=0;const r=sb.drawEnemy({id:n,name:n,nativeId:nid,x:12,y:10,hp:10});ok(`unaffected: ${n} (${nid}) keeps its original drawing (no R248/R363 sheet)`,r==='base'&&!sheetDrawn(drawn)&&!U.sheetFor({name:n,nativeId:nid}));}
 drawn.length=0;sb.drawEnemy({id:'t',name:'태엽 수집자',nativeId:'c101-e1',x:12,y:10,hp:10});ok('unaffected: 태엽 수집자 on the same nativeId c101-e1 keeps its R248 sheet m033',sheetDrawn(drawn)?.src==='assets/r248/mobs/m033.webp');
 drawn.length=0;sb.drawEnemy({id:'u',name:'ID 배양 점액체',x:12,y:10,hp:10});ok('unaffected: R248 row m056 and R359 row m057 unchanged',sheetDrawn(drawn)?.src==='assets/r248/mobs/m056.webp'&&U.sheetFor({id:'v',name:'본능 추출 결정'}).path==='assets/r290/mobs/m057.webp');}
{const {sb,drawn}=mk({},'DREAM');const r=sb.drawEnemy({id:'d',name:'흑장미 눈가린 신도',nativeId:'c101-e1',x:12,y:10,hp:10,samongR103:true});ok('사몽(DREAM) 같은 이름은 R363 시트를 쓰지 않음',!drawn.some(x=>/r363/.test(x.src)));}
{const {sb,drawn}=mk({'storyworld.r363.legacyMobs':'{"on":false}','storyworld.r290.mobArt':'{"on":false}'});sb.drawEnemy({id:'a',name:'흑장미 눈가린 신도',nativeId:'c101-e1',x:12,y:10,hp:10});sb.drawEnemy({id:'b',name:'공실 표기 잔재',nativeId:'murder04-e1',x:12,y:10,hp:10});
 ok('toggles off → original drawing for R363 rows, R248 temp sheet for m052',!drawn.some(x=>/r363/.test(x.src))&&drawn.some(x=>x.src==='assets/r248/mobs/m052.webp'));}
{const {sb}=mk();const L=sb.window.__STORYWORLD_MOB_LEGACY_R363__,M=sb.window.__STORYWORLD_MOB_ART_R290__;
 ok('overlay rows = r363 index (file, body, name, nativeId); R290 ART m052 = index; applied lists',Object.entries(L.rows).every(([id,r])=>i363.mobs[id]&&i363.mobs[id].file===r.file&&i363.mobs[id].body===r.body&&i363.mobs[id].name===r.name&&i363.mobs[id].nativeId===r.nativeId)&&Object.keys(L.rows).length===Object.keys(i363.mobs).length&&M.art.m052.file==='m052.webp'&&M.art.m052.body===i290.mobs.m052.body&&M.art.m052.name===old.mobs.m052.name&&M.inspect().applied.includes('m052')&&L.inspect().applied.join()==='L128,L102');}
// 4. 픽셀 모드(R306)
const dataSrc=C('mob-art-variants-r306-data.js'),code=C('mob-art-variants-r306.js');
const c={console,layer:'STORY',time:1,player:{id:'hero'},room:{enemies:[]},localStorage:{getItem:()=>null,setItem(){}},document:{getElementById:()=>null,createElement:()=>({}),addEventListener(){}},
 ctx:{imageSmoothingEnabled:true,calls:[],drawImage(im,...a){this.calls.push(im.src);}},readyImage:p=>({image:{src:p,naturalWidth:1024,naturalHeight:960}}),ensureImages:()=>Promise.resolve(),
 serializeSave:()=>({}),restoreSave:async()=>{},drawEnemy(e){c.ctx.drawImage({src:e.sheet},256,0,256,320,-64,-150,64,80);}};
c.window=c;vm.createContext(c);vm.runInContext(dataSrc,c);vm.runInContext(code,c);const D6=c.__STORYWORLD_MOB_ART_VARIANTS_R306_DATA__;
const PX=[['STORY','murder04-e1','공실 표기 잔재','assets/r290/mobs/m052.webp',179],['STORY','c101-e1','흑장미 눈가린 신도','assets/r363/mobs/L128.webp',261],['STORY','kair-guardian-39','시간수문장','assets/r363/mobs/L102.webp',164]];
ok('R306 data: each R363 sheet path is on its STORY actor row with 12 frames (256×320, pivot 128,300, visibleHeight = body); DREAM rows of R363 actors untouched',PX.every(([l,n,nm,p,b])=>{const row=D6.rows[D6.actors[l+'|'+n+'|'+nm]];const fr=row.frames.filter(f=>f.path===p);return row.paths.includes(p)&&fr.length===12&&fr.every((f,i)=>f.visibleHeight===b&&f.pivot[0]===128&&f.pivot[1]===300&&f.sourceRect[0]===i%4*256&&f.sourceRect[1]===Math.floor(i/4)*320);})&&!D6.rows[D6.actors['DREAM|c101-e1|흑장미 눈가린 신도']].paths.some(p=>/r363/.test(p)));
Promise.resolve(c.restoreSave({mobArt:'pixel'})).then(()=>{const bad=[];
 for(const [l,n,nm,p] of PX){const row=D6.rows[D6.actors[l+'|'+n+'|'+nm]];c.layer=l;c.ctx.calls.length=0;c.drawEnemy({nativeId:n,name:nm,sheet:p,hp:10,x:0,y:0});if(c.ctx.calls.join()!==row.pixel.path)bad.push({nm,calls:[...c.ctx.calls]});}
 ok('pixel-mode run (R306): the new sheets are replaced by each actor\'s pixel sheet',bad.length===0&&c.__STORYWORLD_MOB_ART_VARIANTS_R306__.inspect().mode==='pixel',bad);
 // 5. 연결
 const html=RT('index.html'),man=JSON.parse(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8')),inp=JSON.parse(fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8'));
 ok('script tag once, after mob-unique-r248 / mob-art-r290 / R306, right after perf-r360, before combat-r118',html.split('"./mob-legacy-r363.js"').length===2&&['"./mob-unique-r248.js"','"./mob-art-r290.js"','"./mob-art-variants-r306.js"','"./perf-r360.js"'].every(t=>html.indexOf(t)<html.indexOf('"./mob-legacy-r363.js"'))&&html.indexOf('"./mob-legacy-r363.js"')<html.indexOf('"./combat-r118.js"')&&html.includes('<script src="./perf-r360.js"></script><script src="./mob-legacy-r363.js"></script>'));
 ok('runtime copies match; manifest/inputs list the overlay + sheets + index with matching hashes',RT('mob-legacy-r363.js')===src&&RT('mob-art-r290.js')===r290&&RT('mob-art-variants-r306-data.js')===dataSrc&&['mob-legacy-r363.js','mob-art-r290.js','mob-art-variants-r306-data.js','assets/r290/mobs/index.json','assets/r290/mobs/m052.webp','assets/r363/mobs/index.json','assets/r363/mobs/L128.webp','assets/r363/mobs/L102.webp'].every(p=>{const row=man.files.find(r=>r.path===p);return inp.textPaths.includes(p)&&row&&row.sha256===sha(fs.readFileSync(path.join(R,'runtime-text',p)));}));
 ok('in CI + public verify list',fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8').includes('r96/qa/r363/r363-cpu-check.cjs')&&fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8').includes("'mob-legacy-r363.js'"));
 const pass=checks.filter(x=>x.pass).length;for(const x of checks)console.log((x.pass?'PASS ':'FAIL ')+x.name+(x.pass?'':' '+String(JSON.stringify(x.detail)).slice(0,400)));
 console.log(`R363 ${pass}/${checks.length}`);if(pass!==checks.length)process.exit(1);});
