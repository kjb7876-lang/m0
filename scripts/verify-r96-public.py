from pathlib import Path
import hashlib,json,os,time,urllib.request,urllib.error
root=Path(__file__).resolve().parents[1];r=root/'r96';manifest=(r/'runtime-manifest.json').read_bytes();sha=lambda b:hashlib.sha256(b).hexdigest();rows=json.loads(manifest)['files'];base=os.environ['STORYWORLD_URL'].rstrip('/')+'/'
expected={'web-manifest-r62.json':sha(manifest)}
for v in rows:
 if v['path'] in ['index.html','status-r96.js','assets-r96.js','final42-runtime-r88.js','final42-hooks-r88.js','dist/phase1.js','world-retro-r89.js','perf-r97.js','visual-r93-ui.js','combat-r98.js','vfx-r98.js','world-r98.js','audio-r98.js','perf-r119.js','visual-r119.js','story-reader-r122.js','samong-mood-r123.js','dark-r123.js','ambience-r125.js','polish-r100.js','polish-r101.js','hero-fx-r102.js','props-r102.js','polish-r100-data.js','samong-r103.js','samong-text-r103.js','growth-r103.js','assets/r103/chest-closed.svg','assets/r103/chest-open.svg','bosses-r104.js','bosses-r104-data.js','samong-maps-r105.js','samong-zones-r115-data.js','samong-zones-r115.js','props-static-r105.js','art-drive-r105.js','fx-boss-r105.js','story-canon-r106-data.js','story-canon-r106.js','fx-sprites-r106.js','fx-d2s-r106.js','play-r106.js','mobs-r109.js','play-r111.js','mobs-r112.js','play-r113.js','palette-r114-data.js','weapons-r114-data.js','combat-r114.js','cinema-r114.js','play-r115.js','heroes-r108.js','mobs-tune-r116.js','scene-props-r117.js','combat-r118.js','combat-r137.js', 'drive-props-r138.js', 'samong-ult-r139.js', 'story-batch-r139.js', 'props-variety-r140.js', 'intro-r140.js', 'perf-r141.js','mobile-settings-r142.js','feet-r143.js','attack-anim-r143.js','perf-r150.js','death-r151.js','perf-r154.js','world-tiles-r118.js','crates-r108.js','audio-r108.js','fx-eden-data-r108.js','fx-eden-r108.js','vfx-r98.js','hero-fx-r102.js','polish-r101.js','fx-sprites-r106.js','fx-d2s-r106.js','samong-r103.js','samong-maps-r105.js','world-outdoor-r99.js','story-canon-r106-data.js'] or v['path'].startswith('assets/r104/') or v['path'].startswith('assets/r105/') or v['path'].startswith('assets/r107/') or v['path'].startswith('assets/r109/') or v['path'].startswith('assets/r108/') or v['path'].startswith('assets/r116/') or v['path'].startswith('assets/r118/') or v['path'].startswith('assets/r119/') or v['path'].startswith('assets/r120/') or v['path'].startswith('assets/r121/') or v['path'].startswith('assets/r126/') or v['path'].startswith('assets/r128/') or v['path'].startswith('assets/r129/') or v['path'].startswith('assets/r130/') or v['path'].startswith('assets/final42-r88/r96/'):expected[v['path']]=v['sha256']
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
