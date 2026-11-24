import bpy,sys
from pathlib import Path
root=Path(sys.argv[sys.argv.index('--')+1])
for p in sorted(root.glob('*.glb')):
 bpy.ops.wm.read_factory_settings(use_empty=True)
 assert 'FINISHED' in bpy.ops.import_scene.gltf(filepath=str(p.absolute()))
 rigs=[o for o in bpy.data.objects if o.type=='ARMATURE']; assert len(rigs)==1 and len(rigs[0].data.bones)>=13
 names=[x.name for x in bpy.data.actions]
 assert any('Idle' in n for n in names) and any('Walk' in n for n in names) and any('Attack_' in n for n in names)
 meshes=[o for o in bpy.data.objects if o.type=='MESH']
 assert len(meshes)>=1 and any(len(o.data.vertices)>100 for o in meshes)
 print(f'GRAFT_BLENDER_OK {p.name}: rig={len(rigs[0].data.bones)} meshes={len(meshes)} actions={names}',flush=True)
