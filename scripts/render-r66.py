"""Allocation-only optimization for CommandScene's camera-facing vertex basis.
No change to geometry topology, texture content, shaders, draw order or contacts.
"""
from pathlib import Path

OLD = """worldPoint(p,owner){if(owner?.groundAligned){const q=this.projection.screenToWorld(p[0],p[1]);return new this.T.Vector3(q.x,.012,q.y);}const T=this.T,anchor=Number.isFinite(owner?.x)&&Number.isFinite(owner?.y)?{x:owner.x,y:owner.y}:this.projection.screenToWorld(this.projection.width/2,this.projection.height*.52),screen=this.projection.worldToScreen(anchor.x,anchor.y),right=new T.Vector3(1,0,0).applyQuaternion(this.camera.quaternion),up=new T.Vector3(0,1,0).applyQuaternion(this.camera.quaternion);return new T.Vector3(anchor.x,finite(owner?.renderHeight),anchor.y).addScaledVector(right,(p[0]-screen.x)/this.projection.pixelsPerUnit).addScaledVector(up,(screen.y-p[1])/this.projection.pixelsPerUnit);}"""
NEW = """worldPoint(p,owner){if(owner?.groundAligned){const q=this.projection.screenToWorld(p[0],p[1]);return new this.T.Vector3(q.x,.012,q.y);}const T=this.T,anchor=Number.isFinite(owner?.x)&&Number.isFinite(owner?.y)?{x:owner.x,y:owner.y}:this.projection.screenToWorld(this.projection.width/2,this.projection.height*.52),screen=this.projection.worldToScreen(anchor.x,anchor.y),q=this.camera.quaternion;let basis=this.vertexBasisR66;if(!basis||basis.x!==q.x||basis.y!==q.y||basis.z!==q.z||basis.w!==q.w){basis={x:q.x,y:q.y,z:q.z,w:q.w,right:new T.Vector3(1,0,0).applyQuaternion(q),up:new T.Vector3(0,1,0).applyQuaternion(q)};this.vertexBasisR66=basis;}return new T.Vector3(anchor.x,finite(owner?.renderHeight),anchor.y).addScaledVector(basis.right,(p[0]-screen.x)/this.projection.pixelsPerUnit).addScaledVector(basis.up,(screen.y-p[1])/this.projection.pixelsPerUnit);}"""

def transform(source: str) -> str:
    if source.count(OLD) != 1:
        raise RuntimeError('R66 vertex basis anchor changed; review before applying')
    return source.replace(OLD, NEW)
