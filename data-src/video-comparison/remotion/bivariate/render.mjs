import {spawn} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const owned = path.dirname(fileURLToPath(import.meta.url));
const cache = path.join(owned, '.cache');
fs.mkdirSync(cache, {recursive: true});
const probe = process.argv.includes('--probe');
const stdout = fs.openSync(path.join(cache, probe ? 'probe.log' : 'render.log'), 'w');
const child = spawn(process.execPath, [path.join(owned, probe ? 'math.mjs' : 'worker.mjs'), ...process.argv.slice(2)], {
  cwd: owned,
  detached: true,
  stdio: ['ignore', stdout, stdout],
});
fs.closeSync(stdout);
fs.writeFileSync(path.join(cache, 'process.json'), JSON.stringify({pid: child.pid, detached: true, probe, started: new Date().toISOString()}, null, 2));
const code = await new Promise((resolve, reject) => {
  child.once('error', reject);
  child.once('exit', (exitCode, signal) => resolve(exitCode ?? (signal ? 1 : 0)));
});
console.log(fs.readFileSync(path.join(cache, probe ? 'probe.log' : 'render.log'), 'utf8'));
fs.writeFileSync(path.join(cache, 'exit.json'), JSON.stringify({pid: child.pid, code, finished: new Date().toISOString()}, null, 2));
process.exitCode = code;