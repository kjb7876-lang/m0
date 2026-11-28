// R1385 3D 모델 4자세(대기·걷기·공격·피격) 정면사선 촬영: node glbshots.cjs <rows.json> <out> (서버 4410 의 /v/v.html)
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const rows=JSON.parse(fs.readFileSync(process.argv[2]));const OUT=process.argv[3];fs.mkdirSync(OUT,{recursive:true});
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const p=await b.newPage({viewport:{width:960,height:280}});
await p.goto('http://127.0.0.1:4410/v/v.html');await p.waitForFunction(()=>window.ready);const meta={};
for(const r of rows){if(!r.glb)continue;const key=r.mod.replace(/mob-3d-|\.js/g,'')+'_'+r.k;try{meta[key]=await p.evaluate(u=>window.go(u),'/m0/'+r.glb);await p.screenshot({path:`${OUT}/${key}.png`,clip:{x:0,y:0,width:960,height:280}});}catch(e){meta[key]={err:String(e).slice(0,150)};}console.log(key,JSON.stringify(meta[key]).slice(0,120));}
fs.writeFileSync(OUT+'/meta.json',JSON.stringify(meta,null,1));await b.close();})();
