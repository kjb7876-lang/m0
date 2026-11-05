// R359 Dots 몹 후보 20종을 R290 표에 더함 — R248 임시 픽셀 시트 대신 assets/r290/mobs/ 무손실 시트(부유형은 같은 값 아래로 옮김), 원래 임시 시트는 그대로.
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(name,pass,detail)=>checks.push({name,pass:!!pass,detail});
const src=C('mob-art-r290.js'),r248=C('mob-unique-r248.js'),dsrc=C('mob-unique-r248-data.js');
const A=path.join(R,'runtime-text','assets','r290','mobs'),idx=JSON.parse(fs.readFileSync(path.join(A,'index.json'),'utf8'));
const old=JSON.parse(fs.readFileSync(path.join(R,'runtime-text','assets','r248','mobs','index.json'),'utf8'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function webpSize(b){if(b.toString('ascii',0,4)!=='RIFF'||b.toString('ascii',8,12)!=='WEBP')return null;const t=b.toString('ascii',12,16);
 if(t==='VP8L'){const v=b.readUInt32LE(21);return{w:(v&0x3fff)+1,h:((v>>14)&0x3fff)+1,lossless:true};}if(t==='VP8X')return{w:b.readUIntLE(24,3)+1,h:b.readUIntLE(27,3)+1,lossless:b.includes(Buffer.from('VP8L'))};return{w:0,h:0,lossless:false};}
const ids=['m025','m026','m051','m053','m055','m057','m058','m059','m061','m064','m066','m073','m074','m076','m082','m085','m087','m088','m090','m095'];
const skipped=['m021','m029','m045','m060','m062','m071','m075','m084'];/* 인계가 review·comparison 이거나 zip 없음·ID 연결 금지 → 이번에 적용하지 않음. m030 은 R362(사용자 2026-11-06 결정)에서 이름을 바꿔 적용 */
const KS={coin:.55,lipstick:.6,candy:.6,bottle:.6,mask:.7,blade:.75,heel:.65,cross:.85,paper:.75,slime:.75,crystal:1,fog:.9,serpent:.7,spider:.85,quad:.8,drone:.8};
const APPROVAL='dots 후보(Claude 검토용 인계, 조건부·최종 아님) → 사용자 2026-11-05 적용 지시, PR 승인 대기';
ok('index: twenty R359 rows, conditional, approval note, reason, per-frame source hashes, Dots mean > 7.77',ids.every(id=>{const m=idx.mobs[id];return m&&m.revision==='R359'&&m.temporary===false&&m.conditional===true&&m.approval===APPROVAL&&m.reason&&m.dots?.mean>7.77&&m.dots.actualPlayback===false&&m.frames?.length===12&&m.frames.every(f=>/^[0-9a-f]{64}$/.test(f.sha256||'')&&f.body>60)&&m.source?.sheetMatchesPreassembled===true;})&&Object.keys(idx.mobs).filter(k=>idx.mobs[k].revision==='R359').length===ids.length,ids.filter(id=>!idx.mobs[id]));
ok('public repo: R359 rows keep the Drive bundle *name* + sha256/bytes only (no Drive file id anywhere in those rows)',ids.every(id=>{const d=idx.mobs[id].drive,j=JSON.stringify({...idx.mobs[id],drive:{...d,bundle:''}});return d&&!('id' in d)&&/^SW-m\d{3}-.+\.zip$/.test(d.bundle)&&/^[0-9a-f]{64}$/.test(d.sha256)&&d.bytes>100000&&!/drive\.google|\b(?=[\w-]*\d)(?=[\w-]*[a-z])(?=[\w-]*[A-Z])[\w-]{25,}\b/.test(j.replace(/[0-9a-f]{64}/g,''));}));
ok('skipped candidates are not in the table (review/comparison/no zip/ID-link hold)',skipped.every(id=>!idx.mobs[id]));
ok('sheets exist, sha256/bytes match the index, lossless WebP 1024×960 (4×3 of 256×320)',ids.every(id=>{const m=idx.mobs[id],p=path.join(A,m.file);if(!fs.existsSync(p))return false;const b=fs.readFileSync(p),s=webpSize(b);return sha(b)===m.sha256&&b.length===m.bytes&&s&&s.w===1024&&s.h===960&&s.lossless;}));
ok('feet: walk frames sit on the pivot band (floating mobs moved down by one shiftY for all 12 cells; foot 265..307 — wraith hems lift, no cell clipped)',ids.every(id=>{const m=idx.mobs[id],w=m.frames.slice(0,8);return Number.isInteger(m.shiftY)&&m.shiftY>=0&&m.shiftY<=100&&Math.max(...w.map(f=>f.foot))>=290&&w.every(f=>f.foot>=265&&f.foot<=307)&&m.frames.every(f=>f.bbox[3]<=319&&f.top>=0);}),ids.map(id=>[id,idx.mobs[id].shiftY,idx.mobs[id].foot]));
ok('originals kept: R248 temporary sheets still exist with their recorded sha256 (not overwritten)',ids.concat(skipped).every(id=>{const o=old.mobs[id],p=path.join(R,'runtime-text','assets','r248','mobs',o.file);return fs.existsSync(p)&&sha(fs.readFileSync(p))===o.sha256&&(!idx.mobs[id]||idx.mobs[id].replaces.sha256===o.sha256);}));
function mk(store={}){const drawn=[],scales=[];const ctx={save(){},restore(){},translate(){},scale(x,y){scales.push([x,y]);},drawImage(im,...a){drawn.push({src:im.src,a});},scope(meta,f){f();},filter:'',globalAlpha:1};
 const ls={getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;}};
 const sb={console,Math,JSON,Object,Array,Set,Map,WeakMap,Number,String,Promise,Date,localStorage:ls,window:{__STORYWORLD_FX_SPRITES_R106__:{on:()=>true,draw(){},along(){}}},
  time:10,layer:'STORY',ctx,project:(x,y)=>({x:(x-y)*10,y:(x+y)*5}),actorHeight:()=>60,effects:[],player:{x:10,y:10,hp:100},room:{enemies:[]},
  readyImage:p=>({image:{src:p}}),ensureImages:()=>Promise.resolve(),tick(){},drawEffect(){},drawEnemy(){return 'base';}};
 vm.createContext(sb);vm.runInContext(dsrc,sb);vm.runInContext(r248,sb);vm.runInContext(src,sb);return {sb,drawn,scales};}
const D=(()=>{const s={window:{}};vm.createContext(s);vm.runInContext(dsrc,s);return s.window.__STORYWORLD_MOB_UNIQUE_R248_DATA__;})();
{const {sb}=mk();const M=sb.window.__STORYWORLD_MOB_ART_R290__;
 ok('overlay ART rows = index.json (file, body) and exact names match the R248 sheet rows',ids.every(id=>M.art[id]&&M.art[id].file===idx.mobs[id].file&&M.art[id].body===idx.mobs[id].body&&D.sheets[id].name===M.art[id].name&&idx.mobs[id].name===M.art[id].name));
 ok('applied: all twenty R359 ids; skipped ids keep the R248 temp sheet',ids.every(id=>M.inspect().applied.includes(id))&&skipped.every(id=>!M.inspect().applied.includes(id)&&sb.window.__STORYWORLD_MOB_UNIQUE_R248__.sheetFor({id:'s'+id,name:D.sheets[id].name}).path==='assets/r248/mobs/'+id+'.webp'),M.inspect().applied);}
/* 사몽 전용 줄(m066·m082·m088)은 R248 이 '사몽:' 키로 고른다 — 같은 이름의 본편 줄(예: 찢어진 사진의 망령 → m023)은 그대로 */
const keyOf=id=>Object.keys(D.byName).find(k=>D.byName[k]===id);
for(const id of ids){const {sb,drawn,scales}=mk();const name=D.sheets[id].name,key=keyOf(id),e={id:'e'+id,name:name+' 증원',x:12,y:10,hp:10,...(key.startsWith('사몽:')?{r248Key:key}:{})};sb.drawEnemy(e);
 const d=drawn.find(x=>/assets\/r2\d\d\/mobs\//.test(x.src)),k=scales.at(-1)?.[1];const s248=old.mobs[id];
 const size=Math.min(60*(KS[s248.kind]||1),60*1.3),onNew=k*idx.mobs[id].body;
 ok(`${id} ${name}: drawn from assets/r290/mobs/${id}.webp, R248 cell layout (256×320, pivot 128,300), on-screen body = R248 size rule`,d&&d.src==='assets/r290/mobs/'+id+'.webp'&&d.a[2]===256&&d.a[3]===320&&d.a[4]===-128&&d.a[5]===-300&&Math.abs(onNew-size)<0.01,{d,onNew,size});
 e.attack={elapsed:.3,angle:0,shape154:{windup:.45,active:.15,recovery:.35}};sb.time=12;drawn.length=0;sb.drawEnemy(e);const a=drawn.find(x=>/r290/.test(x.src))?.a;
 ok(`${id}: attack plays the attack row (cells 8..11)`,a&&a[1]===640,a);}
{const store={'storyworld.r290.mobArt':'{"on":false}'};const {sb,drawn}=mk(store);const e={id:'x',name:D.sheets.m057.name,x:12,y:10,hp:10};sb.drawEnemy(e);
 ok('사몽-only rows keep the story row of the same name untouched (찢어진 사진의 망령: story → m023 R248, 사몽 → m088 R359)',(()=>{const {sb}=mk();const U=sb.window.__STORYWORLD_MOB_UNIQUE_R248__;return U.sheetFor({id:'a',name:'찢어진 사진의 망령'}).path==='assets/r248/mobs/m023.webp'&&U.sheetFor({id:'b',name:'찢어진 사진의 망령',r248Key:'사몽:찢어진 사진의 망령'}).path==='assets/r290/mobs/m088.webp';})());
 ok('toggle off (storyworld.r290.mobArt {"on":false}) → R248 temporary sheet and body come back for R359 rows too',drawn.some(x=>x.src==='assets/r248/mobs/m057.webp')&&!drawn.some(x=>/r290/.test(x.src))&&D.sheets.m057.body===old.mobs.m057.body);}
const man=JSON.parse(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8')),inp=JSON.parse(fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8'));
ok('runtime copy matches; manifest/inputs list every new sheet + index.json with matching hashes',RT('mob-art-r290.js')===src&&['mob-art-r290.js','assets/r290/mobs/index.json',...ids.map(id=>'assets/r290/mobs/'+id+'.webp')].every(p=>{const row=man.files.find(r=>r.path===p);return inp.textPaths.includes(p)&&row&&row.sha256===sha(fs.readFileSync(path.join(R,'runtime-text',p)));}));
ok('in CI',fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8').includes('r96/qa/r359/r359-cpu-check.cjs'));
// Codex 4483387588: 픽셀 모드(R306)는 row.paths 에 있는 몸 그림 경로만 픽셀 시트로 바꾼다 — R290 새 시트 경로도 R306 표에 있어야 한다.
// 실제 mob-art-variants-r306.js + 데이터로 restoreSave({mobArt:'pixel'}) 뒤, R290 시트(8인자 칸 그리기)를 그리는 엔진 몸 그림이 R248 픽셀 시트로 바뀌는지 본다.
{const vmm=require('vm');const dataSrc=fs.readFileSync(path.join(R,'client-source','mob-art-variants-r306-data.js'),'utf8'),code=fs.readFileSync(path.join(R,'client-source','mob-art-variants-r306.js'),'utf8');
 const c={console,layer:'STORY',time:1,player:{id:'hero'},room:{enemies:[]},localStorage:{getItem:()=>null,setItem(){}},document:{getElementById:()=>null,createElement:()=>({}),addEventListener(){}},
  ctx:{imageSmoothingEnabled:true,calls:[],drawImage(im,...a){this.calls.push(im.src);}},readyImage:p=>({image:{src:p,naturalWidth:1024,naturalHeight:960}}),ensureImages:()=>Promise.resolve(),
  serializeSave:()=>({}),restoreSave:async()=>{},drawEnemy(e){c.ctx.drawImage({src:e.sheetR248},256,0,256,320,-64,-150,64,80);}};/* 실제 엔진처럼 e.path 는 기증 몹의 원래 그림이고, 몸은 R248 sheetFor 가 고른 R290 시트로 그린다 */
 c.window=c;vmm.createContext(c);vmm.runInContext(dataSrc,c);vmm.runInContext(code,c);
 (async()=>{})();
 const D6=c.__STORYWORLD_MOB_ART_VARIANTS_R306_DATA__;const bad=[];let tried=0;
 const done=c.restoreSave({mobArt:'pixel'});
 globalThis.__r359pixel=Promise.resolve(done).then(()=>{for(const [key,rid] of Object.entries(D6.actors)){const row=D6.rows[rid];const m=/^assets\/r248\/mobs\/(m\d{3})\.webp$/.exec(row.pixel.path);if(!m||!ids.includes(m[1]))continue;
  const [lay,nativeId,name]=key.split('|');c.layer=lay;c.ctx.calls.length=0;const before=c.__STORYWORLD_MOB_ART_VARIANTS_R306__.inspect().stats.unmatched;tried++;
  c.drawEnemy({nativeId,name,path:'assets/donor/original.webp',sheetR248:'assets/r290/mobs/'+m[1]+'.webp',hp:10,x:0,y:0});const st=c.__STORYWORLD_MOB_ART_VARIANTS_R306__.inspect().stats;
  if(c.ctx.calls.join()!==row.pixel.path||st.unmatched!==before)bad.push({key,calls:[...c.ctx.calls]});}
  ok(`pixel-mode run (R306): every catalogued R359 actor drawing its new R290 sheet is replaced by the R248 pixel sheet (${tried} actors, 0 unmatched)`,tried>=20&&bad.length===0&&c.__STORYWORLD_MOB_ART_VARIANTS_R306__.inspect().mode==='pixel',{tried,bad:bad.slice(0,3)});
  ok('R306 data: each R359 path carries 12 frames (256×320 cells, pivot 128,300, visibleHeight = R290 body), like the first five R290 rows',Object.values(D6.rows).every(row=>{const m=/^assets\/r248\/mobs\/(m\d{3})\.webp$/.exec(row.pixel.path);if(!m||!ids.includes(m[1]))return true;const p='assets/r290/mobs/'+m[1]+'.webp';const fr=row.frames.filter(f=>f.path===p);return row.paths.includes(p)&&fr.length===12&&fr.every((f,i)=>f.visibleHeight===idx.mobs[m[1]].body&&f.pivot[0]===128&&f.pivot[1]===300);}));});}
(globalThis.__r359pixel||Promise.resolve()).then(()=>{
const pass=checks.filter(c=>c.pass).length;for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+String(JSON.stringify(c.detail)).slice(0,400)));
console.log(`R359 ${pass}/${checks.length}`);if(pass!==checks.length)process.exit(1);
});
