from pathlib import Path
import json,hashlib,shutil,re
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'out/hospital-b3';SRC=ROOT/'client-source/hospital-b3';BASE=ROOT/'out/hospital-b2/site'
sha=lambda x:hashlib.sha256(x).hexdigest()
def replace(s,a,b):
 if s.count(a)!=1:raise ValueError('Anchor count '+str(s.count(a))+': '+a[:100])
 return s.replace(a,b,1)
plan=json.loads((SRC/'plan.json').read_text())
dress_plan=json.loads((SRC/'room-dressing-plan.json').read_text())
core=(ROOT/'client-source/hospital-core-b2.js').read_text();start=core.index('const HOSPITAL_CORE_B2=');end=core.index('function hospitalCoreContainsB2')
core=core[:start]+'const HOSPITAL_CORE_B2=Object.freeze('+json.dumps(plan,separators=(',',':'),ensure_ascii=False)+');\n'+core[end:]
core=replace(core,'function hospitalCoreLayoutB2(core){','function hospitalCoreLayoutB2(core,opened=[]){')
core=replace(core,'for(let y=0;y<36;y++){','for(let y=1;y<112;y++){')
core=replace(core,' const nodes=HOSPITAL_CORE_B2.rects.map', ''' // Closed door leaves share the hospital wall material and exact collision domain.
 for(const d of HOSPITAL_CORE_B2.doors)if(!opened.includes(d.id)){
  const endpoints=[[d.x-d.width/2,d.y],[d.x+d.width/2,d.y]];
  walls.push({id:'hospital-b3:'+d.id,hospitalCoreB2:true,hospitalDoorB3:d.id,x:d.x,y:d.y,width:d.width,depth:d.depth,height:2.7,angle:0,endpoints,annex:true,analyticBoundary12:true,analyticBounds12:[d.x-d.width/2,d.y-d.depth/2,d.x+d.width/2,d.y+d.depth/2],path:'assets/visual-test/hospital-quiet-material-atlas-r42.png'});
 }
 const nodes=HOSPITAL_CORE_B2.rects.map''')
