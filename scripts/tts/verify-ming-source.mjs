import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildCatalogue, loadBatch, verifyItem} from './gemini-course.mjs';

const origin = resolve(process.argv[2]);
const source = resolve(process.argv[3] || fileURLToPath(new URL('../../', import.meta.url)));
const {catalogue, state} = loadBatch(origin);
const current = await buildCatalogue({source});
assert.deepEqual(current.sourceFiles, catalogue.sourceFiles, 'Frozen source files differ from current canon');
assert.deepEqual(current.items, catalogue.items, 'Frozen animations differ from current canon');
const excludeIds = catalogue.items.filter(item => state.items[item.id]?.status === 'complete').map(item => {
  verifyItem(origin, item, state);
  return item.id;
});
console.log(JSON.stringify({catalogueSha256: createHash('sha256').update(readFileSync(join(origin, 'catalogue.json'))).digest('hex'),
  inputSha256: current.inputSha256, excludeIds, verifiedCurrentCanon: true}));