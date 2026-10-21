#!/usr/bin/env python3
"""Compose B2 after the exact B1 artifact; preserve input and all asset bytes."""
import argparse,copy,hashlib,json,re,shutil,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'client-source'
PREFIX='storyworld.hospital-b2.test.v1:'
sha=lambda b:hashlib.sha256(b).hexdigest()
def compose(html,renderer):
 assert sha(html.encode())=='d2b0ac231ffab8463feb9675c06f21b18f63f1372dc5f1723ef99e8a65643d4f'
 assert sha(renderer.encode())=='a09c0d264510286b397682d51df7d964543794b3d8b058b534a1cd8f5f7cee1d'
 def replace(s,old,new):
  if s.count(old)!=1:raise ValueError('Exact anchor differs: '+old[:100])
  return s.replace(old,new,1)
 renderer=replace(renderer,'function hospitalMazeLayout5(core,prototype=false){',(SOURCE/'hospital-core-b2.js').read_text()+'\nfunction hospitalMazeLayout5(core,prototype=false){')
 renderer=replace(renderer,"return hospitalMazeLayout5(core,coop==='off');","return coop==='off'?hospitalCoreLayoutB2(core):hospitalMazeLayout5(core,false);")
 renderer=replace(renderer,'function hospitalBlocked12(L,x,y,radius){','function hospitalBlocked12(L,x,y,radius){\n if(L.hospitalCoreB2)return hospitalCoreBlockedB2(L,x,y,radius);')
 renderer=replace(renderer,'if(!hospitalInside12(mid[0]+n[0]*.01,mid[1]+n[1]*.01,!!L.hospitalPrototypeB1))',
  'if(!(L.hospitalCoreB2?hospitalCoreContainsB2(mid[0]+n[0]*.01,mid[1]+n[1]*.01):hospitalInside12(mid[0]+n[0]*.01,mid[1]+n[1]*.01,!!L.hospitalPrototypeB1)))')
 renderer=replace(renderer,'Object.freeze({hospitalVisualPlanB1,','Object.freeze({HOSPITAL_CORE_B2,hospitalCoreLayoutB2,hospitalCoreContainsB2,hospitalCoreBlockedB2,hospitalVisualPlanB1,')
 renderer=replace(renderer,'function hospitalWallHeight(w,floors){','function hospitalWallHeight(w,floors){\n if(w.hospitalCoreB2)return w.height;')
 renderer=replace(renderer,'else{const scale=240/467/34,door=', 'else if(!w.hospitalCoreB2){const scale=240/467/34,door=')
 renderer=replace(renderer,"if(frame.zone!=='ep1a08'||!window.__STORYWORLD_VISUAL_OPTIONS__?.enabled)return;", "if(frame.zone!=='ep1a08'||!frame.exploration?.hospitalCoreB2&&!window.__STORYWORLD_VISUAL_OPTIONS__?.enabled)return;")
 renderer=replace(renderer,"if(frame.zone!=='ep1a08'||!window.__STORYWORLD_VISUAL_OPTIONS__?.enabled||this.visualFloorLease)return;", "if(frame.zone!=='ep1a08'||!frame.exploration?.hospitalCoreB2&&!window.__STORYWORLD_VISUAL_OPTIONS__?.enabled||this.visualFloorLease)return;")
 renderer=replace(renderer,'this.hospitalRegistration31=frame.exploration?.hospitalAnalytic12?hospitalDoorRegistration31(frame.exploration):null;', 'this.hospitalRegistration31=frame.exploration?.hospitalCoreB2?null:frame.exploration?.hospitalAnalytic12?hospitalDoorRegistration31(frame.exploration):null;')
 # The actual geometry source remains descriptor.floor. Tile bridge differences
 # only fill cracks; candidate floors always use the existing hospital material.
 html=replace(html,'if(layout?.coreReshaped){ctx.save();ctx.beginPath();for(const f of layout.coreFloorRects)', 'if(layout?.hospitalCoreB2){/* core map pixels preserved as an asset, not drawn as play floor */}else if(layout?.coreReshaped){ctx.save();ctx.beginPath();for(const f of layout.coreFloorRects)')
 html=replace(html,'function walls(r){if(wallProps.has(r))return wallProps.get(r);','function walls(r){if(wallProps.has(r)&&wallProps.get(r).layoutB2===r.exploration)return wallProps.get(r);')
 html=replace(html,'wallProps.set(r,rows);return rows;}','rows.layoutB2=r.exploration;wallProps.set(r,rows);return rows;}')
 html=replace(html,"function concealed(){return zone==='ep1a08'&&room?.exploration&&!room.cleared", "function concealed(){return zone==='ep1a08'&&room?.exploration&&!room.exploration.hospitalCoreB2&&!room.cleared")
 html=replace(html,"function plan(r){\n  if(!hospital(r))return[];", "function plan(r){\n  if(r?.exploration?.hospitalCoreB2)return window.__STORYWORLD_HOSPITAL_CORE_B2__.plan(r,r.enemies.filter(ordinary),nav());\n  if(!hospital(r))return[];")
 # R72 entries/cache must agree with current layout, in both role directions.
 old="const entry=r.r72Entry||entries.get(key(r.id,r.layer))||nativeStart(r),tag=[entry.x,entry.y,r.cleared,r.engaged,r.finalStage].join(':')"
 new="let entry=r.r72Entry||entries.get(key(r.id,r.layer))||nativeStart(r);if(r.id==='ep1a08'&&blocked(entry.x,entry.y,.43,r)){entry=nativeStart(r);r.r72Entry={x:entry.x,y:entry.y};entries.set(key(r.id,r.layer),r.r72Entry);}const tag=[entry.x,entry.y,r.cleared,r.engaged,r.finalStage,r.id==='ep1a08'?r.exploration?.hospitalLayoutRevision:''].join(':')"
 html=replace(html,old,new)
 html=replace(html,'r.exploration=next;\n    if(r===room', 'r.exploration=next;\n    window.__STORYWORLD_HOSPITAL_CORE_B2__?.repairActors(r);\n    if(r===room')
 html=replace(html,'const p=window.__STORYWORLD_PORTAL_ARRIVAL_R73__?.point(start,r)||start;', 'const p=window.__STORYWORLD_HOSPITAL_CORE_B2__?.playerPoint(r)||window.__STORYWORLD_PORTAL_ARRIVAL_R73__?.point(start,r)||start;')
 html=replace(html,'window.__STORYWORLD_HOSPITAL_R5__?.clampCamera();\n    }\n   }\n   return r;', 'window.__STORYWORLD_HOSPITAL_R5__?.clampCamera();\n    }\n    window.__STORYWORLD_HOSPITAL_CORE_B2__?.repair(r);\n   }\n   return r;')
 html=replace(html,'</body>','<script id="hospital-core-b2-runtime">\n'+(SOURCE/'hospital-runtime-b2.js').read_text()+'\n</script>\n</body>')
 html=re.sub(r'\./dist/phase1\.js\?hospital-b1=[0-9a-f]+','./dist/phase1.js?hospital-b2='+sha(renderer.encode())[:16],html)
 html=replace(html,"const prefix='storyworld.hospital-b1.test.v1:';","const prefix='storyworld.hospital-b2.test.v1:';")
 return html.encode(),renderer.encode()