core=replace(core,"type:'hospital-core-b2',hospitalCoreB2:HOSPITAL_CORE_B2,","type:'hospital-ward-b3',hospitalCoreB2:HOSPITAL_CORE_B2,hospitalDoorsB3:HOSPITAL_CORE_B2.doors,")
core=replace(core,'hospitalLayoutRevision:HOSPITAL_CORE_B2.revision,',"hospitalLayoutRevision:HOSPITAL_CORE_B2.revision+':'+[...opened].sort().join(','),")
core=replace(core,'bounds:[-4,-1,37,37],chunkMinX:-1,chunkMinY:-1,chunkColumns:5,chunkRows:5,','bounds:[0,0,87,113],chunkMinX:0,chunkMinY:0,chunkColumns:9,chunkRows:12,')
core=replace(core,'renderEnvelope:{u0:-39,u1:39,v0:-2,v1:74}', 'renderEnvelope:{u0:-112,u1:58,v0:0,v1:200}')
core=replace(core,"combatRoomNodeIds:[0,1,2,7,8,12,13]", "combatRoomNodeIds:HOSPITAL_CORE_B2.bays.map(p=>HOSPITAL_CORE_B2.rects.findIndex(([,a,b,c,d])=>p.x>=a&&p.x<c&&p.y>=b&&p.y<d))")
core=replace(core,'node:6,dx:-1,dy:-1',"node:HOSPITAL_CORE_B2.rects.findIndex(r=>r[0]==='entry-hall'),dx:-1,dy:-1")
core=replace(core,'return L.hospitalBoundary12.some(w=>hospitalPointSegment12', 'return hospitalNearbyB3(L,x,y,x,y,radius+.12).some(w=>hospitalPointSegment12')
core+='''
// Spatial broad phase only: exact segment distance remains authoritative.
const hospitalWallBucketsB3=new WeakMap(),hospitalWallQueriesB3=new WeakMap();
function hospitalNearbyB3(L,x0,y0,x1,y1,r){
 let buckets=hospitalWallBucketsB3.get(L);if(!buckets){buckets=new Map();for(const w of L.hospitalBoundary12){const b=w.analyticBounds12;for(let y=Math.floor(b[1]/8);y<=Math.floor(b[3]/8);y++)for(let x=Math.floor(b[0]/8);x<=Math.floor(b[2]/8);x++){const k=x+':'+y;if(!buckets.has(k))buckets.set(k,[]);buckets.get(k).push(w);}}hospitalWallBucketsB3.set(L,buckets);}
 const a=Math.floor((Math.min(x0,x1)-r)/8),b=Math.floor((Math.min(y0,y1)-r)/8),c=Math.floor((Math.max(x0,x1)+r)/8),d=Math.floor((Math.max(y0,y1)+r)/8),key=[a,b,c,d].join(':');let queries=hospitalWallQueriesB3.get(L);if(!queries){queries=new Map();hospitalWallQueriesB3.set(L,queries);}if(queries.has(key))return queries.get(key);const out=new Set();for(let y=b;y<=d;y++)for(let x=a;x<=c;x++)for(const w of buckets.get(x+':'+y)||[])out.add(w);const rows=[...out];if(queries.size>=512)queries.delete(queries.keys().next().value);queries.set(key,rows);return rows;
}
'''
assert (SRC/'hospital-core-b3.js').read_text()==core, 'Reviewed B3 core and builder differ'
html=(BASE/'index.html').read_text();renderer=(BASE/'dist/phase1.js').read_text()
assert sha(html.encode())=='83f6b4e4e96333ca34b791ad95ccbacb0fb4f6ae64e89c0dcef81a36dec74af5'
assert sha(renderer.encode())=='1a18337b276c03a8663162fadbb38a95f935cbd0a6d6e64572d0852d9de5e7d7'
renderer=replace(renderer,(ROOT/'client-source/hospital-core-b2.js').read_text(),core)
renderer=replace(renderer,'for(const w of L.hospitalBoundary12){const[a,b]=w.endpoints,ux=', 'for(const w of L.hospitalDoorsB3?hospitalNearbyB3(L,ax,ay,bx,by,radius):L.hospitalBoundary12){const[a,b]=w.endpoints,ux=')
renderer=replace(renderer,'hospitalCoreLayoutB2(core):hospitalMazeLayout5(core,false)','hospitalCoreLayoutB2(core,meta.hospitalDoorsB3||[]):hospitalMazeLayout5(core,false)')
renderer=replace(renderer,"const quads=row.zone==='ep1a08'&&art?.theme==='hospital'&&window.__STORYWORLD_VISUAL_OPTIONS__?.enabled?", "const quads=row.zone==='ep1a08'&&this.mazeLayoutR73?.hospitalDoorsB3?[]:row.zone==='ep1a08'&&art?.theme==='hospital'&&window.__STORYWORLD_VISUAL_OPTIONS__?.enabled?")
# Existing closure owns exactly the same door serializer, clean validator and interactions.
world=re.search(r'<script[^>]*id="world-r74"[^>]*>(.*?)</script>',html,re.S)[1];originalWorld=world
world=replace(world,"const doors=r=>r?.exploration?.worldR74?.doors||[],isOpen=", "const doors=r=>{if(solo()&&r?.id==='ep1a08'&&r.exploration?.hospitalDoorsB3){const k=key(r.id,r.layer);if(entries[k]!==1){if(!Object.hasOwn(entries,k)&&Object.keys(entries).length>=limit)throw Error('Hospital door entry capacity');entries[k]=1;generation++;}return r.exploration.hospitalDoorsB3;}return r?.exploration?.worldR74?.doors||[];},isOpen=")
world=replace(world,"note('door',{id:d.id,open:!close});saveGame(false);", "note('door',{id:d.id,open:!close});if(room?.exploration?.hospitalDoorsB3)window.__STORYWORLD_EXPLORATION__?.attach(room);saveGame(false);")
world=replace(world,'Object.freeze({version,assetPaths,', "Object.freeze({openedFor:(id,l)=>[...(opened[key(id,l)]||[])],version,assetPaths,")
html=replace(html,originalWorld,world)
html=replace(html,"':hospital-mode:'+mode:''", "':hospital-mode:'+mode+':doors:'+JSON.stringify(window.__STORYWORLD_WORLD_R74__?.openedFor(id,l)||[]):''")
html=replace(html,'seedR73:seed,worldR74:version,worldR75:r75version','seedR73:seed,worldR74:version,worldR75:r75version,hospitalDoorsB3:id===\'ep1a08\'?window.__STORYWORLD_WORLD_R74__?.openedFor(id,l)||[]:[]')
# Render reused hospital frame as an ordinary scoped prop in both command/Legacy paths.
runtime=(ROOT/'client-source/hospital-runtime-b2.js').read_text()
runtime=replace(runtime,'  repairActors(r);\n  if(active&&player){', '''  repairActors(r);
  r.props=r.props.filter(p=>!p.hospitalDoorFrameB3);
  if(isB2(r)&&r.exploration.hospitalDoorsB3)for(const d of r.exploration.hospitalDoorsB3)r.props.push({id:'hospital-b3-frame:'+d.id,x:d.x,y:d.y,solid:false,visible:true,autoTargetEligible6:false,hospitalDoorFrameB3:d,path:'assets/visual-test/hospital-quiet-material-atlas-r42.png'});
  if(active&&player){''')
