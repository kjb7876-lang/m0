# R1119 Dots 검토본(구글 드라이브 11-16·11-17, 페르소나 보스) → 게임 자산(webp 가로 한 줄 시트)으로 옮긴다.
# 그림 픽셀은 바꾸지 않는다(옆 피격은 6컷 확정본)(정면 피격 1칸째는 아래쪽 사각 띠 결함이 있어 2칸째로 대신: 칸 순서 [1,1,2,3]).
# 사용: python3 build-assets.py <드라이브 풀어 둔 폴더> <출력 폴더>
import sys,os,json,hashlib
from PIL import Image
SRC,OUT=sys.argv[1],sys.argv[2];os.makedirs(OUT,exist_ok=True);rows=[]
def strip(im,cw,ch,n,order=None):
    cols=im.width//cw;fr=[im.crop(((i%cols)*cw,(i//cols)*ch,(i%cols)*cw+cw,(i//cols)*ch+ch)) for i in range(n)]
    if order: fr=[fr[i] for i in order]
    s=Image.new('RGBA',(cw*len(fr),ch),(0,0,0,0))
    for i,f in enumerate(fr): s.paste(f,(i*cw,0))
    return s
def save(name,im,src,q=88):
    p=os.path.join(OUT,name);im.save(p,'WEBP',quality=q,method=6,exact=True)
    rows.append({'out':name,'src':src,'srcSha256':hashlib.sha256(open(os.path.join(SRC,src),'rb').read()).hexdigest(),'size':os.path.getsize(p),'w':im.width,'h':im.height})
O=lambda p:Image.open(os.path.join(SRC,p)).convert('RGBA')
for form in ('base','awake'):
    save(f'persona-hit-{form}-front.webp',strip(O(f'hit-front/{form}-front-hit4.png'),512,512,4,[1,1,2,3]),f'hit-front/{form}-front-hit4.png')
    # 옆 피격: 사용자 확정(11-17 04:56Z, 드라이브 '02_확정_페르소나_보스_옆_후퇴_피격') 한 발 후퇴 6컷. 앞선 상체 중심 4컷은 드라이브에 보관만.
    save(f'persona-hit-{form}-side.webp',O(f'side6/{form}-side-backstep-hit6.png'),f'side6/{form}-side-backstep-hit6.png')
    save(f'persona-hit-{form}-rear.webp',O(f'hit-rear/{form}-rear-hit4.png'),f'hit-rear/{form}-rear-hit4.png')
    save(f'persona-death-{form}.webp',O(f'orbcast/{form}-light-death.png'),f'orbcast/{form}-light-death.png')
FX=[('clock-flight','clock/clock_flight8_sheet.png',256,256,8),('clock-contact','clock/clock_contact6_sheet.png',256,256,6),
    ('diamond-flight','diamond/diamond_flight8_sheet.png',256,256,8),('diamond-contact','diamond/diamond_contact6_sheet.png',256,256,6),
    ('vortex-flight','vortex/PersonaBoss_vortex_loop8.png',256,256,8),('vortex-contact','vortex/PersonaBoss_vortex_dissipate6.png',256,256,6),
    ('shield-flight','shield/shield_loop8_sheet.png',256,256,8),('shield-contact','shield/shield_contact6_sheet.png',256,256,6),
    ('lance-flight','lance/CX-0106PB_lance_charge8_REVIEW.png',384,384,8),('lance-contact','lance/CX-0106PB_lance_release_fade6_REVIEW.png',384,384,6),
    ('star-flight','branch/flight_sheet.png',256,256,8),('star-contact','branch/contact_sheet.png',256,256,6)]
for n,p,cw,ch,k in FX: save(f'fx-{n}.webp',strip(O(p),cw,ch,k),p)
save('well-orb.webp',O('pm2/ORB/CX-0118PM_r2_PM-2_orb.png'),'pm2/ORB/CX-0118PM_r2_PM-2_orb.png')
save('well-floor.webp',O('pm2/FLOOR/CX-0118PM_r2_PM-2_floor-disc.png'),'pm2/FLOOR/CX-0118PM_r2_PM-2_floor-disc.png')
json.dump(rows,open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'asset-table.json'),'w'),ensure_ascii=False,indent=1)
print(sum(r['size'] for r in rows),'bytes',len(rows),'files')
