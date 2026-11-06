import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {copyFileSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, renameSync, rmSync, statSync, writeFileSync} from 'node:fs';
import {isAbsolute, join, relative, resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));

export function safeName(name) {
  assert.equal(typeof name, 'string', 'Nombre de archivo invalido');
  assert.ok(name && name !== '.' && name !== '..' && !/[\\/\x00-\x1f]/.test(name), 'Nombre de archivo inseguro');
  return name;
}

export function inside(root, name) {
  name.split('/').forEach(safeName);
  const base = realpathSync(root);
  const target = realpathSync(resolve(base, name));
  const path = relative(base, target);
  assert.ok(path && !isAbsolute(path) && path !== '..' && !path.startsWith(`..${sep}`), 'Ruta fuera del directorio de entrada');
  assert.ok(statSync(target).isFile(), 'Se esperaba un archivo');
  return target;
}

function outputDirectory(path) {
  mkdirSync(path, {recursive: true});
  assert.equal(realpathSync(path), resolve(path), 'El destino no puede contener enlaces simbolicos');
}

function outputFile(directory, name) {
  const path = join(directory, safeName(name));
  if (existsSync(path)) assert.ok(lstatSync(path).isFile() && !lstatSync(path).isSymbolicLink(), 'Destino inseguro');
  return path;
}

function writeJson(directory, name, data) {
  const destination = outputFile(directory, name);
  const temporary = outputFile(directory, `.${name}.${process.pid}.tmp`);
  try {
    writeFileSync(temporary, `${JSON.stringify(data, null, 2)}\n`, {flag: 'wx'});
    renameSync(temporary, destination);
  } finally {
    rmSync(temporary, {force: true});
  }
}

export function documentMetadata(filename, bytes) {
  safeName(filename);
  assert.ok(/\.pdf$/i.test(filename), 'Extension PDF requerida');
  assert.ok(bytes.length > 20 && /^%PDF-1\.[0-9]/.test(bytes.subarray(0, 8).toString('ascii')), 'Cabecera PDF invalida');
  assert.ok(/%%EOF\s*$/.test(bytes.subarray(-1024).toString('ascii')), 'PDF incompleto');
  let title;
  let category;
  const theme = /^FundamentosInferencia_Tema(\d+)\.pdf$/.exec(filename);
  const exercise = /^Ejercicios_(?:Unidad_(\d+)-Soluciones|U(\d+)-Distribuciones_multivariantes-SOLUCIONES)\.pdf$/.exec(filename);
  const assessment = /(?:^|[-_])(PEC\d+)(?:[-_]|\.)/i.exec(filename);
  if (theme) {
    title = `Fundamentos de inferencia: tema ${theme[1]}`;
    category = 'temario';
  } else if (exercise) {
    title = `Ejercicios resueltos: unidad ${exercise[1] || exercise[2]}${exercise[2] ? ' (distribuciones multivariantes)' : ''}`;
    category = 'ejercicios';
  } else if (assessment) {
    title = `${assessment[1].toUpperCase()}: enunciado de evaluacion`;
    category = 'evaluacion';
  } else {
    throw new Error(`PDF sin clasificacion: ${filename}`);
  }
  return {title, filename, size: bytes.length, category};
}

export function prepareDocuments(pdfRoot, destination = join(projectRoot, 'static/materiales')) {
  const documents = readdirSync(pdfRoot).filter(name => /\.pdf$/i.test(name)).sort().map(filename => {
    const source = inside(pdfRoot, safeName(filename));
    return {source, metadata: documentMetadata(filename, readFileSync(source))};
  });
  assert.ok(documents.length, 'No se encontraron PDF');
  outputDirectory(destination);
  for (const {source, metadata} of documents) {
    const target = outputFile(destination, metadata.filename);
    copyFileSync(source, target);
    assert.deepEqual(documentMetadata(metadata.filename, readFileSync(target)), metadata);
  }
  const manifest = {documents: documents.map(item => item.metadata)};
  writeJson(destination, 'manifest.json', manifest);
  return manifest;
}

