# R1151 Dots CX-0141CE LC-06 항성 반발 r1(HOLD: F8~13 고리가 칸 옆 경계를 넘음) → 고쳐서 게임 규격 192칸(1152×768) webp.
# 고침: 모든 칸을 피벗(128,128) 기준 같은 비율 0.88 로 줄여 고리를 칸 안으로, 칸 가장자리 8px(256 기준) 부드럽게 사라지게, 알파 16 이하 0, 192칸 테두리 3px 비움.
# 사용: python -I make-repulse.py <dots png> <out webp>
import sys,json
import numpy as np
from PIL import Image
im=Image.open(sys.argv[1]).convert('RGBA');assert im.size==(1536,1024),im.size
K=.88;E=8
ramp=np.ones((256,256),np.float32)
for i in range(E):
    v=i/E;ramp[i,:]=np.minimum(ramp[i,:],v);ramp[-1-i,:]=np.minimum(ramp[-1-i,:],v);ramp[:,i]=np.minimum(ramp[:,i],v);ramp[:,-1-i]=np.minimum(ramp[:,-1-i],v)
out=Image.new('RGBA',(1152,768),(0,0,0,0))
for i in range(24):
    x0,y0=(i%6)*256,(i//6)*256;c=im.crop((x0,y0,x0+256,y0+256));a=np.array(c).astype(np.float32);a[...,3]*=ramp;c=Image.fromarray(a.astype(np.uint8),'RGBA')
    s=round(256*K);c=c.resize((s,s),Image.LANCZOS);cell=Image.new('RGBA',(256,256),(0,0,0,0));o=round(128-128*K);cell.paste(c,(o,o),c)
    a=np.array(cell.resize((192,192),Image.LANCZOS));a[...,3]=np.where(a[...,3]<=16,0,a[...,3]);a[:3,:,3]=0;a[-3:,:,3]=0;a[:,:3,3]=0;a[:,-3:,3]=0;a[a[...,3]==0]=0
    out.paste(Image.fromarray(a,'RGBA'),((i%6)*192,(i//6)*192))
out.save(sys.argv[2],quality=90,method=6,alpha_quality=100,alpha_filter=0)
chk=np.array(Image.open(sys.argv[2]).convert('RGBA'));print(json.dumps({'low':int(((chk[...,3]>0)&(chk[...,3]<=16)).sum())}))
