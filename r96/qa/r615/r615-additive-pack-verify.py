from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import contextlib, hashlib, json, re, subprocess, sys, tempfile, threading
root=Path(__file__).resolve().parents[3]; scripts=root/'scripts'
sys.path.insert(0,str(scripts))
from cdn_cohort import contract, validate_selection
legacy='assets/r381/voice/stub.mp3'
cohort=['assets/audio/bgm/classical/mozart40.mp3','assets/optional/title-loop.mp4','assets/r1305/optional-3d.glb']
mimes=['audio/mpeg','video/mp4','model/gltf-binary']
with tempfile.TemporaryDirectory() as d:
 d=Path(d);site=d/'site';out=d/'cdn';man=d/'runtime.json';cfg=d/'config.json';rows=d/'rows.json';pages=d/'pages-config.json'
 entries=[]
 for i,p in enumerate([legacy]+cohort):
  file=site/p;file.parent.mkdir(exist_ok=True,parents=True)
  b=hashlib.sha256(p.encode()).digest()*8;file.write_bytes(b);entries.append(dict(path=p,bytes=len(b),sha256=hashlib.sha256(b).hexdigest()))
 man.write_text(json.dumps({'files':entries}));config={'schema':'storyworld-asset-cdn/v1','base':'https://storyworld-m0-assets.pages.dev/','prefixes':['assets/r381/voice/'],'additiveVerifyPaths':list(reversed(cohort))}
 config['additiveExpectedSHA256']=contract(entries[1:])['sha256']
 cfg.write_text(json.dumps(config));pages.write_text(json.dumps({'schema':'storyworld-pages-exclude/v1','exclude':[{'prefix':'assets/r381/voice/'}]}))
 def run(name,*args):
  return subprocess.run([sys.executable,str(scripts/name),*map(str,args)],capture_output=True,text=True)
 def pack(*args,additive=True):return run('cdn-pack.py','--manifest',man,'--config',cfg,'--site',site,'--out',out,'--pages-config',pages,*(['--additive-verify'] if additive else []),*args)
 assert pack(additive=False).returncode==0 and json.loads((out/'cdn-health.json').read_text())['files']==1
 assert pack().returncode!=0
 assert pack('--cohort-manifest',out/'not-publish.json').returncode!=0
 for bad in [['assets/../not-allowed.mp3'],[legacy],[cohort[0],cohort[0]],['assets/no-such-asset.mp3']]:
  cfg.write_text(json.dumps(dict(config,additiveVerifyPaths=bad)))
  assert pack('--cohort-manifest',rows).returncode!=0
 cfg.write_text(json.dumps(config))
 cfg.write_text(json.dumps(dict(config,additiveExpectedSHA256='0'*64)));assert pack('--cohort-manifest',rows).returncode!=0
 cfg.write_text(json.dumps(config))
 normal_pages=pages.read_text();pages.write_text(json.dumps({'schema':'storyworld-pages-exclude/v1','exclude':[{'prefix':cohort[0]}]}))
 assert pack('--cohort-manifest',rows).returncode!=0
 pages.write_text(normal_pages)
 good=pack('--cohort-manifest',rows);assert good.returncode==0,good.stderr
 a=json.loads(rows.read_text());assert a['cohort']['files']==3 and a['cohort']==contract(a['objects'][::-1])
 assert a['cohort']!=contract([dict(a['objects'][0],sha256='0'*64),*a['objects'][1:]])
 for e in entries:assert (site/e['path']).read_bytes()==(out/e['path']).read_bytes()
 health=json.loads((out/'cdn-health.json').read_text());assert health['prefixes']==config['prefixes']
 assert health['additiveVerification']==a['cohort'];assert not (out/'rows.json').exists()
 # R615 always has legacy sample checks; reduce samples just for fault injections so
 # these tests exercise fail-closed every-object verification rather than sampled checking.
 health['sample']=[entries[0]];(out/'cdn-health.json').write_text(json.dumps(health))
 fault=None;count=[]
 class H(BaseHTTPRequestHandler):
  def log_message(self,*a):pass
  def do_GET(self):
   path=self.path[1:];rr=self.headers.get('Range');count.append((path,rr))
   item=out/path
   if not item.exists() or fault=='missing' and path==cohort[-1]:self.send_error(404);return
   b=item.read_bytes();ctype=dict(zip(cohort,mimes)).get(path,'audio/mpeg' if path==legacy else 'application/json')
   corrupt_target=path==cohort[-1]
   if fault=='redirect' and corrupt_target:
    self.send_response(302);self.send_header('Location','/must-not-follow');self.end_headers();return
   if fault=='stale' and path=='cdn-health.json': b=json.dumps(dict(health,additiveVerification=dict(a['cohort'],sha256='0'*64))).encode()
   if fault=='corrupt' and corrupt_target: b=bytes([255-b[0]])+b[1:]
   if fault=='mime' and corrupt_target: ctype='text/html'
   if rr and not (fault=='ignore-range' and corrupt_target):
    m=re.fullmatch(r'bytes=(\d+)-(\d+)',rr);st,en=map(int,m.groups());ct=f'bytes {st}-{en}/{len(b)}';b=b[st:en+1]
    if fault=='bad-range' and corrupt_target: ct=ct.replace('bytes ','octets ')
    if fault=='bad-range-body' and corrupt_target: b=bytes([255-b[0]])+b[1:]
    self.send_response(206);self.send_header('Content-Range',ct)
   else:self.send_response(200)
   if not (fault=='cors' and corrupt_target):self.send_header('Access-Control-Allow-Origin','*')
   self.send_header('Content-Type',ctype);self.send_header('Content-Length',str(len(b)));self.end_headers();self.wfile.write(b)
 with ThreadingHTTPServer(('127.0.0.1',0),H) as ser:
  thread=threading.Thread(target=ser.serve_forever,daemon=True);thread.start()
  endpoint=f'http://127.0.0.1:{ser.server_port}/'
  def verify(*args):return run('cdn-verify.py','--base',endpoint,'--pack',out,'--tries',1,*args)
  assert verify().returncode!=0
  ok=verify('--cohort-manifest',rows);assert ok.returncode==0,ok.stderr
  print(ok.stdout.strip())
  for p in cohort:assert (p,None) in count and any(x==p and r for x,r in count)
  for fault in ['stale','missing','corrupt','mime','cors','ignore-range','bad-range','bad-range-body','redirect']:
   failed=verify('--cohort-manifest',rows);assert failed.returncode!=0,(fault,failed.stdout,failed.stderr)
   assert ('public additive' in failed.stderr) if fault=='stale' else cohort[-1] in failed.stderr
   assert all(x!='must-not-follow' for x,_ in count)
   print(f'{fault}: failed closed')
  ser.shutdown()
 print('legacy/local copies retained; exact files and all endpoint adversarial fixtures PASS')
