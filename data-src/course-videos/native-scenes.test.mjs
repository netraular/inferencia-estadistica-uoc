import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createNativePlan} from './native-scenes.mjs';
import {validateNativePlan} from './native-plan.mjs';
import {nativeLayoutErrors} from './native-layout.mjs';
import {prepareTranscriptItem, TRANSCRIPT_TIMING} from './course-contract.mjs';
import {courseTimeline} from './course-frame.mjs';

test('native scenes reject unowned topics instead of falling back to a whiteboard', () => {
  assert.throws(() => createNativePlan({id:'missing', kind:'section', animation:{steps:[]}}), /exactly one native scene/);
});

test('native scene plans retain every frozen narration cue and canonical identity', {skip:!process.env.COURSE_VIDEO_CATALOGUE}, () => {
  const source = process.env.COURSE_VIDEO_CATALOGUE;
  const catalogue = JSON.parse(fs.readFileSync(source, 'utf8'));
  const counts = {};
  for (const item of catalogue.items) {
    const plan = createNativePlan(item);
    assert.equal(validateNativePlan(item, plan), plan);
    counts[item.kind] = (counts[item.kind] || 0) + 1;
    const changed = structuredClone(item);
    const cue = changed.animation.steps[0].cues[0];
    if (typeof cue === 'string') changed.animation.steps[0].cues[0] += ' changed';
    else cue.text += ' changed';
    assert.throws(() => validateNativePlan(changed, plan), /stale native visual action/);
  }
  assert.deepEqual(counts, {section:118, recap:36, exercise:387});
});

test('native audit rejects clipped text, overlapping labels and overflowing paragraphs', () => {
  const first = {name:'text',kind:'label',text:'Title',x:70,y:40,width:220,height:24};
  assert.deepEqual(nativeLayoutErrors([first], []), []);
  const second = {...first,text:'8 / 4 = 2',x:100,y:48};
  assert.match(nativeLayoutErrors([first,second], []).join(' '), /Overlapping native labels/);
  assert.deepEqual(nativeLayoutErrors([first,{...second,y:90}], []), []);
  const clipped = {...first,clips:[{name:'svg',x:60,y:40,width:300,height:12}]};
  assert.match(nativeLayoutErrors([clipped], []).join(' '), /text clipped by svg/);
  assert.match(nativeLayoutErrors([], [{name:'explanation',scrollWidth:350,clientWidth:350,scrollHeight:120,clientHeight:98}]).join(' '), /explanation: text overflow/);
  assert.match(nativeLayoutErrors([{...first,x:1190}], []).join(' '), /outside native stage/);
});

