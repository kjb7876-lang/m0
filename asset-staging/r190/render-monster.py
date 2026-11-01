"""Isolated CC0 model proof. Never writes a runtime path or changes the .blend original.
Run with official checksum-verified Blender --background --factory-startup --disable-autoexec --python FILE.
"""
import bpy, math, json
from mathutils import Vector
from pathlib import Path
ROOT=Path(__file__).resolve().parent
OUT=ROOT/'monster-proof';OUT.mkdir(exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'originals/Demon.blend'),load_ui=False,use_scripts=False)
scene=bpy.context.scene
scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=24
scene.cycles.use_denoising=True
scene.render.resolution_x=192;scene.render.resolution_y=256;scene.render.resolution_percentage=100
scene.render.film_transparent=True;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA'
scene.render.threads_mode='FIXED';scene.render.threads=2
scene.view_settings.view_transform='AgX'
for im in bpy.data.images:
 if im.name=='Atlas_Monsters.png':im.filepath=str(ROOT/'originals/Atlas_Monsters.png');im.reload()
# No source scripts, no source scene world lighting, no floor geometry in runtime.
world=bpy.data.worlds.new('R190-proof-world');scene.world=world;world.use_nodes=True
world.node_tree.nodes['Background'].inputs['Color'].default_value=(.15,.12,.18,1)
world.node_tree.nodes['Background'].inputs['Strength'].default_value=.22
arm=bpy.data.objects['CharacterArmature'];arm.animation_data_create()
for track in arm.animation_data.nla_tracks:track.mute=True
arm.animation_data.action=bpy.data.actions['Idle']
meshes=[o for o in scene.objects if o.type=='MESH']
for o in meshes:
 for m in o.data.materials:
  if m and m.use_nodes:
   for n in m.node_tree.nodes:
    if n.type=='BSDF_PRINCIPLED':n.inputs['Roughness'].default_value=.9
# Camera fixed across frames/directions. Pivot world origin projects to (96,226).
elevation=math.radians(30);ortho=7.2
height=((226-128)/256*ortho)/math.cos(elevation)
camdata=bpy.data.cameras.new('R190-proof-camera');cam=bpy.data.objects.new('R190-proof-camera',camdata);scene.collection.objects.link(cam);scene.camera=cam
camdata.type='ORTHO';camdata.ortho_scale=ortho
for name,loc,energy,color,size in [('key',(-3,-4,7),350,(1,.65,.48),5),('rim',(4,3,5),400,(.47,.60,.75),4)]:
 data=bpy.data.lights.new('R190-'+name,'AREA');data.energy=energy;data.color=color;data.shape='DISK';data.size=size
 ob=bpy.data.objects.new('R190-'+name,data);scene.collection.objects.link(ob);ob.location=loc;ob.rotation_euler=(Vector((0,0,1.3))-ob.location).to_track_quat('-Z','Y').to_euler()
# Shadow catcher provides contact shading while keeping transparent background.
bpy.ops.mesh.primitive_circle_add(vertices=64,radius=1.2,fill_type='NGON',location=(0,0,-.015));floor=bpy.context.object;floor.name='R190-shadow-catcher';floor.is_shadow_catcher=True
frames=[]
for direction,angle in [('front',0),('right',90),('back',180),('left',270)]:
 theta=math.radians(angle);target=Vector((0,0,height))
 cam.location=target+Vector((math.sin(theta)*10,-math.cos(theta)*10,10*math.tan(elevation)))
 cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
 for i,frame in enumerate([0,8,16,24]):
  scene.frame_set(frame);name=f'idle-{direction}-{i}.png';scene.render.filepath=str(OUT/name)
  bpy.ops.render.render(write_still=True)
  frames.append({'file':name,'direction':direction,'sourceFrame':frame,'action':'Idle','pivot':[96,226]})
manifest={'blender':bpy.app.version_string,'engine':'Cycles CPU','samples':24,'cell':[192,256],'camera':{'type':'orthographic','elevationDegrees':30,'orthoScale':ortho,'fixedAcrossFrames':True,'footReference':[96,226]},'alpha':'RGBA + transparent film + shadow catcher','originalAnimations':[{'name':a.name,'frames':list(a.frame_range)} for a in bpy.data.actions],'frames':frames,'runtimeApplied':False,'purpose':'Independent style/proportion experiment, not final game art'}
(OUT/'render-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('R190_PROOF_COMPLETE',len(frames))
