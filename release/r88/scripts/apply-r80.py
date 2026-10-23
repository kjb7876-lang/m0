#!/usr/bin/env python3
"""Install R80 scene art over an already built R78/R79 site. No deployment."""
import argparse,hashlib,json,shutil
from pathlib import Path
root=Path(__file__).resolve().parents[1]
def build(site):
 p=site/'index.html';html=p.read_text()
 if 'ego-restore-health-r79.js' not in html:raise ValueError('R80 requires the R79 tested candidate')
 anchor=".filter(p=>p.path&&readyImage(p.path)?.image&&p.visible!==false&&!p.destroyed&&!p.disabled&&!p.terrainWall&&!/door|wall/i.test(p.visualHospitalFrame||'')&&p!==e)"
 replacement=anchor.replace('.filter(p=>','.filter(p=>!p.r80PresentationOnly&&')
 if replacement not in html:
  if html.count(anchor)!=1:raise ValueError('Scenery throw source anchor changed')
  html=html.replace(anchor,replacement,1)
 for name in ['world-assets-r80-data.js','world-assets-r80.js']:
  shutil.copyfile(root/'client-source'/name,site/name)
  tag='<script src="./'+name+'"></script>'
  if tag not in html:html+='\n'+tag+'\n'
 html=html.replace('storyworld.hospital-three-pc.maze.v3:','storyworld.hospital-three-pc.maze.v4:')
 p.write_text(html)
 # Separate test saves. Source campaign saves and V3 saves stay untouched.
 for name in ['hospital-pc-test.js','hospital-direct-test.js']:
  p=site/name
  if p.exists():p.write_text(p.read_text().replace('storyworld.hospital-three-pc.maze.v3:','storyworld.hospital-three-pc.maze.v4:'))
 manifest=site/'web-manifest-r62.json';d=json.loads(manifest.read_text());rows={r['path']:r for r in d['files']}
 names=['dist/phase1.js','index.html','world-assets-r80-data.js','world-assets-r80.js','hospital-pc-test.js','hospital-direct-test.js']+[str(p.relative_to(site)) for p in (site/'assets/world-r80').glob('*') if p.is_file()]
 for name in names:
  p=site/name
  if not p.is_file():continue
  b=p.read_bytes();rows[name]={'path':name,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}
 d['files']=sorted(rows.values(),key=lambda r:r['path']);d['fileCount']=len(rows);d['totalBytes']=sum(r['bytes'] for r in rows.values());d['webHTMLSha256']=rows['index.html']['sha256'];d['r80']={'scope':'62 scene art mappings; existing hospital and 55 R78 maze layouts retained','nativeCombatStatsChanged':False,'saveSchemaChanged':False,'sceneryThrowsExcludePresentationSprites':True,'htmlSha256':rows['index.html']['sha256']};d['largest']=sorted(d['files'],key=lambda r:r['bytes'],reverse=True)[:20];manifest.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'status':'R80_APPLIED','manifestRows':len(rows),'htmlSha256':rows['index.html']['sha256']}))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--site',type=Path,required=True);a=p.parse_args();build(a.site)
