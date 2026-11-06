# Inferencia estadistica

Independent Spanish statistics classroom, published at
https://webs.raular.com/inferencia/ from the `main` branch.

## Content and activities

- 36 lessons: an optional mathematics bridge and the four supplied topics.
- Prerendered theory, heading links, a table of contents and local full-text search.
- 17 visual laboratories, 36 seeded exercise generators and 36 animated classes.
- Concept checks, hints, worked solutions, subtitles, transcripts and downloads.
- Each lesson starts with four tabs: lesson, laboratory, exercises and animated
  reading. Concept checks and the studied mark sit at the end of the lesson.
  Symbols and downloadable materials are global navigation items.
  The selected activity is linkable with `?actividad=...`;
  only the selected activity is mounted, with no duplicate internal navigation.
- The short `/inferencia/` URL opens personal progress and a brief course overview;
  `/temario/` holds the reference map, with topics 0 to 4 and numbered lessons.
- Browser-local progress is shared between lesson marks, concept checks and
  exercise results. Views refresh after saves and changes from another tab.
  There are no import, export or reset controls. No account or cross-device
  synchronization is provided. Existing progress stays compatible on the same
  `webs.raular.com` origin. The former `/progreso/` route redirects home.

The original explanations, formulas, source references and exercise engines live
under `pages/inferencia/`. `scripts/generate-docs.mjs` produces the MDX lessons
from that single content source; do not edit the ignored `docs/` output.
Update `pages/inferencia/course.js` to edit the curriculum. The conversational
lecture walkthroughs live in `pages/inferencia/lecture-story.js`; they explain
the same concepts with spoken examples rather than reading the web text aloud.
Worked practice in both formats uses the shared exercise generators.

## Reading Without A Mathematics Background

Every lesson begins with a concrete question and two short explanatory sections
using biology examples before presenting the formulas. Each formula has a verbal
reading; the shared vocabulary in `pages/inferencia/teaching.js` explains the
symbols, their meaning and an example both locally and in the searchable glossary.
The original formal material remains available in a separate depth disclosure.

Guided practice selects only questions appropriate to the lesson. The complete
exercise bank keeps the full generators. Seven additional generators cover
proportions, normalization, function values, plane regions, event independence,
discrete cumulative tables and basic joint tables. The bridge laboratories offer
matching elementary controls instead of starting every lesson with integration.
Gamma consistently uses k for shape and alpha for scale, with rate = 1/scale.

React embeds the existing classroom engine in an isolated Shadow DOM. Its
navigation and CSS cannot overwrite Docusaurus routes, headings or styles.
The old HTML is a tested, nonpublished activity-shell fixture, not a second site.

The eight supplied PDFs are published under `static/materiales/`, including the
assessment statement. These downloads are public on the existing public site.
Credentials, model weights and raw local TTS output are not included. The examples
are fictitious, not experimental evidence or medical advice.

## Development and verification

Requires Node.js 20+ (CI and container builds use Node.js 24).

```sh
npm ci --ignore-scripts
npm run build
npm test
npm start
```

Build generates the MDX, activity styles, font files and search index. Tests cover
the existing numerical engines, all lesson views, the player, seeded exercises,
progress, complete MDX content and the scoped interactive integration.
DOM tests are not browser layout verification.

`npm test` generates the ignored lesson pages, activity shell and static resources
before running the suites, so it also works immediately after installing the
dependencies in a clean checkout. A prior production build is not required.

After changing legacy activity modules, refresh the fixture's asset fingerprints:

```sh
node data-src/inferencia-estadistica/version-assets.mjs
```

The legacy source/test documentation remains under
`data-src/inferencia-estadistica/`; its former hosting instructions are historical.
`node data-src/inferencia-estadistica/export-lecturas.mjs` still exports narration
and WebVTT into the ignored `_work/lecturas/` directory.

## Offline lesson audio

