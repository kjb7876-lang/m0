"""Build an additive monster-only art inventory from an explicit runtime census.
Usage: python3 -I scripts/r306-mob-art-variants.py census.json samong.json
No original asset is overwritten. New art is labelled name-based approximation.
"""
import json,re,hashlib,subprocess,tempfile,shutil,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];R=ROOT/'r96';OUT=R/'runtime-text/assets/r306';OUT.mkdir(parents=True,exist_ok=True)
sha=lambda b:hashlib.sha256(b).hexdigest()
def base(n):
 n=re.sub(r'^(중간보스|준보스)\s*·\s*','',str(n));n=re.sub(r'\s*·\s*짙은 형상$','',n);n=re.sub(r'\s*(후속 증원|증원|추격대)$','',n);return re.sub(r'\s+\d+$','',n).strip()
census=json.load(open(sys.argv[1]));zones=json.load(open(sys.argv[2]));old=json.loads((R/'runtime-text/assets/r248/mobs/index.json').read_text());assign=json.loads((R/'runtime-text/assets/r248/r248-assign.json').read_text());byname={a['key']:a['id'] for a in assign}
manifest={v['path']:v for v in json.loads((R/'runtime-manifest.json').read_text())['files']}
entries={};donors={};excluded=[]
def frames(e):
 out=[]
 for state,f in (e.get('frames') or {}).items():
  if not isinstance(f,dict) or not f.get('path'):continue
  a=f.get('assetFrame') or {};out.append({'state':state,'path':f['path'],'sourceRect':a.get('sourceRect'),'pivot':a.get('pivot') or f.get('pivot'),'visibleHeight':a.get('visibleHeight'),'source':'runtime profile/frameSet'})
 for field in ['assigned']:
  a=e.get(field)
  if a and a.get('path'):
   path=a['path'];fixed='assets/r275/mobs/'+Path(path).name
   if fixed in manifest:path=fixed
   for i in range(a.get('frames',1)):
    cw,ch=a['cell'];out.append({'state':'overlay-'+str(i),'path':path,'sourceRect':[i*cw,0,cw,ch],'pivot':a['pivot'],'visibleHeight':a.get('visibleHeight'),'source':field+'; R275 derivative if present'})
 s=e.get('sheet')
 if s:
  for i in range(12):out.append({'state':'R248/R290-'+str(i),'path':s['path'],'sourceRect':[i%4*256,i//4*320,256,320],'pivot':[128,300],'visibleHeight':s['body'],'source':'existing R248/R290 route'})
 if e.get('path'):out.append({'state':'base','path':e['path'],'sourceRect':None,'pivot':None,'visibleHeight':None,'source':'actor base; crop resolved at draw time'})
 return out

def add(e,zone,layer,name=None):
 n=base(name or e.get('name',''));nid=e.get('nativeId')
 if not nid or not n or e.get('tower') or e.get('circle') or re.search('세뇌당한 기억의 조각|피의 육망성 조형물|발록의 소환진',n):
  excluded.append({'zone':zone,'nativeId':nid,'name':n,'reason':'structure/effect enemy or missing stable native ID'});return
 key=layer+'|'+nid+'|'+n
 if key not in entries:entries[key]={'id':'actor-'+sha(key.encode())[:12],'nativeId':nid,'name':n,'layer':layer,'zones':[],'major':bool(e.get('boss') or e.get('midboss') or e.get('persona')),'painted':{'frames':frames(e)},'reason':None}
 row=entries[key]
 if zone not in row['zones']:row['zones'].append(zone)
 s=byname.get(('사몽:' if layer=='DREAM' else '')+n) or byname.get(n)
 if not s and not name and e.get('sheet'):s=e['sheet']['id']
 row['_sheet']=s
for zone in census:
 for e in zone.get('enemies',[]):
  donors.setdefault((zone['zone'],e.get('nativeId')),e)
  for layer in ['STORY','DREAM']:add(e,zone['zone'],layer)
for z in zones:
 for pair in z.get('mobs') or []:
  e=donors.get(tuple(pair))
  if e:add(e,z['id'],'DREAM',z.get('mobName') or e['name'])
  else:excluded.append({'zone':z['id'],'nativeId':pair[1],'reason':'donor not present in runtime room census; retain default'})
 for key in ['lead','boss']:
  lead=z.get(key)
  if not lead:continue
  e=donors.get(tuple(lead.get('donor',[])))
  if e:add({**e,'boss':True},z['id'],'DREAM',lead['name'])
  else:excluded.append({'zone':z['id'],'name':lead.get('name'),'reason':'boss donor unavailable in census; retain default'})
need=sorted({r['name'] for r in entries.values() if not r['_sheet']});newids={n:'p'+sha(n.encode())[:12] for n in need}
with tempfile.TemporaryDirectory(prefix='cx0003-pixel-') as td:
 td=Path(td);inp=td/'assign.json';inp.write_text(json.dumps([{'id':newids[n],'name':n,'key':n} for n in need],ensure_ascii=False))
 subprocess.run([sys.executable,'-I',str(ROOT/'scripts/r248-mob-pixel-art.py'),str(inp),str(td/'pixel')],check=True)
 generated=json.loads((td/'pixel/index.json').read_text());dest=OUT/'pixel';dest.mkdir(exist_ok=True)
 for p in (td/'pixel').iterdir():
  target=dest/p.name
  if target.exists():assert target.read_bytes()==p.read_bytes(),'refusing to overwrite differing generated output: '+str(target)
  else:shutil.copyfile(p,target)
rows={};actors={}
for key,e in entries.items():
 sid=e.pop('_sheet');m=old['mobs'][sid] if sid else generated['mobs'][newids[e['name']]]
 path=('assets/r248/mobs/' if sid else 'assets/r306/pixel/')+m['file']
 e['pixel']={'id':sid or newids[e['name']],'path':path,'sha256':m['sha256'],'bytes':m['bytes'],'cell':[256,320],'cols':4,'pivot':[128,300],'walk':[0,8],'attack':[8,4],'body':m['body'],'kind':m['kind'],'approximate':True,'provenance':{'generator':'scripts/r248-mob-pixel-art.py','generatorSHA256':sha((ROOT/'scripts/r248-mob-pixel-art.py').read_bytes()),'status':'existing temporary pixel sheet' if sid else 'new name-based procedural approximation; not canonical painted art'}}
 paths=sorted({f['path'] for f in e['painted']['frames']});e['painted']['assets']=[{'path':p,'sha256':manifest.get(p,{}).get('sha256'),'bytes':manifest.get(p,{}).get('bytes'),'source':'existing repository runtime manifest','missingReason':None if p in manifest else 'not registered in base manifest'} for p in paths]
 e['painted']['coverage']='base profile + resolved R248/R290 and R208/R275; other dynamic boss phases/overlay routes may be selected at runtime; no claim of exhaustive frame sampling'
 e['painted']['unresolvedFrames']=sum(f['sourceRect'] is None or f['pivot'] is None for f in e['painted']['frames'])
 rows[e['id']]={'pixel':{k:e['pixel'][k] for k in ['path','cell','cols','pivot','body']},'paths':paths,'frames':list({json.dumps({k:f[k] for k in ['path','sourceRect','pivot','visibleHeight']},sort_keys=True):{k:f[k] for k in ['path','sourceRect','pivot','visibleHeight']} for f in e['painted']['frames'] if f['sourceRect'] and f['pivot']}.values())};actors[key]=e['id']
report={'revision':'R306','scope':'monsters and bosses only','default':'unchanged existing renderer (painted plus existing temporary assets)','census':{'baseCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'storyZones':len(census),'samongDefinitions':len(zones),'dynamicSpawnCoverage':'declared R115 donors; unlisted/summoned identities retain default art'},'entries':list(entries.values()),'excluded':excluded,'fallbackReasons':['unknown actor ID/name/layer','structure or effect actor','pixel image not ready','body path not identified','cooperative session']}
(OUT/'mob-art-variants.json').write_text(json.dumps(report,ensure_ascii=False,indent=1)+'\n')
data={'revision':'R306','actors':actors,'rows':rows}
(R/'client-source/mob-art-variants-r306-data.js').write_text('// Generated by scripts/r306-mob-art-variants.py; monster-only allowlist.\nwindow.__STORYWORLD_MOB_ART_VARIANTS_R306_DATA__='+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n')
print(json.dumps({'entries':len(entries),'newApproximateSheets':len(need),'excluded':len(excluded)},ensure_ascii=False))
