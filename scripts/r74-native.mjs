/* Retain pinned native damage, EGO cooldown, HUD, and six-cycle save tests.
 * A native cast now completes its last motion before the next test cast;
 * the synthetic former-666 boss fixture gains the required 1.66 HP factor. */
import fs from'node:fs/promises';import assert from'node:assert/strict';import{execFileSync,spawnSync}from'node:child_process';
execFileSync(process.execPath,['scripts/r71-native.browser.test.mjs','--prepare-only'],{stdio:'inherit'});let source=await fs.readFile('out/r71/native/r71-native-generated.mjs','utf8');
function once(old,next){assert.equal(source.split(old).length-1,1,old);source=source.replace(old,next);}
const click="await page.locator('#campaignNew54').click({timeout:60000});";once(click,click+"if(await page.locator('#slotConfirmR73').count())await page.locator('#slotConfirmR73').click();");
once('let ego=null;if(!baseline){','let ego=null;if(!baseline){await page.waitForFunction(()=>!window.__STORYWORLD_DANCES_R74__?.nativeActive(player),null,{timeout:20000});');
once('boss.maxHp=666;boss.hp=333;','boss.maxHp=1105.56;boss.hp=552.78;');once("assert.equal(expected.hp,333);assert.equal(expected.text,'333 / 666','R71 fixed-value boss formatting must be exact');","assert.equal(expected.hp,552.78);assert.equal(expected.text,'553 / 1,106','R74 public boss HP increased by 1.66 and formatted exactly');");
await fs.mkdir('out/r74',{recursive:true});const file='out/r74/native-generated.mjs';await fs.writeFile(file,source);if(!process.argv.includes('--prepare-only')){const run=spawnSync(process.execPath,[file],{stdio:'inherit',env:process.env});if(run.error)throw run.error;assert.equal(run.status,0,'R74 native silver/EGO/HP/save regression');}
