# Flutonomy

A calm practice studio for the bansuri (Indian bamboo flute), built with **Astro + MDX**.
Every sound — tanpura, tabla, metronome, swara tones — is synthesised live with the Web Audio API,
so the app works offline and in any key.

## Run it

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # static site in dist/
npm run check    # type-check .astro / .ts files
```

## Deploying to GitHub Pages

`.github/workflows/deploy.yml` builds and deploys on every push to `main`.

1. In the repo on GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions** (one time).
2. Push to `main`. The site appears at `https://pratikktiwari.github.io/flutonomy/`.

The workflow passes `SITE` and `BASE_PATH` to the build, so every internal link goes through
`url()` from `src/lib/url.ts`. Use it for any new internal link, e.g. `href={url('/tools/taal')}`.
With a custom domain the base path becomes `/` automatically.

## What's inside

| Tool | Path | Notes |
| --- | --- | --- |
| Tanpura | `/tools/tanpura` | Additive synthesis with a sweeping "jawari" formant; Pa / Ma / Ni / Dha first string |
| Taal | `/tools/taal` | Teentaal, Keherwa, Dadra, Rupak, Jhaptaal, Ektaal; taal-chakra + theka grid; tabla tuned to Sa; claps-only mode |
| Sur Darpan (tuner) | `/tools/tuner` | YIN pitch detection, cents meter, scrolling pitch trace on a swara grid, steady-hold timer |
| Swara Explorer | `/tools/swaras` | Mandra Pa → taar Sa keyboard with bansuri fingerings (keyboard: `a w s e d f t g y h u j k`) |
| Alankar Trainer | `/tools/alankar` | Pattern generator for any scale, echo (call-and-response) mode |
| Metronome | `/tools/metronome` | Pendulum, accents, subdivisions, tap tempo |
| Practice room | `/practice` | Tanpura + tuner + taal together, plus a riyaz timer with 14-day chart and streak |

The **Sa** picker in the header is global: changing it retunes every tool (stored in `localStorage`).

## Project layout

```
src/
  styles/tokens.css        ← all design tokens (colour, type, spacing, radius, motion); light + dark
  styles/global.css        ← reset, layout primitives, shared .btn/.field/.segmented/.chip, prose
  components/ui/           ← ToolCard, PlayButton, RangeField, Segmented, SaPicker, Callout, Icon…
  components/tools/        ← the interactive tools (Astro markup + vanilla TS <script>)
  components/music/        ← MDX helpers: <Sargam>, <RaagCard>, <Fingering>
  components/site/         ← Header, Footer, LessonList
  lib/audio/engine.ts      ← shared AudioContext, buses, look-ahead Scheduler
  lib/audio/voices.ts      ← click, flute tone, tabla strokes, tanpura synthesis
  lib/                     ← swara/sargam parsing, taal data, fingerings, pitch detection, settings
  content/lessons/*.mdx    ← lessons (content collection, schema in src/content.config.ts)
```

## Writing lessons

Lessons are MDX files in `src/content/lessons/`. Import any tool or music component and drop it in:

```mdx
import Sargam from '../../components/music/Sargam.astro';
import TaalPlayer from '../../components/tools/TaalPlayer.astro';

<Sargam label="Aaroh" notes="S R G m P D N S'" bpm={70} />
<TaalPlayer taal="keherwa" only={['keherwa']} embedded />
```

**Sargam notation:** `S r R g G m M P d D n N` — lowercase = komal, `M` = tivra Ma,
`.N` = lower octave, `S'` = upper octave, `-` = hold, `,` = rest.

## Theming

Only `src/styles/tokens.css` holds raw values. Components reference semantic tokens
(`--color-accent`, `--color-sam`, `--color-khali`, `--space-*`, `--radius-*`…), and the light theme
is a token override on `:root[data-theme='light']`.
