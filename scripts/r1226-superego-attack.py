# R1226 초자아 잠식체 공격 시트: Dots CX-0171EC 공격4(ROUGH, 256×320 칸, 몸이 칸 오른쪽에 치우침 +50px)를
# 몸 중심 기준으로 다시 놓아 320×320 칸 4개(몸 중심 x=192, 발 y=288)로 만든다. 먹 고리는 왼쪽으로 뻗으므로 칸을 넓혀 잘리지 않게 한다.
# 몸 중심 = 아래쪽(y≥200, 먹 고리 없는 옷자락) 알파 가로 무게중심. 크기·색은 그대로(무손실 WebP).
import sys,hashlib
from PIL import Image
import numpy as np
src=sys.argv[1] if len(sys.argv)>1 else '/mnt/project-files/dots-results/cx0171ec/CX-0171EC_ego-corrosion_attack4_r1_ROUGH.png'
out='r96/runtime-text/assets/r1226/mobs/superego-attack.webp'
im=Image.open(src).convert('RGBA');A=np.asarray(im)
O=Image.new('RGBA',(1280,320),(0,0,0,0))
for i in range(4):
    c=A[:,i*256:(i+1)*256];a=c[200:,:,3].astype(float)
    cx=(a.sum(0)*np.arange(256)).sum()/a.sum()
    dx=int(round(192-cx))
    O.alpha_composite(Image.fromarray(c),(i*320+dx,0))
    print('cell',i,'body cx',round(cx,1),'shift',dx)
O.save(out,lossless=True,quality=100,method=6)
print(out,hashlib.sha256(open(src,'rb').read()).hexdigest()[:12])
