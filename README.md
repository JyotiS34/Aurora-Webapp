# Aurora Sentiment

A portfolio webapp showcasing an entity-aware BERT sentiment classifier — live demo, training deep-dive, and distributed pipeline visualisation.

## Pages

| Route | Content |
|---|---|
| `/` | Overview: model stats, hero aurora chart, three entry cards |
| `/demo` | Live inference — enter any entity + text, see confidence scores |
| `/training` | Two-phase fine-tuning walkthrough, dataset breakdown, iteration history |
| `/pipeline` | DDP architecture diagram, GPU utilisation charts, failure mode debugger |

## Quick start

```bash
npm install
cp .env.example .env          # edit VITE_SENTIMENT_API_URL
npm run dev
```

## Environment variables

| Variable | Description |
|---|---|
| `VITE_SENTIMENT_API_URL` | Base URL of your deployed sentiment API (no trailing slash) |

The API adapter is in `src/lib/api.js`. Edit `buildBody()` and `parseResponse()` there if your endpoint uses different field names.

**Expected contract:**
```
POST /predict
Body:     { "text": "...", "entity": "..." }
Response: { "label": "Positive", "scores": { "Positive": 0.82, "Negative": 0.05, "Neutral": 0.08, "Irrelevant": 0.05 }, "latency_ms": 120 }

GET /health  →  200 OK
```

## Deploy to Vercel

```bash
npm run build
vercel deploy         
```

Add `VITE_SENTIMENT_API_URL` in the Vercel project's Environment Variables settings.

`vercel.json` already contains the SPA rewrite rule so all routes resolve correctly.

## Project structure

```
src/
  lib/
    api.js          ← API adapter (edit for your endpoint)
    sampleData.js   ← Synthetic training curves + GPU series
  components/
    AuroraField.jsx ← Canvas aurora ribbon visualiser
    Nav.jsx
    StatusPill.jsx  ← Live API health indicator
    ConfidenceBars.jsx
    TokenPreview.jsx
    ArchDiagram.jsx ← SVG DDP architecture diagram
    FailureModes.jsx← Interactive failure mode tabs
  pages/
    Home.jsx
    Demo.jsx
    Training.jsx
    Pipeline.jsx
  global.css        ← Full design system (tokens, components, layout)
```
