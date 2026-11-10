import numpy as np,sys,json
x=np.fromfile(sys.argv[1],dtype=np.float32).astype(float);sr=44100;r=json.load(open(sys.argv[2]));plays=r['plays']
d=np.abs(np.diff(x));idx=np.where(d>float(sys.argv[3]) if len(sys.argv)>3 else .025)[0];cl=[]
for i in idx:
    if not cl or i-cl[-1][-1]>4410:cl.append([i])
    else:cl[-1].append(i)
print('clusters',len(cl))
for c in cl:
    t=c[0]/sr*1000;pr=[p for p in plays if p[0]<=t+150 and p[0]>t-1500]
    print('t=%.2fs n=%d maxjump=%.3f'%(t/1000,len(c),d[c].max()),[(p[1],p[2][:18],int(t-p[0])) for p in pr[-4:]])
# per-play: crest & spectral of 300ms after each play start
print('--- per play window')
agg={}
for p in plays:
    i=int(p[0]/1000*sr);seg=x[i:i+int(.35*sr)]
    if len(seg)<1000:continue
    S=np.abs(np.fft.rfft(seg*np.hanning(len(seg))))**2;f=np.fft.rfftfreq(len(seg),1/sr)
    agg.setdefault(p[2][:22],[]).append((np.abs(seg).max(),np.sqrt((seg**2).mean()),S[f<150].sum()/S.sum(),S[(f>=2000)&(f<5000)].sum()/S.sum(),np.abs(np.diff(seg)).max()))
for k,v in agg.items():
    a=np.array(v);print('%-24s n=%2d peak=%.3f rms=%.4f low150=%.2f 2-5k=%.2f maxjump=%.3f'%(k,len(v),*a.mean(0)[:4],a[:,4].max()))