const hash = data => createHash('sha256').update(data).digest('hex');
const json = (root, name) => JSON.parse(readFileSync(inside(root, name), 'utf8'));
const signature = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const lessonId = value => typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
const MAX_AUDIO_BYTES = 100_000_000;

export function canonicalContent(lesson) {
  return {
    id: lesson.id, title: lesson.title, source: lesson.source,
    scenes: lesson.scenes.map(scene => ({
      title: scene.title, caption: scene.caption, kind: scene.kind,
      chapter: scene.chapter, tex: scene.tex || null,
      cues: scene.cues.map(cue => cue.text)
    }))
  };
}

export async function canonicalLectures(destination) {
  outputDirectory(destination);
  const temporary = mkdtempSync(join(destination, '.canonical-'));
  try {
    const {exportLectures} = await import('../data-src/inferencia-estadistica/export-lecturas.mjs');
    exportLectures(temporary);
    return json(temporary, 'lecturas.json');
  } finally {
    rmSync(temporary, {recursive: true, force: true});
  }
}

export function validateTimeline(scenes, canonical, duration) {
  assert.ok(Number.isFinite(duration) && duration > 0, 'Duracion invalida');
  assert.equal(scenes.length, canonical.scenes.length, 'Numero de escenas incompatible');
  let previousEnd = 0;
  scenes.forEach((scene, index) => {
    assert.ok(Number.isFinite(scene.start) && Number.isFinite(scene.end), 'Tiempos de escena invalidos');
    assert.ok(scene.start >= previousEnd && scene.end > scene.start && scene.end <= duration + 0.000001, 'Escenas fuera del archivo o desordenadas');
    assert.ok(index !== 0 || scene.start === 0, 'Primera escena desplazada');
    assert.ok(Array.isArray(scene.cues) && scene.cues.length, 'Faltan cues medidas: solo hay limites de escena');
    assert.deepEqual(scene.cues.map(cue => cue.text), canonical.scenes[index].cues.map(cue => cue.text), 'Cues distintas del canonico');
    let previousCueEnd = scene.start;
    for (const cue of scene.cues) {
      assert.ok(Number.isFinite(cue.start) && Number.isFinite(cue.end), 'Tiempos de cue invalidos');
      assert.ok(cue.start >= previousCueEnd && cue.end > cue.start && cue.end <= scene.end + 0.000001, 'Cues no globales, solapadas o fuera de escena');
      previousCueEnd = cue.end;
    }
    previousEnd = scene.end;
  });
  assert.ok(Math.abs(previousEnd - duration) < 0.000001, 'Ultima escena no llega al final del audio');
  return scenes.map(scene => ({start: scene.start, end: scene.end, cues: scene.cues.map(({start, end, text}) => ({start, end, text}))}));
}

export function estimateSceneCues(scenes, canonical) {
  return scenes.map((scene, index) => {
    const cues = canonical.scenes[index].cues;
    const first = cues[0].start;
    const span = cues.at(-1).end - first;
    assert.ok(span > 0, 'Duracion canonica de escena invalida');
    const time = value => scene.start + (value - first) / span * (scene.end - scene.start);
    return {...scene, cues:cues.map(cue => ({text:cue.text, start:time(cue.start), end:time(cue.end)}))};
  });
}

