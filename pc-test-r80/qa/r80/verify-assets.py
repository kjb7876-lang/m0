from pathlib import Path
import hashlib,json,argparse
from PIL import Image
parser=argparse.ArgumentParser();parser.add_argument('--source',type=Path,required=True,help='Directory containing all five extracted supplied archives');parser.add_argument('--baseline-site',type=Path,required=True,help='Preserved V3 hospital-three-pc/site directory');args=parser.parse_args()
root=Path(__file__).resolve().parents[2];site=root/'hospital-three-pc/site';source=args.source;oldsite=args.baseline_site;data=json.loads((site/'assets/world-r80/catalog.json').read_text());checks=[]
def check(name,passed,detail=None):checks.append({'name':name,'passed':bool(passed),'detail':detail})
originals=all(hashlib.sha256((source/name).read_bytes()).hexdigest()==h for name,h in data['allOriginalSHA256'].items());check('All 254 source PNGs remain byte-identical to supplied catalogues',len(data['allOriginalSHA256'])==254 and originals)
fail=[]
for key,a in data['assets'].items():
 p=site/a['path'];im=Image.open(p);im.load();f=a['frame']
 if not(hashlib.sha256(p.read_bytes()).hexdigest()==a['sha256'] and list(im.size)==[a['width'],a['height']] and max(im.size)<=512 and len(f['pivot'])==2 and 0<=f['pivot'][0]<=im.width and 0<=f['pivot'][1]<=im.height and im.mode=='RGBA'):fail.append(key)
check('All 153 runtime derivatives decode with valid hashes, aspect and bounded pivots',len(data['assets'])==153 and not fail,fail)
check('Prop and narrative art use separate explicit roles',all(data['assets'][k]['kind']=='prop' for r in data['regions'].values() for k in r['props']) and all(data['assets'][r['echo']]['kind']=='narrative-echo' for r in data['regions'].values() if r['echo']))
mem={id:sum(data['assets'][k]['rgbaBytes'] for k in set(r['props']+[r['echo']]) if k) for id,r in data['regions'].items()};check('Worst scene extra decoded RGBA remains under 8 MiB',max(mem.values())<8*1024*1024,{'maxSceneBytes':max(mem.values()),'runtimeCompressedBytes':sum(a['bytes'] for a in data['assets'].values())})
old=(oldsite/'index.html').read_text();new=(site/'index.html').read_text();import re
payload=lambda x:re.search(r'<script[^>]*id="portable-data"[^>]*>(.*?)</script>',x,re.S)[1];check('Embedded original story and portable data bytes remain unchanged',payload(old)==payload(new))
changed=[]
for p in list((oldsite/'assets').rglob('*'))+list((oldsite/'audio').rglob('*'))+list((oldsite/'delivery').rglob('*')):
 if p.is_file() and hashlib.sha256(p.read_bytes()).digest()!=hashlib.sha256((site/p.relative_to(oldsite)).read_bytes()).digest():changed.append(str(p.relative_to(oldsite)))
check('Every pre-existing game asset and audio file is byte-identical',not changed,changed)
report={'checks':checks,'passed':sum(c['passed'] for c in checks),'failed':sum(not c['passed'] for c in checks),'selectedCounts':data['selectedCounts'],'runtimeCount':len(data['assets']),'sceneCount':len(data['regions'])};(root/'qa/r80/assets-results.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report));assert not report['failed']
lines=['# R80 장면별 자산 배치표','', '기존 맵 구조·서사·적 ID·능력치는 유지합니다. 소품은 비충돌 주변 장식이며 효과 그림은 서사 패널 전용입니다. 원본 PNG는 변경하지 않고 런타임 파생본을 별도로 생성했습니다.','', '| 지역 | 장면 | 소품 원본 | 서사 효과 원본 |','|---|---|---|---|']
for id,r in data['regions'].items():lines.append('| '+id+' | '+r['sceneId']+' '+r['title']+' | '+' / '.join(data['assets'][k]['source'].split('/')[-1] for k in r['props'])+' | '+(data['assets'][r['echo']]['source'].split('/')[-1] if r['echo'] else '없음')+' |')
(root/'qa/r80/SCENE-ASSET-MAP.md').write_text('\n'.join(lines)+'\n')
