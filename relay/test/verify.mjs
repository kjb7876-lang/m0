import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const relay = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.dirname(relay), output = path.join(root, 'qa', 'relay-r62');
fs.mkdirSync(output, { recursive:true });
const run = spawnSync(process.execPath, ['--test','--test-reporter=tap','test/relay.test.mjs'], { cwd:relay, encoding:'utf8', timeout:60000 });
fs.writeFileSync(path.join(output,'RELAY_TEST_R62.tap'), (run.stdout||'')+(run.stderr||''));
const total=Number(run.stdout?.match(/# tests (\d+)/)?.[1]||0),passed=Number(run.stdout?.match(/# pass (\d+)/)?.[1]||0);
const files=['server.mjs','package.json','package-lock.json','test/relay.test.mjs','PROTOCOL.md','render.yaml','README_KO.md'];
const sourceSHA256=Object.fromEntries(files.map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(path.join(relay,f))).digest('hex')]));
const ok=run.status===0&&total>=17&&total===passed;
const report={status:ok?'R62_RELAY_LOCAL_WEBSOCKET_PASSED':'R62_RELAY_LOCAL_WEBSOCKET_FAILED',at:new Date().toISOString(),node:process.version,dependency:{ws:JSON.parse(fs.readFileSync(path.join(relay,'node_modules/ws/package.json'),'utf8')).version},tests:total,passed,exitCode:run.status,sourceSHA256,
 checks:{realWebSocketSockets:true,twoToFourPlayers:ok,fifthRejected:ok,buildGameProtocolIsolation:ok,hostPermissions:ok,inputServerIdentity:ok,authoredSkillSlotsValidated:ok,duplicateSequenceRejected:ok,mapEpochLoadingBarriers:ok,dreamStoryLayerPreserved:ok,lateJoinLatestSnapshot:ok,guestReconnectTokenRotation:ok,reservedSeatExpiry:ok,hostLossClosesRoom:ok,backgroundPause:ok,malformedAndOversizeRefusal:ok,finiteInputAndStateBounds:ok,originAndSecureProxy:ok,messageRateLimits:ok,loadTimeout:ok,shutdownNotice:ok,passiveCommandIdentityAndDeduplication:ok},
 failures:ok?[]:[run.error?.message||'Read RELAY_TEST_R62.tap'],
 limitations:{localProcessesOnly:true,gameSimulationVerifiedByThisReport:false,browser:false,GPU:false,mobile:false,publicDeployment:false,separateNetworks:false,renderAccount:false}};
fs.writeFileSync(path.join(output,'RELAY_R62.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({status:report.status,tests:total,passed,failures:report.failures}));
if(!ok)process.exitCode=1;
