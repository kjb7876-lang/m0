// R1305 3D 영웅 10명 · 칼날 금속 재질 · 2D 유령 숨김 · 환도 걷기 로브 — 정적 검사(three 불필요).
const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');
const R=path.join(__dirname,'..','..');
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const rd=n=>{try{return fs.readFileSync(path.join(R,n));}catch(_){return null;}};
const src=rd('client-source/hwando-3d-r1302.js'),run=rd('runtime-text/hwando-3d-r1302.js'),s=String(src||'');
ok(!!src&&!!run&&src.equals(run),'client-source 와 runtime-text 같음');
ok(/REV='R1305-heroes3d'/.test(s),'R1305 revision');
ok(/let on=false/.test(s)&&/KEY='storyworld\.r1302\.hwando3d'/.test(s),'기본 꺼짐·저장 키 R1302 그대로');
// 1) 칼날 재질·불투명 전환·2D 유령 숨김
ok(/WEAPON=\{metalness:\.65,roughness:\.25\}/.test(s)&&/const weapon=!o\.isSkinnedMesh/.test(s),'무기(스킨 없는 메시) metalness .65 · roughness .25');
ok(/if\(!glow&&m\.emissive\)\{m\.emissive\.setRGB\(0,0,0\);m\.emissiveIntensity=0;\}/.test(s)&&/else\{if\('metalness'in m\)m\.metalness=0;[^}]*\}?[^\n]*m\.emissive\.setRGB\(0,0,0\)/.test(s),'몸 emissive 0, 무기는 원래 빛나는 부품만 빛 유지');
ok(/const solid=opacity>=\.98;m\.opacity=opacity;m\.depthWrite=solid;if\(m\.transparent===solid\)\{m\.transparent=!solid;m\.needsUpdate=true;\}/.test(s)&&/m\.transparent=false;m\.depthTest=true/.test(s),'opacity ≥ .98 이면 transparent=false (전환 때만 needsUpdate)');
ok(/INK=\{color:0x3a1612,width:\.024\}/.test(s)&&/side:T\.BackSide/.test(s)&&/INK\.width\/Math\.max\(1e-9,Math\.abs\(mesh\.scale\.x\)/.test(s)&&/shell\.bind\(mesh\.skeleton,mesh\.bindMatrix\)/.test(s),'먹 테두리(뒤집은 껍질): 스킨 따라감·양자화 scale 보정');
ok(/GHOST_PREFIX=\['r350:ghost:','r448:ghost:','r448:over:'\]/.test(s)&&/c\?\.owner\?\.r350&&c\.key!=null&&ghostKeys\.has\(String\(c\.key\)\)/.test(s),'3D 본체의 R350/R448 2D 유령·앞그림(c.owner.r350) 숨김');
ok(/!c\.owner\.r350&&!c\.owner\.r945Clone/.test(s),'R945 분신·다른 r350 효과는 본체로 오인하지 않음(유지)');
// 4) 영웅 10명
const heroes={hwando:['assets/r1302/hwando-3d.glb','Attack_DiagonalSlash'],seoha:['assets/r1305/seoha-3d.glb','Attack_EgoCast'],neon:['assets/r1305/neon-3d.glb','Attack_EgoCast'],lauren:['assets/r1305/lauren-3d.glb','Attack_LanceThrust'],michaela:['assets/r1305/michaela-3d.glb','Attack_HealPulse'],slayer:['assets/r1305/slayer-3d.glb','Attack_DownCleave'],hunter:['assets/r1305/hunter-3d.glb','Attack_BowShot'],gunner:['assets/r1305/gunner-3d.glb','Attack_AimFire'],persona:['assets/r1305/persona-3d.glb','Attack_EgoCast'],ego:['assets/r1305/ego-3d.glb','Attack_AwakenedBurst']};
const block=(s.match(/const HEROES=Object\.freeze\(\{([\s\S]*?)\}\)\);/)||[])[1]||'';
ok(Object.keys(heroes).length===10&&Object.entries(heroes).every(([h,[g,a]])=>new RegExp('\\b'+h+':\\{glb:'+(h==='hwando'?'GLB':`'${g.replace(/[./]/g,m=>'\\'+m)}'`)+",attack:'"+a+"'\\}").test(block)),'HEROES 표 10명·GLB·공격 클립');
ok(/if\(h==='lauren'&&player\.personaHeroR1113===true\)return'persona'/.test(s)&&/if\(h==='hwando'&&player\.egoSovereignR1046===true/.test(s)&&/heroKey\(\)===HERO/.test(s),'페르소나(lauren+R1113)·EGO(hwando+R1046) 형상을 자기 3D 로');
ok(/const id=HERO,GLB=HEROES\[id\]\.glb/.test(s)&&/function syncHero\(\)/.test(s)&&/hero switched during load/.test(s),'지금 영웅 GLB 하나만 읽고, 바뀌면 상태 바꿔 끼움');
const manifest=JSON.parse(String(rd('runtime-manifest.json')||'{}')),rows=Object.fromEntries((manifest.files||[]).map(r=>[r.path,r]));
function parse(b){let c=12,J=null,bin=0;while(c<b.length){const L=b.readUInt32LE(c),t=b.readUInt32LE(c+4),st=c+8;if(t===0x4e4f534a)J=JSON.parse(b.subarray(st,st+L).toString('utf8').replace(/[\u0000 ]+$/,''));if(t===0x004e4942)bin=st;c=st+L;}return{J,bin};}
let total=0;
for(const[h,[g,atk]]of Object.entries(heroes)){const b=rd('runtime-text/'+g);if(!b){ok(false,h+' GLB 있음 '+g);continue;}total+=b.length;
 const{J}=parse(b),skinNode=J.nodes.find(n=>Number.isInteger(n.mesh)&&Number.isInteger(n.skin)),names=skinNode?J.skins[skinNode.skin].joints.map(i=>J.nodes[i].name):[];
 const clips=(J.animations||[]).map(a=>a.name),need=['Pelvis','Spine_Chest','Thigh_R','Thigh_L','Shin_R','Shin_L','Arm_R','Arm_L','Forearm_R','Forearm_L'];
 ok(b.readUInt32LE(0)===0x46546c67&&b.readUInt32LE(8)===b.length,h+' GLB 머리·길이');
 ok(!!skinNode&&need.every(n=>names.includes(n)),h+' 스킨 + 12뼈 인간형('+names.length+'뼈)');
 ok(['Idle','Walk',atk].every(c=>clips.includes(c)),h+' 클립 Idle·Walk·'+atk+' ('+clips.join(',')+')');
 ok((J.extensionsUsed||[]).includes('KHR_mesh_quantization')&&(J.extensionsUsed||[]).includes('EXT_texture_webp'),h+' gltfpack 양자화 + WebP 텍스처');
 ok(b.length<=4.5e6,h+' 크기 ≤ 4.5MB ('+(b.length/1e6).toFixed(2)+'MB)');
 ok(rows[g]&&rows[g].sha256===crypto.createHash('sha256').update(b).digest('hex'),h+' 매니페스트 해시');}
ok(total<40e6,'10명 합계 '+(total/1e6).toFixed(1)+'MB (켤 때 지금 영웅 하나만 받음)');
// 2) 환도 걷기 보폭·자락 웨이트
const hb=rd('runtime-text/assets/r1302/hwando-3d.glb');
if(hb){const{J,bin}=parse(hb);const acc=i=>{const a=J.accessors[i],v=J.bufferViews[a.bufferView];return{a,o:bin+(v.byteOffset||0)+(a.byteOffset||0),st:v.byteStride||0};};
 const read=(i,k)=>{const{a,o,st}=acc(i),n={SCALAR:1,VEC3:3,VEC4:4}[a.type],sz={5126:4,5123:2,5122:2,5121:1,5120:1}[a.componentType],stride=st||n*sz,out=[];for(let j=0;j<n;j++){const p=o+k*stride+j*sz;let v=a.componentType===5126?hb.readFloatLE(p):a.componentType===5122?hb.readInt16LE(p):a.componentType===5123?hb.readUInt16LE(p):a.componentType===5120?hb.readInt8(p):hb[p];if(a.normalized){v=a.componentType===5122?Math.max(v/32767,-1):a.componentType===5123?v/65535:a.componentType===5120?Math.max(v/127,-1):v/255;}out.push(v);}return out;};
 const walk=J.animations.find(a=>a.name==='Walk'),idx=J.nodes.findIndex(n=>n.name==='Thigh_R'),rest=J.nodes[idx].rotation||[0,0,0,1];
 const ch=walk.channels.find(c=>c.target.node===idx&&c.target.path==='rotation');let maxDeg=0;
 if(ch){const smp=walk.samplers[ch.sampler],n=J.accessors[smp.output].count;for(let k=0;k<n;k++){const q=read(smp.output,k),d=Math.abs(q[0]*rest[0]+q[1]*rest[1]+q[2]*rest[2]+q[3]*rest[3]);maxDeg=Math.max(maxDeg,2*Math.acos(Math.min(1,d))*180/Math.PI);}}
 ok(ch&&maxDeg>15&&maxDeg<27,'환도 Walk 허벅지 최대 흔들림 '+maxDeg.toFixed(1)+'° (R1303 30° → R1305 24°)');
 // 자락 아래(0.14~0.36m, |x|<0.30) 중 정강이 뼈 선분(Blender 스크립트 좌표 → glTF x,z,-y)에서 0.135m 넘게 떨어진 정점은
 // R1305 에서 허리 쪽으로 55% 섞었으므로 한 다리를 75% 넘게 따르면 안 된다(R1304 GLB 는 이 정점 대부분이 75% 초과).
 const node=J.nodes.find(n=>Number.isInteger(n.mesh)&&Number.isInteger(n.skin)),at=J.meshes[node.mesh].primitives[0].attributes,names=J.skins[node.skin].joints.map(i=>J.nodes[i].name),tr=node.translation||[0,0,0],sc=node.scale||[1,1,1];
 const legR=new Set(['Thigh_R','Shin_R'].map(n=>names.indexOf(n))),legL=new Set(['Thigh_L','Shin_L'].map(n=>names.indexOf(n)));let hem=0,torn=0;
 const seg=(p,a,c)=>{const ab=[c[0]-a[0],c[1]-a[1],c[2]-a[2]],ap=[p[0]-a[0],p[1]-a[1],p[2]-a[2]],t=Math.max(0,Math.min(1,(ap[0]*ab[0]+ap[1]*ab[1]+ap[2]*ab[2])/(ab[0]**2+ab[1]**2+ab[2]**2)));return Math.hypot(ap[0]-ab[0]*t,ap[1]-ab[1]*t,ap[2]-ab[2]*t);};
 const shins=[[[-.11,.42,0],[-.11,.04,.05]],[[.11,.42,0],[.11,.04,.05]]];
 for(let k=0;k<J.accessors[at.POSITION].count;k++){const p=read(at.POSITION,k),x=tr[0]+p[0]*sc[0],y=tr[1]+p[1]*sc[1],z=tr[2]+p[2]*sc[2];if(Math.abs(x)>=.30||y<.14||y>=.36||Math.min(...shins.map(([a,c])=>seg([x,y,z],a,c)))<=.135)continue;hem++;const j=read(at.JOINTS_0,k),w=read(at.WEIGHTS_0,k);let r=0,l=0;for(let q=0;q<4;q++){if(legR.has(j[q]))r+=w[q];if(legL.has(j[q]))l+=w[q];}if(Math.max(r,l)>.75)torn++;}
 ok(hem>50&&torn/hem<.5,'환도 자락(부츠 바깥) 한쪽 다리 75% 초과 정점 '+torn+'/'+hem+' (R1304 GLB 661/661, 맨 아래 단은 섞기 0 에서 시작)');
}
const blend=String(rd('tools/r1305/blender_hwando_walk_r1305.py')||''),heroesPy=String(rd('tools/r1305/blender_heroes_r1305.py')||'');
ok(/def rebalance_robe_hem_r1305/.test(blend)&&/rebalance_robe_hem_r1305\(arm_obj, body_obj\)/.test(blend)&&/rot\("Thigh_R", -24 \* c/.test(blend)&&/def action_fcurves/.test(blend),'Blender 5.3 환도 스크립트: 자락 웨이트·보폭 24°·5.x 액션 호환');
ok(/proxy_heat_weights\(arm, body\)/.test(heroesPy)&&/GAME_ID = \{"hidden_ego": "ego"\}/.test(heroesPy)&&/"seoha"/.test(heroesPy)&&/"neon"/.test(heroesPy),'영웅 9명 Blender 스크립트: 대리 메시 무게·seoha/neon 프리셋·hidden_ego→ego');
const html=String(rd('runtime-text/index.html')||'');ok(/<script src="\.\/hwando-3d-r1302\.js"><\/script>/.test(html),'index.html 스크립트 태그 유지');
const verify=String(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8'));ok(/'assets\/r1305\/'/.test(verify),'공개 검증 목록에 assets/r1305/');
console.log(fail?`RESULT FAIL ${fail}`:'RESULT PASS');process.exit(fail?1:0);
