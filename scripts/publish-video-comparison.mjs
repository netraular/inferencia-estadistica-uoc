import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {copyFile, readdir, readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const root = new URL('../',import.meta.url);
const ids = ['actual','manim','remotion','canvas-commons'];
const results = JSON.parse(await readFile(new URL('static/comparativa-videos/shared/results.json',root)));
const ignored = new Set(['node_modules','.cache','dist','work','public','build','__pycache__']);
async function sourceFiles(directory, prefix='') {
  const files = [];
  for (const entry of await readdir(directory,{withFileTypes:true})) {
    if (ignored.has(entry.name)) continue;
    const relative = `${prefix}${entry.name}`;
    if (entry.isDirectory()) files.push(...await sourceFiles(new URL(`${entry.name}/`,directory),`${relative}/`));
    else if (entry.isFile()) files.push(relative);
  }
  return files.sort();
}
for (const id of ids) {
  assert(results.find(item=>item.id===id)?.checked,`Unverified video: ${id}`);
  const source = new URL(`data-src/video-comparison/${id}/`,root);
  const media = new URL(`static/comparativa-videos/${id}/`,root);
  if (id === 'canvas-commons') {
    try {
      await copyFile(new URL('work/render-checks.json',source),new URL('RENDER-CHECKS.json',source));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      assert(JSON.parse(await readFile(new URL('RENDER-CHECKS.json',source))).result === 0);
    }
  }
  const files = await sourceFiles(source);
  assert(files.includes('REPORT.md'));
  await copyFile(new URL('REPORT.md',source),new URL(`static/comparativa-videos/shared/${id}-report.md`,root));
  execFileSync('tar',['-czf',fileURLToPath(new URL('source.tar.gz',media)),'-C',fileURLToPath(source),...files],{stdio:'pipe'});
  console.log(`Published ${id}: ${files.length} source files, report, player and verified MP4.`);
}