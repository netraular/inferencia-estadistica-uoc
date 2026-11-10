# Course videos

Remotion is the production renderer for narrated course videos. The first
published video is topic 0, Proporciones, section `parte-y-total`.
It uses the original measured narration: 45.4 seconds, 14 cues, 1362 frames
at 30 fps and 1280 x 720. Captions are burned into the video, including in
fullscreen. The lesson also includes a collapsible transcript.

From the repository root:

```sh
npm ci --prefix data-src/course-videos
npm run video:render
npm run video:verify
```

`storyboard.mjs` derives named animation events from the measured audio manifest
instead of duplicating cue timings. `Proportions.jsx` renders the two observed
seed trays, reveals their own denominators, and compares 18/72 = 0.25 against
30/200 = 0.15 without assuming independent seeds.

The renderer checks 16 exported frames for text overflow and viewport bounds,
then exports H.264 with AAC narration. FFprobe verifies dimensions, duration
and all 1362 frames; FFmpeg decodes the complete output. It records source
audio and output hashes in `static/videos/manifest.json`. Intermediates and
validation evidence remain under ignored `.cache/`.

The video component uses the manifest's section animation ID. Sections not
yet rendered retain their existing animation. A media loading failure also
falls back to that animation. Comparison projects and public comparison
routes have been removed; no other course sections have been migrated yet.

Chromium is used only by the media renderer. The export closes its browser;
no website preview server or browser playback check is started. Exported
frames and technical media checks do not constitute a full listening audit.