export function validateLesson(report, snapshot, exported, canonical, {allowEstimatedCues = false} = {}) {
  assert.equal(report.id, canonical.id, 'ID incompatible');
  assert.equal(report.title, canonical.title, 'Titulo incompatible');
  assert.deepEqual(report.source, canonical.source, 'Procedencia incompatible');
  assert.equal(report.scene_count, canonical.scenes.length, 'Agregado incompleto');
  assert.equal(report.scenes.length, report.scene_count, 'Agregado incompleto');
  assert.deepEqual(canonicalContent(exported), canonicalContent(canonical), 'Exportacion congelada distinta del canonico actual');
  assert.deepEqual(canonicalContent(snapshot), canonicalContent(canonical), 'Guion congelado distinto del canonico actual');
  report.scenes.forEach((scene, index) => {
    assert.equal(scene.title, snapshot.scenes[index].title, 'Orden o titulo de escena incompatible');
    assert.equal(scene.chapter, snapshot.scenes[index].chapter, 'Capitulo incompatible');
    assert.equal(scene.text, snapshot.scenes[index].spoken_text, 'Narracion distinta del guion congelado');
  });
  const estimated = allowEstimatedCues && report.scenes.every(scene => !scene.cues);
  const scenes = validateTimeline(estimated ? estimateSceneCues(report.scenes, canonical) : report.scenes, canonical, report.duration_seconds);
  if (!estimated) assert.equal(report.cue_timing, 'measured', 'Las cues no declaran alineacion medida');
  assert.ok(signature(report.signature) && signature(report.sha256), 'Firma o checksum invalido');
  assert.ok(Number.isInteger(report.frames) && report.frames > 0 && report.sample_rate === 44100, 'Formato WAV incompatible');
  assert.ok(Math.abs(report.frames / report.sample_rate - report.duration_seconds) < 0.000001, 'Duracion y frames inconsistentes');
  return scenes;
}

export function sceneSubtitles(vtt) {
  const blocks = vtt.replace(/\r/g, '').trim().split(/\n\s*\n/);
  assert.equal(blocks.shift(), 'WEBVTT', 'Cabecera VTT invalida');
  const seconds = value => {
    const match = /^(\d{2,}):(\d{2}):(\d{2})\.(\d{3})$/.exec(value);
    assert.ok(match && Number(match[2]) < 60 && Number(match[3]) < 60, 'Timestamp VTT invalido');
    return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]) + Number(match[4]) / 1000;
  };
  return blocks.map(block => {
    const lines = block.split('\n');
    if (/^\d+$/.test(lines[0])) lines.shift();
    const timing = lines.shift().split(' --> ');
    assert.equal(timing.length, 2, 'Intervalo VTT invalido');
    return {start: seconds(timing[0]), end: seconds(timing[1]), text: lines.join('\n')};
  });
}

function executable(name) {
  for (const command of [name, `${name}.exe`]) {
    try {
      execFileSync(command, ['-version'], {stdio: 'ignore'});
      return command;
    } catch {}
  }
  throw new Error(`No se encontro ${name}; no se publican WAV grandes ni se instalan dependencias`);
}

function toolPath(command, path) {
  return process.platform === 'linux' && command.endsWith('.exe')
    ? execFileSync('wslpath', ['-w', resolve(path)], {encoding: 'utf8'}).trim()
    : path;
}

export function probeAudio(path, command = executable('ffprobe')) {
  const result = JSON.parse(execFileSync(command, ['-v', 'error', '-show_entries', 'format=duration,size:stream=codec_name,codec_type,channels,sample_rate,duration', '-of', 'json', toolPath(command, path)], {encoding: 'utf8', maxBuffer: 1024 * 1024}));
  assert.equal(result.streams.length, 1, 'Se requiere una unica pista de audio');
  assert.equal(result.streams[0].codec_type, 'audio', 'Pista no sonora');
  const duration = Number(result.format.duration);
  assert.ok(Number.isFinite(duration) && duration > 0, 'ffprobe no obtuvo duracion');
  return {...result.streams[0], duration, size: Number(result.format.size)};
}

