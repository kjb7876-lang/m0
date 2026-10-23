const fs=require('fs'),{createHarness}=require('../harness.cjs');
const h=createHarness(),A=h.context.StoryPhase1,L=A.hospitalCoreLayoutB2({walls:[],surface:{}},[]),rows=[];
const cases=[['left-entry',5,109],['centre-entry',43,109],['right-entry',83,109],['boss-room',20,12],['upper-ward',76,9],['north-exit',5,3.5],['west-route',18.5,95.5],['east-route',68.5,95.5],['middle-ward',21,60]];
let src=fs.readFileSync('client-source/world-presentation-r81.js','utf8');
for(const [name,u,v]of[['current',.2,.18],['wide',.28,.24],['wide2',.3,.25]]){
 h.run('window.__STORYWORLD_WORLD_PRESENTATION_R81__=undefined');
 let s=src.replace(/us=\[[^\]]+\],vs=\[[^\]]+\]/,`us=[0,${-u/2},${u/2},${-u},${u}],vs=[0,${-v/2},${v/2},${-v},${v}]`)
 .replace('h.x<p.width*.24||h.x>p.width*.76||h.y<p.height*.30||h.y>p.height*.76','h.x<p.width*.20||h.x>p.width*.80||h.y<p.height*.26||h.y>p.height*.78||h.y-66*p.zoom<Math.min(96,p.height*.18)');
 h.run(s);const api=h.run('window.__STORYWORLD_WORLD_PRESENTATION_R81__'),results=[];
 for(const [id,x,y]of cases)for(const[width,height]of[[1280,720],[1920,1080],[2560,1080]]){const q=api.cameraPlan(L,{width,height,zoom:1.12,tile:34},{x,y});results.push({id,width,height,before:q.before,after:q.coverage,offset:q.offset,projection:q.projection,hero:{x,y}});}
 const edge=results.filter(x=>/entry|upper-ward|north-exit/.test(x.id)),avg=(rs,stage,k)=>rs.reduce((n,r)=>n+r[stage][k],0)/rs.length;
 rows.push({name,u,v,floor:avg(results,'after','floor'),edgeExterior:avg(edge,'after','exterior'),results});
}
fs.writeFileSync('qa/r81/camera-tuning.json',JSON.stringify(rows,null,2));console.log(rows.map(({results,...s})=>s));
