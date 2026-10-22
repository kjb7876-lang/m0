import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {isDeepStrictEqual} from 'node:util';

const source = fs.readFileSync(new URL('./r75-overnight.browser.mjs', import.meta.url), 'utf8');
const start = source.indexOf('function isEmptyCastleDefenseState(');
const end = source.indexOf('\nlet failure = null;', start);
assert.ok(start >= 0 && end > start, 'the browser harness comparison helpers are available');

const crossRealmAssert = {
  ok: (...args) => assert.ok(...args),
  equal: (...args) => assert.equal(...args),
  deepEqual: (actual, expected, message) => assert.deepEqual(JSON.parse(JSON.stringify(actual)), JSON.parse(JSON.stringify(expected)), message),
  notDeepEqual: (actual, expected, message) => assert.notDeepEqual(JSON.parse(JSON.stringify(actual)), JSON.parse(JSON.stringify(expected)), message),
};
const context = vm.createContext({assert: crossRealmAssert, isDeepStrictEqual});
vm.runInContext('globalThis.structuredClone = value => JSON.parse(JSON.stringify(value));', context);
vm.runInContext(`${source.slice(start, end)}\nassertSaveComparisonContract();`, context, {
  filename: 'r75-overnight.browser.mjs#comparison-contract',
});

console.log('R75 overnight comparison contract passed');
