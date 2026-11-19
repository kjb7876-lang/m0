import json,sys
for f in sys.argv[1:]:
  d=json.load(open(f));R=[r for r in d['rows'] if r.get('abs') and r['state']!='attack']
  acc=[]
  for i in range(2,len(R)):
    if any(abs(R[k]['ey']-R[k-1]['ey'])+abs(R[k]['ex']-R[k-1]['ex'])>.6 for k in (i,i-1)):continue
    a=[R[k]['abs'] for k in (i-2,i-1,i)]
    acc.append(((a[2][0]-2*a[1][0]+a[0][0])**2+(a[2][1]-2*a[1][1]+a[0][1])**2)**.5)
  acc.sort();ws=[r['ink']['w'] for r in d['rows'] if r.get('ink')]
  print(f,'n',len(acc),'jerk mean %.2f median %.2f p90 %.2f max %.2f'%(sum(acc)/len(acc),acc[len(acc)//2],acc[int(len(acc)*.9)],acc[-1]),'inkW max',max(ws) if ws else None)
