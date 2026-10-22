// Match frame inner edges to the existing boundary-wall aperture. No collider is added.
 function hospitalFramePlanesB3(d){
  const h=2.7,t=d.depth,g=d.axis==='x'?d.depth:d.width,inner=g/2-t/2;
  return [[-g/2-t/2,-inner,0,h],[inner,g/2+t/2,0,h],[-inner,inner,h-t,h]];
 }
 function drawHospitalFrameB3(p){
  const d=p.hospitalDoorFrameB3,image=readyImage(p.path)?.image;if(!image)return false;
  const [sx,sy,sw,sh]=[680,20,500,260];
  const point=(u,z)=>{const q=project(d.x+(d.axis==='y'?u:0),d.y+(d.axis==='x'?u:0));return{x:q.x,y:q.y-z*TILE*Math.sqrt(1.5)*zoom};};
  for(const [u0,u1,z0,z1]of hospitalFramePlanesB3(d)){
   const a=point(u0,z1),b=point(u1,z1),c=point(u0,z0);
   ctx.save();try{ctx.transform((b.x-a.x)/sw,(b.y-a.y)/sw,(c.x-a.x)/sh,(c.y-a.y)/sh,a.x,a.y);ctx.drawImage(image,sx,sy,sw,sh,0,0,sw,sh);}finally{ctx.restore();}
  }drawStats.sprites+=3;return true;
 }
