// R435 CPU check — 바닥 반복 깨기·벽 밑동 어둠/때 띠·밝은 바닥 무릎점·벽 세로 그라데이션/윗면 가장자리 빛(셰이더 훅만).
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
let bad=0,n=0;const ok=(m,c)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('ok  ',m);};
const F='surface-r435.js',src=C(F);
ok('runtime copy matches client source',RT(F)===src);
try{new vm.Script(src);ok('syntax',true);}catch(e){ok('syntax '+e.message,false);}
const html=RT('index.html');
ok('script tag once, right after readability-r434',html.split('"./'+F+'"').length===2&&/<script src="\.\/readability-r434\.js"><\/script><script src="\.\/surface-r435\.js"><\/script><script src="\.\/combat-read-r409\.js"><\/script>/.test(html));
ok('listed in verify-r96-public.py',/'surface-r435\.js'/.test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8')));
ok('presentation only: no gameplay/save writes, no new mesh/texture',!/\.hp\s*=[^=]|saveGame|localStorage\.setItem\((?!KEY)|new\s+\w*\.?(Mesh|Texture|DataTexture|CanvasTexture)\(/.test(src));
ok('no ctx.filter drop-shadow/blur (Three legacy trap)',!/drop-shadow|blur\(/.test(src));
ok('Mammon vault zero strength',/SKIP=new Set\(\['ep1b06'\]\)/.test(src));
ok('snowfield knee lower than default',/ep1b09:\.4\d/.test(src)&&/KNEE=\.70/.test(src));
// ---- fake shader compile ----
const env={window:{},localStorage:{getItem:()=>null,setItem:()=>{}},setInterval:()=>0,room:{id:'ep1a08'}};env.window=env;
const mats={floor:{},wall:{},cap:{},trim:{}};
const shaderFor=()=>({uniforms:{},vertexShader:'void main(){\n#include <begin_vertex>\n#include <project_vertex>\n}',fragmentShader:'void main(){\ngl_FragColor=vec4(1.);\n#include <dithering_fragment>\n}'});
let renders=0;const scene={},camera={layers:{mask:4}};
env.__STORYWORLD_PHASE1__={controller:{state:{three:{scene,camera,stoneMaterial:mats.floor,wallMaterial:mats.wall,wallCapMaterial61:mats.cap,wallRows:new Map([[1,{mesh:{material:[mats.wall,mats.wall,mats.cap,mats.cap,mats.wall,mats.wall,mats.trim]}}]]),renderer:{render(){renders++;}}}}}};
vm.createContext(env);vm.runInContext(src,env);const r=env.__STORYWORLD_PHASE1__.controller.state.three;r.renderer.render(scene,camera);
ok('hooks floor and wall materials, never caps',typeof mats.floor.onBeforeCompile==='function'&&typeof mats.wall.onBeforeCompile==='function'&&typeof mats.trim.onBeforeCompile==='function'&&mats.cap.onBeforeCompile===undefined);
const fs1=shaderFor();mats.floor.onBeforeCompile(fs1);const ws=shaderFor();mats.wall.onBeforeCompile(ws);
ok('floor code after dithering (after R323 gain), wall code distinct',fs1.fragmentShader.indexOf('r435Knee)')>fs1.fragmentShader.indexOf('#include <dithering_fragment>')&&/vR435Top-h/.test(ws.fragmentShader)&&!/vR435Top-h/.test(fs1.fragmentShader));
ok('vertex passes world position, wall top from mesh centre (h/2), face normal',/vR435W=r435p\.xyz/.test(ws.vertexShader)&&/vR435Top=2\.\*modelMatrix\[3\]\.y/.test(ws.vertexShader)&&/USE_INSTANCING/.test(ws.vertexShader));
const again=shaderFor();again.fragmentShader='uniform float r435On;'+again.fragmentShader;mats.wall.onBeforeCompile(again);
ok('inherited callback does not declare twice',again.fragmentShader.split('uniform float r435On;').length===2);
ok('balanced braces in GLSL',[fs1.fragmentShader,ws.fragmentShader,ws.vertexShader].every(s=>s.split('{').length===s.split('}').length));
ok('cache key marks role',/surface-r435:floor/.test(mats.floor.customProgramCacheKey())&&/surface-r435:wall/.test(mats.wall.customProgramCacheKey()));
const I=env.__STORYWORLD_SURFACE_R435__.inspect();ok('hospital grime = teal side, no errors',I.errors===undefined&&I.stats.errors===0&&env.__STORYWORLD_SURFACE_R435__.grimeOf('ep1a08')[1]>env.__STORYWORLD_SURFACE_R435__.grimeOf('ep1a08')[0]);
env.room={id:'ep1b06'};r.renderer.render(scene,camera);ok('Mammon vault: strength 0',env.__STORYWORLD_SURFACE_R435__.inspect().on===0);
env.room={id:'ep1b09'};r.renderer.render(scene,camera);ok('snowfield knee applied',Math.abs(env.__STORYWORLD_SURFACE_R435__.inspect().knee-.46)<1e-9);
console.log(bad?`${bad}/${n} FAILED`:`all ${n} passed`);process.exit(bad?1:0);
