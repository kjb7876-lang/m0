// Reuse the reviewed R67 movement/EGO harness without changing its scenarios,
// timing, shader-fallback checks, GL instrumentation, or regression assertions.
import fs from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
const source=await fs.readFile(new URL('./r67.perf.mjs',import.meta.url),'utf8');
function one(s,a,b){if(s.split(a).length!==2)throw Error('Performance harness drift: '+a);return s.replace(a,b);}
let adapted=one(source,"out='out/r67'","out='out/r68'");
adapted=one(adapted,"baseline:'080ef5a535eb900f9c50900dbc35bf6c81e0ddb4'","baseline:'41f6a0208eade036234eaca5cb1acf7224cd5b67'");
adapted=adapted.replaceAll('R67_PERF_', 'R68_PERF_').replace('the R67 Three optimization','the R68 Three optimization');
const generated=new URL('./.r68-perf-generated.mjs',import.meta.url);await fs.writeFile(generated,adapted);
try{const p=spawnSync(process.execPath,[generated.pathname],{stdio:'inherit',env:process.env,timeout:900000});if(p.error)throw p.error;if(p.status!==0)throw Error('Performance comparison failed: '+p.status);}finally{await fs.rm(generated,{force:true});}
