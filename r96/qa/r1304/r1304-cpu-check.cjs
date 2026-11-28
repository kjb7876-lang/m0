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
ok(/REV='R130[45]-(hwando3d-finish|heroes3d)'/.test(code),'R1304(또는 후속 R1305) revision');
ok(/let on=false/.test(code)&&/localStorage\.getItem\(KEY\)==='on'/.test(code),'기본 꺼짐 유지');
ok(/r\.scene\.add\(group\)/.test(code)&&/layers\.set\(HOST_LAYER\)/.test(code)&&/HOST_LAYER=2/.test(code),'활성 Three scene의 몸/벽 레이어 2 공유');
// 별도 게임 렌더러·표시용 캔버스 금지. 유일한 예외는 광구 CanvasTexture 를 칠하는 화면 밖 2D 면(spiritTexture)이다.
// 파일 전체 예외가 아니라: 캔버스 생성은 spiritTexture 안 한 곳뿐, 2D 컨텍스트만, DOM 에 붙이지 않음,
// 면은 CanvasTexture 로만 나가고, 부르는 곳은 spiritArt 하나뿐임을 구조로 확인하고 변형 소스로 검사 자체를 시험한다.
function bodyOf(src,name){
 const at=src.indexOf('function '+name+'(');if(at<0)return null;
 let i=src.indexOf('{',at),depth=0;
 for(let k=i;k<src.length;k++){const c=src[k];if(c==='{')depth++;else if(c==='}'&&--depth===0)return {start:at,end:k+1,text:src.slice(i+1,k)};}
 return null;
}
function canvasPolicy(src){
 const v=[];
 if(/WebGLRenderer|WebGPURenderer/.test(src))v.push('새 Three 렌더러');
 if(/ensureCanvas/.test(src))v.push('기존 ensureCanvas 경로');
 if(/getContext\(\s*['"`](?:webgl2?|experimental-webgl|webgpu|bitmaprenderer)/.test(src))v.push('새 WebGL/WebGPU 컨텍스트');
 if(/transferControlToOffscreen|captureStream/.test(src))v.push('캔버스 표시·전송 경로');
 if(/\[\s*['"`]createElement['"`]\s*\]/.test(src))v.push('createElement 우회 호출');
 for(const m of src.matchAll(/createElement(?:NS)?\(\s*([^,)]*)/g)){const a=m[1].trim();if(!/^(['"])[a-z][a-z0-9-]*\1$/i.test(a))v.push('문자열이 아닌 createElement 인자 '+a);}
 const tex=bodyOf(src,'spiritTexture');
 const makes=[...src.matchAll(/createElement(?:NS)?\([^)]*['"`]canvas['"`]|new\s+OffscreenCanvas\b/g)].map(m=>m.index);
 if(makes.length&&!tex)v.push('spiritTexture 밖 캔버스 생성');
 for(const at of makes)if(!tex||at<tex.start||at>=tex.end)v.push('spiritTexture 밖 캔버스 생성 @'+at);
 if(makes.length>1)v.push('캔버스 생성 '+makes.length+'곳');
 if(tex){
  const b=tex.text,id=(b.match(/const\s+(\w+)\s*=\s*document\.createElement\(\s*['"]canvas['"]\s*\)/)||[])[1];
  if(!id)v.push('spiritTexture 면 선언 없음');
  else{
   const uses=[...b.matchAll(new RegExp('\\b'+id+'\\b','g'))].length,allowed=[...b.matchAll(new RegExp('\\b'+id+'\\.(?:width|height)\\s*=|\\b'+id+"\\.getContext\\(\\s*'2d'\\s*\\)|new T\\.CanvasTexture\\(\\s*"+id+'\\s*\\)|const\\s+'+id+'\\s*=','g'))].length;
   if(uses!==allowed)v.push('면이 텍스처 밖으로 쓰임('+uses+'/'+allowed+')');
   if(!new RegExp('return new T\\.CanvasTexture\\(\\s*'+id+'\\s*\\)').test(b))v.push('CanvasTexture 로만 반환하지 않음');
  }
  if(/getContext\(\s*(?!'2d'\s*\))/.test(b))v.push('spiritTexture 가 2D 외 컨텍스트 요청');
  if(/appendChild|\.append\(|\.prepend\(|insertBefore|insertAdjacent|replaceWith|replaceChildren|\.before\(|\.after\(|document\.body|\.style\b|toDataURL|toBlob|window\.|globalThis/.test(b))v.push('spiritTexture 가 DOM·전역에 닿음');
  const callers=[...src.matchAll(/\bspiritTexture\(/g)].map(m=>m.index).filter(at=>at!==tex.start+'function '.length);
  const art=bodyOf(src,'spiritArt');
  if(callers.length!==1||!art||callers.some(at=>at<art.start||at>=art.end))v.push('spiritTexture 호출처가 spiritArt 하나가 아님('+callers.length+')');
 }
 return v;
}
const policy=canvasPolicy(code);
ok(policy.length===0,'별도 WebGL 렌더러·표시 캔버스 없음, 광구 텍스처 전용 화면 밖 2D 면만 허용'+(policy.length?' '+JSON.stringify(policy):''));
{
 const texBody=bodyOf(code,'spiritTexture');
 const inTex=(find,repl)=>texBody?code.slice(0,texBody.start)+code.slice(texBody.start,texBody.end).replace(find,repl)+code.slice(texBody.end):code;
 const mutants={
  'R1304 이전 형태(spiritArt 안 직접 생성)':code.replace(/function spiritArt\(T,now\)\{/,"function spiritArt(T,now){const raw=document.createElement('canvas');"),
  'DOM 에 붙인 표시 캔버스':inTex(/paint\(/,'document.body.appendChild(surface);paint('),
  '면을 그대로 반환':inTex(/return new T\.CanvasTexture\(surface\)/,'return surface'),
  '텍스처 함수 안 WebGL 컨텍스트':inTex(/getContext\('2d'\)/,"getContext('webgl2')"),
  '다른 곳 새 WebGL 컨텍스트':code+"\nfunction probe(){return document.createElement('canvas').getContext('webgl');}",
  '새 WebGLRenderer':code+'\nfunction probe(T){return new T.WebGLRenderer({antialias:true});}',
  '기존 ensureCanvas 경로':code+'\nfunction probe(){return ensureCanvas();}',
  '변수 태그 우회':code+"\nfunction probe(){const tag='canvas';return document.createElement(tag);}",
  '괄호 접근 우회':code+"\nfunction probe(){return document['createElement']('canvas');}",
  'OffscreenCanvas 추가':code+'\nfunction probe(){return new OffscreenCanvas(4,4);}',
  '두 번째 호출처':code+'\nfunction probe(T){return spiritTexture(T,4,4,()=>{});}',
 };
 const missed=Object.entries(mutants).filter(([,m])=>m===code||canvasPolicy(m).length===0).map(([k])=>k);
 ok(!!texBody&&missed.length===0,'캔버스 정책이 변형 '+Object.keys(mutants).length+'종을 모두 잡음'+(missed.length?' 놓침 '+JSON.stringify(missed):''));
 // 실제 실행: spiritTexture 만 떼어 가짜 document 로 돌려 2D 전용·DOM 미부착·CanvasTexture 전달을 잰다.
 let run=null;
 if(texBody){
  const vm=require('node:vm'),log={contexts:[],attached:0,made:0};
  const surface={width:0,height:0,parentNode:null,getContext(k){log.contexts.push(k);return k==='2d'?{drawImage(){}}:null;}};
  const document={createElement(t){log.made++;if(t!=='canvas')throw Error(t);return surface;},body:{appendChild(){log.attached++;}}};
  class CanvasTexture{constructor(c){this.image=c;}}
  const sandbox={document,T:{CanvasTexture},painted:null};
  vm.runInNewContext(code.slice(texBody.start,texBody.end)+';painted=spiritTexture(T,768,384,c=>{c.drawImage();});',sandbox);
  run={...log,w:surface.width,h:surface.height,isTexture:sandbox.painted instanceof CanvasTexture&&sandbox.painted.image===surface,parent:surface.parentNode};
 }
 ok(!!run&&run.made===1&&run.attached===0&&run.parent===null&&JSON.stringify(run.contexts)==='["2d"]'&&run.w===768&&run.h===384&&run.isTexture,'spiritTexture 실행: 2D 컨텍스트 1회·DOM 미부착·CanvasTexture 로만 전달 '+JSON.stringify(run));
}
ok(/Promise\.all\(\[import\('\.\/vendor\/three\/examples\/jsm\/loaders\/GLTFLoader\.js'\),(import\('\.\/vendor\/three\/examples\/jsm\/libs\/meshopt_decoder\.module\.js'\),)?bytes\]\)/.test(code)&&/fetch\(GLB/.test(code)&&/parseAsync\(data,base\)/.test(code),'GLTFLoader(+R1305 meshopt 디코더)와 GLB 병렬 시작 + parseAsync');
ok(/fetchMs:null,parseMs:null,loadMs:null/.test(code)&&/stats\.bytes=data\.byteLength/.test(code),'fetch/parse/load 시간과 바이트 계측');
ok(/depthTest=true/.test(code)&&/m\.depthWrite=solid/.test(code)&&/solid=opacity>=\.98/.test(code),'GLTF depth test + 반투명 몸 depthWrite 해제');
ok(/function heroCommands\(commands,hint=null\)/.test(code)&&/c\.spatialRole==='body'\|\|c\.r350Lifted/.test(code)&&/selected=new Set\(bodies\)/.test(code),'현재 환도 몸만 골라 제거');
ok(/!c\.owner\.r350&&!c\.owner\.r945Clone&&!nestedCommands\.has\(c\)/.test(code)&&/heroCommands\(commands,pending\?\.owner\)/.test(code),'본체만 골라 R113/R945 재귀 분신 보존');
ok(/actorHint=eligible\?\{x:Number\(player\.x\),y:Number\(player\.y\),id:player\.id!=null\?'hero:'\+player\.id:null\}:null/.test(code)&&/heroCommands\(rec\.slice\(start\),actorHint\)/.test(code),'협동전은 로컬 actor 좌표·ID로 본체 선택');
ok(/function wrapCommands\(r\)/.test(code)&&/consume\(r,commands,frameContext\)/.test(code)&&/scene\.render=w/.test(code),'R350/R448 처리 뒤 CommandScene 직전에 2D 본체 제거');
ok(/!player\.r720Ally&&!player\.r949Summon/.test(code),'동료·소환 환도는 3D 본체로 오인하지 않음');
ok(/방어막·오라·사몽 십자/.test(code)&&!/owner\.bodyPath==='/.test(code),'같은 hero scope 비몸 VFX 보존 계약');

const glbRaw=read('runtime-text/assets/r1302/hwando-3d.glb');
ok(!!glbRaw&&['db857937662346f3baaa965828feebebfa67872066e05a2d0221b210a26c7499','ab734a8760b25e3b3ae066bfa23cd7542fd63f8f3c27091bc8eeb2357cdbff1e','c2c1c4c40d7a3a55e78aef213bc4de1741196ed3d8fbf31ee688c2bb58877732'].includes(crypto.createHash('sha256').update(glbRaw).digest('hex')),'보정 GLB 해시 고정(R1304·R1305 재생성본·R1305 512px+meshopt 경량본)');
const glb=glbRaw&&require('../r1305/glb-unpack.cjs')(path.join(R,'runtime-text/assets/r1302/hwando-3d.glb'));// 웨이트는 배포 디코더로 푼 정점에서 잰다
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
ok(row&&glbRaw&&row.sha256===crypto.createHash('sha256').update(glbRaw).digest('hex'),'매니페스트 GLB 해시 일치');
console.log(fail?`RESULT FAIL ${fail}`:'RESULT PASS');
// R1387: process.exit() 대신 자연 종료. Node 24 의 process.exit 는 힙보다 플랫폼 스레드를 먼저 join 해서
//  Maglev 동시 컴파일이 GC 를 기다리던 중이면 영원히 멈춘다(CI 37분 멈춤). 판정·종료 코드는 그대로.
process.exitCode=fail?1:0;
