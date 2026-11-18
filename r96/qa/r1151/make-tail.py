# R1151 Dots CX-0141CE LC-05b 혜성 꼬리 r1(HOLD: 붙는 점 ±1px·루프 미인증) → 게임 규격 192칸(1152×768) webp.
# 원본은 칸마다 같은 비율로 맞춰 은빛 끝이 (200,128)(256 기준)에 있다. 프레임별 재정렬 없이 같은 비율로만 줄인다.
# 고침: 192칸으로 줄인 뒤 알파 16 이하 0, 테두리 3px 비움. 붙는 점은 (150,96)(192 기준) = 코드 piv [200,128].
# 사용: python -I make-tail.py <dots png> <out webp>
import sys,json
import numpy as np
from PIL import Image
im=Image.open(sys.argv[1]).convert('RGBA');assert im.size==(1536,1024),im.size
out=Image.new('RGBA',(1152,768),(0,0,0,0))
for i in range(24):
    x0,y0=(i%6)*256,(i//6)*256
    a=np.array(im.crop((x0,y0,x0+256,y0+256)).resize((192,192),Image.LANCZOS))
    a[...,3]=np.where(a[...,3]<=16,0,a[...,3]);a[:3,:,3]=0;a[-3:,:,3]=0;a[:,:3,3]=0;a[:,-3:,3]=0;a[a[...,3]==0]=0
    out.paste(Image.fromarray(a,'RGBA'),((i%6)*192,(i//6)*192))
out.save(sys.argv[2],quality=90,method=6,alpha_quality=100,alpha_filter=0)
chk=np.array(Image.open(sys.argv[2]).convert('RGBA'));print(json.dumps({'low':int(((chk[...,3]>0)&(chk[...,3]<=16)).sum())}))
