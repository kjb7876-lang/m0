# R946: prop-hide-check.mjs 가 남긴 전/후 조각의 평균 픽셀 차(0~255). 8 넘으면 숨김이 화면에 닿음.
import sys,glob
from PIL import Image,ImageChops,ImageStat
bad=0
for a in sorted(glob.glob(sys.argv[1]+'/ph-*-a.png')):
    b=a[:-6]+'-b.png';d=ImageStat.Stat(ImageChops.difference(Image.open(a).convert('RGB'),Image.open(b).convert('RGB'))).mean;m=sum(d)/3
    ok=m>8;bad+=not ok;print('PASS' if ok else 'FAIL',a.split('/')[-1][3:-6],'mean diff %.1f'%m)
sys.exit(1 if bad else 0)
