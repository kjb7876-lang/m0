'use strict';
const fs=require('fs'),path=require('path'),{spawnSync}=require('child_process'),{createHarness}=require('../harness.cjs');
const report={schema:'r86-native-enemy-facing/v1',method:'All native enemy kinds use actual final pose selection and selected native drawEnemy calls at eight committed world angles; image dimensions read from originals. CPU only, not perceptual art/GPU approval.',checks:[],browserVerified:false,GPUVerified:false,naturalPlayVerified:false};
const check=(name,passed,detail)=>{report.checks.push({name,passed:!!passed,detail});console.log(passed?'PASS':'FAIL',name);if(!passed)throw Error(name);};
(async()=>{
 const h=createHarness({timeoutMs:120000}),run=s=>h.run(s);await h.boot();await h.start();run('for(let i=0;i<60&&storyScene;i++)advanceScene();if(modal)closePanel(true);auto=false;guide=false;settings.autoSkill=false;player.invincible=9999;');
 const dimensions=spawnSync('python3',['-c',`import json,sys
from pathlib import Path
from PIL import Image
r=Path(sys.argv[1]);out={}
for p in r.rglob('*'):
 if p.suffix.lower() in ('.png','.webp','.jpg','.jpeg'):
  try:
   with Image.open(p) as im:out[p.relative_to(r).as_posix()]=list(im.size)
  except Exception:pass
print(json.dumps(out))`,h.site],{encoding:'utf8',maxBuffer:8*1024*1024});if(dimensions.status!==0)throw Error(dimensions.stderr);h.context.r86FaceDimensions=JSON.parse(dimensions.stdout);
 run(`(()=>{const Base=Image;window.Image=class extends Base{set src(v){super.src=v;const p=new URL(v,document.baseURI).pathname.slice(1),d=r86FaceDimensions[p];if(d){this.width=this.naturalWidth=d[0];this.height=this.naturalHeight=d[1];}}get src(){return super.src;}};for(const[p,row]of imageCache){const d=r86FaceDimensions[p];if(d&&row.image){row.image.width=row.image.naturalWidth=d[0];row.image.height=row.image.naturalHeight=d[1];}}})()`);
 report.rows=[];const ids=run('regions.map(d=>d.id)');
 for(const id of ids){h.context.r86FaceZone=id;run(`zone=r86FaceZone;layer='STORY';room=getRoom(zone,layer);player.x=20;player.y=12;cam.x=20;cam.y=12;W=1280;H=800;zoom=1;modal=false;loading=false;storyScene=null;effects=[];hazards=[];projectiles=[];for(const e of room.enemies){e.spawnState='active';e.visible=true;e.disabled=false;e.hp=e.maxHp;e.deadRecorded=false;}`);
  await run(`ensureImages([...regionById[zone].paths,...room.enemies.flatMap(e=>Object.values(__STORYWORLD_STORY_COMBAT_R54__.frameSet(e)).map(v=>v?.path)).filter(Boolean)])`);
  const rows=run(`(()=>{const out=[],seen=new Set();for(const e of room.enemies){if(seen.has(e.nativeId))continue;seen.add(e.nativeId);e.x=20;e.y=12;for(let i=0;i<8;i++){const angle=(i+.17)*Math.PI/4;player.x=e.x+Math.cos(angle)*1.5;player.y=e.y+.15+Math.sin(angle)*1.5;const shape={...e.combatProfile.attackShape};e.attack={id:'r86-face:'+e.nativeId+':'+i,angle,elapsed:shape.windup+shape.active*.3,shape154:shape,origin154:{x:e.x,y:e.y},committed:true};e.rangedWindup=0;e.direction=facing(Math.cos(angle),Math.sin(angle));delete e.rc146BodyFrame;delete e.rc146BodyOptions;drawEnemy(e);const f=e.rc146BodyFrame,b=f?.assetFrame?.bakedFacing,o=e.rc146BodyOptions,d=f&&r86FaceDimensions[f.path||e.rc146BodySprite],a=f?.assetFrame,sx=a?.sourceRect?.[0],sy=a?.sourceRect?.[1],sw=a?.sourceRect?.[2],sh=a?.sourceRect?.[3],v=__STORYWORLD_STORY_COMBAT_R54__.projection(angle);out.push({zone,id:e.nativeId,angle,path:e.rc146BodySprite,baked:b,flip:o?.flip,expected:b==='left'?v.x>0:b==='right'?v.x<0:null,side:b==='left'||b==='right',authoredDirection:b==='eight-way'||b==='front'||b==='back',frame:!!o,bounds:!a||!!d&&[sx,sy,sw,sh,...a.pivot,a.visibleHeight].every(Number.isFinite)&&sx>=0&&sy>=0&&sw>0&&sh>0&&sx+sw<=d[0]&&sy+sh<=d[1],clockAngle:__STORYWORLD_STORY_COMBAT_R54__.clock(e)?.angle??__STORYWORLD_HOSPITAL_MOTION_R53__.clock(e)?.angle});}e.attack=null;}return out;})()`);report.rows.push(...rows);
 }
 const side=report.rows.filter(r=>r.side),missing=report.rows.filter(r=>!r.frame),mismatches=side.filter(r=>r.flip!==r.expected);
 check('All populated regions and native kinds receive eight committed facing probes',report.rows.length>1900,{regions:ids.length,kinds:new Set(report.rows.map(r=>r.id)).size,probes:report.rows.length});
 check('Actual final native draw selects a body frame for every probe',missing.length===0,missing.slice(0,40));
 check('Every selected actual body source rectangle fits original image dimensions',report.rows.every(r=>r.bounds),report.rows.filter(r=>!r.bounds).slice(0,40));
 check('Authored left/right sprites face their committed screen-projected attack ray',side.length>0&&mismatches.length===0,{sideProbes:side.length,mismatches:mismatches.slice(0,70)});
 check('Committed attack clocks keep their original angle',report.rows.every(r=>r.clockAngle===undefined||Math.abs(r.clockAngle-r.angle)<1e-8),report.rows.filter(r=>r.clockAngle!==undefined&&Math.abs(r.clockAngle-r.angle)>1e-8).slice(0,20));
 report.fixedViewArt=report.rows.filter(r=>['front','back'].includes(r.baked)).map(({zone,id,path,baked})=>({zone,id,path,baked}));report.fixedViewArt=[...new Map(report.fixedViewArt.map(r=>[r.id+':'+r.path,r])).values()];
 check('No native error is recorded during facing probes',run('errors.length===0'),run('[...errors]'));
})().catch(e=>{report.failure=e.stack;console.error(e.stack);process.exitCode=1;}).finally(()=>{report.passed=report.checks.every(c=>c.passed)&&!report.failure;report.completedAt=new Date().toISOString();fs.writeFileSync(path.join(__dirname,'enemy-facing-results.json'),JSON.stringify(report,null,2)+'\n');});
