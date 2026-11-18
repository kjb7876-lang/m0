# R1151 Dots CX-0141CE LC-08 r2(1536×1024, 칸 256, 6×4) → 게임 규격 칸 192(1152×768) webp. 알파 16 이하 0, 칸 테두리 2px 비움.
# 사용: python -I make-boom.py <dots png> <out webp>
import sys,json
import numpy as np
from PIL import Image
im=Image.open(sys.argv[1]).convert('RGBA');assert im.size==(1536,1024),im.size
out=Image.new('RGBA',(1152,768),(0,0,0,0))
for i in range(24):
    x0,y0=(i%6)*256,(i//6)*256;c=im.crop((x0,y0,x0+256,y0+256)).resize((192,192),Image.LANCZOS)
    a=np.array(c);a[...,3]=np.where(a[...,3]<=16,0,a[...,3]);a[:2,:,3]=0;a[-2:,:,3]=0;a[:,:2,3]=0;a[:,-2:,3]=0;a[a[...,3]==0]=0
    out.paste(Image.fromarray(a,'RGBA'),((i%6)*192,(i//6)*192))
out.save(sys.argv[2],quality=90,method=6,alpha_quality=100,alpha_filter=0)
chk=np.array(Image.open(sys.argv[2]).convert('RGBA'));print(json.dumps({'size':[1152,768],'low':int(((chk[...,3]>0)&(chk[...,3]<=16)).sum())}))
