const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const p=await b.newPage();
p.on('console',m=>console.log('C',m.text()));p.on('pageerror',e=>console.log('E',e.message));
await p.goto('http://127.0.0.1:4420/index.html');await p.waitForFunction(()=>window.ready);
const jobs=JSON.parse(process.argv[2]);for(const j of jobs){const r=await p.evaluate(([n,o])=>render(n,o),[j.name,j.opt||{}]);fs.writeFileSync(j.out,Buffer.from(r.url.split(',')[1],'base64'));console.log(j.out,JSON.stringify(r.size));}
await b.close();})();
