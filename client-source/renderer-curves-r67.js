/* R67 Canvas-path compatibility: cubic curves used by the original silver
 * thread-dance artwork. The curve is flattened after the Canvas transform and
 * DPR conversion, with a 1/8 physical-pixel control-hull tolerance. Nothing in
 * this file changes simulation, authored effects, or the animation clock.
 * Canvas semantics: nonfinite arguments are ignored; absent subpaths start at
 * control point one; continuation after closePath starts at the closed origin.
 */
function appendCubicSegmentR67(out, ax, ay, bx, by, cx, cy, dx, dy, tolerance2, depth) {
  const ux=dx-ax, uy=dy-ay, length2=ux*ux+uy*uy;
  if (!Number.isFinite(length2)) throw new RangeError('Cubic path exceeds finite coordinate range');
  const tb=length2?Math.max(0,Math.min(1,((bx-ax)*ux+(by-ay)*uy)/length2)):0;
  const tc=length2?Math.max(0,Math.min(1,((cx-ax)*ux+(cy-ay)*uy)/length2)):0;
  const ebx=bx-ax-tb*ux, eby=by-ay-tb*uy, ecx=cx-ax-tc*ux, ecy=cy-ay-tc*uy;
  const error2=Math.max(ebx*ebx+eby*eby,ecx*ecx+ecy*ecy);
  if (!Number.isFinite(error2)) throw new RangeError('Cubic path exceeds finite error range');
  if (error2<=tolerance2) { out.push([dx,dy]); return; }
  // Fail closed rather than freeze the main thread or silently omit an effect.
  if (depth>=12 || out.length>=4096) throw new RangeError('Cubic path subdivision budget exceeded');
  const abx=ax*.5+bx*.5, aby=ay*.5+by*.5, bcx=bx*.5+cx*.5, bcy=by*.5+cy*.5;
  const cdx=cx*.5+dx*.5, cdy=cy*.5+dy*.5;
  const abcX=abx*.5+bcx*.5, abcY=aby*.5+bcy*.5, bcdX=bcx*.5+cdx*.5, bcdY=bcy*.5+cdy*.5;
  const mx=abcX*.5+bcdX*.5, my=abcY*.5+bcdY*.5;
  appendCubicSegmentR67(out,ax,ay,abx,aby,abcX,abcY,mx,my,tolerance2,depth+1);
  appendCubicSegmentR67(out,mx,my,bcdX,bcdY,cdx,cdy,dx,dy,tolerance2,depth+1);
}
function drawCubicBezierR67(cp1x,cp1y,cp2x,cp2y,x,y) {
  if (![cp1x,cp1y,cp2x,cp2y,x,y].every(Number.isFinite)) return;
  const b=this.point(cp1x,cp1y), c=this.point(cp2x,cp2y), d=this.point(x,y);
  if (![...b,...c,...d].every(Number.isFinite)) return;
  const prior=this.current;
  const a=prior?.points?.length?(prior.closed?prior.points[0]:prior.points.at(-1)):b;
  const tolerance=.125/Math.max(1,this.dpr), points=[];
  appendCubicSegmentR67(points,a[0],a[1],b[0],b[1],c[0],c[1],d[0],d[1],tolerance*tolerance,0);
  // Commit only a completely validated curve; retain the preceding closed path.
  if (!prior || prior.closed || !prior.points.length) {
    this.current={points:[a.slice()],closed:false};this.paths.push(this.current);
  }
  for (const point of points) this.current.points.push(point);
}
