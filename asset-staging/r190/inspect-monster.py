import bpy,json
from pathlib import Path
root=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(root/'originals/Demon.blend'),load_ui=False,use_scripts=False)
print('R190_INSPECT',json.dumps({'objects':[{'name':o.name,'type':o.type,'location':list(o.location),'scale':list(o.scale),'dims':list(o.dimensions),'parent':o.parent.name if o.parent else None} for o in bpy.data.objects],'actions':[{'name':a.name,'range':list(a.frame_range)} for a in bpy.data.actions],'images':[{'name':i.name,'path':i.filepath,'packed':bool(i.packed_file),'size':list(i.size)} for i in bpy.data.images]},ensure_ascii=False))
