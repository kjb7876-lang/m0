// R1304 환도 3D 마감: 공유 Three 장면/Y-sort, 병렬 lazy load, 로브 하단 웨이트를 정적으로 검증한다.
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');
const cp=require('node:child_process');
const R=path.join(__dirname,'..','..');
let fail=0;const ok=(condition,message)=>{console.log((condition?'ok  ':'FAIL')+' '+message);if(!condition)fail++;};
const read=name=>{try{return fs.readFileSync(path.join(R,name));}catch(_){return null;}};
const source=read('client-source/hwando-3d-r1302.js'),runtime=read('runtime-text/hwando-3d-r1302.js'),code=String(source||'');
ok(!!source&&!!runtime&&source.equals(runtime),'client-source와 runtime-text 로더 동일');
ok(/REV='R1304-hwando3d-finish'/.test(code),'R1304 revision');
ok(/let on=false/.test(code)&&/localStorage\.getItem\(KEY\)==='on'/.test(code),'기본 꺼짐 유지');
ok(/r\.scene\.add\(group\)/.test(code)&&/layers\.set\(HOST_LAYER\)/.test(code)&&/HOST_LAYER=2/.test(code),'활성 Three scene의 몸/벽 레이어 2 공유');
ok(!/new T\.WebGLRenderer|createElement\(['"]canvas['"]\)|ensureCanvas/.test(code),'별도 WebGL 렌더러/캔버스 없음');
ok(/Promise\.all\(\[import\('\.\/vendor\/three\/examples\/jsm\/loaders\/GLTFLoader\.js'\),bytes\]\)/.test(code)&&/fetch\(GLB/.test(code)&&/parseAsync\(data,base\)/.test(code),'GLTFLoader와 GLB 병렬 시작 + parseAsync');
ok(/fetchMs:null,parseMs:null,loadMs:null/.test(code)&&/stats\.bytes=data\.byteLength/.test(code),'fetch/parse/load 시간과 바이트 계측');
ok(/depthTest=true/.test(code)&&/m\.depthWrite=opacity>=\.98/.test(code),'GLTF depth test + 반투명 몸 depthWrite 해제');
ok(/function heroCommands\(commands,hint=null\)/.test(code)&&/c\.spatialRole==='body'\|\|c\.r350Lifted/.test(code)&&/selected=new Set\(bodies\)/.test(code),'현재 환도 몸만 골라 제거');
ok(/!c\.owner\.r350&&!c\.owner\.r945Clone&&!nestedCommands\.has\(c\)/.test(code)&&/heroCommands\(commands,pending\?\.owner\)/.test(code),'본체만 골라 R113/R945 재귀 분신 보존');
ok(/actorHint=eligible\?\{x:Number\(player\.x\),y:Number\(player\.y\),id:player\.id!=null\?'hero:'\+player\.id:null\}:null/.test(code)&&/heroCommands\(rec\.slice\(start\),actorHint\)/.test(code),'협동전은 로컬 actor 좌표·ID로 본체 선택');
ok(/function wrapCommands\(r\)/.test(code)&&/consume\(r,commands,frameContext\)/.test(code)&&/scene\.render=w/.test(code),'R350/R448 처리 뒤 CommandScene 직전에 2D 본체 제거');
ok(/!player\.r720Ally&&!player\.r949Summon/.test(code),'동료·소환 환도는 3D 본체로 오인하지 않음');
ok(/방어막·오라·사몽 십자/.test(code)&&!/owner\.bodyPath==='/.test(code),'같은 hero scope 비몸 VFX 보존 계약');

const glb=read('runtime-text/assets/r1302/hwando-3d.glb');
ok(!!glb&&crypto.createHash('sha256').update(glb).digest('hex')==='db857937662346f3baaa965828feebebfa67872066e05a2d0221b210a26c7499','보정 GLB 해시 고정');
if(glb){
 let cursor=12,J=null,binStart=0;while(cursor<glb.length){const length=glb.readUInt32LE(cursor),type=glb.readUInt32LE(cursor+4),start=cursor+8;if(type===0x4e4f534a)J=JSON.parse(glb.subarray(start,start+length).toString('utf8').replace(/[\u0000 ]+$/,''));if(type===0x004e4942)binStart=start;cursor=start+length;}
 const nodeIndex=J.nodes.findIndex(n=>Number.isInteger(n.mesh)&&Number.isInteger(n.skin)),node=J.nodes[nodeIndex],skin=J.skins[node.skin],attrs=J.meshes[node.mesh].primitives[0].attributes;
 const view=(accessorIndex,components,bytes)=>{const a=J.accessors[accessorIndex],v=J.bufferViews[a.bufferView];return{a,offset:binStart+(v.byteOffset||0)+(a.byteOffset||0),stride:v.byteStride||components*bytes};};
 const p=view(attrs.POSITION,3,2),j=view(attrs.JOINTS_0,4,1),w=view(attrs.WEIGHTS_0,4,1),names=skin.joints.map(i=>J.nodes[i].name),slot=name=>names.indexOf(name),pelvis=slot('Pelvis'),right=slot('Thigh_R'),left=slot('Thigh_L'),shinRight=slot('Shin_R'),shinLeft=slot('Shin_L'),lower=new Set(['Pelvis','Thigh_R','Shin_R','Thigh_L','Shin_L'].map(slot)),tr=node.translation||[0,0,0],sc=node.scale||[1,1,1];
 let candidates=0,core=0,coreExact=0,coreMaxAsym=0,bootsRight=0,bootsLeft=0,bootsWrong=0,badSums=0;
 for(let index=0;index<p.a.count;index++){const po=p.offset+index*p.stride,jo=j.offset+index*j.stride,wo=w.offset+index*w.stride,x=tr[0]+glb.readUInt16LE(po)*sc[0],height=tr[1]+glb.readUInt16LE(po+2)*sc[1],weights=new Map();let lowerWeight=0,sum=0;
  for(let k=0;k<4;k++){const joint=glb[jo+k],weight=glb[wo+k];sum+=weight;weights.set(joint,(weights.get(joint)||0)+weight);if(lower.has(joint))lowerWeight+=weight/255;}if(sum!==255)badSums++;
   const rw=(weights.get(right)||0),lw=(weights.get(left)||0),pw=(weights.get(pelvis)||0),rightLeg=rw+(weights.get(shinRight)||0),leftLeg=lw+(weights.get(shinLeft)||0);
   if(height<.36&&x<-.05){if(rightLeg>=230&&rightLeg>leftLeg+100)bootsRight++;if(leftLeg>rightLeg)bootsWrong++;}
   if(height<.36&&x>.05){if(leftLeg>=230&&leftLeg>rightLeg+100)bootsLeft++;if(rightLeg>leftLeg)bootsWrong++;}
  if(Math.abs(x)>=.30||height<.36||height>1.02||lowerWeight<=.65)continue;candidates++;if(height>=.58){core++;coreMaxAsym=Math.max(coreMaxAsym,Math.abs(rw-lw));if(pw===179&&rw===38&&lw===38)coreExact++;}
 }
 ok(candidates===19668,'중앙 하단 로브 후보 19,668정점 ('+candidates+')');
 ok(core===14719&&coreExact===core&&coreMaxAsym===0,'로브 코어 Pelvis 179/255 + 양 Thigh 38/255 대칭 ('+coreExact+'/'+core+')');
  ok(bootsRight>500&&bootsLeft>500&&bootsWrong===0,'부츠 X 방향과 같은 좌우 다리 웨이트 유지 (R '+bootsRight+', L '+bootsLeft+', 반대 '+bootsWrong+')');
 ok(badSums===0,'모든 정점 U8 웨이트 합 255');
}
const tool=path.join(R,'tools','r1304','rebalance-hwando-robe.cjs'),rerun=cp.spawnSync(process.execPath,[tool],{encoding:'utf8'});
ok(rerun.status===0&&/already-patched/.test(rerun.stdout),'웨이트 도구 재실행은 멱등·fail-closed');
const blender=String(read('tools/r1303/blender_hwando_motion_r1303.py')||'');
ok(/def rebalance_lower_robe_weights\(body_obj\):/.test(blender)&&/abs\(point\.x\) >= 0\.30/.test(blender)&&/point\.z < 0\.36 or point\.z > 1\.02/.test(blender),'Blender 재생성도 같은 로브 선택 범위');
ok(/\("Pelvis", 0\.70\), \("Thigh_R", 0\.15\), \("Thigh_L", 0\.15\)/.test(blender)&&blender.indexOf('ensure_weights(arm_obj, body_obj)')<blender.lastIndexOf('rebalance_lower_robe_weights(body_obj)'),'Blender 재생성도 70/15/15 보정 호출');
const manifest=JSON.parse(String(read('runtime-manifest.json')||'{}')),row=manifest.files?.find(r=>r.path==='assets/r1302/hwando-3d.glb');
ok(row&&glb&&row.sha256===crypto.createHash('sha256').update(glb).digest('hex'),'매니페스트 GLB 해시 일치');
console.log(fail?`RESULT FAIL ${fail}`:'RESULT PASS');process.exit(fail?1:0);
