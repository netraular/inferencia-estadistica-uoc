import {createServer} from 'node:http';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {build} from 'esbuild';
import {chromium} from 'playwright';
import ffmpeg from 'ffmpeg-static';
import ffprobe from 'ffprobe-static';
import {formulaVector} from './math-vectors.mjs';

const source = path.dirname(fileURLToPath(import.meta.url));
const cache = path.join(source, '.cache');
process.env.PLAYWRIGHT_BROWSERS_PATH=path.join(cache,'browsers');
await mkdir(cache, {recursive:true});
const formula = formulaVector('0.5\\times(1.2-0.4)=0.4');
const bundle = await build({stdin:{contents:`
import Konva from 'konva';
import {gsap} from 'gsap';
import {formulaGraphic} from './vector-konva.mjs';
Konva.pixelRatio=1;
const stage=new Konva.Stage({container:'stage',width:1280,height:720});
const layer=new Konva.Layer({listening:false});stage.add(layer);
layer.add(new Konva.Rect({width:1280,height:720,fill:'#f6faf9'}));
layer.add(new Konva.Text({x:64,y:40,text:'Probabilidad como area',fontSize:42,fill:'#173c3a'}));
const bar=new Konva.Rect({x:220,y:210,width:350,height:200,fill:'#199783'});layer.add(bar);
const state={width:0};const timeline=gsap.timeline({paused:true}).to(state,{width:350,duration:1,ease:'power2.out'});
const formula=${JSON.stringify(formula)};
layer.add(formulaGraphic(formula,{x:630,y:255,width:575,height:76,color:'#173c3a'}));
layer.add(new Konva.Rect({x:0,y:604,width:1280,height:116,fill:'#173c3a'}));
layer.add(new Konva.Text({x:80,y:626,width:1120,text:'Ahora multiplicamos la altura medio por la anchura cero coma ocho.',fontSize:30,align:'center',fill:'#ffffff',wrap:'word'}));
window.renderProbe=()=>{timeline.seek(0.8,false);bar.width(state.width);layer.draw();return stage.toDataURL({pixelRatio:1});};
window.probeFacts={konva:Konva.version,gsap:gsap.version,formulaPaths:JSON.stringify(formula).match(/"kind":"path"/g).length};
`,resolveDir:source},bundle:true,write:false,format:'iife',platform:'browser',logLevel:'silent'});
const server = createServer((request,response)=>{
  response.setHeader('Content-Type',request.url==='/bundle.js'?'text/javascript':'text/html');
  response.end(request.url==='/bundle.js'?bundle.outputFiles[0].contents:'<!doctype html><body style="margin:0"><div id="stage"></div><script src="/bundle.js"></script>');
});
let browser;
try {
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(41741,'127.0.0.1',resolve);});
  browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:41741/');
  const frame=await page.evaluate(()=>window.renderProbe());
  const facts=await page.evaluate(()=>window.probeFacts);
  if(errors.length || facts.konva!=='10.9.1' || facts.gsap!=='3.15.1' || !facts.formulaPaths)throw new Error(JSON.stringify({errors,facts}));
  const png=Buffer.from(frame.split(',')[1],'base64');
  await writeFile(path.join(cache,'probe.png'),png);
  execFileSync(ffmpeg,['-y','-v','error','-loop','1','-i',path.join(cache,'probe.png'),'-t','1','-r','30','-c:v','libx264','-threads','1','-pix_fmt','yuv420p',path.join(cache,'probe.mp4')],{cwd:source});
  execFileSync(ffmpeg,['-y','-v','error','-i',path.join(cache,'probe.mp4'),'-frames:v','1',path.join(cache,'probe-decoded.png')],{cwd:source});
  const metadata=JSON.parse(execFileSync(ffprobe.path,['-v','error','-count_frames','-show_streams','-of','json',path.join(cache,'probe.mp4')],{cwd:source,encoding:'utf8'}));
  const video=metadata.streams[0];
  if(video.width!==1280 || video.height!==720 || video.nb_read_frames!=='30')throw new Error('Probe metadata mismatch');
  console.log(JSON.stringify({facts,width:video.width,height:video.height,frames:video.nb_read_frames,serverStoppedInFinally:true},null,2));
} finally {
  await browser?.close();
  await new Promise(resolve=>server.close(resolve));
}