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

## PWA Functionality

This site is configured as a Progressive Web App (PWA), allowing students to:

- Receive notifications when the site is updated
- Install the site as an app on their devices
- Access content offline

### PWA Commands

```sh
# Generate icons from SVG
npm run generate-icons

# Update version to trigger notification
npm run update-version

# Complete PWA build (icons + version + build)
npm run pwa-build
```

### Updating the Site

When you make changes to the course content:

1. Edit the content files
2. Run `npm run update-version` to increment the version number
3. Build and deploy the site
4. Students will see a notification about the update

The notification system uses a version check to detect updates and shows a toast message when new content is available.
