/* Source topology changes graph geometry, corridor widths and room function.
 * Coordinate zero remains the native encounter/portal core, outside this plan. */
function worldPlanR75(profile,safe=false){
 const topology=profile.sourceTopology||'',style=profile.style||'',indoor=profile.mode==='indoor';
 let family,points,links,width;
 if(safe){family='refuge';points=[[38,18],[56,18],[56,35],[38,35],[75,26]];links=[[0,1],[1,2],[2,3],[3,0],[1,4],[2,4]];width=4;}
 else if(/cathedral|chapel/.test(style)){family='nave-side-chapels';points=[[38,18],[55,18],[75,18],[98,18],[111,18],[55,38],[75,39],[98,38],[75,59],[99,60]];links=[[0,1,6],[1,2,6],[2,3,6],[3,4,6],[1,5,3.8],[2,6,3.8],[3,7,3.8],[5,6,3.8],[6,7,3.8],[6,8,4],[7,9,4],[8,9,4]];width=4.4;}
 else if(/forge|workshop/.test(topology+' '+style)){family='furnace-workshop-loop';points=[[38,18],[57,18],[82,18],[107,18],[107,43],[83,43],[57,43],[38,43],[57,66],[84,66],[108,66]];links=[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,0],[6,8],[8,9],[9,10],[10,4],[5,9]];width=4.8;}
 else if(/bridge|island|islet|synapse|fractur|rift|concentric/.test(topology)){family='island-bridges';points=[[38,18],[56,13],[74,24],[94,12],[111,30],[91,47],[66,45],[44,48],[65,66],[106,66]];links=[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,0],[2,6],[6,8],[8,9],[9,5]];width=3.4;}
 else if(/castle|rampart|throne|plaza|court|ritual/.test(topology+' '+style)){family='sanctuary-approach';points=[[38,18],[52,18],[53,42],[76,42],[98,42],[99,18],[75,17],[112,61],[78,64]];links=[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,1],[3,6],[4,7],[7,8],[8,3]];width=5.8;}
 else if(indoor||/grid|corridor|chamber|stair|vault|aisle|room|workshop/.test(topology)){family=/stair/.test(topology)?'stair-switchback':/spoke|core|ring/.test(topology)?'facility-ring':'facility-corridors';points=family==='stair-switchback'?[[38,18],[60,18],[60,32],[39,32],[39,48],[64,48],[64,65],[89,65],[89,44],[111,44]]:[[38,18],[59,18],[80,18],[103,18],[103,40],[81,40],[59,40],[39,40],[39,63],[70,63],[103,63]];links=family==='stair-switchback'?[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[2,5],[5,8]]:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,0],[7,8],[8,9],[9,10],[10,4],[1,6],[5,9]];width=family==='stair-switchback'?3.6:4.4;}
 else if(profile.mode==='cavern'||/cave|cavern|frozen|forest|grove|path|meadow|garden/.test(topology+' '+style)){family=profile.mode==='cavern'?'cavern-branches':'clearing-trails';points=[[38,18],[51,28],[38,48],[62,57],[77,37],[91,18],[110,32],[105,57],[82,68],[57,73]];links=[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,3],[3,9],[1,4],[4,7]];width=profile.mode==='cavern'?4.2:5;}
 else{family='crossing-loops';points=[[38,18],[60,13],[82,18],[105,15],[111,39],[87,43],[64,39],[40,43],[49,65],[76,66],[104,66]];links=[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,0],[7,8],[8,9],[9,10],[10,4],[2,5],[6,9]];width=5.2;}
 return{family,points,links,width,sourceTopology:topology,purposes:profile.purposes};
}
