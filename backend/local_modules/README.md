# Local ESLint helpers

These modules provide minimal fallbacks for `@typescript-eslint/eslint-plugin` and
`@typescript-eslint/parser` so that linting can run in environments without access
to the public npm registry. The implementations transpile TypeScript sources to
JavaScript before delegating to Espree and reuse ESLint's built-in `no-unused-vars`
rule to emulate the corresponding TypeScript rule. The packages are exposed via
`file:` dependencies in `package.json`, so a regular `npm install` will wire them
up without fetching anything from the network.