def build(baseline,output):
 baseline,output=baseline.resolve(),output.resolve()
 if output.exists() or not output.is_relative_to(ROOT/'out') or baseline==output or baseline in output.parents:raise ValueError('Fresh separate B2 output required')
 old=json.loads((baseline/'web-manifest-r62.json').read_text())
 html,renderer=compose((baseline/'index.html').read_text(),(baseline/'dist/phase1.js').read_text())
 shutil.copytree(baseline,output,symlinks=False)
 payload={'index.html':html,'dist/phase1.js':renderer}
 m=copy.deepcopy(old)
 for name,data in payload.items():
  (output/name).write_bytes(data)
  rows=[r for r in m['files'] if r['path']==name]
  if len(rows)!=1:raise ValueError('Unexpected runtime manifest row')
  rows[0].update(bytes=len(data),sha256=sha(data))
 head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
 m['hospitalB2']={'status':'pending independent review','baselineDeploymentSHA':'62f1e7a44e827bc8937d661f600abb523d131433','buildSourceCommit':head,'sourceTreeDirty':subprocess.run(['git','diff','--quiet','HEAD'],cwd=ROOT).returncode!=0,'runtimeHashes':{k:sha(v) for k,v in payload.items()},'storagePrefix':PREFIX,'B1SaveImported':False,'originalSaveImported':False,'saveSchemaChanged':False,'rendererCacheKey':'hospital-b2='+sha(renderer)[:16],'GPUVerified':False,'knownLimitation':'EGO route-room HP changes on first tick in both B1 and B2 CPU fixtures; not original user-save verification'}
 m.update(status='B2 hospital centre test candidate; user play pending',remotePublished=False,deploymentSHA=None,deploymentUTC=None)
 m['webHTMLSha256']=sha(html);m['totalBytes']=sum(r['bytes'] for r in m['files']);m['fileCount']=len(m['files']);m['largest']=sorted(m['files'],key=lambda r:r['bytes'],reverse=True)[:20]
 target=output/'web-manifest-r62.json';target.write_text(json.dumps(m,ensure_ascii=False,separators=(',',':'))+'\n')
 receipt={**m['hospitalB2'],'manifestSHA256':sha(target.read_bytes()),'output':str(output),'sourceHashes':{str(p.relative_to(ROOT)):sha(p.read_bytes()) for p in [Path(__file__),SOURCE/'hospital-core-b2.js',SOURCE/'hospital-runtime-b2.js']}}
 (output.parent/'build.json').write_text(json.dumps(receipt,indent=2)+'\n')
 alias=ROOT/'out/hospital-b2-static/docs';alias.parent.mkdir(parents=True,exist_ok=True)
 if alias.exists() or alias.is_symlink():raise ValueError('Fresh static verifier alias required')
 alias.symlink_to(output,target_is_directory=True)
 return receipt
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--baseline',type=Path,default=ROOT/'out/hospital-b1/build-connected/site');p.add_argument('--output',type=Path,default=ROOT/'out/hospital-b2/site');a=p.parse_args();print(json.dumps(build(a.baseline,a.output)))
