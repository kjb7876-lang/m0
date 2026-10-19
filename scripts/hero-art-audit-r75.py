#!/usr/bin/env python3
"""Read-only audit of the already bundled original hero bytes; never edits art."""
import hashlib,json,pathlib,re
from PIL import Image
ROOT=pathlib.Path(__file__).resolve().parent.parent
site=ROOT/'_pages/docs'
p=json.loads(re.search(r'<script type="application/json" id="portable-data">(.*?)</script>',(site/'index.html').read_text(),re.S)[1])
d=p['heroNativePresentation5'];proof=json.loads((ROOT/'story-source/hero-source-trees-r75.json').read_text())
remote={f['path']:f for t in proof['trees'] for f in t['files']}
names={'hwando':'환도','seoha':'윤서하','neon':'네온 성기사','michaela':'미카엘라','lauren':'라우렌','hunter':'악몽 사냥꾼 · 궁수','slayer':'악몽 사냥꾼 · 검사','gunner':'기억사수'}
files=[]
for path in sorted({x['path'] for r in d['routes'].values() for x in [r,*r.get('variants',[])]}):
 b=(site/path).read_bytes();blob=hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()
 if blob!=remote[path]['gitBlob']:raise ValueError('Original hero bytes differ: '+path)
 im=Image.open(site/path).convert('RGBA');alpha=im.getchannel('A');hist=alpha.histogram()
 files.append({'path':path,'gitBlob':blob,'sha256':hashlib.sha256(b).hexdigest(),'bytes':len(b),'dimensions':list(im.size),'alphaRange':list(alpha.getextrema()),'transparentFraction':hist[0]/(im.width*im.height)})
rows=[]
for key,r in d['routes'].items():
 rows.append({'key':key,'path':r['path'],'sourceCommit':r['sourceCommit'],'sourceGitBlob':r['sourceGitBlob'],'frame':r.get('frame'),'atlasSheet':r.get('atlasSheet'),'allowedFrames':r.get('allowedFrames'),'variants':r.get('variants',[]),'temporalFrames':len(r.get('allowedFrames',[])) if r.get('atlasSheet') else len(r.get('variants',[])) or r.get('authoredTemporalFrames',1),'availability':r.get('poseAvailability','authored route; no extra frames inferred')})
out={'schema':'hapil-original-hero-audit/r75-v1','repository':proof['repository'],'verifiedSourceRef':proof['ref'],'nameRecordInspectedAt':'b0b919d4e18c2e93f871606ece0744d077ff7239','nameRecordPath':'assets/index-v31526.js','nameRecordGitBlob':'3f05ccb23a527123057892b531046956a4b003d7','heroNames':names,'npcOwners':{'michaela-rest':'michaela','lance-owner':'neon','shaman-owner':'lauren'},'pairEvidence':'Native live hero records: neon.fraternalTwinIdV31233=lauren and reciprocal lauren=neon; original source does not fix sibling order. New source cultural forms are not additional source art claims.','bodyTarget':66,'pixelPolicy':'Original bytes unchanged; original route source rectangle, foot pivot, visible body height and flip only.','missing':['No distinct attack B is authored.','Most non-Hwando/Slayer state routes contain one bitmap, not a temporal walk/attack strip.','No original hero ID is assigned to Arvelia or unnamed villagers/guards.'],'files':files,'routes':rows,'atlasFrames':d['atlasFrames']}
(ROOT/'story-source/hero-art-audit-r75.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'files':len(files),'routes':len(rows),'heroes':len(names),'allOriginalBlobsMatch':True},ensure_ascii=False))
