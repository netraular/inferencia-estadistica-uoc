# Inferencia estadistica

Independent Spanish statistics classroom, published at
https://webs.raular.com/inferencia/ from the `main` branch.
It is not an official UOC website.

## Content and activities

- 36 lessons: an optional mathematics bridge and the four supplied topics.
- Prerendered theory, heading links, a table of contents and local full-text search.
- 17 visual laboratories, 29 seeded exercise generators and 36 animated classes.
- Concept checks, hints, worked solutions, subtitles, transcripts and downloads.
- Each lesson starts with tabs for theory, concept checks, laboratory, exercises
  and animated reading. The selected activity is linkable with `?actividad=...`;
  only the selected activity is mounted, with no duplicate internal navigation.
- Browser-local progress with compatible JSON import/export. The public origin
  remains `webs.raular.com`, preserving progress from the former classroom.

The original explanations, formulas, source references and exercise engines live
under `pages/inferencia/`. `scripts/generate-docs.mjs` produces the MDX lessons
from that single content source; do not edit the ignored `docs/` output.
Update `pages/inferencia/course.js` to edit the curriculum. Animation and theory
continue to share the same content instead of drifting into separate copies.

React embeds the existing classroom engine in an isolated Shadow DOM. Its
navigation and CSS cannot overwrite Docusaurus routes, headings or styles.
The old HTML is a tested, nonpublished activity-shell fixture, not a second site.

Teaching PDFs, current assessments, credentials and local TTS output are not
included. The examples are fictitious, not experimental evidence or medical advice.

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

After changing legacy activity modules, refresh the fixture's asset fingerprints:

```sh
node data-src/inferencia-estadistica/version-assets.mjs
```

The legacy source/test documentation remains under
`data-src/inferencia-estadistica/`; its former hosting instructions are historical.
`node data-src/inferencia-estadistica/export-lecturas.mjs` still exports narration
and WebVTT into the ignored `_work/lecturas/` directory.

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