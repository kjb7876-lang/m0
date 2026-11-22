#!/usr/bin/env node
// R1304: gltfpack 결과의 geometry/texture/animation 바이트는 그대로 두고 JOINTS_0/WEIGHTS_0만 보정한다.
// 중앙 하단 로브는 한쪽 다리를 75% 이상 따라가면 바지처럼 갈라지므로, 허리로 갈수록 Pelvis 70% + 양 허벅지 15%로 섞는다.
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');

const FILE=path.resolve(__dirname,'..','..','runtime-text','assets','r1302','hwando-3d.glb');
const SOURCE_SHA256='4eb029cdf5a06ca8c303164bd86ccf3a7275f68894beb021748d8c615e36e9b2';
const PATCHED_SHA256='db857937662346f3baaa965828feebebfa67872066e05a2d0221b210a26c7499';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=v=>v*v*(3-2*v);

const input=fs.readFileSync(FILE),inputHash=sha(input);
if(PATCHED_SHA256&&inputHash===PATCHED_SHA256){console.log(JSON.stringify({status:'already-patched',sha256:inputHash}));process.exit(0);}
assert.equal(inputHash,SOURCE_SHA256,'unexpected GLB input; refuse to patch a different model');
assert.equal(input.readUInt32LE(0),0x46546c67,'GLB magic');
assert.equal(input.readUInt32LE(4),2,'GLB v2');
assert.equal(input.readUInt32LE(8),input.length,'GLB declared length');

let cursor=12,jsonChunk=null,binChunk=null;
while(cursor<input.length){const length=input.readUInt32LE(cursor),type=input.readUInt32LE(cursor+4),start=cursor+8;if(type===0x4e4f534a)jsonChunk={start,length};if(type===0x004e4942)binChunk={start,length};cursor=start+length;}
assert(jsonChunk&&binChunk,'JSON and BIN chunks');
const json=JSON.parse(input.subarray(jsonChunk.start,jsonChunk.start+jsonChunk.length).toString('utf8').replace(/[\u0000 ]+$/,''));
assert.equal(json.buffers.length,1,'single embedded buffer');

const meshNodeIndex=json.nodes.findIndex(n=>Number.isInteger(n.mesh)&&Number.isInteger(n.skin));
assert(meshNodeIndex>=0,'skinned mesh node');
const meshNode=json.nodes[meshNodeIndex],mesh=json.meshes[meshNode.mesh],skin=json.skins[meshNode.skin];
assert.equal(mesh.primitives.length,1,'one body primitive');
const attributes=mesh.primitives[0].attributes;
for(const name of['POSITION','JOINTS_0','WEIGHTS_0'])assert(Number.isInteger(attributes[name]),name+' accessor');
const position=json.accessors[attributes.POSITION],joints=json.accessors[attributes.JOINTS_0],weights=json.accessors[attributes.WEIGHTS_0];
assert.equal(position.componentType,5123);assert.equal(position.type,'VEC3');assert.equal(position.normalized,undefined);
assert.equal(joints.componentType,5121);assert.equal(joints.type,'VEC4');
assert.equal(weights.componentType,5121);assert.equal(weights.type,'VEC4');assert.equal(weights.normalized,true);
assert.equal(position.count,joints.count);assert.equal(position.count,weights.count);assert.equal(position.count,93194);
assert(!meshNode.matrix,'matrix transform unsupported');
assert(!meshNode.rotation||meshNode.rotation.every((v,i)=>Math.abs(v-[0,0,0,1][i])<1e-9),'rotated mesh node unsupported');
const translation=meshNode.translation||[0,0,0],scale=meshNode.scale||[1,1,1];
assert(translation.every(Number.isFinite)&&scale.every(Number.isFinite),'finite node transform');

