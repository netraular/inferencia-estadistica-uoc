import {spawn} from 'node:child_process';
import {createInterface} from 'node:readline';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const source = path.dirname(fileURLToPath(import.meta.url));
const env = {...process.env, PLAYWRIGHT_BROWSERS_PATH:path.join(source,'.cache','browsers')};
const run = (command,args) => new Promise((resolve,reject)=>{
  const child=spawn(command,args,{cwd:source,env,stdio:['ignore','inherit','inherit']});
  child.once('error',reject);
  child.once('exit',code=>code===0?resolve():reject(new Error(`${command} exited ${code}`)));
});
async function task(name) {
  if(name==='install') {
    await run('npm',['--prefix',source,'install','--no-audit','--no-fund']);
    await run(process.execPath,[path.join(source,'node_modules/playwright/cli.js'),'install','chromium']);
  } else if(['probe','render','validate'].includes(name)) {
    await run(process.execPath,[path.join(source,`${name}.mjs`)]);
  } else if(name==='scene-probe') {
    await run(process.execPath,[path.join(source,'render.mjs'),'--probe']);
  } else if(name==='stop') {
    process.exit(0);
  } else throw new Error(`Unknown task: ${name}`);
  console.log(`ACTUAL TASK COMPLETE: ${name}`);
}
await task('install');
await task('probe');
console.log('ACTUAL WORKER READY: render / validate / probe / stop');
const input=createInterface({input:process.stdin,terminal:false});
let pending=Promise.resolve();
input.on('line',line=>{
  pending=pending.then(()=>task(line.trim())).catch(error=>console.error(error.stack));
});