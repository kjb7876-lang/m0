import re,json,math,collections,pathlib
root=pathlib.Path('/workspace/scratch/e1f4fcf3efa1/hospital-improvement')
s=(root/'hospital-three-pc/site/dist/phase1.js').read_text();d=json.loads(re.search(r'const HOSPITAL_CORE_B2=Object.freeze\((\{.*?\})\);',s).group(1))
floor={(x,y) for _,a,b,c,e in d['rects'] for x in range(a,c) for y in range(b,e)}
# Endpoints touch the original corridor boundaries exactly; collision uses .24 thickness.
rows=[
 ('observation-bypass-seal',1,19,7,19),
 ('west-entry-seal',2,104,8,104),('east-entry-seal',80,104,86,104),
 ('west-lower-seal',2,79,8,79),('east-lower-seal',80,79,86,79),
 ('west-middle-seal',2,67,8,67),('east-middle-seal',80,67,86,67),
 ('route-divider-lower',43,82,43,88),('centre-shortcut-seal',40,75,46,75),
 ('route-divider-middle',31,68,31,74),
 ('south-a-baffle',12,97,19,97),('south-b-baffle',26,97,33,97),
 ('south-c-baffle',53,97,60,97),('south-d-baffle',67,97,76,97),
 ('consult-a-south-baffle',12,61,25,61),('consult-a-north-baffle',17,57,30,57),
 ('consult-b-baffle',34,61,43,61),
 ('consult-c-south-baffle',52,61,61,61),('consult-c-north-baffle',57,57,66,57),
 ('consult-d-baffle',70,61,75,61),
]
barriers=[{'id':n,'endpoints':[[a,b],[c,e]]} for n,a,b,c,e in rows]
bound=[]
for x,y in floor:
 for dx,dy,a,b,c,e in [(1,0,x+1,y,x+1,y+1),(-1,0,x,y,x,y+1),(0,1,x,y+1,x+1,y+1),(0,-1,x,y,x+1,y)]:
  if (x+dx,y+dy) not in floor:bound.append(((a,b),(c,e)))

def segdist(x,y,a,b):
 vx=b[0]-a[0];vy=b[1]-a[1];t=max(0,min(1,((x-a[0])*vx+(y-a[1])*vy)/(vx*vx+vy*vy)))
 return math.hypot(x-a[0]-vx*t,y-a[1]-vy*t)
doors=[((17,20),(23,20)),((26,90),(32,90)),((1,6),(9,6))]
segments=bound+[v['endpoints'] for v in barriers]+doors
buckets={}
for a,b in segments:
 for xx in range(math.floor(min(a[0],b[0])/8),math.floor(max(a[0],b[0])/8)+1):
  for yy in range(math.floor(min(a[1],b[1])/8),math.floor(max(a[1],b[1])/8)+1):buckets.setdefault((xx,yy),[]).append((a,b))
def dist(x,y):
 return min((segdist(x,y,a,b) for bx in range(math.floor((x-2)/8),math.floor((x+2)/8)+1) for by in range(math.floor((y-2)/8),math.floor((y+2)/8)+1) for a,b in buckets.get((bx,by),[])),default=99)-.12
walk={p for p in floor if dist(p[0]+.5,p[1]+.5)>.4}
def near(p):return min(walk,key=lambda n:(n[0]+.5-p[0])**2+(n[1]+.5-p[1])**2)
def bfs(start,end,ban=lambda p:False):
 q=collections.deque([start]);prev={start:None}
 while q:
  p=q.popleft()
  if p==end:
   path=[]
   while p is not None:path.append(p);p=prev[p]
   return path[::-1]
  for n in [(p[0]+1,p[1]),(p[0]-1,p[1]),(p[0],p[1]+1),(p[0],p[1]-1)]:
   if n not in walk or n in prev or ban(n):continue
   if any(segdist((p[0]+n[0])/2+.5,(p[1]+n[1])/2+.5,a,b)<.52 for a,b in segments[-(len(barriers)+3):]):continue
   prev[n]=p;q.append(n)
 return []
entry=near((43,109));merge=near((20,36))
paths={}
for k,via in [(1,(17,103)),(2,(70,103))]:
 # Branch may not loop down through entry to change route after committing.
 a=bfs(entry,near(via));b=bfs(near(via),merge,lambda p:p[1]>=106)
 paths[k]=a+b[1:] if a and b else []
 print('ROUTE',k,'steps',len(paths[k]),'hasBossAccess?',bool(bfs(near(via),near((20,12)),lambda p:p[1]>=106)))
spawns={}
for k,path in paths.items():
 candidates=[p for p in path if 43<=p[1]<=102 and dist(p[0]+.5,p[1]+.5)>.8]
 # shortest path hugs inside corners; search neighbours for clearance, spaced along path.
 chosen=[]
 for i in range(12):
  p=candidates[round((len(candidates)-1)*i/11)]
  variants=sorted([(x,y) for x in range(p[0]-2,p[0]+3) for y in range(p[1]-2,p[1]+3) if (x,y) in walk and dist(x+.5,y+.5)>.8],key=lambda q:(q[0]-p[0])**2+(q[1]-p[1])**2)
  q=next((q for q in variants if all(math.hypot(q[0]-v[0],q[1]-v[1])>=2 for v in chosen)),None)
  if q:chosen.append(q)
 if k==2:
  chosen=[(70,102),(65,96),(68,88),(62,83),(62,73),(73,70),(73,64),(76,59),(62,63),(54,59),(53,50),(41,55)]
  assert all(p in walk and dist(p[0]+.5,p[1]+.5)>.8 for p in chosen)
 spawns[str(k)]=[{'x':x+.5,'y':y+.5,'clearance':round(dist(x+.5,y+.5),3)} for x,y in chosen]
 print('SPAWNS',k,spawns[str(k)])
def linewalk(path):
 out=[]
 for i,p in enumerate(path):
  if i==0 or i==len(path)-1 or (p[0]-path[i-1][0],p[1]-path[i-1][1]) != (path[i+1][0]-p[0],path[i+1][1]-p[1]):out.append([p[0]+.5,p[1]+.5])
 return out
# Flood reachable from entry; count side branches/isolated floor, boss/exit expected absent.
front={entry};q=collections.deque([entry])
while q:
 p=q.popleft()
 for n in [(p[0]+1,p[1]),(p[0]-1,p[1]),(p[0],p[1]+1),(p[0],p[1]-1)]:
  if n in walk and n not in front and not any(segdist((p[0]+n[0])/2+.5,(p[1]+n[1])/2+.5,a,b)<.52 for a,b in segments[-(len(barriers)+3):]):front.add(n);q.append(n)
report={'source':'preserved HOSPITAL_CORE_B2 floor union','floorCells':len(floor),'barriers':barriers,'routeSpawns':spawns,'pathSteps':{str(k):len(v)-1 for k,v in paths.items()},'paths':{str(k):linewalk(v) for k,v in paths.items()},'closedDoorAssertions':{'bothRoutesReachMerge':all(paths.values()),'bossInaccessible':near((20,12)) not in front,'exitInaccessible':near((5,3.5)) not in front},'reachableSafeCells':len(front),'allSafeCells':len(walk),'playerRadius':.4,'spawnMinimumWallClearance':.8,'browserGPU':False}
(root/'qa/topology-plan.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report['closedDoorAssertions']));print('plan',root/'qa/topology-plan.json')
