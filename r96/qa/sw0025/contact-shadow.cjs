const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const dest=path.resolve(__dirname,'../../..'), root=process.env.M0_BASELINE||dest;
const built=path.join(root,'r96/hospital-three-pc/site');
const h=fs.readFileSync(path.join(built,'index.html'),'utf8'),d=fs.readFileSync(path.join(built,'dist/phase1.js'),'utf8');
const stock=h.slice(h.indexOf('function shadow('),h.indexOf('function bossSkillPaths150('));
let tests=0;const ck=(ok,m)=>{assert.ok(ok,m);tests++;};
const live=(extra={})=>({id:'mob',nativeId:'mob',name:'접지 몹',x:2,y:3,hp:10,spawnState:'active',direction:'right',...extra});
const contact=c=>c.kind==='fill'&&c.style.fillStyle==='#0b0d0e';
const broad=cs=>cs.filter(c=>c.kind==='fill'&&!contact(c));
const ct=cs=>cs.filter(contact);
function boot({source=dest,low=false,legacy=false,coarse=false}={}){
 const v={window:{},localStorage:{data:{},getItem(k){return this.data[k]??null;},setItem(k,x){this.data[k]=x;}},settings:{lowFx:low},coarsePointerQueryR63R2:{matches:coarse},zoom:1,TAU:Math.PI*2,clamp:(n,a,b)=>Math.min(b,Math.max(a,n)),finite:(n,f=0)=>Number.isFinite(n)?n:f,time:0,project:(x,y)=>({x:80+5*(x-y),y:50+3*(x+y)})};vm.createContext(v);
 vm.runInContext(d.slice(d.indexOf('const affinePoint='),d.indexOf('/* Real Three objects,'))+'\nthis.DrawCommands=DrawCommands;',v);
 v.ctx=new v.DrawCommands();
 if(legacy){v.ctx.scope=undefined;}
 vm.runInContext(stock+'\nthis.shadow=shadow;',v);
 const orig=v.shadow;v.shadow=(...a)=>legacy?orig(...a):v.ctx.scope({...v.ctx.owner,kind:'contact'},()=>orig(...a));
 const img={src:'assets/test.png',naturalWidth:32,naturalHeight:32};
 function inner(e){
  if(e.throwBefore)throw Error('fixture');
  if(!e.noOriginalShadow){
   const point=v.project(e.x,e.y);
   for(let i=0;i<(e.shadowCalls??1);i++)v.shadow(point.x,point.y+(e.shadowBob??0),e.radius??18,e.shadowOpts||{});
  }
  if(e.child)v.drawEnemy(e.child);
  v.ctx.drawImage(img,0,0);return 'body-result';
 }
 v.drawEnemy=e=>legacy?inner(e):v.ctx.scope({kind:'enemy',id:'enemy:'+e.id,alive:e.hp>0,x:e.x,y:e.y},()=>inner(e));
 for(const f of ['mob-ground-r206.js','enemy-face-r444.js'])vm.runInContext(fs.readFileSync(path.join(source,'r96/client-source',f),'utf8'),v,{filename:f});
 v.mob=v.window.__STORYWORLD_MOB_GROUND_R206__;v.face=v.window.__STORYWORLD_ENEMY_FACE_R444__;
 return v;
}
function draw(v,e){v.ctx.reset();ck(v.drawEnemy(e)==='body-result','original return');return v.ctx.finish();}
function midBounds(command){const p=command.paths[0].points,xs=p.map(p=>p[0]),ys=p.map(p=>p[1]);return [Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)];}
const v=boot(),stockV=boot({source:root});
if(root===dest)stockV.mob.set({contact:false});
const cs=draw(v,live({shadowBob:11})),orig=draw(stockV,live());
ck(ct(orig).length===0&&broad(orig).length===0,'baseline proven ground absent');
ck(ct(cs).length===1&&broad(cs).length===0,'default still no wide, one contact');
ck(cs[0]===ct(cs)[0]&&cs[1].kind==='image','paint order');
ck(cs[0].owner.kind==='contact'&&cs[0].owner.id==='enemy:mob','recorder contact attribution');
let [l,t,r,b]=midBounds(cs[0]);ck((l+r)/2===75&&(t+b)/2===65,'world ground coordinate not shadow bob y76');
ck(cs[0].style.globalAlpha===.58&&cs[0].paths[0].points.length===16,'bounded 16-point single recorder ellipse');
ck(cs[0].clips.length===0&&cs[0].rule==='nonzero','standard no clip/gradient');
ck(ct(draw(v,live({boss:true,radius:56,attack:{elapsed:.5,angle:0}}))).length===1,'boss');
ck(ct(draw(v,live({midboss:true,hitTimer:.1,flash:.2}))).length===1,'midboss hit keeps stable floor shadow');
ck(ct(draw(v,live({shadowCalls:4}))).length===1,'multiple broad calls never double-add');
ck(ct(draw(v,live({child:live({id:'nested',x:9})}))).map(c=>c.owner.id).join(',')==='enemy:mob,enemy:nested','nested scope isolated');
for(const extra of [
 {hp:0,spawnState:'dead'},{spawnState:'telegraph'},{dead:true},{hero:true},{r953Ally:true},{ally:true},{friendly:true},{prop:true},{object:true},{terrainWall:true},
 {r170Tower:true},{r446Pillar:true},{r251Circle:true},{towerR193:true},{r193Tower:true},{visualLiftPx:3},{visualLiftPx:4,r208Mob:true},
 {shadowOpts:{lift:.4}},{name:'유령'},{shadowOpts:{alpha:0}},{radius:0},{x:NaN},{noOriginalShadow:true}
])ck(ct(draw(v,live(extra))).length===0,'excluded '+JSON.stringify(extra));
v.window.__STORYWORLD_POLISH_R100__={artOf:()=>({fly:true})};
ck(ct(draw(v,live())).length===0,'R100 flight bypass');delete v.window.__STORYWORLD_POLISH_R100__;
v.mob.set({on:false});v.face.set({shadows:true});stockV.mob.set({on:false});stockV.face.set({shadows:true});
const withWide=draw(v,live()),oldWide=draw(stockV,live());
ck(broad(withWide).length===2&&ct(withWide).length===1,'native broad and compact');
ck(JSON.stringify(broad(withWide).map(q=>[q.style,q.paths]))===JSON.stringify(broad(oldWide).map(q=>[q.style,q.paths])),'native broad byte-identical');
ck(withWide[2]===ct(withWide)[0],'broad painted before contact');
const wide=midBounds(withWide[0]),compact=midBounds(withWide[2]);ck(compact[0]>wide[0]&&compact[1]>wide[1]&&compact[2]<wide[2]&&compact[3]<wide[3],'ellipse fits existing footprint'); 
v.mob.set({contact:false});ck(ct(draw(v,live())).length===0&&broad(draw(v,live())).length===2,'new off switch keeps old broad');
v.mob.set({on:true,contact:true});stockV.mob.set({on:true});const fly=live({name:'오래된 유령'});
ck(JSON.stringify(draw(v,fly).map(q=>[q.kind,q.style,q.paths]))===JSON.stringify(draw(stockV,fly).map(q=>[q.kind,q.style,q.paths])),'floating broad behavior unchanged');
v.window.__STORYWORLD_MOB_ART_VARIANTS_R306__={inspect:()=>({mode:'pixel'})};
ck(ct(draw(v,live())).length===0,'legacy pixel save keeps separate quantized shadow');
delete v.window.__STORYWORLD_MOB_ART_VARIANTS_R306__;
const errors=assert.throws(()=>draw(v,live({throwBefore:true})),/fixture/);tests++;
v.ctx.reset();v.shadow(0,0,18,{});ck(ct(v.ctx.finish()).length===0,'outer hero/prop/product/FX shadow unchanged and actor scope restored');
for(const opt of [{low:true},{coarse:true}]){
 const reduced=boot(opt);const q=ct(draw(reduced,live()))[0];ck(q.paths[0].points.length===8&&q.style.globalAlpha===.46,'mobile/lowFX child cap');
}
const ll=boot({legacy:true});const q=ct(draw(ll,live()))[0];ck(q.paths[0].points.length>=64,'Legacy path uses single native ellipse');
ck(ll.ctx.stack.length===0&&ll.ctx.globalAlpha===1,'no state leak');
const exportRows={noContact:orig.filter(q=>q.kind==='fill'),contactOnly:cs.filter(q=>q.kind==='fill'),nested:withWide.filter(q=>q.kind==='fill')};
if(process.env.CONTACT_GEOMETRY_OUT) fs.writeFileSync(process.env.CONTACT_GEOMETRY_OUT,JSON.stringify(exportRows,null,2)+'\n');
const load=boot();let contacts=0;
for(let n=0;n<100;n++){load.ctx.reset();for(let i=0;i<70;i++)load.drawEnemy(live({id:'mob-'+i,x:i/3,y:n/6}));contacts+=ct(load.ctx.finish()).length;}
ck(contacts===7000,'stress: exactly one path across 7,000 monster draws');
ck(v.mob.inspect().stats.errors===0,'fallback drawing catches no engine exceptions');
console.log('contact shadow CPU:',tests,'assertions; 7000 compact draws; stock legacy / recorded Shadow and R206+R444 wrapper checks passed (not FPS)');
