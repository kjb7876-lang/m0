/* Reuse every R72 feature/authority assertion over R73; acknowledge only the
 * added slot confirmation in the two original new-game UI entry paths. */
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
const path='scripts/r72.browser.test.mjs',hash=s=>createHash('sha256').update(s).digest('hex');
let source=await fs.readFile(path,'utf8');assert.equal(hash(source),hash(execFileSync('git',['show','c011601795a8557e22bd144b7386e08b8c6169dc:'+path])),'preserved R72 assertions must not drift');
for(const owner of ['page','touch']){
 const click=`await ${owner}.locator('#campaignNew54').click({timeout:60000});`;
 assert.equal(source.split(click).length-1,1);source=source.replace(click,click+`if(await ${owner}.locator('#slotConfirmR73').count())await ${owner}.locator('#slotConfirmR73').click();`);
}
assert.equal(source.split("path.resolve('out/r72')").length-1,1);source=source.replace("path.resolve('out/r72')","path.resolve('out/r73/features')");
await fs.mkdir('out/r73',{recursive:true});const generated='out/r73/features-generated.mjs';await fs.writeFile(generated,source);const run=spawnSync(process.execPath,[generated],{stdio:'inherit',env:process.env});if(run.error)throw run.error;assert.equal(run.status,0,'R73 golden/777/portal/touch/cooperative authority regressions');