test('real 720p native formulas fit frozen long content and reverse seeks', {skip:!process.env.COURSE_VIDEO_REAL_STILLS}, async () => {
  assert.ok(process.env.COURSE_VIDEO_CATALOGUE, 'Real stills require the frozen catalogue');
  const catalogue = JSON.parse(fs.readFileSync(process.env.COURSE_VIDEO_CATALOGUE));
  const item = catalogue.items.find(entry => entry.id === 'proporciones');
  assert.ok(item);
  const storyboard = prepareTranscriptItem(item, TRANSCRIPT_TIMING, {native:true});
  storyboard.nativePlan = createNativePlan(item);
  const timeline = courseTimeline(storyboard);
  const longFormulas = storyboard.nativePlan.scenes.flatMap((scene, sceneIndex) => scene.sourceLines.filter(line => line.tex).map(line => ({
    tex:line.tex, frame:Math.ceil((timeline.scenes[sceneIndex].cues[line.cue ?? 0].start + .6) * storyboard.fps),
  }))).sort((first, second) => second.tex.length - first.tex.length).slice(0, 3);
  const frames = [...new Set([3536, 5856, ...longFormulas.map(entry => entry.frame)])];
  const formula = 'E[1000X]=1000E[X],\\quad V(1000X)=10^6V(X)';
  const require = createRequire(import.meta.url);
  const runtime = require('@remotion/renderer');
  const {bundle} = require('@remotion/bundler');
  const {seekToFrame} = require(path.join(path.dirname(require.resolve('@remotion/renderer')), 'seek-to-frame.js'));
  const owned = path.dirname(fileURLToPath(import.meta.url));
  const output = process.env.COURSE_VIDEO_STILLS_OUTPUT;
  if (output) fs.mkdirSync(output, {recursive:true});
  const work = fs.mkdtempSync(path.join(output || os.tmpdir(), 'native-formula-stills-'));
  const publicDir = path.join(work, 'public');
  fs.mkdirSync(publicDir);
  for (const weight of [400, 700]) fs.copyFileSync(path.resolve(owned, `../../pages/inferencia/vendor/atkinson-latin-${weight}.woff2`), path.join(publicDir, `atkinson-latin-${weight}.woff2`));
  const results = [];
  let browser;
  let capturingFrame;
  let reverseChecked = false;
  const measure = () => ({fonts:document.fonts.status, formulas:Array.from(document.querySelectorAll('[data-native-math]'), element => ({
    tex:element.dataset.nativeMath, text:element.textContent, fontSize:getComputedStyle(element).fontSize,
    scrollWidth:element.scrollWidth, clientWidth:element.clientWidth, scrollHeight:element.scrollHeight, clientHeight:element.clientHeight,
    contentWidth:element.firstElementChild.getBoundingClientRect().width, width:element.getBoundingClientRect().width,
  }))});
  const check = dom => {
    assert.equal(dom.fonts, 'loaded');
    for (const element of dom.formulas) {
      assert.ok(element.text.length > 0);
      assert.ok(element.scrollWidth <= element.clientWidth, JSON.stringify(element));
      assert.ok(element.scrollHeight <= element.clientHeight, JSON.stringify(element));
      assert.ok(element.contentWidth <= element.width, JSON.stringify(element));
    }
  };
  try {
    const serveUrl = await bundle({entryPoint:path.join(owned, 'NativeCourse.jsx'), outDir:path.join(work, 'bundle'), rootDir:owned, publicDir, enableCaching:false, gitSource:null});
    const ensured = await runtime.ensureBrowser();
    browser = await runtime.openBrowser('chrome', {browserExecutable:ensured.path, logLevel:'error'});
    const newPage = browser.newPage.bind(browser);
    browser.newPage = async options => {
      const page = await newPage(options);
      const close = page.close.bind(page);
      page.close = async options => {
        try {
          const dom = await page.evaluate(measure);
          check(dom);
          results.push({frame:capturingFrame, dom});
          if (!reverseChecked && capturingFrame === 3536) {
            reverseChecked = true;
            const original = dom.formulas.find(element => element.tex === formula);
            assert.ok(original, 'Missing the exact frozen overflowing formula');
            assert.equal(original.text, 'E[1000X]=1000E[X],V(1000X)=106V(X)');
            for (const frame of [2679, 3536, 5856, 3536]) {
              await seekToFrame({frame, videoEnabled:true, audioEnabled:false, page, composition:'Course', timeoutInMilliseconds:30000, logLevel:'error', indent:false, attempt:0});
              const next = await page.evaluate(measure);
              check(next);
              results.push({frame, reverse:true, dom:next});
              if (frame === 3536) assert.deepEqual(next.formulas.find(element => element.tex === formula), original);
            }
          }
        } finally {await close(options);}
      };
      return page;
    };
    const inputProps = {storyboard, audit:true};
    const composition = {id:'Course', width:1280, height:720, fps:30, durationInFrames:storyboard.frames, props:inputProps, defaultProps:{}};
    for (const frame of frames) {
      capturingFrame = frame;
      const layouts = [];
      const still = path.join(work, `frame-${frame}.png`);
      await runtime.renderStill({serveUrl, composition, inputProps, puppeteerInstance:browser, frame, output:still, imageFormat:'png', logLevel:'error', onBrowserLog:log => {
        if (log.text?.startsWith('REMOTION_NATIVE_LAYOUT ')) layouts.push(JSON.parse(log.text.slice('REMOTION_NATIVE_LAYOUT '.length)));
      }});
      const layout = layouts.find(entry => entry.frame === frame);
      assert.ok(layout, `Missing layout at ${frame}`);
      assert.deepEqual(layout.errors, []);
      assert.ok(layout.marks > 0);
      const pixels = execFileSync('/usr/bin/ffmpeg', ['-v', 'error', '-xerror', '-i', still, '-vf', 'scale=320:180,crop=320:135:0:22', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], {maxBuffer:1024*1024});
      let ink = 0;
      for (let offset = 0; offset < pixels.length; offset += 3) if (Math.min(...pixels.subarray(offset, offset+3)) < 150) ink++;
      assert.ok(ink > 60, `Blank still at ${frame}`);
      if (output) fs.copyFileSync(still, path.join(output, `frame-${frame}.png`));
    }
    assert.ok(reverseChecked);
    if (output) fs.writeFileSync(path.join(output, 'dom-results.json'), JSON.stringify({frames, reverseChecked, results}, null, 2));
  } finally {
    if (browser) await browser.close({silent:true});
    fs.rmSync(work, {recursive:true, force:true});
  }
});