function view(accessor,components,bytes){const bv=json.bufferViews[accessor.bufferView];assert.equal(bv.buffer,0);const stride=bv.byteStride||components*bytes;assert(stride>=components*bytes);return{offset:binChunk.start+(bv.byteOffset||0)+(accessor.byteOffset||0),stride};}
const pv=view(position,3,2),jv=view(joints,4,1),wv=view(weights,4,1);
const jointNames=skin.joints.map(node=>json.nodes[node]?.name||'');
const slot=name=>{const i=jointNames.indexOf(name);assert(i>=0,'missing joint '+name);return i;};
const pelvis=slot('Pelvis'),thighR=slot('Thigh_R'),thighL=slot('Thigh_L');
const lower=new Set(['Pelvis','Thigh_R','Shin_R','Thigh_L','Shin_L'].map(slot));
const output=Buffer.from(input);
let candidates=0,core=0,beforeAsym=0,afterAsym=0,dominantLegBefore=0;

function quantize(entries){const top=entries.filter(([,weight])=>weight>1e-9).sort((a,b)=>b[1]-a[1]||a[0]-b[0]).slice(0,4),total=top.reduce((n,row)=>n+row[1],0);assert(total>0);for(const row of top)row[1]/=total;
 const q=top.map(([joint,weight],order)=>({joint,order,raw:weight*255,value:Math.floor(weight*255)}));let left=255-q.reduce((n,row)=>n+row.value,0);q.sort((a,b)=>(b.raw-b.value)-(a.raw-a.value)||a.order-b.order);for(let i=0;i<left;i++)q[i%q.length].value++;q.sort((a,b)=>a.order-b.order);while(q.length<4)q.push({joint:0,value:0});return q;}

for(let index=0;index<position.count;index++){
 const po=pv.offset+index*pv.stride,jo=jv.offset+index*jv.stride,wo=wv.offset+index*wv.stride;
 const x=translation[0]+input.readUInt16LE(po)*scale[0],height=translation[1]+input.readUInt16LE(po+2)*scale[1];
 const current=new Map();let lowerWeight=0,right=0,left=0;
 for(let k=0;k<4;k++){const joint=input[jo+k],weight=input[wo+k]/255;if(weight<=0)continue;current.set(joint,(current.get(joint)||0)+weight);if(lower.has(joint))lowerWeight+=weight;if(joint===thighR)right+=weight;if(joint===thighL)left+=weight;}
 if(Math.abs(x)>=.30||height<.36||height>1.02||lowerWeight<=.65)continue;
 candidates++;const f=smooth(clamp((height-.36)/.22,0,1));if(height>=.58)core++;
 if(Math.max(right,left)>.75)dominantLegBefore++;beforeAsym+=Math.abs(right-left);
 const blended=new Map();for(const[joint,weight]of current)blended.set(joint,weight*(1-f));for(const[joint,target]of[[pelvis,.70],[thighR,.15],[thighL,.15]])blended.set(joint,(blended.get(joint)||0)+target*f);
 const packed=quantize([...blended]);for(let k=0;k<4;k++){output[jo+k]=packed[k].joint;output[wo+k]=packed[k].value;}
 let nr=0,nl=0;for(const row of packed){if(row.joint===thighR)nr+=row.value/255;if(row.joint===thighL)nl+=row.value/255;}afterAsym+=Math.abs(nr-nl);
}
assert.equal(candidates,19668,'candidate selection drift');
assert(core>10000,'expected a substantial fully blended robe core');
const outputHash=sha(output);
assert.equal(outputHash,PATCHED_SHA256,'patched GLB hash drift; refuse to replace the source');
const temp=FILE+'.r1304-'+process.pid+'.tmp';
fs.writeFileSync(temp,output,{flag:'wx'});
try{fs.renameSync(temp,FILE);}finally{if(fs.existsSync(temp))fs.unlinkSync(temp);}
console.log(JSON.stringify({status:'patched',vertices:position.count,candidates,core,dominantLegBefore,beforeMeanAsym:beforeAsym/candidates,afterMeanAsym:afterAsym/candidates,sha256:outputHash},null,2));
