import bpy,json
from pathlib import Path
R=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(R/'originals/Demon.blend'),load_ui=False,use_scripts=False)
a=bpy.data.objects['CharacterArmature'];a.animation_data_create()
for t in a.animation_data.nla_tracks:t.mute=True
a.animation_data.action=bpy.data.actions['Idle']
rows=[]
for frame in [0,8,16,24]:
 bpy.context.scene.frame_set(frame)
 rows.append({'frame':frame,'bones':[{'name':b.name,'head':list(a.matrix_world@b.head),'tail':list(a.matrix_world@b.tail)} for b in a.pose.bones if any(x in b.name.lower() for x in ['foot','toe','ankle'])]})
used=[]
for o in bpy.context.scene.objects:
 if o.type=='MESH':
  for m in o.data.materials:
   if m and m.use_nodes:
    used.extend({'object':o.name,'material':m.name,'image':n.image.name,'path':n.image.filepath} for n in m.node_tree.nodes if n.type=='TEX_IMAGE' and n.image)
out={'bonesAll':[b.name for b in a.pose.bones],'idleFootSamples':rows,'materialImages':used}
(R/'monster-rig-check.json').write_text(json.dumps(out,indent=2)+'\n');print('R190_RIG_CHECK',json.dumps(out))