export function encodeMp3(source, target, expectedDuration) {
  const ffmpeg = executable('ffmpeg');
  const ffprobe = executable('ffprobe');
  const wav = probeAudio(source, ffprobe);
  assert.equal(wav.channels, 1, 'WAV no mono');
  assert.equal(wav.codec_name, 'pcm_s16le', 'WAV no PCM16');
  assert.equal(Number(wav.sample_rate), 44100, 'Sample rate incompatible');
  assert.ok(Math.abs(Number(wav.duration) - expectedDuration) <= 1 / 44100 + 0.000001, 'Duracion WAV inconsistente');
  const staging = mkdtempSync(join(resolve(target, '..'), '.encode-'));
  const temporary = join(staging, 'audio.mp3');
  try {
    execFileSync(ffmpeg, ['-nostdin', '-hide_banner', '-loglevel', 'error', '-n', '-threads', '1', '-filter_threads', '1', '-filter_complex_threads', '1', '-i', toolPath(ffmpeg, source), '-map', '0:a:0', '-map_metadata', '-1', '-vn', '-ac', '1', '-codec:a', 'libmp3lame', '-b:a', '48k', '-threads', '1', toolPath(ffmpeg, temporary)], {stdio: ['ignore', 'ignore', 'pipe']});
    const mp3 = probeAudio(temporary, ffprobe);
    assert.equal(mp3.codec_name, 'mp3', 'Salida no MP3');
    assert.equal(mp3.channels, 1, 'MP3 no mono');
    assert.ok(mp3.size > 0 && mp3.size < MAX_AUDIO_BYTES, 'MP3 demasiado grande');
    assert.ok(Math.abs(Number(mp3.duration) - expectedDuration) < 0.15, 'Duracion MP3 incompatible con las escenas');
    renameSync(temporary, target);
    return Number(mp3.duration);
  } finally {
    rmSync(staging, {recursive: true, force: true});
  }
}

function validateSourceFiles(audioRoot, snapshot, report) {
  const prefix = snapshot.directory;
  const wav = inside(audioRoot, `${prefix}/audio.wav`);
  assert.equal(hash(readFileSync(wav)), report.sha256, 'Checksum WAV incorrecto');
  const parts = report.scenes.map((scene, index) => {
    const part = json(audioRoot, `${prefix}/${scene.audio.replace(/\.wav$/, '.json')}`);
    assert.ok(signature(part.signature), 'Firma de fragmento invalida');
    assert.equal(part.text, snapshot.scenes[index].spoken_text, 'Firma de otra narracion');
    assert.equal(part.sample_rate, report.sample_rate, 'Fragmento con formato distinto');
    assert.ok(Math.abs(part.frames / part.sample_rate - (scene.end - scene.start)) < 0.000001, 'Duracion de fragmento incompatible');
    return part.signature;
  });
  assert.equal(hash(parts.join('')), report.signature, 'Firma agregada incorrecta');
  const subtitles = sceneSubtitles(readFileSync(inside(audioRoot, `${prefix}/audio.vtt`), 'utf8'));
  assert.equal(subtitles.length, report.scenes.length, 'VTT incompleto');
  subtitles.forEach((cue, index) => {
    const scene = report.scenes[index];
    assert.equal(cue.text, scene.text, 'Texto VTT distinto de la escena');
    assert.ok(Math.abs(cue.start - scene.start) <= 0.000501 && Math.abs(cue.end - scene.end) <= 0.000501, 'VTT sin tiempos medidos de escena');
  });
  return wav;
}