runtime=replace(runtime,"if(isB2(room)&&p?.visualHospitalFrame==='openDoor')return;", "if(p?.hospitalDoorFrameB3&&room?.exploration?.hospitalDoorsB3){const paint=()=>drawHospitalFrameB3(p);return typeof ctx.scope==='function'?ctx.scope({id:'prop:'+p.id,kind:'prop',x:p.x,y:p.y,bodyPath:p.path,alive:true},paint):paint();}if(isB2(room)&&p?.visualHospitalFrame==='openDoor')return;")
runtime=runtime.replace("revision:'ep1a08-core-network-b2-v1'","revision:'ep1a08-ward-network-b3-v1'")
runtime=replace(runtime,' const drawPropBase=drawProp;', (SRC/'frame-helper.js').read_text()+' const drawPropBase=drawProp;')
html=replace(html,(ROOT/'client-source/hospital-runtime-b2.js').read_text(),runtime)
old_props="""function props(r){if(!r?.exploration||r.id!=='ep1a08')return[];if(cache.has(r))return cache.get(r);const gate=r.exploration.gate||{x:31.5,y:31.5};const rows=[{id:'visual-hospital:south-door',scene:'south-door',path,visualHospitalFrame:'openDoor',x:gate.x,y:gate.y,height:240,solid:false,visible:true,presentationOnly:true,autoTargetEligible6:false}];cache.set(r,rows);return rows;}"""
items=json.dumps(dress_plan['items'],ensure_ascii=False,separators=(',',':'))
new_props=f"""const HOSPITAL_ROOM_DRESSING_B3=Object.freeze({items});
 function props(r){{if(!r?.exploration||r.id!=='ep1a08'||!String(r.exploration.hospitalLayoutRevision||'').startsWith('ep1a08-ward-network-b3-v1'))return[];if(cache.has(r))return cache.get(r);const gate=r.exploration.gate||{{x:31.5,y:31.5}};const rows=[{{id:'visual-hospital:south-door',scene:'south-door',path,visualHospitalFrame:'openDoor',x:gate.x,y:gate.y,height:240,solid:false,visible:true,presentationOnly:true,autoTargetEligible6:false}},...HOSPITAL_ROOM_DRESSING_B3.map(d=>({{id:'hospital-dressing-b3:'+d.id,roomFunctionB3:d.purpose,roomIdB3:d.room,path,visualHospitalFrame:d.frame,x:d.x,y:d.y,height:d.height,hospitalDressingB3:true,visualFlipXB3:d.flipX===true,hospitalZone13:true,solid:false,visible:true,presentationOnly:true,autoTargetEligible6:false}}))];cache.set(r,rows);return rows;}}"""
