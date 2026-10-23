#!/usr/bin/env python3
"""Build bounded runtime derivatives from the provided art pack; preserve originals."""
import argparse, hashlib, json, re, io, os
from pathlib import Path
from PIL import Image

def sha(b):return hashlib.sha256(b).hexdigest()
def build(source,site):
 catalogs=[json.loads((source/name).read_text())['assets'] for name in ['new-assets.json','prior-assets.json']]
 all_assets={a['file']:a for rows in catalogs for a in rows}
 scenes=json.loads((source/'scene-coverage.json').read_text())['regions']; selected=set();regions={}
 hospital=[
 'prior_assets/hospital_core/hospital-bed-isometric.png','prior_assets/hospital_core/patient-monitor-isometric.png',
 'prior_assets/hospital_props/hospital_medicine_cabinet.png','prior_assets/hospital_props/hospital_wheelchair.png',
 'prior_assets/hospital_additions/hospital_iv_pole.png','prior_assets/hospital_details/hospital_bedside_locker.png',
 'prior_assets/hospital_props/hospital_consultation_table.png','prior_assets/hospital_props/hospital_instrument_tray.png']
 for r in scenes:
  props=[p for p in r['new_primary_props'] if all_assets[p]['category']=='prop_or_structure'][:3]
  if not props:props=[p for p in r.get('prior_reuse_candidate_files',[]) if all_assets[p]['category']!='architecture'][:3]
  echo=(r.get('bespoke_narrative_vfx') or r.get('source_specific_vfx_union') or [None])[0]
  if r['region_id']=='ep1a08':props=hospital
  selected.update(props)
  if echo:selected.add(echo)
  regions[r['region_id']]={'sceneId':r['scene_id'],'title':r['title'],'sourceBodySHA256':r['source_scene_reference']['bodySHA256'],'sourceProps':props,'sourceEcho':echo}
 destination=site/'assets/world-r80';destination.mkdir(parents=True,exist_ok=True);assets={};source_to_key={}
 for index,name in enumerate(sorted(selected)):
  src=source/name;meta=all_assets[name];original=src.read_bytes();assert sha(original)==meta['image']['sha256'],name
  im=Image.open(src).convert('RGBA');alpha=im.getchannel('A');box=alpha.point(lambda a:255 if a>=16 else 0).getbbox();assert box,name
  x0,y0,x1,y1=box;pad=6;x0=max(0,x0-pad);y0=max(0,y0-pad);x1=min(im.width,x1+pad);y1=min(im.height,y1+pad)
  details=meta.get('pivot_recommendation',{}).get('details');pivot=details.get('xy') if isinstance(details,dict) else None
  if not isinstance(pivot,list) or len(pivot)!=2 or not all(isinstance(v,(int,float)) for v in pivot):pivot=[(x0+x1)/2,y1-(y1-y0)*.10]
  is_prop=name in {p for r in regions.values() for p in r['sourceProps']}
  crop=im.crop((x0,y0,x1,y1));factor=min(1,512/max(crop.size));size=(max(1,round(crop.width*factor)),max(1,round(crop.height*factor)))
  if crop.size!=size:crop=crop.resize(size,Image.Resampling.LANCZOS)
  key='r80-'+str(index).zfill(3);path='assets/world-r80/'+key+'.webp';encoded=io.BytesIO();crop.save(encoded,'WEBP',lossless=True,method=6);payload=encoded.getvalue();assert len(payload)>32;Image.open(io.BytesIO(payload)).load();tmp=(site/path).with_suffix('.tmp');tmp.write_bytes(payload);os.replace(tmp,site/path)
  px=max(0,min(size[0],(pivot[0]-x0)*factor));py=max(0,min(size[1],(pivot[1]-y0)*factor));stem=Path(name).stem.lower();scale=1.15
  if any(k in stem for k in ['cup','tray','flute','mask','alarm','chip','book','enrollment']):scale=.52
  elif any(k in stem for k in ['arch','gate','tower','house','tree','fir','wall','storefront']):scale=2.0
  elif any(k in stem for k in ['column','pillar','door','clock','crossbar']):scale=1.7
  elif any(k in stem for k in ['bed','sofa','coffin','cradle','cabinet','counter']):scale=1.08
  b=(site/path).read_bytes();assets[key]={'path':path,'source':name,'sourceSHA256':sha(original),'sha256':sha(b),'bytes':len(b),'width':size[0],'height':size[1],'rgbaBytes':size[0]*size[1]*4,'kind':'prop' if is_prop else 'narrative-echo','scale':scale,'frame':{'sourceRect':[0,0,*size],'pivot':[round(px,3),round(py,3)],'visibleHeight':size[1],'visibleBounds':[0,0,*size]},'derivative':{'crop':[x0,y0,x1,y1],'scale':factor,'originalPreserved':True,'pivotStatus':'estimated; CPU geometry checked, GPU unverified'}};source_to_key[name]=key
 for r in regions.values():
  r['props']=[source_to_key[p] for p in r.pop('sourceProps')];r['echo']=source_to_key.get(r.pop('sourceEcho'))
 data={'revision':'R80','assets':assets,'regions':regions,'hospitalPropSkins':[source_to_key[p] for p in hospital],'scope':'solo STORY presentation only; native map geometry, enemies, stats, saves and narrative unchanged','originalCounts':{'new':170,'prior':84},'selectedCounts':{'new':sum(a['source'].startswith('new_assets/') for a in assets.values()),'prior':sum(a['source'].startswith('prior_assets/') for a in assets.values())},'allOriginalSHA256':{p:a['image']['sha256'] for p,a in all_assets.items()}}
 (destination/'catalog.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
 root=Path(__file__).resolve().parents[1]
 (root/'client-source/world-assets-r80-data.js').write_text('window.__STORYWORLD_ASSETS_R80_DATA__='+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n')
 print(json.dumps({'regions':len(regions),'selected':len(assets),'selectedCounts':data['selectedCounts'],'runtimeBytes':sum(a['bytes'] for a in assets.values()),'maxSceneRGBA':max(sum(assets[k]['rgbaBytes'] for k in set(k for k in r['props']+[r['echo']] if k)) for r in regions.values())}))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--source',type=Path,required=True);p.add_argument('--site',type=Path,required=True);a=p.parse_args();build(a.source,a.site)
