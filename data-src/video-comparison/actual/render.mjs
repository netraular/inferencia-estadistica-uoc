import {createServer} from 'node:http';
import {mkdir,readFile,writeFile,copyFile,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawn,execFileSync} from 'node:child_process';
import {once} from 'node:events';
import {build} from 'esbuild';
import {chromium} from 'playwright';
import ffmpeg from 'ffmpeg-static';
import ffprobe from 'ffprobe-static';
import {formulaVector} from './math-vectors.mjs';
import {formulas} from './formulas.mjs';

const source=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(source,'../../..');
const shared=path.join(root,'static/comparativa-videos/shared');
const output=path.join(root,'static/comparativa-videos/actual');
const cache=path.join(source,'.cache');
process.env.PLAYWRIGHT_BROWSERS_PATH=path.join(cache,'browsers');
const probe=process.argv.includes('--probe');
await mkdir(cache,{recursive:true});
await mkdir(output,{recursive:true});
const script=JSON.parse(await readFile(path.join(shared,'script.json'),'utf8'));
const audio=path.join(shared,script.audio);
const audioSha256=createHash('sha256').update(await readFile(audio)).digest('hex');
if(audioSha256!==script.audioSha256 || script.frames!==1185 || script.fps!==30 || script.duration!==39.5)throw new Error('Frozen contract mismatch');
const vectors=Object.fromEntries(Object.entries(formulas).map(([key,tex])=>[key,formulaVector(tex)]));
const bundle=await build({entryPoints:[path.join(source,'scene.mjs')],bundle:true,write:false,format:'iife',platform:'browser',minify:true,logLevel:'silent'});
const html=`<!doctype html><html><head><meta charset="utf-8"><style>@font-face{font-family:Atkinson;src:url('/font400') format('woff2');font-weight:400}@font-face{font-family:Atkinson;src:url('/font700') format('woff2');font-weight:700}html,body{margin:0;width:1280px;height:720px;overflow:hidden}</style></head><body><div id="stage"></div><script>window.RENDER_DATA=${JSON.stringify({script,vectors})}</script><script src="/bundle.js"></script></body></html>`;
const assets=new Map([
  ['/render',{body:Buffer.from(html),type:'text/html; charset=utf-8'}],
  ['/bundle.js',{body:bundle.outputFiles[0].contents,type:'text/javascript'}],
  ['/font400',{body:await readFile(path.join(root,'pages/inferencia/vendor/atkinson-latin-400.woff2')),type:'font/woff2'}],
  ['/font700',{body:await readFile(path.join(root,'pages/inferencia/vendor/atkinson-latin-700.woff2')),type:'font/woff2'}],
]);
const server=createServer((request,response)=>{
  const asset=assets.get(request.url);
  if(!asset){response.writeHead(404);response.end();return;}
  response.writeHead(200,{'Content-Type':asset.type,'Cache-Control':'no-store'});response.end(asset.body);
});
let browser;
let encoder;
const report={mode:probe?'probe':'full',audioSha256,formulaCount:Object.keys(vectors).length,samples:[],externalRequests:[],errors:[]};
try {
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(41741,'127.0.0.1',resolve);});
  browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-background-networking'],chromiumSandbox:false});
  report.chromium=browser.version();
  const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
  await page.route('**/*',route=>{
    if(new URL(route.request().url()).origin!=='http://127.0.0.1:41741') {
      report.externalRequests.push(route.request().url());return route.abort();
    }
    return route.continue();
  });
  page.on('pageerror',error=>report.errors.push(error.message));
  await page.goto('http://127.0.0.1:41741/render');
  await page.evaluate(async()=>{await document.fonts.load('30px Atkinson');await document.fonts.load('bold 30px Atkinson');await document.fonts.ready;});
  for(const [index,cue] of script.cues.entries()) {
    const time=(cue.start+cue.end)/2;
    const png=await page.evaluate(time=>window.renderFrame(time),time);
    const facts=await page.evaluate(()=>window.frameFacts());
    if(facts.cueIndex!==index || !facts.fontLoaded || facts.caption!==cue.text)throw new Error('Scene sample mismatch');
    await writeFile(path.join(cache,`reference-${index}.png`),Buffer.from(png.split(',')[1],'base64'));
    report.samples.push(facts);
  }
  const target=path.join(cache,probe?'scene-probe.mp4':'video.mp4');
  const args=['-y','-v','error','-f','image2pipe','-framerate','30','-vcodec','png','-i','pipe:0'];
  if(!probe)args.push('-i',audio,'-map','0:v:0','-map','1:a:0','-c:a','copy');
  args.push('-c:v','libx264','-preset','medium','-crf','18','-threads','1','-pix_fmt','yuv420p','-movflags','+faststart',target);
  encoder=spawn(ffmpeg,args,{cwd:source,stdio:['pipe','ignore','pipe']});
  let encoderErrors='';encoder.stderr.on('data',chunk=>{encoderErrors+=chunk;});
  const completed=new Promise((resolve,reject)=>{
    encoder.once('error',reject);
    encoder.once('exit',code=>code===0?resolve():reject(new Error(`ffmpeg exited ${code}: ${encoderErrors}`)));
  });
  const frames=probe?30:script.frames;
  for(let frame=0;frame<frames;frame++) {
    const time=probe?12.6+frame/script.fps:frame/script.fps;
    const png=await page.evaluate(time=>window.renderFrame(time),time);
    if(!encoder.stdin.write(Buffer.from(png.split(',')[1],'base64')))await once(encoder.stdin,'drain');
    if(frame%150===0)console.log(`ACTUAL FRAME ${frame}/${frames}`);
  }
  encoder.stdin.end();await completed;encoder=undefined;
  if(report.errors.length || report.externalRequests.length)throw new Error(JSON.stringify(report));
  report.metadata=JSON.parse(execFileSync(ffprobe.path,['-v','error','-count_frames','-show_streams','-show_format','-of','json',target],{cwd:source,encoding:'utf8'}));
  const video=report.metadata.streams.find(stream=>stream.codec_type==='video');
  if(video.width!==1280 || video.height!==720 || Number(video.nb_read_frames)!==frames || video.avg_frame_rate!=='30/1')throw new Error('Rendered metadata mismatch');
  if(!probe) {
    if(Math.abs(Number(report.metadata.format.duration)-39.5)>0.15)throw new Error('Duration exceeds codec padding');
    await copyFile(target,path.join(output,'video.mp4'));
    execFileSync(ffmpeg,['-y','-v','error','-ss','17.5','-i',target,'-frames:v','1','-q:v','2',path.join(output,'poster.jpg')],{cwd:source});
  }
  execFileSync(ffmpeg,['-y','-v','error','-i',target,'-frames:v','1',path.join(cache,probe?'scene-probe-decoded.png':'first-decoded.png')],{cwd:source});
  report.encodedFrames=frames;
  report.serverStopped=true;
  await writeFile(path.join(cache,probe?'scene-probe.json':'render.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({mode:report.mode,frames,width:video.width,height:video.height,fps:video.avg_frame_rate,duration:report.metadata.format.duration,captionSamples:report.samples.map(sample=>({cue:sample.cueIndex,lines:sample.captionLines.length,model:sample.model})),serverStoppedInFinally:true},null,2));
} finally {
  encoder?.kill('SIGTERM');
  await browser?.close();
  await new Promise(resolve=>server.close(resolve));
  if(!probe)await rm(path.join(cache,'video.mp4'),{force:true});
}