# Contributing

Use Node.js >=22.13.0. Run `npm ci`, then `npm run dev` for the demo.

Before proposing a change, run `npm run check`, `npx playwright install chromium`, `npm run test:e2e` and `npm pack --dry-run`. Keep coordinate and image export behavior covered by tests. Avoid introducing backend, authentication, telemetry or application-specific dependencies into the reusable component.

Use original or redistributable fixtures. Do not commit personal images, credentials, node_modules, generated test results or private data. All contributions are provided under this repository's MIT license.

Please describe the issue, expected behavior and relevant validation when submitting a pull request.
