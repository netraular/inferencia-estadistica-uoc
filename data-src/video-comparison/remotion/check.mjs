import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import ffmpeg from 'ffmpeg-static';
import ffprobe from 'ffprobe-static';
import {captionLines, frameAt} from './src/timing.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const shared = path.resolve(root, '../../../static/comparativa-videos/shared');
const output = path.resolve(root, '../../../static/comparativa-videos/remotion');
const script = JSON.parse(await readFile(path.join(shared, 'script.json'), 'utf8'));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
assert.equal(sha(await readFile(path.join(shared, script.audio))), script.audioSha256);
assert.equal(script.cues.length, 10);
assert.equal(script.frames, frameAt(script.duration, script.fps));
for (const cue of script.cues) {
  const lines = captionLines(cue.text);
  assert.ok(lines.length <= 2);
  assert.equal(lines.join(' '), cue.text);
  assert.ok(frameAt(cue.end) > frameAt(cue.start));
}
const near = (value, expected) => assert.ok(Math.abs(value-expected) < 1e-10);
near(2*script.models[0].height, 1);
near(2*2*script.models[1].slope/2, 1);
near(script.models[2].heights.reduce((sum, value) => sum+value, 0), 1);
near((1.2-0.4)*0.5, script.models[0].probability);
near((1.2**2-0.4**2)/4, script.models[1].probability);
near(0.25*(1-0.4)+0.75*(1.2-1), script.models[2].probability);
const html = await readFile(path.join(output, 'player.html'), 'utf8');
assert.match(html, /<video\s[^>]*controls[^>]*playsinline/);
assert.doesNotMatch(html, /autoplay|https?:\/\/|cdn\./i);
assert.match(html, /poster="poster.jpg"/);
assert.match(html, /src="video.mp4"/);
const source = await readFile(path.join(root, 'src/composition.jsx'), 'utf8');
assert.match(source, /useCurrentFrame/);
assert.match(source, /<Audio src=\{staticFile\(script.audio\)\}/);
assert.match(source, /OTRO MODELO/);
assert.match(source, /TERCER MODELO/);
console.log('Source checks: literal 10 cues, two-line wrapping, density normalization, 0.4/0.32/0.30, native player PASS.');
if (!process.argv.includes('--source')) {
  const video = path.join(output, 'video.mp4');
  const metadata = JSON.parse(execFileSync(ffprobe.path, ['-v', 'error', '-count_frames', '-show_streams', '-show_format', '-of', 'json', video], {cwd: root, encoding: 'utf8'}));
  const image = metadata.streams.find(stream => stream.codec_type === 'video');
  const audio = metadata.streams.find(stream => stream.codec_type === 'audio');
  assert.equal(image.width, script.width);
  assert.equal(image.height, script.height);
  assert.equal(image.avg_frame_rate, '30/1');
  assert.equal(Number(image.nb_read_frames), script.frames);
  assert.equal(image.codec_name, 'h264');
  assert.match(image.pix_fmt, /^yuvj?420p$/);
  assert.equal(audio.codec_name, 'mp3');
  near(Number(image.duration), script.duration);
  assert.ok(Number(metadata.format.duration) >= script.duration);
  assert.ok(Number(metadata.format.duration) <= script.duration+0.15);
  const packets = file => execFileSync(ffmpeg, ['-v', 'error', '-i', file, '-map', '0:a:0', '-c', 'copy', '-f', 'data', 'pipe:1'], {cwd: root, maxBuffer: 16*1024*1024});
  const originalPackets = packets(path.join(shared, script.audio));
  const exportedPackets = packets(video);
  assert.deepEqual(exportedPackets, originalPackets);
  const cache = path.join(root, '.cache/validation');
  await mkdir(cache, {recursive: true});
  const sampledFrames = [...new Set([0, ...script.cues.map(cue => frameAt((cue.start+cue.end)/2)), 683, 684, 959, 960, 1184])].sort((left, right) => left-right);
  const samples = [];
  for (const frame of sampledFrames) {
    const pixels = execFileSync(ffmpeg, ['-v', 'error', '-i', video, '-vf', `select=eq(n\\,${frame})`, '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1'], {cwd: root, maxBuffer: 4*1024*1024});
    assert.equal(pixels.length, script.width*script.height*3);
    let colored = 0;
    let subtitlePixels = 0;
    let minX = script.width;
    let maxX = 0;
    const occupiedRows = [];
    for (let row = 0; row < script.height; row++) {
      let rowInk = 0;
      for (let column = 0; column < script.width; column++) {
        const index = (row*script.width+column)*3;
        const [red, green, blue] = pixels.subarray(index,index+3);
        if (row >= 215 && row <= 518 && column >= 85 && column <= 750 && green > red+12 && green > blue+8) colored++;
        if (row >= 632 && row <= 712 && red > 200 && green > 200 && blue > 200) {subtitlePixels++;rowInk++;minX=Math.min(minX,column);maxX=Math.max(maxX,column);}
      }
      if (rowInk > 3) occupiedRows.push(row);
    }
    assert.ok(colored > 100, `Nonblank mathematical plot at frame ${frame}`);
    const cue = script.cues.find(cue => frame >= frameAt(cue.start) && frame < frameAt(cue.end));
    let groups = 0;
    let previous = -2;
    for (const row of occupiedRows) {if (row > previous+6) groups++;previous=row;}
    if (cue) {
      assert.ok(subtitlePixels > 300, `Readable caption pixels at frame ${frame}`);
      assert.ok(minX >= 66 && maxX <= script.width-66, `Caption horizontal margins at frame ${frame}`);
      assert.ok(groups <= 2, `At most two decoded caption lines at frame ${frame}`);
    } else assert.equal(subtitlePixels, 0, `Measured cue gap at frame ${frame}`);
    execFileSync(ffmpeg, ['-v', 'error', '-y', '-i', video, '-vf', `select=eq(n\\,${frame})`, '-frames:v', '1', '-q:v', '2', path.join(cache, `frame-${frame}.jpg`)], {cwd: root});
    samples.push({frame, caption: cue?.text ?? null, subtitlePixels, decodedLines: groups, plotColoredPixels: colored, pixelSha256: sha(pixels)});
  }
  const poster = JSON.parse(execFileSync(ffprobe.path, ['-v', 'error', '-show_streams', '-of', 'json', path.join(output, 'poster.jpg')], {cwd: root, encoding: 'utf8'})).streams[0];
  assert.equal(poster.width, 1280);
  assert.equal(poster.height, 720);
  const report = {width: image.width, height: image.height, fps: image.avg_frame_rate, frames: Number(image.nb_read_frames), videoDuration: image.duration, containerDuration: metadata.format.duration,
    videoCodec: image.codec_name, pixelFormat: image.pix_fmt, audioCodec: audio.codec_name, audioSampleRate: audio.sample_rate, audioChannels: audio.channels,
    originalAudioSha256: script.audioSha256, copiedAudioPacketSha256: sha(exportedPackets), originalAudioPacketsIdentical: true, captionCues: script.cues.length,
    sampledFrames, samples, poster: {width: poster.width, height: poster.height}, bytes: Number(metadata.format.size)};
  await writeFile(path.join(cache, 'metadata.json'), JSON.stringify(report, null, 2)+'\n');
  console.log(JSON.stringify({...report, samples: `${samples.length} decoded frames PASS`}, null, 2));
}