The optional [Ming audio tools](scripts/tts/README.md) prepare Spanish narration,
generate and resume scene checkpoints, and assemble one WAV per lesson with
measured scene subtitles. The source defaults to this repository; external Ming
code, model paths and output directories are configurable.

For local commands and regenerating audio after changing lesson texts, see the
[Spanish TTS guide](TTS.md). A resumed batch reads its saved course snapshot;
use a new output directory to narrate a new revision without mixing old scripts.

Python preparation and tests run without PyTorch or a GPU. Synthesis requires
an external CUDA/Ming installation. Weights, environments and generated audio
stay outside Git; neither the site build nor its runtime needs Python or CUDA.
The existing local audio-generation service is not migrated or restarted.

## Published materials and audio

Prepared MP3 files and their timing manifest live under `static/audio/`. Only
complete lesson aggregates whose frozen scripts match the current course are
included. The player uses audio time for playback, seeking and speed changes;
lessons without audio use the estimated clock without autoplay. The visual
whiteboard, progressive calculations and full scene captions share one player.
Fullscreen uses the native browser API with an expanded fallback for mobile.

Refresh the published assets after more lessons finish:

```sh
node scripts/prepare-media.mjs --pdf-root '/path/to/documents' --audio-root '/path/to/outputs/inferencia-estadistica'
```

The preparer verifies source signatures and complete WAVs, then encodes mono
48 kbps MP3 using ffmpeg/ffprobe with one CPU thread. Those tools and local source
directories are not required by the site build. Already validated assets can be
retained when the source directories are unavailable. Scene boundaries come
from measured audio; where phrase alignment is unavailable, cue highlighting is
proportional within each scene and explicitly marked as approximate. It is not
word-level forced alignment. The downloaded VTT uses the player's timeline.

The accessibility revision changes the canonical scripts. Previous MP3 files
remain on disk but are excluded from the playback manifest until compatible audio
is regenerated. This does not restart or modify the external TTS service.

## Topic 0 Animated Whiteboard

The five mathematical bridge lessons use a client-only Konva canvas with a paused
GSAP timeline driven by the existing player's audio clock. Other lessons retain
their current renderer and do not load these dependencies. Captions, speed controls
and fullscreen behavior are preserved; narration follows the conversational
storyboards and the questions appropriate to each lesson.

Scenes use explicit quantities, equations and plot data for seed proportions,
normalization, function values, areas and resource regions; examples are not
inferred from words in the narration. Worked exercises display their actual
generated inputs and equations.
MathJax turns formulas into vector paths within the same canvas, without image
downloads or HTML formula overlays. Narrow boards use a square composition;
fullscreen fits the scene into the available drawing space.

`tests/whiteboard.test.mjs` renders every scene with a CPU canvas at desktop and
mobile sizes, checks text bounds, exact areas, reversible seeking, reduced motion
and resource cleanup. This is not a browser or physical-device visual check.

## Deployment

`Dockerfile` builds and tests the site, then copies only static output into an
unprivileged nginx image. Node.js, npm and the build dependencies do not run in
production. Upstream dependency-audit advisories affecting Docusaurus build tools
must be reviewed separately; a static runtime does not make the builder immune.

The `proxmox-k8s` repository owns deployment, registry credentials, the public
Traefik path and the BuildKit/Flux automation. No cluster credentials belong in
this repository. `main` changes build immutable images; Flux updates their tag.
The old `/pages/inferencia-estadistica.html` URL redirects to `/inferencia/`;
legacy lesson fragments are mapped client-side to their new lesson URL.

The site shares only the existing hostname/TLS and `simple-webs` Kubernetes
namespace. It has a separate repository, image, Deployment, Service, route and
NetworkPolicy; content delivery no longer depends on the simple-webs checkout.

Vendored libraries and fonts retain their licenses under
`pages/inferencia/vendor/`. KaTeX for the new site is provided by its pinned npm
dependency; the historical vendored version remains only in legacy engine tests.