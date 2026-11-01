import bpy,math,json
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
bpy.ops.wm.read_factory_settings(use_empty=True)
s=bpy.context.scene;s.render.resolution_x=192;s.render.resolution_y=256;s.render.resolution_percentage=100
D=bpy.data.cameras.new('camera');C=bpy.data.objects.new('camera',D);s.collection.objects.link(C);s.camera=C
D.type='ORTHO';D.ortho_scale=5.4
el=math.radians(30);h=((226-128)/256*5.4)/math.cos(el);target=Vector((0,0,h));C.location=target+Vector((0,-10,10*math.tan(el)));C.rotation_euler=(target-C.location).to_track_quat('-Z','Y').to_euler();bpy.context.view_layer.update()
q=world_to_camera_view(s,C,Vector((0,0,0)));print('PIVOT',q.x*192,(1-q.y)*256,h)
