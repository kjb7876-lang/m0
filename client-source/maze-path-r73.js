/* Edge-aware pathfinding for additive maze rooms. A* must reject a grid edge
 * that crosses a thin wall; checking only the cell centres can otherwise
 * choose a route that cannot be smoothed or walked. */
function explorationPath(layout,from,to,radius,isBlocked,isClear){
 const bounds=layout.bounds;
 if(![from.x,from.y,to.x,to.y,radius].every(Number.isFinite)||isBlocked(from.x,from.y,radius)||isBlocked(to.x,to.y,radius))return[];
 if(isClear(from,to,radius))return[{x:to.x,y:to.y}];
 const minX=Math.floor(bounds[0]),minY=Math.floor(bounds[1]),width=Math.ceil(bounds[2])-minX+1,index=(x,y)=>x-minX+(y-minY)*width,startX=Math.floor(from.x),startY=Math.floor(from.y),endX=Math.floor(to.x),endY=Math.floor(to.y),start=index(startX,startY),end=index(endX,endY),center=k=>({x:k%width+minX+.5,y:Math.floor(k/width)+minY+.5});
 if(isBlocked(startX+.5,startY+.5,radius)||isBlocked(endX+.5,endY+.5,radius)||!isClear(from,center(start),radius))return[];
 const score=new Map([[start,0]]),previous=new Map(),closed=new Set(),heap=[];let order=0;
 const h=k=>Math.hypot(center(k).x-to.x,center(k).y-to.y);
 const push=(k,g)=>{const row={k,g,f:g+h(k),order:order++};heap.push(row);let i=heap.length-1;while(i){const p=(i-1)>>1;if(heap[p].f<row.f||heap[p].f===row.f&&heap[p].order<row.order)break;heap[i]=heap[p];i=p;}heap[i]=row;};
 const pop=()=>{const row=heap[0],last=heap.pop();if(heap.length){heap[0]=last;let i=0;while(true){let j=i*2+1;if(j>=heap.length)break;if(j+1<heap.length&&(heap[j+1].f<heap[j].f||heap[j+1].f===heap[j].f&&heap[j+1].order<heap[j].order))j++;if(heap[i].f<heap[j].f||heap[i].f===heap[j].f&&heap[i].order<heap[j].order)break;[heap[i],heap[j]]=[heap[j],heap[i]];i=j;}}return row;};
 push(start,0);let limit=width*(Math.ceil(bounds[3])-minY+1);
 while(heap.length&&limit--){const row=pop(),k=row.k;if(closed.has(k)||row.g!==score.get(k))continue;if(k===end){let cur=k,out=[{x:to.x,y:to.y}];while(cur!==start&&previous.has(cur)){out.unshift(center(cur));cur=previous.get(cur);}if(out.length&&!isClear(from,out[0],radius))return[];const smooth=[];let anchor=from;for(let i=0;i<out.length;){let j=i;while(j+1<out.length&&isClear(anchor,out[j+1],radius))j++;smooth.push(out[j]);anchor=out[j];i=j+1;}return smooth;}
  closed.add(k);const x=k%width+minX,y=Math.floor(k/width)+minY;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const a=x+dx,b=y+dy,j=index(a,b);if(a<bounds[0]||b<bounds[1]||a>=bounds[2]||b>=bounds[3]||closed.has(j)||isBlocked(a+.5,b+.5,radius))continue;if(dx&&dy&&(isBlocked(a+.5,y+.5,radius)||isBlocked(x+.5,b+.5,radius)))continue;const fromPoint=k===start?from:center(k),toPoint=center(j);if(!isClear(fromPoint,toPoint,radius)||j===end&&!isClear(toPoint,to,radius))continue;const g=row.g+Math.hypot(dx,dy);if(g<(score.get(j)??Infinity)){score.set(j,g);previous.set(j,k);push(j,g);}}
 }return[];
}
