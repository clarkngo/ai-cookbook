# 🧑‍🍳 AI Cookbook

A modular repository of **human-in-the-loop recipes** for augmenting development, research, and ideation with LLMs. Unlike autonomous agents, every recipe here is a repeatable, human-guided workflow — a prompt chain, a scaffolding pipeline, a vibe-coding playbook, or a structured-output template — that you drive step by step.

This repo is a static site: **plain HTML, Tailwind CSS (via CDN), and vanilla JavaScript**. No build step, no framework, no backend. It's ready to deploy on GitHub Pages as-is.

**[View the live site →](https://clarkngo.github.io/ai-cookbook/)** (live once Pages is enabled — see Deploying below)

## Features

- 🌗 Dark / light mode (persisted in `localStorage`, respects OS preference)
- 🔍 Real-time client-side search across titles, problems, and tags
- 🏷️ Category and tag filtering
- 📋 One-click copy buttons for prompt templates and example output
- 🧪 **Interactive variable injector** — fill in a recipe's `{{VARIABLES}}` and get a live-updating, copy-ready prompt
- 📱 Fully responsive

## Project structure

```
ai-cookbook/
├── index.html                  # Recipe hub: search, filters, grid
├── recipe.html                 # Recipe detail template (reads ?id=<slug>)
├── assets/
│   ├── css/styles.css          # Small custom layer on top of Tailwind CDN
│   └── js/
│       ├── theme.js            # Dark/light toggle
│       ├── data.js             # Fetches JSON from /data
│       ├── app.js              # Index page: search/filter/render
│       └── recipe.js           # Detail page: render + variable injector
├── data/
│   ├── categories.json         # The 5 cookbook categories
│   └── recipes/
│       ├── index.json          # List of recipe ids to load
│       └── <recipe-id>.json    # One file per recipe (see schema below)
└── .github/workflows/deploy.yml
```

## Running locally

Because the site loads recipe data via `fetch()`, it needs to be served over HTTP (not opened as a `file://` URL). Any static file server works:

```bash
npx serve .
# or
python3 -m http.server 8000
```

Then open the printed URL in your browser.

## Deploying to GitHub Pages

1. Push this repo to GitHub.
2. In **Settings → Pages**, set **Source** to **GitHub Actions**.
3. Push to `main` — [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builds nothing and just uploads the repo as the Pages artifact, then deploys it. No secrets or config needed.

## Adding a new recipe

Recipes are plain JSON files — no build step, no code changes required.

1. **Create the file** at `data/recipes/<your-recipe-id>.json` (kebab-case id, matches the filename) using this schema:

   ```json
   {
     "id": "your-recipe-id",
     "title": "Human-Readable Recipe Title",
     "category": "research-synthesis",
     "difficulty": "Beginner | Intermediate | Advanced",
     "targetLLMs": ["Claude", "Gemini", "OpenAI", "Ollama"],
     "estTime": "20–40 min",
     "tags": ["tag-one", "tag-two"],
     "problem": "What problem this recipe solves, in a sentence or two.",
     "workflow": [
       { "step": "1. Do the first thing", "detail": "Why/how, in a sentence." }
     ],
     "promptTemplate": "A prompt with {{VARIABLE_NAME}} placeholders.",
     "variables": [
       { "name": "VARIABLE_NAME", "label": "Shown label", "placeholder": "Example value", "default": "" }
     ],
     "exampleOutput": "A short snippet showing the expected result.",
     "tips": ["Edge cases, model-specific notes, or variations."]
   }
   ```

   - `category` must match one of the `id` values in [`data/categories.json`](data/categories.json). Add a new category there first if needed.
   - Every `{{NAME}}` used in `promptTemplate` should have a matching entry in `variables` (matched by `name`) so the variable-injector form on the recipe page can render an input for it.

2. **Register it** by adding the id (filename without `.json`) to [`data/recipes/index.json`](data/recipes/index.json).

3. Reload the site (or redeploy) — the new recipe appears automatically in search, filters, and the grid.

### Adding a new category

Add an entry to `data/categories.json`:

```json
{ "id": "your-category-id", "name": "Your Category", "icon": "✨", "color": "sky", "description": "One-line description." }
```

`color` should be one of: `sky`, `violet`, `amber`, `emerald`, `rose` (or extend the color maps in `assets/js/app.js` and `assets/js/recipe.js` if you need another).

## Recipe categories

| Category | Focus |
|---|---|
| 🔬 Research & Synthesis | Deep-dive literature review, paper summarization, competitive analysis |
| ⚡ Vibe Coding & Scaffolding | Zero-to-one MVP generation, component specs, UI prototyping |
| 🛠️ Refactoring & Code Review | Intent-driven testing, architecture evaluation, legacy migration |
| 🎓 Content & Course Design | Question-first learning scaffolds, slide decks, reading guides |
| 🧩 Meta-Prompting & System Setup | System prompt design, evaluation matrices, JSON extraction schemas |
| 🌱 AI Fundamentals & Everyday Use | Prompting basics, everyday writing and decision helpers, safe-use habits |

## License

Dual-licensed:

- **Code** (`index.html`, `recipe.html`, `assets/css/styles.css`, `assets/js/*.js`, `.github/workflows/deploy.yml`, and the HTML/CSS markup structure) — [MIT](LICENSE).
- **Recipe content** (`data/categories.json` and `data/recipes/*.json`) — [CC BY 4.0](LICENSE-CONTENT). Use, adapt, and redistribute freely, with attribution.
