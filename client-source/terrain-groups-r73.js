/* Merge only adjacent draw ranges backed by the exact same material object.
 * Index order, vertices, UVs, triangles, depth and face blending stay intact. */
function coalesceMaterialGroupsR73(mesh){
 const g=mesh.geometry,materials=mesh.material;if(!g||!Array.isArray(materials)||g.groups.length<2)return 0;
 const before=g.groups.length,rows=[];
 for(const group of g.groups){const previous=rows.at(-1),material=materials[group.materialIndex];if(previous&&material&&previous.start+previous.count===group.start&&materials[previous.materialIndex]===material)previous.count+=group.count;else rows.push({...group});}
 if(rows.length===before)return 0;
 g.clearGroups();for(const group of rows)g.addGroup(group.start,group.count,group.materialIndex);
 g.userData.r73OriginalGroupCount??=before;mesh.userData.groupsR73={before:g.userData.r73OriginalGroupCount,after:rows.length,indexOrderPreserved:true};return before-rows.length;
}
