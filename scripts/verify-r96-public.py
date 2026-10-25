from pathlib import Path
import hashlib,json,os,time,urllib.request,urllib.error
root=Path(__file__).resolve().parents[1];r=root/'r96';manifest=(r/'runtime-manifest.json').read_bytes();sha=lambda b:hashlib.sha256(b).hexdigest();rows=json.loads(manifest)['files'];base=os.environ['STORYWORLD_URL'].rstrip('/')+'/'
expected={'web-manifest-r62.json':sha(manifest)}
for v in rows:
 if v['path'] in ['index.html','status-r96.js','assets-r96.js','final42-runtime-r88.js','final42-hooks-r88.js','dist/phase1.js','world-retro-r89.js','perf-r97.js'] or v['path'].startswith('assets/final42-r88/r96/'):expected[v['path']]=v['sha256']
matched=[]
for name,want in expected.items():
 for attempt in range(18):
  try:
   req=urllib.request.Request(base+name+'?release='+os.environ.get('GITHUB_SHA','r96')+'&check='+str(attempt),headers={'Cache-Control':'no-cache'})
   with urllib.request.urlopen(req,timeout=30) as response:b=response.read()
   if sha(b)==want:matched.append({'path':name,'sha256':want});break
  except urllib.error.HTTPError as e:
   if e.code in [401,403]:raise
  time.sleep(5)
 else:raise RuntimeError('Public hash verification failed: '+name)
result={'passed':True,'url':base,'sourceCommit':os.environ.get('GITHUB_SHA'),'files':matched};(r/'public-result.json').write_text(json.dumps(result,indent=2));print(result)
