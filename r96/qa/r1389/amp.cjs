const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const list=fs.readFileSync(process.argv[2],'utf8').trim().split('\n');const out={};
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const p=await b.newPage();
await p.goto('http://127.0.0.1:4420/v.html');await p.waitForFunction(()=>window.ready);
for(const u of list){try{out[u]=await p.evaluate(u=>window.amp(u),u);}catch(e){out[u]={err:String(e).slice(0,120)};}console.log(u,JSON.stringify(out[u]).slice(0,200));}
fs.writeFileSync(process.argv[3],JSON.stringify(out,null,1));await b.close();})();
