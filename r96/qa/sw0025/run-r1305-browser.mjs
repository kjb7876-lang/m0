import fs from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

const original=new URL('../r1305/r1305-browser.mjs',import.meta.url);
const temp=new URL('../r1305/.sw0025-sandbox-'+process.pid+'.mjs',import.meta.url);
const source=await fs.readFile(original,'utf8');
// Run the inherited assertions unchanged, including in headless CI, but
// explicitly opt into the OS-backed sandbox rather than Playwright's default.
const launch='await chromium.launch({args:';
assert.equal(source.split(launch).length,2,'known stock launcher');
assert.ok(process.env.SW_URL,'SW_URL must point at the same verified build');
try{
 await fs.writeFile(temp,source.replace(launch,'await chromium.launch({chromiumSandbox:true,args:'),{flag:'wx'});
 const child=spawnSync(process.execPath,[fileURLToPath(temp)],{stdio:'inherit',env:process.env});
 if(child.error)throw child.error;
 if(child.status!==0)process.exitCode=child.status??1;
}finally{await fs.rm(temp,{force:true});}
