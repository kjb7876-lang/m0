/* Read-only UV descriptors. Images are original imagegen output bytes. */
function worldArtR74(profile){
 const atlas=StoryArtR74.atlases.materials,style=/clinic|consultation|observation/.test(profile.style)?'clinical':/chapel|cathedral|vault|forge|machine|clock/.test(profile.style)?'forge':profile.mode==='indoor'?'domestic':'garden',patch=atlas.styles[style],alternate=/mirror|kitchen|cathedral|clock/.test(profile.style);
 return{path:atlas.path,width:atlas.width,height:atlas.height,sha256:atlas.sha256,floorRect:alternate?patch.alternateFloorRect:patch.floorRect,wallRect:patch.wallRect,tileWorld:patch.tileWorld,r55PhysicalUV:true,r74Generated:true,theme:style,environment:profile.sourceEnvironment,r59Backdrop:{path:atlas.path,width:atlas.width,height:atlas.height,sourceRect:patch.voidRect,tileWorld:10,brightness:.46}};
}