html=replace(html,old_props,new_props)
old_draw="else ctx.drawImage(row.image,...f.rect,q.x-f.pivot[0]*scale,q.y-f.pivot[1]*scale,width,height);"
new_draw="else if(p.hospitalDressingB3){ctx.translate(q.x,q.y);if(p.visualFlipXB3)ctx.scale(-1,1);ctx.drawImage(row.image,...f.rect,-f.pivot[0]*scale,-f.pivot[1]*scale,width,height);}else ctx.drawImage(row.image,...f.rect,q.x-f.pivot[0]*scale,q.y-f.pivot[1]*scale,width,height);"
html=replace(html,old_draw,new_draw)
html=re.sub(r'hospital-b2=[0-9a-f]{16}', 'hospital-b3='+sha(renderer.encode())[:16],html)
site=OUT/'site'
if site.exists():raise ValueError('Fresh candidate output required; preserve previous attempts')
shutil.copytree(BASE,site,symlinks=False)
(site/'index.html').write_text(html);(site/'dist/phase1.js').write_text(renderer)
m=json.loads((site/'web-manifest-r62.json').read_text())
for row in m['files']:
 if row['path'] in ['index.html','dist/phase1.js']:
  b=(site/row['path']).read_bytes();row.update(bytes=len(b),sha256=sha(b))
status=__import__('subprocess').check_output(['git','status','--porcelain','--untracked-files=all'],cwd=ROOT,text=True).splitlines()
source_dirty=any(line[3:] and not line[3:].startswith('out/') for line in status)
m['hospitalB3']={'status':'hospital-only test candidate','baselineDeploymentSHA':'f81d0d78af5bce04532b948a3cee36aa4fd4d5b8','storagePrefix':'storyworld.hospital-b2.test.v1:','sourceHashes':{p.name:sha(p.read_bytes()) for p in sorted(SRC.iterdir()) if p.is_file()},'runtimeHashes':{p:sha((site/p).read_bytes()) for p in ['index.html','dist/phase1.js']},'GPUVerified':False,'existingNamespacePreserved':True,'existingPublicSavesRemainInPlace':True,'existingSavesImported':False,'saveSchemaChanged':False,'saveFormatVersion':1,'doorStateStorage':'existing worldR74 v1 entries/opened fields','roomDressingItems':len(dress_plan['items']),'roomDressingPlanSHA256':sha((SRC/'room-dressing-plan.json').read_bytes())}
m['hospitalB3'].update(buildSourceCommit=__import__('subprocess').check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),sourceTreeDirty=source_dirty,rendererCacheKey='hospital-b3='+sha(renderer.encode())[:16],originalSaveImported=False,B1SaveImported=False,B2SaveImported=False,storageNamespacePreserved=True)
m.update(status='hospital-only test candidate',webHTMLSha256=sha(html.encode()));m['totalBytes']=sum(r['bytes'] for r in m['files']);m['largest']=sorted(m['files'],key=lambda r:r['bytes'],reverse=True)[:20]
(site/'web-manifest-r62.json').write_text(json.dumps(m,ensure_ascii=False,separators=(',',':'))+'\n')
receipt={**m['hospitalB3'],'manifestSHA256':sha((site/'web-manifest-r62.json').read_bytes()),'buildScriptSHA256':sha(Path(__file__).read_bytes()),'fileCount':len(m['files'])}
(OUT/'build.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps(receipt))

alias=ROOT/'out/hospital-b3-static/docs'
alias.parent.mkdir(parents=True,exist_ok=True)
if alias.exists() or alias.is_symlink():raise ValueError('Fresh B3 verifier alias required')
alias.symlink_to(site,target_is_directory=True)
