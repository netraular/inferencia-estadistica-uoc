import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {execFileSync, spawnSync} from 'node:child_process';
import {prepareTranscriptItem, sha256} from './course-contract.mjs';
import {createNativePlan} from './native-scenes.mjs';
import {validateFrozenCatalogue} from './transcript-batch.mjs';

const owned = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(owned, '../..');
const require = createRequire(import.meta.url);

async function main() {
  const [batch, output] = process.argv.slice(2);
  assert.ok(batch && output && path.isAbsolute(batch) && path.isAbsolute(output), 'Usage: benchmark-course.mjs /frozen/batch /new/output');
  assert.ok(!fs.existsSync(output), 'Benchmark output already exists');
  const catalogue = validateFrozenCatalogue(JSON.parse(fs.readFileSync(path.join(batch, 'catalogue.json'))));
  fs.mkdirSync(output, {recursive:true});
  const work = path.join(output, 'work');
  const publicDir = path.join(work, 'public');
  fs.mkdirSync(publicDir, {recursive:true});
  for (const weight of [400, 700]) fs.copyFileSync(path.join(root, `pages/inferencia/vendor/atkinson-latin-${weight}.woff2`), path.join(publicDir, `atkinson-latin-${weight}.woff2`));
  const runtime = require('@remotion/renderer');
  const {bundle} = require('@remotion/bundler');
  const results = [];
  let browser;
  try {
    const serveUrl = await bundle({entryPoint:path.join(owned, 'NativeCourse.jsx'), outDir:path.join(work, 'bundle'), rootDir:owned, publicDir, enableCaching:false, gitSource:null});
    const ensured = await runtime.ensureBrowser();
    browser = await runtime.openBrowser('chrome', {browserExecutable:ensured.path, logLevel:'error'});
    for (const id of ['proporciones--parte-y-total', 'normal-bivariante--media-y-varianza-condicional', 'ejercicio-pdf-u1-1--a']) {
      const item = catalogue.items.find(entry => entry.id === id);
      assert.ok(item, `Missing ${id}`);
      const storyboard = prepareTranscriptItem(item, undefined, {native:true});
      storyboard.nativePlan = createNativePlan(item);
      const inputProps = {storyboard, audit:true};
      const composition = await runtime.selectComposition({serveUrl, id:'Course', inputProps, puppeteerInstance:browser, logLevel:'error'});
      const frames = Math.min(300, storyboard.frames);
      let reference;
      let referenceLayout;
      let referenceVideo;
      for (const concurrency of [1, 4, 8]) {
        const video = path.join(work, `${id}-${concurrency}.mp4`);
        const layout = new Map();
        const started = performance.now();
        await runtime.renderMedia({serveUrl, composition, inputProps, puppeteerInstance:browser, outputLocation:video, codec:'h264', pixelFormat:'yuv420p', crf:20, x264Preset:'fast', concurrency, frameRange:[0, frames-1], muted:true, overwrite:true, logLevel:'error', onBrowserLog:log => {
          if (log.text?.startsWith('REMOTION_NATIVE_LAYOUT ')) {
            const evidence = JSON.parse(log.text.slice('REMOTION_NATIVE_LAYOUT '.length));
            layout.set(evidence.frame, evidence);
          }
        }});
        const seconds = (performance.now()-started)/1000;
        const decoded = execFileSync('/usr/bin/ffmpeg', ['-v', 'error', '-xerror', '-threads', '1', '-i', video, '-map', '0:v:0', '-f', 'framemd5', '-'], {maxBuffer:1024*1024}).toString().split('\n').filter(line => line && !line.startsWith('#'));
        assert.equal(decoded.length, frames, 'Unexpected decoded frame count');
        assert.equal(layout.size, frames);
        const errors = [...layout.values()].filter(entry => entry.errors.length);
        assert.equal(errors.length, 0, JSON.stringify(errors.slice(0, 2)));
        const differences = reference ? decoded.flatMap((line, frame) => line === reference[frame] ? [] : [frame]) : [];
        const geometryDifferences = referenceLayout ? [...layout].filter(([frame, evidence]) => evidence.geometrySha256 !== referenceLayout.get(frame).geometrySha256).map(([frame]) => frame).sort((first, second) => first-second) : [];
        let ssim = 1;
        if (differences.length) {
          const comparison = spawnSync('/usr/bin/ffmpeg', ['-threads', '1', '-i', referenceVideo, '-threads', '1', '-i', video, '-lavfi', 'ssim', '-f', 'null', '-'], {encoding:'utf8', maxBuffer:1024*1024});
          assert.equal(comparison.status, 0, comparison.stderr.slice(-1000));
          ssim = Number(comparison.stderr.match(/SSIM[^\n]*All:([\d.]+)/)?.[1]);
        }
        const result = {id, concurrency, frames, seconds, fps:frames/seconds, decodedSha256:sha256(decoded.join('\n')), identical:!differences.length, differentFrames:differences.length, firstDifferentFrame:differences[0], ssim, geometryDifferences:geometryDifferences.slice(0, 8)};
        results.push(result);
        fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({complete:false, results}, null, 2)+'\n');
        console.log(`REMOTION_BENCHMARK ${JSON.stringify(result)}`);
        assert.equal(geometryDifferences.length, 0, `${id}: parallel rendering changed native geometry`);
        assert.ok(ssim >= .9995, `${id}: parallel video SSIM ${ssim}`);
        if (!reference) {reference = decoded; referenceLayout = layout; referenceVideo = video;}
      }
    }
    fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({complete:true, results}, null, 2)+'\n');
  } finally {
    if (browser) await browser.close({silent:true});
    fs.rmSync(work, {recursive:true, force:true});
  }
}

main().catch(error => {console.error(error); process.exitCode = 1;});