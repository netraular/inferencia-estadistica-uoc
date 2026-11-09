import {
  bootstrap, makeProject, MetaFile, Renderer, ValueDispatcher, Vector2,
  ObjectMetaField, RendererResult,
  type Exporter, type FullSceneDescription, type RendererSettings,
} from '@canvas-commons/core';
import scene, {renderChecks} from './scene';

declare global {
  interface Window {
    captureFrame: (frame: number, png: string) => Promise<void>;
    renderClip: (probe: boolean) => Promise<{result: number; count: number; logs: unknown[]; checks: typeof renderChecks}>;
  }
}

const description = {...scene, name: 'probability'} as FullSceneDescription;
description.onReplaced = new ValueDispatcher(description);

class CaptureExporter implements Exporter {
  static readonly id = 'comparison-capture';
  static readonly displayName = 'Serial PNG capture';
  static async create() { return new CaptureExporter(); }
  static meta() { return new ObjectMetaField('capture', {}); }
  async handleFrame(canvas: HTMLCanvasElement, frame: number) {
    if (frame >= limit) return;
    await window.captureFrame(frame, canvas.toDataURL('image/png'));
    count++;
  }
}

let count = 0;
let limit = 30;
const project = bootstrap('probability-area',
  {core: '0.4.0', two: '0.4.0', ui: null, vitePlugin: null},
  [{name: 'serial-capture', exporters: () => [CaptureExporter]}],
  makeProject({scenes: [description]}), new MetaFile('project'), new MetaFile('settings'));
project.logger.onLogged.subscribe(payload => console.log('Canvas Commons:', JSON.stringify(payload)));

window.renderClip = async (probe) => {
  await document.fonts.load('400 32px Plex');
  await document.fonts.load('600 32px Plex');
  await document.fonts.ready;
  limit = probe ? 30 : 1185;
  count = 0;
  const renderer = new Renderer(project);
  let result: RendererResult = RendererResult.Error;
  renderer.onFinished.subscribe(value => { result = value; });
  const settings: RendererSettings = {
    name: 'probability-area', range: [0, limit / 30], fps: 30,
    size: new Vector2(1280, 720), resolutionScale: 1, colorSpace: 'srgb',
    background: '#f6f8fb', exporter: {name: CaptureExporter.id, options: {}},
  };
  await renderer.render(settings);
  return {result, count, logs: project.logger.history, checks: renderChecks};
};