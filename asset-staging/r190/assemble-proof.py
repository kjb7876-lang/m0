from pathlib import Path
from PIL import Image,ImageDraw
import json,hashlib
R=Path(__file__).resolve().parent;O=R/'monster-proof';rows=[];sheet=Image.new('RGBA',(192*4,256*4));preview=Image.new('RGB',(192*4,280*4),(45,42,48));draw=ImageDraw.Draw(preview);anim=[]
for y,d in enumerate(['front','right','back','left']):
 for x in range(4):
  p=O/f'idle-{d}-{x}.png';im=Image.open(p).convert('RGBA');a=im.getchannel('A');box=a.point(lambda n:255 if n>200 else 0).getbbox();rows.append({'file':p.name,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'dimensions':list(im.size),'alphaExtrema':list(a.getextrema()),'opaqueBounds':box,'cornerAlpha':[a.getpixel(pt) for pt in [(0,0),(191,0),(0,255),(191,255)]],'edgeTouch':box[0]==0 or box[1]==0 or box[2]==192 or box[3]==256});sheet.alpha_composite(im,(x*192,y*256));preview.paste(im,(x*192,y*280+24),im);draw.text((x*192+8,y*280+5),f'{d} / Idle {x}',fill=(220,212,205));draw.line((x*192+90,y*280+250,x*192+102,y*280+250),fill=(80,125,112))
for x in range(4):
 im=Image.new('RGB',(768,280),(45,42,48));g=ImageDraw.Draw(im)
 for y,d in enumerate(['front','right','back','left']):
  src=Image.open(O/f'idle-{d}-{x}.png').convert('RGBA');im.paste(src,(y*192,24),src);g.text((y*192+8,5),d+' / prototype only',fill=(220,212,205))
 anim.append(im)
sheet.save(O/'idle-four-directions.png');preview.save(O/'contact-sheet.png');anim[0].save(O/'idle-four-directions.gif',save_all=True,append_images=anim[1:],duration=267,loop=0)
rig=json.loads((R/'monster-rig-check.json').read_text());feet=rig['idleFootSamples'];fixed=all(x['bones']==feet[0]['bones'] for x in feet)
report={'frames':rows,'checks':{'16Frames':len(rows)==16,'RGBA192x256':all(x['dimensions']==[192,256] and x['alphaExtrema']==[0,255] for x in rows),'noOpaqueEdgeClipping':not any(x['edgeTouch'] for x in rows),'distinctAnimationFrames':len(set(x['sha256'] for x in rows))==16,'idleFootBonesStable':fixed,'fourDirections':True,'transparentCorners':all(x['cornerAlpha']==[0,0,0,0] for x in rows)},'pivot':[96,226],'shadow':'Cycles shadow-catcher pass on transparent film','artDecision':'REJECT for runtime: rounded cartoon body and flat atlas texture do not match hand-painted Gothic horror; body/weapon framing is conservative and not a game-size approval','runtimeApplied':False,'shadowLimitation':'Residual corner alpha 5–12/255; transparency gate fails; do not use as production sprite','unverified':['full Walk/Run/Weapon/Death loops','in-game monster scaling and occlusion','natural-play appearance']}
report['inputs']=[{'path':str(R/'originals'/n),'sha256':hashlib.sha256((R/'originals'/n).read_bytes()).hexdigest(),'bytes':(R/'originals'/n).stat().st_size} for n in ['Demon.blend','Atlas_Monsters.png']]
report['tool']=json.loads((R/'blender-download-receipt.json').read_text());report['tool']['executableSHA256']='7421ab1c52a25df4b5dbb0f2ee3f008d9f71f4bb437ff69a1d0af78dfec50323'
(O/'validation.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report['checks']));assert all(report['checks'].values())
