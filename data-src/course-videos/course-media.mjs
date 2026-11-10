import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import {sha256, VIDEO} from './course-contract.mjs';
import {courseTimeline} from './course-frame.mjs';

export const probeMedia = (ffprobe, filename) => JSON.parse(execFileSync(ffprobe, ['-v', 'error', '-count_frames', '-show_streams', '-of', 'json', filename], {encoding:'utf8'}));

export function verifyMedia({ffmpeg, ffprobe, video, poster, storyboard, frames}) {
  const {streams} = probeMedia(ffprobe, video);
  const picture = streams.find(stream => stream.codec_type === 'video');
  const sound = streams.find(stream => stream.codec_type === 'audio');
  assert.equal(picture?.codec_name, 'h264');
  assert.equal(picture.width, VIDEO.width);
  assert.equal(picture.height, VIDEO.height);
  assert.equal(picture.avg_frame_rate, '30/1');
  assert.equal(Number(picture.nb_read_frames), storyboard.frames);
  assert.ok(Math.abs(Number(picture.duration) - storyboard.duration) <= 1 / VIDEO.fps + 0.001, 'Video duration mismatch');
  if (storyboard.narrationMode === 'transcript') {
    assert.equal(storyboard.transcript?.silent, true, 'Transcript must be explicitly silent');
    assert.equal(streams.filter(stream => stream.codec_type === 'audio').length, 0, 'Transcript draft must not contain audio tracks');
  } else {
    assert.equal(sound?.codec_name, 'aac');
    assert.ok(Math.abs(Number(sound.duration) - storyboard.frames / VIDEO.fps) < 0.08, 'AAC duration mismatch');
  }
  execFileSync(ffmpeg, ['-v', 'error', '-xerror', '-i', video, '-f', 'null', '-'], {stdio:['ignore', 'pipe', 'pipe']});
  const selectedFrames = [...new Set(frames)].sort((left, right) => left - right);
  const frameBytes = 320 * 135 * 3;
  const selection = selectedFrames.map(frame => `eq(n\\,${frame})`).join('+');
  const samples = execFileSync(ffmpeg, ['-v', 'error', '-i', video, '-vf', `select=${selection},scale=320:180,crop=320:135:0:22`, '-vsync', '0', '-frames:v', String(selectedFrames.length), '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], {maxBuffer:frameBytes * selectedFrames.length + 1024 * 1024});
  assert.equal(samples.length, frameBytes * selectedFrames.length, 'Missing sampled video pixels');
  const pixels = [];
  for (const [index, frame] of selectedFrames.entries()) {
    const raw = samples.subarray(index * frameBytes, (index + 1) * frameBytes);
    let ink = 0;
    for (let offset = 0; offset < raw.length; offset += 3) if (Math.min(...raw.subarray(offset, offset + 3)) < 150) ink++;
    assert.ok(ink > 60, `Frame ${frame}: blank whiteboard`);
    pixels.push({frame, ink, sha256:sha256(raw)});
  }
  if (courseTimeline(storyboard).scenes.reduce((count, scene) => count + scene.cues.length, 0) > 1) {
    assert.ok(new Set(pixels.map(sample => sample.sha256)).size > 1, 'Whiteboard never evolves');
  }
  const posterStreams = probeMedia(ffprobe, poster).streams;
  assert.equal(posterStreams[0]?.width, VIDEO.width);
  assert.equal(posterStreams[0]?.height, VIDEO.height);
  return {streams, pixels, videoSha256:sha256(fs.readFileSync(video)), posterSha256:sha256(fs.readFileSync(poster))};
}