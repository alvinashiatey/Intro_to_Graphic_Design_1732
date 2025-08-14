# Intro to Graphic Design – build notes

This project uses Handlebars with Vite. The schedule on the left is generated from JSON at build time.

- Data: `src/data/schedule.json`
- Template: `src/partials/schedule.hbs`
- Wiring: `vite.config.ts` provides the `schedule` array to Handlebars context.

Schedule JSON format:

```json
[
  { "week": 1, "sessions": [ { "date": "Wednesday ...", "items": ["...", "..."] } ] },
  { "break": "October Recess" },
  { "week": 2, "sessions": [...] }
]
```

How to run locally:

```sh
pnpm install
pnpm dev
```

Or with npm:

```sh
npm install
npm run dev
```