export function publicProvenance(data) {
  for (const key of ['sourceSignature', 'wavSha256', 'canonicalSha256', 'mp3Sha256']) assert.ok(signature(data[key]), 'Procedencia incompleta');
  assert.ok(Number.isInteger(data.mp3Bytes) && data.mp3Bytes > 0 && data.mp3Bytes < MAX_AUDIO_BYTES, 'Tamano de procedencia invalido');
  assert.ok(Number.isFinite(data.sourceDuration) && data.sourceDuration > 0, 'Duracion de procedencia invalida');
  assert.ok(['measured', 'scene-measured-cues-estimated'].includes(data.timing), 'Procedencia temporal desconocida');
  assert.deepEqual(data.encoding, {codec: 'mp3', channels: 1, bitrate: 48000}, 'Codificacion de procedencia incompatible');
  return {
    sourceSignature: data.sourceSignature, wavSha256: data.wavSha256,
    canonicalSha256: data.canonicalSha256, mp3Sha256: data.mp3Sha256,
    mp3Bytes: data.mp3Bytes, sourceDuration: data.sourceDuration,
    timing: data.timing, encoding: {codec: 'mp3', channels: 1, bitrate: 48000}
  };
}

export async function prepareAudio(audioRoot, destination = join(projectRoot, 'static/audio')) {
  const lectures = await canonicalLectures(destination);
  const manifest = {version: 1, lessons: {}};
  const provenance = {version: 1, exporter: 'data-src/inferencia-estadistica/export-lecturas.mjs', lessons: {}};
  const report = {version: 1, published: [], retained: [], skipped: []};
  const previous = existsSync(join(destination, 'manifest.json')) ? json(destination, 'manifest.json') : {lessons: {}};
  const previousProvenance = existsSync(join(destination, 'provenance.json')) ? json(destination, 'provenance.json') : {lessons: {}};
  let course;
  let frozen;
  try {
    course = json(audioRoot, 'curso.json');
    frozen = json(audioRoot, 'fuente/lecturas.json');
    const progress = json(audioRoot, 'progreso.json');
    report.progress = {
      status: typeof progress.status === 'string' && /^[a-z-]+$/.test(progress.status) ? progress.status : 'unknown',
      completedLessons: Number.isInteger(progress.completed_lessons) ? progress.completed_lessons : null
    };
  } catch {
    report.source = 'Fuente ausente o manifiestos JSON incompletos';
  }
  for (const canonical of lectures) {
    assert.ok(lessonId(canonical.id), 'ID de leccion inseguro');
    const contentHash = hash(JSON.stringify(canonicalContent(canonical)));
    const old = previous.lessons?.[canonical.id];
    const oldProvenance = previousProvenance.lessons?.[canonical.id];
    if (old && oldProvenance) {
      try {
        assert.equal(old.src, `audio/${canonical.id}.mp3`);
        assert.equal(oldProvenance.canonicalSha256, contentHash);
        const origin = publicProvenance(oldProvenance);
        const bytes = readFileSync(inside(destination, `${canonical.id}.mp3`));
        assert.ok(bytes.length > 0 && bytes.length < MAX_AUDIO_BYTES);
        assert.equal(bytes.length, origin.mp3Bytes);
        assert.equal(hash(bytes), origin.mp3Sha256);
        const scenes = validateTimeline(old.scenes, canonical, origin.sourceDuration);
        assert.ok(Number.isFinite(old.duration) && Math.abs(old.duration - origin.sourceDuration) < 0.15);
        manifest.lessons[canonical.id] = {src: old.src, duration: old.duration, cueTiming:origin.timing, scenes};
        provenance.lessons[canonical.id] = origin;
        report.retained.push(canonical.id);
        continue;
      } catch {}
    }
    const snapshot = course?.lessons?.find(lesson => lesson.id === canonical.id);
    const exported = frozen?.find(lesson => lesson.id === canonical.id);
    let reason = 'Sin agregado de leccion completo';
    try {
      assert.ok(snapshot && exported, 'Fuente ausente del snapshot');
      const metadata = json(audioRoot, `${snapshot.directory}/audio.json`);
      const scenes = validateLesson(metadata, snapshot, exported, canonical, {allowEstimatedCues:true});
      const timing = metadata.scenes.every(scene => !scene.cues) ? 'scene-measured-cues-estimated' : 'measured';
      const source = validateSourceFiles(audioRoot, snapshot, metadata);
      const target = outputFile(destination, `${canonical.id}.mp3`);
      const duration = encodeMp3(source, target, metadata.duration_seconds);
      assert.equal(hash(readFileSync(source)), metadata.sha256, 'La fuente cambio durante la conversion');
      manifest.lessons[canonical.id] = {src: `audio/${canonical.id}.mp3`, duration, cueTiming:timing, scenes};
      provenance.lessons[canonical.id] = publicProvenance({
        sourceSignature: metadata.signature, wavSha256: metadata.sha256,
        canonicalSha256: contentHash, mp3Sha256: hash(readFileSync(target)),
        mp3Bytes: statSync(target).size, sourceDuration: metadata.duration_seconds,
        timing, encoding: {codec: 'mp3', channels: 1, bitrate: 48000}
      });
      report.published.push(canonical.id);
      continue;
    } catch (error) {
      if (error.code !== 'ENOENT') reason = error.message.split('\n')[0];
      if (reason.includes(audioRoot) || /(?:\/home\/|\/mnt\/|[A-Za-z]:\\)/.test(reason)) reason = 'Fuente o conversion no verificable';
    }
    report.skipped.push({id: canonical.id, reason});
  }
  if (Object.keys(previous.lessons || {}).some(id => id.includes('--')) || Object.keys(previousProvenance.lessons || {}).some(id => id.includes('--'))) {
    const {canonicalSections, retainedSection} = await import('./tts/prepare-sections.mjs');
    for (const canonical of await canonicalSections(destination)) {
      const old = previous.lessons?.[canonical.id];
      const oldOrigin = previousProvenance.lessons?.[canonical.id];
      if (!Object.hasOwn(previous.lessons || {}, canonical.id) && !Object.hasOwn(previousProvenance.lessons || {}, canonical.id)) continue;
      try {
        assert.equal(previous.version, 1, 'Unknown public manifest version');
        assert.equal(previousProvenance.version, 1, 'Unknown provenance version');
        assert.equal(previousProvenance.sectionExporter, 'scripts/tts/export-narration.mjs', 'Unknown section exporter');
        const {entry, origin} = retainedSection(destination, canonical, old, oldOrigin);
        manifest.lessons[canonical.id] = entry;
        provenance.lessons[canonical.id] = origin;
        provenance.sectionExporter = previousProvenance.sectionExporter;
        report.retained.push(canonical.id);
      } catch (error) {
        rmSync(outputFile(destination, `${canonical.id}.mp3`), {force: true});
        const reason = error.code === 'ERR_ASSERTION' ? error.message.split('\n')[0] : 'Published section audio is unavailable or invalid';
        report.skipped.push({id: canonical.id, reason});
      }
    }
  }
  writeJson(destination, 'manifest.json', manifest);
  writeJson(destination, 'provenance.json', provenance);
  writeJson(destination, 'prepare-report.json', report);
  return {manifest, report};
}

async function main() {
  const usage = 'Uso: node scripts/prepare-media.mjs [--pdf-root DIRECTORIO] [--audio-root DIRECTORIO]';
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === '--help') {
    console.log(`${usage}\nEntradas solo para preparacion offline, nunca para build.\nAudio: audio.json debe incluir cue_timing="measured" y scenes[].cues canonicas con tiempos globales medidos. No se estiman tiempos ni se publican fragmentos.`);
    return;
  }
  const options = {};
  assert.ok(args.length && args.length % 2 === 0, usage);
  for (let index = 0; index < args.length; index += 2) {
    const key = args[index];
    assert.ok(['--pdf-root', '--audio-root'].includes(key) && args[index + 1] && !options[key], usage);
    options[key] = resolve(args[index + 1]);
  }
  const result = {};
  if (options['--pdf-root']) result.documents = prepareDocuments(options['--pdf-root']).documents;
  if (options['--audio-root']) result.audio = (await prepareAudio(options['--audio-root'])).report;
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}