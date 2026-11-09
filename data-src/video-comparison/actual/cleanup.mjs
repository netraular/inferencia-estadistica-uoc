import {readdir,rm,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import net from 'node:net';

const source=path.dirname(fileURLToPath(import.meta.url));
const cache=path.join(source,'.cache');
const removed=[];
for(const name of await readdir(cache)) {
  if(/^(probe(?:-decoded)?\.(?:png|mp4)|scene-probe(?:-decoded)?\.(?:png|mp4|json)|reference-\d+\.png|decoded-\d+\.png|increasing-result-decoded\.png|first-decoded\.png|render\.json|video\.mp4)$/.test(name)) {
    await rm(path.join(cache,name),{force:true});removed.push(name);
  }
}
const portAvailable=await new Promise((resolve,reject)=>{
  const socket=net.createConnection({host:'127.0.0.1',port:41741});
  socket.once('connect',()=>{socket.destroy();reject(new Error('Port 41741 still accepts connections; no process was killed'));});
  socket.once('error',error=>error.code==='ECONNREFUSED'?resolve(true):reject(error));
});
const checksPath=path.join(source,'CHECKS.json');
const checks=JSON.parse(await readFile(checksPath,'utf8'));
checks.cleanup={disposableFilesRemoved:removed.length,renderPort41741Closed:portAvailable};
await writeFile(checksPath,JSON.stringify(checks,null,2)+'\n');
console.log(JSON.stringify({removed,renderPort41741Closed:portAvailable},null,2));